'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { useWardrobes } from '@/lib/hooks/useWardrobesQuery'
import { useClothings } from '@/lib/hooks/useClothingsQuery'
import { useCategories } from '@/lib/hooks/useCategoriesQuery'
import { useCreateOutfit } from '@/lib/hooks/useOutfitsQuery'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import OutfitCanvasModal from '@/components/outfits/OutfitCanvasModal'
import Toast from '@/components/ui/Toast'
import { useToast } from '@/hooks/useDialog'
import type { Clothing } from '@/types'
import { supabase } from '@/lib/supabase'

export default function NewOutfitPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { data: wardrobes = [] } = useWardrobes(user?.id)
  
  const [selectedWardrobeId, setSelectedWardrobeId] = useState<string>('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [customTag, setCustomTag] = useState('')
  const [selectedSeasons, setSelectedSeasons] = useState<string[]>([])
  const [description, setDescription] = useState('')
  const [selectedClothings, setSelectedClothings] = useState<Clothing[]>([])
  const [isClothingModalOpen, setIsClothingModalOpen] = useState(false)
  const [isCanvasModalOpen, setIsCanvasModalOpen] = useState(false)
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isAddingCustomTag, setIsAddingCustomTag] = useState(false)

  const toast = useToast()

  const PRESET_TAGS = ['通勤', '周末', '运动', '聚会']
  const PRESET_SEASONS = ['春', '夏', '秋', '冬']
  
  // 分类筛选相关
  const [selectedLevel1CategoryId, setSelectedLevel1CategoryId] = useState<string>('all')
  const [selectedLevel2CategoryId, setSelectedLevel2CategoryId] = useState<string>('all')
  
  const { data: clothings = [] } = useClothings({ wardrobeId: selectedWardrobeId })
  const { data: categories = [] } = useCategories(selectedWardrobeId)
  const createOutfitMutation = useCreateOutfit()

  // 获取一级分类和二级分类
  const level1Categories = useMemo(() => {
    return categories.filter(cat => cat.level === 1)
  }, [categories])

  const level2Categories = useMemo(() => {
    if (selectedLevel1CategoryId === 'all') return []
    return categories.filter(cat => cat.level === 2 && cat.parent_id === selectedLevel1CategoryId)
  }, [categories, selectedLevel1CategoryId])

  // 根据分类筛选衣物
  const filteredClothings = useMemo(() => {
    let filtered = clothings

    if (selectedLevel2CategoryId !== 'all') {
      // 如果选择了二级分类，按二级分类筛选
      filtered = filtered.filter(c => c.category_id === selectedLevel2CategoryId)
    } else if (selectedLevel1CategoryId !== 'all') {
      // 如果只选择了一级分类，显示该一级分类下所有二级分类的衣物
      const level2Ids = categories
        .filter(cat => cat.level === 2 && cat.parent_id === selectedLevel1CategoryId)
        .map(cat => cat.id)
      filtered = filtered.filter(c => level2Ids.includes(c.category_id))
    }

    return filtered
  }, [clothings, selectedLevel1CategoryId, selectedLevel2CategoryId, categories])

  // 默认选择第一个衣橱
  useEffect(() => {
    if (wardrobes.length > 0 && !selectedWardrobeId) {
      setSelectedWardrobeId(wardrobes[0].id)
    }
  }, [wardrobes, selectedWardrobeId])

  const toggleClothing = (clothing: Clothing) => {
    setSelectedClothings(prev => {
      const exists = prev.find(c => c.id === clothing.id)
      if (exists) {
        return prev.filter(c => c.id !== clothing.id)
      } else {
        return [...prev, clothing]
      }
    })
    // 选中的衣物变化时，清除已生成的图片
    setGeneratedImageUrl(null)
  }

  const handleCanvasSave = async (dataUrl: string) => {
    setIsUploading(true)
    try {
      // 将 dataURL 转换为 Blob
      const res = await fetch(dataUrl)
      const blob = await res.blob()
      const file = new File([blob], `outfit_${Date.now()}.png`, { type: 'image/png' })

      // 获取当前 session
      const { data: { session } } = await supabase.auth.getSession()
      
      // 上传图片
      const formData = new FormData()
      formData.append('file', file)

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: formData,
      })

      const uploadData = await uploadRes.json()
      if (uploadData.success) {
        setGeneratedImageUrl(uploadData.data.imageUrl)
      } else {
        throw new Error(uploadData.error?.message || '上传失败')
      }
    } catch (error) {
      console.error('Error uploading canvas image:', error)
      toast.error('图片上传失败，请重试')
    } finally {
      setIsUploading(false)
    }
  }

  const handleCreate = async () => {
    if (selectedTags.length === 0 || selectedClothings.length === 0) {
      toast.warning('请选择至少一个标签并至少选择一件衣物')
      return
    }

    try {
      // 自动生成名称：标签 + 季节
      const generatedName = [...selectedTags, ...selectedSeasons].join(' · ')

      const outfit = await createOutfitMutation.mutateAsync({
        outfit: {
          wardrobe_id: selectedWardrobeId,
          name: generatedName,
          description: description.trim() || undefined,
          image_url: generatedImageUrl || selectedClothings[0].image_url,
          is_template: false,
          use_count: 0,
          tags: selectedTags,
          seasons: selectedSeasons,
        },
        clothingIds: selectedClothings.map(c => c.id),
      })

      toast.success('创建成功！')
      setTimeout(() => {
        router.push(`/dashboard/outfits/${outfit.id}`)
      }, 500)
    } catch (error) {
      console.error('Error creating outfit:', error)
      toast.error('创建失败，请重试')
    }
  }

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const toggleSeason = (season: string) => {
    setSelectedSeasons(prev => 
      prev.includes(season) ? prev.filter(s => s !== season) : [...prev, season]
    )
  }

  const addCustomTag = () => {
    if (!customTag.trim()) return
    if (!selectedTags.includes(customTag.trim())) {
      setSelectedTags(prev => [...prev, customTag.trim()])
    }
    setCustomTag('')
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-2"
        >
          ← 返回
        </Button>
        <div>
          <p className="text-xs tracking-[0.3em] uppercase text-[var(--accent-dark)] font-medium mb-3">
            CREATE YOUR LOOK
          </p>
          <h1 className="text-display text-5xl text-[var(--gray-900)] mb-3">
            创建搭配
          </h1>
          <div className="h-px w-24 bg-gradient-to-r from-[var(--accent)] to-transparent mb-4" />
          <p className="text-editorial text-lg text-[var(--gray-600)]">
            从你的衣橱中选择衣物，创建一套完美的搭配
          </p>
        </div>
      </div>

      <Card className="p-8">
        <div className="space-y-6">
          {/* 选择衣橱 */}
          <div>
            <label className="block text-sm font-medium text-[var(--gray-900)] mb-2 tracking-wide">
              选择衣橱
            </label>
            <select
              value={selectedWardrobeId}
              onChange={(e) => {
                setSelectedWardrobeId(e.target.value)
                setSelectedClothings([]) // 切换衣橱时清空选择
              }}
              className="w-full px-5 py-3.5 border border-[var(--gray-300)] rounded-[var(--radius-lg)] text-[var(--gray-900)] bg-[var(--input-bg)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)] shadow-[var(--shadow-subtle)] focus:shadow-[var(--shadow-soft)] transition-all duration-300"
            >
              {wardrobes.map(wardrobe => (
                <option key={wardrobe.id} value={wardrobe.id}>
                  {wardrobe.name}
                </option>
              ))}
            </select>
          </div>

          {/* 搭配标签 */}
          <div>
            <label className="block text-sm font-medium text-[var(--gray-900)] mb-3 tracking-wide">
              搭配标签
            </label>
            <div className="flex flex-wrap gap-3 mb-3">
              {PRESET_TAGS.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-5 py-2.5 rounded-[var(--radius-full)] border transition-all text-sm font-medium tracking-wide ${
                    selectedTags.includes(tag)
                      ? 'bg-[var(--accent-dark)] border-[var(--accent-dark)] text-white shadow-[var(--shadow-soft)]'
                      : 'border-[var(--gray-300)] text-[var(--gray-600)] hover:border-[var(--accent)] hover:text-[var(--accent-dark)] bg-[var(--card-bg)]'
                  }`}
                  style={{ transition: 'all var(--transition-smooth)' }}
                >
                  {tag}
                </button>
              ))}
              {selectedTags.filter(t => !PRESET_TAGS.includes(t)).map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className="px-5 py-2.5 rounded-[var(--radius-full)] bg-[var(--accent)] border border-[var(--accent)] text-white shadow-[var(--shadow-soft)] text-sm font-medium tracking-wide flex items-center gap-2 hover:bg-[var(--accent-dark)] transition-all"
                  style={{ transition: 'all var(--transition-smooth)' }}
                >
                  {tag}
                  <span className="text-base opacity-80">×</span>
                </button>
              ))}
              
              {!isAddingCustomTag && (
                <button
                  onClick={() => setIsAddingCustomTag(true)}
                  className="px-5 py-2.5 rounded-[var(--radius-full)] border border-dashed border-[var(--gray-300)] text-[var(--gray-500)] hover:border-[var(--accent)] hover:text-[var(--accent-dark)] transition-all text-sm font-medium tracking-wide flex items-center gap-2 bg-[var(--card-bg)]"
                  style={{ transition: 'all var(--transition-smooth)' }}
                >
                  <span className="text-xl leading-none">+</span> 自定义
                </button>
              )}
            </div>
            
            {isAddingCustomTag && (
              <div className="flex gap-3 animate-fade-in">
                <input
                  type="text"
                  autoFocus
                  value={customTag}
                  onChange={(e) => setCustomTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addCustomTag()
                    } else if (e.key === 'Escape') {
                      setIsAddingCustomTag(false)
                      setCustomTag('')
                    }
                  }}
                  placeholder="输入自定义标签名称..."
                  className="flex-1 px-5 py-2.5 border border-[var(--gray-300)] rounded-[var(--radius-lg)] text-sm text-[var(--gray-900)] bg-[var(--input-bg)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)] transition-all"
                  style={{ transition: 'all var(--transition-smooth)' }}
                />
                <Button variant="primary" size="sm" onClick={addCustomTag}>
                  添加
                </Button>
                <Button variant="ghost" size="sm" onClick={() => {
                  setIsAddingCustomTag(false)
                  setCustomTag('')
                }}>
                  取消
                </Button>
              </div>
            )}
          </div>

          {/* 适合季节 */}
          <div>
            <label className="block text-sm font-medium text-[var(--gray-900)] mb-3 tracking-wide">
              适合季节
            </label>
            <div className="flex gap-4">
              {PRESET_SEASONS.map(season => (
                <button
                  key={season}
                  onClick={() => toggleSeason(season)}
                  className={`w-14 h-14 rounded-[var(--radius-lg)] border flex items-center justify-center transition-all font-medium ${
                    selectedSeasons.includes(season)
                      ? 'bg-[var(--accent-dark)] border-[var(--accent-dark)] text-white shadow-[var(--shadow-soft)] scale-105'
                      : 'border-[var(--gray-300)] text-[var(--gray-600)] hover:border-[var(--accent)] hover:text-[var(--accent-dark)] bg-[var(--card-bg)]'
                  }`}
                  style={{ transition: 'all var(--transition-smooth)' }}
                >
                  {season}
                </button>
              ))}
            </div>
          </div>

          {/* 搭配描述 */}
          <div>
            <label className="block text-sm font-medium text-[var(--gray-900)] mb-2 tracking-wide">
              描述（可选）
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="描述这套搭配的风格、适用场合等..."
              rows={3}
              className="w-full px-5 py-3.5 border border-[var(--gray-300)] rounded-[var(--radius-lg)] text-[var(--gray-900)] bg-[var(--input-bg)] placeholder:text-[var(--gray-500)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)] resize-none shadow-[var(--shadow-subtle)] focus:shadow-[var(--shadow-soft)] transition-all"
              style={{ transition: 'all var(--transition-smooth)' }}
            />
          </div>

          {/* 选择衣物 */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-[var(--gray-900)] tracking-wide">
                选择衣物 
                {selectedClothings.length > 0 && (
                  <span className="ml-2 text-[var(--accent-dark)]">({selectedClothings.length})</span>
                )}
              </label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsClothingModalOpen(true)}
              >
                + 添加衣物
              </Button>
            </div>

            {selectedClothings.length === 0 ? (
              <div className="border border-dashed border-[var(--gray-300)] rounded-[var(--radius-xl)] p-12 text-center bg-[var(--surface)]">
                <div className="w-16 h-16 bg-[var(--accent)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">👔</span>
                </div>
                <p className="text-[var(--gray-600)] mb-4 text-editorial">还没有选择衣物</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsClothingModalOpen(true)}
                >
                  点击添加
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                  {selectedClothings.map(clothing => (
                    <div key={clothing.id} className="relative group">
                      <div className="aspect-square rounded-[var(--radius-lg)] overflow-hidden bg-[var(--gray-100)] border border-[var(--gray-200)] shadow-[var(--shadow-subtle)] group-hover:shadow-[var(--shadow-soft)] transition-all">
                        <img
                          src={clothing.image_url}
                          alt={clothing.name || '衣物'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <button
                        onClick={() => toggleClothing(clothing)}
                        className="absolute -top-2 -right-2 w-7 h-7 flex items-center justify-center bg-[var(--error)] text-white rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-[var(--shadow-medium)] hover:scale-110"
                        style={{ transition: 'all var(--transition-smooth)' }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col items-center p-8 bg-[var(--surface)] rounded-[var(--radius-xl)] border border-dashed border-[var(--gray-300)]">
                  {generatedImageUrl ? (
                    <div className="relative group">
                      <img
                        src={generatedImageUrl}
                        alt="搭配预览"
                        className="max-w-full h-56 rounded-[var(--radius-lg)] shadow-[var(--shadow-medium)] mb-4 group-hover:shadow-[var(--shadow-elevated)] transition-all"
                      />
                      <div className="absolute inset-0 bg-[var(--primary)]/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-[var(--radius-lg)] flex items-center justify-center backdrop-blur-sm">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setIsCanvasModalOpen(true)}
                        >
                          重新制作
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="w-12 h-12 bg-[var(--accent)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">✨</span>
                      </div>
                      <p className="text-sm text-[var(--gray-600)] mb-4 text-editorial">想要让搭配看起来更棒吗？</p>
                      <Button
                        variant="outline"
                        onClick={() => setIsCanvasModalOpen(true)}
                        isLoading={isUploading}
                      >
                        制作搭配组合图
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 操作按钮 */}
          <div className="flex justify-end gap-4 pt-6">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[var(--gray-200)] to-transparent" />
          </div>
          <div className="flex justify-end gap-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
            >
              取消
            </Button>
            <Button
              variant="primary"
              size="lg"
              onClick={handleCreate}
              isLoading={createOutfitMutation.isPending}
              disabled={selectedTags.length === 0 || selectedClothings.length === 0}
            >
              创建搭配
            </Button>
          </div>
        </div>
      </Card>

      {/* 选择衣物弹窗 */}
      <Modal
        isOpen={isClothingModalOpen}
        onClose={() => {
          setIsClothingModalOpen(false)
          // 关闭时重置筛选
          setSelectedLevel1CategoryId('all')
          setSelectedLevel2CategoryId('all')
        }}
        title={`选择衣物 (已选 ${selectedClothings.length})`}
        size="lg"
      >
        <div className="space-y-4">
          {/* 分类筛选 */}
          {categories.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-4 border-b border-gray-200">
              {/* 一级分类 */}
              <div>
                <label className="block text-xs font-medium text-[var(--gray-700)] mb-2 tracking-wide uppercase">
                  一级分类
                </label>
                <select
                  value={selectedLevel1CategoryId}
                  onChange={(e) => {
                    setSelectedLevel1CategoryId(e.target.value)
                    setSelectedLevel2CategoryId('all') // 重置二级分类
                  }}
                  className="w-full px-4 py-2.5 border border-[var(--gray-300)] rounded-[var(--radius-lg)] text-sm text-[var(--gray-900)] bg-[var(--input-bg)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)] transition-all"
                  style={{ transition: 'all var(--transition-smooth)' }}
                >
                  <option value="all">全部分类</option>
                  {level1Categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 二级分类 */}
              {selectedLevel1CategoryId !== 'all' && level2Categories.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-[var(--gray-700)] mb-2 tracking-wide uppercase">
                    二级分类
                  </label>
                  <select
                    value={selectedLevel2CategoryId}
                    onChange={(e) => setSelectedLevel2CategoryId(e.target.value)}
                    className="w-full px-4 py-2.5 border border-[var(--gray-300)] rounded-[var(--radius-lg)] text-sm text-[var(--gray-900)] bg-[var(--input-bg)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)] transition-all"
                    style={{ transition: 'all var(--transition-smooth)' }}
                  >
                    <option value="all">全部</option>
                    {level2Categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* 已选衣物数量提示 */}
          {selectedClothings.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 bg-[var(--accent)]/10 border border-[var(--accent)]/30 rounded-[var(--radius-lg)]">
              <span className="text-sm text-[var(--accent-dark)] font-medium">
                已选择 {selectedClothings.length} 件衣物
              </span>
              <button
                onClick={() => setSelectedClothings([])}
                className="text-sm text-[var(--accent-dark)] hover:text-[var(--accent)] font-medium transition-colors"
              >
                清空选择
              </button>
            </div>
          )}

          {/* 衣物列表 */}
          {clothings.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-[var(--accent)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">👔</span>
              </div>
              <p className="text-[var(--gray-600)] mb-4 text-editorial">该衣橱还没有衣物</p>
              <Button
                variant="primary"
                onClick={() => {
                  setIsClothingModalOpen(false)
                  router.push(`/dashboard/wardrobes/${selectedWardrobeId}/clothings/new`)
                }}
              >
                去添加衣物
              </Button>
            </div>
          ) : filteredClothings.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-[var(--accent)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">🔍</span>
              </div>
              <p className="text-[var(--gray-600)] mb-2 text-editorial">该分类下没有衣物</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedLevel1CategoryId('all')
                  setSelectedLevel2CategoryId('all')
                }}
              >
                查看全部
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 max-h-[50vh] overflow-y-auto p-1">
              {filteredClothings.map(clothing => {
                const isSelected = selectedClothings.some(c => c.id === clothing.id)
                return (
                  <div
                    key={clothing.id}
                    onClick={() => toggleClothing(clothing)}
                    className={`relative aspect-square rounded-[var(--radius-lg)] overflow-hidden cursor-pointer border transition-all group ${
                      isSelected
                        ? 'border-[var(--accent)] ring-2 ring-[var(--accent)]/30 shadow-[var(--shadow-soft)] scale-105'
                        : 'border-[var(--gray-300)] hover:border-[var(--accent-light)] hover:shadow-[var(--shadow-subtle)]'
                    }`}
                    style={{ transition: 'all var(--transition-smooth)' }}
                  >
                    <img
                      src={clothing.image_url}
                      alt={clothing.name || '衣物'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-[var(--accent)]/20 flex items-center justify-center backdrop-blur-[2px]">
                        <div className="w-10 h-10 bg-[var(--accent-dark)] rounded-full flex items-center justify-center shadow-[var(--shadow-medium)]">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    )}
                    {/* 选中序号 */}
                    {isSelected && (
                      <div className="absolute top-2 left-2 w-7 h-7 bg-[var(--accent-dark)] text-white text-xs font-bold rounded-full flex items-center justify-center shadow-[var(--shadow-medium)]">
                        {selectedClothings.findIndex(c => c.id === clothing.id) + 1}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
          
          {/* 底部按钮 */}
          <div className="flex justify-between items-center gap-4 pt-4 border-t border-[var(--gray-200)]">
            <span className="text-sm text-[var(--gray-600)] font-medium">
              显示 {filteredClothings.length} / {clothings.length} 件衣物
            </span>
            <div className="flex gap-3">
              <Button
                variant="primary"
                onClick={() => {
                  setIsClothingModalOpen(false)
                  // 关闭时重置筛选
                  setSelectedLevel1CategoryId('all')
                  setSelectedLevel2CategoryId('all')
                }}
              >
                完成
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* 搭配画布弹窗 */}
      <OutfitCanvasModal
        isOpen={isCanvasModalOpen}
        onClose={() => setIsCanvasModalOpen(false)}
        clothings={selectedClothings}
        onSave={handleCanvasSave}
      />

      {/* 提示 */}
      <Toast
        isOpen={toast.isOpen}
        message={toast.options.message}
        type={toast.options.type}
        duration={toast.options.duration}
        onClose={toast.handleClose}
      />
    </div>
  )
}
