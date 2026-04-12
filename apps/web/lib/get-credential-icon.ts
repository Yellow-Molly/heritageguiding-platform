/**
 * Maps credential strings to Lucide icons and colors using keyword matching.
 * Used by guide detail sidebar to display colored icons next to each credential.
 */

import type { LucideIcon } from 'lucide-react'
import { BadgeCheck, GraduationCap, Timer, HeartPulse, Users, Award } from 'lucide-react'

export interface CredentialIconResult {
  icon: LucideIcon
  colorVar: string
}

const CREDENTIAL_KEYWORDS: Array<{ keywords: string[]; icon: LucideIcon; colorVar: string }> = [
  { keywords: ['certified', 'license', 'authorized'], icon: BadgeCheck, colorVar: '--color-success' },
  { keywords: ['degree', 'university', 'education', 'master', 'bachelor'], icon: GraduationCap, colorVar: '--color-info' },
  { keywords: ['experience', 'years', 'veteran'], icon: Timer, colorVar: '--color-accent' },
  { keywords: ['first aid', 'medical', 'cpr', 'health'], icon: HeartPulse, colorVar: '--color-error' },
  { keywords: ['association', 'member', 'guild', 'society'], icon: Users, colorVar: '--color-primary' },
]

/** First-match-wins keyword search; returns fallback Award icon for unmatched credentials */
export function getCredentialIcon(credential: string): CredentialIconResult {
  const lower = credential.toLowerCase()
  const match = CREDENTIAL_KEYWORDS.find(({ keywords }) =>
    keywords.some((kw) => lower.includes(kw))
  )
  return match
    ? { icon: match.icon, colorVar: match.colorVar }
    : { icon: Award, colorVar: '--color-text-muted' }
}
