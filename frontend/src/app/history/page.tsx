'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAccount } from 'wagmi'
import { usePlayerHistory } from '@/hooks/useChainEvents'

type OutcomeFilter = 'all' | 'wins' | 'losses'

export default function HistoryPage() {
  const { address } = useAccount()
  const { history, loading } = usePlayerHistory(address)
  const [filter, setFilter] = useState<OutcomeFilter>('all')

  const filteredHistory = history.filter(entry => {
    if (filter === 'wins') return entry.outcome === 'win'
    if (filter === 'losses') return entry.outcome === 'loss'
    return true
  })

  const wins = history.filter(h => h.outcome === 'win')
  const totalWagered = history.reduce((s, h) => s + h.betAmount, 0)
  const totalPayout = history.reduce((s, h) => s + (h.payout ?? 0), 0)
  const totalProfit = totalPayout - totalWagered
  const winRate = history.length > 0 ? Math.round((wins.length / history.length) * 100) : 0

  return (
    <div className="fb-page">
      <div className="fb-page-header">
        <h1 className="fb-page-title">History</h1>
        <p className="fb-page-subtitle">Your predictions and stats</p>
      </div>

      <div className="fb-page-content">
        {/* Stats Grid */}
        <div className="fb-stats-grid">
          <div className="fb-stat-card">
            <div className="fb-stat-card-value">{totalWagered.toFixed(4)} ETH</div>
            <div className="fb-stat-card-label">Total Wagered</div>
          </div>
          <div className="fb-stat-card">
            <div className={`fb-stat-card-value ${totalProfit >= 0 ? 'positive' : 'negative'}`}>
              {totalProfit >= 0 ? '+' : ''}{totalProfit.toFixed(4)} ETH
            </div>
            <div className="fb-stat-card-label">Total Profit</div>
          </div>
          <div className="fb-stat-card">
            <div className="fb-stat-card-value">{winRate}%</div>
            <div className="fb-stat-card-label">Win Rate</div>
          </div>
          <div className="fb-stat-card">
            <div className="fb-stat-card-value">{history.length}</div>
            <div className="fb-stat-card-label">Total Bets</div>
          </div>
        </div>

        {/* History Header */}
        <div className="fb-history-header">
          <h2 className="fb-history-title">Bet History</h2>
          <div className="fb-history-filters">
            {(['all', 'wins', 'losses'] as const).map(f => (
              <button
                key={f}
                className={`fb-history-filter ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* History List */}
        {!address ? (
          <div className="fb-history-empty">
            <div className="fb-history-empty-icon">🔗</div>
            <p className="fb-history-empty-text">Connect your wallet</p>
            <p className="fb-history-empty-subtext">Connect to see your on-chain betting history</p>
          </div>
        ) : loading && history.length === 0 ? (
          <div className="fb-history-empty">
            <div className="fb-history-empty-icon">⏳</div>
            <p className="fb-history-empty-text">Loading history...</p>
            <p className="fb-history-empty-subtext">Reading events from chain</p>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="fb-history-empty">
            <div className="fb-history-empty-icon">📊</div>
            <p className="fb-history-empty-text">No bets yet</p>
            <p className="fb-history-empty-subtext">
              {history.length === 0
                ? 'Start predicting to build your history'
                : 'No bets match this filter'
              }
            </p>
            {history.length === 0 && (
              <Link href="/app" className="fb-hero-cta-primary" style={{ marginTop: '24px', display: 'inline-flex' }}>
                Start Predicting
              </Link>
            )}
          </div>
        ) : (
          <div className="fb-history-list">
            {filteredHistory.map((entry) => (
              <div key={entry.roundId.toString()} className="fb-history-item">
                <div className={`fb-history-direction ${entry.direction.toLowerCase()}`}>
                  {entry.direction === 'UP' ? '↑' : '↓'}
                </div>
                <div className="fb-history-details">
                  <div className="fb-history-amount">
                    {entry.betAmount.toFixed(4)} ETH on {entry.direction}
                  </div>
                  <div className="fb-history-time">Round #{entry.roundId.toString()}</div>
                </div>
                <div className="fb-history-result">
                  <div className={`fb-history-outcome ${entry.outcome}`}>
                    {entry.outcome === 'win' ? 'Won' : entry.outcome === 'loss' ? 'Lost' : 'Pending'}
                  </div>
                  {entry.payout !== null && (
                    <div className="fb-history-pnl">
                      +{entry.payout.toFixed(4)} ETH
                    </div>
                  )}
                  {entry.outcome === 'loss' && (
                    <div className="fb-history-pnl negative">
                      -{entry.betAmount.toFixed(4)} ETH
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
