import { Inter, Playfair_Display } from 'next/font/google'

// Primary body font - Inter
// latin subset covers Swedish å/ä/ö (U+00E5, U+00E4, U+00F6); latin-ext dropped to save bandwidth on mobile LCP path
export const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
})

// Heading font - Playfair Display
// preload: false — used only in headings; demote priority so hero image gets bandwidth first under Slow 4G
export const playfairDisplay = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
  display: 'swap',
  preload: false,
})

// Legacy font variables (for backward compatibility)
export const geistSans = {
  variable: '--font-geist-sans',
}

export const geistMono = {
  variable: '--font-geist-mono',
}
