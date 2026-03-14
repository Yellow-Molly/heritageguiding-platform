import { test as base, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

/** Custom test fixture with locale and accessibility helpers */
export const test = base.extend<{
  locale: string
  makeAxeBuilder: () => AxeBuilder
}>({
  locale: async ({}, use) => {
    await use('en')
  },

  makeAxeBuilder: async ({ page }, use) => {
    const builder = () =>
      new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .exclude('iframe[src*="bokun"]') // Exclude third-party widget
    await use(builder)
  },
})

export { expect }
