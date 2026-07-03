import { createReadStream, unlinkSync, existsSync, mkdirSync } from 'fs'
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

// Clean up temp files after 5 minutes
setInterval(() => {
  const now = Date.now()
  try {
    const fs = require('fs')
    const files = fs.readdirSync(TMP_DIR)
    files.forEach(f => {
      const fp = join(TMP_DIR, f)
      const stat = fs.statSync(fp)
      if (now - stat.mtimeMs > 5 * 60 * 1000) unlinkSync(fp)
    })
  } catch (e) { /* ignore */ }
}, 60 * 1000)

// Proxy thumbnail — bypasses Instagram hotlink protection
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
    res.status(500).json({ error: 'Failed to load thumbnail' })
  })
}

// Fetch thumbnail from Instagram oEmbed API (free, no login needed)
async function fetchThumbnail(url) {
  try {
    const oembedRes = await fetch(
      `https://graph.facebook.com/v19.0/instagram_oembed?url=${encodeURIComponent(url)}&fields=thumbnail_url&access_token=anonymous`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    )
    const data = await oembedRes.json()
    if (data.thumbnail_url) return data.thumbnail_url
  } catch (e) { /* ignore */ }

  // Fallback — try scraping og:image from Instagram page
  try {
    const pageRes = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      }
    })
    const html = await pageRes.text()
    const match = html.match(/<meta property="og:image" content="([^"]+)"/)
    if (match) return match[1]
  } catch (e) { /* ignore */ }

  return null
}

// Call Cobalt API and return parsed result
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

// Stream a remote file to response (for actual file download)
function streamRemoteFile(fileUrl, filename, contentType, res) {
  const protocol = fileUrl.startsWith('https') ? https : http
  const options = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    }
  }

  protocol.get(fileUrl, options, (remoteRes) => {
    const contentLength = remoteRes.headers['content-length']
    const headers = {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    }
    if (contentLength) headers['Content-Length'] = contentLength
    res.writeHead(200, headers)
    remoteRes.pipe(res)
    remoteRes.on('error', () => {
      if (!res.headersSent) res.status(500).json({ error: 'Stream failed' })
    })
  }).on('error', () => {
    if (!res.headersSent) res.status(500).json({ error: 'Failed to fetch file' })
  })
}

export default async function handler(req, res) {
  const { url, format: formatId, thumb, type, title } = req.query

  if (!url) return res.status(400).json({ error: 'Missing ?url=' })

  // ── PROXY THUMBNAIL ──
  if (thumb === '1') {
    // Check cache first
    const cached = cache.get(url)
    if (cached?.data?.thumbnail) {
      return proxyImage(cached.data.thumbnail, res)
    }
    // Try fetching thumbnail directly
    const thumbUrl = await fetchThumbnail(url)
    if (thumbUrl) return proxyImage(thumbUrl, res)
    return res.status(404).json({ error: 'No thumbnail' })
  }

  // ── DIRECT FILE DOWNLOAD ──
  if (formatId) {
    const isAudio = type === 'audio'
    const safeTitle = (title || 'instagram-video')
      .replace(/[^a-zA-Z0-9\s_-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 40)
    const filename = isAudio ? `${safeTitle}-audio.mp3` : `${safeTitle}-video.mp4`
    const contentType = isAudio ? 'audio/mpeg' : 'video/mp4'

    try {
      const mode = isAudio ? 'audio' : 'auto'
      const data = await fetchFromCobalt(url, mode)

      if (data.status === 'error') {
        return res.status(500).json({ error: data.error?.code || 'Download failed' })
      }

      if (data.status === 'tunnel' || data.status === 'redirect') {
        return streamRemoteFile(data.url, filename, contentType, res)
      }

      // Picker — return first item
      if (data.status === 'picker' && data.picker?.length > 0) {
        const item = data.picker[0]
        return streamRemoteFile(item.url, filename, contentType, res)
      }

      return res.status(500).json({ error: 'Unexpected Cobalt response' })

    } catch (err) {
      console.error('download error:', err.message)
      if (!res.headersSent) return res.status(500).json({ error: 'Download failed' })
    }
    return
  }

  // ── GET VIDEO INFO ──
  try {
    // Check cache
    const cached = cache.get(url)
    if (cached && Date.now() - cached.time < CACHE_TTL) {
      return res.json(cached.data)
    }

    // Fetch from Cobalt
    const cobaltData = await fetchFromCobalt(url, 'auto')

    if (cobaltData.status === 'error') {
      return res.status(500).json({ error: cobaltData.error?.code || 'Failed to fetch video' })
    }

    let data = {}

    // Extract reel/post ID from URL for a cleaner title
    const igMatch = url.match(/\/(reel|p|tv)\/([A-Za-z0-9_-]+)/)
    const igId = igMatch ? igMatch[2] : 'instagram'
    const igType = igMatch ? igMatch[1] : 'video'
    const autoTitle = igType === 'reel' ? `Instagram Reel ${igId}` : `Instagram Post ${igId}`

    // Fetch thumbnail in parallel
    const thumbnail = await fetchThumbnail(url)

    // Single video/audio
    if (cobaltData.status === 'tunnel' || cobaltData.status === 'redirect') {
      data = {
        title: autoTitle,
        thumbnail,
        duration: 0,
        videos: [{
          quality: 'HD 1080p',
          format_id: 'hd',
          url: cobaltData.url,
          filesize: null
        }],
        audio: [{
          quality: 'MP3',
          format_id: 'mp3',
          url: cobaltData.url,
          filesize: null
        }]
      }
    }

    // Carousel/multiple media (picker)
    if (cobaltData.status === 'picker') {
      const videos = cobaltData.picker
        ?.filter(p => p.type === 'video')
        ?.map((p, i) => ({
          quality: `Video ${i + 1}`,
          format_id: `video_${i}`,
          url: p.url,
          filesize: null
        })) || []

      const photos = cobaltData.picker
        ?.filter(p => p.type === 'photo')
        ?.map((p, i) => ({
          quality: `Photo ${i + 1}`,
          format_id: `photo_${i}`,
          url: p.url,
          filesize: null
        })) || []

      data = {
        title: autoTitle,
        thumbnail: cobaltData.picker?.[0]?.thumb || thumbnail || null,
        duration: 0,
        videos: [...videos, ...photos],
        audio: cobaltData.audio ? [{
          quality: 'MP3',
          format_id: 'mp3',
          url: cobaltData.audio,
          filesize: null
        }] : []
      }
    }

    // Cache and return
    cache.set(url, { data, time: Date.now() })
    return res.json(data)

  } catch (err) {
    console.error('Cobalt error:', err.message)
    return res.status(500).json({ error: 'Failed to process video. Check the URL and try again.' })
  }
}