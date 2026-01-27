'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/stores/authStore'
import { useWardrobes, useCreateWardrobe, useDeleteWardrobe } from '@/lib/hooks/useWardrobesQuery'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import PullToRefresh from '@/components/ui/PullToRefresh'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Toast from '@/components/ui/Toast'
import { useConfirm, useToast } from '@/hooks/useDialog'
import { useState, Fragment } from 'react'

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
  const { data: wardrobes = [], isLoading, refetch } = useWardrobes(user?.id)
  const createWardrobeMutation = useCreateWardrobe()
  const deleteWardrobeMutation = useDeleteWardrobe()

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newWardrobeName, setNewWardrobeName] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState<string>(DEFAULT_AVATAR)

  const confirmDialog = useConfirm()
  const toast = useToast()

  const handleRefresh = async () => {
    await refetch()
  }

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
      toast.error('创建失败，请重试')
    }
  }

  const handleDeleteWardrobe = async (id: string, name: string, e: React.MouseEvent) => {
    e.preventDefault() // 阻止链接跳转
    e.stopPropagation()

    const confirmed = await confirmDialog.confirm({
      title: '删除衣橱',
      message: `确定要删除衣橱 ${name} 吗？\n\n删除后衣橱内的所有衣物和分类也将被删除，且无法恢复！`,
      confirmText: '删除',
      cancelText: '取消',
      variant: 'danger',
    })

    if (!confirmed) return

    try {
      await deleteWardrobeMutation.mutateAsync(id)
      toast.success('删除成功')
    } catch (error) {
      console.error('Error deleting wardrobe:', error)
      toast.error('删除失败，请重试')
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
    <Fragment>
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs tracking-[0.3em] uppercase text-[var(--accent-dark)] font-medium mb-3">
              MY COLLECTION
            </p>
            <h1 className="text-display text-5xl text-[var(--gray-900)]">
              我的衣橱
            </h1>
            <div className="h-px w-24 bg-gradient-to-r from-[var(--accent)] to-transparent mt-4" />
          </div>
          <Button
            variant="primary"
            size="lg"
            onClick={() => setIsCreateModalOpen(true)}
          >
            + 新建衣橱
          </Button>
        </div>

      {wardrobes.length === 0 ? (
        <Card className="text-center py-20 border-dashed">
          <div className="w-20 h-20 bg-[var(--accent)]/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-6xl">👔</span>
          </div>
          <h3 className="text-2xl font-medium mb-3 text-[var(--gray-900)]">开始你的衣橱之旅</h3>
          <p className="text-editorial text-lg text-[var(--gray-600)] mb-8 max-w-md mx-auto">
            创建你的第一个衣橱，开始管理你的衣物吧
          </p>
          <Button
            variant="primary"
            size="lg"
            onClick={() => setIsCreateModalOpen(true)}
          >
            创建衣橱
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {wardrobes.map((wardrobe, index) => (
            <div key={wardrobe.id} className={`relative group animate-fade-in stagger-${Math.min(index + 1, 5)}`}>
              <Link href={`/dashboard/wardrobes/${wardrobe.id}`}>
                <Card hover className="h-full overflow-hidden">
                  <div className="aspect-[4/3] bg-gradient-to-br from-[var(--gray-100)] to-[var(--gray-200)] rounded-[var(--radius-lg)] mb-5 flex items-center justify-center overflow-hidden relative">
                    {wardrobe.avatar ? (
                      <>
                        <img
                          src={wardrobe.avatar}
                          alt={wardrobe.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      </>
                    ) : (
                      <div className="text-6xl opacity-30 group-hover:scale-110 transition-transform duration-500">👔</div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-medium text-[var(--gray-900)] group-hover:text-[var(--accent-dark)] transition-colors duration-300">
                      {wardrobe.name}
                    </h3>
                    <div className="h-px w-12 bg-[var(--gray-300)] group-hover:w-20 group-hover:bg-[var(--accent)] transition-all duration-500" />
                    <p className="text-sm text-[var(--gray-600)] text-editorial flex items-center gap-1">
                      点击探索
                      <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
                    </p>
                  </div>
                </Card>
              </Link>
              
              {/* 删除按钮 */}
              <button
                onClick={(e) => handleDeleteWardrobe(wardrobe.id, wardrobe.name, e)}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-[var(--error)] text-white rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-[#9a4a4a] hover:scale-110 shadow-[var(--shadow-medium)] z-10"
                style={{ transition: 'all var(--transition-smooth)' }}
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
            <label className="block text-sm font-medium text-[var(--gray-900)] mb-3 tracking-wide">
              选择封面（可选）
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-[300px] overflow-y-auto p-1">
              {/* 预设封面 */}
              {COVER_IMAGES.map((image, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setSelectedAvatar(image)}
                  className={`aspect-video rounded-[var(--radius-lg)] border transition-all overflow-hidden ${
                    selectedAvatar === image
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
              onClick={() => {
                setIsCreateModalOpen(false)
                setNewWardrobeName('')
                setSelectedAvatar(DEFAULT_AVATAR)
              }}
            >
              取消
            </Button>
            <Button
              variant="primary"
              size="lg"
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
