'use client'

import { useEffect, useState } from 'react'

/** Target: April 2, 2026 at 22:00 CEST (UTC+2) = 20:00 UTC */
const TARGET_UTC = new Date('2026-04-02T20:00:00Z').getTime()

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

function calcTimeLeft(): TimeLeft {
  const diff = Math.max(0, TARGET_UTC - Date.now())
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  }
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

export function CountdownTimer() {
  const [time, setTime] = useState<TimeLeft | null>(null)

  useEffect(() => {
    setTime(calcTimeLeft())
    const id = setInterval(() => setTime(calcTimeLeft()), 1000)
    return () => clearInterval(id)
  }, [])

  // Avoid hydration mismatch — render placeholder on server
  if (!time) {
    return (
      <div className="flex gap-3 sm:gap-5" aria-label="Countdown timer loading">
        {['Days', 'Hours', 'Minutes', 'Seconds'].map((label) => (
          <div key={label} className="flex flex-col items-center">
            <span
              className="font-[family-name:var(--font-heading)] tabular-nums text-4xl sm:text-6xl md:text-7xl font-bold"
              style={{ color: '#DBC078' }}
            >
              --
            </span>
            <span className="mt-1 text-xs sm:text-sm uppercase tracking-widest text-white/50">
              {label}
            </span>
          </div>
        ))}
      </div>
    )
  }

  const segments: { value: number; label: string }[] = [
    { value: time.days, label: 'Days' },
    { value: time.hours, label: 'Hours' },
    { value: time.minutes, label: 'Minutes' },
    { value: time.seconds, label: 'Seconds' },
  ]

  const isExpired = time.days + time.hours + time.minutes + time.seconds === 0

  if (isExpired) {
    return (
      <p
        className="font-[family-name:var(--font-heading)] text-3xl sm:text-4xl md:text-5xl font-bold"
        style={{ color: '#DBC078' }}
      >
        We are live!
      </p>
    )
  }

  return (
    <div
      className="flex gap-3 sm:gap-5"
      role="timer"
      aria-label={`${time.days} days, ${time.hours} hours, ${time.minutes} minutes, ${time.seconds} seconds remaining`}
    >
      {segments.map(({ value, label }) => (
        <div key={label} className="flex flex-col items-center">
          <span
            className="font-[family-name:var(--font-heading)] tabular-nums text-4xl sm:text-6xl md:text-7xl font-bold transition-all duration-300"
            style={{ color: '#DBC078' }}
          >
            {pad(value)}
          </span>
          <span className="mt-1 text-xs sm:text-sm uppercase tracking-widest text-white/50">
            {label}
          </span>
        </div>
      ))}
    </div>
  )
}
