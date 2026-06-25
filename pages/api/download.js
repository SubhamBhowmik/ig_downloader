import { exec, spawn } from 'child_process'
import { promisify } from 'util'
import { createReadStream, unlinkSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import https from 'https'
import http from 'http'

const execAsync = promisify(exec)

// Path to yt-dlp (installed via pip, not on PATH by default)
const YT_DLP = 'C:\\Users\\czsub\\AppData\\Roaming\\Python\\Python314\\Scripts\\yt-dlp.exe'
// Path to ffmpeg (installed via winget, not on PATH by default)
const FFMPEG = 'C:\\Users\\czsub\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-8.1.1-full_build\\bin\\ffmpeg.exe'

// In-memory cache for video metadata
const cache = new Map()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

// Temp download directory
const TMP_DIR = join(tmpdir(), 'ig-downloads')
if (!existsSync(TMP_DIR)) mkdirSync(TMP_DIR, { recursive: true })

// Clean up temp files after 5 minutes
setInterval(() => {
  const now = Date.now()
  try {
    const files = require('fs').readdirSync(TMP_DIR)
    files.forEach(f => {
      const fp = join(TMP_DIR, f)
      const stat = require('fs').statSync(fp)
      if (now - stat.mtimeMs > 5 * 60 * 1000) {
        unlinkSync(fp)
      }
    })
  } catch (e) { /* ignore */ }
}, 60 * 1000)

// Proxy: fetch a remote image and pipe it to the response
function proxyImage(imageUrl, res) {
  const protocol = imageUrl.startsWith('https') ? https : http

  // Set a referer to help bypass Instagram's hotlink protection
  const options = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Referer': 'https://www.instagram.com/',
    },
  }

  protocol.get(imageUrl, options, (proxyRes) => {
    // Forward content-type from Instagram
    const contentType = proxyRes.headers['content-type'] || 'image/jpeg'
    res.setHeader('Content-Type', contentType)
    res.setHeader('Cache-Control', 'public, max-age=86400')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.writeHead(proxyRes.statusCode)
    proxyRes.pipe(res)
  }).on('error', () => {
    res.status(500).json({ error: 'Failed to load thumbnail' })
  })
}

