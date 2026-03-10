'use client'

import Link from 'next/link'
import { useEffect } from 'react'

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
  currentPath: string
  links: { href: string; label: string }[]
}

export function MobileMenu({ isOpen, onClose, currentPath, links }: MobileMenuProps) {
  // Lock body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  return (
    <div className={`fb-mobile-menu ${isOpen ? 'open' : ''}`}>
      <div className="fb-mobile-menu-header">
        <Link href="/" className="fb-nav-logo" onClick={onClose}>
          <div className="fb-nav-logo-icon">F</div>
          <span className="fb-nav-logo-text">FLASHBETS</span>
        </Link>
        <button
          className="fb-mobile-menu-close"
          onClick={onClose}
          aria-label="Close menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="fb-mobile-menu-links">
        <Link
          href="/"
          className={`fb-mobile-menu-link ${currentPath === '/' ? 'active' : ''}`}
          onClick={onClose}
        >
          Home
        </Link>
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`fb-mobile-menu-link ${currentPath === link.href ? 'active' : ''}`}
            onClick={onClose}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  )
}
