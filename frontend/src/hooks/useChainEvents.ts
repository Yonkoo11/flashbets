'use client'

import { useEffect, useState, useCallback } from 'react'
import { usePublicClient, useChainId } from 'wagmi'
import { parseAbiItem } from 'viem'
import { formatEther } from 'viem'
import { FLASHBETS_ADDRESS } from '@/lib/contract'

// Earliest deployment block — Base Sepolia deploy. Mainnet deploy is block 43212798.
// Using the lower of the two so getLogs works for both chains.
const DEPLOY_BLOCK = 38714127n

export interface RoundHistory {
  roundId: bigint
  direction: 'UP' | 'DOWN'
  betAmount: number      // ETH
  payout: number | null  // ETH — null if lost / unclaimed
  outcome: 'win' | 'loss' | 'pending'
  timestamp: number      // unix seconds (from block, approx)
}

export interface LeaderboardEntry {
  address: string
  totalBet: number    // ETH bet in
  totalPayout: number // ETH claimed out
  profit: number      // ETH payout - bet (losers subtract bet with no payout)
  wins: number
  totalBets: number
  winRate: number
}

export function useChainEvents() {
  const client = usePublicClient()
  const chainId = useChainId()
  const contractAddress = FLASHBETS_ADDRESS[chainId as keyof typeof FLASHBETS_ADDRESS]

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [lastFetched, setLastFetched] = useState<number | null>(null)

  const refresh = useCallback(async () => {
    if (!client || !contractAddress || contractAddress === '0x0000000000000000000000000000000000000000') return
    setLoading(true)
    try {
      const fromBlock = DEPLOY_BLOCK

      // Fetch all three event types in parallel
      const [betLogs, claimLogs] = await Promise.all([
        client.getLogs({
          address: contractAddress,
          event: parseAbiItem('event BetPlaced(uint256 indexed roundId, address indexed player, bool direction, uint256 amount)'),
          fromBlock,
          toBlock: 'latest',
        }),
        client.getLogs({
          address: contractAddress,
          event: parseAbiItem('event WinningsClaimed(uint256 indexed roundId, address indexed player, uint256 payout)'),
          fromBlock,
          toBlock: 'latest',
        }),
      ])

      // Build per-address aggregates for leaderboard
      const addrMap = new Map<string, { totalBet: number; totalPayout: number; wins: number; totalBets: number }>()

      for (const log of betLogs) {
        const { player, amount } = log.args as { player: string; amount: bigint }
        const addr = player.toLowerCase()
        const prev = addrMap.get(addr) ?? { totalBet: 0, totalPayout: 0, wins: 0, totalBets: 0 }
        addrMap.set(addr, {
          ...prev,
          totalBet: prev.totalBet + parseFloat(formatEther(amount)),
          totalBets: prev.totalBets + 1,
        })
      }

      for (const log of claimLogs) {
        const { player, payout } = log.args as { player: string; payout: bigint }
        const addr = player.toLowerCase()
        const prev = addrMap.get(addr) ?? { totalBet: 0, totalPayout: 0, wins: 0, totalBets: 0 }
        addrMap.set(addr, {
          ...prev,
          totalPayout: prev.totalPayout + parseFloat(formatEther(payout)),
          wins: prev.wins + 1,
        })
      }

      // Convert to sorted leaderboard
      const entries: LeaderboardEntry[] = Array.from(addrMap.entries())
        .map(([address, stats]) => ({
          address: address.slice(0, 6) + '...' + address.slice(-4),
          totalBet: stats.totalBet,
          totalPayout: stats.totalPayout,
          profit: stats.totalPayout - stats.totalBet,
          wins: stats.wins,
          totalBets: stats.totalBets,
          winRate: stats.totalBets > 0 ? Math.round((stats.wins / stats.totalBets) * 100) : 0,
        }))
        .sort((a, b) => b.profit - a.profit)

      setLeaderboard(entries)
      setLastFetched(Date.now())
    } catch (err) {
      console.error('Failed to fetch chain events:', err)
    } finally {
      setLoading(false)
    }
  }, [client, contractAddress])

  useEffect(() => {
    refresh()
    // Refresh every 30 seconds
    const id = setInterval(refresh, 30_000)
    return () => clearInterval(id)
  }, [refresh])

  return { leaderboard, loading, refresh, lastFetched }
}

// Per-player history for the connected wallet
export function usePlayerHistory(playerAddress?: string) {
  const client = usePublicClient()
  const chainId = useChainId()
  const contractAddress = FLASHBETS_ADDRESS[chainId as keyof typeof FLASHBETS_ADDRESS]

  const [history, setHistory] = useState<RoundHistory[]>([])
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!client || !contractAddress || contractAddress === '0x0000000000000000000000000000000000000000') return
    if (!playerAddress) { setHistory([]); return }

    setLoading(true)
    try {
      const fromBlock = DEPLOY_BLOCK
      const addr = playerAddress as `0x${string}`

      const [betLogs, claimLogs, resolvedLogs] = await Promise.all([
        client.getLogs({
          address: contractAddress,
          event: parseAbiItem('event BetPlaced(uint256 indexed roundId, address indexed player, bool direction, uint256 amount)'),
          args: { player: addr },
          fromBlock,
          toBlock: 'latest',
        }),
        client.getLogs({
          address: contractAddress,
          event: parseAbiItem('event WinningsClaimed(uint256 indexed roundId, address indexed player, uint256 payout)'),
          args: { player: addr },
          fromBlock,
          toBlock: 'latest',
        }),
        client.getLogs({
          address: contractAddress,
          event: parseAbiItem('event MarketResolved(uint256 indexed roundId, int256 endPrice, bool outcome)'),
          fromBlock,
          toBlock: 'latest',
        }),
      ])

      // Build lookup maps
      const claimByRound = new Map<string, bigint>()
      for (const log of claimLogs) {
        const { roundId, payout } = log.args as { roundId: bigint; payout: bigint }
        claimByRound.set(roundId.toString(), payout)
      }

      const resolvedByRound = new Map<string, boolean>()
      for (const log of resolvedLogs) {
        const { roundId, outcome } = log.args as { roundId: bigint; outcome: boolean }
        resolvedByRound.set(roundId.toString(), outcome)
      }

      const rounds: RoundHistory[] = betLogs.map((log) => {
        const { roundId, direction, amount } = log.args as { roundId: bigint; direction: boolean; amount: bigint }
        const key = roundId.toString()
        const payout = claimByRound.get(key)
        const resolvedOutcome = resolvedByRound.get(key)

        let outcome: RoundHistory['outcome'] = 'pending'
        if (resolvedOutcome !== undefined) {
          const won = direction === resolvedOutcome
          outcome = won ? 'win' : 'loss'
        }

        return {
          roundId,
          direction: (direction ? 'UP' : 'DOWN') as 'UP' | 'DOWN',
          betAmount: parseFloat(formatEther(amount)),
          payout: payout !== undefined ? parseFloat(formatEther(payout)) : null,
          outcome,
          timestamp: Number(log.blockNumber) * 2, // Base ~2s blocks, rough approximation
        }
      }).reverse() // newest first

      setHistory(rounds)
    } catch (err) {
      console.error('Failed to fetch player history:', err)
    } finally {
      setLoading(false)
    }
  }, [client, contractAddress, playerAddress])

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, 30_000)
    return () => clearInterval(id)
  }, [refresh])

  return { history, loading, refresh }
}
