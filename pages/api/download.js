import { existsSync, mkdirSync, createWriteStream, createReadStream, unlinkSync, statSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import https from 'https'
import http from 'http'

const cache = new Map()
const CACHE_TTL = 5 * 60 * 1000
const TMP_DIR = join(tmpdir(), 'ig-downloads')
if (!existsSync(TMP_DIR)) mkdirSync(TMP_DIR, { recursive: true })

// Optional proxy support via environment variables
// Set PROXY_URL for all requests, or HTTP_PROXY/HTTPS_PROXY for standard compat
const PROXY_URL = process.env.PROXY_URL || process.env.HTTPS_PROXY || process.env.HTTP_PROXY || ''
let proxyAgent = null

// Try to create a proxy agent if PROXY_URL is configured
async function initProxyAgent() {
  if (!PROXY_URL) return
  try {
    // undici is bundled with Node 18+ (which Next.js 16 requires)
    const { ProxyAgent } = await import('undici')
    proxyAgent = new ProxyAgent(PROXY_URL)
    console.log('Proxy agent configured:', PROXY_URL.replace(/:.*@/, ':****@'))
  } catch (e) {
    console.log('Proxy agent unavailable (undici import failed):', e.message)
  }
}
initProxyAgent()

// Helper: fetch with optional proxy support
async function fetchWithProxy(url, options = {}) {
  if (proxyAgent) {
    return fetch(url, { ...options, dispatcher: proxyAgent })
  }
  return fetch(url, options)
}

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
    const match = u.pathname.match(/^\/(reel|p|tv)\/([A-Za-z0-9_-]+)/)
    if (match) return { 
      cleanUrl: 'https://www.instagram.com/' + match[1] + '/' + match[2] + '/',
      shortcode: match[2],
      type: match[1]
    }
  } catch (e) {}
  return { cleanUrl: rawUrl, shortcode: null, type: null }
}

function decodeHtml(str) {
  if (!str) return str
  return str
    .replace(/&/g, '&')
    .replace(/"/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/\\u0026/g, '&')
    .replace(/&#x2019;/g, "'")
    .replace(/&#x201d;/g, '"')
    .replace(/&#x201c;/g, '"')
}

// Method 1: Instagram embed page (most reliable from server IPs)
// The /embed/ endpoint is designed for public iframe embeds and is less aggressively blocked
async function fetchViaEmbedPage(shortcode) {
  console.log('Trying embed page for:', shortcode)
  try {
    const url = 'https://www.instagram.com/p/' + shortcode + '/embed/'
    const res = await fetchWithProxy(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(12000)
    })
    const html = await res.text()

    // Method A: Parse application/ld+json (structured data)
    const ldMatch = html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/)
    if (ldMatch) {
      try {
        const ldData = JSON.parse(ldMatch[1])
        const videoUrl = ldData?.video?.contentUrl || ldData?.contentUrl
        const thumbnail = ldData?.thumbnailUrl?.[0] || ldData?.thumbnailUrl
        const title = ldData?.name || ldData?.headline || 'Instagram Video'
        if (videoUrl) {
          console.log('Embed ld+json SUCCESS - video URL found')
          return { videoUrl, thumbnail, title }
        }
      } catch (e) {
        console.log('Embed ld+json parse error:', e.message)
      }
    }

    // Method B: og:video meta tag
    const ogVideoMatch = html.match(/<meta property="og:video" content="([^"]+)"/) ||
                         html.match(/<meta content="([^"]+)" property="og:video"/) ||
                         html.match(/<meta property="og:video:secure_url" content="([^"]+)"/) ||
                         html.match(/<meta content="([^"]+)" property="og:video:secure_url"/)
    if (ogVideoMatch) {
      const videoUrl = decodeHtml(ogVideoMatch[1])
      const imgMatch = html.match(/<meta property="og:image" content="([^"]+)"/)
      const thumbnail = imgMatch ? decodeHtml(imgMatch[1]) : null
      console.log('Embed og:video SUCCESS')
      return { videoUrl, thumbnail, title: null }
    }

    // Method C: JSON data in script tags (Instagram puts __INITIAL_STATE__ in embed)
    const stateMatch = html.match(/window\.__INITIAL_STATE__\s*=\s*({.+?});/s)
    if (stateMatch) {
      try {
        const stateData = JSON.parse(stateMatch[1])
        const media = stateData?.shortcode_media
        if (media) {
          const videoUrl = media.video_url || media.video_versions?.[0]?.url
          const thumbnail = media.display_url || media.thumbnail_src
          const title = media.edge_media_to_caption?.edges?.[0]?.node?.text || 'Instagram Video'
          if (videoUrl) {
            console.log('Embed __INITIAL_STATE__ SUCCESS')
            return { videoUrl, thumbnail, title }
          }
        }
      } catch (e) {
        console.log('Embed __INITIAL_STATE__ parse error:', e.message)
      }
    }

    // Method D: Fall back to og:image at least
    const imgMatch = html.match(/<meta property="og:image" content="([^"]+)"/)
    if (imgMatch) {
      console.log('Embed got thumbnail only')
      return { videoUrl: null, thumbnail: decodeHtml(imgMatch[1]), title: null }
    }

    console.log('Embed page - no video found (response length:', html.length, ')')
  } catch (e) {
    console.log('Embed page failed:', e.message)
  }
  return null
}

