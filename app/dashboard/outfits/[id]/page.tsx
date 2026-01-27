'use client'

import { useParams, useRouter } from 'next/navigation'
import { useOutfit, useDeleteOutfit, useIncrementOutfitUseCount } from '@/lib/hooks/useOutfitsQuery'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import PullToRefresh from '@/components/ui/PullToRefresh'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Toast from '@/components/ui/Toast'
import { useConfirm, useToast } from '@/hooks/useDialog'

export default function OutfitDetailPage() {
  const params = useParams()
  const router = useRouter()
  const outfitId = params.id as string

  const { data: outfit, isLoading, refetch } = useOutfit(outfitId)
  const deleteOutfitMutation = useDeleteOutfit()
  const incrementUseCountMutation = useIncrementOutfitUseCount()

  const confirmDialog = useConfirm()
  const toast = useToast()

  const handleRefresh = async () => {
    await refetch()
  }

  const handleDelete = async () => {
    const confirmed = await confirmDialog.confirm({
      title: '删除搭配',
      message: `确定要删除搭配 ${outfit?.name} 吗？`,
      confirmText: '删除',
      cancelText: '取消',
      variant: 'danger',
    })

    if (!confirmed) return

    try {
      await deleteOutfitMutation.mutateAsync(outfitId)
      toast.success('删除成功')
      setTimeout(() => {
        router.push('/dashboard/outfits')
      }, 500)
    } catch (error) {
      console.error('Error deleting outfit:', error)
      toast.error('删除失败，请重试')
    }
  }

  const handleUse = async () => {
    try {
      await incrementUseCountMutation.mutateAsync(outfitId)
      toast.success('已记录本次使用')
    } catch (error) {
      console.error('Error incrementing use count:', error)
      toast.error('操作失败，请重试')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--primary)]"></div>
      </div>
    )
  }

  if (!outfit) {
    return (
      <Card className="text-center py-12">
        <p className="text-[var(--gray-600)] mb-4 font-medium">搭配不存在</p>
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard/outfits')}
        >
          返回列表
        </Button>
      </Card>
    )
  }

  return (
    <>
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="max-w-4xl mx-auto space-y-8 pb-20">
        {/* 顶部按钮 - Editorial风格 */}
        <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="-ml-2"
        >
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
            onClick={handleUse}
            isLoading={incrementUseCountMutation.isPending}
          >
            记录穿搭
          </Button>
          <Button
            variant="outline"
            onClick={handleDelete}
            isLoading={deleteOutfitMutation.isPending}
            className="!bg-[var(--error)] !text-white !border-[var(--error)] hover:!bg-[var(--error-dark)]"
          >
            删除
          </Button>
        </div>
      </div>

      {/* 搭配信息 - Editorial风格 */}
      <Card className="p-6">
        <h1 className="text-display text-3xl md:text-4xl mb-3 text-[var(--gray-900)]">{outfit.name}</h1>
        {outfit.description && (
          <p className="text-editorial text-lg text-[var(--gray-600)] mb-6">{outfit.description}</p>
        )}
        
        <div className="h-px w-24 bg-gradient-to-r from-[var(--accent)] to-transparent mb-4" />
        
        <div className="flex items-center gap-6 text-sm text-[var(--gray-600)]">
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
            使用 {outfit.use_count} 次
          </span>
          {outfit.last_used_at && (
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
              最近使用: {new Date(outfit.last_used_at).toLocaleDateString('zh-CN')}
            </span>
          )}
          {outfit.is_template && (
            <span className="px-3 py-1 bg-[var(--primary)] text-white text-xs rounded-[var(--radius-full)] font-medium">
              模板
            </span>
          )}
        </div>
      </Card>

      {/* 搭配单品 - Editorial风格 */}
      <Card className="p-6">
        <h2 className="text-2xl font-medium mb-5 text-[var(--gray-900)]">
          单品列表 <span className="text-[var(--gray-600)] text-lg">({outfit.items?.length || 0})</span>
        </h2>
        
        {!outfit.items || outfit.items.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--accent)]/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-[var(--accent-dark)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p className="text-editorial text-[var(--gray-600)]">该搭配没有关联衣物</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {outfit.items.map((item, index) => (
              <div
                key={item.id}
                className={`cursor-pointer group animate-fade-in stagger-${Math.min(index % 5 + 1, 5)}`}
                onClick={() => router.push(`/dashboard/wardrobes/${item.clothing.wardrobe_id}/clothings/${item.clothing.id}`)}
              >
                <div className="aspect-square rounded-[var(--radius-lg)] overflow-hidden bg-[var(--gray-100)] shadow-[var(--shadow-subtle)] hover:shadow-[var(--shadow-soft)] transition-all group-hover:scale-105"
                  style={{ transition: 'all var(--transition-smooth)' }}
                >
                  <img
                    src={item.clothing.image_url}
                    alt={item.clothing.name || '衣物'}
                    className="w-full h-full object-cover"
                  />
                </div>
                {item.clothing.name && (
                  <p className="mt-2 text-sm text-[var(--gray-900)] text-center line-clamp-1 group-hover:text-[var(--accent-dark)] transition-colors">
                    {item.clothing.name}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 提示信息 - Editorial风格 */}
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
                <span>点击【记录穿搭】可以增加使用次数统计</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--accent)] mt-1">•</span>
                <span>点击单品图片可以查看衣物详情</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--accent)] mt-1">•</span>
                <span>可以编辑或删除这套搭配</span>
              </li>
            </ul>
          </div>
        </div>
      </Card>
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
    </>
  )
}
