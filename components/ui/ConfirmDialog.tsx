'use client'

import { useEffect } from 'react'
import Button from './Button'

interface ConfirmDialogProps {
  isOpen: boolean
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'primary'
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  isOpen,
  title = '确认操作',
  message,
  confirmText = '确定',
  cancelText = '取消',
  variant = 'primary',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-[var(--primary)]/40 backdrop-blur-md animate-fade-in"
        onClick={onCancel}
      />

      {/* 对话框内容 */}
      <div
        className="relative bg-[var(--card-bg)] rounded-[var(--radius-2xl)] shadow-[var(--shadow-elevated)] max-w-md w-full animate-scale-in"
        style={{ transition: 'all var(--transition-elegant)' }}
      >
        {/* 标题 */}
        <div className="px-6 pt-6 pb-4 border-b border-[var(--gray-200)]">
          <h3 className="text-display text-2xl text-[var(--gray-900)]">
            {title}
          </h3>
        </div>

        {/* 消息内容 */}
        <div className="px-6 py-6">
          <p className="text-editorial text-base text-[var(--gray-700)] leading-relaxed whitespace-pre-line">
            {message}
          </p>
        </div>

        {/* 按钮组 */}
        <div className="px-6 pb-6 flex gap-3 justify-end">
          <Button
            variant="ghost"
            onClick={onCancel}
            className="min-w-[100px]"
          >
            {cancelText}
          </Button>
          <Button
            variant={variant === 'danger' ? 'primary' : 'primary'}
            onClick={() => {
              onConfirm()
              onCancel()
            }}
            className={`min-w-[100px] ${
              variant === 'danger'
                ? '!bg-[var(--error)] hover:!bg-[var(--error-dark)]'
                : ''
            }`}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  )
}
