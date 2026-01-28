'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { useStatistics } from '@/lib/hooks/useStatisticsQuery'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import PullToRefresh from '@/components/ui/PullToRefresh'
import WearTrendChart from '@/components/charts/WearTrendChart'
import BrandChart from '@/components/charts/BrandChart'
import PriceUsageChart from '@/components/charts/PriceUsageChart'
import CategoryPieChart from '@/components/charts/CategoryPieChart'

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        <div className="md:static sticky top-0 z-30 bg-[var(--background)] md:bg-transparent pb-4 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 border-b md:border-b-0 border-[var(--gray-200)]">
          <div className="space-y-3 md:space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] md:text-xs tracking-[0.2em] uppercase text-[var(--gray-500)] mb-2">ANALYTICS</p>
                <h1 className="text-display text-3xl md:text-5xl text-[var(--gray-900)]">
                  数据统计
                </h1>
              </div>
              {wardrobes.length > 0 && (
                <select
                  value={selectedWardrobeId}
                  onChange={(e) => setSelectedWardrobeId(e.target.value)}
                  className="px-3 py-2 md:px-4 md:py-3 border border-[var(--gray-300)] rounded-[var(--radius-lg)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)] text-[var(--gray-900)] bg-[var(--input-bg)] shadow-[var(--shadow-subtle)] transition-all text-sm md:text-base"
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
            <div className="h-px w-20 md:w-32 bg-gradient-to-r from-[var(--accent)] to-transparent" />
          </div>
        </div>

      {/* 概览卡片 - Editorial风格 */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-5 gap-5">
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
        <Card className="p-6 text-center">
          <div className="text-display text-4xl mb-2 text-[var(--success)]">{statistics.utilizationRate.toFixed(0)}%</div>
          <div className="text-sm text-[var(--gray-600)] font-medium tracking-wide">利用率</div>
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

      {/* 最常穿衣物 Top 10 */}
      {statistics.topClothings.length > 0 && (
        <Card className="p-6">
          <h2 className="text-2xl font-medium mb-5 text-[var(--gray-900)]">
            最常穿衣物 Top 10
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {statistics.topClothings.map((item, index) => (
              <div
                key={item.id}
                className={`cursor-pointer group animate-fade-in stagger-${Math.min(index % 5 + 1, 5)}`}
                onClick={() => router.push(`/dashboard/wardrobes/${selectedWardrobeId}/clothings/${item.id}`)}
              >
                <div className="aspect-square rounded-[var(--radius-lg)] overflow-hidden bg-[var(--gray-100)] shadow-[var(--shadow-subtle)] hover:shadow-[var(--shadow-soft)] transition-all group-hover:scale-105 relative">
                  <img
                    src={item.image_url}
                    alt={item.name || '衣物'}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-[var(--accent)] text-white text-xs px-2 py-1 rounded-[var(--radius-full)] font-medium">
                    {item.use_count}次
                  </div>
                </div>
                <p className="mt-2 text-sm text-[var(--gray-900)] text-center line-clamp-1 group-hover:text-[var(--accent-dark)] transition-colors">
                  {item.name || item.category.name}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 闲置衣物提醒 */}
      {statistics.idleClothings.length > 0 && (
        <Card className="p-6 border-2 border-[var(--warning)]/30 bg-[var(--warning)]/5">
          <div className="flex items-start gap-3 mb-5">
            <div className="w-8 h-8 rounded-full bg-[var(--warning)]/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-[var(--warning)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-medium mb-2 text-[var(--gray-900)]">
                闲置衣物提醒
              </h2>
              <p className="text-sm text-[var(--gray-600)] mb-4">
                这些适合当前季节的衣物已超过30天未穿，考虑搭配或整理
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {statistics.idleClothings.map((item, index) => (
              <div
                key={item.id}
                className={`cursor-pointer group animate-fade-in stagger-${Math.min(index % 5 + 1, 5)}`}
                onClick={() => router.push(`/dashboard/wardrobes/${selectedWardrobeId}/clothings/${item.id}`)}
              >
                <div className="aspect-square rounded-[var(--radius-lg)] overflow-hidden bg-[var(--gray-100)] shadow-[var(--shadow-subtle)] hover:shadow-[var(--shadow-soft)] transition-all group-hover:scale-105 relative">
                  <img
                    src={item.image_url}
                    alt={item.name || '衣物'}
                    className="w-full h-full object-cover opacity-75"
                  />
                  <div className="absolute top-2 right-2 bg-[var(--warning)] text-white text-xs px-2 py-1 rounded-[var(--radius-full)] font-medium">
                    {item.days_since_last_wear > 365 ? '从未穿' : `${item.days_since_last_wear}天`}
                  </div>
                </div>
                <p className="mt-2 text-sm text-[var(--gray-900)] text-center line-clamp-1 group-hover:text-[var(--accent-dark)] transition-colors">
                  {item.name || item.category.name}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 穿搭频率趋势图 */}
      {statistics.wearTrends.length > 0 && (
        <Card className="p-6">
          <h2 className="text-2xl font-medium mb-5 text-[var(--gray-900)]">
            穿搭频率趋势（最近30天）
          </h2>
          <WearTrendChart data={statistics.wearTrends} />
        </Card>
      )}

      {/* 可视化图表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 分类分布饼图 */}
        {statistics.byCategory.length > 0 && (
          <Card className="p-6">
            <h2 className="text-2xl font-medium mb-5 text-[var(--gray-900)]">
              分类分布
            </h2>
            <CategoryPieChart data={statistics.byCategory} />
          </Card>
        )}

        {/* 品牌使用频率 */}
        {statistics.brandStats.length > 0 && (
          <Card className="p-6">
            <h2 className="text-2xl font-medium mb-5 text-[var(--gray-900)]">
              品牌使用频率
            </h2>
            <BrandChart data={statistics.brandStats} />
          </Card>
        )}
      </div>

      {/* 价格与使用次数关系 */}
      {statistics.priceUsageData.length > 0 && (
        <Card className="p-6">
          <h2 className="text-2xl font-medium mb-5 text-[var(--gray-900)]">
            价格与穿搭次数关系
          </h2>
          <p className="text-sm text-[var(--gray-600)] mb-4">
            分析衣物价格与实际穿搭频率的关系，帮助优化购买决策
          </p>
          <PriceUsageChart data={statistics.priceUsageData} />
        </Card>
      )}

      {/* 数据洞察 */}
      <Card className="p-6 bg-gradient-to-br from-[var(--accent)]/10 to-transparent border border-[var(--accent)]/20">
        <h2 className="text-2xl font-medium mb-4 text-[var(--gray-900)]">
          数据洞察
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-white/50 rounded-[var(--radius-lg)]">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-[var(--success)]/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-[var(--success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-[var(--gray-600)]">衣物利用率</p>
                <p className="text-2xl font-bold text-[var(--success)]">
                  {statistics.utilizationRate.toFixed(1)}%
                </p>
              </div>
            </div>
            <p className="text-xs text-[var(--gray-600)]">
              {statistics.utilizationRate >= 70
                ? '利用率很高！继续保持'
                : statistics.utilizationRate >= 50
                ? '利用率还不错，可以进一步优化'
                : '利用率偏低，建议多穿搭闲置衣物'}
            </p>
          </div>

          <div className="p-4 bg-white/50 rounded-[var(--radius-lg)]">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-[var(--primary)]/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-[var(--gray-600)]">平均单价</p>
                <p className="text-2xl font-bold text-[var(--primary)]">
                  ¥{statistics.avgPrice.toFixed(0)}
                </p>
              </div>
            </div>
            <p className="text-xs text-[var(--gray-600)]">
              建议关注性价比，选择适合的价位
            </p>
          </div>
        </div>
      </Card>
      </div>
    </PullToRefresh>
  )
}
