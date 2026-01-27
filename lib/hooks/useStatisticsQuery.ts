import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

interface Statistics {
  totalClothings: number
  totalOutfits: number
  totalValue: number
  avgPrice: number
  byCategory: Array<{ categoryName: string; count: number }>
  byStatus: Record<string, number>
  bySeason: Record<string, number>
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
        }
      }

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
      clothings.forEach(c => {
        c.seasons.forEach(s => {
          bySeason[s] = (bySeason[s] || 0) + 1
        })
      })

      return {
        totalClothings,
        totalOutfits,
        totalValue,
        avgPrice,
        byCategory,
        byStatus,
        bySeason,
      }
    },
    enabled: !!wardrobeId,
  })
}
