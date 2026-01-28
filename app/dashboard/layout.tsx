'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import BottomNav from '@/components/ui/BottomNav'
import { cn } from '@/utils/cn'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, loading, signOut, checkUser } = useAuthStore()

  useEffect(() => {
    checkUser()
  }, [checkUser])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--primary)]"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* 导航栏 - 移动端隐藏 */}
      <nav className="hidden md:block bg-[var(--card-bg)]/80 border-b border-[var(--gray-200)] sticky top-0 z-40 backdrop-blur-xl">
        {/* 顶部装饰线 */}
        <div className="h-px bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-40" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-12">
              <Link 
                href="/dashboard" 
                className="text-display text-3xl text-[var(--gray-900)] hover:text-[var(--accent-dark)] transition-colors duration-300"
              >
                Wardrobe
              </Link>
              <div className="hidden md:flex items-center space-x-8">
                <Link
                  href="/dashboard"
                  className={cn(
                    "relative text-sm font-medium tracking-wide transition-colors duration-300 pb-1 group",
                    pathname === '/dashboard' 
                      ? "text-[var(--accent-dark)]" 
                      : "text-[var(--gray-600)] hover:text-[var(--accent-dark)]"
                  )}
                >
                  首页
                  <span className={cn(
                    "absolute bottom-0 left-0 h-px bg-[var(--accent)] transition-all duration-300",
                    pathname === '/dashboard' ? "w-full" : "w-0 group-hover:w-full"
                  )} />
                </Link>
                <Link
                  href="/dashboard/wardrobes"
                  className={cn(
                    "relative text-sm font-medium tracking-wide transition-colors duration-300 pb-1 group",
                    pathname?.startsWith('/dashboard/wardrobes') 
                      ? "text-[var(--accent-dark)]" 
                      : "text-[var(--gray-600)] hover:text-[var(--accent-dark)]"
                  )}
                >
                  衣橱
                  <span className={cn(
                    "absolute bottom-0 left-0 h-px bg-[var(--accent)] transition-all duration-300",
                    pathname?.startsWith('/dashboard/wardrobes') ? "w-full" : "w-0 group-hover:w-full"
                  )} />
                </Link>
                <Link
                  href="/dashboard/outfits"
                  className={cn(
                    "relative text-sm font-medium tracking-wide transition-colors duration-300 pb-1 group",
                    pathname?.startsWith('/dashboard/outfits') 
                      ? "text-[var(--accent-dark)]" 
                      : "text-[var(--gray-600)] hover:text-[var(--accent-dark)]"
                  )}
                >
                  搭配
                  <span className={cn(
                    "absolute bottom-0 left-0 h-px bg-[var(--accent)] transition-all duration-300",
                    pathname?.startsWith('/dashboard/outfits') ? "w-full" : "w-0 group-hover:w-full"
                  )} />
                </Link>
                <Link
                  href="/dashboard/statistics"
                  className={cn(
                    "relative text-sm font-medium tracking-wide transition-colors duration-300 pb-1 group",
                    pathname?.startsWith('/dashboard/statistics') 
                      ? "text-[var(--accent-dark)]" 
                      : "text-[var(--gray-600)] hover:text-[var(--accent-dark)]"
                  )}
                >
                  统计
                  <span className={cn(
                    "absolute bottom-0 left-0 h-px bg-[var(--accent)] transition-all duration-300",
                    pathname?.startsWith('/dashboard/statistics') ? "w-full" : "w-0 group-hover:w-full"
                  )} />
                </Link>
                <Link
                  href="/dashboard/more"
                  className={cn(
                    "relative text-sm font-medium tracking-wide transition-colors duration-300 pb-1 group",
                    pathname?.startsWith('/dashboard/more') || 
                    pathname?.startsWith('/dashboard/calendar') ||
                    pathname?.startsWith('/dashboard/analysis') ||
                    pathname?.startsWith('/dashboard/compare') ||
                    pathname?.startsWith('/dashboard/recommendations')
                      ? "text-[var(--accent-dark)]" 
                      : "text-[var(--gray-600)] hover:text-[var(--accent-dark)]"
                  )}
                >
                  更多
                  <span className={cn(
                    "absolute bottom-0 left-0 h-px bg-[var(--accent)] transition-all duration-300",
                    pathname?.startsWith('/dashboard/more') ||
                    pathname?.startsWith('/dashboard/calendar') ||
                    pathname?.startsWith('/dashboard/analysis') ||
                    pathname?.startsWith('/dashboard/compare') ||
                    pathname?.startsWith('/dashboard/recommendations')
                      ? "w-full" : "w-0 group-hover:w-full"
                  )} />
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-[var(--gray-600)] hidden sm:block font-medium">
                {user.email}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  await signOut()
                  router.push('/login')
                }}
              >
                退出
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* 主内容 - 移动端全屏 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-24 md:pt-12 md:pb-12">
        {children}
      </main>

      {/* 底部导航栏 - 仅移动端显示 */}
      <BottomNav />
    </div>
  )
}
