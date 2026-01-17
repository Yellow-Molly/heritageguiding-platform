import { Inter, Playfair_Display } from 'next/font/google'

// Primary body font - Inter
export const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
})

// Heading font - Playfair Display
export const playfairDisplay = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
})

// Legacy font variables (for backward compatibility)
export const geistSans = {
  variable: '--font-geist-sans',
}

export const geistMono = {
  variable: '--font-geist-mono',
}
