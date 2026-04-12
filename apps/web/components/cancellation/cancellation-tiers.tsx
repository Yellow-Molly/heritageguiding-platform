import { CircleCheck, Clock, CircleX } from 'lucide-react'

interface TierCard {
  title: string
  timeframe: string
  description: string
}

interface CancellationTiersProps {
  sectionTag: string
  title: string
  subtitle: string
  cards: [TierCard, TierCard, TierCard]
}

/* Tier visual config: border color, icon, icon bg */
const tierConfig = [
  { border: 'border-t-[#10B981]', Icon: CircleCheck, iconColor: 'text-[#10B981]', iconBg: 'bg-[#10B981]/10' },
  { border: 'border-t-[#F59E0B]', Icon: Clock, iconColor: 'text-[#F59E0B]', iconBg: 'bg-[#F59E0B]/10' },
  { border: 'border-t-[#EF4444]', Icon: CircleX, iconColor: 'text-[#EF4444]', iconBg: 'bg-[#EF4444]/10' },
] as const

/**
 * Three-column refund tier cards with colored top borders and semantic icons.
 */
export function CancellationTiers({ sectionTag, title, subtitle, cards }: CancellationTiersProps) {
  return (
    <section aria-label="Refund tiers" className="bg-[var(--color-background)] py-16">
      <div className="container mx-auto px-5 md:px-20">
        {/* Section header */}
        <div className="mb-10 text-center">
          <span className="text-sm font-semibold uppercase tracking-widest text-[var(--color-secondary)]">
            {sectionTag}
          </span>
          <h2 className="mt-2 font-serif text-3xl font-bold text-[var(--color-primary)]">
            {title}
          </h2>
          <p className="mt-2 text-[var(--color-text-muted)]">{subtitle}</p>
        </div>

        {/* Tier cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {cards.map((card, i) => {
            const { border, Icon, iconColor, iconBg } = tierConfig[i]
            return (
              <div
                key={i}
                className={`rounded-[20px] border-t-4 ${border} bg-[var(--color-surface)] p-8 shadow-lg`}
              >
                <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-full ${iconBg}`}>
                  <Icon className={`h-6 w-6 ${iconColor}`} />
                </div>
                <h3 className="text-xl font-bold text-[var(--color-primary)]">{card.title}</h3>
                <p className="mt-1 text-sm font-medium text-[var(--color-text-muted)]">
                  {card.timeframe}
                </p>
                <p className="mt-3 text-[var(--color-text)]">{card.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
