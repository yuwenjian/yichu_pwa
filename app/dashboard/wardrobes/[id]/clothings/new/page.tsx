'use client'

import { useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { removeBackground } from '@/lib/image-processor'
import { useCategories } from '@/lib/hooks/useCategoriesQuery'
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

export default function NewClothingPage() {
  const params = useParams()
  const router = useRouter()
  const wardrobeId = params.id as string

  const { data: categories = [], isLoading } = useCategories(wardrobeId)
  const [uploading, setUploading] = useState(false)
  
  const toast = useToast()
  
  // 表单数据
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [processedImages, setProcessedImages] = useState<string[]>([])
  const [processedBlobs, setProcessedBlobs] = useState<Blob[]>([]) // 保存处理后的Blob
  const [removeBg, setRemoveBg] = useState(false)
  const [processingImages, setProcessingImages] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0) // 处理进度
  
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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    console.log('=== 开始处理图片 ===')
    console.log('removeBg 状态:', removeBg)
    console.log('文件数量:', files.length)

    setSelectedFiles(files)
    setProcessingImages(true)
    setProcessingProgress(0)

    // 处理图片（如果需要抠图）
    const processedUrls: string[] = []
    const processedBlobsArray: Blob[] = []
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      try {
        let processedBlob: Blob
        
        if (removeBg) {
          console.log('✅ removeBg = true, 将执行抠图')
          // 执行抠图（带进度回调）
          console.log(`开始处理图片 ${i + 1}/${files.length}:`, file.name)
          processedBlob = await removeBackground(file, { 
            backgroundColor: 'transparent', // 使用透明背景
            maxSize: 1024, // 限制最大尺寸以加快速度
            onProgress: (progress) => {
              // 计算总体进度
              const totalProgress = ((i / files.length) * 100) + (progress / files.length)
              setProcessingProgress(Math.round(totalProgress))
            }
          })
          console.log(`图片处理完成 ${i + 1}/${files.length}:`, file.name)
        } else {
          console.log('❌ removeBg = false, 跳过抠图')
          processedBlob = file
        }

        // 保存处理后的Blob
        processedBlobsArray.push(processedBlob)
        
        // 转换为预览 URL
        const previewUrl = URL.createObjectURL(processedBlob)
        processedUrls.push(previewUrl)
      } catch (error) {
        console.error('Error processing image:', error)
        // 如果处理失败，使用原图
        processedBlobsArray.push(file)
        processedUrls.push(URL.createObjectURL(file))
      }
    }

    setProcessedBlobs(processedBlobsArray)
    setProcessedImages(processedUrls)
    setProcessingImages(false)
    setProcessingProgress(0)
  }

  const handleUpload = async () => {
    if (selectedFiles.length === 0 || !categoryId) {
      toast.warning('请选择图片和分类')
      return
    }

    setUploading(true)

    try {
      const uploadedUrls: string[] = []

      // 上传每张图片
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i]
        let fileToUpload: File | Blob = file

        // 如果选择了抠图，使用处理后的图片
        if (removeBg && processedBlobs[i]) {
          // 直接使用保存的处理后的 Blob
          const blob = processedBlobs[i]
          // 创建新的 File 对象
          fileToUpload = new File([blob], file.name.replace(/\.[^/.]+$/, '.png'), { type: 'image/png' })
          console.log('上传处理后的图片:', fileToUpload.name)
        } else {
          console.log('上传原始图片:', file.name)
        }

        // 上传到服务器
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
        uploadedUrls.push(data.imageUrl)
      }

      // 为每张图片创建衣物记录
      for (const imageUrl of uploadedUrls) {
        const { error } = await supabase
          .from('clothings')
          .insert([
            {
              wardrobe_id: wardrobeId,
              category_id: categoryId,
              name: name || undefined,
              image_url: imageUrl,
              colors,
              seasons,
              brand: brand || undefined,
              price: price ? parseFloat(price) : undefined,
              purchase_date: purchaseDate || undefined,
              status,
              notes: notes || undefined,
            },
          ])

        if (error) throw error
      }

      // 清理预览 URL
      processedImages.forEach(url => URL.revokeObjectURL(url))

      router.push(`/dashboard/wardrobes/${wardrobeId}`)
    } catch (error) {
      console.error('Error uploading:', error)
      toast.error('上传失败，请重试')
    } finally {
      setUploading(false)
    }
  }

  const level2Categories = categories.filter(c => c.level === 2)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--primary)]"></div>
      </div>
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
          <p className="text-xs tracking-[0.2em] uppercase text-[var(--gray-500)] mb-2">NEW ITEM</p>
          <h1 className="text-display text-4xl md:text-5xl text-[var(--gray-900)]">
            添加衣物
          </h1>
        </div>
        <div className="h-px w-32 bg-gradient-to-r from-[var(--accent)] to-transparent" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左侧：图片上传 */}
        <Card className="p-6">
          <h2 className="text-xl font-medium mb-5 text-[var(--gray-900)]">上传图片</h2>
          
          <div className="space-y-5">
            {/* 抠图开关 */}
            <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-[var(--radius-lg)] hover:bg-[var(--accent)]/5 transition-all group">
              <input
                type="checkbox"
                checked={removeBg}
                onChange={(e) => {
                  const checked = e.target.checked
                  console.log('复选框状态改变:', checked)
                  setRemoveBg(checked)
                }}
                className="w-5 h-5 text-[var(--accent)] rounded focus:ring-[var(--accent)]"
              />
              <span className="text-sm text-[var(--gray-900)] font-medium group-hover:text-[var(--accent-dark)] transition-colors">
                自动去除背景{removeBg && ' ✓'}
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
                multiple
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
                点击或拖拽图片到这里
              </p>
              <p className="text-sm text-[var(--gray-600)]">
                支持 JPG、PNG、WebP，支持多张上传，单张最大 10MB
              </p>
            </div>

            {/* 图片处理进度 */}
            {processingImages && (
              <div className="text-center py-6">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[var(--accent)] mx-auto"></div>
                <p className="text-sm text-[var(--gray-600)] mt-3">
                  {removeBg ? '正在去除背景...' : '处理中...'}
                  {processingProgress > 0 && ` ${processingProgress}%`}
                </p>
                {processingProgress > 0 && (
                  <div className="w-full max-w-xs mx-auto mt-3 bg-[var(--gray-200)] rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-[var(--accent)] h-full rounded-full transition-all duration-300"
                      style={{ width: `${processingProgress}%` }}
                    />
                  </div>
                )}
              </div>
            )}

            {processedImages.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {processedImages.map((url, index) => (
                  <div key={index} className="aspect-square bg-[var(--gray-100)] rounded-[var(--radius-lg)] overflow-hidden shadow-[var(--shadow-subtle)]">
                    <img
                      src={url}
                      alt={`预览 ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
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
                {/* 预设颜色按钮 */}
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
                
                {/* 自定义颜色输入 */}
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
                
                {/* 已选颜色标签 */}
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
          onClick={handleUpload}
          isLoading={uploading}
          disabled={selectedFiles.length === 0 || !categoryId || processingImages}
        >
          保存 {selectedFiles.length > 0 && `(${selectedFiles.length} 张)`}
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
