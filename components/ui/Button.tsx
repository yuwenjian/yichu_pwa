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
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
    
    const variants = {
      primary: 'bg-[var(--primary)] text-white hover:bg-[var(--primary-dark)] focus:ring-[var(--primary)] shadow-md hover:shadow-lg',
      secondary: 'bg-[var(--accent)] text-white hover:bg-[var(--accent-light)] focus:ring-[var(--accent)] shadow-md hover:shadow-lg',
      outline: 'border-2 border-[var(--gray-900)] text-[var(--gray-900)] hover:bg-[var(--gray-900)] hover:text-white focus:ring-[var(--primary)] font-semibold',
      ghost: 'text-[var(--gray-900)] hover:bg-[var(--primary)]/10 focus:ring-[var(--primary)] font-medium hover:text-[var(--primary)]',
      danger: 'bg-[var(--error)] text-white hover:bg-[#b86d6d] focus:ring-[var(--error)] shadow-md hover:shadow-lg',
    }
    
    const sizes = {
      sm: 'px-4 py-2 text-sm rounded-lg min-h-[40px]',
      md: 'px-5 py-2.5 text-base rounded-xl min-h-[44px]',
      lg: 'px-6 py-3 text-lg rounded-xl min-h-[52px]',
    }
    
    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
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
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button
