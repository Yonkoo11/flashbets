'use client'

import { useState, useEffect } from 'react'
import { PriceDisplay } from '@/components/PriceDisplay'
import { Timer } from '@/components/Timer'
import { TimeframeSelector } from '@/components/TimeframeSelector'
import { Leaderboard } from '@/components/Leaderboard'
import { ActivityFeed } from '@/components/ActivityFeed'
import { ResultDisplay } from '@/components/ResultDisplay'
import { useToast } from '@/components/Toast'
import { usePrice } from '@/hooks/usePrice'
import { useTimer } from '@/hooks/useTimer'
import { useHistory } from '@/hooks/useHistory'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { BetDirection, MarketStatus } from '@/types'

export interface BettingInterfaceProps {
  isConnected: boolean
  balance: number
  market: {
    roundId: number
    startPrice: number
    status: MarketStatus
    upPool: number
    downPool: number
    totalPool: number
    upOdds: number
    downOdds: number
  } | null
  userBet: {
    direction: BetDirection
    amount: number
    potentialPayout: number
  } | null
  loading: boolean
  mode: 'mock' | 'real'
  onConnect: () => Promise<void>
  onDisconnect: () => void
  onPlaceBet: (direction: BetDirection, amount: number) => Promise<boolean>
  onStartMarket: (startPrice: number) => Promise<boolean>
  onLockMarket: () => Promise<boolean>
  onResolveMarket: (endPrice: number) => Promise<boolean>
  onRefresh: () => void
}

