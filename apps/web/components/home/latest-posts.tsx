'use client'

import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { Link } from '@/i18n/navigation'

interface BlogPost {
  id: string
  title: string
  excerpt: string
  date: string
  image: string
}

/* Placeholder blog data — CMS integration deferred */
const posts: BlogPost[] = [
  {
    id: 'hidden-courtyards-gamla-stan',
    title: 'Hidden Courtyards of Gamla Stan You Need to Visit',
    excerpt:
      'Discover the secret passageways and medieval courtyards tucked behind the colorful facades of Stockholm\'s Old Town.',
    date: '2026-02-28',
    image: 'https://images.unsplash.com/photo-1509356843151-3e7d96241e11?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'winter-photography-stockholm',
    title: 'Winter Photography Tips for Stockholm',
    excerpt: 'Capture the magic of Stockholm in winter with these expert photography tips from our guides.',
    date: '2026-02-15',
    image: 'https://images.unsplash.com/photo-1548777123-e216912df7d8?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'swedish-fika-tradition',
    title: 'The Art of Swedish Fika: A Cultural Guide',
    excerpt: 'More than just coffee — fika is a cherished tradition woven into the fabric of Swedish daily life.',
    date: '2026-02-01',
    image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80',
  },
]

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

/**
 * LatestPosts — asymmetric blog grid (1 featured + 2 smaller).
 * Placeholder data, no CMS dependency yet.
 */
export function LatestPosts() {
  const [featured, ...rest] = posts

  return (
    <section className="bg-white py-16 md:py-24" aria-label="Latest blog posts">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section heading */}
        <h2 className="mb-12 text-center text-sm font-semibold uppercase tracking-widest text-[#d0ad50]">
          Latest From Our Blog
        </h2>

        {/* Asymmetric grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Featured large card */}
          <Link href={`/blog/${featured.id}`} className="group">
            <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md">
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={featured.image}
                  alt={featured.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
              <div className="p-6">
                <time className="mb-2 block text-xs text-[#3e3e3e]">{formatDate(featured.date)}</time>
                <h3 className="mb-2 font-serif text-xl font-semibold text-[#252525]">{featured.title}</h3>
                <p className="mb-3 line-clamp-2 text-sm text-[#3e3e3e]">{featured.excerpt}</p>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-[#d0ad50]">
                  Read More <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </div>
          </Link>

          {/* Right column — 2 stacked smaller cards */}
          <div className="flex flex-col gap-6">
            {rest.map((post) => (
              <Link key={post.id} href={`/blog/${post.id}`} className="group">
                <div className="flex gap-4 overflow-hidden rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
                  <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg">
                    <Image
                      src={post.image}
                      alt={post.title}
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  </div>
                  <div className="flex flex-col justify-center">
                    <time className="mb-1 block text-xs text-[#3e3e3e]">{formatDate(post.date)}</time>
                    <h3 className="mb-1 font-serif text-base font-semibold text-[#252525] line-clamp-2">
                      {post.title}
                    </h3>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-[#d0ad50]">
                      Read More <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
