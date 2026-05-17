'use client'

/**
 * App Router global error boundary — required by Sentry to capture React
 * render errors that escape route-level error.tsx boundaries.
 *
 * Must include its own <html>/<body> because it replaces the root layout
 * when triggered. Keeps a minimal fallback UI (no i18n / no design system)
 * since the surrounding layout may itself be the source of the crash.
 */
import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string }
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="en">
      <body
        style={{
          fontFamily: 'system-ui, sans-serif',
          padding: '4rem 1.5rem',
          maxWidth: '40rem',
          margin: '0 auto',
        }}
      >
        <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
          Something went wrong
        </h1>
        <p style={{ marginBottom: '1.5rem', color: '#444' }}>
          An unexpected error occurred. The issue has been logged. Please try
          again, or contact us at info@privatetours.se if it persists.
        </p>
        {/* Plain <a> on purpose — Link would attempt SPA navigation through the
            broken layout that triggered this boundary. A hard reload is safer. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href="/"
          style={{
            display: 'inline-block',
            padding: '0.5rem 1rem',
            background: '#0b0b0b',
            color: 'white',
            borderRadius: '0.5rem',
            textDecoration: 'none',
          }}
        >
          Return home
        </a>
      </body>
    </html>
  )
}
