import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'HeritageGuiding - Stockholm Tours',
  description:
    'Discover Stockholm with expert heritage guides. Private and group tours in Swedish, English, and German.',
  keywords: ['Stockholm tours', 'heritage guiding', 'city tours', 'private tours'],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://heritageguiding.com',
    siteName: 'HeritageGuiding',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>{children}</body>
    </html>
  )
}
