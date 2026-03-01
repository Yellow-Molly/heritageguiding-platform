'use client'

import { useEffect, useRef, useState } from 'react'
import { Users, ShieldCheck, Calendar, Smile } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface StatItem {
  icon: React.ReactNode
  value: number
  suffix: string
  labelKey: string
}

const stats: StatItem[] = [
  { icon: <Users className="h-8 w-8" />, value: 12, suffix: '+', labelKey: 'licensedGuides' },
  { icon: <ShieldCheck className="h-8 w-8" />, value: 100, suffix: '%', labelKey: 'trusted' },
  { icon: <Calendar className="h-8 w-8" />, value: 15, suffix: '+', labelKey: 'yearsExperience' },
  { icon: <Smile className="h-8 w-8" />, value: 98, suffix: '%', labelKey: 'happyTravelers' },
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

      if (isDecimal) {
        setCount(parseFloat(currentValue.toFixed(1)))
      } else {
        setCount(Math.floor(currentValue))
      }

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [target, duration, isVisible])

  return count
}

function StatCard({ stat, isVisible, label }: { stat: StatItem; isVisible: boolean; label: string }) {
  const count = useCountUp(stat.value, 2000, isVisible)

  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-3 text-[var(--color-accent)]">{stat.icon}</div>
      <div className="mb-1 font-serif text-4xl font-bold text-[var(--color-primary)] md:text-5xl">
        {count}
        {stat.suffix}
      </div>
      <div className="text-sm font-medium text-[var(--color-text-muted)] md:text-base">{label}</div>
    </div>
  )
}

export function TrustSignals() {
  const t = useTranslations('home.trust')
  const sectionRef = useRef<HTMLElement>(null)
  const [isVisible, setIsVisible] = useState(false)

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

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section
      id="trust-signals"
      ref={sectionRef}
      className="bg-[var(--color-background-alt)] py-16 md:py-20"
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
