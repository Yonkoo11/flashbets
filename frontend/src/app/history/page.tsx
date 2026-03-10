'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface HistoryEntry {
  id: string
  direction: 'UP' | 'DOWN'
  amount: number
  outcome: 'win' | 'loss'
  profit: number
  timestamp: number
}

type OutcomeFilter = 'all' | 'wins' | 'losses'

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [filter, setFilter] = useState<OutcomeFilter>('all')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Load history from localStorage
    const stored = localStorage.getItem('flashbets-history')
    if (stored) {
      try {
        setHistory(JSON.parse(stored))
      } catch {
        setHistory([])
      }
    }
  }, [])

  // Calculate stats
  const stats = {
    totalWagered: history.reduce((sum, h) => sum + h.amount, 0),
    totalProfit: history.reduce((sum, h) => sum + h.profit, 0),
    winRate: history.length > 0
      ? Math.round((history.filter(h => h.outcome === 'win').length / history.length) * 100)
      : 0,
    totalBets: history.length,
  }

  // Filter history
  const filteredHistory = history.filter(entry => {
    if (filter === 'wins') return entry.outcome === 'win'
    if (filter === 'losses') return entry.outcome === 'loss'
    return true
  })

  // Format timestamp
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (!mounted) {
    return (
      <div className="fb-page">
        <div className="fb-page-header">
          <h1 className="fb-page-title">Your History</h1>
          <p className="fb-page-subtitle">Loading...</p>
        </div>
      </div>
    )
  }

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
            <div className="fb-stat-card-value">${stats.totalWagered.toLocaleString()}</div>
            <div className="fb-stat-card-label">Total Wagered</div>
          </div>
          <div className="fb-stat-card">
            <div className={`fb-stat-card-value ${stats.totalProfit >= 0 ? 'positive' : 'negative'}`}>
              {stats.totalProfit >= 0 ? '+' : ''}${stats.totalProfit.toLocaleString()}
            </div>
            <div className="fb-stat-card-label">Total Profit</div>
          </div>
          <div className="fb-stat-card">
            <div className="fb-stat-card-value">{stats.winRate}%</div>
            <div className="fb-stat-card-label">Win Rate</div>
          </div>
          <div className="fb-stat-card">
            <div className="fb-stat-card-value">{stats.totalBets}</div>
            <div className="fb-stat-card-label">Total Bets</div>
          </div>
        </div>

        {/* History Header */}
        <div className="fb-history-header">
          <h2 className="fb-history-title">Bet History</h2>
          <div className="fb-history-filters">
            <button
              className={`fb-history-filter ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button
              className={`fb-history-filter ${filter === 'wins' ? 'active' : ''}`}
              onClick={() => setFilter('wins')}
            >
              Wins
            </button>
            <button
              className={`fb-history-filter ${filter === 'losses' ? 'active' : ''}`}
              onClick={() => setFilter('losses')}
            >
              Losses
            </button>
          </div>
        </div>

        {/* History List */}
        {filteredHistory.length === 0 ? (
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
              <div key={entry.id} className="fb-history-item">
                <div className={`fb-history-direction ${entry.direction.toLowerCase()}`}>
                  {entry.direction === 'UP' ? '↑' : '↓'}
                </div>
                <div className="fb-history-details">
                  <div className="fb-history-amount">${entry.amount} on {entry.direction}</div>
                  <div className="fb-history-time">{formatTime(entry.timestamp)}</div>
                </div>
                <div className="fb-history-result">
                  <div className={`fb-history-outcome ${entry.outcome}`}>
                    {entry.outcome === 'win' ? 'Won' : 'Lost'}
                  </div>
                  <div className="fb-history-pnl">
                    {entry.profit >= 0 ? '+' : ''}${entry.profit}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
