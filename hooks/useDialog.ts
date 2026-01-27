import { useState, useCallback } from 'react'

interface ConfirmOptions {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'primary'
}

interface ToastOptions {
  message: string
  type?: 'success' | 'error' | 'info' | 'warning'
  duration?: number
}

export function useConfirm() {
  const [isOpen, setIsOpen] = useState(false)
  const [options, setOptions] = useState<ConfirmOptions>({ message: '' })
  const [resolver, setResolver] = useState<((value: boolean) => void) | null>(null)

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    setOptions(opts)
    setIsOpen(true)

    return new Promise((resolve) => {
      setResolver(() => resolve)
    })
  }, [])

  const handleConfirm = useCallback(() => {
    setIsOpen(false)
    if (resolver) {
      resolver(true)
      setResolver(null)
    }
  }, [resolver])

  const handleCancel = useCallback(() => {
    setIsOpen(false)
    if (resolver) {
      resolver(false)
      setResolver(null)
    }
  }, [resolver])

  return {
    isOpen,
    options,
    confirm,
    handleConfirm,
    handleCancel,
  }
}

export function useToast() {
  const [isOpen, setIsOpen] = useState(false)
  const [options, setOptions] = useState<ToastOptions>({ message: '' })

  const showToast = useCallback((opts: ToastOptions) => {
    setOptions(opts)
    setIsOpen(true)
  }, [])

  const success = useCallback((message: string, duration?: number) => {
    showToast({ message, type: 'success', duration })
  }, [showToast])

  const error = useCallback((message: string, duration?: number) => {
    showToast({ message, type: 'error', duration })
  }, [showToast])

  const info = useCallback((message: string, duration?: number) => {
    showToast({ message, type: 'info', duration })
  }, [showToast])

  const warning = useCallback((message: string, duration?: number) => {
    showToast({ message, type: 'warning', duration })
  }, [showToast])

  const handleClose = useCallback(() => {
    setIsOpen(false)
  }, [])

  return {
    isOpen,
    options,
    showToast,
    success,
    error,
    info,
    warning,
    handleClose,
  }
}
