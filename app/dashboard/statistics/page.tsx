'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { useStatistics } from '@/lib/hooks/useStatisticsQuery'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

export default function StatisticsPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [selectedWardrobeId, setSelectedWardrobeId] = useState<string>('')
  const [wardrobes, setWardrobes] = useState<Array<{ id: string; name: string }>>([])

  const { data: statistics, isLoading } = useStatistics(selectedWardrobeId || undefined)

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
          数据统计
        </h1>
        {wardrobes.length > 0 && (
          <select
            value={selectedWardrobeId}
            onChange={(e) => setSelectedWardrobeId(e.target.value)}
            className="px-4 py-2 border border-[var(--gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-[#1a1a1a] bg-white"
          >
            {wardrobes.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* 概览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="text-2xl font-bold mb-1 text-[#1a1a1a]">{statistics.totalClothings}</div>
          <div className="text-sm text-[#5c5954] font-medium">总衣物数</div>
        </Card>
        <Card className="p-5">
          <div className="text-2xl font-bold mb-1 text-[#1a1a1a]">{statistics.totalOutfits}</div>
          <div className="text-sm text-[#5c5954] font-medium">总搭配数</div>
        </Card>
        <Card className="p-5">
          <div className="text-2xl font-bold mb-1 text-[#1a1a1a]">¥{statistics.totalValue.toLocaleString()}</div>
          <div className="text-sm text-[#5c5954] font-medium">总价值</div>
        </Card>
        <Card className="p-5">
          <div className="text-2xl font-bold mb-1 text-[#1a1a1a]">¥{statistics.avgPrice.toFixed(0)}</div>
          <div className="text-sm text-[#5c5954] font-medium">平均价格</div>
        </Card>
      </div>

      {/* 分类统计 */}
      {statistics.byCategory.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-[#1a1a1a]">按分类统计</h2>
          <div className="space-y-3">
            {statistics.byCategory.map((item) => (
              <div key={item.categoryName} className="flex items-center justify-between py-1 border-b border-gray-100 last:border-0">
                <span className="text-[#1a1a1a] font-medium">{item.categoryName}</span>
                <span className="font-semibold text-[#1a1a1a]">{item.count} 件</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 状态统计 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-[#1a1a1a]">按状态统计</h2>
          <div className="space-y-3">
            {Object.entries(statistics.byStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between py-1 border-b border-gray-100 last:border-0">
                <span className="text-[#1a1a1a] font-medium">
                  {status === 'normal' ? '常穿' :
                   status === 'damaged' ? '破损' :
                   status === 'idle' ? '闲置' : '丢弃'}
                </span>
                <span className="font-semibold text-[#1a1a1a]">{count} 件</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-[#1a1a1a]">按季节统计</h2>
          <div className="space-y-3">
            {Object.entries(statistics.bySeason).map(([season, count]) => (
              <div key={season} className="flex items-center justify-between py-1 border-b border-gray-100 last:border-0">
                <span className="text-[#1a1a1a] font-medium">{season}</span>
                <span className="font-semibold text-[#1a1a1a]">{count} 件</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
