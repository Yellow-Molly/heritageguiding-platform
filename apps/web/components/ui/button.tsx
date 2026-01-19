'use client'

import { forwardRef, type ButtonHTMLAttributes, type ReactElement } from 'react'
import { cn } from '@/lib/utils'

const baseStyles = `
  inline-flex items-center justify-center gap-2
  font-medium transition-all duration-300 ease-out
  rounded-lg focus-visible:outline-none focus-visible:ring-2
  focus-visible:ring-offset-2 disabled:pointer-events-none
  disabled:opacity-50
`

const variantStyles = {
  primary: `
    bg-[var(--color-accent)] text-white
    hover:bg-[var(--color-accent-dark)]
    focus-visible:ring-[var(--color-accent)]
    shadow-md hover:shadow-lg
  `,
  secondary: `
    bg-[var(--color-secondary)] text-[var(--color-primary-dark)]
    hover:bg-[var(--color-secondary-dark)]
    focus-visible:ring-[var(--color-secondary)]
    shadow-md hover:shadow-lg
  `,
  outline: `
    border-2 border-white text-white
    hover:bg-white hover:text-[var(--color-primary)]
    focus-visible:ring-white
    bg-transparent
    [text-shadow:0_1px_2px_rgba(0,0,0,0.3)]
    hover:[text-shadow:none]
  `,
  'outline-dark': `
    border-2 border-[var(--color-primary)] text-[var(--color-primary)]
    hover:bg-[var(--color-primary)] hover:text-white
    focus-visible:ring-[var(--color-primary)]
    bg-transparent
  `,
  ghost: `
    text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10
    focus-visible:ring-[var(--color-primary)]
  `,
  link: `
    text-[var(--color-accent)] underline-offset-4
    hover:underline focus-visible:ring-[var(--color-accent)]
  `,
}

const sizeStyles = {
  sm: 'h-9 px-4 text-sm',
  md: 'h-11 px-6 text-base',
  lg: 'h-13 px-8 text-lg',
  xl: 'h-14 px-10 text-lg',
  icon: 'h-10 w-10 p-0',
}

export type ButtonVariant = keyof typeof variantStyles
export type ButtonSize = keyof typeof sizeStyles

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  asChild?: boolean
}

/**
 * Get button class names for use with Link or other components
 */
export function getButtonClassName(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  className?: string
): string {
  return cn(baseStyles, variantStyles[variant], sizeStyles[size], className)
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      asChild = false,
      ...props
    },
    ref
  ) => {
    const classes = getButtonClassName(variant, size, className)

    // When asChild is true, render children with button styles
    // This allows wrapping Link components while applying button styles
    if (asChild && children) {
      const child = children as ReactElement<{ className?: string }>
      if (child && typeof child === 'object' && 'props' in child) {
        const childProps = child.props as { className?: string }
        return (
          <span className={cn(classes, childProps.className)}>
            {children}
          </span>
        )
      }
    }

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <svg
            className="h-5 w-5 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button }
