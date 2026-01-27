'use client'

import { useState, useRef, useEffect, ReactNode } from 'react'

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void
  children: ReactNode
  className?: string
  pullThreshold?: number
  maxPullDistance?: number
}

export default function PullToRefresh({
  onRefresh,
  children,
  className = '',
  pullThreshold = 80,
  maxPullDistance = 120,
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isReleased, setIsReleased] = useState(false)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const startY = useRef(0)
  const currentY = useRef(0)
  const isDragging = useRef(false)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleTouchStart = (e: TouchEvent) => {
      // 只在页面顶部时启用下拉刷新
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      if (scrollTop > 0 || isRefreshing) return

      startY.current = e.touches[0].clientY
      isDragging.current = true
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging.current || isRefreshing) return

      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      if (scrollTop > 0) {
        isDragging.current = false
        setPullDistance(0)
        return
      }

      currentY.current = e.touches[0].clientY
      const distance = currentY.current - startY.current

      if (distance > 0) {
        // 阻止默认的页面滚动
        e.preventDefault()
        
        // 计算拉动距离，使用阻尼效果
        const damping = 0.5
        const dampedDistance = Math.min(distance * damping, maxPullDistance)
        setPullDistance(dampedDistance)
      }
    }

    const handleTouchEnd = async () => {
      if (!isDragging.current || isRefreshing) return

      isDragging.current = false

      if (pullDistance >= pullThreshold) {
        // 触发刷新
        setIsReleased(true)
        setIsRefreshing(true)
        setPullDistance(pullThreshold) // 保持在阈值位置

        try {
          await onRefresh()
        } catch (error) {
          console.error('Refresh error:', error)
        } finally {
          // 刷新完成后的动画
          setTimeout(() => {
            setIsRefreshing(false)
            setIsReleased(false)
            setPullDistance(0)
          }, 300)
        }
      } else {
        // 未达到阈值，回弹
        setIsReleased(true)
        setPullDistance(0)
        setTimeout(() => setIsReleased(false), 300)
      }
    }

    container.addEventListener('touchstart', handleTouchStart, { passive: true })
    container.addEventListener('touchmove', handleTouchMove, { passive: false })
    container.addEventListener('touchend', handleTouchEnd)

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isRefreshing, pullDistance, pullThreshold, maxPullDistance, onRefresh])

  const getRefreshStatus = () => {
    if (isRefreshing) return '刷新中...'
    if (pullDistance >= pullThreshold) return '松开刷新'
    if (pullDistance > 0) return '下拉刷新'
    return ''
  }

  const spinnerRotation = isRefreshing ? 'animate-spin' : ''
  const opacity = pullDistance / pullThreshold
  const scale = Math.min(0.6 + (pullDistance / pullThreshold) * 0.4, 1)

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* 下拉刷新指示器 */}
      <div
        className="absolute top-0 left-0 right-0 flex flex-col items-center justify-center overflow-hidden"
        style={{
          height: `${pullDistance}px`,
          transition: isReleased ? 'height 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
          opacity: Math.min(opacity, 1),
        }}
      >
        <div
          className="flex flex-col items-center gap-2"
          style={{
            transform: `scale(${scale})`,
            transition: isReleased ? 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
          }}
        >
          {/* 刷新图标 */}
          <div
            className={`w-8 h-8 rounded-full bg-[var(--accent)]/10 backdrop-blur-sm flex items-center justify-center ${spinnerRotation}`}
            style={{
              boxShadow: 'var(--shadow-soft)',
            }}
          >
            <svg
              className="w-5 h-5 text-[var(--accent-dark)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </div>
          
          {/* 刷新文字 */}
          <p className="text-xs tracking-[0.15em] uppercase text-[var(--accent-dark)] font-medium">
            {getRefreshStatus()}
          </p>
        </div>
      </div>

      {/* 页面内容 */}
      <div
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: isReleased ? 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
        }}
      >
        {children}
      </div>
    </div>
  )
}
