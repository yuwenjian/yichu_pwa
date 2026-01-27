'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { useStatistics } from '@/lib/hooks/useStatisticsQuery'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import PullToRefresh from '@/components/ui/PullToRefresh'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

export default function ComparePage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [wardrobes, setWardrobes] = useState<Array<{ id: string; name: string }>>([])
  const [wardrobe1Id, setWardrobe1Id] = useState<string>('')
  const [wardrobe2Id, setWardrobe2Id] = useState<string>('')

  const { data: stats1, refetch: refetch1 } = useStatistics(wardrobe1Id || undefined)
  const { data: stats2, refetch: refetch2 } = useStatistics(wardrobe2Id || undefined)

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
        if (data.length >= 1) setWardrobe1Id(data[0].id)
        if (data.length >= 2) setWardrobe2Id(data[1].id)
      }
    } catch (error) {
      console.error('Error loading wardrobes:', error)
    }
  }

  const handleRefresh = async () => {
    await Promise.all([refetch1(), refetch2(), loadWardrobes()])
  }

  // 对比数据
  const comparisonData = stats1 && stats2 ? [
    {
      name: '衣物数量',
      [wardrobes.find(w => w.id === wardrobe1Id)?.name || '衣橱1']: stats1.totalClothings,
      [wardrobes.find(w => w.id === wardrobe2Id)?.name || '衣橱2']: stats2.totalClothings,
    },
    {
      name: '搭配数量',
      [wardrobes.find(w => w.id === wardrobe1Id)?.name || '衣橱1']: stats1.totalOutfits,
      [wardrobes.find(w => w.id === wardrobe2Id)?.name || '衣橱2']: stats2.totalOutfits,
    },
    {
      name: '利用率%',
      [wardrobes.find(w => w.id === wardrobe1Id)?.name || '衣橱1']: Math.round(stats1.utilizationRate),
      [wardrobes.find(w => w.id === wardrobe2Id)?.name || '衣橱2']: Math.round(stats2.utilizationRate),
    },
  ] : []

  const wardrobe1Name = wardrobes.find(w => w.id === wardrobe1Id)?.name || '衣橱1'
  const wardrobe2Name = wardrobes.find(w => w.id === wardrobe2Id)?.name || '衣橱2'

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="space-y-8">
        {/* 顶部标题 */}
        <div className="space-y-4">
          <div>
            <p className="text-xs tracking-[0.2em] uppercase text-[var(--gray-500)] mb-2">COMPARE</p>
            <h1 className="text-display text-4xl md:text-5xl text-[var(--gray-900)]">
              衣橱对比
            </h1>
          </div>
          <div className="h-px w-32 bg-gradient-to-r from-[var(--accent)] to-transparent" />
          <p className="text-[var(--gray-600)]">
            对比不同衣橱的数据，了解使用情况差异
          </p>
        </div>

        {/* 选择器 */}
        {wardrobes.length >= 2 ? (
          <Card className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-[var(--gray-900)] mb-2">
                  衣橱 1
                </label>
                <select
                  value={wardrobe1Id}
                  onChange={(e) => setWardrobe1Id(e.target.value)}
                  className="w-full px-4 py-3 border border-[var(--gray-300)] rounded-[var(--radius-lg)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)] text-[var(--gray-900)] bg-[var(--input-bg)] shadow-[var(--shadow-subtle)] transition-all"
                >
                  {wardrobes.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--gray-900)] mb-2">
                  衣橱 2
                </label>
                <select
                  value={wardrobe2Id}
                  onChange={(e) => setWardrobe2Id(e.target.value)}
                  className="w-full px-4 py-3 border border-[var(--gray-300)] rounded-[var(--radius-lg)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)] text-[var(--gray-900)] bg-[var(--input-bg)] shadow-[var(--shadow-subtle)] transition-all"
                >
                  {wardrobes.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--gray-200)] flex items-center justify-center">
              <svg className="w-8 h-8 text-[var(--gray-400)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-[var(--gray-600)] mb-2">需要至少2个衣橱才能对比</p>
            <p className="text-sm text-[var(--gray-500)] mb-4">创建更多衣橱来对比不同成员的衣物管理情况</p>
            <Button variant="primary" onClick={() => router.push('/dashboard/wardrobes/new')}>
              创建衣橱
            </Button>
          </Card>
        )}

        {/* 对比数据 */}
        {stats1 && stats2 && (
          <>
            {/* 概览对比 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6 border-2 border-[var(--accent)]/30">
                <h3 className="text-lg font-medium mb-4 text-[var(--accent-dark)]">
                  {wardrobe1Name}
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-[var(--gray-600)]">衣物数量</span>
                    <span className="font-semibold text-[var(--gray-900)]">{stats1.totalClothings} 件</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--gray-600)]">搭配数量</span>
                    <span className="font-semibold text-[var(--gray-900)]">{stats1.totalOutfits} 套</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--gray-600)]">总价值</span>
                    <span className="font-semibold text-[var(--primary)]">¥{stats1.totalValue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--gray-600)]">平均价格</span>
                    <span className="font-semibold text-[var(--primary)]">¥{stats1.avgPrice.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--gray-600)]">利用率</span>
                    <span className="font-semibold text-[var(--success)]">{stats1.utilizationRate.toFixed(1)}%</span>
                  </div>
                </div>
              </Card>

              <Card className="p-6 border-2 border-[var(--primary)]/30">
                <h3 className="text-lg font-medium mb-4 text-[var(--primary)]">
                  {wardrobe2Name}
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-[var(--gray-600)]">衣物数量</span>
                    <span className="font-semibold text-[var(--gray-900)]">{stats2.totalClothings} 件</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--gray-600)]">搭配数量</span>
                    <span className="font-semibold text-[var(--gray-900)]">{stats2.totalOutfits} 套</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--gray-600)]">总价值</span>
                    <span className="font-semibold text-[var(--primary)]">¥{stats2.totalValue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--gray-600)]">平均价格</span>
                    <span className="font-semibold text-[var(--primary)]">¥{stats2.avgPrice.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--gray-600)]">利用率</span>
                    <span className="font-semibold text-[var(--success)]">{stats2.utilizationRate.toFixed(1)}%</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* 对比图表 */}
            <Card className="p-6">
              <h2 className="text-2xl font-medium mb-5 text-[var(--gray-900)]">
                数据对比
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={comparisonData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-200)" />
                  <XAxis 
                    dataKey="name" 
                    stroke="var(--gray-600)"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="var(--gray-600)"
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--card-bg)',
                      border: '1px solid var(--gray-300)',
                      borderRadius: 'var(--radius-md)',
                      boxShadow: 'var(--shadow-soft)',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey={wardrobe1Name} fill="var(--accent)" radius={[8, 8, 0, 0]} />
                  <Bar dataKey={wardrobe2Name} fill="var(--primary)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* 分类对比 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-medium mb-4 text-[var(--gray-900)]">
                  {wardrobe1Name} - 分类分布
                </h3>
                <div className="space-y-2">
                  {stats1.byCategory.slice(0, 5).map((item) => (
                    <div key={item.categoryName} className="flex items-center justify-between py-2 border-b border-[var(--gray-200)] last:border-0">
                      <span className="text-sm text-[var(--gray-700)]">{item.categoryName}</span>
                      <span className="font-semibold text-[var(--accent-dark)]">{item.count} 件</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-medium mb-4 text-[var(--gray-900)]">
                  {wardrobe2Name} - 分类分布
                </h3>
                <div className="space-y-2">
                  {stats2.byCategory.slice(0, 5).map((item) => (
                    <div key={item.categoryName} className="flex items-center justify-between py-2 border-b border-[var(--gray-200)] last:border-0">
                      <span className="text-sm text-[var(--gray-700)]">{item.categoryName}</span>
                      <span className="font-semibold text-[var(--primary)]">{item.count} 件</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* 对比洞察 */}
            <Card className="p-6 bg-gradient-to-br from-[var(--accent)]/10 to-transparent border border-[var(--accent)]/20">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-[var(--accent)]/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium mb-3 text-[var(--gray-900)]">对比洞察</h3>
                  <ul className="space-y-2 text-sm text-[var(--gray-700)]">
                    {stats1.totalClothings > stats2.totalClothings ? (
                      <li className="flex items-start gap-2">
                        <span className="text-[var(--accent)] mt-1">•</span>
                        <span>{wardrobe1Name} 的衣物数量比 {wardrobe2Name} 多 {stats1.totalClothings - stats2.totalClothings} 件</span>
                      </li>
                    ) : stats1.totalClothings < stats2.totalClothings ? (
                      <li className="flex items-start gap-2">
                        <span className="text-[var(--accent)] mt-1">•</span>
                        <span>{wardrobe2Name} 的衣物数量比 {wardrobe1Name} 多 {stats2.totalClothings - stats1.totalClothings} 件</span>
                      </li>
                    ) : null}
                    
                    {stats1.utilizationRate > stats2.utilizationRate ? (
                      <li className="flex items-start gap-2">
                        <span className="text-[var(--accent)] mt-1">•</span>
                        <span>{wardrobe1Name} 的利用率更高（{stats1.utilizationRate.toFixed(1)}% vs {stats2.utilizationRate.toFixed(1)}%）</span>
                      </li>
                    ) : stats1.utilizationRate < stats2.utilizationRate ? (
                      <li className="flex items-start gap-2">
                        <span className="text-[var(--accent)] mt-1">•</span>
                        <span>{wardrobe2Name} 的利用率更高（{stats2.utilizationRate.toFixed(1)}% vs {stats1.utilizationRate.toFixed(1)}%）</span>
                      </li>
                    ) : null}

                    {stats1.avgPrice > stats2.avgPrice ? (
                      <li className="flex items-start gap-2">
                        <span className="text-[var(--accent)] mt-1">•</span>
                        <span>{wardrobe1Name} 的平均单价更高（¥{stats1.avgPrice.toFixed(0)} vs ¥{stats2.avgPrice.toFixed(0)}）</span>
                      </li>
                    ) : stats1.avgPrice < stats2.avgPrice ? (
                      <li className="flex items-start gap-2">
                        <span className="text-[var(--accent)] mt-1">•</span>
                        <span>{wardrobe2Name} 的平均单价更高（¥{stats2.avgPrice.toFixed(0)} vs ¥{stats1.avgPrice.toFixed(0)}）</span>
                      </li>
                    ) : null}
                  </ul>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>
    </PullToRefresh>
  )
}
