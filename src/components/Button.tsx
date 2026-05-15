import React from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg' | 'icon'
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const variants = {
      primary: 'bg-brand text-white shadow-[0_8px_18px_rgba(79,155,121,0.22)] active:bg-[#3f8064]',
      secondary: 'bg-white text-ink border border-surface-border shadow-[0_6px_14px_rgba(36,53,47,0.05)] active:bg-surface-dark',
      ghost: 'bg-transparent text-ink-muted active:bg-surface-border',
      danger: 'bg-[#b65d5d] text-white active:bg-[#9f4d4d]'
    }
    const sizes = {
      sm: 'h-9 px-3 text-sm',
      md: 'h-11 px-4 text-sm',
      lg: 'h-12 px-5 text-base',
      icon: 'h-11 w-11'
    }

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition disabled:pointer-events-none disabled:opacity-50',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    )
  }
)

Button.displayName = 'Button'
