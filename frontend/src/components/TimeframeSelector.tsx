'use client'

import { useState } from 'react'

type Timeframe = '1m' | '15m' | '1h' | '4h' | '1d'

interface TimeframeOption {
  value: Timeframe
  label: string
  description: string
}

const TIMEFRAMES: TimeframeOption[] = [
  { value: '1m', label: '1m', description: '60 seconds' },
  { value: '15m', label: '15m', description: '15 minutes' },
  { value: '1h', label: '1h', description: '1 hour' },
  { value: '4h', label: '4h', description: '4 hours' },
  { value: '1d', label: '1d', description: '24 hours' },
]

interface TimeframeSelectorProps {
  selected?: Timeframe
  onChange?: (timeframe: Timeframe) => void
  disabled?: boolean
}

export function TimeframeSelector({
  selected = '1m',
  onChange,
  disabled = false
}: TimeframeSelectorProps) {
  const [activeTimeframe, setActiveTimeframe] = useState<Timeframe>(selected)

  const handleSelect = (timeframe: Timeframe) => {
    if (disabled) return
    setActiveTimeframe(timeframe)
    onChange?.(timeframe)
  }

  return (
    <div className="w-full mb-6">
      <div className="text-2xs uppercase tracking-widest text-text-muted mb-2 text-center">
        Market Timeframe
      </div>
      <div className="flex items-center justify-center gap-1 p-1 bg-card/50 rounded-xl border border-card-border">
        {TIMEFRAMES.map((tf) => (
          <button
            key={tf.value}
            onClick={() => handleSelect(tf.value)}
            disabled={disabled}
            className={`
              relative px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 min-w-[44px]
              ${activeTimeframe === tf.value
                ? 'bg-accent text-background shadow-glow-accent'
                : 'text-text-secondary hover:text-text-primary hover:bg-card-hover'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'btn-press'}
              ${tf.value === '1m' ? 'relative' : ''}
            `}
            title={tf.description}
          >
            {tf.value === '1m' && activeTimeframe === '1m' && (
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-bet-up opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-bet-up" />
              </span>
            )}
            {tf.label}
          </button>
        ))}
      </div>
      <div className="text-2xs text-text-muted text-center mt-2">
        {activeTimeframe === '1m' ? (
          <span className="text-bet-up">Live</span>
        ) : (
          <span className="text-accent">Coming soon</span>
        )}
        {' · '}
        {TIMEFRAMES.find(tf => tf.value === activeTimeframe)?.description}
      </div>
    </div>
  )
}
