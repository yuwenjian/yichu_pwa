import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Clothing } from '@/types'

interface ClothingsQueryParams {
  wardrobeId: string
  categoryId?: string
  categoryIds?: string[] // 支持多个分类 ID（用于一级分类查询其子分类）
  status?: string
  searchTerm?: string
}

// 获取衣物列表（带筛选）
export function useClothings({
  wardrobeId,
  categoryId,
  categoryIds,
  status,
  searchTerm,
}: ClothingsQueryParams) {
  return useQuery({
    queryKey: ['clothings', wardrobeId, categoryId, categoryIds, status, searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('clothings')
        .select('*')
        .eq('wardrobe_id', wardrobeId)

      // 如果传入了多个分类 ID，使用 in 查询
      if (categoryIds && categoryIds.length > 0) {
        query = query.in('category_id', categoryIds)
      } else if (categoryId) {
        // 否则使用单个分类 ID
        query = query.eq('category_id', categoryId)
      }

      if (status) {
        query = query.eq('status', status)
      }

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,brand.ilike.%${searchTerm}%`)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error
      return data as Clothing[]
    },
  })
}
