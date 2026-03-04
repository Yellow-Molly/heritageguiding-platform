'use client'

import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { ArrowRight } from 'lucide-react'

interface Guide {
  name: string
  specialty: string
  image: string
}

/* Placeholder guide data — CMS integration deferred */
const guides: Guide[] = [
  {
    name: 'Anna S.',
    specialty: 'Stockholm',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
  },
  {
    name: 'Erik L.',
    specialty: 'Gothenburg',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
  },
  {
    name: 'Maria K.',
    specialty: 'Uppsala',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=300&q=80',
  },
  {
    name: 'Johan B.',
    specialty: 'Malmö',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80',
  },
]

/**
 * GuidesPreview — circular headshots of top guides.
 * Replaces the old WhyChooseUs benefits grid.
 */
export function GuidesPreview() {
  return (
    <section className="bg-white py-16 md:py-24" aria-label="Meet our guides">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section heading */}
        <h2 className="mb-12 text-center text-sm font-semibold uppercase tracking-widest text-[#d0ad50]">
          Meet Our Guides
        </h2>

        {/* Guides grid — 4-col desktop, 2x2 mobile */}
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 md:gap-12">
          {guides.map((guide) => (
            <div key={guide.name} className="flex flex-col items-center text-center">
              {/* Circular headshot */}
              <div className="relative mb-4 h-28 w-28 overflow-hidden rounded-full border-2 border-[#DBC078] md:h-32 md:w-32">
                <Image
                  src={guide.image}
                  alt={guide.name}
                  fill
                  className="object-cover"
                  sizes="128px"
                />
              </div>
              <h3 className="font-serif text-lg font-semibold text-[#252525]">{guide.name}</h3>
              <p className="text-sm text-[#3e3e3e]">{guide.specialty}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <Link
            href="/guides"
            className="inline-flex items-center gap-2 rounded-full border-2 border-[#d0ad50] px-8 py-3 font-medium text-[#d0ad50] transition-all hover:bg-[#d0ad50] hover:text-white"
          >
            Meet All Guides
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
