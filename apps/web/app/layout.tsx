import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
})

const playfairDisplay = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'HeritageGuiding - Premium Stockholm Heritage Tours',
  description:
    'Discover Stockholm with expert heritage guides. Private and group tours unveiling centuries of Swedish history in Swedish, English, and German.',
  keywords: [
    'Stockholm tours',
    'heritage guiding',
    'city tours',
    'private tours',
    'Gamla Stan tours',
    'Swedish history',
    'Stockholm guide',
    'cultural tours',
  ],
  authors: [{ name: 'HeritageGuiding' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://heritageguiding.com',
    siteName: 'HeritageGuiding',
    title: 'HeritageGuiding - Premium Stockholm Heritage Tours',
    description:
      'Discover Stockholm with expert heritage guides. Private and group tours unveiling centuries of Swedish history.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'HeritageGuiding - Stockholm Tours',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HeritageGuiding - Premium Stockholm Heritage Tours',
    description:
      'Discover Stockholm with expert heritage guides. Private and group tours unveiling centuries of Swedish history.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${playfairDisplay.variable} antialiased`}>
        {children}
      </body>
    </html>
  )
}
