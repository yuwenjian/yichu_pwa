'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/stores/authStore'
import { useWardrobes } from '@/lib/hooks/useWardrobesQuery'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

export default function DashboardPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { data: wardrobes = [], isLoading } = useWardrobes(user?.id)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--primary)]"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* 欢迎区域 */}
      <div className="gradient-mesh rounded-2xl p-8 md:p-12 relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-[var(--gray-900)]" style={{ fontFamily: 'Playfair Display, serif' }}>
            欢迎回来
          </h1>
          <p className="text-lg text-[var(--gray-700)] mb-6 font-medium">
            管理你的衣橱，创建完美搭配
          </p>
          <div className="flex flex-wrap gap-4">
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

      {/* 衣橱列表 */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-[var(--gray-900)]">我的衣橱</h2>
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard/wardrobes')}
          >
            查看全部 →
          </Button>
        </div>

        {wardrobes.length === 0 ? (
          <Card className="text-center py-12">
            <p className="text-[var(--gray-700)] mb-4 font-medium">还没有创建衣橱</p>
            <Button
              variant="primary"
              onClick={() => router.push('/dashboard/wardrobes/new')}
            >
              创建第一个衣橱
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wardrobes.slice(0, 6).map((wardrobe) => (
              <Link
                key={wardrobe.id}
                href={`/dashboard/wardrobes/${wardrobe.id}`}
              >
                <Card hover className="h-full">
                  <div className="aspect-video bg-[var(--gray-100)] rounded-lg mb-4 flex items-center justify-center">
                    {wardrobe.avatar ? (
                      <img
                        src={wardrobe.avatar}
                        alt={wardrobe.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="text-4xl">👔</div>
                    )}
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-[#1a1a1a]">
                    {wardrobe.name}
                  </h3>
                  <p className="text-sm font-medium text-[#2a2825]">
                    点击查看详情
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
