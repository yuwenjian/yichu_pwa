'use client'

import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { useOutfitsByUser, useDeleteOutfit } from '@/lib/hooks/useOutfitsQuery'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { useState, useMemo } from 'react'

export default function OutfitsPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { data: outfits = [], isLoading } = useOutfitsByUser(user?.id)
  const deleteOutfitMutation = useDeleteOutfit()

  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [selectedTag, setSelectedTag] = useState<string>('all')
  const [selectedSeason, setSelectedSeason] = useState<string>('all')

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
    
    if (!confirm(`确定要删除搭配 ${name} 吗？`)) {
      return
    }

    setDeletingId(id)
    try {
      await deleteOutfitMutation.mutateAsync(id)
    } catch (error) {
      console.error('Error deleting outfit:', error)
      alert('删除失败，请重试')
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
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
          我的搭配
        </h1>
        <Button
          variant="primary"
          onClick={() => router.push('/dashboard/outfits/new')}
        >
          + 创建搭配
        </Button>
      </div>

      {/* 筛选栏 */}
      {outfits.length > 0 && (
        <Card className="p-4 bg-white/10 backdrop-blur-md border-white/20">
          <div className="space-y-4">
            {/* 标签筛选 */}
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
              <span className="text-sm font-medium text-white/60 whitespace-nowrap">标签:</span>
              <button
                onClick={() => setSelectedTag('all')}
                className={`px-3 py-1.5 rounded-full text-xs transition-all whitespace-nowrap ${
                  selectedTag === 'all'
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'bg-white/10 text-white/80 hover:bg-white/20'
                }`}
              >
                全部
              </button>
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-3 py-1.5 rounded-full text-xs transition-all whitespace-nowrap ${
                    selectedTag === tag
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'bg-white/10 text-white/80 hover:bg-white/20'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* 季节筛选 */}
            <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide">
              <span className="text-sm font-medium text-white/60 whitespace-nowrap">季节:</span>
              <button
                onClick={() => setSelectedSeason('all')}
                className={`px-3 py-1.5 rounded-full text-xs transition-all whitespace-nowrap ${
                  selectedSeason === 'all'
                    ? 'bg-orange-500 text-white shadow-lg'
                    : 'bg-white/10 text-white/80 hover:bg-white/20'
                }`}
              >
                全部
              </button>
              {allSeasons.map(season => (
                <button
                  key={season}
                  onClick={() => setSelectedSeason(season)}
                  className={`px-3 py-1.5 rounded-full text-xs transition-all whitespace-nowrap ${
                    selectedSeason === season
                      ? 'bg-orange-500 text-white shadow-lg'
                      : 'bg-white/10 text-white/80 hover:bg-white/20'
                  }`}
                >
                  {season}
                </button>
              ))}
            </div>
          </div>
        </Card>
      )}

      {outfits.length === 0 ? (
        <Card className="text-center py-16">
          <div className="text-6xl mb-4">👗</div>
          <h3 className="text-xl font-semibold mb-2 text-[#1a1a1a]">还没有搭配</h3>
          <p className="text-[#5c5954] mb-6">
            创建你的第一个搭配组合，展示你的时尚品味
          </p>
          <Button
            variant="primary"
            onClick={() => router.push('/dashboard/outfits/new')}
          >
            创建搭配
          </Button>
        </Card>
      ) : filteredOutfits.length === 0 ? (
        <Card className="text-center py-16">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold mb-2 text-[#1a1a1a]">未找到匹配的搭配</h3>
          <p className="text-[#5c5954] mb-6">
            尝试调整筛选条件
          </p>
          <Button
            variant="ghost"
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
          {filteredOutfits.map((outfit) => (
            <div key={outfit.id} className="relative group">
              <Card
                hover
                className="p-0 overflow-hidden cursor-pointer flex flex-col h-full"
                onClick={() => router.push(`/dashboard/outfits/${outfit.id}`)}
              >
                <div className="aspect-[4/5] bg-[var(--gray-100)] relative">
                  {outfit.image_url ? (
                    <img
                      src={outfit.image_url}
                      alt={outfit.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-24 h-24 text-[var(--gray-400)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  {/* 悬浮显示的标签和季节 */}
                  <div className="absolute top-2 left-2 flex flex-wrap gap-1 max-w-[80%]">
                    {outfit.seasons?.map(s => (
                      <span key={s} className="px-2 py-0.5 bg-orange-500/90 text-white text-[10px] rounded-full backdrop-blur-sm">
                        {s}
                      </span>
                    ))}
                    {outfit.tags?.map(t => (
                      <span key={t} className="px-2 py-0.5 bg-blue-500/90 text-white text-[10px] rounded-full backdrop-blur-sm">
                        {t}
                      </span>
                    ))}
                  </div>
                  {outfit.is_template && (
                    <div className="absolute top-2 right-2 px-2 py-1 bg-[var(--primary)] text-white text-xs rounded">
                      模板
                    </div>
                  )}
                </div>
                <div className="p-4 bg-white flex-1 flex flex-col">
                  <h3 className="text-lg font-semibold mb-1 text-[#1a1a1a]">{outfit.name}</h3>
                  {outfit.description && (
                    <p className="text-sm text-[#5c5954] mb-4 line-clamp-2">
                      {outfit.description}
                    </p>
                  )}
                  <div className="mt-auto flex items-center justify-between text-xs text-[#5c5954]">
                    <div className="flex items-center gap-1">
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
                className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 shadow-lg z-10 disabled:opacity-50"
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
    </div>
  )
}
