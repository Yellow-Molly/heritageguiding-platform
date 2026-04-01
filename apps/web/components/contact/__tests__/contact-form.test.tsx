import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: vi.fn().mockReturnValue((key: string) => {
    const translations: Record<string, string> = {
      'form.title': 'Send us a message',
      'form.fullName': 'Full Name',
      'form.fullNamePlaceholder': 'Enter your full name',
      'form.email': 'Email Address',
      'form.emailPlaceholder': 'Enter your email address',
      'form.phone': 'Phone Number',
      'form.phoneOptional': '(Optional)',
      'form.phonePlaceholder': '+46',
      'form.subject': 'Subject',
      'form.subjectPlaceholder': 'Select a subject',
      'form.subjectOptions.general': 'General Inquiry',
      'form.subjectOptions.tourBooking': 'Tour Booking',
      'form.subjectOptions.groupInquiry': 'Group Inquiry',
      'form.subjectOptions.partnership': 'Partnership',
      'form.subjectOptions.other': 'Other',
      'form.message': 'Message',
      'form.messagePlaceholder': 'Tell us about your dream tour...',
      'form.submit': 'Send Message',
      'form.sending': 'Sending...',
      'form.successTitle': 'Message Sent!',
      'form.successMessage': "We'll get back to you within 24 hours.",
      'form.errorMessage': 'Something went wrong. Please try again.',
      'form.required': 'This field is required',
      'form.invalidEmail': 'Please enter a valid email address',
      'form.messageTooShort': 'Message must be at least 10 characters',
    }
    return translations[key] || key
  }),
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useSearchParams: vi.fn().mockReturnValue({
    get: vi.fn().mockReturnValue(null),
  }),
}))

import { ContactForm } from '../contact-form'

const mockFetch = vi.fn()
global.fetch = mockFetch

describe('ContactForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ success: true }) })
  })

  it('renders all form fields', () => {
    render(<ContactForm />)
    expect(screen.getByLabelText(/Full Name/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Email Address/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Phone Number/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Subject/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Message/)).toBeInTheDocument()
  })

  it('renders submit button', () => {
    render(<ContactForm />)
    expect(screen.getByRole('button', { name: /Send Message/ })).toBeInTheDocument()
  })

  it('shows validation errors on empty submit', async () => {
    render(<ContactForm />)
    fireEvent.click(screen.getByRole('button', { name: /Send Message/ }))

    await waitFor(() => {
      // Multiple "required" errors expected (name, subject)
      const requiredErrors = screen.getAllByText('This field is required')
      expect(requiredErrors.length).toBeGreaterThanOrEqual(1)
    })
  })

  it('shows email validation error for invalid email', async () => {
    render(<ContactForm />)

    fireEvent.change(screen.getByLabelText(/Full Name/), { target: { value: 'Jane Doe' } })
    fireEvent.change(screen.getByLabelText(/Email Address/), { target: { value: 'notanemail' } })
    fireEvent.change(screen.getByLabelText(/Subject/), { target: { value: 'general' } })
    fireEvent.change(screen.getByLabelText(/Message/), { target: { value: 'This is a test message for the form.' } })
    fireEvent.click(screen.getByRole('button', { name: /Send Message/ }))

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument()
    })
  })

  it('shows message too short error', async () => {
    render(<ContactForm />)

    fireEvent.change(screen.getByLabelText(/Full Name/), { target: { value: 'Jane Doe' } })
    fireEvent.change(screen.getByLabelText(/Email Address/), { target: { value: 'jane@example.com' } })
    fireEvent.change(screen.getByLabelText(/Subject/), { target: { value: 'general' } })
    fireEvent.change(screen.getByLabelText(/Message/), { target: { value: 'Short' } })
    fireEvent.click(screen.getByRole('button', { name: /Send Message/ }))

    await waitFor(() => {
      expect(screen.getByText('Message must be at least 10 characters')).toBeInTheDocument()
    })
  })

  it('has a hidden honeypot field', () => {
    render(<ContactForm />)
    const honeypot = document.querySelector('input[name="website"]')
    expect(honeypot).toBeInTheDocument()
    expect(honeypot).toHaveAttribute('aria-hidden', 'true')
    expect(honeypot).toHaveAttribute('tabindex', '-1')
  })

  it('shows success message after successful submission', async () => {
    render(<ContactForm />)

    fireEvent.change(screen.getByLabelText(/Full Name/), { target: { value: 'Jane Doe' } })
    fireEvent.change(screen.getByLabelText(/Email Address/), { target: { value: 'jane@example.com' } })
    fireEvent.change(screen.getByLabelText(/Subject/), { target: { value: 'general' } })
    fireEvent.change(screen.getByLabelText(/Message/), { target: { value: 'This is a test message for the contact form.' } })
    fireEvent.click(screen.getByRole('button', { name: /Send Message/ }))

    await waitFor(() => {
      expect(screen.getByText('Message Sent!')).toBeInTheDocument()
    })
  })

  it('shows error message on failed submission', async () => {
    mockFetch.mockResolvedValue({ ok: false })
    render(<ContactForm />)

    fireEvent.change(screen.getByLabelText(/Full Name/), { target: { value: 'Jane Doe' } })
    fireEvent.change(screen.getByLabelText(/Email Address/), { target: { value: 'jane@example.com' } })
    fireEvent.change(screen.getByLabelText(/Subject/), { target: { value: 'general' } })
    fireEvent.change(screen.getByLabelText(/Message/), { target: { value: 'This is a test message for the contact form.' } })
    fireEvent.click(screen.getByRole('button', { name: /Send Message/ }))

    await waitFor(() => {
      expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument()
    })
  })

  it('renders subject dropdown options', () => {
    render(<ContactForm />)
    const select = screen.getByLabelText(/Subject/)
    expect(select).toBeInTheDocument()
    expect(screen.getByText('General Inquiry')).toBeInTheDocument()
    expect(screen.getByText('Tour Booking')).toBeInTheDocument()
    expect(screen.getByText('Partnership')).toBeInTheDocument()
  })
})
