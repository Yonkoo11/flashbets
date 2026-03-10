'use client'

import { useState } from 'react'

type LeaderboardPeriod = 'daily' | 'weekly' | 'allTime'

interface LeaderboardEntry {
  rank: number
  address: string
  profit: number
  winRate: number
  totalBets: number
  isUser?: boolean
}

// Mock data for demonstration
const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, address: '0x7a23...8f91', profit: 45230, winRate: 68, totalBets: 156 },
  { rank: 2, address: '0x3b45...2d67', profit: 32100, winRate: 62, totalBets: 203 },
  { rank: 3, address: '0x9c12...4e89', profit: 28450, winRate: 71, totalBets: 89 },
  { rank: 4, address: '0x5d78...1a34', profit: 21800, winRate: 58, totalBets: 245 },
  { rank: 5, address: '0xf86845...5405', profit: 18500, winRate: 65, totalBets: 67, isUser: true },
  { rank: 6, address: '0x2e90...6c45', profit: 15200, winRate: 54, totalBets: 312 },
  { rank: 7, address: '0x8b56...9d23', profit: 12100, winRate: 52, totalBets: 178 },
  { rank: 8, address: '0x4f21...7b67', profit: 9800, winRate: 51, totalBets: 134 },
]

interface LeaderboardProps {
  isConnected?: boolean
  userAddress?: string
}

export function Leaderboard({ isConnected = false, userAddress }: LeaderboardProps) {
  const [period, setPeriod] = useState<LeaderboardPeriod>('weekly')
  const [isExpanded, setIsExpanded] = useState(false)

  const displayedEntries = isExpanded ? MOCK_LEADERBOARD : MOCK_LEADERBOARD.slice(0, 5)

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return <span className="text-lg">🥇</span>
      case 2:
        return <span className="text-lg">🥈</span>
      case 3:
        return <span className="text-lg">🥉</span>
      default:
        return <span className="text-text-muted text-sm font-mono">#{rank}</span>
    }
  }

  return (
    <div className="w-full card-elevated p-4" role="region" aria-label="Leaderboard rankings">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading font-bold text-lg">Leaderboard</h3>
        <div className="flex gap-1 p-0.5 bg-background rounded-lg" role="tablist" aria-label="Time period">
          {(['daily', 'weekly', 'allTime'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              role="tab"
              aria-selected={period === p}
              className={`px-3 py-1.5 text-2xs rounded transition-[background-color,color] min-h-[36px] ${
                period === p
                  ? 'bg-card text-text-primary'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {p === 'allTime' ? 'All' : p === 'daily' ? 'Day' : 'Week'}
            </button>
          ))}
        </div>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-[40px_1fr_80px_60px] gap-2 text-2xs text-text-muted uppercase tracking-wider pb-2 border-b border-card-border">
        <span>Rank</span>
        <span>Player</span>
        <span className="text-right">Profit</span>
        <span className="text-right">Win%</span>
      </div>

      {/* Entries */}
      <div className="divide-y divide-card-border/50">
        {displayedEntries.map((entry) => (
          <div
            key={entry.rank}
            className={`grid grid-cols-[40px_1fr_80px_60px] gap-2 py-3 items-center ${
              entry.isUser ? 'bg-accent/5 -mx-4 px-4 border-l-2 border-l-accent' : ''
            }`}
          >
            <div className="flex items-center justify-center">
              {getRankBadge(entry.rank)}
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <span className={`font-mono text-sm truncate ${entry.isUser ? 'text-accent font-medium' : ''}`}>
                {entry.address}
              </span>
              {entry.isUser && (
                <span className="text-2xs bg-accent/20 text-accent px-1.5 py-0.5 rounded">You</span>
              )}
            </div>
            <div className={`text-right font-mono text-sm ${entry.profit >= 0 ? 'text-bet-up' : 'text-bet-down'}`}>
              {entry.profit >= 0 ? '+' : ''}{entry.profit.toLocaleString()}
            </div>
            <div className="text-right text-sm text-text-secondary">
              {entry.winRate}%
            </div>
          </div>
        ))}
      </div>

      {/* Expand/Collapse */}
      {MOCK_LEADERBOARD.length > 5 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full mt-3 py-3 text-sm text-text-secondary hover:text-text-primary transition-colors min-h-[44px]"
          aria-expanded={isExpanded}
        >
          {isExpanded ? 'Show less' : `Show all ${MOCK_LEADERBOARD.length} players`}
        </button>
      )}

      {/* User stats when connected but not on board */}
      {isConnected && !MOCK_LEADERBOARD.some(e => e.isUser) && (
        <div className="mt-4 pt-4 border-t border-card-border text-center">
          <p className="text-sm text-text-muted">
            Place bets to appear on the leaderboard
          </p>
        </div>
      )}
    </div>
  )
}
