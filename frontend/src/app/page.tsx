'use client'

import { Hero } from '@/components/landing/Hero'
import { HowItWorks } from '@/components/landing/HowItWorks'
import { Features } from '@/components/landing/Features'
import { LiveStats } from '@/components/landing/LiveStats'
import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="fb-landing">
      <nav className="fb-landing-nav">
        <Link href="/" className="fb-nav-logo">
          <div className="fb-nav-logo-icon">F</div>
          <span className="fb-nav-logo-text">FLASHBETS</span>
        </Link>
        <Link href="/app" className="fb-landing-nav-cta">
          Launch App
        </Link>
      </nav>

      <Hero />
      <HowItWorks />
      <Features />
      <LiveStats />

      <footer className="fb-landing-footer">
        <p>Built on <a href="https://base.org" target="_blank" rel="noopener noreferrer">Base</a></p>
      </footer>
    </div>
  )
}
