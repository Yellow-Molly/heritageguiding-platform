import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

export interface ContainerProps {
  /** Container content */
  children: ReactNode
  /** Max width variant */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  /** Add vertical padding */
  paddingY?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  /** Center content vertically */
  centerVertical?: boolean
  /** HTML element to render */
  as?: 'div' | 'section' | 'article' | 'main'
  /** Additional CSS classes */
  className?: string
}

const sizeClasses = {
  sm: 'max-w-3xl',
  md: 'max-w-5xl',
  lg: 'max-w-6xl',
  xl: 'max-w-7xl',
  full: 'max-w-full',
}

const paddingYClasses = {
  none: '',
  sm: 'py-6 lg:py-8',
  md: 'py-12 lg:py-16',
  lg: 'py-16 lg:py-24',
  xl: 'py-24 lg:py-32',
}

/**
 * Responsive container component with configurable max-width and padding.
 * Uses consistent horizontal padding across all breakpoints.
 */
export function Container({
  children,
  size = 'xl',
  paddingY = 'none',
  centerVertical = false,
  as: Component = 'div',
  className,
}: ContainerProps) {
  return (
    <Component
      className={cn(
        'mx-auto w-full px-4 sm:px-6 lg:px-8',
        sizeClasses[size],
        paddingYClasses[paddingY],
        centerVertical && 'flex min-h-full flex-col items-center justify-center',
        className
      )}
    >
      {children}
    </Component>
  )
}

export interface SectionProps {
  /** Section content */
  children: ReactNode
  /** Background variant */
  background?: 'default' | 'alt' | 'primary' | 'accent'
  /** Vertical padding size */
  paddingY?: 'sm' | 'md' | 'lg' | 'xl'
  /** Container size */
  containerSize?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  /** Section ID for navigation */
  id?: string
  /** Additional CSS classes */
  className?: string
}

const backgroundClasses = {
  default: 'bg-[var(--color-background)]',
  alt: 'bg-[var(--color-background-alt)]',
  primary: 'bg-[var(--color-primary)] text-white',
  accent: 'bg-[var(--color-accent)] text-white',
}

/**
 * Full-width section with background and contained content.
 */
export function Section({
  children,
  background = 'default',
  paddingY = 'lg',
  containerSize = 'xl',
  id,
  className,
}: SectionProps) {
  return (
    <section id={id} className={cn(backgroundClasses[background], className)}>
      <Container size={containerSize} paddingY={paddingY}>
        {children}
      </Container>
    </section>
  )
}
