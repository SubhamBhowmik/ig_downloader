import Head from 'next/head'
import Navbar from '../components/Navbar'
import DownloadBox from '../components/DownloadBox'
import Footer from '../components/Footer'

const faqs = [
  {
    q: 'How do I download Instagram Stories?',
    a: 'Open Instagram and find the Story. Tap the three-dot menu and select Copy link. Paste the link into ReelSnap and click Download.'
  },
  {
    q: 'Can I download someone else Instagram Story?',
    a: 'Yes, you can download any public Instagram Story using ReelSnap without needing to log in.'
  },
  {
    q: 'Do Instagram Stories expire after 24 hours?',
    a: 'Yes, Instagram Stories disappear after 24 hours unless saved as Highlights. Use ReelSnap to save Stories before they expire.'
  },
  {
    q: 'Can I download Instagram Story Highlights?',
    a: 'Yes! ReelSnap supports downloading Instagram Story Highlights. Just copy the link to the Highlight and paste it into ReelSnap.'
  },
  {
    q: 'Can I download Instagram Stories on iPhone?',
    a: 'Yes, ReelSnap works perfectly on iPhone and iPad through the Safari browser. No app download needed.'
  },
  {
    q: 'Is there a limit on how many Stories I can download?',
    a: 'No, ReelSnap has no limits. You can download as many Instagram Stories as you want, completely free.'
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
  name: 'Instagram Story Downloader',
  url: 'https://reelsnap.app/instagram-story-downloader',
  description: 'Free Instagram Story downloader. Save Instagram Stories before they disappear. No login required.',
  applicationCategory: 'UtilityApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }
}

export default function StoryDownloader() {
  return (
    <>
      <Head>
        <title>Instagram Story Downloader - Save Stories Free | ReelSnap</title>
        <meta name="description" content="Download Instagram Stories before they disappear. Free Instagram Story downloader with no login required. Works on iPhone, Android, and PC." />
        <meta name="keywords" content="instagram story downloader, download instagram stories, save instagram story, instagram stories download, story downloader" />
        <link rel="canonical" href="https://reelsnap.app/instagram-story-downloader" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaFAQ) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaWebApp) }} />
      </Head>
      <Navbar />
      <main>
        <section className="hero">
          <h1>Instagram Story Downloader</h1>
          <p>Save Instagram Stories before they disappear. Free, fast, and no login required.</p>
          <DownloadBox />
        </section>

        <section className="content-section">
          <div className="content-container">
            <h2>Save Instagram Stories Before They Disappear</h2>
            <p>Instagram Stories vanish after just 24 hours, making it easy to miss content you love. Whether it is a funny moment, an important announcement, a cooking tutorial, or a memory you want to keep, ReelSnap lets you download Instagram Stories instantly before they expire.</p>
            <p>Our Instagram Story downloader is completely free and requires no login. Simply copy the Story link from Instagram and paste it into ReelSnap. Your Story will be downloaded in its original quality within seconds.</p>

            <h2>How to Download Instagram Stories</h2>
            <div className="steps-list">
              <div className="step-item">
                <div className="step-num">1</div>
                <div>
                  <strong>Open the Instagram Story</strong>
                  <p>Find the Story you want to save on Instagram. Tap the three-dot menu in the bottom right corner of the Story.</p>
                </div>
              </div>
              <div className="step-item">
                <div className="step-num">2</div>
                <div>
                  <strong>Copy the Story link</strong>
                  <p>Select Copy link from the menu options. The Story URL is now copied to your clipboard.</p>
                </div>
              </div>
              <div className="step-item">
                <div className="step-num">3</div>
                <div>
                  <strong>Paste and download</strong>
                  <p>Paste the link into the box above and click Download. ReelSnap will save the Story to your device immediately.</p>
                </div>
              </div>
            </div>

            <h2>Why Download Instagram Stories with ReelSnap?</h2>
            <div className="features-grid">
              <div className="feature-item">
                <span>⏰</span>
                <div>
                  <strong>Save Before Expiry</strong>
                  <p>Stories disappear in 24 hours. ReelSnap saves them permanently to your device.</p>
                </div>
              </div>
              <div className="feature-item">
                <span>🖼️</span>
                <div>
                  <strong>Photos and Videos</strong>
                  <p>Download both photo Stories and video Stories in original quality.</p>
                </div>
              </div>
              <div className="feature-item">
                <span>⭐</span>
                <div>
                  <strong>Highlights Too</strong>
                  <p>Download Story Highlights that are saved on profiles permanently.</p>
                </div>
              </div>
              <div className="feature-item">
                <span>🔒</span>
                <div>
                  <strong>No Login Needed</strong>
                  <p>Download public Stories without any Instagram account.</p>
                </div>
              </div>
              <div className="feature-item">
                <span>📱</span>
                <div>
                  <strong>Mobile Friendly</strong>
                  <p>Works perfectly on iPhone and Android browsers.</p>
                </div>
              </div>
              <div className="feature-item">
                <span>💯</span>
                <div>
                  <strong>100% Free</strong>
                  <p>No subscriptions, no watermarks, no hidden fees.</p>
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