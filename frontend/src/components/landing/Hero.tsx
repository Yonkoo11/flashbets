'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

function useLiveCountdown() {
  const [seconds, setSeconds] = useState(47)

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds(s => s <= 1 ? 60 : s - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  return seconds
}

export function Hero() {
  const [mounted, setMounted] = useState(false)
  const liveSeconds = useLiveCountdown()

  useEffect(() => {
    setMounted(true)
  }, [])

  const urgency = liveSeconds <= 10 ? 'critical' : liveSeconds <= 30 ? 'warning' : 'calm'

  return (
    <section className="fb-hero">
      <div className="fb-hero-pulse" />

      <div className={`fb-hero-content ${mounted ? 'visible' : ''}`}>
        {/* Countdown ring */}
        <div className={`fb-hero-countdown ${urgency}`}>
          <div className="fb-hero-countdown-ring">
            <svg viewBox="0 0 100 100">
              <circle
                cx="50" cy="50" r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                opacity="0.15"
              />
              <circle
                cx="50" cy="50" r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray={`${(liveSeconds / 60) * 283} 283`}
                transform="rotate(-90 50 50)"
                className="fb-hero-countdown-progress"
              />
            </svg>
          </div>
          <div className="fb-hero-countdown-value">
            {String(liveSeconds).padStart(2, '0')}
          </div>
        </div>

        <h1 className="fb-hero-headline">
          60-Second Predictions
        </h1>

        <p className="fb-hero-subhead">
          Bet on BTC price movement. Instant settlement on Base.
        </p>

        <Link href="/app" className="fb-hero-cta">
          Start Trading
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </section>
  )
}
