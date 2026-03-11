'use client'

import { useState } from 'react'
import { useChainEvents } from '@/hooks/useChainEvents'

export default function LeaderboardPage() {
  const { leaderboard, loading, refresh } = useChainEvents()
  const [timeFilter, setTimeFilter] = useState<'24h' | '7d' | 'all'>('all')

  // Time filter is UI-only for now (all data is on-chain, no timestamp index)
  // In production you'd filter by block range corresponding to time periods
  const top3 = leaderboard.slice(0, 3)
  const rest = leaderboard.slice(3)

  return (
    <div className="fb-page">
      <div className="fb-page-header">
        <h1 className="fb-page-title">Leaderboard</h1>
        <p className="fb-page-subtitle">Top traders by profit</p>
      </div>

      <div className="fb-page-content">
        <div className="fb-lb-filters">
          {(['24h', '7d', 'all'] as const).map(f => (
            <button
              key={f}
              className={`fb-lb-filter ${timeFilter === f ? 'active' : ''}`}
              onClick={() => setTimeFilter(f)}
            >
              {f === 'all' ? 'All' : f}
            </button>
          ))}
          <button
            onClick={refresh}
            disabled={loading}
            style={{ marginLeft: 'auto', fontSize: '12px', opacity: 0.6, background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
          >
            {loading ? 'Loading...' : '↻ Refresh'}
          </button>
        </div>

        {loading && leaderboard.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', opacity: 0.5 }}>
            Reading chain data...
          </div>
        ) : leaderboard.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', opacity: 0.6 }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏆</div>
            <p style={{ fontWeight: 600, marginBottom: '8px' }}>No data yet</p>
            <p style={{ fontSize: '14px' }}>Be the first to place a bet and claim your spot</p>
          </div>
        ) : (
          <>
            {/* Podium — only render if enough players */}
            {top3.length >= 3 && (
              <div className="fb-podium">
                {/* 2nd Place */}
                <div className="fb-podium-spot silver">
                  <div className="fb-podium-avatar"><span className="fb-podium-medal">2</span></div>
                  <div className="fb-podium-address">{top3[1].address}</div>
                  <div className="fb-podium-profit">{top3[1].profit >= 0 ? '+' : ''}{top3[1].profit.toFixed(4)} ETH</div>
                  <div className="fb-podium-bar silver-bar">
                    <div className="fb-podium-winrate">{top3[1].winRate}%</div>
                  </div>
                </div>

                {/* 1st Place */}
                <div className="fb-podium-spot gold">
                  <div className="fb-podium-crown">👑</div>
                  <div className="fb-podium-avatar"><span className="fb-podium-medal">1</span></div>
                  <div className="fb-podium-address">{top3[0].address}</div>
                  <div className="fb-podium-profit">{top3[0].profit >= 0 ? '+' : ''}{top3[0].profit.toFixed(4)} ETH</div>
                  <div className="fb-podium-bar gold-bar">
                    <div className="fb-podium-winrate">{top3[0].winRate}%</div>
                  </div>
                </div>

                {/* 3rd Place */}
                <div className="fb-podium-spot bronze">
                  <div className="fb-podium-avatar"><span className="fb-podium-medal">3</span></div>
                  <div className="fb-podium-address">{top3[2].address}</div>
                  <div className="fb-podium-profit">{top3[2].profit >= 0 ? '+' : ''}{top3[2].profit.toFixed(4)} ETH</div>
                  <div className="fb-podium-bar bronze-bar">
                    <div className="fb-podium-winrate">{top3[2].winRate}%</div>
                  </div>
                </div>
              </div>
            )}

            {/* Single/double player case — just show table */}
            {top3.length < 3 && top3.map((entry, i) => (
              <div key={entry.address} className="fb-lb-row" style={{ padding: '16px' }}>
                <span className="fb-lb-rank">#{i + 1}</span>
                <span className="fb-lb-address">{entry.address}</span>
                <span className="fb-lb-winrate">{entry.winRate}%</span>
                <span className={`fb-lb-profit ${entry.profit >= 0 ? 'positive' : 'negative'}`}>
                  {entry.profit >= 0 ? '+' : ''}{entry.profit.toFixed(4)} ETH
                </span>
              </div>
            ))}

            {/* Rest of the leaderboard (rank 4+) */}
            {rest.length > 0 && (
              <div className="fb-lb-table">
                {rest.map((entry, i) => (
                  <div key={entry.address} className="fb-lb-row">
                    <span className="fb-lb-rank">#{i + 4}</span>
                    <span className="fb-lb-address">{entry.address}</span>
                    <span className="fb-lb-winrate">{entry.winRate}%</span>
                    <span className={`fb-lb-profit ${entry.profit >= 0 ? 'positive' : 'negative'}`}>
                      {entry.profit >= 0 ? '+' : ''}{entry.profit.toFixed(4)} ETH
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
