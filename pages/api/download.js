import { createWriteStream, createReadStream, unlinkSync, existsSync, mkdirSync, statSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import https from 'https'
import http from 'http'

const COBALT_API = process.env.COBALT_API_URL || 'https://cobalt-production-f33d.up.railway.app'

// In-memory cache for video metadata
const cache = new Map()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

// Temp download directory
const TMP_DIR = join(tmpdir(), 'ig-downloads')
if (!existsSync(TMP_DIR)) mkdirSync(TMP_DIR, { recursive: true })

// Clean up temp files older than 10 minutes
setInterval(() => {
  const now = Date.now()
  try {
    const fs = require('fs')
    const files = fs.readdirSync(TMP_DIR)
    files.forEach(f => {
      const fp = join(TMP_DIR, f)
      try {
        const stat = fs.statSync(fp)
        if (now - stat.mtimeMs > 10 * 60 * 1000) unlinkSync(fp)
      } catch (e) {}
    })
  } catch (e) {}
}, 60 * 1000)

// Proxy thumbnail
function proxyImage(imageUrl, res) {
  const protocol = imageUrl.startsWith('https') ? https : http
  const options = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Referer': 'https://www.instagram.com/',
    },
  }
  protocol.get(imageUrl, options, (proxyRes) => {
    const contentType = proxyRes.headers['content-type'] || 'image/jpeg'
    res.setHeader('Content-Type', contentType)
    res.setHeader('Cache-Control', 'public, max-age=86400')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.writeHead(proxyRes.statusCode)
    proxyRes.pipe(res)
  }).on('error', () => {
    if (!res.headersSent) res.status(500).json({ error: 'Failed to load thumbnail' })
  })
}

// Fetch thumbnail via og:image scraping
async function fetchThumbnail(url) {
  try {
    const pageRes = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      }
    })
    const html = await pageRes.text()
    const match = html.match(/<meta property="og:image" content="([^"]+)"/)
    if (match) return match[1]
  } catch (e) {}
  return null
}

