'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

interface DraggableFABProps {
  onClick: () => void
  icon?: React.ReactNode
  ariaLabel?: string
  className?: string
}

export default function DraggableFAB({
  onClick,
  icon,
  ariaLabel = '添加',
  className = '',
}: DraggableFABProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dragStartPos = useRef({ x: 0, y: 0 })
  const dragStartTime = useRef(0)

  // 初始化位置：右下角
  useEffect(() => {
    const initPosition = () => {
      const padding = 20 // 距离边缘的距离
      const bottomOffset = 80 // 距离底部的距离（给底部导航栏留空间）
      
      setPosition({
        x: window.innerWidth - 56 - padding, // 按钮宽度 56px
        y: window.innerHeight - 56 - bottomOffset,
      })
      setIsInitialized(true)
    }

    initPosition()
    window.addEventListener('resize', initPosition)
    return () => window.removeEventListener('resize', initPosition)
  }, [])

  // 获取安全的位置边界
  const getSafePosition = useCallback((x: number, y: number) => {
    const padding = 20
    const bottomOffset = 80
    const buttonSize = 56

    // 限制 Y 轴范围
    const minY = padding
    const maxY = window.innerHeight - buttonSize - bottomOffset

    // 计算屏幕中心
    const screenCenterX = window.innerWidth / 2

    // 自动吸附到左边或右边
    let safeX: number
    if (x < screenCenterX) {
      // 吸附到左边
      safeX = padding
    } else {
      // 吸附到右边
      safeX = window.innerWidth - buttonSize - padding
    }

    const safeY = Math.max(minY, Math.min(y, maxY))

    return { x: safeX, y: safeY }
  }, [])

  // 处理触摸开始
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    dragStartPos.current = { x: touch.clientX, y: touch.clientY }
    dragStartTime.current = Date.now()
    setIsDragging(true)
  }

  // 处理触摸移动
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    e.preventDefault() // 防止页面滚动

    const touch = e.touches[0]
    const deltaX = touch.clientX - dragStartPos.current.x
    const deltaY = touch.clientY - dragStartPos.current.y

    setPosition(prev => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY,
    }))

    dragStartPos.current = { x: touch.clientX, y: touch.clientY }
  }

  // 处理触摸结束
  const handleTouchEnd = () => {
    const dragDuration = Date.now() - dragStartTime.current
    const wasQuickTap = dragDuration < 200

    // 如果是快速点击（而不是拖动），触发 onClick
    if (wasQuickTap) {
      onClick()
    }

    // 吸附到边缘
    setPosition(prev => getSafePosition(prev.x, prev.y))
    setIsDragging(false)
  }

  // 处理鼠标事件（用于桌面端测试）
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    dragStartPos.current = { x: e.clientX, y: e.clientY }
    dragStartTime.current = Date.now()
    setIsDragging(true)
  }

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return

    const deltaX = e.clientX - dragStartPos.current.x
    const deltaY = e.clientY - dragStartPos.current.y

    setPosition(prev => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY,
    }))

    dragStartPos.current = { x: e.clientX, y: e.clientY }
  }, [isDragging])

  const handleMouseUp = useCallback(() => {
    if (!isDragging) return

    const dragDuration = Date.now() - dragStartTime.current
    const wasQuickClick = dragDuration < 200

    if (wasQuickClick) {
      onClick()
    }

    setPosition(prev => getSafePosition(prev.x, prev.y))
    setIsDragging(false)
  }, [isDragging, onClick, getSafePosition])

  // 添加鼠标事件监听
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  // 默认图标
  const defaultIcon = (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
    </svg>
  )

  if (!isInitialized) {
    return null // 等待初始化
  }

  return (
    <button
      ref={buttonRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      className={`fixed z-50 w-14 h-14 bg-[var(--accent-dark)] text-white rounded-full shadow-[var(--shadow-elevated)] flex items-center justify-center select-none ${
        isDragging ? 'scale-110' : 'hover:scale-110 active:scale-95'
      } transition-all ${className}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transition: isDragging ? 'none' : 'all var(--transition-smooth)',
        touchAction: 'none', // 防止触摸时的默认行为
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      aria-label={ariaLabel}
    >
      {icon || defaultIcon}
    </button>
  )
}
