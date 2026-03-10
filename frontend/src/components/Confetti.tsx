'use client'

import { useEffect, useState } from 'react'

interface ConfettiProps {
  active: boolean
  duration?: number
}

const COLORS = ['#00e676', '#ffd000', '#ff1744', '#ffffff', '#a855f7']

export function Confetti({ active, duration = 3000 }: ConfettiProps) {
  const [pieces, setPieces] = useState<Array<{
    id: number
    x: number
    color: string
    delay: number
    size: number
  }>>([])

  useEffect(() => {
    if (!active) {
      setPieces([])
      return
    }

    // Generate confetti pieces
    const newPieces = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      delay: Math.random() * 0.5,
      size: 6 + Math.random() * 8,
    }))

    setPieces(newPieces)

    // Clear after duration
    const timer = setTimeout(() => {
      setPieces([])
    }, duration)

    return () => clearTimeout(timer)
  }, [active, duration])

  if (pieces.length === 0) return null

  return (
    <div className="fb-confetti">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="fb-confetti-piece"
          style={{
            left: `${piece.x}%`,
            backgroundColor: piece.color,
            width: piece.size,
            height: piece.size,
            animationDelay: `${piece.delay}s`,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          }}
        />
      ))}
    </div>
  )
}
