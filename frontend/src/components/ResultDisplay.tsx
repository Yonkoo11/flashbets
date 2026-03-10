'use client'

import { useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ResultDisplayProps {
  isWin: boolean
  profit: number
  onDismiss: () => void
  streak?: number
}

function Confetti({ count = 60 }: { count?: number }) {
  const colors = ['#22c55e', '#fbbf24', '#10b981', '#34d399', '#4ade80']
  const shapes = ['w-3 h-3 rounded-sm', 'w-2 h-4 rounded-full', 'w-4 h-2']

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-40" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className={`absolute ${shapes[i % shapes.length]}`}
          style={{
            backgroundColor: colors[i % colors.length],
            left: `${Math.random() * 100}%`,
          }}
          initial={{
            y: -20,
            opacity: 1,
            rotate: 0,
            scale: 0.5 + Math.random() * 1,
          }}
          animate={{
            y: '110vh',
            opacity: 0,
            rotate: Math.random() * 720 - 360,
          }}
          transition={{
            duration: 2.5 + Math.random() * 2,
            delay: Math.random() * 0.8,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  )
}

export function ResultDisplay({ isWin, profit, onDismiss, streak = 0 }: ResultDisplayProps) {
  const handleDismiss = useCallback(() => {
    onDismiss()
  }, [onDismiss])

  // Auto-dismiss after 4 seconds (increased from 3)
  useEffect(() => {
    const timer = setTimeout(handleDismiss, 4000)
    return () => clearTimeout(timer)
  }, [handleDismiss])

  // Handle keyboard dismiss
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        handleDismiss()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleDismiss])

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 flex items-center justify-center z-50 cursor-pointer"
        onClick={handleDismiss}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="result-title"
        aria-describedby="result-description"
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        />

        {isWin && <Confetti />}

        {/* Screen flash for loss */}
        {!isWin && (
          <motion.div
            className="fixed inset-0 bg-bet-down pointer-events-none"
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          />
        )}

        {/* Result card */}
        <motion.div
          initial={{ scale: 0.3, opacity: 0, y: 50 }}
          animate={{
            scale: 1,
            opacity: 1,
            y: 0,
            ...(isWin ? {} : { x: [0, -15, 15, -10, 10, -5, 5, 0] })
          }}
          exit={{ scale: 0.5, opacity: 0, y: 20 }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 20,
            ...(isWin ? {} : { x: { duration: 0.5 } })
          }}
          className="relative"
        >
          <div
            className={`px-10 py-8 sm:px-14 sm:py-10 rounded-3xl text-center shadow-2xl relative overflow-hidden ${
              isWin ? 'bg-gradient-to-br from-bet-up to-bet-up-dark' : 'bg-gradient-to-br from-bet-down to-bet-down-dark'
            }`}
          >
            {/* Animated glow effect for wins */}
            {isWin && (
              <motion.div
                className="absolute inset-0 rounded-3xl pointer-events-none"
                style={{
                  boxShadow: '0 0 60px rgba(34, 197, 94, 0.5)',
                }}
                animate={{
                  boxShadow: [
                    '0 0 60px rgba(34, 197, 94, 0.5)',
                    '0 0 120px rgba(34, 197, 94, 0.8)',
                    '0 0 60px rgba(34, 197, 94, 0.5)',
                  ],
                }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            )}

            {/* Emoji/Icon */}
            <motion.div
              className="text-5xl sm:text-6xl mb-3"
              initial={{ scale: 0.93, rotate: -15 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
              aria-hidden="true"
            >
              {isWin ? '🎉' : '😔'}
            </motion.div>

            {/* Title */}
            <motion.div
              id="result-title"
              className="text-4xl sm:text-5xl font-bold text-white mb-2 relative font-heading"
              animate={isWin ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.5, repeat: isWin ? 2 : 0 }}
            >
              {isWin ? 'YOU WON!' : 'Better Luck'}
            </motion.div>

            {/* Loss subtitle */}
            {!isWin && (
              <motion.div
                className="text-white/80 text-sm sm:text-base mb-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                Next Round
              </motion.div>
            )}

            {/* Profit/Loss amount */}
            <motion.div
              id="result-description"
              className={`text-3xl sm:text-4xl font-bold text-white relative font-mono ${
                isWin ? 'drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]' : ''
              }`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {profit > 0 ? '+' : ''}{Math.abs(profit).toFixed(0)}
              <span className="text-lg sm:text-xl ml-1 opacity-80">TOKENS</span>
            </motion.div>

            {/* Streak indicator for wins */}
            {isWin && streak > 1 && (
              <motion.div
                className="mt-4 inline-flex items-center gap-2 bg-white/20 px-4 py-1.5 rounded-full"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
              >
                <span className="text-lg">🔥</span>
                <span className="text-white font-bold text-sm">{streak} Win Streak!</span>
              </motion.div>
            )}

            {/* Encouraging message for losses */}
            {!isWin && (
              <motion.div
                className="mt-4 text-white/70 text-xs sm:text-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                Try again next round
              </motion.div>
            )}

            {/* Dismiss hint */}
            <motion.div
              className="mt-5 text-white/50 text-xs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              Tap anywhere or press any key to dismiss
            </motion.div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
