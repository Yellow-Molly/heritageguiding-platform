import { type Page } from '@playwright/test'

/**
 * Discover real tour slugs from staging /en/tours page.
 * Avoids hardcoding slugs that may change in CMS.
 */
export async function discoverTourSlugs(page: Page, locale = 'en'): Promise<string[]> {
  await page.goto(`/${locale}/tours`)
  await page.waitForLoadState('domcontentloaded')

  const links = await page.locator('a[href*="/tours/"]').all()
  const slugs: string[] = []

  for (const link of links) {
    const href = await link.getAttribute('href')
    if (href) {
      const match = href.match(/\/tours\/([^/?#]+)/)
      if (match && !slugs.includes(match[1])) {
        slugs.push(match[1])
      }
    }
  }
  return slugs
}

/** Get the first available tour slug from staging */
export async function getFirstTourSlug(page: Page, locale = 'en'): Promise<string> {
  const slugs = await discoverTourSlugs(page, locale)
  if (slugs.length === 0) throw new Error('No tours found on staging')
  return slugs[0]
}

/** Discover real guide slugs from staging /en/guides page */
export async function discoverGuideSlugs(page: Page, locale = 'en'): Promise<string[]> {
  await page.goto(`/${locale}/guides`)
  await page.waitForLoadState('domcontentloaded')

  const links = await page.locator('a[href*="/guides/"]').all()
  const slugs: string[] = []

  for (const link of links) {
    const href = await link.getAttribute('href')
    if (href) {
      const match = href.match(/\/guides\/([^/?#]+)/)
      if (match && !slugs.includes(match[1])) {
        slugs.push(match[1])
      }
    }
  }
  return slugs
}

/** Get the first available guide slug from staging */
export async function getFirstGuideSlug(page: Page, locale = 'en'): Promise<string> {
  const slugs = await discoverGuideSlugs(page, locale)
  if (slugs.length === 0) throw new Error('No guides found on staging')
  return slugs[0]
}
