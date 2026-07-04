import { existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import https from 'https'
import http from 'http'

const COBALT_API = process.env.COBALT_API_URL || 'https://cobalt-production-f33d.up.railway.app'

const cache = new Map()
const CACHE_TTL = 5 * 60 * 1000

const TMP_DIR = join(tmpdir(), 'ig-downloads')
if (!existsSync(TMP_DIR)) mkdirSync(TMP_DIR, { recursive: true })

// Proxy thumbnail
function proxyImage(imageUrl, res) {
  const protocol = imageUrl.startsWith('https') ? https : http
  protocol.get(imageUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Referer': 'https://www.instagram.com/',
    }
  }, (proxyRes) => {
    const contentType = proxyRes.headers['content-type'] || 'image/jpeg'
    res.setHeader('Content-Type', contentType)
    res.setHeader('Cache-Control', 'public, max-age=86400')
    res.writeHead(proxyRes.statusCode)
    proxyRes.pipe(res)
  }).on('error', () => {
    if (!res.headersSent) res.status(500).json({ error: 'Failed to load thumbnail' })
  })
}

// Fetch thumbnail
async function fetchThumbnail(url) {
  try {
    const pageRes = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' }
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
  console.log('Cobalt response status:', data.status)
  return data
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

  // ── GET DIRECT DOWNLOAD URL (no proxying through server) ──
  if (formatId) {
    try {
      const isAudio = type === 'audio'
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
        return res.status(500).json({ error: 'No download URL' })
      }

      // ✅ Return the direct URL to the frontend
      // Let the browser download directly from Cobalt — no timeout issues!
      return res.json({ directUrl: fileUrl })

    } catch (err) {
      console.error('download error:', err.message)
      return res.status(500).json({ error: 'Download failed. Try again.' })
    }
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