import { describe, it, expect } from 'vitest'
import sv from '@/messages/sv.json'
import en from '@/messages/en.json'
import de from '@/messages/de.json'

function flatKeys(obj: unknown, prefix = ''): string[] {
  if (typeof obj !== 'object' || obj === null) return [prefix]
  if (Array.isArray(obj)) {
    return obj.flatMap((v, i) => flatKeys(v, prefix ? `${prefix}[${i}]` : `[${i}]`))
  }
  return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
    flatKeys(v, prefix ? `${prefix}.${k}` : k),
  )
}

describe('privacy i18n parity', () => {
  const svKeys = flatKeys(sv.privacy).sort()
  const enKeys = flatKeys(en.privacy).sort()
  const deKeys = flatKeys(de.privacy).sort()

  it('SV and EN have identical key paths', () => {
    expect(enKeys).toEqual(svKeys)
  })

  it('SV and DE have identical key paths', () => {
    expect(deKeys).toEqual(svKeys)
  })

  it.each(['Adyen', 'Heritage Guiding Sweden', 'Resend'])(
    'no occurrence of forbidden term in privacy.*: %s',
    (term) => {
      const json = JSON.stringify({ sv: sv.privacy, en: en.privacy, de: de.privacy })
      expect(json).not.toContain(term)
    },
  )

  it('Processing register has 9 rows in all locales', () => {
    expect(sv.privacy.purposes.rows).toHaveLength(9)
    expect(en.privacy.purposes.rows).toHaveLength(9)
    expect(de.privacy.purposes.rows).toHaveLength(9)
  })

  it('Sub-processor table has 7 rows in all locales', () => {
    expect(sv.privacy.subProcessors.rows).toHaveLength(7)
    expect(en.privacy.subProcessors.rows).toHaveLength(7)
    expect(de.privacy.subProcessors.rows).toHaveLength(7)
  })

  it('Rights enumeration has 8 items in all locales', () => {
    expect(sv.privacy.rights.items).toHaveLength(8)
    expect(en.privacy.rights.items).toHaveLength(8)
    expect(de.privacy.rights.items).toHaveLength(8)
  })

  it('TOC items map to all 14 sections', () => {
    const expected = [
      'controller',
      'scope',
      'dataCollected',
      'purposes',
      'subProcessors',
      'transfers',
      'retention',
      'rights',
      'complaint',
      'cookies',
      'children',
      'automated',
      'security',
      'changes',
    ]
    for (const locale of [sv, en, de]) {
      expect(Object.keys(locale.privacy.toc.items).sort()).toEqual(expected.sort())
    }
  })
})
