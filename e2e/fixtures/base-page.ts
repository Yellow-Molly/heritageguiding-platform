import { type Page } from '@playwright/test'

export class BasePage {
  readonly page: Page
  protected locale: string

  constructor(page: Page, locale = 'en') {
    this.page = page
    this.locale = locale
  }

  /** Navigate to locale-prefixed path */
  async goto(path = '/') {
    const url = path.startsWith('/') ? `/${this.locale}${path}` : path
    await this.page.goto(url)
  }

  async waitForPageLoad() {
    await this.page.waitForLoadState('domcontentloaded')
  }

  /** Get current page title */
  async getTitle(): Promise<string> {
    return this.page.title()
  }

  /** Check page did not return error status */
  async expectNoErrorStatus() {
    const body = this.page.locator('body')
    await body.waitFor({ state: 'visible' })
  }
}
