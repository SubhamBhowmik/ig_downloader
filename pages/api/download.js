import { existsSync, mkdirSync, createWriteStream, createReadStream, unlinkSync, statSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import https from 'https'
import http from 'http'

const COBALT_API = process.env.COBALT_API_URL || 'https://cobalt-production-f33d.up.railway.app'
const cache = new Map()
const CACHE_TTL = 5 * 60 * 1000
const TMP_DIR = join(tmpdir(), 'ig-downloads')
if (!existsSync(TMP_DIR)) mkdirSync(TMP_DIR, { recursive: true })

setInterval(() => {
  try {
    const fs = require('fs')
    const files = fs.readdirSync(TMP_DIR)
    const now = Date.now()
    files.forEach(f => {
      try {
        const fp = join(TMP_DIR, f)
        if (now - fs.statSync(fp).mtimeMs > 15 * 60 * 1000) unlinkSync(fp)
      } catch (e) {}
    })
  } catch (e) {}
}, 2 * 60 * 1000)

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

async function fetchThumbnail(url) {
  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' }
    })
    const html = await r.text()
    const m = html.match(/<meta property="og:image" content="([^"]+)"/)
    if (m) return m[1]
  } catch (e) {}
  return null
}

// Clean Instagram URL — remove tracking params that confuse Cobalt
function cleanInstagramUrl(rawUrl) {
  try {
    const u = new URL(rawUrl)
    // Keep only the path — remove all query params
    const match = u.pathname.match(/^\/(reel|p|tv)\/([A-Za-z0-9_-]+)/)
    if (match) {
      return `https://www.instagram.com/${match[1]}/${match[2]}/`
    }
    return rawUrl
  } catch (e) {
    return rawUrl
  }
}

async function fetchFromCobalt(url, mode = 'auto') {
  const cleanUrl = cleanInstagramUrl(url)
  console.log('Cobalt request URL:', cleanUrl)
  console.log('Cobalt mode:', mode)

  const response = await fetch(`${COBALT_API}/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({
      url: cleanUrl,
      videoQuality: '1080',
      audioFormat: 'mp3',
      filenameStyle: 'basic',
      downloadMode: mode
    })
  })
  const data = await response.json()
  console.log('Cobalt status:', data.status)
  console.log('Cobalt URL:', data.url ? data.url.substring(0, 80) : 'none')
  return data
}

function downloadFileToDisk(fileUrl, destPath, expectedMime) {
  return new Promise((resolve, reject) => {
    const attempt = (attemptUrl, redirectCount = 0) => {
      if (redirectCount > 10) return reject(new Error('Too many redirects'))

      const isHttps = attemptUrl.startsWith('https')
      const protocol = isHttps ? https : http
      const urlObj = new URL(attemptUrl)

      const options = {
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': expectedMime === 'audio' ? 'audio/*,*/*;q=0.8' : 'video/mp4,video/*;q=0.9,*/*;q=0.8',
          'Accept-Encoding': 'identity',
          'Connection': 'keep-alive',
          'Referer': 'https://www.instagram.com/',
        },
        timeout: 120000
      }

      const req = protocol.request(options, (remoteRes) => {
        const status = remoteRes.statusCode
        const contentType = remoteRes.headers['content-type'] || ''
        const contentLength = remoteRes.headers['content-length']
        console.log(`Response: ${status}, Content-Type: ${contentType}, Size: ${contentLength}`)

        // Follow redirects
        if ([301, 302, 303, 307, 308].includes(status)) {
          const location = remoteRes.headers.location
          if (!location) return reject(new Error('Redirect with no location'))
          remoteRes.resume()
          const nextUrl = location.startsWith('http') ? location : `${urlObj.protocol}//${urlObj.hostname}${location}`
          return attempt(nextUrl, redirectCount + 1)
        }

        if (status !== 200) {
          remoteRes.resume()
          return reject(new Error(`HTTP ${status}`))
        }

        // ✅ Detect if Cobalt returned image instead of video
        if (contentType.startsWith('image/') && expectedMime !== 'image') {
          remoteRes.resume()
          return reject(new Error(`COBALT_IMAGE_RESPONSE: Cobalt returned image (${contentType}) instead of video`))
        }

        if (contentType.includes('text/html')) {
          remoteRes.resume()
          return reject(new Error('COBALT_HTML_RESPONSE: Cobalt returned HTML error page'))
        }

        const fileStream = createWriteStream(destPath)
        let bytesReceived = 0
        remoteRes.on('data', chunk => { bytesReceived += chunk.length })
        remoteRes.pipe(fileStream)
        fileStream.on('finish', () => {
          fileStream.close()
          console.log(`Downloaded: ${bytesReceived} bytes, type: ${contentType}`)
          resolve({ bytesReceived, contentType })
        })
        fileStream.on('error', reject)
        remoteRes.on('error', reject)
      })

      req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')) })
      req.on('error', reject)
      req.end()
    }

    attempt(fileUrl)
  })
}

