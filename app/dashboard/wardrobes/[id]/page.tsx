'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useWardrobe, useCreateCategory } from '@/lib/hooks/useWardrobeQuery'
import { useUpdateWardrobe } from '@/lib/hooks/useWardrobesQuery'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import PullToRefresh from '@/components/ui/PullToRefresh'
import { cn } from '@/utils/cn'

// 预设封面图片列表
const COVER_IMAGES = [
  '/images/image_20260127112559.png',
  '/images/image_20260127112601.png',
  '/images/image_20260127112609.png',
  '/images/image_20260127112806.png',
  '/images/image_20260127113841.png',
  '/images/image_20260127113842.png',
  '/images/image_20260127113844.png',
  '/images/image_20260127113845.png',
  '/images/image_20260127113851.png',
  '/images/image_20260127113852.png',
  '/images/image_20260127113853.png',
  '/images/image_20260127113857.png',
  '/images/image_20260127113858.png',
  '/images/image_20260127113859.png',
  '/images/image_20260127113900.png',
  '/images/image_20260127113902.png',
  '/images/image_20260127113904.png',
  '/images/image_20260127113905.png',
  '/images/image_20260127113906.png',
  '/images/image_20260127115346.png',
  '/images/image_20260127115349.png',
  '/images/image_20260127115350.png',
  '/images/image_20260127115352.png',
  '/images/image_20260127115353.png',
  '/images/image_20260127115355.png',
  '/images/image_20260127115356.png',
  '/images/image_20260127115358.png',
  '/images/image_20260127115359.png',
  '/images/image_20260127115400.png',
  '/images/image_20260127115401.png',
]

// 默认封面图片
const DEFAULT_AVATAR = '/images/image_20260127115359.png'

