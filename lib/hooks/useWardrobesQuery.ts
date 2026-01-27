import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Wardrobe } from '@/types'

// 获取衣橱列表
export function useWardrobes(userId: string | undefined) {
  return useQuery({
    queryKey: ['wardrobes', userId],
    queryFn: async () => {
      if (!userId) return []

      const { data, error } = await supabase
        .from('wardrobes')
        .select('*')
        .eq('user_id', userId)
        .order('sort_order', { ascending: true })

      if (error) throw error
      return data as Wardrobe[]
    },
    enabled: !!userId, // 只在 userId 存在时执行查询
  })
}

// 创建衣橱
export function useCreateWardrobe() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (wardrobe: Partial<Wardrobe>) => {
      const { data, error } = await supabase
        .from('wardrobes')
        .insert([wardrobe])
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      // 创建成功后刷新衣橱列表
      queryClient.invalidateQueries({ queryKey: ['wardrobes'] })
    },
  })
}

// 更新衣橱
export function useUpdateWardrobe() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Wardrobe> & { id: string }) => {
      const { data, error } = await supabase
        .from('wardrobes')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      // 刷新相关查询
      queryClient.invalidateQueries({ queryKey: ['wardrobes'] })
      queryClient.invalidateQueries({ queryKey: ['wardrobe', variables.id] })
    },
  })
}

// 删除衣橱
export function useDeleteWardrobe() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('wardrobes').delete().eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wardrobes'] })
    },
  })
}
