'use client'

import { useEffect, useRef, useState } from 'react'
import { Users, Compass, Star, Calendar } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface StatItem {
  icon: typeof Users
  value: number
  suffix: string
  labelKey: string
}

const stats: StatItem[] = [
  { icon: Users, value: 5000, suffix: '+', labelKey: 'happyTravelers' },
  { icon: Compass, value: 25, suffix: '+', labelKey: 'uniqueTours' },
  { icon: Star, value: 4.9, suffix: '', labelKey: 'averageRating' },
  { icon: Calendar, value: 15, suffix: '+', labelKey: 'yearsExperience' },
]

function useCountUp(target: number, duration = 2000, isVisible: boolean) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!isVisible) return
    const startTime = Date.now()
    const isDecimal = target % 1 !== 0

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easeProgress = 1 - Math.pow(1 - progress, 3)
      const currentValue = easeProgress * target

      setCount(isDecimal ? parseFloat(currentValue.toFixed(1)) : Math.floor(currentValue))

      if (progress < 1) requestAnimationFrame(animate)
    }

    requestAnimationFrame(animate)
  }, [target, duration, isVisible])

  return count
}

function StatCard({ stat, isVisible, label }: { stat: StatItem; isVisible: boolean; label: string }) {
  const count = useCountUp(stat.value, 2000, isVisible)
  const Icon = stat.icon

  return (
    <div className="flex flex-col items-center text-center">
      {/* Circular icon container */}
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-[var(--color-secondary)]/30 bg-[var(--color-secondary)]/10">
        <Icon className="h-7 w-7 text-[var(--color-secondary)]" />
      </div>
      {/* Number */}
      <div className="mb-1 font-serif text-3xl font-bold text-white md:text-4xl">
        {count}{stat.suffix}
      </div>
      {/* Label */}
      <div className="text-sm text-white/70">{label}</div>
    </div>
  )
}

export function TrustSignals() {
  const sectionRef = useRef<HTMLElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const t = useTranslations('home.trust')

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )

    if (sectionRef.current) observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      id="trust-signals"
      ref={sectionRef}
      className="bg-[var(--color-primary-dark)] py-16 md:py-20"
      aria-label="Trust statistics"
    >
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 md:gap-12">
          {stats.map((stat, index) => (
            <StatCard key={index} stat={stat} isVisible={isVisible} label={t(stat.labelKey)} />
          ))}
        </div>
      </div>
    </section>
  )
}
