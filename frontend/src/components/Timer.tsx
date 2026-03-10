'use client'

interface TimerProps {
  formattedTime: string
  isUrgent: boolean
  progress: number
  secondsRemaining: number
  isActive: boolean
}

type TimerState = 'calm' | 'warning' | 'urgent' | 'critical' | 'ended'

function getTimerState(secondsRemaining: number, isActive: boolean): TimerState {
  if (!isActive) return 'ended'
  if (secondsRemaining > 30) return 'calm'
  if (secondsRemaining > 15) return 'warning'
  if (secondsRemaining > 5) return 'urgent'
  return 'critical'
}

const stateStyles: Record<TimerState, {
  ring: string
  glow: string
  text: string
  pulse: boolean
  message: string
}> = {
  calm: {
    ring: 'text-bet-up',
    glow: 'ring-glow-up',
    text: 'text-text-primary',
    pulse: false,
    message: '',
  },
  warning: {
    ring: 'text-amber-500',
    glow: '',
    text: 'text-text-primary',
    pulse: false,
    message: '',
  },
  urgent: {
    ring: 'text-orange-500',
    glow: 'ring-glow-urgent',
    text: 'text-orange-500',
    pulse: true,
    message: 'Betting closes soon!',
  },
  critical: {
    ring: 'text-bet-down',
    glow: 'glow-urgent',
    text: 'text-bet-down',
    pulse: true,
    message: 'Last chance to bet!',
  },
  ended: {
    ring: 'text-text-muted',
    glow: '',
    text: 'text-text-muted',
    pulse: false,
    message: '',
  },
}

export function Timer({ formattedTime, isUrgent, progress, secondsRemaining, isActive }: TimerProps) {
  const radius = 45
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - progress)

  const timerState = getTimerState(secondsRemaining, isActive)
  const styles = stateStyles[timerState]

  // Animation speed increases with urgency
  const pulseClass = styles.pulse ? 'animate-pulse' : ''
  const pulseSpeed = timerState === 'critical' ? 'animate-[pulse_0.5s_ease-in-out_infinite]' : pulseClass

  return (
    <div className="mb-6 sm:mb-8 text-center" role="timer" aria-live="polite" aria-atomic="true">
      {/* Status Label */}
      <div className={`text-xs sm:text-sm mb-1.5 sm:mb-2 transition-colors duration-300 ${
        isActive ? 'text-text-secondary' : 'text-accent'
      }`}>
        {isActive ? 'Time Remaining' : 'Round Ended'}
      </div>

      {/* Digital Timer Display */}
      <div
        className={`font-mono text-4xl sm:text-5xl font-bold tracking-tight transition-all duration-300 ${styles.text} ${pulseSpeed}`}
        style={timerState === 'critical' ? { textShadow: '0 0 20px rgba(239,68,68,0.5)' } : undefined}
        aria-label={`${secondsRemaining} seconds remaining`}
      >
        {formattedTime}
      </div>

      {/* Circular Progress Ring */}
      <div className={`mt-3 sm:mt-4 relative w-24 h-24 sm:w-28 sm:h-28 mx-auto transition-[filter,box-shadow] duration-300 ${styles.glow}`}>
        <svg
          className="w-full h-full transform -rotate-90"
          viewBox="0 0 100 100"
          aria-hidden="true"
        >
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            className="text-card-border opacity-50"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
            className={`transition-[stroke-dashoffset] duration-1000 ease-out ${styles.ring}`}
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: strokeDashoffset,
            }}
          />
          {/* Tick marks at 15-second intervals */}
          {[0, 15, 30, 45].map((tick) => (
            <line
              key={tick}
              x1="50"
              y1="8"
              x2="50"
              y2="12"
              stroke="currentColor"
              strokeWidth="2"
              className="text-card-border opacity-30"
              transform={`rotate(${tick * 6} 50 50)`}
            />
          ))}
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-mono text-xl sm:text-2xl font-bold transition-colors duration-300 ${styles.text}`}>
            {secondsRemaining}
          </span>
          <span className="text-2xs text-text-muted uppercase tracking-wider">
            sec
          </span>
        </div>

        {/* Pulsing ring overlay for critical state */}
        {timerState === 'critical' && (
          <div className="absolute inset-0 rounded-full border-4 border-bet-down/50 animate-ping" />
        )}
      </div>

      {/* Status messages */}
      {!isActive && (
        <div className="mt-3 sm:mt-4 flex items-center justify-center gap-2 text-text-secondary text-xs sm:text-sm">
          <span className="flex gap-1" aria-hidden="true">
            <span className="w-1.5 h-1.5 rounded-full bg-accent loading-dot" />
            <span className="w-1.5 h-1.5 rounded-full bg-accent loading-dot" />
            <span className="w-1.5 h-1.5 rounded-full bg-accent loading-dot" />
          </span>
          <span>Next round starting soon</span>
        </div>
      )}

      {/* Urgency warnings */}
      {styles.message && (
        <div className={`mt-2 sm:mt-3 text-xs sm:text-sm font-medium ${styles.text} ${pulseSpeed}`}>
          {styles.message}
        </div>
      )}

      {/* Visual indicator bar for quick scanning */}
      <div className="mt-4 mx-auto max-w-[200px]">
        <div className="h-1.5 w-full bg-card rounded-full overflow-hidden">
          <div
            className={`h-full transition-[width] duration-1000 ease-out ${
              timerState === 'calm' ? 'bg-bet-up' :
              timerState === 'warning' ? 'bg-amber-500' :
              timerState === 'urgent' ? 'bg-orange-500' :
              timerState === 'critical' ? 'bg-bet-down' :
              'bg-text-muted'
            }`}
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <div className="flex justify-between mt-1 text-2xs text-text-muted">
          <span>0s</span>
          <span>60s</span>
        </div>
      </div>
    </div>
  )
}
