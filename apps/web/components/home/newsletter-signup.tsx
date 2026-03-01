'use client'

import { useState, type FormEvent } from 'react'
import { useTranslations } from 'next-intl'
import { getButtonClassName } from '@/components/ui/button'

export function NewsletterSignup() {
  const t = useTranslations('home.newsletter')
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    // TODO: Integrate with email service (Mailchimp, SendGrid, etc.)
    setSubmitted(true)
  }

  return (
    <section
      className="bg-[var(--color-background-alt)] py-16"
      aria-label="Newsletter signup"
    >
      <div className="container mx-auto max-w-2xl px-4 text-center">
        <h2 className="font-serif text-2xl font-bold text-[var(--color-primary)] md:text-3xl">
          {t('title')}
        </h2>
        <p className="mt-2 text-[var(--color-text-muted)]">
          {t('subtitle')}
        </p>

        {submitted ? (
          <p className="mt-6 text-lg font-medium text-[var(--color-success)]" aria-live="polite">
            {t('success')}
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3 sm:flex-row">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('placeholder')}
              aria-label={t('placeholder')}
              className="flex-1 rounded-lg border border-[var(--color-border)] bg-white px-4 py-3 text-[var(--color-text)] placeholder:text-[var(--color-text-light)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20"
            />
            <button
              type="submit"
              className={getButtonClassName('primary', 'lg', 'whitespace-nowrap')}
            >
              {t('submit')}
            </button>
          </form>
        )}

        <p className="mt-3 text-xs text-[var(--color-text-muted)]">
          {t('privacy')}
        </p>
      </div>
    </section>
  )
}
