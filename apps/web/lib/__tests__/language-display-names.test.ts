/**
 * Unit tests for languageDisplayNames mapping
 */

import { describe, it, expect } from 'vitest'
import { Guides } from '@cms/collections/guides'
import { languageDisplayNames } from '../language-display-names'

/**
 * Read the real select-option values for a field from the Guides CMS collection,
 * so coverage is checked against the actual enum rather than a hardcoded copy.
 * This is what makes the coverage test below a genuine drift guard: adding a
 * language option in the CMS without a matching display name fails the test
 * instead of silently rendering a raw code (e.g. "el") in the UI.
 */
function cmsLanguageCodes(fieldName: string): string[] {
  const field = Guides.fields.find((f) => 'name' in f && f.name === fieldName)
  if (!field || field.type !== 'select') {
    throw new Error(`Guides collection has no select field named "${fieldName}"`)
  }
  return field.options.map((opt) => (typeof opt === 'string' ? opt : opt.value))
}

describe('languageDisplayNames', () => {
  it('maps sv to Swedish', () => {
    expect(languageDisplayNames['sv']).toBe('Swedish')
  })

  it('maps en to English', () => {
    expect(languageDisplayNames['en']).toBe('English')
  })

  it('maps de to German', () => {
    expect(languageDisplayNames['de']).toBe('German')
  })

  it('maps fr to French', () => {
    expect(languageDisplayNames['fr']).toBe('French')
  })

  it('maps es to Spanish', () => {
    expect(languageDisplayNames['es']).toBe('Spanish')
  })

  it('maps it to Italian', () => {
    expect(languageDisplayNames['it']).toBe('Italian')
  })

  it('maps ja to Japanese', () => {
    expect(languageDisplayNames['ja']).toBe('Japanese')
  })

  it('maps zh to Chinese', () => {
    expect(languageDisplayNames['zh']).toBe('Chinese')
  })

  it('maps no to Norwegian', () => {
    expect(languageDisplayNames['no']).toBe('Norwegian')
  })

  it('maps da to Danish', () => {
    expect(languageDisplayNames['da']).toBe('Danish')
  })

  it('maps fi to Finnish', () => {
    expect(languageDisplayNames['fi']).toBe('Finnish')
  })

  it('maps nl to Dutch', () => {
    expect(languageDisplayNames['nl']).toBe('Dutch')
  })

  it('maps pt to Portuguese', () => {
    expect(languageDisplayNames['pt']).toBe('Portuguese')
  })

  it('maps ru to Russian', () => {
    expect(languageDisplayNames['ru']).toBe('Russian')
  })

  it('maps ar to Arabic', () => {
    expect(languageDisplayNames['ar']).toBe('Arabic')
  })

  it('maps ko to Korean', () => {
    expect(languageDisplayNames['ko']).toBe('Korean')
  })

  it('maps pl to Polish', () => {
    expect(languageDisplayNames['pl']).toBe('Polish')
  })

  it('maps th to Thai', () => {
    expect(languageDisplayNames['th']).toBe('Thai')
  })

  it('maps hi to Hindi', () => {
    expect(languageDisplayNames['hi']).toBe('Hindi')
  })

  it('contains all expected language codes', () => {
    const expectedCodes = [
      'sv', 'en', 'de', 'fr', 'es', 'it', 'ja', 'zh',
      'no', 'da', 'fi', 'nl', 'pt', 'ru', 'ar', 'ko',
      'pl', 'th', 'hi',
    ]

    for (const code of expectedCodes) {
      expect(languageDisplayNames).toHaveProperty(code)
      expect(languageDisplayNames[code]).toBeTruthy()
      expect(typeof languageDisplayNames[code]).toBe('string')
    }
  })

  it('has 19 language mappings', () => {
    expect(Object.keys(languageDisplayNames)).toHaveLength(19)
  })

  it('covers every language code defined in the Guides CMS collection', () => {
    const codes = [
      ...cmsLanguageCodes('languages'),
      ...cmsLanguageCodes('additionalLanguages'),
    ]

    const missing = codes.filter((code) => !languageDisplayNames[code])

    expect(missing).toEqual([])
  })
})