// Method 2: Instagram's __a=1 endpoint (simplest, no anti-scraping prefix)
async function fetchViaA1Endpoint(shortcode) {
  console.log('Trying __a=1 endpoint for:', shortcode)
  try {
    const url = 'https://www.instagram.com/p/' + shortcode + '/?__a=1&__d=1'
    const res = await fetchWithProxy(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.instagram.com/',
      },
      signal: AbortSignal.timeout(10000)
    })

    const text = await res.text()
    // Instagram wraps responses in for(;;); - strip it if present
    const jsonText = text.startsWith('for (;;)') ? text.substring(text.indexOf('{')) : text
    const data = JSON.parse(jsonText)

    let media = data?.items?.[0] || data?.graphql?.shortcode_media || data?.item

    if (!media && data?.graphql) {
      media = data.graphql.shortcode_media
    }

    if (!media) {
      console.log('No media in __a=1 response')
      return null
    }

    const videoUrl = media.video_versions?.[0]?.url || media.video_url
    const thumbnail = media.display_url || media.image_versions2?.candidates?.[0]?.url
    const title = media.caption?.text || media.edge_media_to_caption?.edges?.[0]?.node?.text || 'Instagram Video'

    if (videoUrl) {
      console.log('__a=1 SUCCESS - video URL found')
      return { videoUrl, thumbnail, title }
    }
  } catch (e) {
    console.log('__a=1 failed:', e.message)
  }
  return null
}

// Method 3: Instagram GraphQL API (with for(;;); prefix handling)
async function fetchViaGraphQL(shortcode) {
  console.log('Trying GraphQL API for:', shortcode)
  try {
    const apiUrl = 'https://www.instagram.com/api/graphql'
    const variables = JSON.stringify({
      shortcode,
      fetch_comment_count: 0,
      fetch_related_count: 0,
      child_comment_count: 0,
      fetch_like_count: 0,
      has_threaded_comments: false,
    })

    const res = await fetchWithProxy(apiUrl, {
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-IG-App-ID': '936619743392459',
        'X-ASBD-ID': '129477',
        'X-IG-WWW-Claim': '0',
        'Origin': 'https://www.instagram.com',
        'Referer': 'https://www.instagram.com/',
      },
      body: 'av=0&__d=www&__user=0&__a=1&__req=3&__hs=19734.HYP%3Ainstagram_web_pkg.2.1...&dpr=2&__ccg=EXCELLENT&__rev=1009050048&__s=zvqlv6%3Afxnm6z%3Ae24hmk&__hsi=7318087949012428025&__dyn=7xeUjG1mxu1syUbFp41twpUnwgU7SbzEdF8aUco2qwJyEiw9-2u3p4U2O4m85ildl0q&__csr=&__comet_req=7&fb_dtsg=&jazoest=&lsd=AVp2gEuM&__spin_r=1009050048&__spin_b=trunk&__spin_t=1702565935&fb_api_caller_class=RelayModern&fb_api_req_friendly_name=PolarisPostActionLoadPostQueryQuery&variables=' + encodeURIComponent(variables) + '&server_timestamps=true&doc_id=10015901848480474',
      signal: AbortSignal.timeout(10000)
    })

    // Read as text first, strip the for(;;); prefix that Instagram adds
    const text = await res.text()
    const jsonText = text.startsWith('for (;;)') ? text.substring(text.indexOf('{')) : text
    const data = JSON.parse(jsonText)

    // Try newer response structure first, fall back to older ones
    const media = data?.data?.xdt_shortcode_media ||
                  data?.data?.xdt_api__v1__media__shortcode__web_info?.items?.[0] ||
                  data?.data?.xdt_api__v1__media__shortcode__web_info?.media ||
                  data?.data?.shortcode_media

    if (!media) {
      console.log('No media in GraphQL response')
      return null
    }

    // Get video URL - try multiple possible field names
    const videoUrl = media.video_url ||
                    media.video_versions?.[0]?.url ||
                    media.video?.playable_url ||
                    media.playable_url

    const thumbnail = media.display_url ||
                     media.image_versions2?.candidates?.[0]?.url ||
                     media.thumbnail_src

    const title = media.edge_media_to_caption?.edges?.[0]?.node?.text ||
                 media.caption?.text ||
                 'Instagram Video'

    if (videoUrl) {
      console.log('GraphQL SUCCESS - video URL found')
      return { videoUrl, thumbnail, title }
    }
  } catch (e) {
    console.log('GraphQL failed:', e.message)
  }
  return null
}

