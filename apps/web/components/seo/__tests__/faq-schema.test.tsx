import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { FAQSchema } from '../faq-schema'

const mockFaqs = [
  { question: 'How do I book a tour?', answer: 'You can book directly through our website.' },
  { question: 'What payment methods do you accept?', answer: 'We accept credit cards and Swish.' },
]

describe('FAQSchema', () => {
  describe('basic rendering', () => {
    it('renders a script tag', () => {
      const { container } = render(<FAQSchema faqs={mockFaqs} />)
      const script = container.querySelector('script[type="application/ld+json"]')
      expect(script).toBeInTheDocument()
    })

    it('contains valid JSON', () => {
      const { container } = render(<FAQSchema faqs={mockFaqs} />)
      const script = container.querySelector('script[type="application/ld+json"]')
      expect(script).not.toBeNull()

      const json = JSON.parse(script!.innerHTML)
      expect(json).toBeDefined()
    })
  })

  describe('schema structure', () => {
    it('has correct @context', () => {
      const { container } = render(<FAQSchema faqs={mockFaqs} />)
      const script = container.querySelector('script[type="application/ld+json"]')
      const json = JSON.parse(script!.innerHTML)
      expect(json['@context']).toBe('https://schema.org')
    })

    it('has correct @type FAQPage', () => {
      const { container } = render(<FAQSchema faqs={mockFaqs} />)
      const script = container.querySelector('script[type="application/ld+json"]')
      const json = JSON.parse(script!.innerHTML)
      expect(json['@type']).toBe('FAQPage')
    })

    it('has mainEntity array', () => {
      const { container } = render(<FAQSchema faqs={mockFaqs} />)
      const script = container.querySelector('script[type="application/ld+json"]')
      const json = JSON.parse(script!.innerHTML)
      expect(Array.isArray(json.mainEntity)).toBe(true)
    })
  })

  describe('FAQ items', () => {
    it('includes all provided FAQs', () => {
      const { container } = render(<FAQSchema faqs={mockFaqs} />)
      const script = container.querySelector('script[type="application/ld+json"]')
      const json = JSON.parse(script!.innerHTML)
      expect(json.mainEntity).toHaveLength(mockFaqs.length)
    })

    it('each FAQ has correct Question type', () => {
      const { container } = render(<FAQSchema faqs={mockFaqs} />)
      const script = container.querySelector('script[type="application/ld+json"]')
      const json = JSON.parse(script!.innerHTML)

      json.mainEntity.forEach((entity: Record<string, unknown>) => {
        expect(entity['@type']).toBe('Question')
      })
    })

    it('each FAQ has question name', () => {
      const { container } = render(<FAQSchema faqs={mockFaqs} />)
      const script = container.querySelector('script[type="application/ld+json"]')
      const json = JSON.parse(script!.innerHTML)

      expect(json.mainEntity[0].name).toBe(mockFaqs[0].question)
      expect(json.mainEntity[1].name).toBe(mockFaqs[1].question)
    })

    it('each FAQ has acceptedAnswer with Answer type', () => {
      const { container } = render(<FAQSchema faqs={mockFaqs} />)
      const script = container.querySelector('script[type="application/ld+json"]')
      const json = JSON.parse(script!.innerHTML)

      json.mainEntity.forEach((entity: Record<string, { '@type': string }>) => {
        expect(entity.acceptedAnswer['@type']).toBe('Answer')
      })
    })

    it('each FAQ has answer text', () => {
      const { container } = render(<FAQSchema faqs={mockFaqs} />)
      const script = container.querySelector('script[type="application/ld+json"]')
      const json = JSON.parse(script!.innerHTML)

      expect(json.mainEntity[0].acceptedAnswer.text).toBe(mockFaqs[0].answer)
      expect(json.mainEntity[1].acceptedAnswer.text).toBe(mockFaqs[1].answer)
    })
  })

  describe('edge cases', () => {
    it('handles empty FAQ array', () => {
      const { container } = render(<FAQSchema faqs={[]} />)
      const script = container.querySelector('script[type="application/ld+json"]')
      const json = JSON.parse(script!.innerHTML)

      expect(json['@type']).toBe('FAQPage')
      expect(json.mainEntity).toHaveLength(0)
    })

    it('handles single FAQ', () => {
      const singleFaq = [{ question: 'Test?', answer: 'Answer' }]
      const { container } = render(<FAQSchema faqs={singleFaq} />)
      const script = container.querySelector('script[type="application/ld+json"]')
      const json = JSON.parse(script!.innerHTML)

      expect(json.mainEntity).toHaveLength(1)
    })

    it('handles special characters in questions and answers', () => {
      const specialFaqs = [
        {
          question: 'What is the price in €?',
          answer: 'Prices start at €50 & include "all fees"',
        },
      ]
      const { container } = render(<FAQSchema faqs={specialFaqs} />)
      const script = container.querySelector('script[type="application/ld+json"]')
      const json = JSON.parse(script!.innerHTML)

      expect(json.mainEntity[0].name).toBe(specialFaqs[0].question)
      expect(json.mainEntity[0].acceptedAnswer.text).toBe(specialFaqs[0].answer)
    })
  })
})
