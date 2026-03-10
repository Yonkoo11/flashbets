// API client for price data

export interface PriceApiResponse {
  price: number
  change: number
}

export async function fetchBTCPrice(): Promise<{ price: number; change: number }> {
  try {
    // Use local API route to avoid CORS issues
    const response = await fetch('/api/price', {
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error(`Price API error: ${response.status}`)
    }

    const data: PriceApiResponse = await response.json()

    return {
      price: data.price,
      change: data.change,
    }
  } catch (error) {
    console.error('Failed to fetch BTC price:', error)
    throw error
  }
}

// Retry wrapper for price fetching
export async function fetchBTCPriceWithRetry(
  maxRetries = 3,
  delayMs = 1000
): Promise<{ price: number; change: number }> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fetchBTCPrice()
    } catch (error) {
      lastError = error as Error
      if (attempt < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs))
      }
    }
  }

  throw lastError
}
