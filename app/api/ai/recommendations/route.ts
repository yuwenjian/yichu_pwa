import { NextRequest, NextResponse } from 'next/server'
import { generateAIRecommendations } from '@/lib/ai/deepseek-client'
import type { DeepSeekAnalysisInput } from '@/lib/ai/deepseek-prompt'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const { wardrobeId } = await request.json()
    
    if (!wardrobeId) {
      return NextResponse.json(
        { error: 'Wardrobe ID is required' },
        { status: 400 }
      )
    }
    
    // 验证 API Key
    const apiKey = process.env.DEEPSEEK_API_KEY
    if (!apiKey) {
      console.error('DeepSeek API key not configured')
      // 返回空建议而不是报错，使用本地规则作为降级方案
      return NextResponse.json({ recommendations: [], summary: '', fallback: true })
    }
    
    // 创建 Supabase 客户端
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // 准备输入数据
    const input = await prepareAnalysisInput(supabase, wardrobeId)
    
    if (!input) {
      return NextResponse.json(
        { error: 'Failed to prepare analysis input' },
        { status: 500 }
      )
    }
    
    // 调用 DeepSeek
    const result = await generateAIRecommendations(input, {
      apiKey,
      model: 'deepseek-chat',
      temperature: 0.7,
      maxTokens: 2000
    })
    
    if (!result) {
      // API 调用失败，返回空建议使用降级方案
      return NextResponse.json({ recommendations: [], summary: '', fallback: true })
    }
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('AI recommendations API error:', error)
    // 返回空建议使用降级方案
    return NextResponse.json({ recommendations: [], summary: '', fallback: true })
  }
}

/**
 * 准备 DeepSeek 分析所需的输入数据
 */
