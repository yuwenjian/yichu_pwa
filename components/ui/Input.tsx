'use client'

import { InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/utils/cn'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-[#1a1a1a] mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full px-4 py-3.5 text-base',
            'bg-white border-2 border-[var(--gray-300)] rounded-xl',
            'text-[#1a1a1a] placeholder:text-[#5c5954]',
            'focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]',
            'transition-all duration-200',
            'disabled:bg-[var(--gray-100)] disabled:cursor-not-allowed disabled:text-[var(--gray-500)]',
            'min-h-[52px]',
            error && 'border-[var(--error)] focus:ring-[var(--error)]',
            className
          )}
          style={{ 
            color: '#1a1a1a',
            WebkitTextFillColor: '#1a1a1a',
            fontSize: '16px', // 防止 iOS 自动缩放
          }}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-sm text-[var(--error)]">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1.5 text-sm text-[var(--gray-500)]">{helperText}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
