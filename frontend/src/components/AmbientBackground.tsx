'use client'

import { useEffect, useRef } from 'react'

export function AmbientBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationId: number
    let time = 0

    // Resize canvas to window
    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // Floating orbs - more visible
    const orbs = [
      { x: 0.2, y: 0.3, radius: 350, color: 'rgba(245, 158, 11, 0.12)', speed: 0.0004 },
      { x: 0.8, y: 0.6, radius: 300, color: 'rgba(16, 185, 129, 0.08)', speed: 0.0005 },
      { x: 0.5, y: 0.4, radius: 450, color: 'rgba(245, 158, 11, 0.06)', speed: 0.0003 },
      { x: 0.15, y: 0.75, radius: 250, color: 'rgba(239, 68, 68, 0.06)', speed: 0.0006 },
      { x: 0.85, y: 0.25, radius: 220, color: 'rgba(99, 102, 241, 0.07)', speed: 0.00045 },
    ]

    // Particles
    const particles: { x: number; y: number; vx: number; vy: number; life: number; maxLife: number }[] = []
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3 - 0.1,
        life: Math.random() * 200,
        maxLife: 200 + Math.random() * 100,
      })
    }

    const animate = () => {
      time += 1
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw animated orbs
      orbs.forEach((orb, i) => {
        const offsetX = Math.sin(time * orb.speed + i) * 100
        const offsetY = Math.cos(time * orb.speed * 1.3 + i) * 80
        const x = orb.x * canvas.width + offsetX
        const y = orb.y * canvas.height + offsetY

        const gradient = ctx.createRadialGradient(x, y, 0, x, y, orb.radius)
        gradient.addColorStop(0, orb.color)
        gradient.addColorStop(1, 'transparent')

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(x, y, orb.radius, 0, Math.PI * 2)
        ctx.fill()
      })

      // Draw and update particles
      particles.forEach((p) => {
        p.x += p.vx
        p.y += p.vy
        p.life += 1

        if (p.life > p.maxLife) {
          p.x = Math.random() * canvas.width
          p.y = canvas.height + 10
          p.life = 0
        }

        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height

        const alpha = Math.sin((p.life / p.maxLife) * Math.PI) * 0.6
        ctx.fillStyle = `rgba(245, 158, 11, ${alpha})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2)
        ctx.fill()
      })

      // Subtle scan line effect
      const scanY = (time * 0.5) % canvas.height
      const scanGradient = ctx.createLinearGradient(0, scanY - 100, 0, scanY + 100)
      scanGradient.addColorStop(0, 'transparent')
      scanGradient.addColorStop(0.5, 'rgba(245, 158, 11, 0.02)')
      scanGradient.addColorStop(1, 'transparent')
      ctx.fillStyle = scanGradient
      ctx.fillRect(0, scanY - 100, canvas.width, 200)

      animationId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animationId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="ambient-bg"
      aria-hidden="true"
    />
  )
}
