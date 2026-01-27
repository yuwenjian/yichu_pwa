import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

interface ClothingRelation {
  clothingId: string
  clothingName: string | null
  clothingImage: string
  categoryName: string
  frequency: number
  relatedClothings: Array<{
    id: string
    name: string | null
    image: string
    count: number
  }>
}

// 获取搭配关联分析数据
export function useOutfitAnalysis(wardrobeId: string | undefined) {
  return useQuery({
    queryKey: ['outfitAnalysis', wardrobeId],
    queryFn: async (): Promise<ClothingRelation[]> => {
      if (!wardrobeId) {
        throw new Error('Wardrobe ID is required')
      }

      // 获取所有搭配及其单品
      const { data: outfits } = await supabase
        .from('outfits')
        .select(`
          id,
          items:outfit_items(
            clothing_id,
            clothing:clothings(
              id,
              name,
              image_url,
              category:categories(name)
            )
          )
        `)
        .eq('wardrobe_id', wardrobeId)

      if (!outfits || outfits.length === 0) {
        return []
      }

      // 构建衣物关联关系
      const clothingFrequency = new Map<string, number>()
      const relationMap = new Map<string, Map<string, number>>()
      const clothingInfo = new Map<string, { name: string | null; image: string; category: string }>()

      outfits.forEach((outfit: any) => {
        const items = outfit.items || []
        const clothingIds = items.map((item: any) => item.clothing_id)

        items.forEach((item: any) => {
          const clothing = item.clothing
          if (!clothing) return

          const clothingId = clothing.id

          // 记录衣物信息
          if (!clothingInfo.has(clothingId)) {
            clothingInfo.set(clothingId, {
              name: clothing.name,
              image: clothing.image_url,
              category: clothing.category?.name || '未分类',
            })
          }

          // 统计衣物出现频率
          clothingFrequency.set(clothingId, (clothingFrequency.get(clothingId) || 0) + 1)

          // 统计与其他衣物的关联
          if (!relationMap.has(clothingId)) {
            relationMap.set(clothingId, new Map())
          }

          clothingIds.forEach((relatedId: string) => {
            if (relatedId !== clothingId) {
              const relations = relationMap.get(clothingId)!
              relations.set(relatedId, (relations.get(relatedId) || 0) + 1)
            }
          })
        })
      })

      // 构建结果
      const result: ClothingRelation[] = []

      clothingFrequency.forEach((frequency, clothingId) => {
        const info = clothingInfo.get(clothingId)
        if (!info) return

        const relations = relationMap.get(clothingId)
        const relatedClothings = Array.from(relations?.entries() || [])
          .map(([id, count]) => {
            const relatedInfo = clothingInfo.get(id)
            return {
              id,
              name: relatedInfo?.name || null,
              image: relatedInfo?.image || '',
              count,
            }
          })
          .sort((a, b) => b.count - a.count)
          .slice(0, 5) // Top 5 关联衣物

        result.push({
          clothingId,
          clothingName: info.name,
          clothingImage: info.image,
          categoryName: info.category,
          frequency,
          relatedClothings,
        })
      })

      // 按出现频率排序
      return result.sort((a, b) => b.frequency - a.frequency)
    },
    enabled: !!wardrobeId,
  })
}

// 获取推荐搭配（基于关联分析）
export function useOutfitRecommendations(wardrobeId: string | undefined, clothingId: string | undefined) {
  return useQuery({
    queryKey: ['outfitRecommendations', wardrobeId, clothingId],
    queryFn: async () => {
      if (!wardrobeId || !clothingId) {
        throw new Error('Wardrobe ID and Clothing ID are required')
      }

      // 查找包含该衣物的所有搭配
      const { data: outfitItems } = await supabase
        .from('outfit_items')
        .select(`
          outfit:outfits(
            id,
            wardrobe_id,
            items:outfit_items(
              clothing:clothings(
                id,
                name,
                image_url,
                category:categories(name)
              )
            )
          )
        `)
        .eq('clothing_id', clothingId)

      if (!outfitItems || outfitItems.length === 0) {
        return []
      }

      // 统计其他衣物出现频率
      const relatedClothings = new Map<string, { count: number; info: any }>()

      outfitItems.forEach((item: any) => {
        const outfit = item.outfit
        if (outfit?.wardrobe_id !== wardrobeId) return

        outfit.items?.forEach((outfitItem: any) => {
          const clothing = outfitItem.clothing
          if (!clothing || clothing.id === clothingId) return

          if (!relatedClothings.has(clothing.id)) {
            relatedClothings.set(clothing.id, {
              count: 0,
              info: clothing,
            })
          }
          const entry = relatedClothings.get(clothing.id)!
          entry.count++
        })
      })

      // 返回 Top 10 推荐
      return Array.from(relatedClothings.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
        .map(({ count, info }) => ({
          ...info,
          matchCount: count,
        }))
    },
    enabled: !!wardrobeId && !!clothingId,
  })
}
