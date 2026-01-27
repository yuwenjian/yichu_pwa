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
    <div className="min-h-screen gradient-mesh flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        <Card variant="elevated" className="p-8">
          {/* Logo/标题区域 */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2 text-[var(--gray-900)]" style={{ fontFamily: 'Playfair Display, serif' }}>
              衣橱管理
            </h1>
            <p className="text-[var(--gray-600)] dark:text-[var(--gray-400)]">创建你的账户</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-[var(--error)]/10 border border-[var(--error)]/20 rounded-lg text-sm text-[var(--error)]">
                {error}
              </div>
            )}
            {successMessage && (
              <div className="p-3 bg-[var(--success)]/10 border border-[var(--success)]/20 rounded-lg text-sm text-[var(--success)]">
                {successMessage}
              </div>
            )}

            <Input
              label="姓名"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="你的姓名"
              autoComplete="name"
            />

            <Input
              label="邮箱"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              autoComplete="email"
              helperText="请输入有效的邮箱地址，例如：user@example.com"
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
              className="w-full"
              isLoading={isLoading}
            >
              注册
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-[var(--gray-600)] dark:text-[var(--gray-400)]">
            已有账户？{' '}
            <Link
              href="/login"
              className="text-[var(--primary)] hover:text-[var(--primary-dark)] font-medium transition-colors"
            >
              立即登录
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}
