'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MobileMenu } from './MobileMenu'

const navLinks = [
  { href: '/app', label: 'App' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/history', label: 'History' },
]

export function Navigation() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Don't show nav on landing page
  if (pathname === '/') return null

  return (
    <>
      <nav className="fb-nav">
        <div className="fb-nav-inner">
          <Link href="/" className="fb-nav-logo">
            <div className="fb-nav-logo-icon">F</div>
            <span className="fb-nav-logo-text">FLASHBETS</span>
          </Link>

          <div className="fb-nav-links">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`fb-nav-link ${pathname === link.href ? 'active' : ''}`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <button
            className="fb-nav-mobile-btn"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
      </nav>

      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        currentPath={pathname}
        links={navLinks}
      />
    </>
  )
}