async function prepareAnalysisInput(
  supabase: any,
  wardrobeId: string
): Promise<DeepSeekAnalysisInput | null> {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🔍 开始准备 AI 分析数据')
    console.log('   wardrobeId:', wardrobeId)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    // 并行查询所有需要的数据
    const [wardrobeResult, clothingsResult, outfitsResult, statisticsResult] = await Promise.all([
      // 获取衣橱基础信息
      supabase
        .from('wardrobes')
        .select('id, name')
        .eq('id', wardrobeId)
        .single(),
      
      // 获取衣物数据 - 只查询基本字段
      supabase
        .from('clothings')
        .select(`
          id, 
          name, 
          category:categories(name),
          brand,
          price,
          colors,
          seasons,
          purchase_date,
          use_count,
          last_used_at,
          status
        `)
        .eq('wardrobe_id', wardrobeId),
      
      // 获取搭配数据 - 只查询基本字段
      supabase
        .from('outfits')
        .select('id, name, use_count, last_used_at')
        .eq('wardrobe_id', wardrobeId),
      
      // 获取统计数据（可选）
      supabase
        .from('clothings')
        .select('price, use_count')
        .eq('wardrobe_id', wardrobeId)
    ])
    
    if (wardrobeResult.error || !wardrobeResult.data) {
      console.error('Failed to fetch wardrobe:', wardrobeResult.error)
      return null
    }
    
    const wardrobe = wardrobeResult.data
    const clothings = clothingsResult.data || []
    const outfits = outfitsResult.data || []
    
    // 详细调试日志
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📊 AI 建议数据查询结果:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🏷️  衣橱信息:')
    console.log('   - ID:', wardrobeId)
    console.log('   - 名称:', wardrobe.name)
    console.log('')
    console.log('👔 衣物查询:')
    console.log('   - 查询条件: wardrobe_id =', wardrobeId)
    console.log('   - 查询结果数量:', clothings.length)
    console.log('   - 是否有错误:', clothingsResult.error ? 'YES' : 'NO')
    if (clothingsResult.error) {
      console.error('   ❌ 错误详情:', JSON.stringify(clothingsResult.error, null, 2))
    }
    if (clothings.length > 0) {
      console.log('   - 第一件衣物示例:')
      console.log('     * ID:', clothings[0].id)
      console.log('     * 名称:', clothings[0].name)
      console.log('     * 分类:', clothings[0].category)
      console.log('     * 颜色:', clothings[0].colors)
      console.log('     * wardrobe_id:', clothings[0].wardrobe_id || '(字段未返回)')
    } else {
      console.warn('   ⚠️  没有查询到任何衣物！')
      console.warn('   请检查：')
      console.warn('   1. wardrobeId 是否正确')
      console.warn('   2. 数据库中是否有该衣橱的衣物')
      console.warn('   3. clothings 表的 wardrobe_id 字段是否正确')
    }
    console.log('')
    console.log('🎯 搭配查询:')
    console.log('   - 查询结果数量:', outfits.length)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    // 计算统计数据
    const totalValue = clothings.reduce((sum, c) => sum + (c.price || 0), 0)
    const averagePrice = clothings.length > 0 ? totalValue / clothings.length : 0
    const wornClothings = clothings.filter(c => (c.use_count || 0) > 0)
    const utilizationRate = clothings.length > 0 ? (wornClothings.length / clothings.length) * 100 : 0
    
    // 计算当前季节和即将到来的季节
    const now = new Date()
    const month = now.getMonth() + 1
    let currentSeason: 'spring' | 'summer' | 'autumn' | 'winter'
    let upcomingSeason: 'spring' | 'summer' | 'autumn' | 'winter'
    
    if (month >= 3 && month <= 5) {
      currentSeason = 'spring'
      upcomingSeason = 'summer'
    } else if (month >= 6 && month <= 8) {
      currentSeason = 'summer'
      upcomingSeason = 'autumn'
    } else if (month >= 9 && month <= 11) {
      currentSeason = 'autumn'
      upcomingSeason = 'winter'
    } else {
      currentSeason = 'winter'
      upcomingSeason = 'spring'
    }
    
    // 计算最近30天购买数量
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const recentPurchases = clothings.filter(c => 
      c.purchase_date && new Date(c.purchase_date) >= thirtyDaysAgo
    ).length
    
    // 计算购买频率
    let purchaseFrequency: 'low' | 'medium' | 'high'
    if (recentPurchases >= 5) {
      purchaseFrequency = 'high'
    } else if (recentPurchases >= 2) {
      purchaseFrequency = 'medium'
    } else {
      purchaseFrequency = 'low'
    }
    
    // 分析用户偏好（基于现有数据推断）
    const stylePreferences = inferStylePreferences(clothings)
    const favoriteColors = inferFavoriteColors(clothings)
    const favoriteBrands = inferFavoriteBrands(clothings)
    const budgetLevel = averagePrice > 500 ? 'high' : averagePrice > 200 ? 'medium' : 'low'
    
    // 转换季节格式
    const convertSeason = (seasons: string | string[] | null): string => {
      if (!seasons) return 'all'
      if (Array.isArray(seasons)) {
        if (seasons.length === 0) return 'all'
        if (seasons.includes('春')) return 'spring'
        if (seasons.includes('夏')) return 'summer'
        if (seasons.includes('秋')) return 'autumn'
        if (seasons.includes('冬')) return 'winter'
        return 'all'
      }
      if (seasons.includes('春')) return 'spring'
      if (seasons.includes('夏')) return 'summer'
      if (seasons.includes('秋')) return 'autumn'
      if (seasons.includes('冬')) return 'winter'
      return 'all'
    }
    
    // 构建输入数据
    const input: DeepSeekAnalysisInput = {
      wardrobe: {
        id: wardrobe.id,
        name: wardrobe.name,
        totalClothings: clothings.length,
        totalOutfits: outfits.length,
        totalValue,
        averagePrice,
        utilizationRate
      },
      clothings: clothings.map(c => ({
        id: c.id,
        name: c.name,
        category: (c.category as any)?.name || '未分类',
        brand: c.brand || '未知品牌',
        price: c.price || 0,
        color: Array.isArray(c.colors) ? c.colors.join(', ') : (c.colors || '未知'),
        size: '未知', // 数据库中没有 size 字段
        season: convertSeason(c.seasons),
        purchasedAt: c.purchase_date || now.toISOString(),
        useCount: c.use_count || 0,
        lastUsedAt: c.last_used_at,
        status: c.status || 'normal',
        tags: [] // 数据库中没有 tags 字段
      })),
      outfits: outfits.map(o => ({
        id: o.id,
        name: o.name,
        useCount: o.use_count || 0,
        lastUsedAt: o.last_used_at,
        itemsCount: 3,
        tags: [] // 数据库中没有 tags 字段
      })),
      userPreferences: {
        stylePreferences,
        favoriteColors,
        favoriteBrands,
        budgetLevel
      },
      context: {
        currentSeason,
        upcomingSeason,
        recentPurchases,
        purchaseFrequency
      }
    }
    
    // 验证输入数据
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ 准备发送给 DeepSeek 的数据:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📊 衣橱统计:')
    console.log('   - 衣物总数:', input.wardrobe.totalClothings)
    console.log('   - 搭配总数:', input.wardrobe.totalOutfits)
    console.log('   - 总价值: ¥', input.wardrobe.totalValue.toFixed(2))
    console.log('   - 平均价格: ¥', input.wardrobe.averagePrice.toFixed(2))
    console.log('   - 利用率:', input.wardrobe.utilizationRate.toFixed(1), '%')
    console.log('')
    console.log('🌍 上下文信息:')
    console.log('   - 当前季节:', input.context.currentSeason)
    console.log('   - 即将到来:', input.context.upcomingSeason)
    console.log('   - 最近购买:', input.context.recentPurchases, '件')
    console.log('   - 购买频率:', input.context.purchaseFrequency)
    console.log('')
    console.log('👤 用户偏好:')
    console.log('   - 风格偏好:', input.userPreferences.stylePreferences.join(', '))
    console.log('   - 喜欢的颜色:', input.userPreferences.favoriteColors.join(', '))
    console.log('   - 喜欢的品牌:', input.userPreferences.favoriteBrands.join(', '))
    console.log('   - 预算水平:', input.userPreferences.budgetLevel)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    return input
  } catch (error) {
    console.error('Error preparing analysis input:', error)
    return null
  }
}

