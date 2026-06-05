import Image from 'next/image'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Coming Soon | Private Tours Stockholm',
  description:
    'Private Tours Stockholm is launching soon. Premium private tours through Sweden with expert local guides.',
  // Holding page must never be indexed, even though production otherwise allows crawling.
  robots: { index: false, follow: false },
}

export default function ComingSoonPage() {
  return (
    <main
      className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6 py-12 text-center"
      style={{ backgroundColor: '#0b0b0b' }}
    >
      {/* Subtle radial glow behind content */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 45%, rgba(196,160,82,0.08) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      {/* Logo */}
      <div className="relative mb-10 sm:mb-14">
        <Image
          src="/logo.svg"
          alt="Private Tours Stockholm"
          width={320}
          height={50}
          priority
          className="h-auto w-56 sm:w-72 md:w-80"
        />
      </div>

      {/* Heading */}
      <h1
        className="relative mb-3 font-[family-name:var(--font-heading)] text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl"
        style={{ color: '#FAFAF8' }}
      >
        Something Special is Coming
      </h1>

      {/* Subtext */}
      <p className="relative mb-10 max-w-md text-base text-white/60 sm:mb-14 sm:text-lg">
        Premium private tours through Sweden with expert local guides.
      </p>

      {/* Decorative separator */}
      <div
        className="relative mb-6 h-px w-16"
        style={{ backgroundColor: 'rgba(219,192,120,0.3)' }}
        aria-hidden="true"
      />

      {/* Footer note */}
      <p className="relative text-xs text-white/30 sm:text-sm">
        Launching April 2026 &middot; Stockholm, Sweden
      </p>
    </main>
  )
}
