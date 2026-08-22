import Document, { Html, Head, Main, NextScript } from 'next/document'

export default class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          {/* Favicon */}
          <link rel="icon" href="/favicon.ico" sizes="any" />
          <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
          <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
          <link rel="manifest" href="/site.webmanifest" />

          {/* Theme color for mobile browser chrome */}
          <meta name="theme-color" content="#e1306c" />

          {/* Open Graph defaults */}
          <meta property="og:site_name" content="ReelSnap" />
          <meta property="og:image" content="https://reelsnap.app/og-image.png" />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />
          <meta property="og:image:alt" content="ReelSnap - Instagram Video Downloader" />

          {/* Twitter / Google */}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="ReelSnap - Instagram Video Downloader" />
          <meta name="twitter:description" content="Download and convert Instagram Reels, Videos, Stories to MP4 for free. No login required." />
          <meta name="twitter:image" content="https://reelsnap.app/og-image.png" />
          <meta name="twitter:image:alt" content="ReelSnap - Instagram Video Downloader" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}