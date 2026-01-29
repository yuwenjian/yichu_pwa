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
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false)
  
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
      <div className="max-w-3xl mx-auto space-y-4 pb-20">
        {/* 顶部按钮 - PC端文字按钮，移动端图标按钮 */}
        
        {/* PC端样式 - 隐藏在移动端 */}
        <div className="hidden md:flex items-center justify-between">
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

        {/* 移动端样式 - 隐藏在PC端 */}
        <div className="flex md:hidden items-center justify-between">
          {/* 返回按钮 */}
          <button 
            onClick={() => router.back()} 
            className="flex items-center gap-1 text-[var(--gray-900)] hover:text-[var(--accent-dark)] transition-colors -ml-1 px-2 py-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm">返回</span>
          </button>
          
          {/* 操作按钮 - 小文字按钮 */}
          <div className="flex gap-1.5">
            {/* 记录穿搭 */}
            <button
              onClick={handleRecordWear}
              disabled={incrementUseCountMutation.isPending}
              className="px-3 py-1.5 text-xs bg-[var(--accent-light)] text-[var(--gray-900)] rounded-lg hover:bg-[var(--accent)] transition-all disabled:opacity-40 shadow-sm hover:shadow active:scale-95 font-medium"
            >
              {incrementUseCountMutation.isPending ? (
                <span className="flex items-center gap-1">
                  <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  记录
                </span>
              ) : (
                '记录穿搭'
              )}
            </button>
            
            {/* 编辑 */}
            <button
              onClick={() => router.push(`/dashboard/wardrobes/${wardrobeId}/clothings/${clothingId}/edit`)}
              className="px-3 py-1.5 text-xs border border-[var(--gray-900)] text-[var(--gray-900)] rounded-lg hover:bg-[var(--gray-900)] hover:text-white transition-all shadow-sm hover:shadow active:scale-95 font-medium"
            >
              编辑
            </button>
            
            {/* 删除 */}
            <button
              onClick={handleDelete}
              className="px-3 py-1.5 text-xs bg-[var(--error)] text-white rounded-lg hover:bg-[var(--error-dark)] transition-all shadow-sm hover:shadow active:scale-95 font-medium"
            >
              删除
            </button>
          </div>
        </div>

        {/* 图片 */}
        <Card className="p-0 overflow-hidden">
          <div 
            className="aspect-square relative cursor-zoom-in group"
            style={{ 
              background: 'linear-gradient(rgba(128, 128, 128, 0.1), rgba(128, 128, 128, 0.1)), #d4b896'
            }}
            onClick={() => clothing.image_url && setIsImagePreviewOpen(true)}
          >
            {clothing.image_url ? (
              <>
                <img
                  src={clothing.image_url}
                  alt={clothing.name || '衣物'}
                  className="w-full h-full object-contain transition-all duration-300 group-hover:scale-[1.02]"
                />
                {/* 右下角微妙的放大提示 */}
                <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <div className="px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm flex items-center gap-1.5 shadow-lg">
                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                    <span className="text-xs text-white font-medium">查看大图</span>
                  </div>
                </div>
                {/* 轻微的渐变遮罩提示 */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </>
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

      {/* 图片预览模态框 */}
      {isImagePreviewOpen && clothing.image_url && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setIsImagePreviewOpen(false)}
        >
          {/* 关闭按钮 */}
          <button
            onClick={() => setIsImagePreviewOpen(false)}
            className="absolute top-4 right-4 z-10 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-all"
          >
            <svg className="w-6 h-6 md:w-7 md:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* 图片容器 */}
          <div 
            className="relative max-w-7xl max-h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={clothing.image_url}
              alt={clothing.name || '衣物'}
              className="max-w-full max-h-[90vh] object-contain shadow-2xl rounded-lg"
            />
          </div>

          {/* 底部信息提示 */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white text-sm">
            点击任意处关闭
          </div>
        </div>
      )}

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
