import Head from 'next/head'
import Navbar from '../components/Navbar'
import DownloadBox from '../components/DownloadBox'
import FeatureCards from '../components/FeatureCards'
import HowItWorks from '../components/HowItWorks'
import Footer from '../components/Footer'

export default function ReelsDownloader() {
  return (
    <>
      <Head>
        <title>Instagram Reels Downloader - Free HD | IgVideoDownloader</title>
        <meta name="description" content="Download Instagram Reels in HD quality for free. No login required. Fast and easy Reels downloader." />
        <meta name="keywords" content="instagram reels downloader, download reels, instagram reels video download" />
        <link rel="canonical" href="https://yoursite.com/instagram-reels-downloader" />
      </Head>

      <Navbar />

      <main>
        <section className="hero">
          <span className="badge">⚡ Free · No login · HD quality</span>
          <h1>Instagram Reels Downloader</h1>
          <p>Download Instagram Reels in seconds. Save any Reel to your device for free.</p>
          <DownloadBox />
        </section>

        <FeatureCards />
        <HowItWorks />
      </main>

      <Footer />
    </>
  )
}