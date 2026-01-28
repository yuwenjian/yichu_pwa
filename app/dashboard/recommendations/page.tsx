'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import PullToRefresh from '@/components/ui/PullToRefresh'
import { convertToAIRecommendations } from '@/lib/ai/deepseek-prompt'
import type { DeepSeekAnalysisOutput } from '@/lib/ai/deepseek-prompt'

interface AIRecommendation {
  type: 'shopping' | 'style' | 'organization' | 'usage' | 'outfit'
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  icon: string
  actions?: Array<{
    label: string
    link: string
  }>
}

export default function RecommendationsPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [selectedWardrobeId, setSelectedWardrobeId] = useState<string>('')
  const [wardrobes, setWardrobes] = useState<Array<{ id: string; name: string }>>([])
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [lastScanDate, setLastScanDate] = useState<string | null>(null)
  const [canScanToday, setCanScanToday] = useState(true)

  useEffect(() => {
    loadWardrobes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  useEffect(() => {
    if (selectedWardrobeId) {
      checkLastScan()
      loadTodayRecommendations()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWardrobeId])

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

  // 检查今日是否已扫描
  const checkLastScan = () => {
    const storageKey = `ai_scan_${selectedWardrobeId}`
    const lastScan = localStorage.getItem(storageKey)
    
    if (lastScan) {
      const lastScanDate = new Date(lastScan)
      const today = new Date()
      
      // 检查是否是今天
      const isSameDay = 
        lastScanDate.getFullYear() === today.getFullYear() &&
        lastScanDate.getMonth() === today.getMonth() &&
        lastScanDate.getDate() === today.getDate()
      
      setCanScanToday(!isSameDay)
      setLastScanDate(lastScan)
    } else {
      setCanScanToday(true)
      setLastScanDate(null)
    }
  }

  // 加载今日已有的建议
  const loadTodayRecommendations = () => {
    const storageKey = `ai_recommendations_${selectedWardrobeId}`
    const cached = localStorage.getItem(storageKey)
    
    if (cached) {
      try {
        const data = JSON.parse(cached)
        const cacheDate = new Date(data.timestamp)
        const today = new Date()
        
        // 检查缓存是否是今天的
        const isSameDay = 
          cacheDate.getFullYear() === today.getFullYear() &&
          cacheDate.getMonth() === today.getMonth() &&
          cacheDate.getDate() === today.getDate()
        
        if (isSameDay && data.recommendations) {
          setRecommendations(data.recommendations)
        } else {
          // 清除过期缓存
          localStorage.removeItem(storageKey)
          setRecommendations([])
        }
      } catch (error) {
        console.error('Failed to parse cached recommendations:', error)
        setRecommendations([])
      }
    } else {
      setRecommendations([])
    }
  }

  // 清除缓存并允许重新扫描
  const handleClearCache = () => {
    if (!selectedWardrobeId) return
    
    const storageKey = `ai_recommendations_${selectedWardrobeId}`
    const lastScanKey = `ai_last_scan_${selectedWardrobeId}`
    
    localStorage.removeItem(storageKey)
    localStorage.removeItem(lastScanKey)
    
    setRecommendations([])
    setLastScanDate(null)
    setCanScanToday(true)
    
    console.log('✅ 缓存已清除，可以重新扫描')
  }

  // 执行 AI 扫描
  const handleAIScan = async () => {
    if (!selectedWardrobeId || !canScanToday) return
    
    setIsScanning(true)
    
    try {
      const response = await fetch('/api/ai/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wardrobeId: selectedWardrobeId })
      })
      
      if (response.ok) {
        const result = await response.json()
        
        // 如果 API 返回了有效的建议
        if (result.recommendations && result.recommendations.length > 0 && !result.fallback) {
          console.log('✅ 使用 DeepSeek AI 建议')
          console.log('AI 总结:', result.summary)
          
          const aiRecommendations = convertToAIRecommendations(result as DeepSeekAnalysisOutput)
          setRecommendations(aiRecommendations)
          
          // 保存到本地存储
          const storageKey = `ai_recommendations_${selectedWardrobeId}`
          localStorage.setItem(storageKey, JSON.stringify({
            recommendations: aiRecommendations,
            timestamp: new Date().toISOString()
          }))
          
          // 记录扫描时间
          const scanKey = `ai_scan_${selectedWardrobeId}`
          localStorage.setItem(scanKey, new Date().toISOString())
          
          setCanScanToday(false)
          setLastScanDate(new Date().toISOString())
        } else {
          alert('AI 分析暂时不可用，请稍后再试')
        }
      } else {
        alert('AI 分析失败，请稍后再试')
      }
    } catch (error) {
      console.error('AI scan failed:', error)
      alert('AI 分析失败，请稍后再试')
    } finally {
      setIsScanning(false)
    }
  }

  const handleRefresh = async () => {
    await loadWardrobes()
    checkLastScan()
    loadTodayRecommendations()
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

  const formatScanDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
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

        {/* AI 扫描按钮 */}
        <Card className="p-6 border-2 border-[var(--accent)]/30 bg-gradient-to-br from-[var(--accent)]/5 to-transparent">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-4 flex-1">
              <div className="w-12 h-12 rounded-full bg-[var(--accent)]/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-[var(--accent)]" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-medium mb-2 text-[var(--gray-900)]">
                  🤖 AI 智能分析
                </h3>
                <p className="text-sm text-[var(--gray-600)] mb-2">
                  由 DeepSeek 提供支持，基于您的衣橱数据生成个性化建议
                </p>
                {lastScanDate && (
                  <p className="text-xs text-[var(--gray-500)]">
                    上次扫描：{formatScanDate(lastScanDate)}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {/* 清除缓存按钮 - 只在有缓存时显示 */}
              {recommendations.length > 0 && (
                <Button
                  onClick={handleClearCache}
                  variant="outline"
                  className="whitespace-nowrap"
                  title="清除缓存并允许重新扫描"
                >
                  清除缓存
                </Button>
              )}
              
              {/* 扫描按钮 */}
              <Button
                onClick={handleAIScan}
                disabled={!canScanToday || isScanning}
                className={`whitespace-nowrap ${!canScanToday ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isScanning ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    分析中...
                  </>
                ) : canScanToday ? (
                  '开始扫描'
                ) : (
                  '今日已扫描'
                )}
              </Button>
            </div>
          </div>
        </Card>

        {/* AI 建议列表 */}
        {recommendations && recommendations.length > 0 ? (
          <>
            {/* 分析结果指示 */}
            <Card className="p-4 border-2 border-[var(--success)]/30 bg-gradient-to-r from-[var(--success)]/10 to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[var(--success)]/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-[var(--success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[var(--gray-900)]">
                    ✅ AI 分析完成
                  </p>
                  <p className="text-xs text-[var(--gray-600)]">
                    已为您生成 {recommendations.length} 条个性化建议
                  </p>
                </div>
              </div>
            </Card>
            
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
                      <p className="text-[var(--gray-700)] mb-4 whitespace-pre-line">{rec.description}</p>
                      {rec.actions && rec.actions.length > 0 && (
                        <div className="flex gap-3">
                          {rec.actions.map((action, actionIndex) => {
                            // 动态替换链接中的占位符
                            let link = action.link
                            if (link === '/dashboard/wardrobes' && selectedWardrobeId) {
                              // 如果是跳转到衣橱，且是购物建议，直接跳转到当前衣橱的添加页面
                              if (rec.type === 'shopping') {
                                link = `/dashboard/wardrobes/${selectedWardrobeId}/clothings/new`
                              } else {
                                link = `/dashboard/wardrobes/${selectedWardrobeId}/clothings`
                              }
                            }
                            
                            return (
                              <Button
                                key={actionIndex}
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(link)}
                              >
                                {action.label}
                              </Button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </>
        ) : (
          <Card className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--accent)]/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <p className="text-[var(--gray-600)] mb-2">暂无 AI 建议</p>
            <p className="text-sm text-[var(--gray-500)]">点击上方"开始扫描"按钮，让 AI 为您分析衣橱数据</p>
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
