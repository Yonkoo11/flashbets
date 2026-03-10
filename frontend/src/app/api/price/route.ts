import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const COINGECKO_API = 'https://api.coingecko.com/api/v3'

// Simple in-memory cache to avoid rate limiting
let cachedPrice: { price: number; change: number; timestamp: number } | null = null
const CACHE_DURATION_MS = 5000 // Cache for 5 seconds

export async function GET() {
  // Return cached data if still valid
  if (cachedPrice && Date.now() - cachedPrice.timestamp < CACHE_DURATION_MS) {
    return NextResponse.json({
      price: cachedPrice.price,
      change: cachedPrice.change,
      cached: true,
    })
  }

  try {
    const response = await fetch(
      `${COINGECKO_API}/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    )

    if (!response.ok) {
      // If rate limited but we have cached data, return it
      if (response.status === 429 && cachedPrice) {
        return NextResponse.json({
          price: cachedPrice.price,
          change: cachedPrice.change,
          cached: true,
        })
      }
      return NextResponse.json(
        { error: `CoinGecko API error: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()

    // Update cache
    cachedPrice = {
      price: data.bitcoin.usd,
      change: data.bitcoin.usd_24h_change || 0,
      timestamp: Date.now(),
    }

    return NextResponse.json({
      price: cachedPrice.price,
      change: cachedPrice.change,
      cached: false,
    })
  } catch (error) {
    console.error('Failed to fetch BTC price:', error)

    // Return cached data on error if available
    if (cachedPrice) {
      return NextResponse.json({
        price: cachedPrice.price,
        change: cachedPrice.change,
        cached: true,
      })
    }

    return NextResponse.json(
      { error: 'Failed to fetch BTC price' },
      { status: 500 }
    )
  }
}
