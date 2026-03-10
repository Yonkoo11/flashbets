'use client'

import { forwardRef, HTMLAttributes, ReactNode } from 'react'

export type CardVariant = 'elevated' | 'glass' | 'outline' | 'success' | 'error'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant
  hover?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
  children: ReactNode
}

const variantStyles: Record<CardVariant, string> = {
  elevated: 'card-elevated',
  glass: 'card-glass',
  outline: 'bg-transparent border border-card-border',
  success: 'bg-bet-up/10 border border-bet-up/30',
  error: 'bg-bet-down/10 border border-bet-down/30',
}

const paddingStyles: Record<'none' | 'sm' | 'md' | 'lg', string> = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'elevated',
      hover = false,
      padding = 'md',
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const hoverStyles = hover ? 'hover:bg-card-hover cursor-pointer transition-colors' : ''

    return (
      <div
        ref={ref}
        className={`
          rounded-xl
          ${variantStyles[variant]}
          ${paddingStyles[padding]}
          ${hoverStyles}
          ${className}
        `.trim().replace(/\s+/g, ' ')}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'
