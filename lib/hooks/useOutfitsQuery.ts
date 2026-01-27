import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Outfit, OutfitItem, Clothing } from '@/types'

// 扩展类型，包含完整的 outfit items 信息
export interface OutfitWithItems extends Outfit {
  items: (OutfitItem & { clothing: Clothing })[]
}

// 获取搭配列表（根据用户ID获取所有搭配）
export function useOutfitsByUser(userId: string | undefined) {
  return useQuery({
    queryKey: ['outfits', 'user', userId],
    queryFn: async () => {
      if (!userId) return []

      // 先获取用户的所有衣橱
      const { data: wardrobes, error: wardrobeError } = await supabase
        .from('wardrobes')
        .select('id')
        .eq('user_id', userId)

      if (wardrobeError) throw wardrobeError

      const wardrobeIds = wardrobes.map(w => w.id)
      if (wardrobeIds.length === 0) return []

      // 获取所有衣橱的搭配
      const { data, error } = await supabase
        .from('outfits')
        .select('*')
        .in('wardrobe_id', wardrobeIds)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as Outfit[]
    },
    enabled: !!userId,
  })
}

// 获取搭配列表（按衣橱）
export function useOutfits(wardrobeId: string | undefined) {
  return useQuery({
    queryKey: ['outfits', wardrobeId],
    queryFn: async () => {
      if (!wardrobeId) return []

      const { data, error } = await supabase
        .from('outfits')
        .select('*')
        .eq('wardrobe_id', wardrobeId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as Outfit[]
    },
    enabled: !!wardrobeId,
  })
}

// 获取单个搭配详情（包含衣物信息）
export function useOutfit(outfitId: string | undefined) {
  return useQuery({
    queryKey: ['outfit', outfitId],
    queryFn: async () => {
      if (!outfitId) return null

      // 获取搭配基本信息
      const { data: outfit, error: outfitError } = await supabase
        .from('outfits')
        .select('*')
        .eq('id', outfitId)
        .single()

      if (outfitError) throw outfitError

      // 获取搭配单品列表
      const { data: items, error: itemsError } = await supabase
        .from('outfit_items')
        .select(`
          *,
          clothing:clothings (*)
        `)
        .eq('outfit_id', outfitId)
        .order('z_index', { ascending: true })

      if (itemsError) throw itemsError

      return {
        ...outfit,
        items: items || [],
      } as OutfitWithItems
    },
    enabled: !!outfitId,
  })
}

// 创建搭配
export function useCreateOutfit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      outfit: Partial<Outfit>
      clothingIds: string[]
    }) => {
      const { outfit, clothingIds } = params

      // 创建搭配
      const { data: newOutfit, error: outfitError } = await supabase
        .from('outfits')
        .insert([outfit])
        .select()
        .single()

      if (outfitError) throw outfitError

      // 创建搭配单品关联
      if (clothingIds.length > 0) {
        const outfitItems = clothingIds.map((clothingId, index) => ({
          outfit_id: newOutfit.id,
          clothing_id: clothingId,
          position_x: 0,
          position_y: 0,
          rotation: 0,
          z_index: index,
        }))

        const { error: itemsError } = await supabase
          .from('outfit_items')
          .insert(outfitItems)

        if (itemsError) throw itemsError
      }

      return newOutfit
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['outfits', data.wardrobe_id] })
      queryClient.invalidateQueries({ queryKey: ['outfit', data.id] })
    },
  })
}

// 更新搭配
export function useUpdateOutfit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      id: string
      updates: Partial<Outfit>
      clothingIds?: string[]
    }) => {
      const { id, updates, clothingIds } = params

      // 更新搭配基本信息
      const { data, error } = await supabase
        .from('outfits')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      // 如果提供了新的衣物列表，更新搭配单品
      if (clothingIds) {
        // 删除旧的关联
        const { error: deleteError } = await supabase
          .from('outfit_items')
          .delete()
          .eq('outfit_id', id)

        if (deleteError) throw deleteError

        // 创建新的关联
        if (clothingIds.length > 0) {
          const outfitItems = clothingIds.map((clothingId, index) => ({
            outfit_id: id,
            clothing_id: clothingId,
            position_x: 0,
            position_y: 0,
            rotation: 0,
            z_index: index,
          }))

          const { error: itemsError } = await supabase
            .from('outfit_items')
            .insert(outfitItems)

          if (itemsError) throw itemsError
        }
      }

      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['outfits', data.wardrobe_id] })
      queryClient.invalidateQueries({ queryKey: ['outfit', data.id] })
    },
  })
}

// 删除搭配
export function useDeleteOutfit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('outfits').delete().eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outfits'] })
    },
  })
}

// 增加搭配使用次数
export function useIncrementOutfitUseCount() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (outfitId: string) => {
      // 获取当前搭配信息
      const { data: outfit, error: fetchError } = await supabase
        .from('outfits')
        .select('use_count')
        .eq('id', outfitId)
        .single()

      if (fetchError) throw fetchError

      // 更新使用次数和最后使用时间
      const { error: updateError } = await supabase
        .from('outfits')
        .update({
          use_count: (outfit.use_count || 0) + 1,
          last_used_at: new Date().toISOString(),
        })
        .eq('id', outfitId)

      if (updateError) throw updateError
    },
    onSuccess: (_, outfitId) => {
      queryClient.invalidateQueries({ queryKey: ['outfit', outfitId] })
      queryClient.invalidateQueries({ queryKey: ['outfits'] })
    },
  })
}
