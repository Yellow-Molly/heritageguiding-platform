import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { PrivacyTableOfContents } from '../privacy-table-of-contents'

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

const items = [
  { id: 'controller', numeral: '01', label: 'Data Controller' },
  { id: 'rights', numeral: '08', label: 'Your Rights' },
]

describe('PrivacyTableOfContents', () => {
  it('renders desktop sidebar nav', () => {
    render(<PrivacyTableOfContents items={items} title="Jump to section" closeLabel="Close menu" />)
    expect(screen.getByRole('navigation', { name: /Jump to section/i })).toBeInTheDocument()
    expect(screen.getAllByText(/Data Controller/i).length).toBeGreaterThan(0)
  })

  it('opens mobile drawer when trigger button clicked', () => {
    render(<PrivacyTableOfContents items={items} title="Jump to section" closeLabel="Close menu" />)
    const trigger = screen.getAllByRole('button', { name: /Jump to section/i })[0]
    fireEvent.click(trigger)
    expect(screen.getByRole('dialog', { name: /Jump to section/i })).toBeInTheDocument()
  })

  it('closes drawer on Escape key', () => {
    render(<PrivacyTableOfContents items={items} title="Jump to section" closeLabel="Close menu" />)
    fireEvent.click(screen.getAllByRole('button', { name: /Jump to section/i })[0])
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('closes drawer on close button click', () => {
    render(<PrivacyTableOfContents items={items} title="Jump to section" closeLabel="Close menu" />)
    fireEvent.click(screen.getAllByRole('button', { name: /Jump to section/i })[0])
    fireEvent.click(screen.getByRole('button', { name: /Close menu/i }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders anchor href for each item', () => {
    render(<PrivacyTableOfContents items={items} title="Jump" closeLabel="Close" />)
    const links = screen.getAllByRole('link')
    expect(links.some((l) => l.getAttribute('href') === '#controller')).toBe(true)
    expect(links.some((l) => l.getAttribute('href') === '#rights')).toBe(true)
  })
})
