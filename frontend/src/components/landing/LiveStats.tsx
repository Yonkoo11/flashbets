'use client'

import Link from 'next/link'

export function LiveStats() {
  return (
    <section className="fb-section fb-cta-section">
      <div className="fb-cta-content">
        <h2 className="fb-cta-title">Start Trading</h2>
        <p className="fb-cta-subtitle">
          Make your first prediction in under 60 seconds.
        </p>

        <Link href="/app" className="fb-cta-button">
          Open App
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </section>
  )
}
