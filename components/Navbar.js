import Link from 'next/link'

export default function Navbar() {
  return (
    <nav className="navbar">
      <Link href="/" className="logo">IgVideoDownloader</Link>
      <ul className="nav-links">
        <li><Link href="/">Home</Link></li>
        <li><Link href="/instagram-reels-downloader">Reels</Link></li>
        <li><Link href="/instagram-story-downloader">Stories</Link></li>
        <li><Link href="/instagram-photo-downloader">Photos</Link></li>
      </ul>
    </nav>
  )
}