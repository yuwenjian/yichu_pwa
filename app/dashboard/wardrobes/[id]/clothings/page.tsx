'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useClothings } from '@/lib/hooks/useClothingsQuery'
import { useCategories } from '@/lib/hooks/useCategoriesQuery'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function ClothingsPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const wardrobeId = params.id as string

  // 从 URL 获取分类信息
  const categoryIdFromUrl = searchParams.get('category') || ''
  const categoryNameFromUrl = searchParams.get('categoryName') || ''

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [pageTitle, setPageTitle] = useState('所有衣物')

  const { data: categories = [], isLoading: categoriesLoading } = useCategories(wardrobeId)
  
  // 计算要查询的分类 ID 列表
  const getCategoryIdsForQuery = () => {
    // 如果手动选择了分类，使用选择的分类
    if (selectedCategory) {
      return { categoryId: selectedCategory, categoryIds: undefined }
    }
    
    // 如果 URL 中有分类参数
    if (categoryIdFromUrl && categories.length > 0) {
      const urlCategory = categories.find(c => c.id === categoryIdFromUrl)
      if (urlCategory) {
        if (urlCategory.level === 1) {
          // 一级分类：查询该分类及其所有子分类的衣物
          const childIds = categories
            .filter(c => c.level === 2 && c.parent_id === categoryIdFromUrl)
            .map(c => c.id)
          return {
            categoryId: undefined,
            categoryIds: [categoryIdFromUrl, ...childIds]
          }
        } else {
          // 二级分类：只查询该分类
          return { categoryId: categoryIdFromUrl, categoryIds: undefined }
        }
      }
    }
    
    return { categoryId: undefined, categoryIds: undefined }
  }

  const { categoryId: queryCategoryId, categoryIds: queryCategoryIds } = getCategoryIdsForQuery()
  
  const { data: clothings = [], isLoading: clothingsLoading } = useClothings({
    wardrobeId,
    categoryId: queryCategoryId,
    categoryIds: queryCategoryIds,
    status: selectedStatus,
    searchTerm,
  })

  // 更新页面标题
  useEffect(() => {
    // 优先从 categories 数据中查找分类名称
    if (categoryIdFromUrl && categories.length > 0) {
      const category = categories.find(c => c.id === categoryIdFromUrl)
      if (category) {
        setPageTitle(category.name)
        return
      }
    }
    
    // 其次使用 URL 中的名称
    if (categoryNameFromUrl) {
      setPageTitle(decodeURIComponent(categoryNameFromUrl))
      return
    }
    
    // 如果手动选择了分类
    if (selectedCategory && categories.length > 0) {
      const category = categories.find(c => c.id === selectedCategory)
      if (category) {
        setPageTitle(category.name)
        return
      }
    }
    
    // 默认标题
    setPageTitle('所有衣物')
  }, [categoryIdFromUrl, selectedCategory, categoryNameFromUrl, categories])

  // 获取可显示的二级分类（如果有选中一级分类，则只显示其子分类）
  const getDisplayCategories = () => {
    if (!categoryIdFromUrl) {
      // 没有从 URL 传入分类，显示所有二级分类
      return categories.filter(c => c.level === 2)
    }
    
    // 检查 URL 中的分类是一级还是二级
    const urlCategory = categories.find(c => c.id === categoryIdFromUrl)
    if (!urlCategory) return []
    
    if (urlCategory.level === 1) {
      // 一级分类，显示其子分类
      return categories.filter(c => c.level === 2 && c.parent_id === categoryIdFromUrl)
    } else {
      // 二级分类，显示同级的所有二级分类
      return categories.filter(c => c.level === 2 && c.parent_id === urlCategory.parent_id)
    }
  }

  const displayCategories = getDisplayCategories()
  const isLoading = categoriesLoading || clothingsLoading

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
        <div>
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-2"
          >
            ← 返回
          </Button>
          <h1 className="text-3xl font-bold text-[var(--gray-900)]" style={{ fontFamily: 'Playfair Display, serif' }}>
            {pageTitle}
          </h1>
        </div>
        <Button
          variant="primary"
          onClick={() => router.push(`/dashboard/wardrobes/${wardrobeId}/clothings/new`)}
        >
          + 添加衣物
        </Button>
      </div>

      {/* 筛选栏 */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="搜索名称或品牌..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-[var(--gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-[var(--gray-900)] bg-white"
            style={{ color: 'var(--gray-900)' }}
          >
            <option value="">全部</option>
            {displayCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 border border-[var(--gray-300)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-[var(--gray-900)] bg-white"
            style={{ color: 'var(--gray-900)' }}
          >
            <option value="">所有状态</option>
            <option value="normal">常穿</option>
            <option value="damaged">破损</option>
            <option value="idle">闲置</option>
            <option value="discarded">丢弃</option>
          </select>
        </div>
      </Card>

      {/* 衣物网格 */}
      {clothings.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-[var(--gray-700)] mb-4 font-medium">没有找到衣物</p>
          <Button
            variant="primary"
            onClick={() => router.push(`/dashboard/wardrobes/${wardrobeId}/clothings/new`)}
          >
            添加第一件衣物
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {clothings.map((clothing) => (
            <Card
              key={clothing.id}
              hover
              className="p-0 overflow-hidden cursor-pointer"
              onClick={() => router.push(`/dashboard/wardrobes/${wardrobeId}/clothings/${clothing.id}`)}
            >
              <div className="aspect-square bg-[var(--gray-100)] relative">
                {clothing.image_url ? (
                  <img
                    src={clothing.image_url}
                    alt={clothing.name || '衣物'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl text-[var(--gray-400)]">
                    👔
                  </div>
                )}
                {clothing.status !== 'normal' && (
                  <div className="absolute top-2 right-2 px-2 py-1 bg-black/50 text-white text-xs rounded">
                    {clothing.status === 'damaged' ? '破损' :
                     clothing.status === 'idle' ? '闲置' : '丢弃'}
                  </div>
                )}
              </div>
              <div className="p-3">
                  <h3 className="font-medium text-sm truncate mb-1 text-[var(--gray-900)]">
                    {clothing.name || '未命名'}
                  </h3>
                  {clothing.brand && (
                    <p className="text-xs text-[var(--gray-600)] truncate">
                      {clothing.brand}
                    </p>
                  )}
                  {clothing.price && (
                    <p className="text-xs text-[var(--primary)] mt-1 font-semibold">
                      ¥{clothing.price.toLocaleString()}
                    </p>
                  )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