// Method 4: Instagram oEmbed API
async function fetchViaOEmbed(url) {
  console.log('Trying oEmbed API')
  try {
    const oembedUrl = 'https://graph.facebook.com/v18.0/instagram_oembed?url=' + encodeURIComponent(url) + '&maxwidth=640&fields=thumbnail_url,title,html&access_token=&format=json'
    const res = await fetchWithProxy(oembedUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(8000)
    })
    const data = await res.json()
    if (data.thumbnail_url) {
      console.log('oEmbed got thumbnail')
      return { videoUrl: null, thumbnail: data.thumbnail_url, title: data.title }
    }
  } catch (e) {
    console.log('oEmbed failed:', e.message)
  }
  return null
}

// Method 5: Scrape HTML with multiple UAs
async function fetchViaHtml(cleanUrl) {
  console.log('Trying HTML scrape')
  const userAgents = [
    'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
    'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    'Twitterbot/1.0',
  ]

  for (const ua of userAgents) {
    try {
      const res = await fetchWithProxy(cleanUrl, {
        headers: {
          'User-Agent': ua,
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        signal: AbortSignal.timeout(12000)
      })
      const html = await res.text()

      // Try all video URL patterns
      const videoPatterns = [
        /<meta property="og:video(?::(?:url|secure_url))?" content="([^"]+)"/,
        /<meta content="([^"]+)" property="og:video(?::(?:url|secure_url))?"/,
        /"video_url":"(https:[^"]+)"/,
        /"playable_url":"(https:[^"]+)"/,
        /"contentUrl":"(https:[^"]+)"/,
        /(https:\/\/[^"'\s\\]*cdn[^"'\s\\]*\.mp4[^"'\s\\]*)/i,
      ]

      for (const pattern of videoPatterns) {
        const m = html.match(pattern)
        if (m) {
          const videoUrl = decodeHtml(m[1])
          console.log('HTML scrape found video:', videoUrl.substring(0, 80))
          const imgMatch = html.match(/<meta property="og:image" content="([^"]+)"/) ||
                          html.match(/<meta content="([^"]+)" property="og:image"/)
          const thumbnail = imgMatch ? decodeHtml(imgMatch[1]) : null
          return { videoUrl, thumbnail, title: null }
        }
      }

      // At least get thumbnail
      const imgMatch = html.match(/<meta property="og:image" content="([^"]+)"/) ||
                      html.match(/<meta content="([^"]+)" property="og:image"/)
      if (imgMatch) {
        return { videoUrl: null, thumbnail: decodeHtml(imgMatch[1]), title: null }
      }
    } catch (e) {
      console.log('HTML scrape UA failed:', e.message)
    }
  }
  return null
}

