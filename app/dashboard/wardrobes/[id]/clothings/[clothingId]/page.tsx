'use client'

import { useEffect, useState, Fragment } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useClothing, useIncrementClothingUseCount } from '@/lib/hooks/useClothingsQuery'
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

  const { data: clothing, isLoading, refetch } = useClothing(clothingId)
  const incrementUseCountMutation = useIncrementClothingUseCount()
  
  const [category, setCategory] = useState<Category | null>(null)
  
  const confirmDialog = useConfirm()
  const toast = useToast()

  useEffect(() => {
    if (clothing?.category_id) {
      loadCategory(clothing.category_id)
    }
  }, [clothing?.category_id])

  const loadCategory = async (categoryId: string) => {
    try {
      const { data: categoryData } = await supabase
        .from('categories')
        .select('*')
        .eq('id', categoryId)
        .single()

      if (categoryData) {
        setCategory(categoryData)
      }
    } catch (error) {
      console.error('Error loading category:', error)
    }
  }

  const handleRefresh = async () => {
    await refetch()
  }

  const handleRecordWear = async () => {
    try {
      await incrementUseCountMutation.mutateAsync(clothingId)
      toast.success('已记录本次穿搭')
    } catch (error) {
      console.error('Error incrementing use count:', error)
      toast.error('操作失败，请重试')
    }
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

  if (isLoading) {
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
              variant="primary"
              onClick={handleRecordWear}
              isLoading={incrementUseCountMutation.isPending}
            >
              记录穿搭
            </Button>
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
          <h2 className="text-display text-3xl mb-3 text-[var(--gray-900)]">
            {clothing.name || '未命名衣物'}
          </h2>
          
          {/* 使用统计 */}
          <div className="flex items-center gap-6 text-sm text-[var(--gray-600)] mb-6">
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
              穿搭 {clothing.use_count || 0} 次
            </span>
            {clothing.last_used_at && (
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                最近穿搭: {new Date(clothing.last_used_at).toLocaleDateString('zh-CN')}
              </span>
            )}
          </div>
          
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

        {/* 使用提示 - Editorial风格 */}
        <Card className="p-6 border border-[var(--accent)]/20 bg-gradient-to-br from-[var(--accent)]/5 to-transparent">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-[var(--accent)]/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-[var(--accent-dark)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium mb-3 text-[var(--gray-900)]">使用提示</h3>
              <ul className="space-y-2 text-sm text-[var(--gray-700)]">
                <li className="flex items-start gap-2">
                  <span className="text-[var(--accent)] mt-1">•</span>
                  <span>点击【记录穿搭】可以增加穿搭次数统计</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--accent)] mt-1">•</span>
                  <span>系统会记录最后一次穿搭的时间</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--accent)] mt-1">•</span>
                  <span>穿搭统计数据可在统计页面查看分析</span>
                </li>
              </ul>
            </div>
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