export const config = {
  api: { responseLimit: false, bodyParser: false }
}

export default async function handler(req, res) {
  const { url, format: formatId, thumb, type, title } = req.query

  if (!url) return res.status(400).json({ error: 'Missing ?url=' })

  if (thumb === '1') {
    const cached = cache.get(url)
    if (cached?.data?.thumbnail) return proxyImage(cached.data.thumbnail, res)
    const thumbUrl = await fetchThumbnail(url)
    if (thumbUrl) return proxyImage(thumbUrl, res)
    return res.status(404).json({ error: 'No thumbnail' })
  }

  if (formatId) {
    const isAudio = type === 'audio'
    const safeTitle = (title || 'instagram-video')
      .replace(/[^a-zA-Z0-9\s_-]/g, '').replace(/\s+/g, '-').substring(0, 40) || 'instagram-video'
    const ext = isAudio ? 'mp3' : 'mp4'
    const filename = `${safeTitle}.${ext}`
    const tempPath = join(TMP_DIR, `ig-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`)

    try {
      const mode = isAudio ? 'audio' : 'auto'
      const data = await fetchFromCobalt(url, mode)

      if (data.status === 'error') {
        return res.status(500).json({ error: data.error?.code || 'Download failed' })
      }

      let fileUrl = null
      if (data.status === 'tunnel' || data.status === 'redirect') fileUrl = data.url
      else if (data.status === 'picker' && data.picker?.length > 0) {
        // For picker — find video item, not photo
        const videoItem = data.picker.find(p => p.type === 'video')
        fileUrl = videoItem ? videoItem.url : data.picker[0].url
      }

      if (!fileUrl) return res.status(500).json({ error: 'No download URL from Cobalt' })

      const expectedMime = isAudio ? 'audio' : 'video'
      const { bytesReceived, contentType } = await downloadFileToDisk(fileUrl, tempPath, expectedMime)
      const stat = statSync(tempPath)

      if (stat.size < 50000) {
        try { unlinkSync(tempPath) } catch (e) {}
        return res.status(500).json({ error: `File too small (${stat.size} bytes) — this post may be a photo, not a video` })
      }

      // Use actual content-type from response
      const mimeType = contentType.startsWith('video') ? 'video/mp4'
        : contentType.startsWith('audio') ? 'audio/mpeg'
        : isAudio ? 'audio/mpeg' : 'video/mp4'

      const encodedName = encodeURIComponent(filename)
      res.writeHead(200, {
        'Content-Type': mimeType,
        'Content-Length': stat.size,
        'Content-Disposition': `attachment; filename="${filename}"; filename*=UTF-8''${encodedName}`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Accept-Ranges': 'bytes',
        'Access-Control-Allow-Origin': '*',
      })

      const stream = createReadStream(tempPath)
      stream.pipe(res)
      stream.on('end', () => { try { unlinkSync(tempPath) } catch (e) {} })
      stream.on('error', () => { try { unlinkSync(tempPath) } catch (e) {} })
      return

    } catch (err) {
      console.error('Download error:', err.message)
      try { if (existsSync(tempPath)) unlinkSync(tempPath) } catch (e) {}
      if (!res.headersSent) {
        if (err.message.includes('COBALT_IMAGE_RESPONSE')) {
          return res.status(500).json({ error: 'This post appears to be a photo, not a video. Try a Reel or video post.' })
        }
        return res.status(500).json({ error: err.message })
      }
    }
    return
  }

  // GET VIDEO INFO
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
        title: autoTitle, thumbnail, duration: 0,
        videos: [{ quality: 'HD 1080p', format_id: 'hd', filesize: null }],
        audio: [{ quality: 'MP3', format_id: 'mp3', filesize: null }]
      }
    }

    if (cobaltData.status === 'picker') {
      const videos = cobaltData.picker?.filter(p => p.type === 'video')
        ?.map((p, i) => ({ quality: `Video ${i + 1}`, format_id: `video_${i}`, filesize: null })) || []
      const photos = cobaltData.picker?.filter(p => p.type === 'photo')
        ?.map((p, i) => ({ quality: `Photo ${i + 1}`, format_id: `photo_${i}`, filesize: null })) || []
      data = {
        title: autoTitle,
        thumbnail: cobaltData.picker?.[0]?.thumb || thumbnail || null,
        duration: 0, videos: [...videos, ...photos],
        audio: cobaltData.audio ? [{ quality: 'MP3', format_id: 'mp3', filesize: null }] : []
      }
    }

    cache.set(url, { data, time: Date.now() })
    return res.json(data)

  } catch (err) {
    console.error('Cobalt error:', err.message)
    return res.status(500).json({ error: 'Failed to process video. Try again.' })
  }
}