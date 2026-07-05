import { existsSync, mkdirSync, createWriteStream, createReadStream, unlinkSync, statSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import https from 'https'
import http from 'http'

const cache = new Map()
const CACHE_TTL = 5 * 60 * 1000
const TMP_DIR = join(tmpdir(), 'ig-downloads')
if (!existsSync(TMP_DIR)) mkdirSync(TMP_DIR, { recursive: true })

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

function cleanInstagramUrl(rawUrl) {
  try {
    const u = new URL(rawUrl)
    const match = u.pathname.match(/^[/](reel|p|tv)[/]([A-Za-z0-9_-]+)/)
    if (match) return 'https://www.instagram.com/' + match[1] + '/' + match[2] + '/'
    return rawUrl
  } catch (e) { return rawUrl }
}

async function scrapeInstagramMeta(url) {
  const cleanUrl = cleanInstagramUrl(url)
  console.log('Scraping:', cleanUrl)

  const userAgents = [
    'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    'Twitterbot/1.0',
    'WhatsApp/2.23.1 A',
    'LinkedInBot/1.0 (compatible; Mozilla/5.0; Apache-HttpClient/4.1.1 +http://www.linkedin.com)',
    'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
  ]

  for (const ua of userAgents) {
    try {
      const res = await fetch(cleanUrl, {
        headers: {
          'User-Agent': ua,
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        signal: AbortSignal.timeout(10000)
      })

      const html = await res.text()
      console.log('UA: ' + ua.substring(0, 30) + ' Status: ' + res.status + ' HTML: ' + html.length)

      const videoMatch = html.match(/<meta property="og:video(?::url)?" content="([^"]+)"/)
      const videoUrl = videoMatch ? videoMatch[1].replace(/&amp;/g, '&') : null

      const secureMatch = html.match(/<meta property="og:video:secure_url" content="([^"]+)"/)
      const secureUrl = secureMatch ? secureMatch[1].replace(/&amp;/g, '&') : null

      const imageMatch = html.match(/<meta property="og:image" content="([^"]+)"/)
      const thumbnail = imageMatch ? imageMatch[1].replace(/&amp;/g, '&') : null

      const titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/)
      const title = titleMatch ? titleMatch[1] : null

      const finalVideoUrl = secureUrl || videoUrl

      if (finalVideoUrl) {
        console.log('Found video URL: ' + finalVideoUrl.substring(0, 80))
        return { videoUrl: finalVideoUrl, thumbnail, title }
      }

      if (thumbnail) {
        console.log('Photo only post')
        return { videoUrl: null, thumbnail, title }
      }

    } catch (e) {
      console.log('UA failed: ' + ua.substring(0, 30) + ' ' + e.message)
    }
  }

  console.log('All user agents failed')
  return { videoUrl: null, thumbnail: null, title: null }
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

      const options = {
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
          'Accept': 'video/mp4,video/*;q=0.9,*/*;q=0.8',
          'Accept-Encoding': 'identity',
          'Referer': 'https://www.instagram.com/',
        },
        timeout: 120000
      }

      const req = protocol.request(options, (remoteRes) => {
        const status = remoteRes.statusCode
        const contentType = remoteRes.headers['content-type'] || ''
        const contentLength = remoteRes.headers['content-length']
        console.log('Download: ' + status + ' type: ' + contentType + ' size: ' + contentLength)

        if ([301, 302, 303, 307, 308].includes(status)) {
          const location = remoteRes.headers.location
          if (!location) return reject(new Error('Redirect no location'))
          remoteRes.resume()
          const nextUrl = location.startsWith('http') ? location : urlObj.protocol + '//' + urlObj.hostname + location
          return attempt(nextUrl, redirectCount + 1)
        }

        if (status !== 200) {
          remoteRes.resume()
          return reject(new Error('HTTP ' + status))
        }

        const fileStream = createWriteStream(destPath)
        let bytesReceived = 0
        remoteRes.on('data', chunk => { bytesReceived += chunk.length })
        remoteRes.pipe(fileStream)
        fileStream.on('finish', () => {
          fileStream.close()
          console.log('Downloaded: ' + bytesReceived + ' bytes')
          resolve({ bytesReceived, contentType })
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

export const config = {
  api: { responseLimit: false, bodyParser: false }
}

export default async function handler(req, res) {
  const { url, format: formatId, thumb, type, title } = req.query

  if (!url) return res.status(400).json({ error: 'Missing ?url=' })

  if (thumb === '1') {
    const cached = cache.get(url)
    if (cached && cached.data && cached.data.thumbnail) return proxyImage(cached.data.thumbnail, res)
    const { thumbnail } = await scrapeInstagramMeta(url)
    if (thumbnail) return proxyImage(thumbnail, res)
    return res.status(404).json({ error: 'No thumbnail' })
  }

  if (formatId) {
    const isAudio = type === 'audio'
    const safeTitle = (title || 'instagram-video')
      .replace(/[^a-zA-Z0-9\s_-]/g, '').replace(/\s+/g, '-').substring(0, 40) || 'instagram-video'
    const ext = isAudio ? 'mp3' : 'mp4'
    const filename = safeTitle + '.' + ext
    const tempPath = join(TMP_DIR, 'ig-' + Date.now() + '-' + Math.random().toString(36).slice(2) + '.' + ext)

    try {
      let videoUrl = null
      const cached = cache.get(url)
      if (cached && cached.data && cached.data.videoUrl) {
        videoUrl = cached.data.videoUrl
        console.log('Using cached video URL')
      } else {
        const meta = await scrapeInstagramMeta(url)
        videoUrl = meta.videoUrl
      }

      if (!videoUrl) {
        return res.status(500).json({ error: 'Could not find video URL. Post may be private or photo-only.' })
      }

      console.log('Downloading from: ' + videoUrl.substring(0, 80))
      await downloadFileToDisk(videoUrl, tempPath)

      if (!existsSync(tempPath)) throw new Error('File not created')
      const stat = statSync(tempPath)
      console.log('File size: ' + stat.size + ' bytes')

      if (stat.size < 10000) {
        try { unlinkSync(tempPath) } catch (e) {}
        return res.status(500).json({ error: 'File too small (' + stat.size + 'b). Try again.' })
      }

      const mimeType = isAudio ? 'audio/mpeg' : 'video/mp4'
      const encodedName = encodeURIComponent(filename)
      res.writeHead(200, {
        'Content-Type': mimeType,
        'Content-Length': stat.size,
        'Content-Disposition': 'attachment; filename="' + filename + '"; filename*=UTF-8\'\'' + encodedName,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Accept-Ranges': 'bytes',
        'Access-Control-Allow-Origin': '*',
      })

      const stream = createReadStream(tempPath)
      stream.pipe(res)
      stream.on('end', () => { try { unlinkSync(tempPath) } catch (e) {} })
      stream.on('error', () => { try { unlinkSync(tempPath) } catch (e) {} })

    } catch (err) {
      console.error('Download error:', err.message)
      try { if (existsSync(tempPath)) unlinkSync(tempPath) } catch (e) {}
      if (!res.headersSent) return res.status(500).json({ error: err.message })
    }
    return
  }

  try {
    const cached = cache.get(url)
    if (cached && Date.now() - cached.time < CACHE_TTL) {
      console.log('Cache hit')
      return res.json(cached.data)
    }

    const { videoUrl, thumbnail, title: igTitle } = await scrapeInstagramMeta(url)

    const igMatch = url.match(/\/(reel|p|tv)\/([A-Za-z0-9_-]+)/)
    const igId = igMatch ? igMatch[2] : 'post'
    const igType = igMatch ? igMatch[1] : 'video'
    const autoTitle = igTitle || (igType === 'reel' ? 'Instagram Reel ' + igId : 'Instagram Post ' + igId)

    let data = {}

    if (videoUrl) {
      data = {
        title: autoTitle, thumbnail, videoUrl, duration: 0,
        videos: [{ quality: 'HD', format_id: 'hd', ext: 'mp4', filesize: null }],
        audio: [{ quality: 'MP3', format_id: 'mp3', ext: 'mp3', filesize: null }]
      }
    } else if (thumbnail) {
      data = {
        title: autoTitle, thumbnail, videoUrl: null, duration: 0,
        videos: [], audio: [], isPhotoOnly: true
      }
    } else {
      return res.status(500).json({ error: 'Could not fetch info. Post may be private.' })
    }

    cache.set(url, { data, time: Date.now() })
    return res.json(data)

  } catch (err) {
    console.error('Scrape error:', err.message)
    return res.status(500).json({ error: 'Failed to process. Try again.' })
  }
}