export default async function handler(req, res) {
  const { url, format: formatId, thumb, type, title } = req.query

  if (!url) {
    return res.status(400).json({ error: 'Missing ?url=' })
  }

  // ── PROXY THUMBNAIL ──
  if (thumb === '1') {
    // Check cache for thumbnail URL
    const cached = cache.get(url)
    if (cached && cached.data.thumbnail) {
      return proxyImage(cached.data.thumbnail, res)
    }

    // Fetch info to get thumbnail
    try {
      const { stdout } = await execAsync(`"${YT_DLP}" -J --no-warnings "${url}"`, {
        timeout: 15000,
        maxBuffer: 5 * 1024 * 1024,
      })
      const info = JSON.parse(stdout)
      if (info.thumbnail) {
        return proxyImage(info.thumbnail, res)
      }
    } catch (e) { /* fall through */ }

    return res.status(404).json({ error: 'No thumbnail' })
  }

  // ── DOWNLOAD VIDEO OR AUDIO ──
  if (formatId) {
    // Use explicit type from frontend: 'audio' or 'video'
    const isAudioOnly = type === 'audio'

    const tempFilename = `ig-${Date.now()}-temp.${isAudioOnly ? 'm4a' : 'mp4'}`
    const finalFilename = `ig-${Date.now()}.${isAudioOnly ? 'mp3' : 'mp4'}`
    const tempPath = join(TMP_DIR, tempFilename)
    const finalPath = join(TMP_DIR, finalFilename)

    // Use title from frontend if provided, otherwise fallback to format ID
    const safeTitle = (title || 'instagram-video').replace(/[^a-zA-Z0-9\u0600-\u06FF\s_-]/g, '').replace(/\s+/g, '-').substring(0, 40)
    const baseName = isAudioOnly ? `${safeTitle}-audio` : `${safeTitle}-video`

    try {
      // For audio-only: download the format. For video: merge with best audio.
      const formatArg = isAudioOnly ? formatId : `${formatId}+bestaudio/best`
      const mergeArg = isAudioOnly ? '' : `--merge-output-format mp4 --ffmpeg-location "${FFMPEG}" `

      await execAsync(
        `"${YT_DLP}" -f ${formatArg} ` +
        mergeArg +
        `--no-warnings ` +
        `-o "${tempPath}" ` +
        `"${url}"`,
        { timeout: 60000 }
      )

      if (!existsSync(tempPath)) {
        return res.status(500).json({ error: 'Download failed' })
      }

      // If audio-only, convert to MP3 using ffmpeg
      if (isAudioOnly) {
        await execAsync(
          `"${FFMPEG}" -i "${tempPath}" -vn -acodec libmp3lame -q:a 2 "${finalPath}" -y`,
          { timeout: 30000 }
        )
        try { unlinkSync(tempPath) } catch (e) { /* ignore */ }
      } else {
        // Just rename the video file
        try { require('fs').renameSync(tempPath, finalPath) } catch (e) { /* ignore */ }
      }

      if (!existsSync(finalPath)) {
        return res.status(500).json({ error: 'Conversion failed' })
      }

      const stat = require('fs').statSync(finalPath)
      const contentType = isAudioOnly ? 'audio/mpeg' : 'video/mp4'
      const ext = isAudioOnly ? 'mp3' : 'mp4'
      const encodedName = encodeURIComponent(`${baseName}.${ext}`)
      // Use only RFC 5987 encoding to avoid invalid character errors
      const disposition = `attachment; filename*=UTF-8''${encodedName}`
      res.writeHead(200, {
        'Content-Type': contentType,
        'Content-Disposition': disposition,
        'Content-Length': stat.size,
      })

      const stream = createReadStream(finalPath)
      stream.pipe(res)

      stream.on('end', () => {
        try { unlinkSync(finalPath) } catch (e) { /* ignore */ }
      })
      stream.on('error', () => {
        try { unlinkSync(finalPath) } catch (e) { /* ignore */ }
      })

    } catch (err) {
      console.error('download error:', err.message)
      try { if (existsSync(tempPath)) unlinkSync(tempPath) } catch (e) { /* ignore */ }
      try { if (existsSync(finalPath)) unlinkSync(finalPath) } catch (e) { /* ignore */ }
      if (!res.headersSent) {
        return res.status(500).json({ error: 'Download failed' })
      }
    }

    return
  }

  // ── GET VIDEO INFO ──
  try {
    const cached = cache.get(url)
    if (cached && Date.now() - cached.time < CACHE_TTL) {
      return res.json(cached.data)
    }

    const { stdout } = await execAsync(`"${YT_DLP}" -J --no-warnings "${url}"`, {
      timeout: 30000,
      maxBuffer: 10 * 1024 * 1024,
    })

    const info = JSON.parse(stdout)

    // Separate video and audio formats
    const allFormats = (info.formats || [])

    // Normalize resolution to standard values
    function normalizeQuality(height) {
      if (!height) return 'unknown'
      if (height >= 2160) return '4K'
      if (height >= 1440) return '1440p'
      if (height >= 1080) return '1080p'
      if (height >= 720) return '720p'
      if (height >= 480) return '480p'
      if (height >= 360) return '360p'
      return `${height}p`
    }

    const videoFormats = allFormats
      .filter(f => {
        const hasVideo = (f.video_ext && f.video_ext !== 'none') || (f.vcodec && f.vcodec !== 'none')
        return hasVideo
      })
      .map(f => ({
        quality: normalizeQuality(f.height),
        format_id: f.format_id,
        ext: f.ext || 'mp4',
        filesize: f.filesize || f.filesize_approx || null,
        has_audio: f.acodec && f.acodec !== 'none',
      }))
      // Deduplicate by quality label, keep the first found
      .filter((f, i, arr) => i === arr.findIndex(a => a.quality === f.quality))
      .sort((a, b) => (parseInt(b.quality) || 0) - (parseInt(a.quality) || 0))

    const audioFormats = allFormats
      // Format entries that have just audio (video_ext missing or 'none')
      .filter(f => {
        const hasAudio = f.acodec && f.acodec !== 'none'
        const noVideo = !f.video_ext || f.video_ext === 'none'
        return hasAudio && noVideo
      })
      .map(f => ({
        quality: f.abr ? `${f.abr}kbps` : `${f.format_note || 'audio'}`,
        format_id: f.format_id,
        ext: 'mp3',
        filesize: f.filesize || f.filesize_approx || null,
      }))
      .filter((f, i, arr) => i === arr.findIndex(a => a.quality === f.quality))
      .sort((a, b) => parseInt(b.quality) - parseInt(a.quality))

    // Try to get the actual caption/description, fallback to title
    const caption = info.description || info.title || 'Instagram Video'
    const data = {
      title: caption,
      duration: info.duration || 0,
      videos: videoFormats,
      audio: audioFormats,
    }

    cache.set(url, { data, time: Date.now() })

    return res.json(data)
  } catch (err) {
    console.error('yt-dlp error:', err.message)
    return res.status(500).json({ error: 'Failed to process video. Check the URL and try again.' })
  }
}