'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Clothing, Category } from '@/types'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

export default function ClothingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const wardrobeId = params.id as string
  const clothingId = params.clothingId as string

  const [clothing, setClothing] = useState<Clothing | null>(null)
  const [category, setCategory] = useState<Category | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadClothingDetail()
  }, [clothingId])

  const loadClothingDetail = async () => {
    try {
      // 获取衣物信息
      const { data: clothingData, error: clothingError } = await supabase
        .from('clothings')
        .select('*')
        .eq('id', clothingId)
        .single()

      if (clothingError) throw clothingError

      setClothing(clothingData)

      // 获取分类信息
      if (clothingData.category_id) {
        const { data: categoryData } = await supabase
          .from('categories')
          .select('*')
          .eq('id', clothingData.category_id)
          .single()

        if (categoryData) {
          setCategory(categoryData)
        }
      }
    } catch (error) {
      console.error('Error loading clothing:', error)
      alert('加载失败')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('确定要删除这件衣物吗？')) return

    try {
      const { error } = await supabase
        .from('clothings')
        .delete()
        .eq('id', clothingId)

      if (error) throw error

      alert('删除成功')
      router.push(`/dashboard/wardrobes/${wardrobeId}/clothings`)
    } catch (error) {
      console.error('Error deleting clothing:', error)
      alert('删除失败，请重试')
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'normal':
        return '常穿'
      case 'damaged':
        return '破损'
      case 'idle':
        return '闲置'
      case 'discarded':
        return '丢弃'
      default:
        return status
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--primary)]"></div>
      </div>
    )
  }

  if (!clothing) {
    return (
      <Card className="text-center py-12">
        <p className="text-[var(--gray-700)] mb-4 font-medium">衣物不存在</p>
        <Button variant="ghost" onClick={() => router.back()}>
          返回
        </Button>
      </Card>
    )
  }

  return (
    <div className="space-y-6 pb-20">
      {/* 顶部按钮 */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()} className="!text-white">
          ← 返回
        </Button>
        <div className="flex gap-2">
          <Button
            variant="primary"
            onClick={() => router.push(`/dashboard/wardrobes/${wardrobeId}/clothings/${clothingId}/edit`)}
          >
            编辑
          </Button>
          <Button 
            variant="outline" 
            onClick={handleDelete} 
            className="!bg-red-600 !text-white !border-red-600 hover:!bg-red-700"
          >
            删除
          </Button>
        </div>
      </div>

      {/* 图片 */}
      <Card className="p-0 overflow-hidden">
        <div className="aspect-square bg-[var(--gray-100)] relative">
          {clothing.image_url ? (
            <img
              src={clothing.image_url}
              alt={clothing.name || '衣物'}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-24 h-24 text-[var(--gray-400)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>
      </Card>

      {/* 基本信息 */}
      <Card>
        <h2 className="text-2xl font-bold mb-4 text-[#1a1a1a]">
          {clothing.name || '未命名衣物'}
        </h2>

        <div className="space-y-3">
          {category && (
            <div className="flex items-center">
              <span className="text-sm text-[var(--gray-600)] w-20">分类</span>
              <span className="text-sm font-medium text-[#1a1a1a]">{category.name}</span>
            </div>
          )}

          {clothing.brand && (
            <div className="flex items-center">
              <span className="text-sm text-[var(--gray-600)] w-20">品牌</span>
              <span className="text-sm font-medium text-[#1a1a1a]">{clothing.brand}</span>
            </div>
          )}

          {clothing.price && (
            <div className="flex items-center">
              <span className="text-sm text-[var(--gray-600)] w-20">价格</span>
              <span className="text-lg font-bold text-[var(--primary)]">¥{clothing.price.toLocaleString()}</span>
            </div>
          )}

          <div className="flex items-center">
            <span className="text-sm text-[var(--gray-600)] w-20">状态</span>
            <span className="text-sm font-medium text-[#1a1a1a]">{getStatusLabel(clothing.status)}</span>
          </div>

          {clothing.colors && clothing.colors.length > 0 && (
            <div className="flex items-start">
              <span className="text-sm text-[var(--gray-600)] w-20">颜色</span>
              <div className="flex flex-wrap gap-2">
                {clothing.colors.map((color, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-white text-[#1a1a1a] text-sm rounded-full border border-[var(--gray-300)] font-medium"
                  >
                    {color}
                  </span>
                ))}
              </div>
            </div>
          )}

          {clothing.seasons && clothing.seasons.length > 0 && (
            <div className="flex items-start">
              <span className="text-sm text-[var(--gray-600)] w-20">季节</span>
              <div className="flex flex-wrap gap-2">
                {clothing.seasons.map((season, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-white text-[#1a1a1a] text-sm rounded-full border border-[var(--gray-300)] font-medium"
                  >
                    {season}
                  </span>
                ))}
              </div>
            </div>
          )}

          {clothing.purchase_date && (
            <div className="flex items-center">
              <span className="text-sm text-[var(--gray-600)] w-20">购买日期</span>
              <span className="text-sm font-medium text-[#1a1a1a]">
                {new Date(clothing.purchase_date).toLocaleDateString('zh-CN')}
              </span>
            </div>
          )}

          {clothing.notes && (
            <div className="flex items-start pt-2">
              <span className="text-sm text-[var(--gray-600)] w-20">备注</span>
              <p className="text-sm text-[#1a1a1a] flex-1">{clothing.notes}</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
