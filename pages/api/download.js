import { existsSync, mkdirSync, createWriteStream, createReadStream, unlinkSync, statSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { exec } from 'child_process'
import { promisify } from 'util'
import https from 'https'
import http from 'http'

const execAsync = promisify(exec)
const YT_DLP = process.env.YT_DLP_PATH || 'yt-dlp'
const FFMPEG = process.env.FFMPEG_PATH || 'ffmpeg'
const IG_SESSION_ID = process.env.IG_SESSION_ID || ''

const cache = new Map()
const CACHE_TTL = 5 * 60 * 1000
const TMP_DIR = join(tmpdir(), 'ig-downloads')
if (!existsSync(TMP_DIR)) mkdirSync(TMP_DIR, { recursive: true })

// Cleanup old temp files
setInterval(() => {
  try {
    const fs = require('fs')
    const now = Date.now()
    fs.readdirSync(TMP_DIR).forEach(f => {
      try {
        const fp = join(TMP_DIR, f)
        if (now - fs.statSync(fp).mtimeMs > 15 * 60 * 1000) unlinkSync(fp)
      } catch (e) {}
    })
  } catch (e) {}
}, 2 * 60 * 1000)

// Write session ID to a Netscape cookies file for yt-dlp
// This is the proper way — avoids the "cookies as header" security warning
const COOKIES_FILE = join(tmpdir(), 'ig-cookies.txt')
let cookiesFileReady = false

function ensureCookiesFile() {
  if (cookiesFileReady) return
  if (!IG_SESSION_ID) {
    console.log('WARNING: No IG_SESSION_ID set')
    return
  }
  try {
    const { writeFileSync } = require('fs')
    // Netscape cookies.txt format required by yt-dlp
    const cookieContent = [
      '# Netscape HTTP Cookie File',
      '# This file is generated automatically.',
      '',
      // domain  domain_flag  path  secure  expiry  name  value
      `.instagram.com\tTRUE\t/\tTRUE\t2147483647\tsessionid\t${IG_SESSION_ID}`,
      `www.instagram.com\tFALSE\t/\tTRUE\t2147483647\tsessionid\t${IG_SESSION_ID}`,
    ].join('\n')
    writeFileSync(COOKIES_FILE, cookieContent, 'utf8')
    cookiesFileReady = true
    console.log('Cookies file written to:', COOKIES_FILE)
  } catch (e) {
    console.log('Failed to write cookies file:', e.message)
  }
}

function getCookieArgs() {
  if (!IG_SESSION_ID) return ''
  ensureCookiesFile()
  if (!cookiesFileReady) return ''
  return `--cookies "${COOKIES_FILE}"`
}

function cleanInstagramUrl(rawUrl) {
  try {
    const u = new URL(rawUrl)
    const match = u.pathname.match(/^\/(reel|p|tv)\/([A-Za-z0-9_-]+)/)
    if (match) return `https://www.instagram.com/${match[1]}/${match[2]}/`
    return rawUrl
  } catch (e) { return rawUrl }
}

function proxyImage(imageUrl, res) {
  const protocol = imageUrl.startsWith('https') ? https : http
  protocol.get(imageUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Referer': 'https://www.instagram.com/',
    }
  }, (proxyRes) => {
    res.setHeader('Content-Type', proxyRes.headers['content-type'] || 'image/jpeg')
    res.setHeader('Cache-Control', 'public, max-age=86400')
    res.writeHead(proxyRes.statusCode)
    proxyRes.pipe(res)
  }).on('error', () => {
    if (!res.headersSent) res.status(500).json({ error: 'Thumbnail failed' })
  })
}

function downloadFileToDisk(fileUrl, destPath) {
  return new Promise((resolve, reject) => {
    const attempt = (attemptUrl, redirectCount) => {
      if (redirectCount > 10) return reject(new Error('Too many redirects'))
      const isHttps = attemptUrl.startsWith('https')
      const protocol = isHttps ? https : http
      const urlObj = new URL(attemptUrl)
      const req = protocol.request({
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'video/mp4,video/*;q=0.9,*/*;q=0.8',
          'Accept-Encoding': 'identity',
          'Referer': 'https://www.instagram.com/',
        },
        timeout: 120000
      }, (remoteRes) => {
        const status = remoteRes.statusCode
        const contentType = remoteRes.headers['content-type'] || ''
        console.log(`Download response: ${status}, type: ${contentType}, size: ${remoteRes.headers['content-length']}`)
        if ([301, 302, 303, 307, 308].includes(status)) {
          const location = remoteRes.headers.location
          if (!location) return reject(new Error('No redirect location'))
          remoteRes.resume()
          return attempt(location.startsWith('http') ? location : `${urlObj.protocol}//${urlObj.hostname}${location}`, redirectCount + 1)
        }
        if (status !== 200) { remoteRes.resume(); return reject(new Error(`HTTP ${status}`)) }
        const fileStream = createWriteStream(destPath)
        let bytes = 0
        remoteRes.on('data', c => { bytes += c.length })
        remoteRes.pipe(fileStream)
        fileStream.on('finish', () => {
          fileStream.close()
          console.log(`Downloaded: ${bytes} bytes`)
          resolve({ bytes, contentType })
        })
        fileStream.on('error', reject)
        remoteRes.on('error', reject)
      })
      req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')) })
      req.on('error', reject)
      req.end()
    }
    attempt(fileUrl, 0)
  })
}

