'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

const ROUND_DURATION = 60

/**
 * useTimer — drives the countdown display.
 *
 * When `syncSeconds` is provided (from the contract's secondsRemaining),
 * the timer snaps to that value and counts down locally for smooth UX.
 * When the contract reports 0 or undefined, the timer shows 0 (idle).
 */
export function useTimer(syncSeconds?: number) {
  const [seconds, setSeconds] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const lastSync = useRef<number | undefined>(undefined)

  // Sync from chain whenever it changes meaningfully
  useEffect(() => {
    if (syncSeconds === undefined) return

    // Snap to chain value
    setSeconds(syncSeconds)
    setIsActive(syncSeconds > 0)
    lastSync.current = syncSeconds
  }, [syncSeconds])

  // Local countdown between chain polls (smooth ticking)
  useEffect(() => {
    if (!isActive || seconds <= 0) return

    const id = window.setInterval(() => {
      setSeconds(prev => {
        if (prev <= 1) {
          setIsActive(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => window.clearInterval(id)
  }, [isActive]) // only re-create interval when isActive changes

  const formatTime = (s: number): string => {
    const mins = Math.floor(s / 60)
    const secs = s % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return {
    secondsRemaining: seconds,
    isActive,
    formattedTime: formatTime(seconds),
    isUrgent: seconds <= 10 && seconds > 0,
    progress: (ROUND_DURATION - seconds) / ROUND_DURATION,
  }
}
