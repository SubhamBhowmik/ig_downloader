import Head from 'next/head'
import Navbar from '../components/Navbar'
import DownloadBox from '../components/DownloadBox'
import FeatureCards from '../components/FeatureCards'
import HowItWorks from '../components/HowItWorks'
import Footer from '../components/Footer'

export default function PhotoDownloader() {
  return (
    <>
      <Head>
        <title>Instagram Photo Downloader — Download Photos Free | IgVideoDownloader</title>
        <meta name="description" content="Download Instagram photos in high resolution for free. Save any photo from Instagram with no login." />
        <meta name="keywords" content="instagram photo downloader, download instagram photo, instagram image downloader" />
        <link rel="canonical" href="https://yoursite.com/instagram-photo-downloader" />
      </Head>

      <Navbar />

      <main>
        <section className="hero">
          <span className="badge">⚡ Free · No login · HD quality</span>
          <h1>Instagram Photo Downloader</h1>
          <p>Download Instagram photos in original quality. Save any image from Instagram for free.</p>
          <DownloadBox />
        </section>

        <FeatureCards />
        <HowItWorks />
      </main>

      <Footer />
    </>
  )
}