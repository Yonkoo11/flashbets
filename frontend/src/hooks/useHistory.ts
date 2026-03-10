'use client'

import { useState, useEffect, useCallback } from 'react'
import { BetDirection, HistoryEntry } from '@/types'

const STORAGE_KEY = 'flashbets_history'
const MAX_ENTRIES = 10

export function useHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load history from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          if (Array.isArray(parsed)) {
            setHistory(parsed)
          }
        } catch {
          // Invalid JSON, ignore
        }
      }
      setIsLoaded(true)
    }
  }, [])

  // Save history to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded && typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
    }
  }, [history, isLoaded])

  const addEntry = useCallback((entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => {
    const newEntry: HistoryEntry = {
      ...entry,
      id: Date.now().toString(),
      timestamp: Date.now(),
    }

    setHistory((prev) => [newEntry, ...prev].slice(0, MAX_ENTRIES))
  }, [])

  const clearHistory = useCallback(() => {
    setHistory([])
  }, [])

  return {
    history,
    isLoaded,
    addEntry,
    clearHistory,
  }
}
