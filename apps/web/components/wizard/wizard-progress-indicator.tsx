import { cn } from '@/lib/utils'

interface WizardProgressIndicatorProps {
  currentStep: number
  totalSteps: number
}

/** Visual step progress indicator with animated dots */
export function WizardProgressIndicator({ currentStep, totalSteps }: WizardProgressIndicatorProps) {
  return (
    <div className="mb-8 flex justify-center gap-2" role="progressbar" aria-valuenow={currentStep} aria-valuemin={1} aria-valuemax={totalSteps}>
      {Array.from({ length: totalSteps }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-2 rounded-full transition-all duration-300',
            i + 1 <= currentStep ? 'w-10 bg-[var(--color-accent)]' : 'w-8 bg-[var(--color-border)]'
          )}
        />
      ))}
    </div>
  )
}
