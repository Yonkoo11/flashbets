/**
 * FlashBets Design Tokens
 * Centralized design system values for consistency across the app
 */

export const colors = {
  // Core backgrounds
  background: {
    default: '#0a0a0f',
    elevated: '#12121a',
    subtle: '#08080c',
  },

  // Card surfaces
  card: {
    default: '#1a1a2e',
    hover: '#222240',
    border: '#2a2a4e',
  },

  // Betting colors
  betUp: {
    default: '#22c55e',
    light: '#4ade80',
    dark: '#16a34a',
    glow: 'rgba(34, 197, 94, 0.4)',
  },

  betDown: {
    default: '#ef4444',
    light: '#f87171',
    dark: '#dc2626',
    glow: 'rgba(239, 68, 68, 0.4)',
  },

  // Accent
  accent: {
    default: '#fbbf24',
    light: '#fcd34d',
    dark: '#f59e0b',
    glow: 'rgba(251, 191, 36, 0.4)',
  },

  // Text
  text: {
    primary: '#ffffff',
    secondary: '#a1a1aa',
    muted: '#71717a',
  },

  // Semantic aliases
  success: '#22c55e',
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
} as const

export const spacing = {
  xs: '0.25rem',  // 4px
  sm: '0.5rem',   // 8px
  md: '1rem',     // 16px
  lg: '1.5rem',   // 24px
  xl: '2rem',     // 32px
  '2xl': '3rem',  // 48px
} as const

export const timing = {
  fast: '150ms',
  normal: '200ms',
  slow: '300ms',
  xslow: '500ms',
} as const

export const easing = {
  smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
  bounceIn: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
} as const

export const shadows = {
  glowUp: '0 0 20px rgba(34, 197, 94, 0.3), 0 0 40px rgba(34, 197, 94, 0.1)',
  glowDown: '0 0 20px rgba(239, 68, 68, 0.3), 0 0 40px rgba(239, 68, 68, 0.1)',
  glowAccent: '0 0 20px rgba(251, 191, 36, 0.3), 0 0 40px rgba(251, 191, 36, 0.1)',
  glowUrgent: '0 0 30px rgba(239, 68, 68, 0.5), 0 0 60px rgba(239, 68, 68, 0.2)',
  card: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -2px rgba(0, 0, 0, 0.2)',
  cardHover: '0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
} as const

export const borderRadius = {
  sm: '0.375rem',  // 6px
  md: '0.5rem',    // 8px
  lg: '0.75rem',   // 12px
  xl: '1rem',      // 16px
  '2xl': '1.5rem', // 24px
  full: '9999px',
} as const

export const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    heading: ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'monospace'],
  },
  fontSize: {
    '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
    xs: ['0.75rem', { lineHeight: '1rem' }],
    sm: ['0.875rem', { lineHeight: '1.25rem' }],
    base: ['1rem', { lineHeight: '1.5rem' }],
    lg: ['1.125rem', { lineHeight: '1.75rem' }],
    xl: ['1.25rem', { lineHeight: '1.75rem' }],
    '2xl': ['1.5rem', { lineHeight: '2rem' }],
    display: ['3rem', { lineHeight: '1.1', fontWeight: '700' }],
    price: ['2.5rem', { lineHeight: '1', fontWeight: '700' }],
    title: ['1.5rem', { lineHeight: '1.25', fontWeight: '600' }],
  },
} as const

// Breakpoints (matches Tailwind defaults)
export const breakpoints = {
  xs: '475px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const

// Z-index scale
export const zIndex = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  overlay: 40,
  modal: 50,
  popover: 60,
  tooltip: 70,
} as const

// Animation durations for timer urgency states
export const timerStates = {
  calm: {
    range: [60, 30],
    color: 'bet-up',
    pulse: false,
  },
  warning: {
    range: [30, 15],
    color: 'amber-500',
    pulse: false,
  },
  urgent: {
    range: [15, 5],
    color: 'orange-500',
    pulse: true,
  },
  critical: {
    range: [5, 0],
    color: 'bet-down',
    pulse: true,
    glow: true,
  },
} as const
