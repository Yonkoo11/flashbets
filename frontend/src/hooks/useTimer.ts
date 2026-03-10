'use client'

import { useState, useEffect, useCallback } from 'react'

interface TimerState {
  secondsRemaining: number
  isActive: boolean
  roundId: number
}

const ROUND_DURATION = 60 // 60 seconds per round

// Module-level variable to track interval - survives React re-renders
let globalIntervalId: number | null = null
let intervalCount = 0

export function useTimer() {
  const [state, setState] = useState<TimerState>({
    secondsRemaining: ROUND_DURATION,
    isActive: true,
    roundId: 1,
  })

  const startNewRound = useCallback(() => {
    setState({
      secondsRemaining: ROUND_DURATION,
      isActive: true,
      roundId: Date.now(),
    })
  }, [])

  useEffect(() => {
    if (!state.isActive) {
      // Clear interval when not active
      if (globalIntervalId !== null) {
          window.clearInterval(globalIntervalId)
        globalIntervalId = null
      }
      return
    }

    // Always clear any existing interval first
    if (globalIntervalId !== null) {
      window.clearInterval(globalIntervalId)
      globalIntervalId = null
    }

    // Create new interval
    intervalCount++
    const myIntervalNumber = intervalCount
    globalIntervalId = window.setInterval(() => {
      setState((prev) => {
        if (!prev.isActive) {
          return prev
        }

        if (prev.secondsRemaining <= 1) {
          return {
            ...prev,
            secondsRemaining: 0,
            isActive: false,
          }
        }

        return {
          ...prev,
          secondsRemaining: prev.secondsRemaining - 1,
        }
      })
    }, 1000)


    return () => {
      if (globalIntervalId !== null) {
        window.clearInterval(globalIntervalId)
        globalIntervalId = null
      }
    }
  }, [state.isActive, state.roundId])

  // Auto-restart round after it ends
  useEffect(() => {
    if (!state.isActive && state.secondsRemaining === 0) {
      const timeout = window.setTimeout(() => {
        startNewRound()
      }, 3000)

      return () => window.clearTimeout(timeout)
    }
  }, [state.isActive, state.secondsRemaining, startNewRound])

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return {
    ...state,
    formattedTime: formatTime(state.secondsRemaining),
    isUrgent: state.secondsRemaining <= 10 && state.secondsRemaining > 0,
    progress: (ROUND_DURATION - state.secondsRemaining) / ROUND_DURATION,
    startNewRound,
  }
}
