'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { usePrice } from '@/hooks/usePrice'

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price)
}

function formatChange(change: number): string {
  const sign = change >= 0 ? '+' : ''
  return `${sign}${change.toFixed(2)}%`
}

type FlashDirection = 'up' | 'down' | null

// Mini sparkline component
function Sparkline({ data, width = 200, height = 40 }: { data: number[]; width?: number; height?: number }) {
  if (data.length < 2) return null

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  // Normalize data to 0-1 range with padding
  const padding = 4
  const effectiveHeight = height - padding * 2

  const points = data.map((value, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - padding - ((value - min) / range) * effectiveHeight
    return `${x},${y}`
  }).join(' ')

  // Determine color based on trend
  const isUp = data[data.length - 1] >= data[0]
  const strokeColor = isUp ? '#22c55e' : '#ef4444'
  const gradientId = isUp ? 'sparkline-gradient-up' : 'sparkline-gradient-down'

  // Create area path for gradient fill
  const areaPath = `M0,${height} L${points.split(' ').map((p, i) => {
    const [x, y] = p.split(',')
    return `${x},${y}`
  }).join(' L')} L${width},${height} Z`

  return (
    <svg
      width={width}
      height={height}
      className="mx-auto"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="sparkline-gradient-up" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="sparkline-gradient-down" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Area fill */}
      <path
        d={areaPath}
        fill={`url(#${gradientId})`}
      />
      {/* Line */}
      <polyline
        points={points}
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Current point indicator */}
      <circle
        cx={width}
        cy={height - padding - ((data[data.length - 1] - min) / range) * effectiveHeight}
        r="3"
        fill={strokeColor}
        className="animate-pulse"
      />
    </svg>
  )
}

export function PriceDisplay() {
  const { price, change, loading, error, refetch } = usePrice(5000)
  const prevPriceRef = useRef<number | null>(null)
  const [flashDirection, setFlashDirection] = useState<FlashDirection>(null)
  const [priceHistory, setPriceHistory] = useState<number[]>([])

  // Track price history for sparkline (last 60 seconds / 12 data points at 5s intervals)
  useEffect(() => {
    if (price !== null) {
      setPriceHistory(prev => {
        const newHistory = [...prev, price]
        // Keep last 12 points (1 minute of data at 5s intervals)
        return newHistory.slice(-12)
      })
    }
  }, [price])

  // Detect price changes and trigger flash animation
  useEffect(() => {
    if (price !== null && prevPriceRef.current !== null) {
      if (price > prevPriceRef.current) {
        setFlashDirection('up')
      } else if (price < prevPriceRef.current) {
        setFlashDirection('down')
      }
      // Clear flash after animation
      const timer = setTimeout(() => setFlashDirection(null), 400)
      return () => clearTimeout(timer)
    }
    prevPriceRef.current = price
  }, [price])

  if (loading && price === null) {
    return (
      <div className="text-center mb-6 sm:mb-8">
        <div className="text-2xs uppercase tracking-widest text-text-muted mb-2 sm:mb-3">
          Bitcoin Price
        </div>
        <div className="skeleton h-10 sm:h-12 w-40 sm:w-48 mx-auto rounded-lg mb-2 sm:mb-3" />
        <div className="skeleton h-6 w-24 mx-auto rounded mb-3" />
        <div className="skeleton h-10 w-48 mx-auto rounded" />
      </div>
    )
  }

  if (error && price === null) {
    return (
      <div className="text-center mb-6 sm:mb-8" role="alert">
        <div className="text-2xs uppercase tracking-widest text-text-muted mb-2 sm:mb-3">
          Bitcoin Price
        </div>
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-bet-down/10 border border-bet-down/20 flex items-center justify-center">
          <svg className="w-6 h-6 text-bet-down" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div className="font-medium text-lg mb-1 text-bet-down">Failed to load price</div>
        <div className="text-text-secondary text-xs sm:text-sm mb-4">{error}</div>
        <button
          onClick={refetch}
          className="px-4 py-2 bg-card border border-card-border rounded-lg text-sm font-medium text-text-primary hover:bg-card-hover transition-[background-color] btn-press min-h-[44px]"
        >
          Try again
        </button>
      </div>
    )
  }

  const isPositive = (change ?? 0) >= 0

  // Flash animation classes
  const priceFlashClass = flashDirection === 'up'
    ? 'price-flash-up'
    : flashDirection === 'down'
      ? 'price-flash-down'
      : ''

  return (
    <div className="text-center mb-6 sm:mb-8" role="region" aria-label="Bitcoin price display">
      {/* Label */}
      <div className="text-2xs uppercase tracking-widest text-text-muted mb-2 sm:mb-3">
        Bitcoin Price
      </div>

      {/* Price with flash animation */}
      <div
        className={`font-mono text-3xl sm:text-5xl font-bold mb-2 sm:mb-3 tabular-nums transition-colors duration-150 ${priceFlashClass}`}
        aria-live="polite"
        aria-atomic="true"
      >
        {price !== null ? formatPrice(price) : '$0.00'}
      </div>

      {/* 24h Change badge */}
      <div
        className={`inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium transition-[background-color,color,border-color] duration-300 ${
          isPositive
            ? 'bg-bet-up/10 text-bet-up border border-bet-up/20'
            : 'bg-bet-down/10 text-bet-down border border-bet-down/20'
        }`}
        aria-label={`24 hour change: ${change !== null ? formatChange(change) : '0.00%'}`}
      >
        <span className={`text-2xs sm:text-xs ${isPositive ? 'animate-bounce-subtle' : ''}`} aria-hidden="true">
          {isPositive ? '▲' : '▼'}
        </span>
        <span className="tabular-nums">
          {change !== null ? formatChange(change) : '0.00%'}
        </span>
        <span className="text-2xs opacity-60">24h</span>
      </div>

      {/* Mini Sparkline Chart */}
      {priceHistory.length > 1 && (
        <div className="mt-4">
          <Sparkline data={priceHistory} width={200} height={40} />
          <div className="text-2xs text-text-muted mt-1">Last 60 seconds</div>
        </div>
      )}
    </div>
  )
}
