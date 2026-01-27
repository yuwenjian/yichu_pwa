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
        <Card className="max-w-lg w-full p-8">
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-[var(--accent)]/10 rounded-full flex items-center justify-center">
                <span className="text-5xl">⚙️</span>
              </div>
            </div>
            
            <div className="text-center space-y-3">
              <p className="text-xs tracking-[0.3em] uppercase text-[var(--accent-dark)] font-medium">
                CONFIGURATION REQUIRED
              </p>
              <h1 className="text-display text-4xl text-[var(--gray-900)]">
                环境配置
              </h1>
              <p className="text-editorial text-lg text-[var(--gray-600)]">
                请先配置 Supabase 环境变量
              </p>
            </div>
            
            <div className="divider-elegant my-6" />
            
            <div className="bg-[var(--surface)] border border-[var(--gray-200)] p-6 rounded-[var(--radius-xl)] space-y-4">
              <p className="text-sm font-medium text-[var(--gray-900)] tracking-wide">配置步骤</p>
              <ol className="space-y-3 text-sm text-[var(--gray-600)]">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-[var(--accent)]/10 rounded-full flex items-center justify-center text-xs font-medium text-[var(--accent-dark)]">1</span>
                  <span>复制 <code className="px-2 py-0.5 bg-[var(--card-bg)] border border-[var(--gray-200)] rounded text-xs">.env.example</code> 为 <code className="px-2 py-0.5 bg-[var(--card-bg)] border border-[var(--gray-200)] rounded text-xs">.env.local</code></span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-[var(--accent)]/10 rounded-full flex items-center justify-center text-xs font-medium text-[var(--accent-dark)]">2</span>
                  <span>填写 Supabase 配置信息</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-[var(--accent)]/10 rounded-full flex items-center justify-center text-xs font-medium text-[var(--accent-dark)]">3</span>
                  <span>重启开发服务器</span>
                </li>
              </ol>
            </div>
            
            <p className="text-xs text-[var(--gray-500)] text-center">
              详细说明请查看 <code className="px-2 py-0.5 bg-[var(--gray-100)] rounded">SUPABASE_SETUP.md</code>
            </p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen gradient-mesh relative">
      {/* 装饰性元素 */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-40" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
        <div className="space-y-16">
          {/* 主标题区域 */}
          <div className="space-y-8 animate-reveal-in">
            <div className="space-y-4">
              <p className="text-sm tracking-[0.3em] uppercase text-[var(--accent-dark)] font-medium stagger-1 animate-fade-in">
                WARDROBE CURATION SYSTEM
              </p>
              <h1 className="text-display text-6xl sm:text-7xl md:text-8xl lg:text-9xl text-[var(--gray-900)] leading-[0.95] stagger-2 animate-fade-in">
                Your Style,
                <br />
                <span className="italic text-[var(--accent-dark)]">Elevated</span>
              </h1>
            </div>
            
            <div className="h-px w-32 bg-gradient-to-r from-[var(--accent)] to-transparent stagger-3 animate-fade-in" />
            
            <p className="text-editorial text-xl sm:text-2xl md:text-3xl text-[var(--gray-700)] max-w-3xl leading-relaxed stagger-4 animate-fade-in">
              精心策划你的衣橱，发现每件服饰的无限可能。
              <br />
              让每一天的穿搭，都成为一场优雅的表达。
            </p>
          </div>
          
          {/* CTA 按钮 */}
          <div className="flex flex-col sm:flex-row gap-6 items-start stagger-5 animate-fade-in">
            <Link href="/login">
              <Button variant="primary" size="lg" className="min-w-[200px]">
                开始探索
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="outline" size="lg" className="min-w-[200px]">
                创建账户
              </Button>
            </Link>
          </div>
          
          {/* 特色说明 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 pt-16 stagger-5 animate-fade-in">
            {[
              {
                number: '01',
                title: '智能分类',
                description: '按季节、场合、颜色自动整理你的衣橱'
              },
              {
                number: '02',
                title: '搭配灵感',
                description: '发现服饰之间的完美组合，释放无限可能'
              },
              {
                number: '03',
                title: '数据洞察',
                description: '了解你的穿衣习惯，优化你的衣橱投资'
              }
            ].map((feature, index) => (
              <div key={index} className="space-y-3 group">
                <div className="text-sm font-medium text-[var(--accent)] tracking-wider">
                  {feature.number}
                </div>
                <h3 className="text-2xl font-medium text-[var(--gray-900)] group-hover:text-[var(--accent-dark)] transition-colors duration-500">
                  {feature.title}
                </h3>
                <div className="h-px w-12 bg-[var(--gray-300)] group-hover:w-24 group-hover:bg-[var(--accent)] transition-all duration-500" />
                <p className="text-[var(--gray-600)] text-editorial leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* 底部装饰 */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[var(--background)] to-transparent pointer-events-none" />
    </div>
  )
}
