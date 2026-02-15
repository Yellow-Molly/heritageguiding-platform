import React from 'react'

/**
 * Visually hidden content that remains accessible to screen readers.
 * Uses the standard sr-only clip pattern for WCAG compliance.
 */
interface VisuallyHiddenProps {
  children: React.ReactNode
  as?: 'span' | 'div' | 'h2' | 'h3' | 'p' | 'label'
}

export function VisuallyHidden({ children, as: Tag = 'span' }: VisuallyHiddenProps) {
  return (
    <Tag
      style={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: 0,
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        borderWidth: 0,
      }}
    >
      {children}
    </Tag>
  )
}
