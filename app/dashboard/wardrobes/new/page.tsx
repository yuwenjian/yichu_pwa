'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'

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

export default function NewWardrobePage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState<string>(DEFAULT_AVATAR)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('请输入衣橱名称')
      return
    }

    setIsCreating(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('wardrobes')
        .insert([
          {
            user_id: user.id,
            name: name.trim(),
            avatar: selectedAvatar,
            sort_order: 0,
          },
        ])
        .select()
        .single()

      if (error) throw error

      // 创建成功后跳转到新创建的衣橱详情页
      router.push(`/dashboard/wardrobes/${data.id}`)
    } catch (error: any) {
      console.error('Error creating wardrobe:', error)
      setError(error.message || '创建失败，请重试')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          ← 返回
        </Button>
        <h1 className="text-display text-4xl text-[var(--gray-900)]">
          创建新衣橱
        </h1>
        <p className="text-editorial text-lg text-[var(--gray-600)] mt-3">
          为你的衣物创建一个新的衣橱，可以按家庭成员或用途分类管理
        </p>
      </div>

      <Card className="p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-[var(--error)]/5 border-l-2 border-[var(--error)] rounded-[var(--radius-md)] text-sm text-[var(--error)] backdrop-blur-sm">
              <div className="flex items-start gap-2">
                <span className="inline-block w-1 h-1 rounded-full bg-[var(--error)] mt-2" />
                <span>{error}</span>
              </div>
            </div>
          )}

          <Input
            label="衣橱名称"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例如：我的衣橱、儿子衣橱、老婆衣橱"
            required
            autoFocus
            helperText="为衣橱起一个容易识别的名称"
          />

          {/* 封面选择 */}
          <div>
            <label className="block text-sm font-medium text-[var(--gray-900)] mb-3 tracking-wide">
              选择封面（可选）
            </label>
            <div className="grid grid-cols-3 gap-3 max-h-[400px] overflow-y-auto p-2">
              {/* 预设封面 */}
              {COVER_IMAGES.map((image, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setSelectedAvatar(image)}
                  className={`relative w-full rounded-[var(--radius-md)] border-2 transition-all overflow-hidden ${
                    selectedAvatar === image
                      ? 'border-[var(--accent)] ring-2 ring-[var(--accent)] ring-opacity-50'
                      : 'border-[var(--gray-300)] hover:border-[var(--accent-light)]'
                  }`}
                  style={{ 
                    paddingBottom: '133%',
                    transition: 'all var(--transition-smooth)' 
                  }}
                >
                  <img
                    src={image}
                    alt={`封面 ${index + 1}`}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
            >
              取消
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isCreating}
              disabled={!name.trim()}
            >
              创建衣橱
            </Button>
          </div>
        </form>
      </Card>

      {/* 提示信息 */}
      <Card className="p-6 border-[var(--accent-light)]">
        <h3 className="text-lg font-medium mb-3 text-[var(--gray-900)] flex items-center gap-2">
          <span className="text-2xl">💡</span>
          <span>温馨提示</span>
        </h3>
        <div className="h-px w-16 bg-[var(--accent)] mb-4" />
        <ul className="space-y-3 text-sm text-[var(--gray-600)]">
          <li className="flex items-start gap-2">
            <span className="inline-block w-1 h-1 rounded-full bg-[var(--accent)] mt-2 flex-shrink-0" />
            <span>一个账号可以创建多个衣橱，方便管理不同成员的衣物</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="inline-block w-1 h-1 rounded-full bg-[var(--accent)] mt-2 flex-shrink-0" />
            <span>创建衣橱后，可以添加分类和上传衣物</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="inline-block w-1 h-1 rounded-full bg-[var(--accent)] mt-2 flex-shrink-0" />
            <span>衣橱名称可以随时修改</span>
          </li>
        </ul>
      </Card>
    </div>
  )
}
