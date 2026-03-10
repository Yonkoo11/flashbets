'use client'

import { useState, useEffect } from 'react'
import { BetDirection } from '@/types'

interface ActivityEntry {
  id: string
  address: string
  direction: BetDirection
  amount: number
  timestamp: number
  type: 'bet' | 'win' | 'loss'
  profit?: number
}

// Generate mock activity
function generateMockActivity(): ActivityEntry {
  const addresses = [
    '0x7a23...8f91', '0x3b45...2d67', '0x9c12...4e89',
    '0x5d78...1a34', '0x2e90...6c45', '0x8b56...9d23',
    '0x4f21...7b67', '0xab12...cd34', '0xef56...gh78',
  ]
  const types: ('bet' | 'win' | 'loss')[] = ['bet', 'bet', 'bet', 'win', 'loss']
  const type = types[Math.floor(Math.random() * types.length)]
  const direction: BetDirection = Math.random() > 0.5 ? 'UP' : 'DOWN'
  const amount = [10, 25, 50, 100, 250, 500][Math.floor(Math.random() * 6)]

  return {
    id: Math.random().toString(36).substring(2, 9),
    address: addresses[Math.floor(Math.random() * addresses.length)],
    direction,
    amount,
    timestamp: Date.now(),
    type,
    profit: type === 'win' ? Math.round(amount * 0.95) : type === 'loss' ? -amount : undefined,
  }
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 5) return 'now'
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  return `${Math.floor(minutes / 60)}h ago`
}

export function ActivityFeed() {
  const [activities, setActivities] = useState<ActivityEntry[]>([])
  const [isPaused, setIsPaused] = useState(false)

  // Initialize with some mock data
  useEffect(() => {
    const initial: ActivityEntry[] = []
    for (let i = 0; i < 5; i++) {
      const entry = generateMockActivity()
      entry.timestamp = Date.now() - (i * 3000) // Stagger timestamps
      initial.push(entry)
    }
    setActivities(initial)
  }, [])

  // Add new activity periodically
  useEffect(() => {
    if (isPaused) return

    const interval = setInterval(() => {
      setActivities(prev => {
        const newActivity = generateMockActivity()
        return [newActivity, ...prev].slice(0, 10) // Keep only 10 entries
      })
    }, 4000 + Math.random() * 3000) // Random interval 4-7s

    return () => clearInterval(interval)
  }, [isPaused])

  // Update timestamps
  useEffect(() => {
    const interval = setInterval(() => {
      setActivities(prev => [...prev]) // Force re-render to update times
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const getActivityIcon = (entry: ActivityEntry) => {
    if (entry.type === 'win') return '🎉'
    if (entry.type === 'loss') return '💔'
    return entry.direction === 'UP' ? '📈' : '📉'
  }

  const getActivityText = (entry: ActivityEntry) => {
    if (entry.type === 'win') {
      return (
        <>
          <span className="text-text-primary">won</span>
          <span className="text-bet-up font-mono font-bold">+{entry.profit}</span>
        </>
      )
    }
    if (entry.type === 'loss') {
      return (
        <>
          <span className="text-text-primary">lost</span>
          <span className="text-bet-down font-mono">{entry.amount}</span>
        </>
      )
    }
    return (
      <>
        <span className="text-text-primary">bet</span>
        <span className="font-mono">{entry.amount}</span>
        <span className="text-text-primary">on</span>
        <span className={entry.direction === 'UP' ? 'text-bet-up font-medium' : 'text-bet-down font-medium'}>
          {entry.direction}
        </span>
      </>
    )
  }

  return (
    <div className="w-full card-elevated p-4" role="region" aria-label="Live betting activity">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2" aria-hidden="true">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-bet-up opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-bet-up" />
          </span>
          <h3 className="font-heading font-bold text-lg">Live Activity</h3>
        </div>
        <button
          onClick={() => setIsPaused(!isPaused)}
          className="text-2xs text-text-muted hover:text-text-secondary transition-colors px-2 py-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-pressed={isPaused}
          aria-label={isPaused ? 'Resume live updates' : 'Pause live updates'}
        >
          {isPaused ? 'Resume' : 'Pause'}
        </button>
      </div>

      {/* Activity List */}
      <div className="space-y-2 max-h-[300px] overflow-y-auto" aria-live="polite" aria-atomic="false">
        {activities.map((entry, index) => (
          <div
            key={entry.id}
            className={`flex items-center gap-2 py-2 text-sm border-b border-card-border/50 last:border-0 ${
              index === 0 ? 'animate-slide-down' : ''
            }`}
          >
            <span className="text-base flex-shrink-0">{getActivityIcon(entry)}</span>
            <div className="flex-1 min-w-0 flex items-center gap-1.5 flex-wrap">
              <span className="font-mono text-text-secondary truncate">{entry.address}</span>
              {getActivityText(entry)}
            </div>
            <span className="text-2xs text-text-muted flex-shrink-0">
              {formatTimeAgo(entry.timestamp)}
            </span>
          </div>
        ))}
      </div>

      {activities.length === 0 && (
        <div className="text-center py-8 text-text-muted text-sm">
          No recent activity
        </div>
      )}
    </div>
  )
}
