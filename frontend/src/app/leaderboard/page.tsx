'use client'

import { useState } from 'react'

const mockLeaderboard = [
  { rank: 1, address: '0x1234...5678', profit: 12500, winRate: 68, totalBets: 156 },
  { rank: 2, address: '0xabcd...efgh', profit: 8900, winRate: 62, totalBets: 134 },
  { rank: 3, address: '0x9876...5432', profit: 7200, winRate: 59, totalBets: 128 },
  { rank: 4, address: '0xdef0...1234', profit: 5600, winRate: 57, totalBets: 112 },
  { rank: 5, address: '0x5678...9abc', profit: 4800, winRate: 55, totalBets: 98 },
  { rank: 6, address: '0xfedc...ba98', profit: 3200, winRate: 54, totalBets: 87 },
  { rank: 7, address: '0x2468...0ace', profit: 2800, winRate: 53, totalBets: 76 },
  { rank: 8, address: '0x1357...9bdf', profit: 2100, winRate: 52, totalBets: 65 },
  { rank: 9, address: '0xaced...1234', profit: 1800, winRate: 51, totalBets: 54 },
  { rank: 10, address: '0xbabe...cafe', profit: 1500, winRate: 50, totalBets: 43 },
]

type TimeFilter = '24h' | '7d' | 'all'

export default function LeaderboardPage() {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all')

  const top3 = mockLeaderboard.slice(0, 3)
  const rest = mockLeaderboard.slice(3)

  return (
    <div className="fb-page">
      <div className="fb-page-header">
        <h1 className="fb-page-title">Leaderboard</h1>
        <p className="fb-page-subtitle">Top traders by profit</p>
      </div>

      <div className="fb-page-content">
        <div className="fb-lb-filters">
          <button
            className={`fb-lb-filter ${timeFilter === '24h' ? 'active' : ''}`}
            onClick={() => setTimeFilter('24h')}
          >
            24h
          </button>
          <button
            className={`fb-lb-filter ${timeFilter === '7d' ? 'active' : ''}`}
            onClick={() => setTimeFilter('7d')}
          >
            7d
          </button>
          <button
            className={`fb-lb-filter ${timeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setTimeFilter('all')}
          >
            All
          </button>
        </div>

        {/* Podium for Top 3 */}
        <div className="fb-podium">
          {/* 2nd Place */}
          <div className="fb-podium-spot silver">
            <div className="fb-podium-avatar">
              <span className="fb-podium-medal">2</span>
            </div>
            <div className="fb-podium-address">{top3[1].address}</div>
            <div className="fb-podium-profit">+${top3[1].profit.toLocaleString()}</div>
            <div className="fb-podium-bar silver-bar">
              <div className="fb-podium-winrate">{top3[1].winRate}%</div>
            </div>
          </div>

          {/* 1st Place */}
          <div className="fb-podium-spot gold">
            <div className="fb-podium-crown">👑</div>
            <div className="fb-podium-avatar">
              <span className="fb-podium-medal">1</span>
            </div>
            <div className="fb-podium-address">{top3[0].address}</div>
            <div className="fb-podium-profit">+${top3[0].profit.toLocaleString()}</div>
            <div className="fb-podium-bar gold-bar">
              <div className="fb-podium-winrate">{top3[0].winRate}%</div>
            </div>
          </div>

          {/* 3rd Place */}
          <div className="fb-podium-spot bronze">
            <div className="fb-podium-avatar">
              <span className="fb-podium-medal">3</span>
            </div>
            <div className="fb-podium-address">{top3[2].address}</div>
            <div className="fb-podium-profit">+${top3[2].profit.toLocaleString()}</div>
            <div className="fb-podium-bar bronze-bar">
              <div className="fb-podium-winrate">{top3[2].winRate}%</div>
            </div>
          </div>
        </div>

        {/* Rest of the leaderboard */}
        <div className="fb-lb-table">
          {rest.map((entry) => (
            <div key={entry.rank} className="fb-lb-row">
              <span className="fb-lb-rank">#{entry.rank}</span>
              <span className="fb-lb-address">{entry.address}</span>
              <span className="fb-lb-winrate">{entry.winRate}%</span>
              <span className="fb-lb-profit positive">+${entry.profit.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
