'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/stores/authStore'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'

export default function RegisterPage() {
  const router = useRouter()
  const { user, signUp, checkUser } = useAuthStore()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    checkUser()
  }, [checkUser])

  useEffect(() => {
    if (user) {
      router.push('/dashboard')
    }
  }, [user, router])

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // 验证邮箱格式
    if (!email.trim()) {
      setError('请输入邮箱地址')
      return
    }

    if (!validateEmail(email)) {
      setError('请输入有效的邮箱地址')
      return
    }

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }

    if (password.length < 6) {
      setError('密码长度至少为 6 位')
      return
    }

    setIsLoading(true)
    setError('')
    setSuccessMessage('')

    const result = await signUp(email.trim(), password, name.trim())

    if (result.error) {
      // 处理 Supabase 错误信息，提供更友好的提示
      let errorMessage = result.error.message || '注册失败，请稍后重试'
      
      // 翻译常见的错误信息
      if (errorMessage.includes('invalid') || errorMessage.includes('Invalid')) {
        errorMessage = '邮箱地址格式不正确，请检查后重试'
      } else if (errorMessage.includes('already registered') || errorMessage.includes('already exists') || errorMessage.includes('User already registered')) {
        errorMessage = '该邮箱已被注册，请直接登录'
      } else if (errorMessage.includes('password')) {
        errorMessage = '密码不符合要求，请使用至少 6 位字符'
      } else if (errorMessage.includes('email')) {
        errorMessage = '邮箱地址无效，请检查后重试'
      }
      
      setError(errorMessage)
    } else if ((result as any).needsVerification) {
      // 需要邮箱验证
      setSuccessMessage('注册成功！请检查您的邮箱并点击验证链接以完成注册。')
    } else {
      // 注册成功，直接跳转
      router.push('/dashboard')
    }

    setIsLoading(false)
  }

  return (
    <div className="min-h-screen gradient-mesh flex items-center justify-center p-4 relative overflow-hidden">
      {/* 装饰性背景元素 */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 right-10 w-64 h-64 bg-[var(--accent-light)] rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-[var(--accent)] rounded-full blur-3xl opacity-20" />
      </div>
      
      <div className="w-full max-w-lg relative z-10">
        <div className="animate-reveal-in">
          {/* 顶部装饰线 */}
          <div className="h-px w-24 bg-gradient-to-r from-[var(--accent)] to-transparent mb-8 mx-auto" />
          
          <Card variant="elevated" className="p-10 sm:p-12 backdrop-blur-sm">
            {/* Logo/标题区域 */}
            <div className="text-center mb-10">
              <p className="text-xs tracking-[0.3em] uppercase text-[var(--accent-dark)] font-medium mb-4">
                JOIN US
              </p>
              <h1 className="text-display text-5xl sm:text-6xl text-[var(--gray-900)] mb-3">
                Create
              </h1>
              <p className="text-editorial text-lg text-[var(--gray-600)]">
                开启你的风格之旅
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
            {successMessage && (
              <div className="p-4 bg-[var(--success)]/5 border-l-2 border-[var(--success)] rounded-[var(--radius-md)] text-sm text-[var(--success)] backdrop-blur-sm">
                <div className="flex items-start gap-2">
                  <span className="inline-block w-1 h-1 rounded-full bg-[var(--success)] mt-2" />
                  <span>{successMessage}</span>
                </div>
              </div>
            )}

            <Input
              label="姓名"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="输入你的姓名"
              autoComplete="name"
            />

            <Input
              label="邮箱地址"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              autoComplete="email"
              helperText="我们会向此邮箱发送验证信息"
            />

            <Input
              label="密码"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="至少 6 位字符"
              required
              autoComplete="new-password"
            />

            <Input
              label="确认密码"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="再次输入密码"
              required
              autoComplete="new-password"
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-8"
              isLoading={isLoading}
            >
              创建账户
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
            已有账户？{' '}
            <Link
              href="/login"
              className="text-[var(--accent-dark)] hover:text-[var(--accent)] font-medium transition-colors duration-300 underline decoration-[var(--accent-light)] underline-offset-2 hover:decoration-[var(--accent)]"
            >
              立即登录
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
