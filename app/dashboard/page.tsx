'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/stores/authStore'
import { useWardrobes } from '@/lib/hooks/useWardrobesQuery'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import PullToRefresh from '@/components/ui/PullToRefresh'

export default function DashboardPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { data: wardrobes = [], isLoading, refetch } = useWardrobes(user?.id)

  const handleRefresh = async () => {
    await refetch()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--primary)]"></div>
      </div>
    )
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="space-y-12">
        {/* 欢迎区域 - Editorial Hero */}
        <div className="gradient-mesh rounded-[var(--radius-2xl)] p-10 md:p-16 relative overflow-hidden">
          {/* 装饰性元素 */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-40" />
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-[var(--accent-light)] rounded-full blur-3xl opacity-20" />
          
          <div className="relative z-10 space-y-8">
            <div className="space-y-4">
              <p className="text-xs tracking-[0.3em] uppercase text-[var(--accent-dark)] font-medium animate-fade-in">
                YOUR WARDROBE
              </p>
              <h1 className="text-display text-5xl md:text-7xl text-[var(--gray-900)] leading-tight animate-fade-in stagger-1">
                Welcome Back
              </h1>
              <div className="h-px w-24 bg-gradient-to-r from-[var(--accent)] to-transparent animate-fade-in stagger-2" />
              <p className="text-editorial text-xl md:text-2xl text-[var(--gray-700)] max-w-2xl leading-relaxed animate-fade-in stagger-3">
                开始今天的风格探索，
                <br />
                创造属于你的完美搭配
              </p>
            </div>
            
            <div className="flex flex-wrap gap-4 animate-fade-in stagger-4">
              <Button
                variant="primary"
                size="lg"
                onClick={() => router.push('/dashboard/wardrobes/new')}
              >
                创建新衣橱
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => router.push('/dashboard/outfits/new')}
              >
                创建搭配
              </Button>
            </div>
          </div>
        </div>

        {/* 衣橱列表 - Editorial Grid */}
        <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs tracking-[0.2em] uppercase text-[var(--accent-dark)] font-medium mb-2">
              COLLECTION
            </p>
            <h2 className="text-display text-3xl md:text-4xl text-[var(--gray-900)]">我的衣橱</h2>
          </div>
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard/wardrobes')}
            className="group"
          >
            <span className="flex items-center gap-2">
              查看全部
              <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
            </span>
          </Button>
        </div>

        {wardrobes.length === 0 ? (
          <Card className="text-center py-16 border-dashed">
            <div className="space-y-6">
              <div className="w-16 h-16 bg-[var(--accent)]/10 rounded-full flex items-center justify-center mx-auto">
                <span className="text-3xl">👔</span>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-medium text-[var(--gray-900)]">开始你的第一个衣橱</h3>
                <p className="text-editorial text-[var(--gray-600)]">创建衣橱来整理你的服饰</p>
              </div>
              <Button
                variant="primary"
                onClick={() => router.push('/dashboard/wardrobes/new')}
              >
                创建第一个衣橱
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {wardrobes.slice(0, 6).map((wardrobe, index) => (
              <Link
                key={wardrobe.id}
                href={`/dashboard/wardrobes/${wardrobe.id}`}
                className={`animate-fade-in stagger-${Math.min(index + 1, 5)}`}
              >
                <Card hover className="h-full overflow-hidden group">
                  <div className="aspect-[4/3] bg-gradient-to-br from-[var(--gray-100)] to-[var(--gray-200)] rounded-[var(--radius-lg)] mb-5 flex items-center justify-center overflow-hidden relative">
                    {wardrobe.avatar ? (
                      <>
                        <img
                          src={wardrobe.avatar}
                          alt={wardrobe.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      </>
                    ) : (
                      <div className="text-5xl group-hover:scale-110 transition-transform duration-500">👔</div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-medium text-[var(--gray-900)] group-hover:text-[var(--accent-dark)] transition-colors duration-300">
                      {wardrobe.name}
                    </h3>
                    <div className="h-px w-12 bg-[var(--gray-300)] group-hover:w-20 group-hover:bg-[var(--accent)] transition-all duration-500" />
                    <p className="text-sm text-[var(--gray-600)] text-editorial">
                      点击探索
                    </p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
        </div>
      </div>
    </PullToRefresh>
  )
}
