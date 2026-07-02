"use client"

import { useEffect, useRef, useState } from "react"

export function AnimatedCounter({
  value,
  suffix = "",
  prefix = "",
  duration = 2000,
  className = "",
  decimals = 0,
}: {
  value: number
  suffix?: string
  prefix?: string
  duration?: number
  className?: string
  decimals?: number
}) {
  const [display, setDisplay] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !started.current) {
          started.current = true
          const start = performance.now()
          const animate = (now: number) => {
            const progress = Math.min((now - start) / duration, 1)
            const ease = 1 - Math.pow(1 - progress, 3)
            setDisplay(value * ease)
            if (progress < 1) {
              requestAnimationFrame(animate)
            }
          }
          requestAnimationFrame(animate)
        }
      },
      { threshold: 0.3 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [value, duration])

  const formatted =
    decimals > 0 ? display.toFixed(decimals) : Math.floor(display).toLocaleString()

  return (
    <span ref={ref} className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  )
}
