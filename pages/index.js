import Head from 'next/head'
import Navbar from '../components/Navbar'
import DownloadBox from '../components/DownloadBox'
import FeatureCards from '../components/FeatureCards'
import HowItWorks from '../components/HowItWorks'
import Footer from '../components/Footer'

const faqs = [
  {
    q: 'How to download Instagram Reels for free?',
    a: 'Copy the Instagram Reel link, paste it into ReelSnap above, and click Download. Your Reel will be saved in HD quality within seconds, completely free.'
  },
  {
    q: 'How to convert Instagram Reel to MP4?',
    a: 'Paste the Instagram Reel link into ReelSnap and click Download. ReelSnap automatically converts and downloads the Reel as an MP4 file to your device.'
  },
  {
    q: 'How to snap and save Instagram videos?',
    a: 'Open Instagram, tap the three-dot menu on any video, select Copy link, paste it into ReelSnap, and click Download to snap and save the video instantly.'
  },
  {
    q: 'Can I download Instagram Reels without watermark?',
    a: 'Yes! ReelSnap downloads Instagram Reels without any watermark. You get the original clean video exactly as uploaded by the creator.'
  },
  {
    q: 'How to download Instagram Reels on iPhone?',
    a: 'Open Safari on iPhone, go to reelsnap.app, paste the Instagram Reel link and tap Download. No app installation needed.'
  },
  {
    q: 'Is ReelSnap free to use?',
    a: 'Yes, ReelSnap is 100% free. No registration, no subscription, no hidden fees. Download unlimited Instagram videos for free.'
  },
  {
    q: 'Can I convert Instagram Reel to MP3?',
    a: 'Yes! ReelSnap can extract the audio from any Instagram Reel and save it as an MP3 file. Click the MP3 button after fetching the video.'
  },
  {
    q: 'What types of Instagram content can I download?',
    a: 'ReelSnap supports Instagram Videos, Reels, Stories, Highlights, IGTV and Photos from any public account.'
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
  name: 'ReelSnap - Instagram Video Downloader',
  url: 'https://reelsnap.app',
  description: 'Free Instagram video downloader. Download and convert Instagram Reels, Videos, Stories to MP4. No login required.',
  applicationCategory: 'UtilityApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }
}

export default function Home() {
  return (
    <>
      <Head>
        <title>Instagram Video Downloader - Free HD | ReelSnap</title>
        <meta name="google-site-verification" content="JHOhQq4YK5doBetkUREfJgItx8q_IVPDpdylrd0GyYM" />
        <meta name="description" content="Download and convert Instagram videos, Reels, Stories to MP4 for free. Snap and save Instagram videos in HD quality. No login required. Works on all devices." />
        <meta name="keywords" content="instagram video downloader, download instagram reels, convert instagram reel to mp4, snap instagram video, download reels free, instagram reels downloader" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://reelsnap.app/" />
        <meta property="og:title" content="Instagram Video Downloader - Free HD | ReelSnap" />
        <meta property="og:description" content="Download and convert Instagram Reels, Videos, Stories to MP4 and MP3 for free. No login, no watermark, HD quality." />
        <link rel="canonical" href="https://reelsnap.app/" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaFAQ) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaWebApp) }} />
      </Head>

      <Navbar />

      <main>
        <section className="hero">
          <span className="badge">⚡ Free · No login · HD quality</span>
          <h1>Instagram Video Downloader</h1>
          <p>Download and convert Instagram Reels, Videos, Stories and Photos in seconds. Free, fast, no login required.</p>
          <DownloadBox />
        </section>

        <FeatureCards />
        <HowItWorks />

        <section className="content-section">
          <div className="content-container">

            <h2>Convert Instagram Reels to MP4 Free</h2>
            <p>ReelSnap is the easiest way to convert Instagram Reels to MP4 and save them directly to your device. Whether you want to keep a funny clip, save a tutorial, or archive content from your favorite creator, ReelSnap converts any public Instagram Reel to MP4 in seconds.</p>
            <p>No software to install, no account to create. Just paste the Instagram Reel link and ReelSnap instantly converts and downloads it as a clean MP4 file without any watermark.</p>

            <h2>Snap and Save Instagram Videos Instantly</h2>
            <p>Snap and save any Instagram video with just one click. ReelSnap works on all devices including iPhone, Android, Windows and Mac. Simply copy the video link from Instagram, paste it into ReelSnap, and snap your video to your device in HD quality.</p>
            <p>ReelSnap supports all types of Instagram content. You can snap and save Instagram Reels, regular video posts, Stories, Highlights, and even extract MP3 audio from any Instagram video.</p>

            <h2>Download Reels Free in HD Quality</h2>
            <p>Download Reels free in the highest available quality up to 1080p HD. Unlike other tools that compress your videos, ReelSnap downloads the original video file directly from Instagram servers, giving you the best possible quality every time.</p>
            <p>Our Instagram Reels downloader is completely free with no limits. Download as many Reels as you want, as often as you want, without paying a single rupee.</p>

            <h2>How to Download Instagram Reels</h2>
            <div className="steps-list">
              <div className="step-item">
                <div className="step-num">1</div>
                <div>
                  <strong>Copy the Instagram link</strong>
                  <p>Open Instagram and find the Reel, video or Story you want to download. Tap the three-dot menu and select Copy link.</p>
                </div>
              </div>
              <div className="step-item">
                <div className="step-num">2</div>
                <div>
                  <strong>Paste into ReelSnap</strong>
                  <p>Paste the copied link into the input box above and click the Download button.</p>
                </div>
              </div>
              <div className="step-item">
                <div className="step-num">3</div>
                <div>
                  <strong>Save to your device</strong>
                  <p>Choose HD video or MP3 audio and save the file to your device instantly.</p>
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
