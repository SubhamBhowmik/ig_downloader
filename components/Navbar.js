import { useState } from 'react'
import Link from 'next/link'

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <nav className="navbar">
      <Link href="/" className="logo">ReelSnap</Link>
      
      <button 
        className="mobile-menu-btn"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label="Toggle menu"
      >
        <span className={`hamburger ${mobileMenuOpen ? 'open' : ''}`}>
          <span></span>
          <span></span>
          <span></span>
        </span>
      </button>

      <ul className={`nav-links ${mobileMenuOpen ? 'active' : ''}`}>
        <li><Link href="/" onClick={() => setMobileMenuOpen(false)}>Home</Link></li>
        <li><Link href="/instagram-reels-downloader" onClick={() => setMobileMenuOpen(false)}>Reels</Link></li>
        <li><Link href="/instagram-story-downloader" onClick={() => setMobileMenuOpen(false)}>Stories</Link></li>
        <li><Link href="/instagram-photo-downloader" onClick={() => setMobileMenuOpen(false)}>Photos</Link></li>
      </ul>
    </nav>
  )
}
