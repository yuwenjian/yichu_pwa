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
      {/* 导航栏 */}
      <nav className="bg-white border-b border-[var(--gray-200)] sticky top-0 z-40 backdrop-blur-sm bg-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link 
                href="/dashboard" 
                className="text-2xl font-bold text-[#1a1a1a]" 
                style={{ 
                  fontFamily: 'Playfair Display, serif'
                }}
              >
                衣橱管理
              </Link>
              <div className="hidden md:flex items-center space-x-6">
                <Link
                  href="/dashboard"
                  className={cn(
                    "relative font-medium transition-colors pb-1",
                    pathname === '/dashboard' 
                      ? "text-[#3b82f6]" 
                      : "text-[#5c5954] hover:text-[#3b82f6]"
                  )}
                >
                  首页
                  {pathname === '/dashboard' && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#3b82f6]"></span>
                  )}
                </Link>
                <Link
                  href="/dashboard/wardrobes"
                  className={cn(
                    "relative font-medium transition-colors pb-1",
                    pathname?.startsWith('/dashboard/wardrobes') 
                      ? "text-[#3b82f6]" 
                      : "text-[#5c5954] hover:text-[#3b82f6]"
                  )}
                >
                  衣橱
                  {pathname?.startsWith('/dashboard/wardrobes') && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#3b82f6]"></span>
                  )}
                </Link>
                <Link
                  href="/dashboard/outfits"
                  className={cn(
                    "relative font-medium transition-colors pb-1",
                    pathname?.startsWith('/dashboard/outfits') 
                      ? "text-[#3b82f6]" 
                      : "text-[#5c5954] hover:text-[#3b82f6]"
                  )}
                >
                  搭配
                  {pathname?.startsWith('/dashboard/outfits') && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#3b82f6]"></span>
                  )}
                </Link>
                <Link
                  href="/dashboard/statistics"
                  className={cn(
                    "relative font-medium transition-colors pb-1",
                    pathname?.startsWith('/dashboard/statistics') 
                      ? "text-[#3b82f6]" 
                      : "text-[#5c5954] hover:text-[#3b82f6]"
                  )}
                >
                  统计
                  {pathname?.startsWith('/dashboard/statistics') && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#3b82f6]"></span>
                  )}
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-[#5c5954] hidden sm:block font-medium">
                {user.email}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  await signOut()
                  router.push('/login')
                }}
                className="!text-[#1a1a1a] hover:!bg-gray-100"
              >
                退出账号
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* 主内容 - 移动端全屏 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 pb-20 sm:pb-8">
        {children}
      </main>

      {/* 底部导航栏 - 仅移动端显示 */}
      <BottomNav />
    </div>
  )
}
