import React from 'react'
import { Accessibility, Ear, Eye, Brain, Baby, Dog } from 'lucide-react'
import { cn } from '@/lib/utils'

export type AccessibilityType =
  | 'wheelchair'
  | 'hearing'
  | 'visual'
  | 'cognitive'
  | 'family'
  | 'service-animal'

export interface AccessibilityBadgeProps {
  /** Type of accessibility feature */
  type: AccessibilityType
  /** Badge variant */
  variant?: 'default' | 'outline' | 'filled'
  /** Size of the badge */
  size?: 'sm' | 'md'
  /** Show label text */
  showLabel?: boolean
  /** Additional CSS classes */
  className?: string
}

const accessibilityConfig: Record<
  AccessibilityType,
  { icon: typeof Accessibility; label: string; color: string }
> = {
  wheelchair: {
    icon: Accessibility,
    label: 'Wheelchair accessible',
    color: 'text-blue-600 bg-blue-50 border-blue-200',
  },
  hearing: {
    icon: Ear,
    label: 'Hearing accessible',
    color: 'text-purple-600 bg-purple-50 border-purple-200',
  },
  visual: {
    icon: Eye,
    label: 'Visual accessible',
    color: 'text-green-600 bg-green-50 border-green-200',
  },
  cognitive: {
    icon: Brain,
    label: 'Cognitive friendly',
    color: 'text-amber-600 bg-amber-50 border-amber-200',
  },
  family: {
    icon: Baby,
    label: 'Family friendly',
    color: 'text-pink-600 bg-pink-50 border-pink-200',
  },
  'service-animal': {
    icon: Dog,
    label: 'Service animals welcome',
    color: 'text-teal-600 bg-teal-50 border-teal-200',
  },
}

const sizeClasses = {
  sm: {
    badge: 'px-2 py-0.5 text-xs',
    icon: 'h-3 w-3',
  },
  md: {
    badge: 'px-2.5 py-1 text-sm',
    icon: 'h-4 w-4',
  },
}

const variantClasses = {
  default: 'border',
  outline: 'border bg-transparent',
  filled: 'border-transparent',
}

/**
 * Accessibility badge component indicating tour accessibility features.
 * WCAG-compliant with proper aria labels and color contrast.
 */
export function AccessibilityBadge({
  type,
  variant = 'default',
  size = 'sm',
  showLabel = false,
  className,
}: AccessibilityBadgeProps) {
  const config = accessibilityConfig[type]
  const Icon = config.icon

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium',
        sizeClasses[size].badge,
        variantClasses[variant],
        config.color,
        className
      )}
      title={config.label}
      role="img"
      aria-label={config.label}
    >
      <Icon className={sizeClasses[size].icon} aria-hidden="true" />
      {showLabel && <span>{config.label}</span>}
      {!showLabel && <span className="sr-only">{config.label}</span>}
    </span>
  )
}

export interface AccessibilityBadgeGroupProps {
  /** Array of accessibility types to display */
  types: AccessibilityType[]
  /** Badge variant */
  variant?: 'default' | 'outline' | 'filled'
  /** Size of badges */
  size?: 'sm' | 'md'
  /** Additional CSS classes */
  className?: string
}

/**
 * Group component for displaying multiple accessibility badges.
 */
export function AccessibilityBadgeGroup({
  types,
  variant = 'default',
  size = 'sm',
  className,
}: AccessibilityBadgeGroupProps) {
  if (!types.length) return null

  return (
    <div
      className={cn('flex flex-wrap gap-1', className)}
      role="group"
      aria-label="Accessibility features"
    >
      {types.map((type) => (
        <AccessibilityBadge key={type} type={type} variant={variant} size={size} />
      ))}
    </div>
  )
}
