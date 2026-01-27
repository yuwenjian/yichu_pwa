import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Category } from '@/types'

// 获取分类列表
export function useCategories(wardrobeId: string | undefined) {
  return useQuery({
    queryKey: ['categories', wardrobeId],
    queryFn: async () => {
      if (!wardrobeId) return []

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('wardrobe_id', wardrobeId)
        .order('level', { ascending: true })
        .order('sort_order', { ascending: true })

      if (error) throw error
      return data as Category[]
    },
    enabled: !!wardrobeId,
  })
}
