import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Wardrobe, Category, Clothing } from '@/types'

interface WardrobeData {
  wardrobe: Wardrobe
  categories: Category[]
  clothings: Clothing[]
}

// 获取衣橱详情（包括分类和衣物）
export function useWardrobe(wardrobeId: string | undefined) {
  return useQuery({
    queryKey: ['wardrobe', wardrobeId],
    queryFn: async (): Promise<WardrobeData> => {
      if (!wardrobeId) {
        throw new Error('Wardrobe ID is required')
      }

      // 并行加载所有数据
      const [wardrobeRes, categoriesRes, clothingsRes] = await Promise.all([
        supabase.from('wardrobes').select('*').eq('id', wardrobeId).single(),
        supabase
          .from('categories')
          .select('*')
          .eq('wardrobe_id', wardrobeId)
          .order('level', { ascending: true })
          .order('sort_order', { ascending: true }),
        supabase
          .from('clothings')
          .select('*')
          .eq('wardrobe_id', wardrobeId)
          .order('created_at', { ascending: false }),
      ])

      if (wardrobeRes.error) throw wardrobeRes.error
      if (categoriesRes.error) throw categoriesRes.error
      if (clothingsRes.error) throw clothingsRes.error

      return {
        wardrobe: wardrobeRes.data,
        categories: categoriesRes.data || [],
        clothings: clothingsRes.data || [],
      }
    },
    enabled: !!wardrobeId,
  })
}

// 创建分类
export function useCreateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (category: Partial<Category>) => {
      const { data, error} = await supabase
        .from('categories')
        .insert([category])
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      // 刷新衣橱数据
      queryClient.invalidateQueries({
        queryKey: ['wardrobe', variables.wardrobe_id],
      })
      queryClient.invalidateQueries({
        queryKey: ['categories', variables.wardrobe_id],
      })
    },
  })
}
