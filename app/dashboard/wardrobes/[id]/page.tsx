'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useWardrobe, useCreateCategory } from '@/lib/hooks/useWardrobeQuery'
import { useUpdateWardrobe } from '@/lib/hooks/useWardrobesQuery'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
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

  const { data, isLoading } = useWardrobe(wardrobeId)
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
    <div className="space-y-5 pb-6">
      {/* 顶部标题 - 参考图风格 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-[var(--gray-900)]">
            {wardrobe.name}
          </h1>
          <button
            onClick={openEditModal}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title="编辑衣橱"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsCategoryModalOpen(true)}
          className="flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          添加分类
        </Button>
      </div>

      {/* 统计信息 */}
      <div className="flex items-center gap-4 text-sm text-white mb-5 font-medium">
        <span>{clothings.length} 件衣物</span>
        {level1Categories.length > 0 && (
          <span>{level1Categories.length} 个分类</span>
        )}
      </div>

      {/* 分类筛选 - 参考图风格 */}
      {level1Categories.length > 0 && (
        <div className="mb-5">
          <h2 className="text-xl font-bold text-[var(--gray-900)] mb-3">分类筛选</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => router.push(`/dashboard/wardrobes/${wardrobeId}/clothings`)}
              className="px-4 py-2 rounded-full text-sm font-medium bg-[#3b82f6] text-white active:scale-95 transition-transform shadow-sm"
            >
              全部
            </button>
            {level1Categories.map((cat) => {
              const categoryClothings = clothings.filter(c => c.category_id === cat.id)
              const isSelected = false // 可以根据路由参数判断
              return (
                <button
                  key={cat.id}
                  onClick={() => router.push(`/dashboard/wardrobes/${wardrobeId}/clothings?category=${cat.id}`)}
                  className={cn(
                    'px-4 py-2 rounded-full text-sm font-medium active:scale-95 transition-transform',
                    isSelected 
                      ? 'bg-[#3b82f6] text-white shadow-sm' 
                      : 'bg-white text-[#1a1a1a] shadow-sm'
                  )}
                >
                  {cat.name}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* 分类列表 - 参考图风格 */}
      <div>
        {level1Categories.length === 0 ? (
          <Card className="text-center py-12 border-2 border-dashed border-[var(--gray-300)]">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--gray-100)] flex items-center justify-center">
              <svg className="w-8 h-8 text-[var(--gray-400)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <p className="text-lg text-[var(--gray-700)] mb-2 font-semibold">还没有分类</p>
            <p className="text-sm text-[var(--gray-500)] mb-6">创建分类来更好地组织你的衣物</p>
            <Button
              variant="outline"
              onClick={() => setIsCategoryModalOpen(true)}
              size="lg"
              className="min-h-[48px] !text-[var(--gray-900)] !border-2 !border-[var(--gray-900)] hover:!bg-[var(--gray-900)] hover:!text-white"
            >
              创建第一个分类
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {level1Categories.map((cat1) => {
              const subCategories = level2Categories.filter(c => c.parent_id === cat1.id)
              const categoryClothings = clothings.filter(c => c.category_id === cat1.id || subCategories.some(sc => sc.id === c.category_id))
              
              return (
                <Card 
                  key={cat1.id} 
                  className="p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => router.push(`/dashboard/wardrobes/${wardrobeId}/clothings?category=${cat1.id}&categoryName=${encodeURIComponent(cat1.name)}`)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-[#1a1a1a]">{cat1.name}</h3>
                    <span className="text-sm text-[#2a2825] font-medium">
                      {categoryClothings.length} 件衣物
                    </span>
                  </div>
                  
                  {categoryClothings.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {categoryClothings.slice(0, 6).map((clothing) => (
                        <div
                          key={clothing.id}
                          className="aspect-square bg-[var(--gray-100)] rounded-lg overflow-hidden cursor-pointer active:scale-95 transition-transform"
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/dashboard/wardrobes/${wardrobeId}/clothings/${clothing.id}`)
                          }}
                        >
                          {clothing.image_url ? (
                            <img
                              src={clothing.image_url}
                              alt={clothing.name || '衣物'}
                              className="w-full h-full object-cover"
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
                          className="aspect-square bg-[var(--gray-200)] rounded-lg flex items-center justify-center text-[var(--gray-500)] font-semibold"
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

      {/* 浮动添加按钮 - 参考图风格 */}
      <button
        onClick={() => router.push(`/dashboard/wardrobes/${wardrobeId}/clothings/new`)}
        className="fixed bottom-20 right-4 sm:hidden z-40 w-14 h-14 bg-[#3b82f6] text-white rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform"
        aria-label="添加衣物"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* 创建分类模态框 - 移动端优化 */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title="创建分类"
      >
        <div className="space-y-6 pb-4">
          {/* 移动端拖拽指示器 */}
          <div className="sm:hidden flex justify-center pt-2 pb-4">
            <div className="w-12 h-1.5 bg-[var(--gray-300)] rounded-full"></div>
          </div>
          
          <div>
            <label className="block text-base font-semibold text-[#1a1a1a] mb-4">
              分类级别
            </label>
            <div className="flex gap-3">
              <label className="flex-1 flex items-center justify-center gap-3 p-4 rounded-xl border-2 cursor-pointer active:scale-95 transition-all" style={{ 
                borderColor: categoryLevel === 1 ? 'var(--primary)' : 'var(--gray-200)',
                backgroundColor: categoryLevel === 1 ? 'var(--primary-light)' : 'white'
              }}>
                <input
                  type="radio"
                  name="level"
                  checked={categoryLevel === 1}
                  onChange={() => {
                    setCategoryLevel(1)
                    setSelectedParentId('')
                  }}
                  className="w-5 h-5 text-[var(--primary)] focus:ring-[var(--primary)]"
                />
                <span className="text-base font-medium text-[#1a1a1a]">一级分类</span>
              </label>
              <label className="flex-1 flex items-center justify-center gap-3 p-4 rounded-xl border-2 cursor-pointer active:scale-95 transition-all" style={{ 
                borderColor: categoryLevel === 2 ? 'var(--primary)' : 'var(--gray-200)',
                backgroundColor: categoryLevel === 2 ? 'var(--primary-light)' : 'white'
              }}>
                <input
                  type="radio"
                  name="level"
                  checked={categoryLevel === 2}
                  onChange={() => setCategoryLevel(2)}
                  className="w-5 h-5 text-[var(--primary)] focus:ring-[var(--primary)]"
                />
                <span className="text-base font-medium text-[#1a1a1a]">二级分类</span>
              </label>
            </div>
          </div>

          {categoryLevel === 2 && (
            <div className="animate-fade-in">
              <label className="block text-base font-semibold text-[#1a1a1a] mb-3">
                父分类
              </label>
              <select
                value={selectedParentId}
                onChange={(e) => setSelectedParentId(e.target.value)}
                className="w-full px-4 py-3.5 text-base border-2 border-[var(--gray-300)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] text-[#1a1a1a] bg-white min-h-[52px]"
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

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-[var(--gray-200)]">
            <Button
              variant="ghost"
              onClick={() => {
                setIsCategoryModalOpen(false)
                setNewCategoryName('')
                setCategoryLevel(1)
                setSelectedParentId('')
              }}
              size="lg"
              className="flex-1 min-h-[52px] !text-[#1a1a1a] border border-[var(--gray-200)] hover:bg-[var(--gray-50)]"
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
            <label className="block text-sm font-medium text-[#1a1a1a] mb-3">
              选择封面（可选）
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-[300px] overflow-y-auto p-1">
              {/* 预设封面 */}
              {COVER_IMAGES.map((image, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setEditAvatar(image)}
                  className={`aspect-video rounded-lg border-2 transition-all overflow-hidden ${
                    editAvatar === image
                      ? 'border-[var(--primary)] ring-2 ring-[var(--primary)] ring-opacity-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
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
          
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              variant="ghost"
              onClick={() => setIsEditModalOpen(false)}
              className="!text-[#1a1a1a]"
            >
              取消
            </Button>
            <Button
              variant="primary"
              onClick={handleEditWardrobe}
              isLoading={updateWardrobeMutation.isPending}
              disabled={!editName.trim()}
            >
              保存
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