async function getInstagramMedia(url) {
  const { cleanUrl, shortcode, type } = cleanInstagramUrl(url)

  // Try embed page first - this is the most reliable from server IPs
  if (shortcode) {
    const result = await fetchViaEmbedPage(shortcode)
    if (result && result.videoUrl) return result
  }

  // Try __a=1 endpoint second (simple JSON endpoint)
  if (shortcode) {
    const result = await fetchViaA1Endpoint(shortcode)
    if (result && result.videoUrl) return result
  }

  // Try GraphQL API (with for(;;); handling)
  if (shortcode) {
    const result = await fetchViaGraphQL(shortcode)
    if (result && result.videoUrl) return result
  }

  // Try HTML scraping with bot UAs
  const htmlResult = await fetchViaHtml(cleanUrl)
  if (htmlResult && htmlResult.videoUrl) return htmlResult

  // At least return thumbnail if we have it
  if (htmlResult && htmlResult.thumbnail) return htmlResult

  // Final fallback: oEmbed for thumbnail
  if (shortcode) {
    const oembedResult = await fetchViaOEmbed(cleanUrl)
    if (oembedResult) return oembedResult
  }

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
        console.log('Download: ' + status + ' type: ' + contentType + ' size: ' + remoteRes.headers['content-length'])
        if ([301, 302, 303, 307, 308].includes(status)) {
          const location = remoteRes.headers.location
          if (!location) return reject(new Error('No redirect location'))
          remoteRes.resume()
          return attempt(location.startsWith('http') ? location : urlObj.protocol + '//' + urlObj.hostname + location, redirectCount + 1)
        }
        if (status !== 200) { remoteRes.resume(); return reject(new Error('HTTP ' + status)) }
        const fileStream = createWriteStream(destPath)
        let bytes = 0
        remoteRes.on('data', c => { bytes += c.length })
        remoteRes.pipe(fileStream)
        fileStream.on('finish', () => { fileStream.close(); console.log('Downloaded: ' + bytes + ' bytes'); resolve({ bytes, contentType }) })
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

  if (thumb === '1') {
    const cached = cache.get(url)
    if (cached?.data?.thumbnail) return proxyImage(cached.data.thumbnail, res)
    const result = await getInstagramMedia(url)
    if (result?.thumbnail) return proxyImage(result.thumbnail, res)
    return res.status(404).json({ error: 'No thumbnail' })
  }

  if (formatId) {
    const isAudio = type === 'audio'
    const safeTitle = (title || 'instagram-video').replace(/[^a-zA-Z0-9\s_-]/g, '').replace(/\s+/g, '-').substring(0, 40) || 'instagram-video'
    const ext = isAudio ? 'mp3' : 'mp4'
    const filename = safeTitle + '.' + ext
    const tempPath = join(TMP_DIR, 'ig-' + Date.now() + '-' + Math.random().toString(36).slice(2) + '.' + ext)

    try {
      let videoUrl = null
      const cached = cache.get(url)
      if (cached?.data?.videoUrl) {
        videoUrl = cached.data.videoUrl
        console.log('Using cached video URL')
      } else {
        const result = await getInstagramMedia(url)
        videoUrl = result?.videoUrl
      }

      if (!videoUrl) return res.status(500).json({ error: 'Could not find video. Post may be private or photo-only.' })

      await downloadFileToDisk(videoUrl, tempPath)
      if (!existsSync(tempPath)) throw new Error('File not created')
      const stat = statSync(tempPath)
      if (stat.size < 10000) {
        try { unlinkSync(tempPath) } catch (e) {}
        return res.status(500).json({ error: 'File too small. Try again.' })
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
    if (cached && Date.now() - cached.time < CACHE_TTL) return res.json(cached.data)

    const result = await getInstagramMedia(url)
    const igMatch = url.match(/\/(reel|p|tv)\/([A-Za-z0-9_-]+)/)
    const igId = igMatch ? igMatch[2] : 'post'
    const igType = igMatch ? igMatch[1] : 'video'
    const autoTitle = result?.title || (igType === 'reel' ? 'Instagram Reel ' + igId : 'Instagram Post ' + igId)

    let data = {}
    if (result?.videoUrl) {
      data = {
        title: autoTitle, thumbnail: result.thumbnail,
        videoUrl: result.videoUrl, duration: 0,
        videos: [{ quality: 'HD', format_id: 'hd', ext: 'mp4', filesize: null }],
        audio: [{ quality: 'MP3', format_id: 'mp3', ext: 'mp3', filesize: null }]
      }
    } else if (result?.thumbnail) {
      data = { title: autoTitle, thumbnail: result.thumbnail, videoUrl: null, duration: 0, videos: [], audio: [], isPhotoOnly: true }
    } else {
      return res.status(500).json({ error: 'Could not fetch info. Post may be private.' })
    }

    cache.set(url, { data, time: Date.now() })
    return res.json(data)
  } catch (err) {
    console.error('Error:', err.message)
    return res.status(500).json({ error: 'Failed to process. Try again.' })
  }
}