// Call Cobalt API
async function fetchFromCobalt(url, mode = 'auto') {
  const response = await fetch(`${COBALT_API}/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      url,
      videoQuality: '1080',
      audioFormat: 'mp3',
      filenameStyle: 'basic',
      downloadMode: mode
    })
  })
  const data = await response.json()
  console.log('Cobalt response:', JSON.stringify(data))
  return data
}

// ✅ KEY FIX: Download full file to disk first, then serve it
// This ensures Android gets a complete file with correct Content-Length
function downloadToDisk(fileUrl, destPath) {
  return new Promise((resolve, reject) => {
    const protocol = fileUrl.startsWith('https') ? https : http
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      }
    }

    const makeRequest = (url) => {
      protocol.get(url, options, (remoteRes) => {
        // Handle redirects
        if (remoteRes.statusCode === 301 || remoteRes.statusCode === 302) {
          const redirectUrl = remoteRes.headers.location
          if (redirectUrl) return makeRequest(redirectUrl)
          return reject(new Error('Redirect loop'))
        }

        if (remoteRes.statusCode !== 200) {
          return reject(new Error(`HTTP ${remoteRes.statusCode}`))
        }

        const fileStream = createWriteStream(destPath)
        remoteRes.pipe(fileStream)
        fileStream.on('finish', () => {
          fileStream.close()
          resolve()
        })
        fileStream.on('error', reject)
        remoteRes.on('error', reject)
      }).on('error', reject)
    }

    makeRequest(fileUrl)
  })
}

// Serve a file from disk with proper headers for all browsers
function serveFile(filePath, filename, contentType, res) {
  try {
    const stat = statSync(filePath)
    const encodedName = encodeURIComponent(filename)

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stat.size,
      'Content-Disposition': `attachment; filename="${filename}"; filename*=UTF-8''${encodedName}`,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Access-Control-Allow-Origin': '*',
      'X-Content-Type-Options': 'nosniff',
    })

    const stream = createReadStream(filePath)
    stream.pipe(res)
    stream.on('end', () => {
      try { unlinkSync(filePath) } catch (e) {}
    })
    stream.on('error', (err) => {
      console.error('Stream error:', err.message)
      try { unlinkSync(filePath) } catch (e) {}
    })
  } catch (err) {
    console.error('serveFile error:', err.message)
    if (!res.headersSent) res.status(500).json({ error: 'Failed to serve file' })
  }
}

export default async function handler(req, res) {
  const { url, format: formatId, thumb, type, title } = req.query

  if (!url) return res.status(400).json({ error: 'Missing ?url=' })

  // ── PROXY THUMBNAIL ──
  if (thumb === '1') {
    const cached = cache.get(url)
    if (cached?.data?.thumbnail) return proxyImage(cached.data.thumbnail, res)
    const thumbUrl = await fetchThumbnail(url)
    if (thumbUrl) return proxyImage(thumbUrl, res)
    return res.status(404).json({ error: 'No thumbnail' })
  }

  // ── DOWNLOAD FILE ──
  if (formatId) {
    const isAudio = type === 'audio'
    const safeTitle = (title || 'instagram-video')
      .replace(/[^a-zA-Z0-9\s_-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 40) || 'instagram-video'
    const ext = isAudio ? 'mp3' : 'mp4'
    const filename = `${safeTitle}.${ext}`
    const contentType = isAudio ? 'audio/mpeg' : 'video/mp4'
    const tempPath = join(TMP_DIR, `ig-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`)

    try {
      const mode = isAudio ? 'audio' : 'auto'
      const data = await fetchFromCobalt(url, mode)

      if (data.status === 'error') {
        return res.status(500).json({ error: data.error?.code || 'Download failed' })
      }

      let fileUrl = null

      if (data.status === 'tunnel' || data.status === 'redirect') {
        fileUrl = data.url
      } else if (data.status === 'picker' && data.picker?.length > 0) {
        fileUrl = data.picker[0].url
      }

      if (!fileUrl) {
        return res.status(500).json({ error: 'No download URL from Cobalt' })
      }

      // ✅ Download entire file to disk first
      console.log(`Downloading to disk: ${tempPath}`)
      await downloadToDisk(fileUrl, tempPath)

      // Verify file was downloaded properly
      const stat = statSync(tempPath)
      console.log(`File size: ${stat.size} bytes`)

      if (stat.size < 1000) {
        try { unlinkSync(tempPath) } catch (e) {}
        return res.status(500).json({ error: 'Downloaded file is too small — try again' })
      }

      // ✅ Serve from disk with full Content-Length
      return serveFile(tempPath, filename, contentType, res)

    } catch (err) {
      console.error('download error:', err.message)
      try { if (existsSync(tempPath)) unlinkSync(tempPath) } catch (e) {}
      if (!res.headersSent) return res.status(500).json({ error: 'Download failed. Try again.' })
    }
    return
  }

  // ── GET VIDEO INFO ──
  try {
    const cached = cache.get(url)
    if (cached && Date.now() - cached.time < CACHE_TTL) return res.json(cached.data)

    const cobaltData = await fetchFromCobalt(url, 'auto')

    if (cobaltData.status === 'error') {
      return res.status(500).json({ error: cobaltData.error?.code || 'Failed to fetch video' })
    }

    const igMatch = url.match(/\/(reel|p|tv)\/([A-Za-z0-9_-]+)/)
    const igId = igMatch ? igMatch[2] : 'post'
    const igType = igMatch ? igMatch[1] : 'video'
    const autoTitle = igType === 'reel' ? `Instagram Reel ${igId}` : `Instagram Post ${igId}`
    const thumbnail = await fetchThumbnail(url)

    let data = {}

    if (cobaltData.status === 'tunnel' || cobaltData.status === 'redirect') {
      data = {
        title: autoTitle,
        thumbnail,
        duration: 0,
        videos: [{ quality: 'HD 1080p', format_id: 'hd', filesize: null }],
        audio: [{ quality: 'MP3', format_id: 'mp3', filesize: null }]
      }
    }

    if (cobaltData.status === 'picker') {
      const videos = cobaltData.picker
        ?.filter(p => p.type === 'video')
        ?.map((p, i) => ({ quality: `Video ${i + 1}`, format_id: `video_${i}`, filesize: null })) || []
      const photos = cobaltData.picker
        ?.filter(p => p.type === 'photo')
        ?.map((p, i) => ({ quality: `Photo ${i + 1}`, format_id: `photo_${i}`, filesize: null })) || []

      data = {
        title: autoTitle,
        thumbnail: cobaltData.picker?.[0]?.thumb || thumbnail || null,
        duration: 0,
        videos: [...videos, ...photos],
        audio: cobaltData.audio ? [{ quality: 'MP3', format_id: 'mp3', filesize: null }] : []
      }
    }

    cache.set(url, { data, time: Date.now() })
    return res.json(data)

  } catch (err) {
    console.error('Cobalt error:', err.message)
    return res.status(500).json({ error: 'Failed to process video. Check the URL and try again.' })
  }
}