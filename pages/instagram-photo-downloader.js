import Head from 'next/head'
import Navbar from '../components/Navbar'
import DownloadBox from '../components/DownloadBox'
import Footer from '../components/Footer'

const faqs = [
  {
    q: 'How do I download Instagram photos?',
    a: 'Open Instagram and find the photo you want to download. Tap the three-dot menu and select Copy link. Paste the link into ReelSnap above and click Download.'
  },
  {
    q: 'Can I download Instagram carousel photos?',
    a: 'Yes! ReelSnap supports Instagram carousel posts with multiple photos in one post. All photos from the carousel will be available to download.'
  },
  {
    q: 'What format are downloaded Instagram photos saved in?',
    a: 'Instagram photos are downloaded in JPG format at their original resolution. ReelSnap preserves the original quality without any compression.'
  },
  {
    q: 'Can I download Instagram photos without the app?',
    a: 'Yes! ReelSnap works entirely in your browser. No app download or installation required. Works on any device with a web browser.'
  },
  {
    q: 'Can I download Instagram profile pictures?',
    a: 'ReelSnap supports downloading regular posts and Stories. For best results, use a public post link rather than a profile URL.'
  },
  {
    q: 'Is it safe to use ReelSnap to download photos?',
    a: 'Yes, ReelSnap is completely safe. We never ask for your Instagram password, never store your personal data, and never access your account.'
  },
]

const schemaFAQ = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map(function(f) {
    return {
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a }
    }
  })
}

const schemaWebApp = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Instagram Photo Downloader',
  url: 'https://reelsnap.app/instagram-photo-downloader',
  description: 'Free Instagram photo downloader. Save Instagram photos and carousel posts in original quality. No login required.',
  applicationCategory: 'UtilityApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }
}

export default function PhotoDownloader() {
  return (
    <>
      <Head>
        <title>Instagram Photo Downloader - Save Photos Free | ReelSnap</title>
        <meta name="description" content="Download Instagram photos and carousel posts in original quality for free. No login required. Fast Instagram photo downloader for iPhone, Android, and PC." />
        <meta name="keywords" content="instagram photo downloader, download instagram photos, save instagram photos, instagram image downloader, instagram picture downloader" />
        <link rel="canonical" href="https://reelsnap.app/instagram-photo-downloader" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaFAQ) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaWebApp) }} />
      </Head>
      <Navbar />
      <main>
        <section className="hero">
          <h1>Instagram Photo Downloader</h1>
          <p>Save Instagram photos and carousel posts in original quality. Free, fast, no login required.</p>
          <DownloadBox />
        </section>

        <section className="content-section">
          <div className="content-container">
            <h2>Download Instagram Photos in Original Quality</h2>
            <p>Instagram compresses photos when you try to screenshot them, resulting in lower quality images. ReelSnap downloads Instagram photos directly from Instagram servers in their original high resolution, giving you the best possible quality every time.</p>
            <p>Whether you want to save a beautiful travel photo, a recipe image, an inspirational quote, or any other public Instagram post, ReelSnap makes it effortless. No login, no app, no fees. Just paste the link and download.</p>

            <h2>How to Download Instagram Photos</h2>
            <div className="steps-list">
              <div className="step-item">
                <div className="step-num">1</div>
                <div>
                  <strong>Find the Instagram photo</strong>
                  <p>Open Instagram and navigate to the photo or carousel post you want to save. Tap the three-dot menu at the top right of the post.</p>
                </div>
              </div>
              <div className="step-item">
                <div className="step-num">2</div>
                <div>
                  <strong>Copy the post link</strong>
                  <p>Select Copy link from the dropdown menu. The post URL is now in your clipboard ready to paste.</p>
                </div>
              </div>
              <div className="step-item">
                <div className="step-num">3</div>
                <div>
                  <strong>Download with ReelSnap</strong>
                  <p>Paste the link into the box above and click Download. Your photo will be saved to your device in original quality.</p>
                </div>
              </div>
            </div>

            <h2>Features of ReelSnap Photo Downloader</h2>
            <div className="features-grid">
              <div className="feature-item">
                <span>🖼️</span>
                <div>
                  <strong>Original Quality</strong>
                  <p>Download photos in full resolution without any quality loss.</p>
                </div>
              </div>
              <div className="feature-item">
                <span>📸</span>
                <div>
                  <strong>Carousel Support</strong>
                  <p>Download all photos from multi-image carousel posts at once.</p>
                </div>
              </div>
              <div className="feature-item">
                <span>⚡</span>
                <div>
                  <strong>Instant Download</strong>
                  <p>Photos are downloaded instantly with no waiting time.</p>
                </div>
              </div>
              <div className="feature-item">
                <span>🔒</span>
                <div>
                  <strong>Safe and Secure</strong>
                  <p>We never ask for your Instagram password or personal data.</p>
                </div>
              </div>
              <div className="feature-item">
                <span>📱</span>
                <div>
                  <strong>All Platforms</strong>
                  <p>Works on iPhone, Android, Windows, Mac, and any browser.</p>
                </div>
              </div>
              <div className="feature-item">
                <span>🆓</span>
                <div>
                  <strong>Always Free</strong>
                  <p>No subscription, no watermarks, unlimited downloads.</p>
                </div>
              </div>
            </div>

            <h2>Frequently Asked Questions</h2>
            <div className="faq-list">
              {faqs.map(function(faq, i) {
                return (
                  <div key={i} className="faq-item">
                    <h3>{faq.q}</h3>
                    <p>{faq.a}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}