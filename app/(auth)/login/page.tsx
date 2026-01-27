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
    <div className="min-h-screen gradient-mesh flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        <Card variant="elevated" className="p-8">
          {/* Logo/标题区域 */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2 text-[var(--gray-900)]" style={{ fontFamily: 'Playfair Display, serif' }}>
              衣橱管理
            </h1>
            <p className="text-[var(--gray-600)] dark:text-[var(--gray-400)]">登录你的账户</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-[var(--error)]/10 border border-[var(--error)]/20 rounded-lg text-sm text-[var(--error)]">
                {error}
              </div>
            )}

            <Input
              label="邮箱"
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
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={isLoading}
            >
              登录
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-[var(--gray-600)] dark:text-[var(--gray-400)]">
            还没有账户？{' '}
            <Link
              href="/register"
              className="text-[var(--primary)] hover:text-[var(--primary-dark)] font-medium transition-colors"
            >
              立即注册
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}
