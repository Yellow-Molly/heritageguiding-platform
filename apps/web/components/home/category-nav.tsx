'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { MapPin, Compass, Castle, Building, Trees, Ship, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Category {
  id: string
  name: string
  slug: string
  icon: React.ReactNode
  tourCount: number
}

const themeCategories: Category[] = [
  {
    id: 'history',
    name: 'History & Heritage',
    slug: 'history',
    icon: <Castle className="h-6 w-6" />,
    tourCount: 8,
  },
  {
    id: 'architecture',
    name: 'Architecture',
    slug: 'architecture',
    icon: <Building className="h-6 w-6" />,
    tourCount: 5,
  },
  {
    id: 'nature',
    name: 'Nature & Parks',
    slug: 'nature',
    icon: <Trees className="h-6 w-6" />,
    tourCount: 4,
  },
  {
    id: 'maritime',
    name: 'Maritime History',
    slug: 'maritime',
    icon: <Ship className="h-6 w-6" />,
    tourCount: 3,
  },
]

const areaCategories: Category[] = [
  {
    id: 'gamla-stan',
    name: 'Gamla Stan',
    slug: 'gamla-stan',
    icon: <MapPin className="h-6 w-6" />,
    tourCount: 6,
  },
  {
    id: 'djurgarden',
    name: 'Djurgården',
    slug: 'djurgarden',
    icon: <Trees className="h-6 w-6" />,
    tourCount: 4,
  },
  {
    id: 'sodermalm',
    name: 'Södermalm',
    slug: 'sodermalm',
    icon: <Compass className="h-6 w-6" />,
    tourCount: 3,
  },
  {
    id: 'norrmalm',
    name: 'Norrmalm',
    slug: 'norrmalm',
    icon: <Building className="h-6 w-6" />,
    tourCount: 4,
  },
]

const ANIMATION_DELAY_PER_ITEM = 50 // ms

function CategoryCard({
  category,
  index,
  isVisible,
}: {
  category: Category
  index: number
  isVisible: boolean
}) {
  return (
    <Link
      href={`/tours?category=${category.slug}`}
      className={cn(
        'group flex items-center gap-4 rounded-xl border border-[var(--color-border)] bg-white p-4',
        'transition-all duration-300 hover:border-[var(--color-primary)] hover:shadow-[var(--shadow-card)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      )}
      style={{ transitionDelay: `${index * ANIMATION_DELAY_PER_ITEM}ms` }}
      aria-label={`Browse ${category.name} tours (${category.tourCount} available)`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)] transition-colors group-hover:bg-[var(--color-primary)] group-hover:text-white">
        {category.icon}
      </div>
      <div className="flex-1">
        <h3 className="font-medium text-[var(--color-primary)] group-hover:text-[var(--color-accent)]">
          {category.name}
        </h3>
        <p className="text-sm text-[var(--color-text-muted)]">{category.tourCount} tours</p>
      </div>
      <ArrowRight className="h-5 w-5 text-[var(--color-text-muted)] transition-transform group-hover:translate-x-1 group-hover:text-[var(--color-accent)]" />
    </Link>
  )
}

export function CategoryNav() {
  const sectionRef = useRef<HTMLElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const currentSection = sectionRef.current
    if (!currentSection) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.2 }
    )

    observer.observe(currentSection)

    return () => {
      observer.disconnect()
    }
  }, [])

  return (
    <section
      ref={sectionRef}
      className="bg-[var(--color-background-alt)] py-20 md:py-28"
      aria-label="Explore tours by category"
    >
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <div
          className={cn(
            'mb-12 text-center transition-all duration-700',
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          )}
        >
          <span className="mb-4 inline-block text-sm font-semibold uppercase tracking-wider text-[var(--color-accent)]">
            Explore
          </span>
          <h2 className="mb-4 font-serif text-3xl font-bold text-[var(--color-primary)] md:text-4xl">
            Find Your Perfect Experience
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-[var(--color-text-muted)]">
            Browse tours by theme or explore Stockholm&apos;s unique neighborhoods
          </p>
        </div>

        <div className="grid gap-12 lg:grid-cols-2">
          {/* By Theme */}
          <div>
            <h3
              className={cn(
                'mb-6 flex items-center gap-2 font-serif text-xl font-semibold text-[var(--color-primary)] transition-all duration-500',
                isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
              )}
            >
              <Compass className="h-5 w-5 text-[var(--color-secondary)]" />
              Explore by Theme
            </h3>
            <div className="grid gap-4">
              {themeCategories.map((category, index) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  index={index}
                  isVisible={isVisible}
                />
              ))}
            </div>
          </div>

          {/* By Area */}
          <div>
            <h3
              className={cn(
                'mb-6 flex items-center gap-2 font-serif text-xl font-semibold text-[var(--color-primary)] transition-all duration-500',
                isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
              )}
              style={{ transitionDelay: '100ms' }}
            >
              <MapPin className="h-5 w-5 text-[var(--color-secondary)]" />
              Explore by Area
            </h3>
            <div className="grid gap-4">
              {areaCategories.map((category, index) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  index={index + themeCategories.length}
                  isVisible={isVisible}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
