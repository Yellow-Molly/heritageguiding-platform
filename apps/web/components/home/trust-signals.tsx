'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'

interface StatItem {
  value: number
  suffix: string
  label: string
  description: string
}

function useCountUp(target: number, duration = 2000, isVisible: boolean) {
  const [count, setCount] = useState(target)

  useEffect(() => {
    if (!isVisible) return

    /* Skip animation for users who prefer reduced motion */
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCount(target)
      return
    }

    /* Reset to 0 before animating up (SSR rendered target value) */
    setCount(0)

    const startTime = Date.now()
    const isDecimal = target % 1 !== 0

    let rafId: number

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
        rafId = requestAnimationFrame(animate)
      }
    }

    rafId = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(rafId)
  }, [target, duration, isVisible])

  return count
}

function StatCard({ stat, isVisible }: { stat: StatItem; isVisible: boolean }) {
  const count = useCountUp(stat.value, 2000, isVisible)

  return (
    <div className="flex flex-col gap-2 bg-[var(--color-primary)] p-5 md:gap-4 md:p-8">
      {/* Gold number */}
      <div className="font-serif text-3xl font-bold text-[var(--color-secondary-light)] md:text-5xl">
        {count}
        {stat.suffix}
      </div>
      <div className="text-sm font-bold text-white md:text-base">{stat.label}</div>
      <div className="text-xs leading-[1.5] text-white/70 md:text-sm">{stat.description}</div>
    </div>
  )
}

interface TrustSignalsProps {
  guideCount?: number
}

export function TrustSignals({ guideCount = 7 }: TrustSignalsProps) {
  const t = useTranslations('home.trust')
  const sectionRef = useRef<HTMLElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  const stats: StatItem[] = [
    {
      value: guideCount,
      suffix: '+',
      label: t('expertGuides'),
      description: t('expertGuidesDesc'),
    },
    {
      value: 100,
      suffix: '%',
      label: t('trustedAgency'),
      description: t('trustedAgencyDesc'),
    },
    {
      value: 15,
      suffix: '+',
      label: t('yearsExperience'),
      description: t('yearsExperienceDesc'),
    },
    {
      value: 98,
      suffix: '%',
      label: t('happyTravelers'),
      description: t('happyTravelersDesc'),
    },
  ]

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
      className="bg-[var(--color-background)] px-4 py-10 md:px-20 md:py-20"
      aria-label="Trust statistics"
    >
      <div className="container mx-auto px-4 lg:px-8">
        {/* Desktop: Header row with title left, gold line right */}
        <div className="mb-8 flex flex-col items-center gap-4 md:mb-12 md:flex-row md:items-end md:justify-between">
          <h2 className="text-center font-serif text-[28px] font-bold leading-[1.1] text-[var(--color-primary)] md:text-left md:text-[42px]">
            {t('sectionTitle')}
          </h2>
          <div className="hidden h-[3px] w-[200px] bg-[var(--color-secondary)] md:block" />
        </div>

        {/* Stat cards grid */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-6">
          {stats.map((stat, index) => (
            <StatCard key={index} stat={stat} isVisible={isVisible} />
          ))}
        </div>
      </div>
    </section>
  )
}
