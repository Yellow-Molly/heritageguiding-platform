import type { Metadata } from 'next'
import '@payloadcms/next/css'
import { inter, playfairDisplay } from '@/lib/fonts'

export const metadata: Metadata = {
  title: 'HeritageGuiding Admin',
  description: 'Content management for HeritageGuiding',
}

export default function PayloadLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${playfairDisplay.variable}`}>{children}</body>
    </html>
  )
}
