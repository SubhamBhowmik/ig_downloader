export default function Footer() {
  return (
    <footer className="footer">
      <p>&copy; {new Date().getFullYear()} <a href="/">IgVideoDownloader</a> — Instagram Video Downloader. All rights reserved.</p>
      <p>
        <a href="/sitemap.xml">Sitemap</a> &middot; Not affiliated with Instagram or Meta.
      </p>
    </footer>
  )
}