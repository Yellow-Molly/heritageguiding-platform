'use client'

import { useEffect, useRef, useState } from 'react'
import { Globe, ShieldCheck, Calendar, Star } from 'lucide-react'

interface StatItem {
  icon: React.ReactNode
  value: number
  suffix: string
  label: string
  description: string
}

const stats: StatItem[] = [
  {
    icon: <Globe className="h-7 w-7" />,
    value: 25,
    suffix: '+',
    label: 'Expert Local Guides',
    description: 'Certified guides with deep heritage knowledge',
  },
  {
    icon: <ShieldCheck className="h-7 w-7" />,
    value: 100,
    suffix: '%',
    label: 'Trusted Tour Agency',
    description: 'Licensed, insured, and fully vetted',
  },
  {
    icon: <Calendar className="h-7 w-7" />,
    value: 15,
    suffix: '+',
    label: 'Years of Experience',
    description: 'Connecting travelers with Swedish history',
  },
  {
    icon: <Star className="h-7 w-7" />,
    value: 98,
    suffix: '%',
    label: 'Travelers Are Happy',
    description: 'Based on verified guest reviews',
  },
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

function StatCard({ stat, isVisible }: { stat: StatItem; isVisible: boolean }) {
  const count = useCountUp(stat.value, 2000, isVisible)

  return (
    <div className="flex flex-col items-center text-center">
      {/* Circular icon container */}
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-[#DBC078]/30 bg-[#e6d3a0]/20 text-[#d0ad50]">
        {stat.icon}
      </div>
      <div className="mb-1 font-serif text-4xl font-bold text-[#252525] md:text-5xl">
        {count}
        {stat.suffix}
      </div>
      <div className="mb-1 text-sm font-semibold text-[#252525]">{stat.label}</div>
      <div className="text-xs text-[#3e3e3e]">{stat.description}</div>
    </div>
  )
}

export function TrustSignals() {
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
      className="bg-white py-16 md:py-24"
      aria-label="Trust statistics"
    >
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section heading */}
        <h2 className="mb-12 text-center text-sm font-semibold uppercase tracking-widest text-[#d0ad50]">
          Why Travel With Us
        </h2>

        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 md:gap-12">
          {stats.map((stat, index) => (
            <StatCard key={index} stat={stat} isVisible={isVisible} />
          ))}
        </div>
      </div>
    </section>
  )
}