export const config = { api: { responseLimit: false, bodyParser: false } }

export default async function handler(req, res) {
  const { url, format: formatId, thumb, type, title } = req.query
  if (!url) return res.status(400).json({ error: 'Missing ?url=' })

  const cleanUrl = cleanInstagramUrl(url)
  const cookieArgs = getCookieArgs()

  // ── PROXY THUMBNAIL ──
  if (thumb === '1') {
    const cached = cache.get(url)
    if (cached?.data?.thumbnail) return proxyImage(cached.data.thumbnail, res)

    try {
      const { stdout } = await execAsync(
        `"${YT_DLP}" -J --no-warnings ${cookieArgs} "${cleanUrl}"`,
        { timeout: 20000, maxBuffer: 5 * 1024 * 1024 }
      )
      const info = JSON.parse(stdout)
      if (info.thumbnail) return proxyImage(info.thumbnail, res)
    } catch (e) {
      console.log('Thumbnail fetch failed:', e.message)
    }
    return res.status(404).json({ error: 'No thumbnail' })
  }

  // ── DOWNLOAD FILE ──
  if (formatId) {
    const isAudio = type === 'audio'
    const safeTitle = (title || 'instagram-video')
      .replace(/[^a-zA-Z0-9\s_-]/g, '').replace(/\s+/g, '-').substring(0, 40) || 'instagram-video'
    const ext = isAudio ? 'mp3' : 'mp4'
    const filename = `${safeTitle}.${ext}`
    const tempPath = join(TMP_DIR, `ig-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`)

    try {
      // For audio-only: get the audio URL and download directly
      if (isAudio) {
        console.log(`Getting audio URL for: ${cleanUrl}`)
        const { stdout } = await execAsync(
          `"${YT_DLP}" -f bestaudio --get-url --no-warnings ${cookieArgs} "${cleanUrl}"`,
          { timeout: 30000 }
        )
        const lines = stdout.trim().split('\n').filter(l => l.startsWith('http'))
        const fileUrl = lines[0]
        if (!fileUrl) throw new Error('No audio URL returned by yt-dlp')
        console.log('Got audio URL:', fileUrl.substring(0, 80))

        // Download audio
        await downloadFileToDisk(fileUrl, tempPath)
        if (!existsSync(tempPath)) throw new Error('File not created')
        let audioStat = statSync(tempPath)
        console.log(`Audio file size: ${audioStat.size} bytes`)

        if (audioStat.size < 5000) {
          try { unlinkSync(tempPath) } catch (e) {}
          return res.status(500).json({ error: `Audio too small (${audioStat.size}b).` })
        }

        // Convert to MP3
        const mp3Path = tempPath.replace(/\.\w+$/, '.mp3')
        try {
          await execAsync(
            `"${FFMPEG}" -i "${tempPath}" -vn -acodec libmp3lame -q:a 2 "${mp3Path}" -y`,
            { timeout: 60000 }
          )
          try { unlinkSync(tempPath) } catch (e) {}
          if (existsSync(mp3Path)) {
            audioStat = statSync(mp3Path)
            const encodedName = encodeURIComponent(`${safeTitle}.mp3`)
            res.writeHead(200, {
              'Content-Type': 'audio/mpeg',
              'Content-Length': audioStat.size,
              'Content-Disposition': `attachment; filename="${safeTitle}.mp3"; filename*=UTF-8''${encodedName}`,
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Accept-Ranges': 'bytes',
              'Access-Control-Allow-Origin': '*',
            })
            const stream = createReadStream(mp3Path)
            stream.pipe(res)
            stream.on('end', () => { try { unlinkSync(mp3Path) } catch (e) {} })
            stream.on('error', () => { try { unlinkSync(mp3Path) } catch (e) {} })
            return
          }
        } catch (ffmpegErr) {
          console.log('ffmpeg conversion failed:', ffmpegErr.message)
        }
        // Fallback: serve raw audio
      }

      // For video: let yt-dlp download and merge video+audio directly
      // Instagram uses DASH — video and audio are separate streams.
      // yt-dlp + ffmpeg merge them into a single mp4.
      console.log(`Downloading video+audio for: ${cleanUrl}`)
      const outputTemplate = tempPath.replace(/\.\w+$/, '.%(ext)s')

      // Use yt-dlp's default format selection which handles DASH merging
      // bv*+ba/b = best video-only + best audio-only merged into one file
      // yt-dlp auto-detects ffmpeg from PATH, no need for --ffmpeg-location
      let actualPath = null
      try {
        const { stdout, stderr } = await execAsync(
          `"${YT_DLP}" -f "bv*+ba/b" --merge-output-format mp4 --no-warnings ${cookieArgs} --no-playlist -o "${outputTemplate}" "${cleanUrl}"`,
          { timeout: 300000, maxBuffer: 50 * 1024 * 1024 }
        )
        console.log('yt-dlp stdout:', stdout?.substring(0, 200))
        console.log('yt-dlp stderr:', stderr?.substring(0, 300))
      } catch (dlErr) {
        console.log('yt-dlp bv*+ba failed:', dlErr.message)
        // Fallback: try default format selection (still includes merge)
        try {
          const { stdout, stderr } = await execAsync(
            `"${YT_DLP}" --merge-output-format mp4 --no-warnings ${cookieArgs} --no-playlist -o "${outputTemplate}" "${cleanUrl}"`,
            { timeout: 300000, maxBuffer: 50 * 1024 * 1024 }
          )
          console.log('yt-dlp fallback stdout:', stdout?.substring(0, 200))
          console.log('yt-dlp fallback stderr:', stderr?.substring(0, 300))
        } catch (fallbackErr) {
          throw new Error(`yt-dlp failed: ${fallbackErr.message}`)
        }
      }

      // Find the output file (yt-dlp replaces %(ext)s with actual extension)
      const fs = require('fs')
      const pathMod = require('path')
      const baseDir = pathMod.dirname(tempPath)
      const baseName = pathMod.basename(tempPath, pathMod.extname(tempPath))
      const files = fs.readdirSync(baseDir).filter(f => f.startsWith(baseName))
      if (files.length === 0) throw new Error('yt-dlp did not produce output file')

      // Use the first matching file
      actualPath = join(baseDir, files[0])
      console.log(`Found output file: ${files[0]}`)

      const stat = statSync(actualPath)
      console.log(`Final file size: ${stat.size} bytes`)

      if (stat.size < 10000) {
        try { unlinkSync(actualPath) } catch (e) {}
        return res.status(500).json({ error: `File too small (${stat.size}b). Try again.` })
      }

      const mimeType = 'video/mp4'
      const encodedName = encodeURIComponent(`${safeTitle}.mp4`)
      res.writeHead(200, {
        'Content-Type': mimeType,
        'Content-Length': stat.size,
        'Content-Disposition': `attachment; filename="${safeTitle}.mp4"; filename*=UTF-8''${encodedName}`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Accept-Ranges': 'bytes',
        'Access-Control-Allow-Origin': '*',
      })
      const stream = createReadStream(actualPath)
      stream.pipe(res)
      stream.on('end', () => { try { unlinkSync(actualPath) } catch (e) {} })
      stream.on('error', () => { try { unlinkSync(actualPath) } catch (e) {} })

    } catch (err) {
      console.error('Download error:', err.message)
      try { if (existsSync(tempPath)) unlinkSync(tempPath) } catch (e) {}
      if (!res.headersSent) return res.status(500).json({ error: err.message })
    }
    return
  }

  // ── GET VIDEO INFO ──
  try {
    const cached = cache.get(url)
    if (cached && Date.now() - cached.time < CACHE_TTL) {
      console.log('Cache hit')
      return res.json(cached.data)
    }

    console.log(`Fetching info for: ${cleanUrl}`)
    const { stdout } = await execAsync(
      `"${YT_DLP}" -J --no-warnings ${cookieArgs} "${cleanUrl}"`,
      { timeout: 30000, maxBuffer: 10 * 1024 * 1024 }
    )

    const info = JSON.parse(stdout)
    console.log('yt-dlp success, title:', info.title?.substring(0, 50))

    const igMatch = url.match(/\/(reel|p|tv)\/([A-Za-z0-9_-]+)/)
    const igId = igMatch ? igMatch[2] : 'post'
    const igType = igMatch ? igMatch[1] : 'video'
    const autoTitle = info.description || info.title || (igType === 'reel' ? `Instagram Reel ${igId}` : `Instagram Post ${igId}`)

    const data = {
      title: autoTitle,
      thumbnail: info.thumbnail || null,
      duration: info.duration || 0,
      videos: [{ quality: 'HD', format_id: 'hd', ext: 'mp4', filesize: null }],
      audio: [{ quality: 'MP3', format_id: 'mp3', ext: 'mp3', filesize: null }]
    }

    cache.set(url, { data, time: Date.now() })
    return res.json(data)

  } catch (err) {
    console.error('yt-dlp error:', err.message)
    return res.status(500).json({ error: 'Failed to fetch video. Check the URL and try again.' })
  }
}