'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { useAIRecommendations } from '@/lib/hooks/useAIRecommendations'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import PullToRefresh from '@/components/ui/PullToRefresh'

export default function RecommendationsPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [selectedWardrobeId, setSelectedWardrobeId] = useState<string>('')
  const [wardrobes, setWardrobes] = useState<Array<{ id: string; name: string }>>([])

  const { data: recommendations, isLoading, refetch } = useAIRecommendations(selectedWardrobeId || undefined)

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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-[var(--error)]/30 bg-[var(--error)]/5'
      case 'medium':
        return 'border-[var(--warning)]/30 bg-[var(--warning)]/5'
      case 'low':
        return 'border-[var(--accent)]/30 bg-[var(--accent)]/5'
      default:
        return ''
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <span className="px-2 py-1 bg-[var(--error)] text-white text-xs rounded-[var(--radius-full)] font-medium">高优先级</span>
      case 'medium':
        return <span className="px-2 py-1 bg-[var(--warning)] text-white text-xs rounded-[var(--radius-full)] font-medium">中优先级</span>
      case 'low':
        return <span className="px-2 py-1 bg-[var(--accent)] text-white text-xs rounded-[var(--radius-full)] font-medium">低优先级</span>
      default:
        return null
    }
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
              <p className="text-xs tracking-[0.2em] uppercase text-[var(--gray-500)] mb-2">AI INSIGHTS</p>
              <h1 className="text-display text-4xl md:text-5xl text-[var(--gray-900)]">
                智能建议
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
            基于您的衣橱数据，AI 为您提供个性化的建议和洞察
          </p>
        </div>

        {/* AI 建议列表 */}
        {recommendations && recommendations.length > 0 ? (
          <div className="space-y-4">
            {recommendations.map((rec, index) => (
              <Card 
                key={index} 
                className={`p-6 ${getPriorityColor(rec.priority)} animate-fade-in stagger-${Math.min(index % 5 + 1, 5)}`}
              >
                <div className="flex items-start gap-4">
                  <div className="text-4xl flex-shrink-0">{rec.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-medium text-[var(--gray-900)]">
                        {rec.title}
                      </h3>
                      {getPriorityBadge(rec.priority)}
                    </div>
                    <p className="text-[var(--gray-700)] mb-4">{rec.description}</p>
                    {rec.actions && rec.actions.length > 0 && (
                      <div className="flex gap-3">
                        {rec.actions.map((action, actionIndex) => (
                          <Button
                            key={actionIndex}
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(action.link)}
                          >
                            {action.label}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--success)]/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-[var(--success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-[var(--gray-600)] mb-2">太棒了！目前没有需要改进的建议</p>
            <p className="text-sm text-[var(--gray-500)]">您的衣橱管理很不错，继续保持</p>
          </Card>
        )}

        {/* 功能说明 */}
        <Card className="p-6 border-2 border-[var(--accent)]/30 bg-gradient-to-br from-[var(--accent)]/5 to-transparent">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-[var(--accent)]/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium mb-3 text-[var(--gray-900)]">关于 AI 建议</h3>
              <ul className="space-y-2 text-sm text-[var(--gray-700)]">
                <li className="flex items-start gap-2">
                  <span className="text-[var(--accent)] mt-1">•</span>
                  <span>AI 建议基于您的衣橱数据自动生成，包括衣物使用频率、分类分布、价格等多个维度</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--accent)] mt-1">•</span>
                  <span>建议分为高、中、低三个优先级，建议优先处理高优先级项目</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--accent)] mt-1">•</span>
                  <span>随着数据的增加，AI 建议会变得更加精准和个性化</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--accent)] mt-1">•</span>
                  <span>建议类型包括：购物建议、穿搭建议、整理建议、使用建议等</span>
                </li>
              </ul>
            </div>
          </div>
        </Card>

        {/* 建议类型说明 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">🛍️</span>
              <h4 className="font-medium text-[var(--gray-900)]">购物建议</h4>
            </div>
            <p className="text-sm text-[var(--gray-600)]">
              分析衣橱结构，提供合理的购买建议
            </p>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">👔</span>
              <h4 className="font-medium text-[var(--gray-900)]">穿搭建议</h4>
            </div>
            <p className="text-sm text-[var(--gray-600)]">
              根据搭配数据，推荐穿搭组合
            </p>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">🧹</span>
              <h4 className="font-medium text-[var(--gray-900)]">整理建议</h4>
            </div>
            <p className="text-sm text-[var(--gray-600)]">
              提醒需要整理的衣物，保持衣橱整洁
            </p>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">📊</span>
              <h4 className="font-medium text-[var(--gray-900)]">使用建议</h4>
            </div>
            <p className="text-sm text-[var(--gray-600)]">
              分析使用频率，提升衣物利用率
            </p>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">🎨</span>
              <h4 className="font-medium text-[var(--gray-900)]">风格建议</h4>
            </div>
            <p className="text-sm text-[var(--gray-600)]">
              根据品牌和风格，提供多样化建议
            </p>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">💰</span>
              <h4 className="font-medium text-[var(--gray-900)]">性价比分析</h4>
            </div>
            <p className="text-sm text-[var(--gray-600)]">
              分析价格与使用的关系，优化购买
            </p>
          </Card>
        </div>
      </div>
    </PullToRefresh>
  )
}
