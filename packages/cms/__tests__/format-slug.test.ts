import { describe, it, expect } from 'vitest'
import { formatSlug, formatSlugHook } from '../hooks/format-slug'

describe('formatSlug', () => {
  it('converts to lowercase', () => {
    expect(formatSlug('Hello World')).toBe('hello-world')
  })

  it('replaces spaces with hyphens', () => {
    expect(formatSlug('hello world test')).toBe('hello-world-test')
  })

  it('removes special characters', () => {
    expect(formatSlug('hello@world#test!')).toBe('helloworldtest')
  })

  it('collapses multiple hyphens', () => {
    expect(formatSlug('hello---world')).toBe('hello-world')
  })

  it('trims leading hyphens', () => {
    expect(formatSlug('---hello')).toBe('hello')
  })

  it('trims trailing hyphens', () => {
    expect(formatSlug('hello---')).toBe('hello')
  })

  it('handles multiple spaces', () => {
    expect(formatSlug('hello   world')).toBe('hello-world')
  })

  it('trims whitespace', () => {
    expect(formatSlug('  hello world  ')).toBe('hello-world')
  })

  it('handles Swedish characters', () => {
    expect(formatSlug('Stockholms Gamla Stan')).toBe('stockholms-gamla-stan')
  })

  it('handles empty string', () => {
    expect(formatSlug('')).toBe('')
  })
})

describe('formatSlugHook', () => {
  it('formats existing slug value', () => {
    const result = formatSlugHook({
      value: 'Hello World',
      data: {},
      operation: 'update',
      originalDoc: undefined,
      req: {} as any,
      siblingData: {},
      field: {} as any,
      collection: undefined,
      context: {},
      previousValue: undefined,
      previousSiblingDoc: undefined,
    })
    expect(result).toBe('hello-world')
  })

  it('auto-generates from title on create', () => {
    const result = formatSlugHook({
      value: '',
      data: { title: 'New Tour Title' },
      operation: 'create',
      originalDoc: undefined,
      req: {} as any,
      siblingData: {},
      field: {} as any,
      collection: undefined,
      context: {},
      previousValue: undefined,
      previousSiblingDoc: undefined,
    })
    expect(result).toBe('new-tour-title')
  })

  it('preserves empty value on update without title', () => {
    const result = formatSlugHook({
      value: '',
      data: {},
      operation: 'update',
      originalDoc: undefined,
      req: {} as any,
      siblingData: {},
      field: {} as any,
      collection: undefined,
      context: {},
      previousValue: undefined,
      previousSiblingDoc: undefined,
    })
    expect(result).toBe('')
  })

  it('handles null value', () => {
    const result = formatSlugHook({
      value: null,
      data: { title: 'Test' },
      operation: 'create',
      originalDoc: undefined,
      req: {} as any,
      siblingData: {},
      field: {} as any,
      collection: undefined,
      context: {},
      previousValue: undefined,
      previousSiblingDoc: undefined,
    })
    expect(result).toBe('test')
  })

  it('handles undefined value', () => {
    const result = formatSlugHook({
      value: undefined,
      data: { title: 'Test Title' },
      operation: 'create',
      originalDoc: undefined,
      req: {} as any,
      siblingData: {},
      field: {} as any,
      collection: undefined,
      context: {},
      previousValue: undefined,
      previousSiblingDoc: undefined,
    })
    expect(result).toBe('test-title')
  })

  it('does not generate from title on update', () => {
    const result = formatSlugHook({
      value: '',
      data: { title: 'New Title' },
      operation: 'update',
      originalDoc: undefined,
      req: {} as any,
      siblingData: {},
      field: {} as any,
      collection: undefined,
      context: {},
      previousValue: undefined,
      previousSiblingDoc: undefined,
    })
    expect(result).toBe('')
  })
})
