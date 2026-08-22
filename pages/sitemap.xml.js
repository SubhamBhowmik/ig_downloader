const SITE_URL = 'https://reelsnap.app'

const pages = [
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/instagram-reels-downloader', priority: '0.9', changefreq: 'weekly' },
  { path: '/instagram-story-downloader', priority: '0.9', changefreq: 'weekly' },
  { path: '/instagram-photo-downloader', priority: '0.9', changefreq: 'weekly' },
  { path: '/convert-instagram-reel', priority: '0.9', changefreq: 'weekly' },
  { path: '/privacy-policy', priority: '0.5', changefreq: 'monthly' },
  { path: '/terms-of-service', priority: '0.5', changefreq: 'monthly' },
  { path: '/contact', priority: '0.6', changefreq: 'monthly' },
]

function generateSiteMap() {
  return '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
    pages.map(function(p) {
      return '<url><loc>' + SITE_URL + p.path + '</loc><lastmod>' + new Date().toISOString().split('T')[0] + '</lastmod><changefreq>' + p.changefreq + '</changefreq><priority>' + p.priority + '</priority></url>'
    }).join('') +
    '</urlset>'
}

export default function Sitemap() {}

export async function getServerSideProps({ res }) {
  res.setHeader('Content-Type', 'text/xml')
  res.setHeader('Cache-Control', 'public, s-maxage=86400')
  res.write(generateSiteMap())
  res.end()
  return { props: {} }
}
