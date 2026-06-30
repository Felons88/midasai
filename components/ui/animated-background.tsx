"use client"

import { useEffect, useRef, useState } from "react"

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  opacity: number
  color: string
}

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const animationRef = useRef<number>()
  const particlesRef = useRef<Particle[]>([])

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  useEffect(() => {
    if (!canvasRef.current || dimensions.width === 0) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = dimensions.width
    canvas.height = dimensions.height

    // Initialize particles
    const particleCount = Math.floor((dimensions.width * dimensions.height) / 15000)
    particlesRef.current = Array.from({ length: particleCount }, () => ({
      x: Math.random() * dimensions.width,
      y: Math.random() * dimensions.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      radius: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.5 + 0.2,
      color: Math.random() > 0.5 ? '#fbbf24' : '#3b82f6' // amber-400 or blue-500
    }))

    const animate = () => {
      ctx.clearRect(0, 0, dimensions.width, dimensions.height)

      // Create gradient background
      const gradient = ctx.createLinearGradient(0, 0, dimensions.width, dimensions.height)
      gradient.addColorStop(0, 'rgba(251, 191, 36, 0.02)') // amber-400 with opacity
      gradient.addColorStop(0.5, 'rgba(59, 130, 246, 0.02)') // blue-500 with opacity
      gradient.addColorStop(1, 'rgba(251, 191, 36, 0.02)') // amber-400 with opacity
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, dimensions.width, dimensions.height)

      // Update and draw particles
      particlesRef.current.forEach((particle) => {
        // Update position
        particle.x += particle.vx
        particle.y += particle.vy

        // Wrap around edges
        if (particle.x < 0) particle.x = dimensions.width
        if (particle.x > dimensions.width) particle.x = 0
        if (particle.y < 0) particle.y = dimensions.height
        if (particle.y > dimensions.height) particle.y = 0

        // Draw particle
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2)
        ctx.fillStyle = particle.color + Math.floor(particle.opacity * 255).toString(16).padStart(2, '0')
        ctx.fill()

        // Create connections between nearby particles
        particlesRef.current.forEach((otherParticle) => {
          if (particle === otherParticle) return

          const dx = particle.x - otherParticle.x
          const dy = particle.y - otherParticle.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < 100) {
            ctx.beginPath()
            ctx.moveTo(particle.x, particle.y)
            ctx.lineTo(otherParticle.x, otherParticle.y)
            const opacity = (1 - distance / 100) * 0.2
            ctx.strokeStyle = particle.color + Math.floor(opacity * 255).toString(16).padStart(2, '0')
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        })
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [dimensions])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.6 }}
    />
  )
}

export function PremiumGradientBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-blue-500/5" />
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/3 via-transparent to-purple-500/3" />
      <div className="absolute inset-0 bg-gradient-to-bl from-purple-500/2 via-transparent to-pink-500/2" />
      <AnimatedBackground />
    </div>
  )
}
