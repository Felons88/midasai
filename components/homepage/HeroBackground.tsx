"use client"

import { useEffect, useRef } from "react"

export function HeroBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationId: number
    let width = 0
    let height = 0
    const particles: { x: number; y: number; vx: number; vy: number; r: number; alpha: number }[] = []

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = canvas.clientWidth
      height = canvas.clientHeight
      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    function createParticles() {
      particles.length = 0
      const count = Math.min(40, Math.floor((width * height) / 45000))
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.25,
          r: Math.random() * 1.5 + 0.5,
          alpha: Math.random() * 0.3 + 0.1,
        })
      }
    }

    function draw() {
      ctx.clearRect(0, 0, width, height)

      // Draw faint grid
      ctx.strokeStyle = "rgba(255,255,255,0.025)"
      ctx.lineWidth = 1
      const gridSize = 60
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, height)
        ctx.stroke()
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
        ctx.stroke()
      }

      // Draw particles and connections
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0) p.x = width
        if (p.x > width) p.x = 0
        if (p.y < 0) p.y = height
        if (p.y > height) p.y = 0

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(202,138,4,${p.alpha})`
        ctx.fill()

        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j]
          const dx = p.x - q.x
          const dy = p.y - q.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 120) {
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(q.x, q.y)
            ctx.strokeStyle = `rgba(202,138,4,${0.08 * (1 - dist / 120)})`
            ctx.stroke()
          }
        }
      }

      animationId = requestAnimationFrame(draw)
    }

    resize()
    createParticles()
    draw()

    window.addEventListener("resize", () => {
      resize()
      createParticles()
    })

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener("resize", resize)
    }
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Radial gradient backdrop */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-background" />
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(circle at 20% 20%, rgba(202, 138, 4, 0.08) 0%, transparent 45%),
            radial-gradient(circle at 80% 30%, rgba(59, 130, 246, 0.05) 0%, transparent 40%),
            radial-gradient(circle at 50% 80%, rgba(139, 92, 246, 0.05) 0%, transparent 50%)
          `,
        }}
      />
      {/* Animated canvas particles */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-60" />
      {/* Top light leak */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] opacity-20"
        style={{
          background: "radial-gradient(ellipse at center top, rgba(202, 138, 4, 0.18), transparent 70%)",
          filter: "blur(60px)",
        }}
      />
    </div>
  )
}
