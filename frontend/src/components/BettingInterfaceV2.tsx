'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useConnectModal, useAccountModal } from '@rainbow-me/rainbowkit'
import { useDisconnect } from 'wagmi'
import { useToast } from '@/components/Toast'
import { usePrice } from '@/hooks/usePrice'
import { useTimer } from '@/hooks/useTimer'
import { useHistory } from '@/hooks/useHistory'
import { useSound } from '@/hooks/useSound'
import { useChainEvents } from '@/hooks/useChainEvents'
import { AnimatedNumber } from '@/components/AnimatedNumber'
import { Confetti } from '@/components/Confetti'
import type { BetDirection, MarketStatus } from '@/types'

// ETH bet presets (in ETH units, passed as number to onPlaceBet)
const BET_PRESETS = [0.001, 0.005, 0.01] as const

export interface BettingInterfaceV2Props {
  isConnected: boolean
  walletAddress?: `0x${string}` | undefined
  balance: number                    // ETH units (from contract balance)
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
  secondsRemainingFromChain?: number  // authoritative countdown from contract
  onConnect: () => Promise<void>
  onDisconnect: () => void
  onPlaceBet: (direction: BetDirection, amount: number) => Promise<boolean>
  onClaimWinnings?: () => Promise<void>
  onRefresh: () => void
}

