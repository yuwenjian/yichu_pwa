'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { isSupabaseConfigured } from '@/lib/supabase'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

export default function Home() {
  const router = useRouter()
  const { user, checkUser } = useAuthStore()

  useEffect(() => {
    if (isSupabaseConfigured()) {
      checkUser()
    }
  }, [checkUser])

  useEffect(() => {
    if (isSupabaseConfigured() && user) {
      router.push('/dashboard')
    }
  }, [user, router])

  // 如果环境变量未配置，显示配置提示
  if (!isSupabaseConfigured()) {
    return (
      <div className="min-h-screen gradient-mesh flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <div className="text-center space-y-4">
            <div className="text-4xl mb-4">⚙️</div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>
              需要配置环境变量
            </h1>
            <p className="text-[var(--gray-600)]">
              请先配置 Supabase 环境变量才能使用应用
            </p>
            <div className="text-left bg-[var(--gray-100)] p-4 rounded-lg mt-4">
              <p className="text-sm font-medium mb-2">配置步骤：</p>
              <ol className="text-sm text-[var(--gray-600)] space-y-1 list-decimal list-inside">
                <li>复制 <code className="bg-white px-1 rounded">.env.example</code> 为 <code className="bg-white px-1 rounded">.env.local</code></li>
                <li>填写 Supabase 配置信息</li>
                <li>重启开发服务器</li>
              </ol>
            </div>
            <p className="text-xs text-[var(--gray-500)] mt-4">
              详细说明请查看 <code className="bg-[var(--gray-100)] px-1 rounded">SUPABASE_SETUP.md</code>
            </p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen gradient-mesh">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center space-y-8 animate-fade-in">
          <h1 className="text-5xl md:text-7xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>
            个人衣橱管理系统
          </h1>
          <p className="text-xl md:text-2xl text-[var(--gray-600)] max-w-2xl mx-auto">
            优雅地管理你的衣物，创建完美搭配，让每一天都充满风格
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
            <Link href="/login">
              <Button variant="primary" size="lg">
                开始使用
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="outline" size="lg">
                免费注册
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
