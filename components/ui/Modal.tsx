'use client'

import { ReactNode, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/utils/cn'
import Button from './Button'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showCloseButton?: boolean
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
}: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      {/* 背景遮罩 - 精致的模糊效果 */}
      <div
        className="absolute inset-0 bg-[var(--primary)]/40 backdrop-blur-md animate-fade-in"
        onClick={onClose}
      />
      
      {/* 模态框内容 - 移动端全屏 */}
      <div
        className={cn(
          'relative bg-[var(--card-bg)] w-full shadow-[var(--shadow-dramatic)] border border-[var(--gray-200)]',
          'sm:w-full',
          sizes[size],
          'animate-scale-in sm:animate-scale-in',
          'h-full sm:h-auto sm:max-h-[90vh]',
          'flex flex-col',
          'overflow-hidden',
          'rounded-none sm:rounded-[var(--radius-2xl)]',
          'pb-safe sm:pb-0'
        )}
        style={{
          animation: 'slideUp var(--transition-elegant) ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 移动端拖拽指示器 - 隐藏 */}
        <div className="hidden">
          <div className="w-12 h-1 bg-[var(--gray-300)] rounded-full" />
        </div>
        
        {/* 头部 */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--gray-200)] sticky top-0 bg-[var(--card-bg)] z-10 backdrop-blur-sm">
            {title && (
              <div>
                <h2 className="text-display text-2xl sm:text-3xl text-[var(--gray-900)]">
                  {title}
                </h2>
              </div>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="ml-auto p-2.5 hover:bg-[var(--gray-100)] rounded-lg transition-all min-w-[44px] min-h-[44px] flex items-center justify-center group"
                aria-label="关闭"
                style={{ transition: 'all var(--transition-smooth)' }}
              >
                <svg
                  className="w-6 h-6 text-[var(--gray-500)] group-hover:text-[var(--gray-900)] transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        )}
        
        <div className="p-6 sm:p-8 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  )

  return typeof window !== 'undefined' ? createPortal(modalContent, document.body) : null
}
