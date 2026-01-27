'use client'

import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/utils/cn'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed relative overflow-hidden group'
    
    const variants = {
      primary: 'bg-[var(--primary)] text-[var(--gray-50)] hover:bg-[var(--primary-dark)] focus:ring-[var(--primary)] shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-medium)] border border-[var(--primary)]',
      secondary: 'bg-[var(--accent)] text-[var(--primary)] hover:bg-[var(--accent-dark)] hover:text-white focus:ring-[var(--accent)] shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-medium)]',
      outline: 'border border-[var(--gray-900)] text-[var(--gray-900)] hover:bg-[var(--gray-900)] hover:text-[var(--gray-50)] focus:ring-[var(--gray-900)] backdrop-blur-sm',
      ghost: 'text-[var(--gray-900)] hover:bg-[var(--accent)]/10 focus:ring-[var(--accent)] hover:text-[var(--accent-dark)]',
      danger: 'bg-[var(--error)] text-white hover:bg-[#9a4a4a] focus:ring-[var(--error)] shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-medium)]',
    }
    
    const sizes = {
      sm: 'px-4 py-2 text-sm rounded-[var(--radius-md)] min-h-[38px] tracking-wide',
      md: 'px-6 py-2.5 text-base rounded-[var(--radius-lg)] min-h-[44px] tracking-wide',
      lg: 'px-8 py-3.5 text-lg rounded-[var(--radius-xl)] min-h-[56px] tracking-wide',
    }
    
    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        style={{
          transition: 'all var(--transition-smooth)',
        }}
        {...props}
      >
        {/* 微妙的光泽效果 */}
        <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
        </span>
        
        <span className="relative flex items-center">
          {isLoading && (
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
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
          )}
          {children}
        </span>
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button
