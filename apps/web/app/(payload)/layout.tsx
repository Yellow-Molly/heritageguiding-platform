import type { Metadata } from 'next'
import '@payloadcms/next/css'

export const metadata: Metadata = {
  title: 'HeritageGuiding Admin',
  description: 'Content management for HeritageGuiding',
}

export default function PayloadLayout({ children }: { children: React.ReactNode }) {
  return children
}
