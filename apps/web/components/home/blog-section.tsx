'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { BlogCard } from './blog-card'

// TODO: Replace with CMS blog collection integration
const blogPosts = [
  {
    slug: 'hidden-gems-gamla-stan',
    title: 'Top 10 Hidden Gems in Gamla Stan',
    excerpt: 'Beyond the tourist trail lies a world of secret courtyards, medieval cellars, and centuries-old artisan workshops waiting to be discovered.',
    image: 'https://images.unsplash.com/photo-1509356843151-3e7d96241e11?auto=format&fit=crop&w=800&q=80',
    imageAlt: 'Hidden courtyard in Gamla Stan',
    categoryKey: 'tips' as const,
  },
  {
    slug: 'royal-palace-history',
    title: 'The Story Behind Stockholm\'s Royal Palace',
    excerpt: 'From a medieval fortress to one of Europe\'s largest palaces — discover the dramatic 700-year history of the Swedish monarchy\'s official residence.',
    image: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=800&q=80',
    imageAlt: 'Stockholm Royal Palace exterior',
    categoryKey: 'history' as const,
  },
  {
    slug: 'swedish-fika-tradition',
    title: 'Swedish Fika: A Cultural Tradition',
    excerpt: 'More than just coffee and pastries — learn why fika is the cornerstone of Swedish social life and where to find the best fika spots in Stockholm.',
    image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80',
    imageAlt: 'Swedish fika with cinnamon buns and coffee',
    categoryKey: 'culture' as const,
  },
]

export function BlogSection() {
  const t = useTranslations('home.blog')
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
      className="bg-white py-20"
      aria-label="Blog posts"
    >
      <div className="container mx-auto px-4 lg:px-8">
        {/* Header */}
        <div
          className={`mb-12 text-center transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <span className="mb-4 inline-block text-sm font-semibold uppercase tracking-wider text-[var(--color-accent)]">
            {t('label')}
          </span>
          <h2 className="mb-4 font-serif text-3xl font-bold text-[var(--color-primary)] md:text-4xl lg:text-5xl">
            {t('title')}
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-[var(--color-text-muted)]">
            {t('subtitle')}
          </p>
        </div>

        {/* Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {blogPosts.map((post) => (
            <BlogCard
              key={post.slug}
              title={post.title}
              excerpt={post.excerpt}
              image={post.image}
              imageAlt={post.imageAlt}
              category={t(`category.${post.categoryKey}`)}
              slug={post.slug}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
