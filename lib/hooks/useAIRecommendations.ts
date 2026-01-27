import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

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

// 生成 AI 智能建议
export function useAIRecommendations(wardrobeId: string | undefined) {
  return useQuery({
    queryKey: ['aiRecommendations', wardrobeId],
    queryFn: async (): Promise<AIRecommendation[]> => {
      if (!wardrobeId) {
        throw new Error('Wardrobe ID is required')
      }

      const recommendations: AIRecommendation[] = []

      // 获取衣物数据
      const { data: clothings } = await supabase
        .from('clothings')
        .select('*, category:categories(name)')
        .eq('wardrobe_id', wardrobeId)

      // 获取搭配数据
      const { data: outfits } = await supabase
        .from('outfits')
        .select('*')
        .eq('wardrobe_id', wardrobeId)

      if (!clothings || clothings.length === 0) {
        return recommendations
      }

      const now = new Date()
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

      // 1. 分析闲置衣物
      const idleClothings = clothings.filter(c => 
        !c.last_used_at || new Date(c.last_used_at) < thirtyDaysAgo
      )
      
      if (idleClothings.length > clothings.length * 0.3) {
        recommendations.push({
          type: 'usage',
          title: '闲置衣物较多',
          description: `您有 ${idleClothings.length} 件衣物超过30天未穿，占总数的 ${Math.round(idleClothings.length / clothings.length * 100)}%。建议尝试新的搭配方式或考虑整理。`,
          priority: 'high',
          icon: '⚠️',
          actions: [
            { label: '查看闲置衣物', link: `/dashboard/statistics?tab=idle` },
          ],
        })
      }

      // 2. 分析购买建议
      const categoryCount = new Map<string, number>()
      clothings.forEach(c => {
        const cat = (c.category as any)?.name || '未分类'
        categoryCount.set(cat, (categoryCount.get(cat) || 0) + 1)
      })

      const sortedCategories = Array.from(categoryCount.entries())
        .sort((a, b) => b[1] - a[1])
      
      if (sortedCategories.length > 0) {
        const topCategory = sortedCategories[0]
        const percentage = Math.round((topCategory[1] / clothings.length) * 100)
        
        if (percentage > 40) {
          recommendations.push({
            type: 'shopping',
            title: '分类不均衡',
            description: `${topCategory[0]} 占衣物总数的 ${percentage}%，建议平衡各类衣物比例，增加搭配多样性。`,
            priority: 'medium',
            icon: '🛍️',
          })
        }
      }

      // 3. 分析搭配建议
      if (!outfits || outfits.length < 5) {
        recommendations.push({
          type: 'outfit',
          title: '创建更多搭配',
          description: '搭配数量较少，创建更多搭配可以帮助您快速决定每天的穿搭，节省时间。',
          priority: 'medium',
          icon: '👔',
          actions: [
            { label: '创建搭配', link: '/dashboard/outfits/new' },
          ],
        })
      }

      // 4. 分析价格与使用频率
      const clothingsWithPrice = clothings.filter(c => c.price && c.price > 0)
      if (clothingsWithPrice.length > 0) {
        const highPriceLowUse = clothingsWithPrice.filter(c => 
          (c.price || 0) > 500 && (c.use_count || 0) < 3
        )
        
        if (highPriceLowUse.length > 0) {
          recommendations.push({
            type: 'usage',
            title: '高价衣物利用率低',
            description: `有 ${highPriceLowUse.length} 件高价衣物（>¥500）穿搭次数少于3次，建议多穿搭以提高性价比。`,
            priority: 'high',
            icon: '💰',
          })
        }
      }

      // 5. 分析季节准备
      const getCurrentSeason = () => {
        const month = now.getMonth() + 1
        if (month >= 3 && month <= 5) return { current: '春', next: '夏' }
        if (month >= 6 && month <= 8) return { current: '夏', next: '秋' }
        if (month >= 9 && month <= 11) return { current: '秋', next: '冬' }
        return { current: '冬', next: '春' }
      }
      
      const { current, next } = getCurrentSeason()
      const nextSeasonClothings = clothings.filter(c => 
        c.seasons && c.seasons.includes(next)
      )
      
      if (nextSeasonClothings.length < 10) {
        recommendations.push({
          type: 'shopping',
          title: '下季度衣物准备',
          description: `${next}季衣物数量较少（${nextSeasonClothings.length} 件），可以提前准备下季度的搭配。`,
          priority: 'low',
          icon: '🌤️',
        })
      }

      // 6. 分析品牌多样性
      const brands = new Set(clothings.filter(c => c.brand).map(c => c.brand))
      if (brands.size > 0 && brands.size < 5) {
        recommendations.push({
          type: 'style',
          title: '尝试更多品牌',
          description: `您目前有 ${brands.size} 个品牌的衣物，尝试更多品牌可以丰富穿搭风格。`,
          priority: 'low',
          icon: '🏷️',
        })
      }

      // 7. 分析整理建议
      const damagedOrDiscarded = clothings.filter(c => 
        c.status === 'damaged' || c.status === 'discarded'
      )
      
      if (damagedOrDiscarded.length > 0) {
        recommendations.push({
          type: 'organization',
          title: '衣橱整理提醒',
          description: `有 ${damagedOrDiscarded.length} 件衣物标记为破损或丢弃，建议定期整理衣橱。`,
          priority: 'medium',
          icon: '🧹',
        })
      }

      // 8. 利用率建议
      const wornClothings = clothings.filter(c => (c.use_count || 0) > 0)
      const utilizationRate = (wornClothings.length / clothings.length) * 100
      
      if (utilizationRate < 50) {
        recommendations.push({
          type: 'usage',
          title: '提升衣物利用率',
          description: `当前利用率为 ${utilizationRate.toFixed(1)}%，建议多尝试不同搭配组合，提高衣物使用频率。`,
          priority: 'high',
          icon: '📊',
          actions: [
            { label: '查看搭配关联', link: '/dashboard/analysis' },
          ],
        })
      }

      // 按优先级排序
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      return recommendations.sort((a, b) => 
        priorityOrder[a.priority] - priorityOrder[b.priority]
      )
    },
    enabled: !!wardrobeId,
  })
}
