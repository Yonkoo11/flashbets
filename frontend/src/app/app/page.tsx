'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useAccount } from 'wagmi'
import { BettingInterfaceV2 } from '@/components/BettingInterfaceV2'
import { useMarket } from '@/hooks/useMarket'
import { useWallet } from '@/hooks/useWallet'
import type { BetDirection } from '@/types'

/**
 * AppPage — wires on-chain state (useMarket, useWallet) to the BettingInterfaceV2 UI.
 *
 * Lifecycle management:
 *   - startNewMarket: called once on mount if no active round (Inactive/Resolved).
 *   - lockMarket:     called automatically when secondsRemaining ≤ 10 and status is ACTIVE.
 *   - resolveMarket:  called automatically when secondsRemaining === 0 and status is LOCKED.
 *
 * All three are time-guarded in the contract, so calling them early just reverts — harmless.
 * The local timer in BettingInterfaceV2 is cosmetic; authoritative time comes from the chain.
 */
export default function AppPage() {
  const { address } = useAccount()
  const wallet   = useWallet()
  const market   = useMarket()

  // Track whether we've already fired a lifecycle tx to avoid hammering the RPC.
  const lockFired    = useRef(false)
  const resolveFired = useRef(false)
  const startFired   = useRef(false)

  // Reset flags when a new round begins
  useEffect(() => {
    lockFired.current    = false
    resolveFired.current = false
  }, [market.currentRoundId])

  // Auto-start a round if chain has no active market
  useEffect(() => {
    if (
      !startFired.current &&
      (market.status === 'INACTIVE' || market.status === 'RESOLVED') &&
      !market.isTxPending
    ) {
      startFired.current = true
      market.startNewMarket().catch(() => {
        // If it reverts (race: another tx already started it) just wait for next poll
        startFired.current = false
      })
    }
  }, [market.status]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-lock when entering last-10-second window
  useEffect(() => {
    if (
      !lockFired.current &&
      market.status === 'ACTIVE' &&
      market.secondsRemaining <= 10 &&
      market.secondsRemaining > 0 &&
      !market.isTxPending
    ) {
      lockFired.current = true
      market.lockMarket().catch(() => {
        lockFired.current = false
      })
    }
  }, [market.status, market.secondsRemaining]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-resolve when round time is up
  useEffect(() => {
    if (
      !resolveFired.current &&
      market.status === 'LOCKED' &&
      market.secondsRemaining === 0 &&
      !market.isTxPending
    ) {
      resolveFired.current = true
      market.resolveMarket()
        .then(() => {
          // After resolve: refresh so UI picks up new round state
          setTimeout(market.refetchMarket, 2000)
          // Reset start flag so next round auto-starts
          startFired.current = false
        })
        .catch(() => {
          resolveFired.current = false
        })
    }
  }, [market.status, market.secondsRemaining]) // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Adapter callbacks (contract → BettingInterfaceV2 prop shape) ----

  const handleConnect = useCallback(async () => {
    // RainbowKit's ConnectButton manages the connection modal.
    // This callback is a no-op: connection happens via the ConnectButton we
    // render inside the interface (see BettingInterfaceV2 connectButton prop).
  }, [])

  const handleDisconnect = useCallback(() => {
    // Handled by RainbowKit's ConnectButton internally.
  }, [])

  const handlePlaceBet = useCallback(async (direction: BetDirection, amountEth: number): Promise<boolean> => {
    try {
      await market.placeBet(direction === 'UP', amountEth.toString())
      setTimeout(market.refetchMarket, 3000)
      return true
    } catch (err) {
      console.error('placeBet failed:', err)
      return false
    }
  }, [market])

  // startPrice is ignored — Chainlink supplies price on-chain
  const handleStartMarket = useCallback(async (_startPrice: number): Promise<boolean> => {
    try {
      await market.startNewMarket()
      setTimeout(market.refetchMarket, 3000)
      return true
    } catch (err) {
      console.error('startNewMarket failed:', err)
      return false
    }
  }, [market])

  const handleLockMarket = useCallback(async (): Promise<boolean> => {
    try {
      await market.lockMarket()
      setTimeout(market.refetchMarket, 2000)
      return true
    } catch (err) {
      console.error('lockMarket failed:', err)
      return false
    }
  }, [market])

  // endPrice is ignored — Chainlink supplies price on-chain
  const handleResolveMarket = useCallback(async (_endPrice: number): Promise<boolean> => {
    try {
      await market.resolveMarket()
      setTimeout(market.refetchMarket, 2000)
      startFired.current = false
      return true
    } catch (err) {
      console.error('resolveMarket failed:', err)
      return false
    }
  }, [market])

  const handleClaimWinnings = useCallback(async () => {
    await market.claimWinnings(market.currentRoundId)
    setTimeout(() => {
      market.refetchMarket()
      wallet.refetchBalance()
    }, 2000)
  }, [market, wallet])

  // ---- Derived market prop ----
  // BettingInterfaceV2 expects a typed market shape or null.
  const marketProp = market.status !== 'INACTIVE'
    ? {
        roundId:    Number(market.currentRoundId),
        startPrice: 0,           // display price comes from usePrice (CoinGecko), not this field
        status:     market.status,
        upPool:     market.upPool,
        downPool:   market.downPool,
        totalPool:  market.totalPool,
        upOdds:     market.upOdds,
        downOdds:   market.downOdds,
      }
    : null

  // User bet, derived from on-chain state
  const userBetProp = market.hasActiveBet && market.userBetDirection
    ? {
        direction:       market.userBetDirection,
        amount:          market.userBetAmount,
        // Estimate potential payout from current odds (pre-resolve)
        potentialPayout: market.userBetAmount * (
          market.userBetDirection === 'UP' ? market.upOdds : market.downOdds
        ),
      }
    : null

  return (
    <BettingInterfaceV2
      isConnected={wallet.isConnected}
      walletAddress={address}
      balance={parseFloat(wallet.contractBalance)}
      market={marketProp}
      userBet={userBetProp}
      loading={market.isTxPending}
      secondsRemainingFromChain={market.secondsRemaining}
      onConnect={handleConnect}
      onDisconnect={handleDisconnect}
      onPlaceBet={handlePlaceBet}
      onStartMarket={handleStartMarket}
      onLockMarket={handleLockMarket}
      onResolveMarket={handleResolveMarket}
      onClaimWinnings={handleClaimWinnings}
      onRefresh={market.refetchMarket}
    />
  )
}
