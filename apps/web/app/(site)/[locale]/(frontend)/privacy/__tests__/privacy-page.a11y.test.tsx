import { render } from '@testing-library/react'
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { axe } from 'jest-axe'
import en from '@/messages/en.json'
import {
  PrivacyHero,
  PrivacyControllerCard,
  PrivacyProcessingTable,
  PrivacySubProcessorTable,
  PrivacyRightsAccordion,
  PrivacyProse,
  PrivacyComplaintCallout,
  PrivacyContactCta,
  PrivacyTableOfContents,
  type ProcessingRow,
  type SubProcessorRow,
  type RightItem,
  type TocItem,
} from '@/components/privacy'

class IntersectionObserverMock {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
  takeRecords = vi.fn(() => [])
  root = null
  rootMargin = ''
  thresholds = []
}

beforeAll(() => {
  vi.stubGlobal('IntersectionObserver', IntersectionObserverMock)
})

/**
 * Renders the full privacy composition with English content from the live
 * messages file and runs an axe-core a11y scan. Avoids exercising the full
 * server `PrivacyPage` (which would require mocking next-intl + Header/Footer
 * dependencies) by composing the same components directly.
 */
describe('PrivacyPage a11y composition (EN)', () => {
  const p = en.privacy

  const TOC_KEYS = [
    'controller', 'scope', 'dataCollected', 'purposes', 'subProcessors',
    'transfers', 'retention', 'rights', 'complaint', 'cookies',
    'children', 'automated', 'security', 'changes',
  ] as const

  const tocItems: TocItem[] = TOC_KEYS.map((k, i) => ({
    id: k,
    numeral: String(i + 1).padStart(2, '0'),
    label: p.toc.items[k],
  }))

  it('has no axe violations for full privacy composition', async () => {
    const { container } = render(
      <main>
        <PrivacyHero
          breadcrumb={[
            { label: p.hero.breadcrumbHome, href: '/en' },
            { label: p.hero.breadcrumbCurrent },
          ]}
          title={p.hero.title}
          subtitle={p.hero.subtitle}
          updatedChip={{ label: p.hero.updatedLabel, date: '2026-05-09' }}
        />
        <PrivacyTableOfContents
          items={tocItems}
          title={p.toc.title}
          closeLabel={p.toc.closeLabel}
        />
        <PrivacyControllerCard
          id="controller"
          heading={p.controller.heading}
          controllerLabel={p.controller.controllerLabel}
          contactLabel={p.controller.contactLabel}
          emailLabel={p.controller.emailLabel}
          controller={{
            legalName: p.controller.legalName,
            orgNumber: p.controller.orgNumber,
            address: p.controller.address,
            email: 'info@privatetours.se',
          }}
        />
        <PrivacyProse
          sections={[
            {
              id: 'scope',
              heading: p.scope.heading,
              paragraphs: p.scope.paragraphs,
            },
            {
              id: 'dataCollected',
              heading: p.dataCollected.heading,
              intro: p.dataCollected.intro,
              bullets: p.dataCollected.bullets,
            },
          ]}
        />
        <PrivacyProcessingTable
          id="purposes"
          heading={p.purposes.heading}
          caption={p.purposes.caption}
          columnHeaders={p.purposes.columnHeaders}
          rows={p.purposes.rows as ProcessingRow[]}
        />
        <PrivacySubProcessorTable
          id="subProcessors"
          heading={p.subProcessors.heading}
          intro={p.subProcessors.intro}
          caption={p.subProcessors.caption}
          columnHeaders={p.subProcessors.columnHeaders}
          rows={p.subProcessors.rows as SubProcessorRow[]}
        />
        <PrivacyRightsAccordion
          id="rights"
          heading={p.rights.heading}
          items={p.rights.items as RightItem[]}
          slaCallout={p.rights.slaCallout}
          contactEmail="info@privatetours.se"
        />
        <PrivacyComplaintCallout
          id="complaint"
          heading={p.complaint.heading}
          body={p.complaint.body}
          primaryCta={{ label: p.complaint.primaryCtaLabel, mailto: 'mailto:info@privatetours.se' }}
          secondaryCta={{
            label: p.complaint.secondaryCtaLabel,
            href: 'https://www.imy.se',
            ariaLabel: p.complaint.secondaryCtaAriaLabel,
          }}
        />
        <PrivacyContactCta
          heading={p.contactCta.heading}
          email="info@privatetours.se"
          emailDisplay={p.contactCta.emailDisplay}
          responseSla={p.contactCta.responseSla}
        />
      </main>,
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  }, 30_000)
})
