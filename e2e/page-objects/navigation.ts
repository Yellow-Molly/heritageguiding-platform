import { type Page, type Locator } from '@playwright/test'
import { BasePage } from '../fixtures/base-page'

export class NavigationPage extends BasePage {
  readonly header: Locator
  readonly footer: Locator
  readonly languageSwitcher: Locator
  readonly mobileMenuButton: Locator

  constructor(page: Page, locale = 'en') {
    super(page, locale)
    this.header = page.locator('header')
    this.footer = page.locator('footer')
    this.languageSwitcher = page.getByRole('button', { name: /language|svenska|english|deutsch/i })
    this.mobileMenuButton = page.getByRole('button', { name: /menu/i })
  }

  async switchLocale(targetLocale: string) {
    await this.languageSwitcher.click()
    await this.page.getByRole('link', { name: new RegExp(targetLocale, 'i') }).click()
  }
}
