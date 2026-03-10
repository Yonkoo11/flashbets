'use client'

import { forwardRef, HTMLAttributes, ReactNode } from 'react'

export type BadgeVariant = 'default' | 'accent' | 'success' | 'error' | 'warning' | 'info'
export type BadgeSize = 'sm' | 'md'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  size?: BadgeSize
  dot?: boolean
  children: ReactNode
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-card border-card-border text-text-secondary',
  accent: 'bg-accent/10 border-accent/20 text-accent',
  success: 'bg-bet-up/10 border-bet-up/20 text-bet-up',
  error: 'bg-bet-down/10 border-bet-down/20 text-bet-down',
  warning: 'bg-amber-500/10 border-amber-500/20 text-amber-500',
  info: 'bg-blue-500/10 border-blue-500/20 text-blue-500',
}

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-1.5 py-0.5 text-2xs',
  md: 'px-2 py-1 text-xs',
}

const dotStyles: Record<BadgeVariant, string> = {
  default: 'bg-text-secondary',
  accent: 'bg-accent',
  success: 'bg-bet-up',
  error: 'bg-bet-down',
  warning: 'bg-amber-500',
  info: 'bg-blue-500',
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      variant = 'default',
      size = 'sm',
      dot = false,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    return (
      <span
        ref={ref}
        className={`
          inline-flex items-center gap-1.5 border rounded-full font-medium
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${className}
        `.trim().replace(/\s+/g, ' ')}
        {...props}
      >
        {dot && (
          <span
            className={`w-1.5 h-1.5 rounded-full ${dotStyles[variant]} animate-pulse`}
            aria-hidden="true"
          />
        )}
        {children}
      </span>
    )
  }
)

Badge.displayName = 'Badge'
