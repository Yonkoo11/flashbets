'use client'

import { useCallback, useRef, useEffect } from 'react'

type SoundType = 'click' | 'win' | 'lose' | 'tick' | 'urgent'

const SOUNDS: Record<SoundType, string> = {
  click: '/audio/click-sound.mp3',
  win: '/audio/win-sound.mp3',
  lose: '/audio/click-sound.mp3', // Reuse click for now
  tick: '/audio/click-sound.mp3',
  urgent: '/audio/click-sound.mp3',
}

export function useSound() {
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({})
  const enabled = useRef(true)

  // Preload sounds
  useEffect(() => {
    if (typeof window === 'undefined') return

    Object.entries(SOUNDS).forEach(([key, src]) => {
      const audio = new Audio(src)
      audio.preload = 'auto'
      audio.volume = 0.3
      audioRefs.current[key] = audio
    })

    return () => {
      Object.values(audioRefs.current).forEach(audio => {
        audio.pause()
        audio.src = ''
      })
    }
  }, [])

  const play = useCallback((sound: SoundType) => {
    if (!enabled.current) return

    const audio = audioRefs.current[sound]
    if (audio) {
      audio.currentTime = 0
      audio.play().catch(() => {
        // Autoplay blocked - ignore silently
      })
    }
  }, [])

  const setEnabled = useCallback((value: boolean) => {
    enabled.current = value
  }, [])

  return { play, setEnabled }
}
