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
      default: 'bg-[var(--background)] border border-[var(--gray-200)] text-[var(--gray-900)]',
      elevated: 'bg-[var(--background)] shadow-lg text-[var(--gray-900)]',
      outlined: 'bg-[var(--background)] border-2 border-[var(--gray-300)] text-[var(--gray-900)]',
    }
    
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl p-6 transition-all duration-200',
          variants[variant],
          hover && 'hover:shadow-xl hover:-translate-y-1 cursor-pointer',
          className
        )}
        style={{ color: 'var(--gray-900)' }}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

export default Card
