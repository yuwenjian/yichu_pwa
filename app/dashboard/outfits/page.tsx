'use client'

import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { useOutfitsByUser, useDeleteOutfit } from '@/lib/hooks/useOutfitsQuery'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import PullToRefresh from '@/components/ui/PullToRefresh'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Toast from '@/components/ui/Toast'
import { useConfirm, useToast } from '@/hooks/useDialog'
import { useState, useMemo } from 'react'

export default function OutfitsPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { data: outfits = [], isLoading, refetch } = useOutfitsByUser(user?.id)
  const deleteOutfitMutation = useDeleteOutfit()

  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [selectedTag, setSelectedTag] = useState<string>('all')
  const [selectedSeason, setSelectedSeason] = useState<string>('all')

  const confirmDialog = useConfirm()
  const toast = useToast()

  const handleRefresh = async () => {
    await refetch()
  }

  // 提取所有标签和季节
  const allTags = useMemo(() => {
    const tags = new Set<string>()
    outfits.forEach(outfit => {
      outfit.tags?.forEach(tag => tags.add(tag))
    })
    return Array.from(tags)
  }, [outfits])

  const allSeasons = ['春', '夏', '秋', '冬']

  // 过滤后的搭配
  const filteredOutfits = useMemo(() => {
    return outfits.filter(outfit => {
      const matchTag = selectedTag === 'all' || outfit.tags?.includes(selectedTag)
      const matchSeason = selectedSeason === 'all' || outfit.seasons?.includes(selectedSeason)
      return matchTag && matchSeason
    })
  }, [outfits, selectedTag, selectedSeason])

  const handleDelete = async (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation()
    
    const confirmed = await confirmDialog.confirm({
      title: '删除搭配',
      message: `确定要删除搭配 ${name} 吗？`,
      confirmText: '删除',
      cancelText: '取消',
      variant: 'danger',
    })

    if (!confirmed) return

    setDeletingId(id)
    try {
      await deleteOutfitMutation.mutateAsync(id)
      toast.success('删除成功')
    } catch (error) {
      console.error('Error deleting outfit:', error)
      toast.error('删除失败，请重试')
    } finally {
      setDeletingId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--primary)]"></div>
      </div>
    )
  }

  return (
    <>
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="space-y-8 pb-20">
        {/* 顶部标题 - Editorial风格 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs tracking-[0.2em] uppercase text-[var(--gray-500)] mb-2">MY LOOKS</p>
              <h1 className="text-display text-4xl md:text-5xl text-[var(--gray-900)]">
                我的搭配
              </h1>
            </div>
            <Button
              variant="primary"
              onClick={() => router.push('/dashboard/outfits/new')}
              className="flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              创建搭配
            </Button>
          </div>
          <div className="h-px w-32 bg-gradient-to-r from-[var(--accent)] to-transparent" />
        </div>

      {/* 筛选栏 - Editorial风格 */}
      {outfits.length > 0 && (
        <Card className="p-5">
          <div className="space-y-5">
            {/* 标签筛选 */}
            <div>
              <span className="text-xs font-medium text-[var(--gray-600)] mb-3 block tracking-wide uppercase">标签筛选</span>
              <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-hide">
                <button
                  onClick={() => setSelectedTag('all')}
                  className={`px-4 py-2 rounded-[var(--radius-full)] text-sm font-medium transition-all whitespace-nowrap ${
                    selectedTag === 'all'
                      ? 'bg-[var(--accent-dark)] text-white shadow-[var(--shadow-soft)]'
                      : 'border border-[var(--gray-300)] text-[var(--gray-700)] hover:border-[var(--accent)] hover:bg-[var(--accent)]/5 bg-[var(--card-bg)]'
                  }`}
                  style={{ transition: 'all var(--transition-smooth)' }}
                >
                  全部
                </button>
                {allTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(tag)}
                    className={`px-4 py-2 rounded-[var(--radius-full)] text-sm font-medium transition-all whitespace-nowrap ${
                      selectedTag === tag
                        ? 'bg-[var(--accent-dark)] text-white shadow-[var(--shadow-soft)]'
                        : 'border border-[var(--gray-300)] text-[var(--gray-700)] hover:border-[var(--accent)] hover:bg-[var(--accent)]/5 bg-[var(--card-bg)]'
                    }`}
                    style={{ transition: 'all var(--transition-smooth)' }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* 季节筛选 */}
            <div className="border-t border-[var(--gray-200)] pt-4">
              <span className="text-xs font-medium text-[var(--gray-600)] mb-3 block tracking-wide uppercase">季节筛选</span>
              <div className="flex items-center gap-2.5 overflow-x-auto scrollbar-hide">
                <button
                  onClick={() => setSelectedSeason('all')}
                  className={`px-4 py-2 rounded-[var(--radius-full)] text-sm font-medium transition-all whitespace-nowrap ${
                    selectedSeason === 'all'
                      ? 'bg-[var(--primary)] text-white shadow-[var(--shadow-soft)]'
                      : 'border border-[var(--gray-300)] text-[var(--gray-700)] hover:border-[var(--primary)] hover:bg-[var(--primary)]/5 bg-[var(--card-bg)]'
                  }`}
                  style={{ transition: 'all var(--transition-smooth)' }}
                >
                  全部
                </button>
                {allSeasons.map(season => (
                  <button
                    key={season}
                    onClick={() => setSelectedSeason(season)}
                    className={`px-4 py-2 rounded-[var(--radius-full)] text-sm font-medium transition-all whitespace-nowrap ${
                      selectedSeason === season
                        ? 'bg-[var(--primary)] text-white shadow-[var(--shadow-soft)]'
                        : 'border border-[var(--gray-300)] text-[var(--gray-700)] hover:border-[var(--primary)] hover:bg-[var(--primary)]/5 bg-[var(--card-bg)]'
                    }`}
                    style={{ transition: 'all var(--transition-smooth)' }}
                  >
                    {season}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {outfits.length === 0 ? (
        <Card className="text-center py-16 border-dashed">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--accent)]/10 flex items-center justify-center">
            <svg className="w-10 h-10 text-[var(--accent-dark)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
          </div>
          <h3 className="text-2xl font-medium mb-3 text-[var(--gray-900)]">创建你的第一个搭配</h3>
          <p className="text-editorial text-lg text-[var(--gray-600)] mb-8 max-w-md mx-auto">
            开始创建搭配组合，展示你的时尚品味
          </p>
          <Button
            variant="primary"
            size="lg"
            onClick={() => router.push('/dashboard/outfits/new')}
          >
            创建搭配
          </Button>
        </Card>
      ) : filteredOutfits.length === 0 ? (
        <Card className="text-center py-16">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--accent)]/10 flex items-center justify-center">
            <svg className="w-10 h-10 text-[var(--accent-dark)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-2xl font-medium mb-3 text-[var(--gray-900)]">未找到匹配的搭配</h3>
          <p className="text-editorial text-lg text-[var(--gray-600)] mb-8">
            尝试调整筛选条件
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setSelectedTag('all')
              setSelectedSeason('all')
            }}
          >
            重置筛选
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOutfits.map((outfit, index) => (
            <div key={outfit.id} className="relative group">
              <Card
                hover
                className={`p-0 overflow-hidden cursor-pointer flex flex-col h-full animate-fade-in stagger-${Math.min(index % 5 + 1, 5)}`}
                onClick={() => router.push(`/dashboard/outfits/${outfit.id}`)}
              >
                <div className="aspect-[4/5] bg-[var(--gray-100)] relative overflow-hidden">
                  {outfit.image_url ? (
                    <img
                      src={outfit.image_url}
                      alt={outfit.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-24 h-24 text-[var(--gray-400)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  {/* 图片上的覆盖层 */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* 悬浮显示的标签和季节 */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 max-w-[80%]">
                    {outfit.seasons?.map(s => (
                      <span key={s} className="px-2.5 py-1 bg-[var(--primary)]/90 text-white text-xs rounded-[var(--radius-md)] backdrop-blur-sm font-medium">
                        {s}
                      </span>
                    ))}
                    {outfit.tags?.map(t => (
                      <span key={t} className="px-2.5 py-1 bg-[var(--accent)]/90 text-white text-xs rounded-[var(--radius-md)] backdrop-blur-sm font-medium">
                        {t}
                      </span>
                    ))}
                  </div>
                  {outfit.is_template && (
                    <div className="absolute top-3 right-3 px-2.5 py-1 bg-[var(--primary)] text-white text-xs rounded-[var(--radius-md)] font-medium">
                      模板
                    </div>
                  )}
                </div>
                <div className="p-5 bg-[var(--card-bg)] flex-1 flex flex-col">
                  <h3 className="text-lg font-medium mb-2 text-[var(--gray-900)] group-hover:text-[var(--accent-dark)] transition-colors">
                    {outfit.name}
                  </h3>
                  {outfit.description && (
                    <p className="text-editorial text-sm text-[var(--gray-600)] mb-4 line-clamp-2">
                      {outfit.description}
                    </p>
                  )}
                  <div className="mt-auto flex items-center justify-between text-xs text-[var(--gray-600)]">
                    <div className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>使用 {outfit.use_count} 次</span>
                    </div>
                    {outfit.last_used_at && (
                      <span>{new Date(outfit.last_used_at).toLocaleDateString('zh-CN')}</span>
                    )}
                  </div>
                </div>
              </Card>
              
              {/* 删除按钮 */}
              <button
                onClick={(e) => handleDelete(outfit.id, outfit.name, e)}
                disabled={deletingId === outfit.id}
                className="absolute top-3 right-3 p-2.5 bg-[var(--error)] text-white rounded-full opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-95 shadow-[var(--shadow-elevated)] z-10 disabled:opacity-50"
                style={{ transition: 'all var(--transition-smooth)' }}
                title="删除搭配"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
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
