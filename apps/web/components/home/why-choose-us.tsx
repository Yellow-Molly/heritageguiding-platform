'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Award, Shield, Heart, Globe, Sparkles, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Benefit {
  icon: React.ReactNode
  title: string
  description: string
}

const benefits: Benefit[] = [
  {
    icon: <Award className="h-7 w-7" />,
    title: 'Expert Licensed Guides',
    description:
      'All guides are certified by the Swedish tourism board with years of specialized heritage knowledge.',
  },
  {
    icon: <Heart className="h-7 w-7" />,
    title: 'Passionate Storytellers',
    description:
      'We bring history to life through engaging narratives that connect you to Stockholm\'s past.',
  },
  {
    icon: <Shield className="h-7 w-7" />,
    title: 'Fully Insured',
    description:
      'Travel with confidence knowing every tour is covered by comprehensive liability insurance.',
  },
  {
    icon: <Globe className="h-7 w-7" />,
    title: 'Multilingual Tours',
    description:
      'Tours available in Swedish, English, and German to serve international visitors.',
  },
  {
    icon: <Sparkles className="h-7 w-7" />,
    title: 'Exclusive Access',
    description:
      'Gain entry to hidden gems and private areas not accessible to regular tourists.',
  },
  {
    icon: <Users className="h-7 w-7" />,
    title: 'Small Groups',
    description:
      'Intimate group sizes ensure personalized attention and authentic experiences.',
  },
]

function BenefitCard({
  benefit,
  index,
  isVisible,
}: {
  benefit: Benefit
  index: number
  isVisible: boolean
}) {
  return (
    <div
      className={cn(
        'group rounded-2xl bg-white p-6 shadow-[var(--shadow-card)] transition-all duration-500',
        'hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-1',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      )}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      {/* Icon */}
      <div className="mb-4 inline-flex rounded-xl bg-[var(--color-primary)]/10 p-3 text-[var(--color-primary)] transition-colors group-hover:bg-[var(--color-accent)] group-hover:text-white">
        {benefit.icon}
      </div>

      {/* Title */}
      <h3 className="mb-2 font-serif text-xl font-semibold text-[var(--color-primary)]">
        {benefit.title}
      </h3>

      {/* Description */}
      <p className="text-[var(--color-text-muted)]">{benefit.description}</p>
    </div>
  )
}

export function WhyChooseUs() {
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
      { threshold: 0.2 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section
      ref={sectionRef}
      className="bg-[var(--color-background-alt)] py-20 md:py-28"
      aria-label="Why choose us"
    >
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left Column - Image and Content */}
          <div
            className={cn(
              'transition-all duration-700',
              isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
            )}
          >
            {/* Section Header */}
            <span className="mb-4 inline-block text-sm font-semibold uppercase tracking-wider text-[var(--color-accent)]">
              Why Choose Us
            </span>
            <h2 className="mb-6 font-serif text-3xl font-bold text-[var(--color-primary)] md:text-4xl">
              Experience Heritage Like Never Before
            </h2>
            <p className="mb-8 text-lg text-[var(--color-text-muted)]">
              For over 15 years, we&apos;ve been connecting travelers with Stockholm&apos;s rich
              history. Our commitment to excellence and passion for storytelling sets us apart.
            </p>

            {/* Image */}
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-xl">
              <Image
                src="https://images.unsplash.com/photo-1569091791842-7cfb64e04797?q=80&w=800"
                alt="Tour guide explaining Stockholm history to a group"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              {/* Accent Corner */}
              <div className="absolute -bottom-4 -right-4 h-24 w-24 rounded-2xl bg-[var(--color-secondary)]" />
            </div>
          </div>

          {/* Right Column - Benefits Grid */}
          <div className="grid gap-6 sm:grid-cols-2">
            {benefits.map((benefit, index) => (
              <BenefitCard key={index} benefit={benefit} index={index} isVisible={isVisible} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
