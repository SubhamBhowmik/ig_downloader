import Head from 'next/head'
import Navbar from '../components/Navbar'
import DownloadBox from '../components/DownloadBox'
import Footer from '../components/Footer'

const faqs = [
  {
    q: 'How do I download Instagram Reels?',
    a: 'Open Instagram, find the Reel you want to download, tap the three-dot menu and select Copy link. Then paste the link into ReelSnap above and click Download.'
  },
  {
    q: 'Can I download Instagram Reels without an account?',
    a: 'Yes! ReelSnap lets you download any public Instagram Reel without logging in or creating an account. Just paste the link and download.'
  },
  {
    q: 'Is it free to download Instagram Reels?',
    a: 'Yes, ReelSnap is completely free to use. There are no hidden fees, subscriptions, or limits on how many Reels you can download.'
  },
  {
    q: 'Can I download Instagram Reels on iPhone?',
    a: 'Yes! ReelSnap works on all devices including iPhone, iPad, Android, Windows, and Mac. No app download required, just use your browser.'
  },
  {
    q: 'What quality are downloaded Instagram Reels?',
    a: 'ReelSnap downloads Reels in the highest available quality, up to HD 1080p. The quality depends on the original video uploaded by the creator.'
  },
  {
    q: 'Can I download Reels with music?',
    a: 'Yes, downloaded Reels include the original audio track. You can also extract just the audio as an MP3 file using ReelSnap.'
  },
  {
    q: 'Is downloading Instagram Reels legal?',
    a: 'Downloading publicly available content for personal use is generally permitted. However, you should respect copyright and not redistribute content without the creator permission.'
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
  name: 'Instagram Reels Downloader',
  url: 'https://reelsnap.app/instagram-reels-downloader',
  description: 'Free Instagram Reels downloader. Download Instagram Reels in HD quality without watermark. No login required.',
  applicationCategory: 'UtilityApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }
}

export default function ReelsDownloader() {
  return (
    <>
      <Head>
        <title>Instagram Reels Downloader - Download Reels Free HD | ReelSnap</title>
        <meta name="description" content="Download Instagram Reels for free in HD quality. No watermark, no login required. Works on iPhone, Android, and PC. Fast and easy Instagram Reels downloader." />
        <meta name="keywords" content="instagram reels downloader, download instagram reels, reels downloader, instagram reel download, save instagram reels" />
        <link rel="canonical" href="https://reelsnap.app/instagram-reels-downloader" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaFAQ) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaWebApp) }} />
      </Head>
      <Navbar />
      <main>
        <section className="hero">
          <h1>Instagram Reels Downloader</h1>
          <p>Download Instagram Reels in HD quality for free. No watermark, no login, no app needed.</p>
          <DownloadBox />
        </section>

        <section className="content-section">
          <div className="content-container">
            <h2>Download Instagram Reels for Free</h2>
            <p>Instagram Reels are short, entertaining videos that have taken social media by storm. Whether you want to save a funny clip, keep a tutorial for offline viewing, or archive your favorite creator content, ReelSnap makes it incredibly easy to download Instagram Reels directly to your device, completely free.</p>
            <p>Unlike other downloaders that show you dozens of ads or redirect you to suspicious pages, ReelSnap is clean, fast, and straightforward. Paste the link, click download, and your Reel is saved in seconds.</p>

            <h2>How to Download Instagram Reels</h2>
            <div className="steps-list">
              <div className="step-item">
                <div className="step-num">1</div>
                <div>
                  <strong>Copy the Reel link</strong>
                  <p>Open the Instagram app or website. Find the Reel you want to download. Tap the three-dot menu and select Copy link.</p>
                </div>
              </div>
              <div className="step-item">
                <div className="step-num">2</div>
                <div>
                  <strong>Paste the link into ReelSnap</strong>
                  <p>Come back to this page and paste the copied link into the input box above. You can also tap the Paste button for convenience.</p>
                </div>
              </div>
              <div className="step-item">
                <div className="step-num">3</div>
                <div>
                  <strong>Click Download and save</strong>
                  <p>Click the Download button. ReelSnap will fetch the video and give you options to download in HD video or MP3 audio format.</p>
                </div>
              </div>
            </div>

            <h2>Why Use ReelSnap to Download Instagram Reels?</h2>
            <div className="features-grid">
              <div className="feature-item">
                <span>⚡</span>
                <div>
                  <strong>Lightning Fast</strong>
                  <p>Download Reels in seconds with our optimized servers.</p>
                </div>
              </div>
              <div className="feature-item">
                <span>🎥</span>
                <div>
                  <strong>HD Quality</strong>
                  <p>Get Reels in up to 1080p HD with no quality loss.</p>
                </div>
              </div>
              <div className="feature-item">
                <span>🚫</span>
                <div>
                  <strong>No Watermark</strong>
                  <p>Download clean videos without any watermark overlay.</p>
                </div>
              </div>
              <div className="feature-item">
                <span>🔒</span>
                <div>
                  <strong>No Login Needed</strong>
                  <p>No Instagram account required. Just paste and download.</p>
                </div>
              </div>
              <div className="feature-item">
                <span>📱</span>
                <div>
                  <strong>All Devices</strong>
                  <p>Works on iPhone, Android, Windows, Mac, and Linux.</p>
                </div>
              </div>
              <div className="feature-item">
                <span>🎵</span>
                <div>
                  <strong>Audio Extraction</strong>
                  <p>Extract just the audio from any Reel as an MP3 file.</p>
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