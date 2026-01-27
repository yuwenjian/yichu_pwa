'use client'

import { InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/utils/cn'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, type, ...props }, ref) => {
    const isDateInput = type === 'date'
    
    return (
      <div className="w-full group">
        {label && (
          <label className="block text-sm font-medium text-[var(--gray-900)] mb-2 tracking-wide">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            type={type}
            className={cn(
              'w-full px-5 py-3.5 text-base',
              'bg-[var(--input-bg)] border border-[var(--gray-300)] rounded-[var(--radius-lg)]',
              'text-[var(--gray-900)] placeholder:text-[var(--gray-500)]',
              'focus:outline-none focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)]',
              'shadow-[var(--shadow-subtle)] focus:shadow-[var(--shadow-soft)]',
              'disabled:bg-[var(--gray-100)] disabled:cursor-not-allowed disabled:text-[var(--gray-500)]',
              'min-h-[52px]',
              error && 'border-[var(--error)] focus:ring-[var(--error)] focus:border-[var(--error)]',
              isDateInput && 'date-input cursor-pointer pr-12',
              className
            )}
            style={{ 
              color: 'var(--gray-900)',
              WebkitTextFillColor: 'var(--gray-900)',
              fontSize: '16px',
              transition: 'all var(--transition-smooth)',
              colorScheme: isDateInput ? 'light' : 'normal',
            }}
            {...props}
          />
          {/* 自定义日期图标 */}
          {isDateInput && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg 
                className="w-5 h-5 text-white"
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
                />
              </svg>
            </div>
          )}
          {/* 聚焦时的微妙高亮 */}
          <div className="absolute inset-0 rounded-[var(--radius-lg)] bg-gradient-to-r from-[var(--accent-light)]/0 via-[var(--accent-light)]/5 to-[var(--accent-light)]/0 opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none" />
        </div>
        {error && (
          <p className="mt-2 text-sm text-[var(--error)] flex items-center gap-1">
            <span className="inline-block w-1 h-1 rounded-full bg-[var(--error)]" />
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="mt-2 text-sm text-[var(--gray-500)]">{helperText}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
