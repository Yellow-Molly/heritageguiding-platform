'use client'

import { useEffect, useRef, useState } from 'react'
import { Users, MapPin, Star, Calendar } from 'lucide-react'

interface StatItem {
  icon: React.ReactNode
  value: number
  suffix: string
  label: string
}

const stats: StatItem[] = [
  {
    icon: <Users className="h-8 w-8" />,
    value: 5000,
    suffix: '+',
    label: 'Happy Travelers',
  },
  {
    icon: <MapPin className="h-8 w-8" />,
    value: 25,
    suffix: '+',
    label: 'Unique Tours',
  },
  {
    icon: <Star className="h-8 w-8" />,
    value: 4.9,
    suffix: '',
    label: 'Average Rating',
  },
  {
    icon: <Calendar className="h-8 w-8" />,
    value: 15,
    suffix: '+',
    label: 'Years Experience',
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
      // Ease out cubic
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
      <div className="mb-3 text-[var(--color-secondary)]">{stat.icon}</div>
      <div className="mb-1 font-serif text-4xl font-bold text-white md:text-5xl">
        {count}
        {stat.suffix}
      </div>
      <div className="text-sm font-medium text-white/80 md:text-base">{stat.label}</div>
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
      className="bg-[var(--color-primary)] py-16 md:py-20"
      aria-label="Trust statistics"
    >
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 md:gap-12">
          {stats.map((stat, index) => (
            <StatCard key={index} stat={stat} isVisible={isVisible} />
          ))}
        </div>
      </div>
    </section>
  )
}
