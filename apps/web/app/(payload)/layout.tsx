import type { Metadata } from 'next'
import '@payloadcms/next/css'
import { geistSans, geistMono } from '@/lib/fonts'

export const metadata: Metadata = {
  title: 'HeritageGuiding Admin',
  description: 'Content management for HeritageGuiding',
}

export default function PayloadLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body>
    </html>
  )
}
