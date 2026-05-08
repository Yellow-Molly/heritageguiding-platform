/** Shared types for privacy policy components. */

export interface BreadcrumbItem {
  label: string
  href?: string
}

export interface UpdatedChip {
  label: string
  date: string
}

export interface PrivacyHeroProps {
  breadcrumb: BreadcrumbItem[]
  title: string
  subtitle: string
  updatedChip: UpdatedChip
}

export interface TocItem {
  id: string
  numeral: string
  label: string
}

export interface PrivacyTableOfContentsProps {
  items: TocItem[]
  title: string
  closeLabel: string
}

export interface ControllerInfo {
  legalName: string
  orgNumber: string
  address: string[]
  email: string
}

export interface PrivacyControllerCardProps {
  id?: string
  heading: string
  controllerLabel: string
  contactLabel: string
  emailLabel: string
  controller: ControllerInfo
}

export interface ProcessingRow {
  activity: string
  dataCategories: string
  legalBasis: string
  retention: string
}

export interface PrivacyProcessingTableProps {
  id?: string
  heading: string
  caption: string
  columnHeaders: {
    activity: string
    data: string
    basis: string
    retention: string
  }
  rows: ProcessingRow[]
}

export interface SubProcessorRow {
  provider: string
  monogram: string
  role: string
  location: string
  transfer: string
}

export interface PrivacySubProcessorTableProps {
  id?: string
  heading: string
  intro: string
  caption: string
  columnHeaders: {
    provider: string
    role: string
    location: string
    transfer: string
  }
  rows: SubProcessorRow[]
}

export interface RightItem {
  id: string
  numeral: string
  name: string
  description: string
  exerciseInstruction: string
  ctaLabel: string
  mailtoSubject: string
}

export interface PrivacyRightsAccordionProps {
  id?: string
  heading: string
  items: RightItem[]
  slaCallout: string
  contactEmail: string
}

export interface ProseSection {
  id: string
  heading: string
  intro?: string
  bullets?: string[]
  paragraphs?: string[]
}

export interface PrivacyProseProps {
  sections: ProseSection[]
}

export interface PrivacyComplaintCalloutProps {
  id?: string
  heading: string
  body: string
  primaryCta: { label: string; mailto: string }
  secondaryCta: { label: string; href: string; ariaLabel: string }
}

export interface PrivacyContactCtaProps {
  heading: string
  email: string
  emailDisplay: string
  responseSla: string
}
