import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: vi.fn().mockReturnValue((key: string) => {
    const translations: Record<string, string> = {
      'form.firstName': 'First Name',
      'form.lastName': 'Last Name',
      'form.email': 'Email',
      'form.phone': 'Phone',
      'form.groupSize': 'Group Size',
      'form.preferredDates': 'Preferred Dates',
      'form.datesPlaceholder': 'e.g., June 15-20, 2026',
      'form.tourInterest': 'Tours of Interest',
      'form.tourPlaceholder': 'e.g., Historical Stockholm',
      'form.specialRequirements': 'Special Requirements',
      'form.requirementsPlaceholder': 'Accessibility needs, dietary restrictions, etc.',
      'form.submit': 'Submit Inquiry',
      'form.submitting': 'Sending...',
      'form.required': 'This field is required',
      'form.invalidEmail': 'Please enter a valid email',
      'form.minGroupSize': 'Minimum group size is 9',
      'form.successTitle': 'Inquiry Sent!',
      'form.successMessage': "We'll contact you within 24 hours with a custom quote.",
      'form.errorMessage': 'Something went wrong. Please try again.',
    }
    return translations[key] || key
  }),
}))

import { GroupInquiryForm } from '../group-inquiry-form'

// Mock fetch for form submission
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('GroupInquiryForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ success: true }) })
  })

  it('renders all required form fields', () => {
    render(<GroupInquiryForm />)
    expect(screen.getByLabelText(/First Name/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Last Name/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Email/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Phone/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Group Size/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Preferred Dates/)).toBeInTheDocument()
  })

  it('renders optional fields', () => {
    render(<GroupInquiryForm />)
    expect(screen.getByLabelText(/Tours of Interest/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Special Requirements/)).toBeInTheDocument()
  })

  it('renders submit button', () => {
    render(<GroupInquiryForm />)
    expect(screen.getByRole('button', { name: 'Submit Inquiry' })).toBeInTheDocument()
  })

  it('shows validation errors on empty submission', async () => {
    render(<GroupInquiryForm />)
    fireEvent.click(screen.getByRole('button', { name: 'Submit Inquiry' }))

    await waitFor(() => {
      expect(screen.getAllByText('This field is required').length).toBeGreaterThanOrEqual(1)
    })
  })

  it('shows invalid email error', async () => {
    const user = userEvent.setup()
    render(<GroupInquiryForm />)

    await user.type(screen.getByLabelText(/First Name/), 'John')
    await user.type(screen.getByLabelText(/Last Name/), 'Doe')
    await user.type(screen.getByLabelText(/Email/), 'not-valid')
    await user.type(screen.getByLabelText(/Phone/), '46701234567')
    await user.type(screen.getByLabelText(/Group Size/), '25')
    await user.type(screen.getByLabelText(/Preferred Dates/), 'June 15-20, 2026')

    fireEvent.click(screen.getByRole('button', { name: 'Submit Inquiry' }))

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email')).toBeInTheDocument()
    })
  })

  it('shows success message after successful submission', async () => {
    const user = userEvent.setup()
    render(<GroupInquiryForm />)

    await user.type(screen.getByLabelText(/First Name/), 'John')
    await user.type(screen.getByLabelText(/Last Name/), 'Doe')
    await user.type(screen.getByLabelText(/Email/), 'john@example.com')
    await user.type(screen.getByLabelText(/Phone/), '46701234567')
    await user.type(screen.getByLabelText(/Group Size/), '25')
    await user.type(screen.getByLabelText(/Preferred Dates/), 'June 15-20, 2026')

    fireEvent.click(screen.getByRole('button', { name: 'Submit Inquiry' }))

    await waitFor(() => {
      expect(screen.getByText('Inquiry Sent!')).toBeInTheDocument()
    })
  })

  it('sends correct data to API', async () => {
    const user = userEvent.setup()
    render(<GroupInquiryForm />)

    await user.type(screen.getByLabelText(/First Name/), 'John')
    await user.type(screen.getByLabelText(/Last Name/), 'Doe')
    await user.type(screen.getByLabelText(/Email/), 'john@example.com')
    await user.type(screen.getByLabelText(/Phone/), '46701234567')
    await user.type(screen.getByLabelText(/Group Size/), '25')
    await user.type(screen.getByLabelText(/Preferred Dates/), 'June 15-20, 2026')

    fireEvent.click(screen.getByRole('button', { name: 'Submit Inquiry' }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/group-inquiry', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }))
    })

    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(callBody.firstName).toBe('John')
    expect(callBody.lastName).toBe('Doe')
    expect(callBody.email).toBe('john@example.com')
    expect(callBody.groupSize).toBe(25)
    expect(callBody.honeypot).toBe('')
  })

  it('shows error message on submission failure', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false })
    const user = userEvent.setup()
    render(<GroupInquiryForm />)

    await user.type(screen.getByLabelText(/First Name/), 'John')
    await user.type(screen.getByLabelText(/Last Name/), 'Doe')
    await user.type(screen.getByLabelText(/Email/), 'john@example.com')
    await user.type(screen.getByLabelText(/Phone/), '46701234567')
    await user.type(screen.getByLabelText(/Group Size/), '25')
    await user.type(screen.getByLabelText(/Preferred Dates/), 'June 15-20, 2026')

    fireEvent.click(screen.getByRole('button', { name: 'Submit Inquiry' }))

    await waitFor(() => {
      expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument()
    })
  })

  it('pre-fills tourInterest when tourName prop is provided', () => {
    render(<GroupInquiryForm tourName="Royal Palace Tour" />)
    const tourInput = screen.getByLabelText(/Tours of Interest/) as HTMLInputElement
    expect(tourInput.value).toBe('Royal Palace Tour')
  })

  it('includes hidden honeypot field', () => {
    render(<GroupInquiryForm />)
    const honeypot = document.querySelector('input[name="website"]') as HTMLInputElement
    expect(honeypot).toBeTruthy()
    expect(honeypot.tabIndex).toBe(-1)
    expect(honeypot.getAttribute('aria-hidden')).toBe('true')
  })

  it('disables submit button while loading', async () => {
    // Make fetch hang
    mockFetch.mockReturnValueOnce(new Promise(() => {}))
    const user = userEvent.setup()
    render(<GroupInquiryForm />)

    await user.type(screen.getByLabelText(/First Name/), 'John')
    await user.type(screen.getByLabelText(/Last Name/), 'Doe')
    await user.type(screen.getByLabelText(/Email/), 'john@example.com')
    await user.type(screen.getByLabelText(/Phone/), '46701234567')
    await user.type(screen.getByLabelText(/Group Size/), '25')
    await user.type(screen.getByLabelText(/Preferred Dates/), 'June 15-20, 2026')

    fireEvent.click(screen.getByRole('button', { name: 'Submit Inquiry' }))

    await waitFor(() => {
      expect(screen.getByRole('button')).toBeDisabled()
      expect(screen.getByText('Sending...')).toBeInTheDocument()
    })
  })
})
