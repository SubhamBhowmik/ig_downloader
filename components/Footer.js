import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="footer">
      <p>&copy; {new Date().getFullYear()} <a href="/">ReelSnap</a> — Instagram Video Downloader. All rights reserved.</p>
      <p>
        <Link href="/privacy-policy">Privacy Policy</Link>
        {' '}&middot;{' '}
        <Link href="/terms-of-service">Terms of Service</Link>
        {' '}&middot;{' '}
        <Link href="/contact">Contact</Link>
        {' '}&middot;{' '}
        <a href="/sitemap.xml">Sitemap</a>
        {' '}&middot;{' '}
        Not affiliated with Instagram or Meta.
      </p>
    </footer>
  )
}