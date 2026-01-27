'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { useOutfitAnalysis } from '@/lib/hooks/useOutfitAnalysis'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import PullToRefresh from '@/components/ui/PullToRefresh'

export default function AnalysisPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [selectedWardrobeId, setSelectedWardrobeId] = useState<string>('')
  const [wardrobes, setWardrobes] = useState<Array<{ id: string; name: string }>>([])

  const { data: analysisData, isLoading, refetch } = useOutfitAnalysis(selectedWardrobeId || undefined)

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

  const handleRefresh = async () => {
    await Promise.all([refetch(), loadWardrobes()])
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
      <div className="space-y-8">
        {/* 顶部标题 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs tracking-[0.2em] uppercase text-[var(--gray-500)] mb-2">ANALYSIS</p>
              <h1 className="text-display text-4xl md:text-5xl text-[var(--gray-900)]">
                搭配关联分析
              </h1>
            </div>
            {wardrobes.length > 0 && (
              <select
                value={selectedWardrobeId}
                onChange={(e) => setSelectedWardrobeId(e.target.value)}
                className="px-4 py-3 border border-[var(--gray-300)] rounded-[var(--radius-lg)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)] text-[var(--gray-900)] bg-[var(--input-bg)] shadow-[var(--shadow-subtle)] transition-all"
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
          <p className="text-[var(--gray-600)]">
            分析衣物在搭配中的关联关系，发现最佳搭配组合
          </p>
        </div>

        {/* 空状态 */}
        {(!analysisData || analysisData.length === 0) && (
          <Card className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--gray-200)] flex items-center justify-center">
              <svg className="w-8 h-8 text-[var(--gray-400)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-[var(--gray-600)] mb-2">还没有足够的搭配数据</p>
            <p className="text-sm text-[var(--gray-500)] mb-4">创建更多搭配后，系统会自动分析衣物关联关系</p>
            <Button variant="primary" onClick={() => router.push('/dashboard/outfits/new')}>
              创建搭配
            </Button>
          </Card>
        )}

        {/* 关联分析列表 */}
        {analysisData && analysisData.length > 0 && (
          <div className="space-y-6">
            {analysisData.map((item, index) => (
              <Card key={item.clothingId} className={`p-6 animate-fade-in stagger-${Math.min(index % 5 + 1, 5)}`}>
                <div className="flex items-start gap-6">
                  {/* 主衣物 */}
                  <div className="flex-shrink-0">
                    <div
                      className="w-32 h-32 rounded-[var(--radius-lg)] overflow-hidden bg-[var(--gray-100)] shadow-[var(--shadow-subtle)] cursor-pointer hover:shadow-[var(--shadow-soft)] transition-all"
                      onClick={() => router.push(`/dashboard/wardrobes/${selectedWardrobeId}/clothings/${item.clothingId}`)}
                    >
                      <img
                        src={item.clothingImage}
                        alt={item.clothingName || '衣物'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="mt-2 text-center">
                      <p className="text-sm font-medium text-[var(--gray-900)] line-clamp-1">
                        {item.clothingName || item.categoryName}
                      </p>
                      <p className="text-xs text-[var(--gray-500)]">
                        出现 {item.frequency} 次
                      </p>
                    </div>
                  </div>

                  {/* 关联衣物 */}
                  <div className="flex-1">
                    <h3 className="text-lg font-medium mb-3 text-[var(--gray-900)]">
                      常见搭配组合
                    </h3>
                    {item.relatedClothings.length > 0 ? (
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                        {item.relatedClothings.map((related) => (
                          <div
                            key={related.id}
                            className="cursor-pointer group"
                            onClick={() => router.push(`/dashboard/wardrobes/${selectedWardrobeId}/clothings/${related.id}`)}
                          >
                            <div className="aspect-square rounded-[var(--radius-md)] overflow-hidden bg-[var(--gray-100)] shadow-[var(--shadow-subtle)] hover:shadow-[var(--shadow-soft)] transition-all group-hover:scale-105 relative">
                              <img
                                src={related.image}
                                alt={related.name || '衣物'}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute top-1 right-1 bg-[var(--accent)] text-white text-xs px-2 py-0.5 rounded-[var(--radius-full)] font-medium">
                                {related.count}次
                              </div>
                            </div>
                            <p className="mt-1 text-xs text-[var(--gray-900)] text-center line-clamp-1">
                              {related.name || '未命名'}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-[var(--gray-500)]">暂无关联搭配</p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* 洞察建议 */}
        {analysisData && analysisData.length > 0 && (
          <Card className="p-6 bg-gradient-to-br from-[var(--accent)]/10 to-transparent border border-[var(--accent)]/20">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-[var(--accent)]/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-medium mb-3 text-[var(--gray-900)]">搭配建议</h3>
                <ul className="space-y-2 text-sm text-[var(--gray-700)]">
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--accent)] mt-1">•</span>
                    <span>经常一起穿的衣物可以保存为搭配模板，提高穿搭效率</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--accent)] mt-1">•</span>
                    <span>尝试将高频衣物与闲置衣物组合，提升衣橱利用率</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--accent)] mt-1">•</span>
                    <span>关联度高的衣物说明搭配效果好，可以作为购买参考</span>
                  </li>
                </ul>
              </div>
            </div>
          </Card>
        )}
      </div>
    </PullToRefresh>
  )
}
