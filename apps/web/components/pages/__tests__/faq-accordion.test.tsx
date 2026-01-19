import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FAQAccordion } from '../faq-accordion'

const mockFaqs = [
  { question: 'How do I book a tour?', answer: 'You can book directly through our website.' },
  { question: 'What payment methods do you accept?', answer: 'We accept credit cards and Swish.' },
  { question: 'Can I cancel my booking?', answer: 'Free cancellation up to 48 hours before.' },
]

describe('FAQAccordion', () => {
  describe('rendering', () => {
    it('renders all questions', () => {
      render(<FAQAccordion faqs={mockFaqs} />)

      mockFaqs.forEach((faq) => {
        expect(screen.getByText(faq.question)).toBeInTheDocument()
      })
    })

    it('renders with custom className', () => {
      const { container } = render(<FAQAccordion faqs={mockFaqs} className="custom-class" />)
      const accordion = container.firstChild as HTMLElement
      expect(accordion).toHaveClass('custom-class')
    })

    it('renders empty when no FAQs provided', () => {
      const { container } = render(<FAQAccordion faqs={[]} />)
      const accordionItems = container.querySelectorAll('[data-state]')
      expect(accordionItems).toHaveLength(0)
    })
  })

  describe('interaction', () => {
    it('shows answer when question is clicked', async () => {
      const user = userEvent.setup()
      render(<FAQAccordion faqs={mockFaqs} />)

      const firstQuestion = screen.getByText(mockFaqs[0].question)
      await user.click(firstQuestion)

      expect(screen.getByText(mockFaqs[0].answer)).toBeVisible()
    })

    it('hides answer when question is clicked again', async () => {
      const user = userEvent.setup()
      render(<FAQAccordion faqs={mockFaqs} />)

      const firstQuestion = screen.getByText(mockFaqs[0].question)
      const trigger = firstQuestion.closest('button')

      // Open
      await user.click(firstQuestion)
      expect(trigger).toHaveAttribute('aria-expanded', 'true')

      // Close
      await user.click(firstQuestion)
      expect(trigger).toHaveAttribute('aria-expanded', 'false')
    })

    it('only shows one answer at a time (single mode)', async () => {
      const user = userEvent.setup()
      render(<FAQAccordion faqs={mockFaqs} />)

      const firstQuestion = screen.getByText(mockFaqs[0].question)
      const secondQuestion = screen.getByText(mockFaqs[1].question)
      const firstTrigger = firstQuestion.closest('button')
      const secondTrigger = secondQuestion.closest('button')

      // Click first question
      await user.click(firstQuestion)
      expect(firstTrigger).toHaveAttribute('aria-expanded', 'true')

      // Click second question
      await user.click(secondQuestion)
      expect(secondTrigger).toHaveAttribute('aria-expanded', 'true')

      // First answer should be closed (single mode)
      expect(firstTrigger).toHaveAttribute('aria-expanded', 'false')
    })
  })

  describe('accessibility', () => {
    it('has correct ARIA attributes', () => {
      render(<FAQAccordion faqs={mockFaqs} />)

      const triggers = screen.getAllByRole('button')
      triggers.forEach((trigger) => {
        expect(trigger).toHaveAttribute('aria-expanded')
      })
    })

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup()
      render(<FAQAccordion faqs={mockFaqs} />)

      const firstQuestion = screen.getByText(mockFaqs[0].question)
      const trigger = firstQuestion.closest('button')
      trigger?.focus()

      // Press Enter to open
      await user.keyboard('{Enter}')
      expect(trigger).toHaveAttribute('aria-expanded', 'true')

      // Press Enter again to close
      await user.keyboard('{Enter}')
      expect(trigger).toHaveAttribute('aria-expanded', 'false')
    })
  })
})
