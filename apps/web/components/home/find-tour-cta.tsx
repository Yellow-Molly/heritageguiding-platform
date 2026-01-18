'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Search, CalendarDays, Users, MapPin } from 'lucide-react'
import { getButtonClassName } from '@/components/ui/button'

export function FindTourCta() {
  return (
    <section className="relative overflow-hidden py-20 md:py-28" aria-label="Find your tour">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://images.unsplash.com/photo-1508189860359-777d945909ef?auto=format&fit=crop&w=2070&q=80"
          alt="Stockholm waterfront panorama"
          fill
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-[var(--color-primary)]/90" />
      </div>

      {/* Decorative Elements */}
      <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
        <svg
          className="absolute -left-20 top-0 h-80 w-80 text-[var(--color-secondary)]/10"
          viewBox="0 0 200 200"
        >
          <circle cx="100" cy="100" r="80" fill="currentColor" />
        </svg>
        <svg
          className="absolute -bottom-20 -right-20 h-96 w-96 text-[var(--color-accent)]/10"
          viewBox="0 0 200 200"
        >
          <rect x="20" y="20" width="160" height="160" rx="20" fill="currentColor" />
        </svg>
      </div>

      <div className="container relative z-20 mx-auto px-4 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          {/* Section Header */}
          <span className="mb-4 inline-block text-sm font-semibold uppercase tracking-wider text-[var(--color-secondary)]">
            Start Your Journey
          </span>
          <h2 className="mb-6 font-serif text-3xl font-bold text-white md:text-4xl lg:text-5xl">
            Find Your Perfect Tour
          </h2>
          <p className="mx-auto mb-12 max-w-2xl text-lg text-white/80">
            Answer a few questions and let us recommend the ideal heritage experience tailored to
            your interests, schedule, and group size.
          </p>

          {/* Feature Cards */}
          <div className="mb-12 grid gap-6 md:grid-cols-4">
            <div className="rounded-xl bg-white/10 p-6 text-center backdrop-blur-sm">
              <CalendarDays className="mx-auto mb-3 h-8 w-8 text-[var(--color-secondary)]" />
              <h3 className="mb-1 font-medium text-white">Flexible Dates</h3>
              <p className="text-sm text-white/70">Tours available daily</p>
            </div>
            <div className="rounded-xl bg-white/10 p-6 text-center backdrop-blur-sm">
              <Users className="mx-auto mb-3 h-8 w-8 text-[var(--color-secondary)]" />
              <h3 className="mb-1 font-medium text-white">Any Group Size</h3>
              <p className="text-sm text-white/70">Private to 20+ guests</p>
            </div>
            <div className="rounded-xl bg-white/10 p-6 text-center backdrop-blur-sm">
              <MapPin className="mx-auto mb-3 h-8 w-8 text-[var(--color-secondary)]" />
              <h3 className="mb-1 font-medium text-white">Multiple Routes</h3>
              <p className="text-sm text-white/70">25+ unique tours</p>
            </div>
            <div className="rounded-xl bg-white/10 p-6 text-center backdrop-blur-sm">
              <Search className="mx-auto mb-3 h-8 w-8 text-[var(--color-secondary)]" />
              <h3 className="mb-1 font-medium text-white">Smart Matching</h3>
              <p className="text-sm text-white/70">AI-powered suggestions</p>
            </div>
          </div>

          {/* CTA Button */}
          <Link
            href="/find-tour"
            className={getButtonClassName(
              'secondary',
              'xl',
              'shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all'
            )}
          >
            <Search className="mr-2 h-5 w-5" />
            Find Your Tour Now
          </Link>
        </div>
      </div>
    </section>
  )
}
