import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
    refetchOnMount: 'always', // 确保每次进入页面都刷新数据
    staleTime: 0, // 数据立即过期，确保总是获取最新数据
  })
}

// 获取单个衣物详情
export function useClothing(clothingId: string) {
  return useQuery({
    queryKey: ['clothing', clothingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clothings')
        .select('*')
        .eq('id', clothingId)
        .single()

      if (error) throw error
      return data as Clothing
    },
    enabled: !!clothingId,
  })
}

// 增加衣物使用次数
export function useIncrementClothingUseCount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (clothingId: string) => {
      // 获取当前衣物信息
      const { data: clothing, error: fetchError } = await supabase
        .from('clothings')
        .select('use_count')
        .eq('id', clothingId)
        .single()

      if (fetchError) throw fetchError

      // 更新使用次数和最后使用时间
      const { error: updateError } = await supabase
        .from('clothings')
        .update({
          use_count: (clothing.use_count || 0) + 1,
          last_used_at: new Date().toISOString(),
        })
        .eq('id', clothingId)

      if (updateError) throw updateError
    },
    onSuccess: (_, clothingId) => {
      // 更新缓存
      queryClient.invalidateQueries({ queryKey: ['clothing', clothingId] })
      queryClient.invalidateQueries({ queryKey: ['clothings'] })
    },
  })
}
