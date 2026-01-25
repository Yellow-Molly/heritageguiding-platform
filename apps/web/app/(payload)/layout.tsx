/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import config from '@payload-config'
import '@payloadcms/next/css'
import { RootLayout } from '@payloadcms/next/layouts'
import type { Metadata } from 'next'
import React from 'react'
import { importMap } from './admin/[[...segments]]/importMap'

export const metadata: Metadata = {
  title: 'HeritageGuiding Admin',
  description: 'Content management for HeritageGuiding',
}

async function serverFunction(args: { name: string; args: unknown[] }) {
  'use server'
  // Minimal server function - will be enhanced when needed
  return null
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
      {children}
    </RootLayout>
  )
}
