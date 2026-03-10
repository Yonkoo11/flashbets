'use client'

interface SkeletonProps {
  width?: string | number
  height?: string | number
  variant?: 'text' | 'circular' | 'rectangular'
  className?: string
}

export function Skeleton({
  width,
  height,
  variant = 'text',
  className = '',
}: SkeletonProps) {
  const variantStyles = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  }

  const style: React.CSSProperties = {
    width: width ?? (variant === 'circular' ? height : '100%'),
    height: height ?? (variant === 'text' ? '1em' : height),
  }

  return (
    <div
      className={`skeleton ${variantStyles[variant]} ${className}`}
      style={style}
      aria-hidden="true"
    />
  )
}

// Compound components for common patterns
export function SkeletonText({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          width={i === lines - 1 ? '60%' : '100%'}
          height="1em"
        />
      ))}
    </div>
  )
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`card-elevated p-4 space-y-3 ${className}`}>
      <Skeleton variant="rectangular" height={20} width="40%" />
      <Skeleton variant="text" height={16} />
      <Skeleton variant="text" height={16} width="80%" />
    </div>
  )
}

export function SkeletonPrice({ className = '' }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <Skeleton variant="rectangular" height={48} width={200} />
      <Skeleton variant="text" height={20} width={100} />
    </div>
  )
}
