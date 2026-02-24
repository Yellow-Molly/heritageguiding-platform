'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

export interface FAQItem {
  question: string
  answer: string
}

interface FAQAccordionProps {
  faqs: FAQItem[]
  className?: string
}

/**
 * FAQ Accordion component with accessible keyboard navigation.
 * Uses Radix UI primitives for WCAG 2.1 AA compliance.
 */
export function FAQAccordion({ faqs, className }: FAQAccordionProps) {
  return (
    <Accordion type="single" collapsible className={className}>
      {faqs.map((faq, index) => (
        <AccordionItem
          key={index}
          value={`item-${index}`}
          className="border-b border-[var(--color-border-light)] last:border-b-0"
        >
          <AccordionTrigger className="px-5 py-5 text-left text-base font-medium text-[var(--color-text)] md:px-6">
            {faq.question}
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-6 leading-relaxed text-[var(--color-text-muted)] md:px-6">
            {faq.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
