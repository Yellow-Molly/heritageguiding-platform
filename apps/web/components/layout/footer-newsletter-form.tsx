'use client'

interface FooterNewsletterFormProps {
  heading: string
  copy: string
  placeholder: string
  button: string
  ariaLabel: string
}

/**
 * Newsletter signup — disabled stub awaiting backend wiring.
 * Form is intentionally non-interactive to avoid silently dropping submissions.
 * Re-enable by removing `disabled`/`aria-disabled` and wiring `onSubmit` to the
 * subscription provider (e.g. Brevo) once that integration lands.
 */
export function FooterNewsletterForm({
  heading,
  copy,
  placeholder,
  button,
  ariaLabel,
}: FooterNewsletterFormProps) {
  return (
    <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
      <div className="text-center md:text-left">
        <h3 className="mb-2 font-serif text-2xl font-bold text-white">{heading}</h3>
        <p className="text-[#e6d3a0]/70">{copy}</p>
      </div>
      <form
        className="flex w-full max-w-md gap-3"
        aria-disabled="true"
        onSubmit={(e) => e.preventDefault()}
      >
        <input
          type="email"
          placeholder={placeholder}
          disabled
          className="flex-1 rounded-lg border border-[#DBC078]/30 bg-white/10 px-4 py-3 text-white placeholder:text-white/50 focus:border-[#DBC078] focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
          aria-label={ariaLabel}
        />
        <button
          type="submit"
          disabled
          className="rounded-lg bg-[#DBC078] px-6 py-3 font-medium text-[#0b0b0b] transition-colors hover:bg-[var(--color-secondary-light)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-[#DBC078]"
        >
          {button}
        </button>
      </form>
    </div>
  )
}