export default function WardrobeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const wardrobeId = params.id as string

  const { data, isLoading, refetch } = useWardrobe(wardrobeId)
  const createCategoryMutation = useCreateCategory()
  const updateWardrobeMutation = useUpdateWardrobe()

  const wardrobe = data?.wardrobe
  const categories = data?.categories || []
  const clothings = data?.clothings || []

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [categoryLevel, setCategoryLevel] = useState<1 | 2>(1)
  const [selectedParentId, setSelectedParentId] = useState<string>('')
  
  // 编辑衣橱相关状态
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editName, setEditName] = useState('')
  const [editAvatar, setEditAvatar] = useState<string>('')

  const handleRefresh = async () => {
    await refetch()
  }

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return

    try {
      const level = categoryLevel
      const parentId = level === 2 ? selectedParentId || null : null

      await createCategoryMutation.mutateAsync({
        wardrobe_id: wardrobeId,
        name: newCategoryName.trim(),
        level,
        parent_id: parentId,
        sort_order: categories.filter(c => c.level === level).length,
      })

      setIsCategoryModalOpen(false)
      setNewCategoryName('')
      setCategoryLevel(1)
      setSelectedParentId('')
    } catch (error) {
      console.error('Error creating category:', error)
      alert('创建失败，请重试')
    }
  }

  const handleEditWardrobe = async () => {
    if (!editName.trim()) return

    try {
      await updateWardrobeMutation.mutateAsync({
        id: wardrobeId,
        name: editName.trim(),
        avatar: editAvatar,
      })

      setIsEditModalOpen(false)
      alert('更新成功')
    } catch (error) {
      console.error('Error updating wardrobe:', error)
      alert('更新失败，请重试')
    }
  }

  const openEditModal = () => {
    if (wardrobe) {
      setEditName(wardrobe.name)
      setEditAvatar(wardrobe.avatar || DEFAULT_AVATAR)
      setIsEditModalOpen(true)
    }
  }

  const level1Categories = categories.filter(c => c.level === 1)
  const level2Categories = categories.filter(c => c.level === 2)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--primary)]"></div>
      </div>
    )
  }

  if (!wardrobe) {
    return (
      <Card className="text-center py-12">
        <p className="text-[var(--gray-500)]">衣橱不存在</p>
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard/wardrobes')}
          className="mt-4"
        >
          返回衣橱列表
        </Button>
      </Card>
    )
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="space-y-8 pb-6">
        {/* 顶部标题 - Editorial风格 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-display text-4xl text-[var(--gray-900)]">
                {wardrobe.name}
              </h1>
              <button
                onClick={openEditModal}
                className="p-2 hover:bg-[var(--accent)]/10 rounded-lg transition-all"
                title="编辑衣橱"
                style={{ transition: 'all var(--transition-smooth)' }}
              >
                <svg className="w-5 h-5 text-[var(--gray-600)] hover:text-[var(--accent-dark)] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            </div>
            <Button
              variant="primary"
              onClick={() => setIsCategoryModalOpen(true)}
              className="flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              添加分类
            </Button>
          </div>
          
          <div className="h-px w-32 bg-gradient-to-r from-[var(--accent)] to-transparent" />

          {/* 统计信息 */}
          <div className="flex items-center gap-6 text-sm text-[var(--gray-600)] font-medium">
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
              {clothings.length} 件衣物
            </span>
            {level1Categories.length > 0 && (
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                {level1Categories.length} 个分类
              </span>
            )}
          </div>
        </div>

      {/* 分类筛选 - Editorial风格 */}
      {level1Categories.length > 0 && (
        <div>
          <h2 className="text-xl font-medium text-[var(--gray-900)] mb-4">分类筛选</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => router.push(`/dashboard/wardrobes/${wardrobeId}/clothings`)}
              className="px-5 py-2.5 rounded-[var(--radius-full)] text-sm font-medium bg-[var(--accent-dark)] text-white shadow-[var(--shadow-soft)] hover:bg-[var(--accent)] transition-all"
              style={{ transition: 'all var(--transition-smooth)' }}
            >
              全部
            </button>
            {level1Categories.map((cat) => {
              const categoryClothings = clothings.filter(c => c.category_id === cat.id)
              const isSelected = false
              return (
                <button
                  key={cat.id}
                  onClick={() => router.push(`/dashboard/wardrobes/${wardrobeId}/clothings?category=${cat.id}`)}
                  className={cn(
                    'px-5 py-2.5 rounded-[var(--radius-full)] text-sm font-medium transition-all',
                    isSelected 
                      ? 'bg-[var(--accent-dark)] text-white shadow-[var(--shadow-soft)]' 
                      : 'border border-[var(--gray-300)] text-[var(--gray-600)] hover:border-[var(--accent)] hover:text-[var(--accent-dark)] bg-[var(--card-bg)]'
                  )}
                  style={{ transition: 'all var(--transition-smooth)' }}
                >
                  {cat.name}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* 分类列表 - Editorial风格 */}
      <div>
        {level1Categories.length === 0 ? (
          <Card className="text-center py-16 border-dashed">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--accent)]/10 flex items-center justify-center">
              <svg className="w-10 h-10 text-[var(--accent-dark)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <h3 className="text-2xl font-medium mb-3 text-[var(--gray-900)]">创建分类组织你的衣物</h3>
            <p className="text-editorial text-lg text-[var(--gray-600)] mb-8 max-w-md mx-auto">
              创建分类来更好地组织和管理你的衣物
            </p>
            <Button
              variant="primary"
              onClick={() => setIsCategoryModalOpen(true)}
              size="lg"
            >
              创建第一个分类
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {level1Categories.map((cat1, index) => {
              const subCategories = level2Categories.filter(c => c.parent_id === cat1.id)
              const categoryClothings = clothings.filter(c => c.category_id === cat1.id || subCategories.some(sc => sc.id === c.category_id))
              
              return (
                <Card 
                  key={cat1.id} 
                  hover
                  className={`p-6 cursor-pointer group animate-fade-in stagger-${Math.min(index + 1, 5)}`}
                  onClick={() => router.push(`/dashboard/wardrobes/${wardrobeId}/clothings?category=${cat1.id}&categoryName=${encodeURIComponent(cat1.name)}`)}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-medium text-[var(--gray-900)] group-hover:text-[var(--accent-dark)] transition-colors duration-300">
                      {cat1.name}
                    </h3>
                    <span className="text-sm text-[var(--gray-600)] font-medium flex items-center gap-2">
                      {categoryClothings.length} 件衣物
                      <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
                    </span>
                  </div>
                  
                  {categoryClothings.length > 0 && (
                    <div className="grid grid-cols-3 gap-3">
                      {categoryClothings.slice(0, 6).map((clothing) => (
                        <div
                          key={clothing.id}
                          className="aspect-square rounded-[var(--radius-lg)] overflow-hidden cursor-pointer hover:scale-105 transition-all shadow-[var(--shadow-subtle)] hover:shadow-[var(--shadow-soft)]"
                          style={{ 
                            background: clothing.has_transparent_bg
                              ? 'linear-gradient(rgba(128, 128, 128, 0.1), rgba(128, 128, 128, 0.1)), #d4b896'
                              : 'transparent',
                            transition: 'all var(--transition-smooth)' 
                          }}
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/dashboard/wardrobes/${wardrobeId}/clothings/${clothing.id}`)
                          }}
                        >
                          {clothing.image_url ? (
                            <img
                              src={clothing.image_url}
                              alt={clothing.name || '衣物'}
                              className={`w-full h-full ${
                                clothing.has_transparent_bg ? 'object-contain' : 'object-cover'
                              }`}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-[var(--gray-200)]">
                              <svg className="w-6 h-6 text-[var(--gray-400)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>
                      ))}
                      {categoryClothings.length > 6 && (
                        <div 
                          className="aspect-square bg-[var(--accent)]/10 rounded-[var(--radius-lg)] flex items-center justify-center text-[var(--accent-dark)] font-semibold border border-[var(--accent)]/20"
                          onClick={(e) => e.stopPropagation()}
                        >
                          +{categoryClothings.length - 6}
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* 浮动添加按钮 - Editorial风格 */}
      <button
        onClick={() => router.push(`/dashboard/wardrobes/${wardrobeId}/clothings/new`)}
        className="fixed bottom-20 right-4 sm:hidden z-40 w-14 h-14 bg-[var(--accent-dark)] text-white rounded-full shadow-[var(--shadow-elevated)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
        style={{ transition: 'all var(--transition-smooth)' }}
        aria-label="添加衣物"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
      </button>
      </div>

      {/* 创建分类模态框 - 移动端优化 */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title="创建分类"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-[var(--gray-900)] mb-4 tracking-wide">
              分类级别
            </label>
            <div className="flex gap-4">
              <label className="flex-1 flex items-center justify-center gap-3 p-4 rounded-[var(--radius-lg)] border cursor-pointer transition-all" style={{ 
                borderColor: categoryLevel === 1 ? 'var(--accent)' : 'var(--gray-300)',
                backgroundColor: categoryLevel === 1 ? 'var(--accent)/10' : 'var(--card-bg)',
                transition: 'all var(--transition-smooth)'
              }}>
                <input
                  type="radio"
                  name="level"
                  checked={categoryLevel === 1}
                  onChange={() => {
                    setCategoryLevel(1)
                    setSelectedParentId('')
                  }}
                  className="w-5 h-5 text-[var(--accent)] focus:ring-[var(--accent)]"
                />
                <span className="text-base font-medium text-[var(--gray-900)]">一级分类</span>
              </label>
              <label className="flex-1 flex items-center justify-center gap-3 p-4 rounded-[var(--radius-lg)] border cursor-pointer transition-all" style={{ 
                borderColor: categoryLevel === 2 ? 'var(--accent)' : 'var(--gray-300)',
                backgroundColor: categoryLevel === 2 ? 'var(--accent)/10' : 'var(--card-bg)',
                transition: 'all var(--transition-smooth)'
              }}>
                <input
                  type="radio"
                  name="level"
                  checked={categoryLevel === 2}
                  onChange={() => setCategoryLevel(2)}
                  className="w-5 h-5 text-[var(--accent)] focus:ring-[var(--accent)]"
                />
                <span className="text-base font-medium text-[var(--gray-900)]">二级分类</span>
              </label>
            </div>
          </div>

          {categoryLevel === 2 && (
            <div className="animate-fade-in">
              <label className="block text-sm font-medium text-[var(--gray-900)] mb-3 tracking-wide">
                父分类
              </label>
              <select
                value={selectedParentId}
                onChange={(e) => setSelectedParentId(e.target.value)}
                className="w-full px-5 py-3.5 text-base border border-[var(--gray-300)] rounded-[var(--radius-lg)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)] text-[var(--gray-900)] bg-[var(--input-bg)] min-h-[52px] shadow-[var(--shadow-subtle)] focus:shadow-[var(--shadow-soft)] transition-all"
                style={{ transition: 'all var(--transition-smooth)' }}
              >
                <option value="">选择父分类</option>
                {level1Categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <Input
            label="分类名称"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="例如：上衣、裤装、羽绒服"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleCreateCategory()
              }
            }}
          />

          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-[var(--gray-200)]">
            <Button
              variant="ghost"
              onClick={() => {
                setIsCategoryModalOpen(false)
                setNewCategoryName('')
                setCategoryLevel(1)
                setSelectedParentId('')
              }}
              size="lg"
              className="flex-1 min-h-[52px]"
            >
              取消
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateCategory}
              isLoading={createCategoryMutation.isPending}
              disabled={!newCategoryName.trim() || (categoryLevel === 2 && !selectedParentId)}
              size="lg"
              className="flex-1 sm:flex-none min-h-[52px]"
            >
              {createCategoryMutation.isPending ? '创建中...' : '创建'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* 编辑衣橱模态框 */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="编辑衣橱"
      >
        <div className="space-y-5">
          <Input
            label="衣橱名称"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="例如：我的衣橱、儿子衣橱"
            autoFocus
          />
          
          {/* 封面选择 */}
          <div>
            <label className="block text-sm font-medium text-[var(--gray-900)] mb-3 tracking-wide">
              选择封面（可选）
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-[300px] overflow-y-auto p-1">
              {/* 预设封面 */}
              {COVER_IMAGES.map((image, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setEditAvatar(image)}
                  className={`aspect-video rounded-[var(--radius-lg)] border transition-all overflow-hidden ${
                    editAvatar === image
                      ? 'border-[var(--accent)] ring-2 ring-[var(--accent)]/30 scale-105'
                      : 'border-[var(--gray-300)] hover:border-[var(--accent-light)]'
                  }`}
                  style={{ transition: 'all var(--transition-smooth)' }}
                >
                  <img
                    src={image}
                    alt={`封面 ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end gap-4 pt-6 border-t border-[var(--gray-200)]">
            <Button
              variant="ghost"
              onClick={() => setIsEditModalOpen(false)}
            >
              取消
            </Button>
            <Button
              variant="primary"
              size="lg"
              onClick={handleEditWardrobe}
              isLoading={updateWardrobeMutation.isPending}
              disabled={!editName.trim()}
            >
              保存
            </Button>
          </div>
        </div>
      </Modal>
    </PullToRefresh>
  )
}
