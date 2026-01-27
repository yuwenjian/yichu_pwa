'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/stores/authStore'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'

export default function LoginPage() {
  const router = useRouter()
  const { user, signIn, checkUser } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    checkUser()
  }, [checkUser])

  useEffect(() => {
    if (user) {
      router.push('/dashboard')
    }
  }, [user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    const { error } = await signIn(email, password)

    if (error) {
      setError(error.message || '登录失败，请检查邮箱和密码')
    } else {
      router.push('/dashboard')
    }

    setIsLoading(false)
  }

  return (
    <div className="min-h-screen gradient-mesh flex items-center justify-center p-4 relative overflow-hidden">
      {/* 装饰性背景元素 */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-64 h-64 bg-[var(--accent-light)] rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[var(--accent)] rounded-full blur-3xl opacity-20" />
      </div>
      
      <div className="w-full max-w-lg relative z-10">
        <div className="animate-reveal-in">
          {/* 顶部装饰线 */}
          <div className="h-px w-24 bg-gradient-to-r from-[var(--accent)] to-transparent mb-8 mx-auto" />
          
          <Card variant="elevated" className="p-10 sm:p-12 backdrop-blur-sm">
            {/* Logo/标题区域 */}
            <div className="text-center mb-10">
              <p className="text-xs tracking-[0.3em] uppercase text-[var(--accent-dark)] font-medium mb-4">
                WELCOME BACK
              </p>
              <h1 className="text-display text-5xl sm:text-6xl text-[var(--gray-900)] mb-3">
                Sign In
              </h1>
              <p className="text-editorial text-lg text-[var(--gray-600)]">
                继续你的风格之旅
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 bg-[var(--error)]/5 border-l-2 border-[var(--error)] rounded-[var(--radius-md)] text-sm text-[var(--error)] backdrop-blur-sm">
                  <div className="flex items-start gap-2">
                    <span className="inline-block w-1 h-1 rounded-full bg-[var(--error)] mt-2" />
                    <span>{error}</span>
                  </div>
                </div>
              )}

              <Input
                label="邮箱地址"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                autoComplete="email"
              />

              <Input
                label="密码"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="输入密码"
                required
                autoComplete="current-password"
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full mt-8"
                isLoading={isLoading}
              >
                登录账户
              </Button>
            </form>

            {/* 分隔线 */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--gray-200)]" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-[var(--card-bg)] text-[var(--gray-500)]">或</span>
              </div>
            </div>

            <div className="text-center text-sm text-[var(--gray-600)]">
              还没有账户？{' '}
              <Link
                href="/register"
                className="text-[var(--accent-dark)] hover:text-[var(--accent)] font-medium transition-colors duration-300 underline decoration-[var(--accent-light)] underline-offset-2 hover:decoration-[var(--accent)]"
              >
                创建新账户
              </Link>
            </div>
          </Card>
          
          {/* 底部装饰线 */}
          <div className="h-px w-24 bg-gradient-to-l from-[var(--accent)] to-transparent mt-8 mx-auto" />
        </div>
      </div>
    </div>
  )
}
