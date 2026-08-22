import Head from 'next/head'
import Navbar from '../components/Navbar'
import DownloadBox from '../components/DownloadBox'
import Footer from '../components/Footer'

const faqs = [
  {
    q: 'How to convert Instagram Reel to MP4?',
    a: 'Paste the Instagram Reel link into ReelSnap above and click Download. ReelSnap automatically converts the Reel to MP4 format and saves it to your device for free.'
  },
  {
    q: 'How to convert Instagram Reel to MP3?',
    a: 'Paste the Instagram Reel link into ReelSnap, click Download, then select the MP3 option. ReelSnap extracts and converts the audio to MP3 format instantly.'
  },
  {
    q: 'Can I convert Instagram Reels to MP4 on iPhone?',
    a: 'Yes! ReelSnap works on iPhone through the Safari browser. No app download needed. Just paste the link and convert your Reel to MP4 directly on your iPhone.'
  },
  {
    q: 'Is it free to convert Instagram Reels?',
    a: 'Yes, ReelSnap is completely free. Convert unlimited Instagram Reels to MP4 or MP3 with no fees, no registration, and no watermarks.'
  },
  {
    q: 'What quality is the converted MP4 file?',
    a: 'ReelSnap converts Instagram Reels to MP4 in the original quality up to HD 1080p. There is no quality loss during conversion.'
  },
  {
    q: 'How long does it take to convert an Instagram Reel?',
    a: 'ReelSnap converts Instagram Reels to MP4 in just 2-5 seconds. The conversion happens instantly on our servers.'
  },
  {
    q: 'Can I convert private Instagram Reels?',
    a: 'ReelSnap can only convert public Instagram Reels. For private accounts, you need to be following the account on Instagram.'
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
  name: 'Convert Instagram Reel to MP4 - ReelSnap',
  url: 'https://reelsnap.app/convert-instagram-reel',
  description: 'Convert Instagram Reels to MP4 or MP3 for free. Fast online Instagram Reel converter. No login required. Works on iPhone, Android, PC.',
  applicationCategory: 'UtilityApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }
}

export default function ConvertInstagramReel() {
  return (
    <>
      <Head>
        <title>Convert Instagram Reel to MP4 Free Online | ReelSnap</title>
        <meta name="description" content="Convert Instagram Reels to MP4 or MP3 for free online. Fast, easy Instagram Reel converter with no watermark. No login required. Works on iPhone, Android and PC." />
        <meta name="keywords" content="convert instagram reel to mp4, instagram reel converter, convert reel to mp4, instagram reel to mp4, convert instagram video, reel converter online" />
        <link rel="canonical" href="https://reelsnap.app/convert-instagram-reel" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaFAQ) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaWebApp) }} />
      </Head>
      <Navbar />
      <main>
        <section className="hero">
          <h1>Convert Instagram Reel to MP4</h1>
          <p>Free online Instagram Reel converter. Convert any Instagram Reel to MP4 or MP3 in seconds. No login, no watermark.</p>
          <DownloadBox />
        </section>

        <section className="content-section">
          <div className="content-container">

            <h2>Instagram Reel to MP4 Converter Online Free</h2>
            <p>ReelSnap is the fastest free online tool to convert Instagram Reels to MP4. Simply paste any Instagram Reel link and our converter instantly processes and downloads the video as a high quality MP4 file directly to your device.</p>
            <p>Our Instagram Reel converter works on all devices without any software installation. Convert Instagram Reels to MP4 on your iPhone, Android phone, Windows PC, or Mac with just one click.</p>

            <h2>How to Convert Instagram Reel to MP4</h2>
            <div className="steps-list">
              <div className="step-item">
                <div className="step-num">1</div>
                <div>
                  <strong>Copy the Instagram Reel link</strong>
                  <p>Open Instagram and find the Reel you want to convert. Tap the three-dot menu and select Copy link to copy the Reel URL.</p>
                </div>
              </div>
              <div className="step-item">
                <div className="step-num">2</div>
                <div>
                  <strong>Paste into ReelSnap converter</strong>
                  <p>Paste the copied Reel link into the input box above and click the Download button to start converting.</p>
                </div>
              </div>
              <div className="step-item">
                <div className="step-num">3</div>
                <div>
                  <strong>Download converted MP4 file</strong>
                  <p>Click the HD button to download the converted MP4 file or MP3 button to extract audio. Your file saves instantly.</p>
                </div>
              </div>
            </div>

            <h2>Convert Instagram Reel to MP3</h2>
            <p>ReelSnap can also convert Instagram Reels to MP3 audio files. This is perfect for saving music, podcast clips, or any audio from Instagram Reels. After pasting the Reel link and clicking Download, simply select the MP3 option to extract and convert the audio.</p>
            <p>The MP3 conversion is completely free with no quality loss. You get the original audio track from the Instagram Reel in high quality MP3 format.</p>

            <h2>Why Use ReelSnap to Convert Instagram Reels?</h2>
            <div className="features-grid">
              <div className="feature-item">
                <span>⚡</span>
                <div>
                  <strong>Instant Conversion</strong>
                  <p>Convert Instagram Reels to MP4 in just 2-5 seconds.</p>
                </div>
              </div>
              <div className="feature-item">
                <span>🎥</span>
                <div>
                  <strong>HD Quality MP4</strong>
                  <p>Convert to MP4 in original HD quality up to 1080p.</p>
                </div>
              </div>
              <div className="feature-item">
                <span>🚫</span>
                <div>
                  <strong>No Watermark</strong>
                  <p>Converted MP4 files have no watermark at all.</p>
                </div>
              </div>
              <div className="feature-item">
                <span>🎵</span>
                <div>
                  <strong>MP3 Extraction</strong>
                  <p>Convert Reel audio to MP3 with one click.</p>
                </div>
              </div>
              <div className="feature-item">
                <span>📱</span>
                <div>
                  <strong>All Devices</strong>
                  <p>Convert on iPhone, Android, Windows or Mac.</p>
                </div>
              </div>
              <div className="feature-item">
                <span>🆓</span>
                <div>
                  <strong>Always Free</strong>
                  <p>Convert unlimited Reels to MP4 for free forever.</p>
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

            <h2>Related Tools</h2>
            <div className="related-links">
              <a href="/instagram-reels-downloader">Instagram Reels Downloader</a>
              <a href="/instagram-story-downloader">Instagram Story Downloader</a>
              <a href="/instagram-photo-downloader">Instagram Photo Downloader</a>
            </div>

          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
