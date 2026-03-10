'use client'

import { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'up' | 'down'
export type ButtonSize = 'sm' | 'md' | 'lg'
export type ButtonGlow = 'none' | 'accent' | 'up' | 'down'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  glow?: ButtonGlow
  loading?: boolean
  selected?: boolean
  children: ReactNode
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-gradient-to-r from-accent to-accent-light text-background font-bold',
  secondary: 'bg-card border border-card-border text-text-primary hover:bg-card-hover',
  outline: 'bg-transparent border border-card-border text-text-primary hover:bg-card/50',
  ghost: 'bg-transparent text-text-secondary hover:bg-card/50 hover:text-text-primary',
  up: 'bg-bet-up text-white font-bold',
  down: 'bg-bet-down text-white font-bold',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-2 text-sm min-h-[36px]',
  md: 'px-4 py-3 text-base min-h-[44px]',
  lg: 'px-6 py-4 text-lg min-h-[56px]',
}

const glowStyles: Record<ButtonGlow, string> = {
  none: '',
  accent: 'btn-glow-accent',
  up: 'btn-glow-up',
  down: 'btn-glow-down',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      glow = 'none',
      loading = false,
      selected = false,
      disabled,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading

    const selectedStyles = selected
      ? 'ring-2 ring-white/80 scale-[1.02]'
      : ''

    const disabledStyles = isDisabled
      ? 'opacity-50 cursor-not-allowed saturate-50'
      : 'hover:scale-[1.01]'

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={`
          relative overflow-hidden rounded-xl transition-[transform,opacity] duration-200 btn-press touch-ripple
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${glowStyles[glow]}
          ${selectedStyles}
          ${disabledStyles}
          ${className}
        `.trim().replace(/\s+/g, ' ')}
        {...props}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Spinner />
            <span>Loading...</span>
          </span>
        ) : (
          children
        )}
        {selected && <div className="absolute inset-0 bg-white/10 animate-pulse" />}
      </button>
    )
  }
)

Button.displayName = 'Button'

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}
