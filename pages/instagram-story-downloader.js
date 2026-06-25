import Head from 'next/head'
import Navbar from '../components/Navbar'
import DownloadBox from '../components/DownloadBox'
import FeatureCards from '../components/FeatureCards'
import HowItWorks from '../components/HowItWorks'
import Footer from '../components/Footer'

export default function StoryDownloader() {
  return (
    <>
      <Head>
        <title>Instagram Story Downloader — Download Stories Free | IgVideoDownloader</title>
        <meta name="description" content="Download Instagram Stories anonymously and for free. Save stories from any public account in HD." />
        <meta name="keywords" content="instagram story downloader, download instagram story, story saver" />
        <link rel="canonical" href="https://yoursite.com/instagram-story-downloader" />
      </Head>

      <Navbar />

      <main>
        <section className="hero">
          <span className="badge">⚡ Free · No login · HD quality</span>
          <h1>Instagram Story Downloader</h1>
          <p>Download Instagram Stories anonymously. Save stories from any public account instantly.</p>
          <DownloadBox />
        </section>

        <FeatureCards />
        <HowItWorks />
      </main>

      <Footer />
    </>
  )
}