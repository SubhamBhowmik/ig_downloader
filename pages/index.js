import Head from 'next/head'
import Navbar from '../components/Navbar'
import DownloadBox from '../components/DownloadBox'
import FeatureCards from '../components/FeatureCards'
import HowItWorks from '../components/HowItWorks'
import Footer from '../components/Footer'

export default function Home() {
  return (
    <>
      <Head>
        <title>Instagram Video Downloader — Free & Fast | IgVideoDownloader</title>
        <meta name="description" content="Download Instagram videos, Reels, Stories and Photos for free. No login required. HD quality. Works on all devices." />
        <meta name="keywords" content="instagram video downloader, download instagram video, instagram reels downloader" />
        <link rel="canonical" href="https://yoursite.com/" />
      </Head>

      <Navbar />

      <main>
        <section className="hero">
          <span className="badge">⚡ Free · No login · HD quality</span>
          <h1>Instagram Video Downloader</h1>
          <p>Download Instagram videos, Reels, Stories and Photos in seconds.</p>
          <DownloadBox />
        </section>

        <FeatureCards />
        <HowItWorks />
      </main>

      <Footer />
    </>
  )
}