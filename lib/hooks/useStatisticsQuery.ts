import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Clothing } from '@/types'

interface ClothingWithCategory extends Clothing {
  category: { name: string }
}

interface TopClothing {
  id: string
  name: string | null
  image_url: string
  use_count: number
  last_used_at: string | null
  category: { name: string }
}

interface IdleClothing {
  id: string
  name: string | null
  image_url: string
  last_used_at: string | null
  days_since_last_wear: number
  seasons: string[]
  category: { name: string }
}

interface WearTrend {
  date: string
  count: number
}

interface BrandStats {
  brand: string
  count: number
  totalUseCount: number
}

interface PriceUsageData {
  price: number
  use_count: number
  name: string | null
}

interface Statistics {
  totalClothings: number
  totalOutfits: number
  totalValue: number
  avgPrice: number
  byCategory: Array<{ categoryName: string; count: number }>
  byStatus: Record<string, number>
  bySeason: Record<string, number>
  topClothings: TopClothing[]
  idleClothings: IdleClothing[]
  wearTrends: WearTrend[]
  brandStats: BrandStats[]
  priceUsageData: PriceUsageData[]
  utilizationRate: number
}

// 获取统计数据
export function useStatistics(wardrobeId: string | undefined) {
  return useQuery({
    queryKey: ['statistics', wardrobeId],
    queryFn: async (): Promise<Statistics> => {
      if (!wardrobeId) {
        throw new Error('Wardrobe ID is required')
      }

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

      if (!clothings) {
        return {
          totalClothings: 0,
          totalOutfits: 0,
          totalValue: 0,
          avgPrice: 0,
          byCategory: [],
          byStatus: {},
          bySeason: {},
          topClothings: [],
          idleClothings: [],
          wearTrends: [],
          brandStats: [],
          priceUsageData: [],
          utilizationRate: 0,
        }
      }

      const clothingsTyped = clothings as unknown as ClothingWithCategory[]

      // 计算统计
      const totalClothings = clothings.length
      const totalOutfits = outfits?.length || 0

      const prices = clothings.filter(c => c.price).map(c => c.price!)
      const totalValue = prices.reduce((sum, p) => sum + p, 0)
      const avgPrice = prices.length > 0 ? totalValue / prices.length : 0

      // 按分类统计
      const categoryMap = new Map<string, number>()
      clothings.forEach(c => {
        const catName = (c.category as any)?.name || '未分类'
        categoryMap.set(catName, (categoryMap.get(catName) || 0) + 1)
      })
      const byCategory = Array.from(categoryMap.entries()).map(([name, count]) => ({
        categoryName: name,
        count,
      }))

      // 按状态统计
      const byStatus: Record<string, number> = {}
      clothings.forEach(c => {
        byStatus[c.status] = (byStatus[c.status] || 0) + 1
      })

      // 按季节统计
      const bySeason: Record<string, number> = {}
      clothingsTyped.forEach(c => {
        c.seasons?.forEach((s: string) => {
          bySeason[s] = (bySeason[s] || 0) + 1
        })
      })

      // 最常穿衣物 Top 10
      const topClothings = clothingsTyped
        .filter(c => c.use_count > 0)
        .sort((a, b) => (b.use_count || 0) - (a.use_count || 0))
        .slice(0, 10)
        .map(c => ({
          id: c.id,
          name: c.name,
          image_url: c.image_url,
          use_count: c.use_count || 0,
          last_used_at: c.last_used_at,
          category: c.category,
        }))

      // 获取当前季节
      const getCurrentSeason = () => {
        const month = new Date().getMonth() + 1
        if (month >= 3 && month <= 5) return '春'
        if (month >= 6 && month <= 8) return '夏'
        if (month >= 9 && month <= 11) return '秋'
        return '冬'
      }
      const currentSeason = getCurrentSeason()

      // 闲置衣物（当前季节，超过30天未穿）
      const now = new Date()
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      
      const idleClothings = clothingsTyped
        .filter(c => {
          // 适合当前季节
          const isCurrentSeason = c.seasons?.includes(currentSeason)
          // 超过30天未穿或从未穿过
          const isIdle = !c.last_used_at || new Date(c.last_used_at) < thirtyDaysAgo
          return isCurrentSeason && isIdle
        })
        .map(c => {
          const daysSince = c.last_used_at
            ? Math.floor((now.getTime() - new Date(c.last_used_at).getTime()) / (1000 * 60 * 60 * 24))
            : 999
          return {
            id: c.id,
            name: c.name,
            image_url: c.image_url,
            last_used_at: c.last_used_at,
            days_since_last_wear: daysSince,
            seasons: c.seasons || [],
            category: c.category,
          }
        })
        .sort((a, b) => b.days_since_last_wear - a.days_since_last_wear)
        .slice(0, 10)

      // 穿搭频率趋势（最近30天）
      const wearTrends: WearTrend[] = []
      const wearCountMap = new Map<string, number>()
      
      clothingsTyped.forEach(c => {
        if (c.last_used_at) {
          const date = new Date(c.last_used_at)
          if (date >= thirtyDaysAgo) {
            const dateStr = date.toISOString().split('T')[0]
            wearCountMap.set(dateStr, (wearCountMap.get(dateStr) || 0) + 1)
          }
        }
      })

      // 填充最近30天的数据（包含0的日期）
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
        const dateStr = date.toISOString().split('T')[0]
        wearTrends.push({
          date: dateStr,
          count: wearCountMap.get(dateStr) || 0,
        })
      }

      // 品牌使用频率统计
      const brandMap = new Map<string, { count: number; totalUseCount: number }>()
      clothingsTyped.forEach(c => {
        if (c.brand) {
          const stats = brandMap.get(c.brand) || { count: 0, totalUseCount: 0 }
          stats.count++
          stats.totalUseCount += c.use_count || 0
          brandMap.set(c.brand, stats)
        }
      })
      
      const brandStats = Array.from(brandMap.entries())
        .map(([brand, stats]) => ({
          brand,
          count: stats.count,
          totalUseCount: stats.totalUseCount,
        }))
        .sort((a, b) => b.totalUseCount - a.totalUseCount)
        .slice(0, 10)

      // 价格与使用次数关系
      const priceUsageData = clothingsTyped
        .filter(c => c.price && c.price > 0)
        .map(c => ({
          price: c.price || 0,
          use_count: c.use_count || 0,
          name: c.name,
        }))

      // 衣物利用率（穿过的衣物 / 总衣物）
      const wornClothings = clothingsTyped.filter(c => c.use_count > 0).length
      const utilizationRate = totalClothings > 0 ? (wornClothings / totalClothings) * 100 : 0

      return {
        totalClothings,
        totalOutfits,
        totalValue,
        avgPrice,
        byCategory,
        byStatus,
        bySeason,
        topClothings,
        idleClothings,
        wearTrends,
        brandStats,
        priceUsageData,
        utilizationRate,
      }
    },
    enabled: !!wardrobeId,
  })
}
