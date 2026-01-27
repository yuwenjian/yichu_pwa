'use client'

import { useEffect, useState, Fragment } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Clothing, Category } from '@/types'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import PullToRefresh from '@/components/ui/PullToRefresh'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Toast from '@/components/ui/Toast'
import { useConfirm, useToast } from '@/hooks/useDialog'

export default function ClothingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const wardrobeId = params.id as string
  const clothingId = params.clothingId as string

  const [clothing, setClothing] = useState<Clothing | null>(null)
  const [category, setCategory] = useState<Category | null>(null)
  const [loading, setLoading] = useState(true)
  
  const confirmDialog = useConfirm()
  const toast = useToast()

  useEffect(() => {
    loadClothingDetail()
  }, [clothingId])

  const loadClothingDetail = async () => {
    setLoading(true)
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
      toast.error('加载失败')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    await loadClothingDetail()
  }

  const handleDelete = async () => {
    const confirmed = await confirmDialog.confirm({
      title: '删除衣物',
      message: '确定要删除这件衣物吗？',
      confirmText: '删除',
      cancelText: '取消',
      variant: 'danger',
    })

    if (!confirmed) return

    try {
      const { error } = await supabase
        .from('clothings')
        .delete()
        .eq('id', clothingId)

      if (error) throw error

      toast.success('删除成功')
      setTimeout(() => {
        router.push(`/dashboard/wardrobes/${wardrobeId}/clothings`)
      }, 500)
    } catch (error) {
      console.error('Error deleting clothing:', error)
      toast.error('删除失败，请重试')
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
    <Fragment>
      <PullToRefresh onRefresh={handleRefresh}>
      <div className="max-w-3xl mx-auto space-y-8 pb-20">
        {/* 顶部按钮 - Editorial风格 */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.back()} className="-ml-2">
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              返回
            </span>
          </Button>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => router.push(`/dashboard/wardrobes/${wardrobeId}/clothings/${clothingId}/edit`)}
            >
              编辑
            </Button>
            <Button 
              variant="outline" 
              onClick={handleDelete} 
              className="!bg-[var(--error)] !text-white !border-[var(--error)] hover:!bg-[var(--error-dark)]"
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

        {/* 基本信息 - Editorial风格 */}
        <Card className="p-6">
          <h2 className="text-display text-3xl mb-6 text-[var(--gray-900)]">
            {clothing.name || '未命名衣物'}
          </h2>
          
          <div className="h-px w-24 bg-gradient-to-r from-[var(--accent)] to-transparent mb-6" />

          <div className="space-y-4">
            {category && (
              <div className="flex items-center">
                <span className="text-sm text-[var(--gray-600)] w-24 tracking-wide">分类</span>
                <span className="text-sm font-medium text-[var(--gray-900)]">{category.name}</span>
              </div>
            )}

            {clothing.brand && (
              <div className="flex items-center">
                <span className="text-sm text-[var(--gray-600)] w-24 tracking-wide">品牌</span>
                <span className="text-sm font-medium text-[var(--gray-900)]">{clothing.brand}</span>
              </div>
            )}

            {clothing.price && (
              <div className="flex items-center">
                <span className="text-sm text-[var(--gray-600)] w-24 tracking-wide">价格</span>
                <span className="text-lg font-bold text-[var(--accent-dark)]">¥{clothing.price.toLocaleString()}</span>
              </div>
            )}

            <div className="flex items-center">
              <span className="text-sm text-[var(--gray-600)] w-24 tracking-wide">状态</span>
              <span className="text-sm font-medium text-[var(--gray-900)]">{getStatusLabel(clothing.status)}</span>
            </div>

            {clothing.colors && clothing.colors.length > 0 && (
              <div className="flex items-start">
                <span className="text-sm text-[var(--gray-600)] w-24 tracking-wide">颜色</span>
                <div className="flex flex-wrap gap-2">
                  {clothing.colors.map((color, index) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 bg-[var(--accent)]/10 text-[var(--accent-dark)] text-sm rounded-[var(--radius-full)] border border-[var(--accent)]/20 font-medium"
                    >
                      {color}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {clothing.seasons && clothing.seasons.length > 0 && (
              <div className="flex items-start">
                <span className="text-sm text-[var(--gray-600)] w-24 tracking-wide">季节</span>
                <div className="flex flex-wrap gap-2">
                  {clothing.seasons.map((season, index) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 bg-[var(--accent)]/10 text-[var(--accent-dark)] text-sm rounded-[var(--radius-full)] border border-[var(--accent)]/20 font-medium"
                    >
                      {season}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {clothing.purchase_date && (
              <div className="flex items-center">
                <span className="text-sm text-[var(--gray-600)] w-24 tracking-wide">购买日期</span>
                <span className="text-sm font-medium text-[var(--gray-900)]">
                  {new Date(clothing.purchase_date).toLocaleDateString('zh-CN')}
                </span>
              </div>
            )}

            {clothing.notes && (
              <div className="flex items-start pt-4 border-t border-[var(--gray-200)]">
                <span className="text-sm text-[var(--gray-600)] w-24 tracking-wide">备注</span>
                <p className="text-editorial text-[var(--gray-900)] flex-1 leading-relaxed">{clothing.notes}</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </PullToRefresh>

      {/* 对话框和提示 */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.options.title}
        message={confirmDialog.options.message}
        confirmText={confirmDialog.options.confirmText}
        cancelText={confirmDialog.options.cancelText}
        variant={confirmDialog.options.variant}
        onConfirm={confirmDialog.handleConfirm}
        onCancel={confirmDialog.handleCancel}
      />
      <Toast
        isOpen={toast.isOpen}
        message={toast.options.message}
        type={toast.options.type}
        duration={toast.options.duration}
        onClose={toast.handleClose}
      />
    </Fragment>
  )
}
