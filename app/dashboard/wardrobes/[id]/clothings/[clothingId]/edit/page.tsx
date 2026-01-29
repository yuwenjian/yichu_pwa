'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { removeBackground } from '@/lib/image-processor'
import { useCategories } from '@/lib/hooks/useCategoriesQuery'
import type { Clothing } from '@/types'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Toast from '@/components/ui/Toast'
import { useToast } from '@/hooks/useDialog'

const COLORS = ['黑', '白', '灰', '红', '蓝', '绿', '黄', '粉', '棕', '米', '其他']
const SEASONS = ['春', '夏', '秋', '冬']
const STATUSES = [
  { value: 'normal', label: '常穿' },
  { value: 'damaged', label: '破损' },
  { value: 'idle', label: '闲置' },
  { value: 'discarded', label: '丢弃' },
]

export default function EditClothingPage() {
  const params = useParams()
  const router = useRouter()
  const wardrobeId = params.id as string
  const clothingId = params.clothingId as string

  const { data: categories = [], isLoading: categoriesLoading } = useCategories(wardrobeId)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const toast = useToast()
  
  // 表单数据
  const [clothing, setClothing] = useState<Clothing | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [processedImage, setProcessedImage] = useState<string>('')
  const [removeBg, setRemoveBg] = useState(false)
  const [processingImage, setProcessingImage] = useState(false)
  
  const [categoryId, setCategoryId] = useState('')
  const [name, setName] = useState('')
  const [colors, setColors] = useState<string[]>([])
  const [seasons, setSeasons] = useState<string[]>([])
  const [brand, setBrand] = useState('')
  const [price, setPrice] = useState('')
  const [purchaseDate, setPurchaseDate] = useState('')
  const [status, setStatus] = useState('normal')
  const [notes, setNotes] = useState('')
  const [customColor, setCustomColor] = useState('')
  const [showCustomColorInput, setShowCustomColorInput] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // 加载衣物数据
  useEffect(() => {
    loadClothing()
  }, [clothingId])

  const loadClothing = async () => {
    try {
      const { data, error } = await supabase
        .from('clothings')
        .select('*')
        .eq('id', clothingId)
        .single()

      if (error) throw error

      if (data) {
        setClothing(data)
        setCategoryId(data.category_id || '')
        setName(data.name || '')
        setColors(data.colors || [])
        setSeasons(data.seasons || [])
        setBrand(data.brand || '')
        setPrice(data.price?.toString() || '')
        setPurchaseDate(data.purchase_date || '')
        setStatus(data.status || 'normal')
        setNotes(data.notes || '')
      }
    } catch (error) {
      console.error('Error loading clothing:', error)
      toast.error('加载失败')
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSelectedFile(file)
    setProcessingImage(true)

    try {
      let processedBlob: Blob
      
      if (removeBg) {
        console.log('使用 AI 智能抠图处理图片...')
        processedBlob = await removeBackground(file, { 
          backgroundColor: 'transparent', // 改用透明背景效果更好
          maxSize: 800, // 衣物图片不需要太高分辨率
          edgeBlur: 7, // 适度羽化，边缘更自然
          useAI: true, // 使用 AI 模型（效果最好）
          threshold: 80, // 色差阈值（回退方案使用）
          onProgress: (progress) => {
            console.log(`处理进度: ${progress}%`)
          }
        })
      } else {
        processedBlob = file
      }

      const previewUrl = URL.createObjectURL(processedBlob)
      setProcessedImage(previewUrl)
    } catch (error) {
      console.error('Error processing image:', error)
      setProcessedImage(URL.createObjectURL(file))
    } finally {
      setProcessingImage(false)
    }
  }

  const handleSave = async () => {
    if (!categoryId) {
      toast.warning('请选择分类')
      return
    }

    setSaving(true)

    try {
      let imageUrl = clothing?.image_url

      // 如果选择了新图片，先上传
      if (selectedFile) {
        let fileToUpload = selectedFile

        if (removeBg && processedImage) {
          const response = await fetch(processedImage)
          fileToUpload = await response.blob() as File
        }

        const formData = new FormData()
        formData.append('file', fileToUpload)
        formData.append('removeBg', removeBg.toString())

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: formData,
        })

        if (!uploadResponse.ok) {
          throw new Error('上传失败')
        }

        const { data } = await uploadResponse.json()
        imageUrl = data.imageUrl
      }

      // 更新衣物信息
      const { error } = await supabase
        .from('clothings')
        .update({
          category_id: categoryId,
          name: name || null,
          image_url: imageUrl,
          colors,
          seasons,
          brand: brand || null,
          price: price ? parseFloat(price) : null,
          purchase_date: purchaseDate || null,
          status,
          notes: notes || null,
        })
        .eq('id', clothingId)

      if (error) throw error

      // 清理预览 URL
      if (processedImage) {
        URL.revokeObjectURL(processedImage)
      }

      toast.success('保存成功')
      setTimeout(() => {
        router.push(`/dashboard/wardrobes/${wardrobeId}/clothings/${clothingId}`)
      }, 500)
    } catch (error) {
      console.error('Error saving:', error)
      toast.error('保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  const level2Categories = categories.filter(c => c.level === 2)

  if (loading || categoriesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--primary)]"></div>
      </div>
    )
  }

  if (!clothing) {
    return (
      <Card className="text-center py-12">
        <p className="text-[var(--gray-600)] mb-4 font-medium">衣物不存在</p>
        <Button variant="ghost" onClick={() => router.back()}>
          返回
        </Button>
      </Card>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-6">
      {/* 顶部标题 - Editorial风格 */}
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-2 -ml-2"
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            返回
          </span>
        </Button>
        <div>
          <p className="text-xs tracking-[0.2em] uppercase text-[var(--gray-500)] mb-2">EDIT ITEM</p>
          <h1 className="text-display text-4xl md:text-5xl text-[var(--gray-900)]">
            编辑衣物
          </h1>
        </div>
        <div className="h-px w-32 bg-gradient-to-r from-[var(--accent)] to-transparent" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左侧：图片上传 */}
        <Card className="p-6">
          <h2 className="text-xl font-medium mb-5 text-[var(--gray-900)]">更换图片（可选）</h2>
          
          <div className="space-y-5">
            {/* 当前图片 */}
            {clothing.image_url && !processedImage && (
              <div>
                <p className="text-sm text-[var(--gray-600)] mb-2">当前图片</p>
                <div className="aspect-square bg-[var(--gray-100)] rounded-[var(--radius-lg)] overflow-hidden shadow-[var(--shadow-subtle)]">
                  <img
                    src={clothing.image_url}
                    alt={clothing.name || '衣物'}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}

            {/* 抠图开关 */}
            <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-[var(--radius-lg)] hover:bg-[var(--accent)]/5 transition-all group">
              <input
                type="checkbox"
                checked={removeBg}
                onChange={(e) => setRemoveBg(e.target.checked)}
                className="w-5 h-5 text-[var(--accent)] rounded focus:ring-[var(--accent)]"
              />
              <span className="text-sm text-[var(--gray-900)] font-medium group-hover:text-[var(--accent-dark)] transition-colors">
                自动去除背景
              </span>
            </label>

            {/* 文件选择 */}
            <div
              className="border-2 border-dashed border-[var(--gray-300)] rounded-[var(--radius-xl)] p-10 text-center cursor-pointer hover:border-[var(--accent)] hover:bg-[var(--accent)]/5 transition-all group"
              style={{ transition: 'all var(--transition-smooth)' }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--accent)]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-[var(--accent-dark)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-[var(--gray-900)] font-medium mb-1">
                点击选择新图片
              </p>
              <p className="text-sm text-[var(--gray-600)]">
                支持 JPG、PNG、WebP，单张最大 10MB
              </p>
            </div>

            {/* 图片预览 */}
            {processingImage && (
              <div className="text-center py-6">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[var(--accent)] mx-auto"></div>
                <p className="text-sm text-[var(--gray-600)] mt-3">处理中...</p>
              </div>
            )}

            {processedImage && (
              <div>
                <p className="text-sm text-[var(--gray-600)] mb-2">新图片预览</p>
                <div 
                  className="aspect-square rounded-[var(--radius-lg)] overflow-hidden shadow-[var(--shadow-subtle)] relative"
                  style={{ 
                    background: 'linear-gradient(rgba(128, 128, 128, 0.1), rgba(128, 128, 128, 0.1)), #d4b896'
                  }}
                >
                  <img
                    src={processedImage}
                    alt="预览"
                    className="w-full h-full object-contain"
                  />
                  {removeBg && (
                    <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                      已去背景
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* 右侧：衣物信息 */}
        <Card className="p-6">
          <h2 className="text-xl font-medium mb-5 text-[var(--gray-900)]">衣物信息</h2>
          
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[var(--gray-900)] mb-2 tracking-wide">
                分类 <span className="text-[var(--error)]">*</span>
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-4 py-3 border border-[var(--gray-300)] rounded-[var(--radius-lg)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)] text-[var(--gray-900)] bg-[var(--input-bg)] shadow-[var(--shadow-subtle)] transition-all"
                style={{ transition: 'all var(--transition-smooth)' }}
                required
              >
                <option value="">选择分类</option>
                {level2Categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="名称（可选）"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：黑色羽绒服"
            />

            <div>
              <label className="block text-sm font-medium text-[var(--gray-900)] mb-3 tracking-wide">
                颜色（可多选）
              </label>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2.5">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => {
                        setColors(prev =>
                          prev.includes(color)
                            ? prev.filter(c => c !== color)
                            : [...prev, color]
                        )
                      }}
                      className={`px-4 py-2 rounded-[var(--radius-full)] text-sm font-medium transition-all ${
                        colors.includes(color)
                          ? 'bg-[var(--accent-dark)] text-white shadow-[var(--shadow-soft)]'
                          : 'border border-[var(--gray-300)] text-[var(--gray-900)] hover:border-[var(--accent)] hover:bg-[var(--accent)]/5 bg-[var(--card-bg)]'
                      }`}
                      style={{ transition: 'all var(--transition-smooth)' }}
                    >
                      {color}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setShowCustomColorInput(!showCustomColorInput)}
                    className="px-4 py-2 rounded-[var(--radius-full)] text-sm font-medium border-2 border-dashed border-[var(--gray-400)] text-[var(--gray-700)] hover:border-[var(--accent)] hover:bg-[var(--accent)]/5 transition-all bg-[var(--card-bg)]"
                    style={{ transition: 'all var(--transition-smooth)' }}
                  >
                    + 自定义
                  </button>
                </div>
                
                {showCustomColorInput && (
                  <div className="flex gap-3 animate-fade-in">
                    <input
                      type="text"
                      value={customColor}
                      onChange={(e) => setCustomColor(e.target.value)}
                      placeholder="输入颜色名称，如：深蓝色"
                      className="flex-1 px-4 py-2.5 border border-[var(--gray-300)] rounded-[var(--radius-lg)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)] text-[var(--gray-900)] bg-[var(--input-bg)] shadow-[var(--shadow-subtle)] transition-all"
                      style={{ transition: 'all var(--transition-smooth)' }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && customColor.trim()) {
                          if (!colors.includes(customColor.trim())) {
                            setColors(prev => [...prev, customColor.trim()])
                          }
                          setCustomColor('')
                          setShowCustomColorInput(false)
                        }
                      }}
                    />
                    <Button
                      variant="primary"
                      onClick={() => {
                        if (customColor.trim() && !colors.includes(customColor.trim())) {
                          setColors(prev => [...prev, customColor.trim()])
                          setCustomColor('')
                          setShowCustomColorInput(false)
                        }
                      }}
                    >
                      添加
                    </Button>
                  </div>
                )}
                
                {colors.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-3 border-t border-[var(--gray-200)]">
                    <span className="text-xs text-[var(--gray-600)] self-center tracking-wide uppercase">已选择：</span>
                    {colors.map((color, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--accent)]/15 text-[var(--accent-dark)] text-sm rounded-[var(--radius-full)] font-medium"
                      >
                        {color}
                        <button
                          type="button"
                          onClick={() => setColors(prev => prev.filter(c => c !== color))}
                          className="ml-0.5 text-[var(--accent-dark)] hover:text-[var(--error)] font-bold transition-colors"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--gray-900)] mb-3 tracking-wide">
                季节（可多选）
              </label>
              <div className="flex flex-wrap gap-2.5">
                {SEASONS.map((season) => (
                  <button
                    key={season}
                    type="button"
                    onClick={() => {
                      setSeasons(prev =>
                        prev.includes(season)
                          ? prev.filter(s => s !== season)
                          : [...prev, season]
                      )
                    }}
                    className={`px-4 py-2 rounded-[var(--radius-full)] text-sm font-medium transition-all ${
                      seasons.includes(season)
                        ? 'bg-[var(--accent-dark)] text-white shadow-[var(--shadow-soft)]'
                        : 'border border-[var(--gray-300)] text-[var(--gray-900)] hover:border-[var(--accent)] hover:bg-[var(--accent)]/5 bg-[var(--card-bg)]'
                    }`}
                    style={{ transition: 'all var(--transition-smooth)' }}
                  >
                    {season}
                  </button>
                ))}
              </div>
            </div>

            <Input
              label="品牌"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="例如：Nike"
            />

            <Input
              label="价格（元）"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
            />

            <Input
              label="购买日期"
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
            />

            <div>
              <label className="block text-sm font-medium text-[var(--gray-900)] mb-3 tracking-wide">
                状态
              </label>
              <div className="flex flex-wrap gap-2.5">
                {STATUSES.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setStatus(s.value)}
                    className={`px-4 py-2 rounded-[var(--radius-full)] text-sm font-medium transition-all ${
                      status === s.value
                        ? 'bg-[var(--accent-dark)] text-white shadow-[var(--shadow-soft)]'
                        : 'border border-[var(--gray-300)] text-[var(--gray-900)] hover:border-[var(--accent)] hover:bg-[var(--accent)]/5 bg-[var(--card-bg)]'
                    }`}
                    style={{ transition: 'all var(--transition-smooth)' }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--gray-900)] mb-2 tracking-wide">
                备注
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="添加备注信息..."
                className="w-full px-4 py-3 border border-[var(--gray-300)] rounded-[var(--radius-lg)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)] resize-none text-[var(--gray-900)] bg-[var(--input-bg)] shadow-[var(--shadow-subtle)] focus:shadow-[var(--shadow-soft)] transition-all"
                style={{ transition: 'all var(--transition-smooth)' }}
                rows={3}
              />
            </div>
          </div>
        </Card>
      </div>

      {/* 提交按钮 */}
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
          onClick={handleSave}
          isLoading={saving}
          disabled={!categoryId || processingImage}
        >
          保存修改
        </Button>
      </div>

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
