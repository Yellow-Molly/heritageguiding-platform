import { RefreshCw, Clock3, ShieldCheck } from 'lucide-react'

interface CancellationTrustBannerProps {
  title: string
  items: [string, string, string]
}

const trustIcons = [RefreshCw, Clock3, ShieldCheck] as const

/**
 * Trust banner on primary background with gold icons and white text.
 */
export function CancellationTrustBanner({ title, items }: CancellationTrustBannerProps) {
  return (
    <section aria-label="Trust guarantees" className="bg-[var(--color-primary)] py-16">
      <div className="container mx-auto px-5 md:px-20">
        <h2 className="mb-10 text-center font-serif text-3xl font-bold text-white">{title}</h2>
        <div className="flex flex-col items-center justify-center gap-12 md:flex-row">
          {items.map((label, i) => {
            const Icon = trustIcons[i]
            return (
              <div key={i} className="flex flex-col items-center gap-3">
                <Icon className="h-8 w-8 text-[var(--color-secondary-light)]" />
                <span className="text-lg font-medium text-white">{label}</span>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