export function BettingInterface({
  isConnected,
  balance,
  market,
  userBet,
  loading,
  mode,
  onConnect,
  onDisconnect,
  onPlaceBet,
  onStartMarket,
  onLockMarket,
  onResolveMarket,
  onRefresh,
}: BettingInterfaceProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [selectedDirection, setSelectedDirection] = useState<BetDirection | null>(null)
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [lastResult, setLastResult] = useState<{ userWon: boolean; profit: number } | null>(null)
  const [marketStarted, setMarketStarted] = useState(false)
  const [lastResultRound, setLastResultRound] = useState<number>(0)
  const [isBetting, setIsBetting] = useState(false)

  const price = usePrice()
  const timer = useTimer()
  const { history, addEntry } = useHistory()
  const { addToast } = useToast()

  // Market state helpers
  const marketStatus = market?.status ?? 'ACTIVE'
  const upOdds = market?.upOdds ?? 1.95
  const downOdds = market?.downOdds ?? 1.95
  const totalPool = market?.totalPool ?? 0
  const currentRound = market?.roundId ?? 1

  const handleConnect = async () => {
    if (isConnecting) return
    setIsConnecting(true)
    try {
      await onConnect()
      setWalletAddress('0xf86845...5405')
      addToast('Wallet connected successfully', 'success')
    } catch {
      addToast('Failed to connect wallet', 'error')
    }
    setIsConnecting(false)
  }

  const handleDisconnect = () => {
    onDisconnect()
    setWalletAddress(null)
  }

  // Format wallet address for display
  const displayAddress = walletAddress
    ? `${walletAddress.slice(0, 8)}...${walletAddress.slice(-4)}`
    : null

  // Handle market lifecycle based on timer
  useEffect(() => {
    if (!isConnected || !price.price) return

    // Start new market when timer begins and no active market
    if (timer.isActive && timer.secondsRemaining > 50 && (!market || market.status === 'RESOLVED') && !marketStarted) {
      setMarketStarted(true)
      onStartMarket(price.price).then(() => {
        setTimeout(onRefresh, 2000)
        setSelectedDirection(null)
        setSelectedAmount(null)
        setShowResult(false)
        setLastResult(null)
      })
    }

    // Reset marketStarted flag and clear result when market becomes active
    if (market?.status === 'ACTIVE') {
      setMarketStarted(false)
      setShowResult(false)
      setLastResult(null)
    }

    // Lock market when betting closes (10 seconds left)
    if (timer.isActive && timer.secondsRemaining <= 10 && timer.secondsRemaining > 5 && market?.status === 'ACTIVE') {
      onLockMarket().then(() => setTimeout(onRefresh, 2000))
    }

    // Resolve market when timer ends
    if (!timer.isActive && timer.secondsRemaining === 0 && market?.status === 'LOCKED') {
      const roundToResolve = market.roundId
      onResolveMarket(price.price).then(() => {
        setTimeout(() => {
          onRefresh()
          // Show result after refresh (only if we haven't shown for this round)
          if (userBet && lastResultRound !== roundToResolve) {
            const userWon = userBet.direction === (price.price! > market.startPrice ? 'UP' : 'DOWN')
            const profit = userWon ? userBet.potentialPayout - userBet.amount : -userBet.amount
            setLastResult({ userWon, profit })
            setShowResult(true)
            setLastResultRound(roundToResolve)
            addEntry({
              direction: userBet.direction,
              amount: userBet.amount,
              outcome: userWon ? 'WIN' : 'LOSS',
              profit,
            })
            // Show toast for result
            if (userWon) {
              addToast(`You won +${profit.toFixed(0)} tokens!`, 'success', 5000)
            } else {
              addToast(`You lost ${Math.abs(profit).toFixed(0)} tokens`, 'error', 5000)
            }
          }
        }, 2000)
      })
    }
  }, [timer.isActive, timer.secondsRemaining, price.price, market, userBet, isConnected, marketStarted, lastResultRound, onStartMarket, onLockMarket, onResolveMarket, onRefresh, addEntry, addToast])

  // Check if userBet is for current round (if pool is 0 but userBet exists, bet is stale)
  const hasCurrentBet = userBet && totalPool > 0

  const handleDirectionSelect = (direction: BetDirection) => {
    if (marketStatus !== 'ACTIVE' || hasCurrentBet) return
    setSelectedDirection(direction)
  }

  const handleAmountSelect = (amount: number) => {
    if (marketStatus !== 'ACTIVE' || hasCurrentBet) return
    setSelectedAmount(amount)
  }

  const handlePlaceBet = async () => {
    if (!selectedDirection || !selectedAmount || hasCurrentBet) return
    if (selectedAmount > balance) {
      addToast('Insufficient balance', 'error')
      return
    }

    setIsBetting(true)
    try {
      const success = await onPlaceBet(selectedDirection, selectedAmount)
      if (success) {
        addToast(`Bet placed: ${selectedAmount} on ${selectedDirection}`, 'success')
        setTimeout(onRefresh, 2000)
      } else {
        addToast('Failed to place bet', 'error')
      }
    } catch {
      addToast('Failed to place bet', 'error')
    }
    setIsBetting(false)
  }

  const canPlaceBet = selectedDirection && selectedAmount && !hasCurrentBet && marketStatus === 'ACTIVE' && !loading && !isBetting

  // Calculate pool sentiment
  const upPercent = totalPool > 0 ? Math.round((market?.upPool ?? 0) / totalPool * 100) : 50
  const downPercent = 100 - upPercent

  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-center px-3 py-3 sm:p-4 border-b border-card-border bg-background-elevated/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center gap-2 sm:gap-3">
          <h1 className="font-heading font-bold text-lg sm:text-xl tracking-tight">
            <span className="text-gradient-accent">Flash</span>Bets
          </h1>
          <Badge variant="accent" size="sm" className="hidden xs:inline-flex">
            {mode === 'mock' ? 'Mock' : 'Base'}
          </Badge>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          {isConnected && (
            <div className="hidden sm:flex items-center gap-2 bg-card/50 px-3 py-1.5 rounded-lg border border-card-border">
              <span className="text-2xs text-text-muted uppercase">Balance</span>
              <span className="text-accent font-mono font-bold tabular-nums">{balance.toLocaleString()}</span>
            </div>
          )}
          <Button
            variant="secondary"
            size="md"
            loading={isConnecting || loading}
            onClick={isConnected ? handleDisconnect : handleConnect}
            className="px-3 py-2 sm:px-4"
          >
            {isConnecting || loading ? (
              <span className="text-xs sm:text-sm">{isConnecting ? 'Connecting...' : 'Loading...'}</span>
            ) : isConnected ? (
              <span className="flex items-center gap-2">
                <Badge variant="success" size="sm" dot>{displayAddress}</Badge>
              </span>
            ) : (
              <span className="text-xs sm:text-sm font-medium">Connect</span>
            )}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-start sm:justify-center px-3 py-4 sm:p-4 max-w-md mx-auto w-full overflow-y-auto">
        {/* Price Display */}
        <PriceDisplay />

        {/* Timeframe Selector */}
        <TimeframeSelector disabled={marketStatus === 'LOCKED'} />

        {/* Timer */}
        <Timer
          formattedTime={timer.formattedTime}
          isUrgent={timer.isUrgent}
          progress={timer.progress}
          secondsRemaining={timer.secondsRemaining}
          isActive={timer.isActive}
        />

        {/* Market Status - Betting Closed */}
        {marketStatus === 'LOCKED' && (
          <Card variant="elevated" className="w-full mb-6 text-center">
            <div className="flex items-center justify-center gap-2">
              <span className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-accent loading-dot" />
                <span className="w-2 h-2 rounded-full bg-accent loading-dot" />
                <span className="w-2 h-2 rounded-full bg-accent loading-dot" />
              </span>
              <span className="text-accent font-medium">Betting closed - resolving market</span>
            </div>
          </Card>
        )}

        {/* Not Connected State */}
        {!isConnected && (
          <Card variant="elevated" padding="lg" className="w-full mb-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="font-heading font-bold text-xl mb-2">Connect to Start Betting</h2>
            <p className="text-text-secondary text-sm mb-4 max-w-xs mx-auto">
              Connect your wallet to place bets on BTC price movements
            </p>
            {/* Benefits list */}
            <ul className="text-left text-sm text-text-secondary mb-6 space-y-2 max-w-xs mx-auto">
              <li className="flex items-center gap-2">
                <span className="text-bet-up">✓</span> 60-second prediction rounds
              </li>
              <li className="flex items-center gap-2">
                <span className="text-bet-up">✓</span> Instant on-chain settlement
              </li>
              <li className="flex items-center gap-2">
                <span className="text-bet-up">✓</span> Up to 1.95x returns
              </li>
            </ul>
            <Button
              variant="primary"
              size="lg"
              glow="accent"
              loading={isConnecting}
              onClick={handleConnect}
              className="w-full max-w-xs"
            >
              Connect Wallet
            </Button>
          </Card>
        )}

        {/* Betting Interface */}
        {isConnected && (
          <>
            {/* Direction Buttons */}
            <div className="flex gap-3 sm:gap-4 w-full mb-4 sm:mb-6">
              <Button
                variant="up"
                size="lg"
                glow={selectedDirection === 'UP' ? 'up' : 'none'}
                selected={selectedDirection === 'UP'}
                disabled={!isConnected || !!hasCurrentBet || marketStatus !== 'ACTIVE'}
                onClick={() => handleDirectionSelect('UP')}
                className="flex-1 py-5 sm:py-6 min-h-[72px]"
              >
                <div className="relative z-10">
                  <div className="text-xl sm:text-2xl font-heading flex items-center justify-center gap-1.5 sm:gap-2">
                    <span className="text-base sm:text-lg" aria-hidden="true">▲</span>
                    UP
                  </div>
                  <div className="text-xs sm:text-sm opacity-90 tabular-nums">{upOdds.toFixed(2)}x</div>
                </div>
              </Button>
              <Button
                variant="down"
                size="lg"
                glow={selectedDirection === 'DOWN' ? 'down' : 'none'}
                selected={selectedDirection === 'DOWN'}
                disabled={!isConnected || !!hasCurrentBet || marketStatus !== 'ACTIVE'}
                onClick={() => handleDirectionSelect('DOWN')}
                className="flex-1 py-5 sm:py-6 min-h-[72px]"
              >
                <div className="relative z-10">
                  <div className="text-xl sm:text-2xl font-heading flex items-center justify-center gap-1.5 sm:gap-2">
                    <span className="text-base sm:text-lg" aria-hidden="true">▼</span>
                    DOWN
                  </div>
                  <div className="text-xs sm:text-sm opacity-90 tabular-nums">{downOdds.toFixed(2)}x</div>
                </div>
              </Button>
            </div>

            {/* Pool Sentiment Indicator */}
            {totalPool > 0 && (
              <div className="w-full mb-4">
                <div className="flex justify-between text-2xs text-text-muted mb-1">
                  <span className="text-bet-up">{upPercent}% UP</span>
                  <span className="text-bet-down">{downPercent}% DOWN</span>
                </div>
                <div className="h-2 w-full bg-card rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-bet-up transition-[width] duration-500 ease-out"
                    style={{ width: `${upPercent}%` }}
                  />
                  <div
                    className="h-full bg-bet-down transition-[width] duration-500 ease-out"
                    style={{ width: `${downPercent}%` }}
                  />
                </div>
              </div>
            )}

            {/* Bet Amount */}
            <div className="w-full mb-4 sm:mb-6">
              <div className="text-text-muted text-2xs uppercase tracking-widest mb-2 sm:mb-3">Select Amount</div>
              <div className="flex gap-1.5 sm:gap-2">
                {[10, 50, 100].map((amount) => (
                  <button
                    key={amount}
                    className={`flex-1 bg-card border py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-mono text-base sm:text-lg transition-[transform,border-color,background-color,color,box-shadow] duration-150 btn-press min-h-[44px] ${
                      selectedAmount === amount
                        ? 'border-accent bg-accent/10 text-accent shadow-glow-accent'
                        : 'border-card-border hover:border-text-muted hover:bg-card-hover'
                    } ${hasCurrentBet || marketStatus !== 'ACTIVE' ? 'opacity-40 cursor-not-allowed' : ''}`}
                    disabled={!!hasCurrentBet || marketStatus !== 'ACTIVE'}
                    onClick={() => handleAmountSelect(amount)}
                  >
                    {amount}
                  </button>
                ))}
                <button
                  className={`flex-1 bg-accent/20 border py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-bold text-accent transition-[transform,border-color,background-color,box-shadow] duration-150 btn-press btn-glow-accent min-h-[44px] ${
                    selectedAmount === balance
                      ? 'border-accent bg-accent/30 shadow-glow-accent'
                      : 'border-accent/50 hover:bg-accent/30'
                  } ${hasCurrentBet || marketStatus !== 'ACTIVE' ? 'opacity-40 cursor-not-allowed' : ''}`}
                  disabled={!!hasCurrentBet || marketStatus !== 'ACTIVE'}
                  onClick={() => handleAmountSelect(balance)}
                >
                  MAX
                </button>
              </div>
            </div>

            {/* Place Bet Button - Always visible but disabled when not ready */}
            <Button
              variant="primary"
              size="lg"
              glow="accent"
              loading={isBetting}
              disabled={!canPlaceBet}
              onClick={handlePlaceBet}
              className={`w-full mb-4 sm:mb-6 py-3.5 sm:py-4 ${
                canPlaceBet ? 'animate-scale-in shadow-lg' : 'opacity-50'
              }`}
            >
              {isBetting ? (
                'Placing Bet...'
              ) : selectedDirection && selectedAmount ? (
                <span className="flex items-center justify-center gap-1.5 sm:gap-2 text-sm sm:text-base">
                  <span>Bet</span>
                  <span className="font-mono">{selectedAmount}</span>
                  <span>on</span>
                  <span className={`font-bold ${selectedDirection === 'UP' ? 'text-bet-up-dark' : 'text-bet-down-dark'}`}>
                    {selectedDirection}
                  </span>
                </span>
              ) : (
                'Select direction & amount'
              )}
            </Button>
          </>
        )}

        {/* Pool Info */}
        <Card variant="elevated" className="w-full mb-6">
          <div className="text-2xs uppercase tracking-widest text-text-muted mb-3">Market Info</div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-text-secondary text-sm">Total Pool</span>
              <span className="font-mono tabular-nums">{totalPool.toLocaleString()} <span className="text-text-muted text-xs">TOKENS</span></span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-secondary text-sm">UP Pool</span>
              <span className="font-mono tabular-nums text-bet-up">{(market?.upPool ?? 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-secondary text-sm">DOWN Pool</span>
              <span className="font-mono tabular-nums text-bet-down">{(market?.downPool ?? 0).toLocaleString()}</span>
            </div>
            {isConnected && (
              <div className="flex justify-between items-center pt-2 border-t border-card-border">
                <span className="text-text-secondary text-sm">Your Bet</span>
                {hasCurrentBet ? (
                  <span className={`font-medium ${userBet!.direction === 'UP' ? 'text-bet-up' : 'text-bet-down'}`}>
                    {userBet!.amount} on {userBet!.direction} <span className="text-text-muted">→ {userBet!.potentialPayout}</span>
                  </span>
                ) : (
                  <span className="text-text-muted">No bet placed</span>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* History Section */}
        {isConnected && (
          <div className="w-full">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-heading font-bold text-lg">Recent Bets</h2>
              {history.length > 0 && (
                <Badge variant="default" size="sm">
                  {history.filter(h => h.outcome === 'WIN').length}/{history.length} wins
                </Badge>
              )}
            </div>
            <div className="space-y-2">
              {history.length === 0 ? (
                <Card variant="elevated" padding="lg" className="text-center">
                  <div className="text-text-muted mb-1">No bets placed yet</div>
                  <div className="text-2xs text-text-muted">Your betting history will appear here</div>
                </Card>
              ) : (
                history.map((entry) => (
                  <Card
                    key={entry.id}
                    variant="elevated"
                    padding="sm"
                    className={`flex justify-between items-center ${
                      entry.outcome === 'WIN' ? 'border-l-2 border-l-bet-up' : 'border-l-2 border-l-bet-down'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                        entry.direction === 'UP'
                          ? 'bg-bet-up/20 text-bet-up'
                          : 'bg-bet-down/20 text-bet-down'
                      }`}>
                        {entry.direction === 'UP' ? '▲' : '▼'}
                      </div>
                      <div>
                        <div className="font-medium">{entry.direction}</div>
                        <div className="text-2xs text-text-muted font-mono">{entry.amount} tokens</div>
                      </div>
                    </div>
                    <div className={`font-mono font-bold ${entry.outcome === 'WIN' ? 'text-bet-up' : 'text-bet-down'}`}>
                      {entry.profit > 0 ? '+' : ''}{entry.profit.toFixed(0)}
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

        {/* Social Features - Leaderboard & Activity Feed */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
          <Leaderboard isConnected={isConnected} />
          <ActivityFeed />
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center p-4 border-t border-card-border bg-background-elevated/30">
        <p className="text-text-muted text-sm">
          Built on <span className="text-text-secondary font-medium">Base</span> • Testnet ETH has no real value
        </p>
        <p className="text-2xs text-text-muted mt-1 font-mono">Round #{currentRound}</p>
      </footer>

      {/* Result Display */}
      {showResult && lastResult && (
        <ResultDisplay
          isWin={lastResult.userWon}
          profit={lastResult.profit}
          onDismiss={() => setShowResult(false)}
        />
      )}
    </main>
  )
}
