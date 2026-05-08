import type { PrivacyControllerCardProps } from './types'

/**
 * Data Controller card — surface with gold left border, two-column grid on
 * desktop. Left: identity. Right: contact (multi-line address + email).
 */
export function PrivacyControllerCard({
  id,
  heading,
  controllerLabel,
  contactLabel,
  emailLabel,
  controller,
}: PrivacyControllerCardProps) {
  return (
    <section id={id} aria-labelledby={id ? `${id}-heading` : undefined} className="scroll-mt-24">
      <h2
        id={id ? `${id}-heading` : undefined}
        className="mb-6 font-serif text-2xl font-bold text-[var(--color-primary)] md:text-3xl"
      >
        {heading}
        <span className="mt-2 block h-[2px] w-8 bg-[var(--color-secondary-light)]" />
      </h2>
      <article className="rounded-2xl border-l-4 border-[var(--color-secondary)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)] md:p-8">
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              {controllerLabel}
            </p>
            <p className="font-serif text-lg font-semibold text-[var(--color-primary)]">
              {controller.legalName}
            </p>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              {controller.orgNumber}
            </p>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              {contactLabel}
            </p>
            <address className="not-italic text-sm leading-relaxed text-[var(--color-text)]">
              {controller.address.map((line, i) => (
                <span key={i} className="block">
                  {line}
                </span>
              ))}
            </address>
            <p className="mt-3 text-sm">
              <span className="text-[var(--color-text-muted)]">{emailLabel}: </span>
              <a
                href={`mailto:${controller.email}`}
                className="font-medium text-[var(--color-accent)] underline-offset-2 hover:underline"
              >
                {controller.email}
              </a>
            </p>
          </div>
        </div>
      </article>
    </section>
  )
}
