'use client'

import { useParams, useRouter } from 'next/navigation'
import { useOutfit, useDeleteOutfit, useIncrementOutfitUseCount } from '@/lib/hooks/useOutfitsQuery'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

export default function OutfitDetailPage() {
  const params = useParams()
  const router = useRouter()
  const outfitId = params.id as string

  const { data: outfit, isLoading } = useOutfit(outfitId)
  const deleteOutfitMutation = useDeleteOutfit()
  const incrementUseCountMutation = useIncrementOutfitUseCount()

  const handleDelete = async () => {
    if (!confirm(`确定要删除搭配 ${outfit?.name} 吗？`)) {
      return
    }

    try {
      await deleteOutfitMutation.mutateAsync(outfitId)
      alert('删除成功')
      router.push('/dashboard/outfits')
    } catch (error) {
      console.error('Error deleting outfit:', error)
      alert('删除失败，请重试')
    }
  }

  const handleUse = async () => {
    try {
      await incrementUseCountMutation.mutateAsync(outfitId)
      alert('已记录本次使用')
    } catch (error) {
      console.error('Error incrementing use count:', error)
      alert('操作失败，请重试')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--primary)]"></div>
      </div>
    )
  }

  if (!outfit) {
    return (
      <Card className="text-center py-12">
        <p className="text-[#5c5954] mb-4 font-medium">搭配不存在</p>
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard/outfits')}
          className="!text-[#1a1a1a]"
        >
          返回列表
        </Button>
      </Card>
    )
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="!text-white"
        >
          ← 返回
        </Button>
        <div className="flex gap-2">
          <Button
            variant="primary"
            onClick={handleUse}
            isLoading={incrementUseCountMutation.isPending}
          >
            记录穿搭
          </Button>
          <Button
            variant="outline"
            onClick={handleDelete}
            isLoading={deleteOutfitMutation.isPending}
            className="!bg-red-600 !text-white !border-red-600 hover:!bg-red-700"
          >
            删除
          </Button>
        </div>
      </div>

      {/* 搭配信息 */}
      <Card>
        <h1 className="text-2xl font-bold mb-2 text-[#1a1a1a]">{outfit.name}</h1>
        {outfit.description && (
          <p className="text-[#5c5954] mb-4">{outfit.description}</p>
        )}
        
        <div className="flex items-center gap-4 text-sm text-[#5c5954]">
          <span>使用 {outfit.use_count} 次</span>
          {outfit.last_used_at && (
            <span>最近使用: {new Date(outfit.last_used_at).toLocaleDateString('zh-CN')}</span>
          )}
          {outfit.is_template && (
            <span className="px-2 py-1 bg-[var(--primary)] text-white text-xs rounded">
              模板
            </span>
          )}
        </div>
      </Card>

      {/* 搭配单品 */}
      <Card>
        <h2 className="text-xl font-bold mb-4 text-[#1a1a1a]">单品列表 ({outfit.items?.length || 0})</h2>
        
        {!outfit.items || outfit.items.length === 0 ? (
          <p className="text-[#5c5954] text-center py-8">该搭配没有关联衣物</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {outfit.items.map((item) => (
              <div
                key={item.id}
                className="cursor-pointer group"
                onClick={() => router.push(`/dashboard/wardrobes/${item.clothing.wardrobe_id}/clothings/${item.clothing.id}`)}
              >
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 group-hover:ring-2 group-hover:ring-[var(--primary)] transition-all">
                  <img
                    src={item.clothing.image_url}
                    alt={item.clothing.name || '衣物'}
                    className="w-full h-full object-cover"
                  />
                </div>
                {item.clothing.name && (
                  <p className="mt-2 text-sm text-[#1a1a1a] text-center line-clamp-1">
                    {item.clothing.name}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 穿搭记录 */}
      <Card className="p-6 bg-white/5 backdrop-blur-sm border border-white/10">
        <h3 className="text-lg font-semibold mb-2 text-white">💡 提示</h3>
        <ul className="space-y-2 text-sm text-white/80">
          <li>• 点击【记录穿搭】可以增加使用次数统计</li>
          <li>• 点击单品图片可以查看衣物详情</li>
          <li>• 可以编辑或删除这套搭配</li>
        </ul>
      </Card>
    </div>
  )
}