/**
 * 推断用户风格偏好（基于分类，因为数据库中没有 tags 字段）
 */
function inferStylePreferences(clothings: any[]): string[] {
  // 由于没有 tags 字段，根据分类推断风格
  const categoryCount = new Map<string, number>()
  
  clothings.forEach(c => {
    const cat = (c.category as any)?.name
    if (cat) {
      categoryCount.set(cat, (categoryCount.get(cat) || 0) + 1)
    }
  })
  
  // 返回默认风格偏好
  return ['休闲', '简约']
}

/**
 * 推断喜欢的颜色（基于衣物颜色分布）
 */
function inferFavoriteColors(clothings: any[]): string[] {
  const colorCounts = new Map<string, number>()
  
  clothings.forEach(c => {
    if (c.colors) {
      // colors 是数组，需要遍历
      const colors = Array.isArray(c.colors) ? c.colors : [c.colors]
      colors.forEach((color: string) => {
        if (color && color !== '未知') {
          colorCounts.set(color, (colorCounts.get(color) || 0) + 1)
        }
      })
    }
  })
  
  const sortedColors = Array.from(colorCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([color]) => color)
  
  return sortedColors.length > 0 ? sortedColors : ['黑色', '白色']
}

/**
 * 推断喜欢的品牌（基于品牌分布）
 */
function inferFavoriteBrands(clothings: any[]): string[] {
  const brandCounts = new Map<string, number>()
  
  clothings.forEach(c => {
    if (c.brand && c.brand !== '未知品牌') {
      brandCounts.set(c.brand, (brandCounts.get(c.brand) || 0) + 1)
    }
  })
  
  const sortedBrands = Array.from(brandCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([brand]) => brand)
  
  return sortedBrands.length > 0 ? sortedBrands : []
}
