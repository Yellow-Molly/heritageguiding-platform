import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Input variant */
  variant?: 'default' | 'filled' | 'underline'
  /** Error state */
  error?: boolean
  /** Left icon/adornment */
  leftIcon?: React.ReactNode
  /** Right icon/adornment */
  rightIcon?: React.ReactNode
}

const variantClasses = {
  default: 'border border-[var(--color-border)] bg-[var(--color-surface)]',
  filled: 'border-transparent bg-[var(--color-background-alt)]',
  underline: 'border-b border-[var(--color-border)] bg-transparent rounded-none',
}

/**
 * Input component with multiple variants and adornment support.
 *
 * @example
 * ```tsx
 * // Always pair with a label for accessibility
 * <label htmlFor="email">Email</label>
 * <Input id="email" type="email" placeholder="you@example.com" />
 *
 * // With icons
 * <Input leftIcon={<SearchIcon />} placeholder="Search..." />
 * ```
 */
const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant = 'default', error, leftIcon, rightIcon, type, ...props }, ref) => {
    return (
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
            {leftIcon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            'flex h-11 w-full rounded-lg px-4 py-2',
            'text-base text-[var(--color-text)]',
            'placeholder:text-[var(--color-text-light)]',
            'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'transition-colors duration-200',
            variantClasses[variant],
            error && 'border-[var(--color-error)] focus:ring-[var(--color-error)]',
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',
            className
          )}
          ref={ref}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
            {rightIcon}
          </div>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Error state */
  error?: boolean
}

/**
 * Textarea component with consistent styling.
 */
const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[120px] w-full rounded-lg px-4 py-3',
          'border border-[var(--color-border)] bg-[var(--color-surface)]',
          'text-base text-[var(--color-text)]',
          'placeholder:text-[var(--color-text-light)]',
          'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'transition-colors duration-200 resize-y',
          error && 'border-[var(--color-error)] focus:ring-[var(--color-error)]',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = 'Textarea'

export { Input, Textarea }
