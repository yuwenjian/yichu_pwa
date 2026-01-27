'use client'

import { useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { removeBackground } from '@/lib/image-processor'
import { useCategories } from '@/lib/hooks/useCategoriesQuery'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

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
  
  // 表单数据
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [processedImages, setProcessedImages] = useState<string[]>([])
  const [removeBg, setRemoveBg] = useState(false)
  const [processingImages, setProcessingImages] = useState(false)
  
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

    setSelectedFiles(files)
    setProcessingImages(true)

    // 处理图片（如果需要抠图）
    const processed: string[] = []
    for (const file of files) {
      try {
        let processedBlob: Blob
        
        if (removeBg) {
          // 执行抠图
          processedBlob = await removeBackground(file, { backgroundColor: '#FFFFFF' })
        } else {
          processedBlob = file
        }

        // 转换为预览 URL
        const previewUrl = URL.createObjectURL(processedBlob)
        processed.push(previewUrl)
      } catch (error) {
        console.error('Error processing image:', error)
        // 如果处理失败，使用原图
        processed.push(URL.createObjectURL(file))
      }
    }

    setProcessedImages(processed)
    setProcessingImages(false)
  }

  const handleUpload = async () => {
    if (selectedFiles.length === 0 || !categoryId) {
      alert('请选择图片和分类')
      return
    }

    setUploading(true)

    try {
      const uploadedUrls: string[] = []

      // 上传每张图片
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i]
        let fileToUpload = file

        // 如果选择了抠图，使用处理后的图片
        if (removeBg && processedImages[i]) {
          const response = await fetch(processedImages[i])
          fileToUpload = await response.blob() as File
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
      alert('上传失败，请重试')
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
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4 !text-white"
        >
          ← 返回
        </Button>
        <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
          添加衣物
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左侧：图片上传 */}
        <Card>
          <h2 className="text-xl font-semibold mb-4 text-[#1a1a1a]">上传图片</h2>
          
          <div className="space-y-4">
            {/* 抠图开关 */}
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={removeBg}
                onChange={(e) => setRemoveBg(e.target.checked)}
                className="w-4 h-4 text-[var(--primary)] rounded focus:ring-[var(--primary)]"
              />
              <span className="text-sm text-[#1a1a1a] font-medium">
                自动去除背景（设置为白色）
              </span>
            </label>

            {/* 文件选择 */}
            <div
              className="border-2 border-dashed border-[var(--gray-300)] rounded-lg p-8 text-center cursor-pointer hover:border-[var(--primary)] transition-colors"
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
              <div className="text-4xl mb-2">📷</div>
              <p className="text-[#2a2825] font-medium">
                点击或拖拽图片到这里
              </p>
              <p className="text-sm text-[#5c5954] mt-1">
                支持 JPG、PNG、WebP，单张最大 10MB
              </p>
            </div>

            {/* 图片预览 */}
            {processingImages && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[var(--primary)] mx-auto"></div>
                <p className="text-sm text-[#5c5954] mt-2">处理中...</p>
              </div>
            )}

            {processedImages.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {processedImages.map((url, index) => (
                  <div key={index} className="aspect-square bg-[var(--gray-100)] rounded-lg overflow-hidden">
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
        <Card>
          <h2 className="text-xl font-semibold mb-4 text-[#1a1a1a]">衣物信息</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
                分类 <span className="text-[var(--error)]">*</span>
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-4 py-2.5 border border-[var(--gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-[#1a1a1a] bg-white"
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
              <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
                颜色（可多选）
              </label>
              <div className="space-y-3">
                {/* 预设颜色按钮 */}
                <div className="flex flex-wrap gap-2">
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
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        colors.includes(color)
                          ? 'bg-[var(--primary)] text-white shadow-md'
                          : 'bg-white border-2 border-gray-300 text-gray-800 hover:bg-blue-50 hover:border-blue-400 hover:shadow-sm'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setShowCustomColorInput(!showCustomColorInput)}
                    className="px-4 py-2 rounded-full text-sm font-medium bg-white border-2 border-dashed border-gray-400 text-gray-600 hover:bg-blue-50 hover:border-blue-400 transition-all"
                  >
                    + 自定义
                  </button>
                </div>
                
                {/* 自定义颜色输入 */}
                {showCustomColorInput && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customColor}
                      onChange={(e) => setCustomColor(e.target.value)}
                      placeholder="输入颜色名称，如：深蓝色"
                      className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-gray-800"
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
                    <button
                      type="button"
                      onClick={() => {
                        if (customColor.trim() && !colors.includes(customColor.trim())) {
                          setColors(prev => [...prev, customColor.trim()])
                          setCustomColor('')
                          setShowCustomColorInput(false)
                        }
                      }}
                      className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
                    >
                      添加
                    </button>
                  </div>
                )}
                
                {/* 已选颜色标签（包括自定义的） */}
                {colors.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
                    <span className="text-xs text-gray-500 self-center">已选择：</span>
                    {colors.map((color, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full font-medium"
                      >
                        {color}
                        <button
                          type="button"
                          onClick={() => setColors(prev => prev.filter(c => c !== color))}
                          className="ml-1 text-blue-600 hover:text-blue-800 font-bold"
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
              <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
                季节（可多选）
              </label>
              <div className="flex flex-wrap gap-2">
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
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      seasons.includes(season)
                        ? 'bg-[var(--primary)] text-white shadow-md'
                        : 'bg-white border-2 border-gray-300 text-gray-800 hover:bg-blue-50 hover:border-blue-400 hover:shadow-sm'
                    }`}
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
              <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
                状态
              </label>
              <div className="flex flex-wrap gap-2">
                {STATUSES.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setStatus(s.value)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      status === s.value
                        ? 'bg-[var(--primary)] text-white shadow-md'
                        : 'bg-white border-2 border-gray-300 text-gray-800 hover:bg-blue-50 hover:border-blue-400 hover:shadow-sm'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1a1a1a] mb-2">
                备注
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="添加备注信息..."
                className="w-full px-4 py-2.5 border border-[var(--gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none text-[#1a1a1a] placeholder:text-[#5c5954]"
                rows={3}
              />
            </div>
          </div>
        </Card>
      </div>

      {/* 提交按钮 */}
      <div className="flex justify-end gap-3">
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
    </div>
  )
}
