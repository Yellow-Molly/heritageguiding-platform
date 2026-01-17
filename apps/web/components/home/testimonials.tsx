'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Image from 'next/image'
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Testimonial {
  id: string
  name: string
  location: string
  avatar: string
  rating: number
  text: string
  tourName: string
}

const testimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Sarah Mitchell',
    location: 'London, UK',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200',
    rating: 5,
    text: 'An absolutely magical experience! Our guide Johan brought Gamla Stan to life with captivating stories. We discovered hidden gems we never would have found on our own.',
    tourName: 'Gamla Stan Walking Tour',
  },
  {
    id: '2',
    name: 'Marcus Weber',
    location: 'Munich, Germany',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200',
    rating: 5,
    text: 'Die Tour war fantastisch! The German-speaking guide was incredibly knowledgeable about Swedish-German historical connections. Highly recommended!',
    tourName: 'Royal Palace Experience',
  },
  {
    id: '3',
    name: 'Emma Larsson',
    location: 'Oslo, Norway',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=200',
    rating: 5,
    text: 'Perfect for families! My kids were engaged the entire time. The Vasa Museum came alive through our guide\'s storytelling. We learned so much!',
    tourName: 'Vasa Museum Deep Dive',
  },
  {
    id: '4',
    name: 'James Chen',
    location: 'San Francisco, USA',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200',
    rating: 5,
    text: 'Worth every penny. The private tour allowed us to explore at our own pace with expert guidance. Stockholm\'s history is fascinating!',
    tourName: 'Private City Tour',
  },
]

export function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const sectionRef = useRef<HTMLElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length)
  }, [])

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }, [])

  useEffect(() => {
    if (!isAutoPlaying) return
    const interval = setInterval(nextSlide, 5000)
    return () => clearInterval(interval)
  }, [isAutoPlaying, nextSlide])

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
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
      className="bg-[var(--color-background)] py-20 md:py-28"
      aria-label="Customer testimonials"
    >
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <div
          className={cn(
            'mb-12 text-center md:mb-16 transition-all duration-700',
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          )}
        >
          <span className="mb-4 inline-block text-sm font-semibold uppercase tracking-wider text-[var(--color-accent)]">
            Testimonials
          </span>
          <h2 className="mb-4 font-serif text-3xl font-bold text-[var(--color-primary)] md:text-4xl lg:text-5xl">
            What Our Guests Say
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-[var(--color-text-muted)]">
            Don&apos;t just take our word for it. Hear from travelers who&apos;ve experienced the
            magic of our heritage tours.
          </p>
        </div>

        {/* Testimonials Carousel */}
        <div
          className={cn(
            'relative mx-auto max-w-4xl transition-all duration-700 delay-200',
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          )}
          onMouseEnter={() => setIsAutoPlaying(false)}
          onMouseLeave={() => setIsAutoPlaying(true)}
        >
          {/* Quote Icon */}
          <Quote className="absolute -left-4 -top-4 h-16 w-16 text-[var(--color-primary)]/10 md:-left-8 md:-top-8 md:h-24 md:w-24" />

          {/* Testimonial Card */}
          <div className="relative overflow-hidden rounded-2xl bg-white p-8 shadow-[var(--shadow-card)] md:p-12">
            <div className="min-h-[280px]">
              {testimonials.map((testimonial, index) => (
                <div
                  key={testimonial.id}
                  className={cn(
                    'absolute inset-0 p-8 md:p-12 transition-all duration-500',
                    index === currentIndex
                      ? 'opacity-100 translate-x-0'
                      : index < currentIndex
                        ? 'opacity-0 -translate-x-full'
                        : 'opacity-0 translate-x-full'
                  )}
                  aria-hidden={index !== currentIndex}
                >
                  {/* Rating */}
                  <div className="mb-6 flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          'h-5 w-5',
                          i < testimonial.rating
                            ? 'fill-[var(--color-secondary)] text-[var(--color-secondary)]'
                            : 'text-gray-300'
                        )}
                      />
                    ))}
                  </div>

                  {/* Quote */}
                  <blockquote className="mb-8 font-serif text-xl italic text-[var(--color-text)] md:text-2xl">
                    &ldquo;{testimonial.text}&rdquo;
                  </blockquote>

                  {/* Author */}
                  <div className="flex items-center gap-4">
                    <div className="relative h-14 w-14 overflow-hidden rounded-full">
                      <Image
                        src={testimonial.avatar}
                        alt={testimonial.name}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--color-primary)]">{testimonial.name}</p>
                      <p className="text-sm text-[var(--color-text-muted)]">
                        {testimonial.location}
                      </p>
                      <p className="text-sm font-medium text-[var(--color-accent)]">
                        {testimonial.tourName}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="mt-8 flex items-center justify-center gap-4">
            <button
              onClick={prevSlide}
              className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-[var(--color-border)] bg-white text-[var(--color-primary)] transition-all hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            {/* Dots */}
            <div className="flex gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={cn(
                    'h-2.5 rounded-full transition-all',
                    index === currentIndex
                      ? 'w-8 bg-[var(--color-accent)]'
                      : 'w-2.5 bg-[var(--color-border)] hover:bg-[var(--color-text-muted)]'
                  )}
                  aria-label={`Go to testimonial ${index + 1}`}
                  aria-current={index === currentIndex}
                />
              ))}
            </div>

            <button
              onClick={nextSlide}
              className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-[var(--color-border)] bg-white text-[var(--color-primary)] transition-all hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white"
              aria-label="Next testimonial"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
