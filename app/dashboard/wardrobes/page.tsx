'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/stores/authStore'
import { useWardrobes, useCreateWardrobe, useDeleteWardrobe } from '@/lib/hooks/useWardrobesQuery'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import { useState } from 'react'

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

export default function WardrobesPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { data: wardrobes = [], isLoading } = useWardrobes(user?.id)
  const createWardrobeMutation = useCreateWardrobe()
  const deleteWardrobeMutation = useDeleteWardrobe()

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newWardrobeName, setNewWardrobeName] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState<string>(DEFAULT_AVATAR)

  const handleCreateWardrobe = async () => {
    if (!newWardrobeName.trim() || !user?.id) return

    try {
      const newWardrobe = await createWardrobeMutation.mutateAsync({
        user_id: user.id,
        name: newWardrobeName.trim(),
        avatar: selectedAvatar,
        sort_order: wardrobes.length,
      })

      setIsCreateModalOpen(false)
      setNewWardrobeName('')
      setSelectedAvatar(DEFAULT_AVATAR)
      // 跳转到新创建的衣橱详情页
      router.push(`/dashboard/wardrobes/${newWardrobe.id}`)
    } catch (error) {
      console.error('Error creating wardrobe:', error)
      alert('创建失败，请重试')
    }
  }

  const handleDeleteWardrobe = async (id: string, name: string, e: React.MouseEvent) => {
    e.preventDefault() // 阻止链接跳转
    e.stopPropagation()

    if (!confirm(`确定要删除衣橱"${name}"吗？\n\n删除后衣橱内的所有衣物和分类也将被删除，且无法恢复！`)) {
      return
    }

    try {
      await deleteWardrobeMutation.mutateAsync(id)
      alert('删除成功')
    } catch (error) {
      console.error('Error deleting wardrobe:', error)
      alert('删除失败，请重试')
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-[var(--gray-900)]" style={{ fontFamily: 'Playfair Display, serif' }}>
          我的衣橱
        </h1>
        <Button
          variant="primary"
          onClick={() => setIsCreateModalOpen(true)}
        >
          + 新建衣橱
        </Button>
      </div>

      {wardrobes.length === 0 ? (
        <Card className="text-center py-16">
          <div className="text-6xl mb-4">👔</div>
          <h3 className="text-xl font-semibold mb-2 text-[var(--gray-900)]">还没有衣橱</h3>
          <p className="text-[var(--gray-700)] mb-6">
            创建你的第一个衣橱，开始管理你的衣物吧
          </p>
          <Button
            variant="primary"
            onClick={() => setIsCreateModalOpen(true)}
          >
            创建衣橱
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wardrobes.map((wardrobe) => (
            <div key={wardrobe.id} className="relative group">
              <Link href={`/dashboard/wardrobes/${wardrobe.id}`}>
                <Card hover className="h-full">
                  <div className="aspect-video bg-gradient-to-br from-[var(--primary-light)] to-[var(--accent-light)] rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                    {wardrobe.avatar ? (
                      <img
                        src={wardrobe.avatar}
                        alt={wardrobe.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-5xl opacity-50">👔</div>
                    )}
                  </div>
                  <h3 className="text-xl font-semibold mb-1 text-[#1a1a1a]">{wardrobe.name}</h3>
                  <p className="text-sm text-[#1a1a1a]">
                    点击查看详情 →
                  </p>
                </Card>
              </Link>
              
              {/* 删除按钮 */}
              <button
                onClick={(e) => handleDeleteWardrobe(wardrobe.id, wardrobe.name, e)}
                className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 shadow-lg z-10"
                title="删除衣橱"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false)
          setNewWardrobeName('')
          setSelectedAvatar(DEFAULT_AVATAR)
        }}
        title="创建新衣橱"
      >
        <div className="space-y-5">
          <Input
            label="衣橱名称"
            value={newWardrobeName}
            onChange={(e) => setNewWardrobeName(e.target.value)}
            placeholder="例如：我的衣橱、儿子衣橱"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newWardrobeName.trim()) {
                handleCreateWardrobe()
              }
            }}
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
                  onClick={() => setSelectedAvatar(image)}
                  className={`aspect-video rounded-lg border-2 transition-all overflow-hidden ${
                    selectedAvatar === image
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
              onClick={() => {
                setIsCreateModalOpen(false)
                setNewWardrobeName('')
                setSelectedAvatar(DEFAULT_AVATAR)
              }}
              className="!text-[#1a1a1a]"
            >
              取消
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateWardrobe}
              isLoading={createWardrobeMutation.isPending}
              disabled={!newWardrobeName.trim()}
            >
              创建
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
