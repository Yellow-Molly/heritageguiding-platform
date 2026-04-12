import { Send, MailCheck, Wallet } from 'lucide-react'

interface Step {
  title: string
  description: string
}

interface CancellationStepperProps {
  title: string
  subtitle: string
  steps: [Step, Step, Step]
}

const stepIcons = [Send, MailCheck, Wallet] as const

/**
 * Three-step horizontal (desktop) / vertical (mobile) process stepper
 * with gold circles and connecting lines.
 */
export function CancellationStepper({ title, subtitle, steps }: CancellationStepperProps) {
  return (
    <section aria-label="Cancellation process steps" className="bg-[var(--color-background-alt)] py-16">
      <div className="container mx-auto px-5 md:px-20">
        {/* Header */}
        <div className="mb-12 text-center">
          <h2 className="font-serif text-3xl font-bold text-[var(--color-primary)]">{title}</h2>
          <p className="mt-2 text-[var(--color-text-muted)]">{subtitle}</p>
        </div>

        {/* Steps — horizontal on desktop, vertical on mobile */}
        <div className="flex flex-col items-center gap-8 md:flex-row md:items-start md:justify-center">
          {steps.map((step, i) => {
            const Icon = stepIcons[i]
            return (
              <div key={i} className="flex flex-col items-center md:flex-row md:items-start">
                {/* Step content */}
                <div className="flex max-w-[200px] flex-col items-center text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-secondary)]">
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-[var(--color-primary)]">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                    {step.description}
                  </p>
                </div>

                {/* Connecting line — not after last step */}
                {i < steps.length - 1 && (
                  <>
                    {/* Horizontal line (desktop) */}
                    <div className="mt-8 hidden h-[2px] w-16 flex-shrink-0 bg-[var(--color-secondary)] md:block lg:w-24" />
                    {/* Vertical line (mobile) */}
                    <div className="my-2 h-8 w-[2px] bg-[var(--color-secondary)] md:hidden" />
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
