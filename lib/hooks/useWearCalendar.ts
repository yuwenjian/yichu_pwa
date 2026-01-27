import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

interface WearRecord {
  date: string
  clothings: Array<{
    id: string
    name: string | null
    image_url: string
    category: { name: string }
  }>
  outfits: Array<{
    id: string
    name: string
    image_url: string
  }>
}

// 获取穿搭日历数据
export function useWearCalendar(wardrobeId: string | undefined, year: number, month: number) {
  return useQuery({
    queryKey: ['wearCalendar', wardrobeId, year, month],
    queryFn: async (): Promise<WearRecord[]> => {
      if (!wardrobeId) {
        throw new Error('Wardrobe ID is required')
      }

      // 计算月份的起止日期
      const startDate = new Date(year, month - 1, 1)
      const endDate = new Date(year, month, 0, 23, 59, 59)

      // 获取该月份使用的衣物（基于 last_used_at）
      const { data: clothings } = await supabase
        .from('clothings')
        .select('id, name, image_url, last_used_at, category:categories(name)')
        .eq('wardrobe_id', wardrobeId)
        .gte('last_used_at', startDate.toISOString())
        .lte('last_used_at', endDate.toISOString())

      // 获取该月份使用的搭配（基于 last_used_at）
      const { data: outfits } = await supabase
        .from('outfits')
        .select('id, name, image_url, last_used_at')
        .eq('wardrobe_id', wardrobeId)
        .gte('last_used_at', startDate.toISOString())
        .lte('last_used_at', endDate.toISOString())

      // 按日期分组
      const recordMap = new Map<string, WearRecord>()

      clothings?.forEach((clothing: any) => {
        if (clothing.last_used_at) {
          const date = new Date(clothing.last_used_at).toISOString().split('T')[0]
          if (!recordMap.has(date)) {
            recordMap.set(date, { date, clothings: [], outfits: [] })
          }
          recordMap.get(date)!.clothings.push({
            id: clothing.id,
            name: clothing.name,
            image_url: clothing.image_url,
            category: clothing.category,
          })
        }
      })

      outfits?.forEach((outfit: any) => {
        if (outfit.last_used_at) {
          const date = new Date(outfit.last_used_at).toISOString().split('T')[0]
          if (!recordMap.has(date)) {
            recordMap.set(date, { date, clothings: [], outfits: [] })
          }
          recordMap.get(date)!.outfits.push({
            id: outfit.id,
            name: outfit.name,
            image_url: outfit.image_url,
          })
        }
      })

      return Array.from(recordMap.values()).sort((a, b) => b.date.localeCompare(a.date))
    },
    enabled: !!wardrobeId,
  })
}
