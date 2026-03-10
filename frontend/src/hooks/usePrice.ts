'use client'

import { useState, useEffect, useCallback } from 'react'
import { fetchBTCPrice } from '@/lib/api'

interface PriceState {
  price: number | null
  change: number | null
  loading: boolean
  error: string | null
  lastUpdated: Date | null
}

export function usePrice(refreshInterval = 5000) {
  const [state, setState] = useState<PriceState>({
    price: null,
    change: null,
    loading: true,
    error: null,
    lastUpdated: null,
  })

  const fetchPrice = useCallback(async () => {
    try {
      const { price, change } = await fetchBTCPrice()
      setState((prev) => ({
        ...prev,
        price,
        change,
        loading: false,
        error: null,
        lastUpdated: new Date(),
      }))
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch price',
      }))
    }
  }, [])

  useEffect(() => {
    // Fetch immediately on mount
    fetchPrice()

    // Set up interval for refreshing
    const interval = setInterval(fetchPrice, refreshInterval)

    return () => clearInterval(interval)
  }, [fetchPrice, refreshInterval])

  return {
    ...state,
    refetch: fetchPrice,
  }
}
