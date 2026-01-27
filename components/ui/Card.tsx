'use client'

import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/utils/cn'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined'
  hover?: boolean
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', hover = false, children, ...props }, ref) => {
    const variants = {
      default: 'bg-[var(--card-bg)] border border-[var(--gray-200)] text-[var(--gray-900)] shadow-[var(--shadow-subtle)]',
      elevated: 'bg-[var(--card-bg)] shadow-[var(--shadow-medium)] text-[var(--gray-900)] border border-[var(--gray-100)]',
      outlined: 'bg-[var(--card-bg)] border border-[var(--gray-300)] text-[var(--gray-900)]',
    }
    
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-[var(--radius-xl)] p-6 relative overflow-hidden group',
          variants[variant],
          hover && 'hover:shadow-[var(--shadow-elevated)] hover:-translate-y-2 cursor-pointer hover:border-[var(--accent-light)]',
          className
        )}
        style={{ 
          color: 'var(--gray-900)',
          transition: 'all var(--transition-elegant)',
        }}
        {...props}
      >
        {/* 微妙的渐变叠加 */}
        {hover && (
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-light)]/0 via-transparent to-transparent opacity-0 group-hover:opacity-5 transition-opacity duration-700 pointer-events-none" />
        )}
        
        <div className="relative z-10">
          {children}
        </div>
      </div>
    )
  }
)

Card.displayName = 'Card'

export default Card
