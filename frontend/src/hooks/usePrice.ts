'use client'

import { useEffect, useState, useCallback } from 'react'
import { useReadContract, useChainId } from 'wagmi'
import { FLASHBETS_ABI, FLASHBETS_ADDRESS } from '@/lib/contract'

interface PriceState {
  price: number | null
  change: number | null
  loading: boolean
  error: string | null
  lastUpdated: Date | null
  source: 'chainlink' | 'coingecko' | null
}

// Chainlink BTC/USD feed has 8 decimals
const CHAINLINK_DECIMALS = 1e8

// Fetch 24h change directly from CoinGecko — no proxy needed, they support CORS
async function fetch24hChange(): Promise<number | null> {
  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true',
      { cache: 'no-store' }
    )
    if (!res.ok) return null
    const data = await res.json()
    return data?.bitcoin?.usd_24h_change ?? null
  } catch {
    return null
  }
}

export function usePrice(refreshInterval = 5000) {
  const chainId = useChainId()
  const contractAddress = FLASHBETS_ADDRESS[chainId as keyof typeof FLASHBETS_ADDRESS]
  const hasContract = contractAddress && contractAddress !== '0x0000000000000000000000000000000000000000'

  const [change, setChange] = useState<number | null>(null)
  const [cgLoading, setCgLoading] = useState(false)

  // On-chain Chainlink price via contract
  const {
    data: btcPriceData,
    isLoading: chainlinkLoading,
    error: chainlinkError,
    refetch: refetchChainlink,
  } = useReadContract({
    address: hasContract ? contractAddress : undefined,
    abi: FLASHBETS_ABI,
    functionName: 'getBtcPrice',
    query: {
      enabled: !!hasContract,
      refetchInterval: refreshInterval,
    },
  })

  // 24h change from CoinGecko (secondary, non-critical)
  const fetch24h = useCallback(async () => {
    setCgLoading(true)
    const c = await fetch24hChange()
    setChange(c)
    setCgLoading(false)
  }, [])

  useEffect(() => {
    fetch24h()
    const id = setInterval(fetch24h, 60_000) // refresh every minute
    return () => clearInterval(id)
  }, [fetch24h])

  // If no contract (mainnet not deployed), fall back to CoinGecko for price too
  const [cgPrice, setCgPrice] = useState<number | null>(null)
  const fetchCgPrice = useCallback(async () => {
    if (hasContract) return
    try {
      const res = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd',
        { cache: 'no-store' }
      )
      if (!res.ok) return
      const data = await res.json()
      setCgPrice(data?.bitcoin?.usd ?? null)
    } catch {
      // ignore
    }
  }, [hasContract])

  useEffect(() => {
    fetchCgPrice()
    if (!hasContract) {
      const id = setInterval(fetchCgPrice, refreshInterval)
      return () => clearInterval(id)
    }
  }, [fetchCgPrice, hasContract, refreshInterval])

  // Derive final price state
  let price: number | null = null
  let source: PriceState['source'] = null

  if (hasContract && btcPriceData) {
    // btcPriceData[0] = price (int256), btcPriceData[1] = updatedAt (uint256)
    price = Number(btcPriceData[0]) / CHAINLINK_DECIMALS
    source = 'chainlink'
  } else if (!hasContract && cgPrice !== null) {
    price = cgPrice
    source = 'coingecko'
  }

  const loading = hasContract ? chainlinkLoading : cgLoading
  const error = hasContract && chainlinkError ? 'Failed to fetch Chainlink price' : null

  const refetch = useCallback(() => {
    if (hasContract) {
      refetchChainlink()
    } else {
      fetchCgPrice()
    }
    fetch24h()
  }, [hasContract, refetchChainlink, fetchCgPrice, fetch24h])

  return {
    price,
    change,
    loading,
    error,
    lastUpdated: price !== null ? new Date() : null,
    source,
    refetch,
  }
}
