'use client'

import { useCallback } from 'react'
import { useAccount } from 'wagmi'
import { BettingInterfaceV2 } from '@/components/BettingInterfaceV2'
import { useMarket } from '@/hooks/useMarket'
import { useWallet } from '@/hooks/useWallet'
import type { BetDirection } from '@/types'

/**
 * AppPage — wires on-chain state (useMarket, useWallet) to the BettingInterfaceV2 UI.
 *
 * Round lifecycle (start → lock → resolve) is handled by the keeper bot,
 * NOT by the frontend. The UI only reads state and places bets/claims.
 */
export default function AppPage() {
  const { address } = useAccount()
  const wallet   = useWallet()
  const market   = useMarket()

  const handleConnect = useCallback(async () => {}, [])
  const handleDisconnect = useCallback(() => {}, [])

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

  const handleClaimWinnings = useCallback(async () => {
    await market.claimWinnings(market.currentRoundId)
    setTimeout(() => {
      market.refetchMarket()
      wallet.refetchBalance()
    }, 2000)
  }, [market, wallet])

  // Build market prop from on-chain state
  const marketProp = market.status !== 'INACTIVE'
    ? {
        roundId:    Number(market.currentRoundId),
        startPrice: 0,
        status:     market.status,
        upPool:     market.upPool,
        downPool:   market.downPool,
        totalPool:  market.totalPool,
        upOdds:     market.upOdds,
        downOdds:   market.downOdds,
      }
    : null

  const userBetProp = market.hasActiveBet && market.userBetDirection
    ? {
        direction:       market.userBetDirection,
        amount:          market.userBetAmount,
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
      onClaimWinnings={handleClaimWinnings}
      onRefresh={market.refetchMarket}
    />
  )
}