export function BettingInterfaceV2({
  isConnected,
  walletAddress,
  balance,
  market,
  userBet,
  loading,
  secondsRemainingFromChain,
  onConnect,
  onDisconnect,
  onPlaceBet,
  onClaimWinnings,
  onRefresh,
}: BettingInterfaceV2Props) {
  const [selectedDirection, setSelectedDirection] = useState<BetDirection | null>(null)
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [isClaiming, setIsClaiming] = useState(false)
  const [lastResult, setLastResult] = useState<{ userWon: boolean; profit: number } | null>(null)
  const [lastResultRound, setLastResultRound] = useState<number>(0)
  const [isBetting, setIsBetting] = useState(false)

  const price   = usePrice()
  const timer   = useTimer(secondsRemainingFromChain)
  const { history, addEntry } = useHistory()
  const { addToast } = useToast()
  const { play: playSound } = useSound()
  const { leaderboard } = useChainEvents()

  // RainbowKit hooks for connect/disconnect modals
  const { openConnectModal }  = useConnectModal()
  const { openAccountModal }  = useAccountModal()
  const { disconnect }        = useDisconnect()

  // ---- Detect round resolution and show result to user ----
  const prevStatus = useRef<MarketStatus | null>(null)
  useEffect(() => {
    const currentRound = market?.roundId ?? 0
    if (
      prevStatus.current === 'LOCKED' &&
      market?.status === 'RESOLVED' &&
      userBet &&
      lastResultRound !== currentRound
    ) {
      const outcome: BetDirection = price.price! > market.startPrice ? 'UP' : 'DOWN'
      const userWon  = userBet.direction === outcome
      const profit   = userWon
        ? userBet.potentialPayout - userBet.amount
        : -userBet.amount

      setLastResult({ userWon, profit })
      setShowResult(true)
      setLastResultRound(currentRound)

      playSound(userWon ? 'win' : 'lose')

      addEntry({
        direction: userBet.direction,
        amount:    userBet.amount,
        outcome:   userWon ? 'WIN' : 'LOSS',
        profit,
      })

      addToast(
        userWon
          ? `Won +${profit.toFixed(4)} ETH!`
          : `Lost ${Math.abs(profit).toFixed(4)} ETH`,
        userWon ? 'success' : 'error',
        5000,
      )
    }
    prevStatus.current = market?.status ?? null
  }, [market?.status]) // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Handlers ----

  const handleConnect = () => {
    if (openConnectModal) openConnectModal()
  }

  const handleWalletClick = () => {
    if (isConnected && openAccountModal) openAccountModal()
    else handleConnect()
  }

  const handleDisconnect = () => {
    disconnect()
    onDisconnect()
  }

  const handleDirectionSelect = (direction: BetDirection) => {
    if (marketStatus !== 'ACTIVE' || hasCurrentBet) return
    playSound('click')
    setSelectedDirection(direction)
  }

  const handleAmountSelect = (amount: number) => {
    if (marketStatus !== 'ACTIVE' || hasCurrentBet) return
    playSound('click')
    setSelectedAmount(amount)
  }

  const handlePlaceBet = async () => {
    if (!selectedDirection || !selectedAmount || hasCurrentBet) return
    if (selectedAmount > balance) {
      addToast('Insufficient balance — deposit ETH first', 'error')
      return
    }

    setIsBetting(true)
    try {
      const ok = await onPlaceBet(selectedDirection, selectedAmount)
      if (ok) {
        addToast(`Bet placed: ${selectedAmount} ETH on ${selectedDirection === 'UP' ? 'GREEN' : 'RED'}`, 'success')
        setTimeout(onRefresh, 2000)
      } else {
        addToast('Bet failed — check wallet', 'error')
      }
    } catch {
      addToast('Bet failed — check wallet', 'error')
    }
    setIsBetting(false)
  }

  const handleClaimWinnings = async () => {
    if (!onClaimWinnings) return
    setIsClaiming(true)
    try {
      await onClaimWinnings()
      addToast('Winnings claimed!', 'success')
      setShowResult(false)
    } catch {
      addToast('Claim failed — try again', 'error')
    }
    setIsClaiming(false)
  }

  // ---- Derived values ----

  const marketStatus: MarketStatus = market?.status ?? 'INACTIVE'
  const upOdds    = market?.upOdds   ?? 1.95
  const downOdds  = market?.downOdds ?? 1.95
  const totalPool = market?.totalPool ?? 0
  const roundId   = market?.roundId  ?? 0

  const hasCurrentBet = !!(userBet && userBet.amount > 0)
  const canPlaceBet   = (
    !!selectedDirection &&
    !!selectedAmount &&
    !hasCurrentBet &&
    marketStatus === 'ACTIVE' &&
    !loading &&
    !isBetting
  )

  const upPercent   = totalPool > 0 ? Math.round((market?.upPool ?? 0) / totalPool * 100) : 50
  const downPercent = 100 - upPercent

  const potentialPayout = selectedDirection && selectedAmount
    ? selectedAmount * (selectedDirection === 'UP' ? upOdds : downOdds)
    : 0
  const potentialProfit = potentialPayout - (selectedAmount ?? 0)

  const isUrgent   = timer.secondsRemaining <= 10 && timer.secondsRemaining > 0
  const isRoundOver = !timer.isActive && timer.secondsRemaining === 0
  const isWaiting  = marketStatus === 'INACTIVE' || marketStatus === 'RESOLVED'

  const displayAddress = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : null

  return (
    <div className="fb-root">
      <div className="fb-hazard-top" />
      <div className="fb-hazard-bottom" />

      <div className="fb-app">

        {/* Wallet bar */}
        <div className="fb-wallet-bar">
          {isConnected && (
            <div className="fb-balance-pill">
              {balance.toFixed(4)} ETH
            </div>
          )}
          <button
            className="fb-wallet-btn"
            onClick={handleWalletClick}
            disabled={loading}
          >
            {isConnected && <span className="fb-wallet-dot" />}
            {loading ? '...' : isConnected ? displayAddress ?? 'Connected' : 'Connect'}
          </button>
        </div>

        {/* Main content */}
        <main className="fb-main" role="main" aria-label="FlashBets betting interface">

          {/* Market tabs */}
          <div className="fb-markets-row">
            <button className="fb-market-tab active">BTC/USD</button>
            <button className="fb-market-tab" disabled>ETH/USD <span className="fb-soon">soon</span></button>
            <button className="fb-market-tab" disabled>SOL/USD <span className="fb-soon">soon</span></button>
          </div>

          {/* Timer */}
          <div className="fb-bomb-housing" role="timer" aria-label="Round countdown timer">
            <div
              className={`fb-timer-value ${isUrgent ? 'urgent' : ''}`}
              aria-live="polite"
              aria-atomic="true"
            >
              {isWaiting
                ? '--'
                : isRoundOver
                  ? '00'
                  : timer.secondsRemaining < 10
                    ? `0${timer.secondsRemaining}`
                    : `${timer.secondsRemaining}`}
            </div>
          </div>
          <div className="fb-timer-label" aria-hidden="true">
            {isWaiting
              ? 'Waiting for next round'
              : isRoundOver
                ? 'Round complete'
                : 'seconds remaining'}
          </div>
          <div className={`fb-warning-light ${isUrgent ? 'urgent' : ''}`} />

          {/* Price */}
          <div className="fb-price-row">
            <div>
              <div className="fb-price-label">BTC/USD</div>
              {price.price ? (
                <AnimatedNumber
                  value={price.price}
                  prefix="$"
                  decimals={2}
                  duration={300}
                  className="fb-price-value"
                />
              ) : (
                <span className="fb-price-value">$---</span>
              )}
            </div>
            {price.change !== null && (
              <span className={`fb-price-badge ${price.change >= 0 ? 'up' : 'down'}`}>
                {price.change >= 0 ? '+' : ''}{price.change.toFixed(2)}%
              </span>
            )}
          </div>

          {/* Locked state */}
          {marketStatus === 'LOCKED' && (
            <div className="fb-locked">
              <span className="fb-locked-dot" />
              Market locked — awaiting resolution...
            </div>
          )}

          {/* Not connected CTA */}
          {!isConnected && (
            <div className="fb-connect-prompt">
              <p>Connect wallet to start betting</p>
              <button className="fb-connect-cta" onClick={handleConnect}>
                Connect Wallet
              </button>
            </div>
          )}

          {/* Direction choice */}
          {isConnected && (
            <section className="fb-wires-section">
              <div className="fb-wires-label">Cut The Wire</div>
              <div className="fb-directions" role="group" aria-label="Prediction direction">
                <button
                  className={`fb-dir-btn up ${selectedDirection === 'UP' ? 'selected' : ''} ${(hasCurrentBet || marketStatus !== 'ACTIVE') ? 'disabled' : ''}`}
                  onClick={() => handleDirectionSelect('UP')}
                  disabled={hasCurrentBet || marketStatus !== 'ACTIVE'}
                  aria-pressed={selectedDirection === 'UP'}
                  aria-label={`BTC goes UP — ${upOdds.toFixed(2)}x payout`}
                >
                  <span className="fb-dir-arrow" aria-hidden="true">▲</span>
                  <span className="fb-dir-label">GREEN</span>
                  <span className="fb-dir-odds">{upOdds.toFixed(2)}× payout</span>
                </button>
                <button
                  className={`fb-dir-btn down ${selectedDirection === 'DOWN' ? 'selected' : ''} ${(hasCurrentBet || marketStatus !== 'ACTIVE') ? 'disabled' : ''}`}
                  onClick={() => handleDirectionSelect('DOWN')}
                  disabled={hasCurrentBet || marketStatus !== 'ACTIVE'}
                  aria-pressed={selectedDirection === 'DOWN'}
                  aria-label={`BTC goes DOWN — ${downOdds.toFixed(2)}x payout`}
                >
                  <span className="fb-dir-arrow" aria-hidden="true">▼</span>
                  <span className="fb-dir-label">RED</span>
                  <span className="fb-dir-odds">{downOdds.toFixed(2)}× payout</span>
                </button>
              </div>
            </section>
          )}

          {/* Amount selection */}
          {isConnected && (
            <div className="fb-bet-card">
              <div className="fb-amounts-label">Stake (ETH)</div>
              <div className="fb-amounts">
                {BET_PRESETS.map((amount) => (
                  <button
                    key={amount}
                    className={`fb-amount-btn ${selectedAmount === amount ? 'selected' : ''}`}
                    onClick={() => handleAmountSelect(amount)}
                    disabled={hasCurrentBet || marketStatus !== 'ACTIVE'}
                  >
                    {amount}
                  </button>
                ))}
                <button
                  className={`fb-amount-btn ${selectedAmount === balance ? 'selected' : ''}`}
                  onClick={() => handleAmountSelect(balance)}
                  disabled={hasCurrentBet || marketStatus !== 'ACTIVE' || balance === 0}
                >
                  ALL
                </button>
              </div>
            </div>
          )}

          {/* Execute panel */}
          {isConnected && (
            <div className="fb-execute-panel">

              {/* Potential payout preview */}
              {selectedDirection && selectedAmount && !hasCurrentBet && (
                <div className="fb-bet-summary">
                  <span className="fb-summary-label">Potential Profit</span>
                  <span className="fb-summary-value">+{potentialProfit.toFixed(4)} ETH</span>
                </div>
              )}

              {/* Active bet display */}
              {hasCurrentBet && (
                <div className={`fb-current-bet ${isUrgent ? 'urgent' : ''}`}>
                  <span className="fb-bet-locked-label">Locked in</span>
                  <span className={`fb-bet-locked-value ${userBet!.direction === 'UP' ? 'up' : 'down'}`}>
                    {userBet!.amount.toFixed(4)} ETH on {userBet!.direction === 'UP' ? 'GREEN' : 'RED'}
                  </span>
                </div>
              )}

              {hasCurrentBet ? (
                <div className="fb-waiting-btn">Waiting for detonation...</div>
              ) : (
                <button
                  className="fb-place-btn"
                  onClick={handlePlaceBet}
                  disabled={!canPlaceBet}
                >
                  {isBetting ? 'ARMING...' : 'DETONATE'}
                </button>
              )}
            </div>
          )}

          {/* Pool sentiment bar */}
          {isConnected && totalPool > 0 && (
            <div className="fb-pool-section">
              <div className="fb-pool-bar">
                <div className="fb-pool-up"   style={{ width: `${upPercent}%` }} />
                <div className="fb-pool-down" style={{ width: `${downPercent}%` }} />
              </div>
              <div className="fb-pool-labels">
                <span className="up-label">{upPercent}% GREEN</span>
                <span className="down-label">{downPercent}% RED</span>
              </div>
            </div>
          )}
        </main>

        {/* ---- Scrollable feed sections ---- */}
        <div className="fb-feed-wrapper">

          {/* Live Activity — real on-chain leaderboard data */}
          <section className="fb-feed-section">
            <div className="fb-feed-header">
              <h2 className="fb-feed-title">
                <span className="fb-feed-dot pulse" />
                Live Activity
              </h2>
            </div>
            <div className="fb-activity-list">
              {leaderboard.length === 0 ? (
                <div className="fb-activity-row" style={{ opacity: 0.5, justifyContent: 'center' }}>
                  No bets yet — be the first!
                </div>
              ) : (
                leaderboard.slice(0, 6).map((entry, i) => (
                  <div key={i} className="fb-activity-row" style={{ animationDelay: `${i * 0.08}s` }}>
                    <span className="fb-activity-addr">{entry.address}</span>
                    <span className={`fb-activity-dir ${entry.profit >= 0 ? 'up' : 'down'}`}>
                      {entry.totalBets} bets
                    </span>
                    <span className="fb-activity-amount">{entry.totalBet.toFixed(3)} ETH</span>
                    <span className="fb-activity-time">{entry.winRate}% win</span>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Top Traders — real on-chain data */}
          <section className="fb-feed-section">
            <div className="fb-feed-header">
              <h2 className="fb-feed-title">Top Traders</h2>
              <a href="/leaderboard" className="fb-feed-link">View All →</a>
            </div>
            <div className="fb-mini-leaderboard">
              {leaderboard.length === 0 ? (
                <div className="fb-mini-row" style={{ opacity: 0.5, justifyContent: 'center' }}>
                  No traders yet
                </div>
              ) : (
                leaderboard.slice(0, 5).map((trader, i) => (
                  <div key={i} className="fb-mini-row">
                    <span className={`fb-mini-rank rank-${i + 1}`}>#{i + 1}</span>
                    <span className="fb-mini-addr">{trader.address}</span>
                    <span className="fb-mini-winrate">{trader.winRate}%</span>
                    <span className="fb-mini-profit">{trader.profit >= 0 ? '+' : ''}{trader.profit.toFixed(3)} ETH</span>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Your Stats */}
          {isConnected && (
            <section className="fb-feed-section">
              <div className="fb-feed-header">
                <h2 className="fb-feed-title">Your Stats</h2>
                <a href="/history" className="fb-feed-link">Full History →</a>
              </div>
              <div className="fb-your-stats">
                <div className="fb-stat-card">
                  <span className="fb-stat-value">{history.length}</span>
                  <span className="fb-stat-label">Total Bets</span>
                </div>
                <div className="fb-stat-card">
                  <span className="fb-stat-value">
                    {history.length > 0
                      ? Math.round(history.filter(h => h.outcome === 'WIN').length / history.length * 100)
                      : 0}%
                  </span>
                  <span className="fb-stat-label">Win Rate</span>
                </div>
                <div className="fb-stat-card">
                  <span className={`fb-stat-value ${history.reduce((s, h) => s + h.profit, 0) >= 0 ? 'positive' : 'negative'}`}>
                    {history.reduce((s, h) => s + h.profit, 0) >= 0 ? '+' : ''}
                    {history.reduce((s, h) => s + h.profit, 0).toFixed(4)}
                  </span>
                  <span className="fb-stat-label">P&L (ETH)</span>
                </div>
                <div className="fb-stat-card">
                  <span className="fb-stat-value">{balance.toFixed(4)}</span>
                  <span className="fb-stat-label">Balance (ETH)</span>
                </div>
              </div>
            </section>
          )}

          {/* Market Stats */}
          <section className="fb-feed-section">
            <div className="fb-feed-header">
              <h2 className="fb-feed-title">Market Stats</h2>
            </div>
            <div className="fb-market-stats">
              <div className="fb-mstat">
                <span className="fb-mstat-value">{totalPool.toFixed(3)} ETH</span>
                <span className="fb-mstat-label">Current Pool</span>
              </div>
              <div className="fb-mstat">
                <span className="fb-mstat-value">Round #{roundId}</span>
                <span className="fb-mstat-label">Current Round</span>
              </div>
              <div className="fb-mstat">
                <span className="fb-mstat-value">{upPercent}% / {downPercent}%</span>
                <span className="fb-mstat-label">UP / DOWN Split</span>
              </div>
              <div className="fb-mstat">
                <span className="fb-mstat-value">{marketStatus}</span>
                <span className="fb-mstat-label">Market Status</span>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className="fb-footer">
          <div className="fb-live-indicator">
            <span className="fb-live-dot" />
            Base Sepolia
          </div>
          <span>Round #{roundId}</span>
          <span>v0.3.0</span>
        </footer>
      </div>

      {/* Confetti on win */}
      <Confetti active={showResult && lastResult?.userWon === true} />

      {/* Result overlay */}
      {showResult && lastResult && (
        <div
          className="fb-result-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={lastResult.userWon ? 'You won!' : 'You lost'}
        >
          <div className={`fb-result-card ${lastResult.userWon ? 'win' : 'loss'}`}>
            <div className="fb-result-emoji" aria-hidden="true">
              {lastResult.userWon ? '⚡' : '✖'}
            </div>
            <div className="fb-result-title">
              {lastResult.userWon ? 'You Won' : 'You Lost'}
            </div>
            <div className="fb-result-amount">
              {lastResult.profit > 0 ? '+' : ''}{lastResult.profit.toFixed(4)} ETH
            </div>

            {/* Winners must claim their ETH from the contract */}
            {lastResult.userWon && onClaimWinnings ? (
              <button
                className="fb-claim-btn"
                onClick={handleClaimWinnings}
                disabled={isClaiming}
              >
                {isClaiming ? 'Claiming...' : 'Claim Winnings'}
              </button>
            ) : (
              <button
                className="fb-result-dismiss"
                onClick={() => setShowResult(false)}
                aria-label="Dismiss"
              >
                tap to continue
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
