'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { useStatistics } from '@/lib/hooks/useStatisticsQuery'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import PullToRefresh from '@/components/ui/PullToRefresh'

export default function StatisticsPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [selectedWardrobeId, setSelectedWardrobeId] = useState<string>('')
  const [wardrobes, setWardrobes] = useState<Array<{ id: string; name: string }>>([])

  const { data: statistics, isLoading, refetch } = useStatistics(selectedWardrobeId || undefined)

  const handleRefresh = async () => {
    await Promise.all([refetch(), loadWardrobes()])
  }

  useEffect(() => {
    loadWardrobes()
  }, [user])

  const loadWardrobes = async () => {
    if (!user?.id) return

    try {
      const { data } = await supabase
        .from('wardrobes')
        .select('id, name')
        .eq('user_id', user.id)
        .order('sort_order', { ascending: true })

      if (data && data.length > 0) {
        setWardrobes(data)
        setSelectedWardrobeId(data[0].id)
      }
    } catch (error) {
      console.error('Error loading wardrobes:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--primary)]"></div>
      </div>
    )
  }

  if (!statistics) {
    return (
      <Card className="text-center py-12">
        <p className="text-[var(--gray-700)] font-medium">请先创建衣橱和添加衣物</p>
      </Card>
    )
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="space-y-8">
        {/* 顶部标题 - Editorial风格 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs tracking-[0.2em] uppercase text-[var(--gray-500)] mb-2">ANALYTICS</p>
              <h1 className="text-display text-4xl md:text-5xl text-[var(--gray-900)]">
                数据统计
              </h1>
            </div>
            {wardrobes.length > 0 && (
              <select
                value={selectedWardrobeId}
                onChange={(e) => setSelectedWardrobeId(e.target.value)}
                className="px-4 py-3 border border-[var(--gray-300)] rounded-[var(--radius-lg)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)] text-[var(--gray-900)] bg-[var(--input-bg)] shadow-[var(--shadow-subtle)] transition-all"
                style={{ transition: 'all var(--transition-smooth)' }}
              >
                {wardrobes.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="h-px w-32 bg-gradient-to-r from-[var(--accent)] to-transparent" />
        </div>

      {/* 概览卡片 - Editorial风格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="p-6 text-center">
          <div className="text-display text-4xl mb-2 text-[var(--accent-dark)]">{statistics.totalClothings}</div>
          <div className="text-sm text-[var(--gray-600)] font-medium tracking-wide">总衣物数</div>
        </Card>
        <Card className="p-6 text-center">
          <div className="text-display text-4xl mb-2 text-[var(--accent-dark)]">{statistics.totalOutfits}</div>
          <div className="text-sm text-[var(--gray-600)] font-medium tracking-wide">总搭配数</div>
        </Card>
        <Card className="p-6 text-center">
          <div className="text-display text-4xl mb-2 text-[var(--primary)]">¥{statistics.totalValue.toLocaleString()}</div>
          <div className="text-sm text-[var(--gray-600)] font-medium tracking-wide">总价值</div>
        </Card>
        <Card className="p-6 text-center">
          <div className="text-display text-4xl mb-2 text-[var(--primary)]">¥{statistics.avgPrice.toFixed(0)}</div>
          <div className="text-sm text-[var(--gray-600)] font-medium tracking-wide">平均价格</div>
        </Card>
      </div>

      {/* 分类统计 */}
      {statistics.byCategory.length > 0 && (
        <Card className="p-6">
          <h2 className="text-2xl font-medium mb-5 text-[var(--gray-900)]">按分类统计</h2>
          <div className="space-y-3">
            {statistics.byCategory.map((item, index) => (
              <div key={item.categoryName} className={`flex items-center justify-between py-3 border-b border-[var(--gray-200)] last:border-0 animate-fade-in stagger-${Math.min(index % 5 + 1, 5)}`}>
                <span className="text-[var(--gray-900)] font-medium">{item.categoryName}</span>
                <span className="font-semibold text-[var(--accent-dark)]">{item.count} 件</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 状态和季节统计 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-2xl font-medium mb-5 text-[var(--gray-900)]">按状态统计</h2>
          <div className="space-y-3">
            {Object.entries(statistics.byStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between py-3 border-b border-[var(--gray-200)] last:border-0">
                <span className="text-[var(--gray-900)] font-medium">
                  {status === 'normal' ? '常穿' :
                   status === 'damaged' ? '破损' :
                   status === 'idle' ? '闲置' : '丢弃'}
                </span>
                <span className="font-semibold text-[var(--accent-dark)]">{count} 件</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-2xl font-medium mb-5 text-[var(--gray-900)]">按季节统计</h2>
          <div className="space-y-3">
            {Object.entries(statistics.bySeason).map(([season, count]) => (
              <div key={season} className="flex items-center justify-between py-3 border-b border-[var(--gray-200)] last:border-0">
                <span className="text-[var(--gray-900)] font-medium">{season}</span>
                <span className="font-semibold text-[var(--accent-dark)]">{count} 件</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
      </div>
    </PullToRefresh>
  )
}
