/**
 * DeepSeek AI 建议系统 - Prompt 模板
 * 用于生成个性化的衣橱管理建议
 */

import type { AIRecommendation } from '../hooks/useAIRecommendations'

// 输入数据类型定义
export interface DeepSeekAnalysisInput {
  // 衣橱基础信息
  wardrobe: {
    id: string
    name: string
    totalClothings: number
    totalOutfits: number
    totalValue: number
    averagePrice: number
    utilizationRate: number // 0-100
  }
  
  // 衣物数据
  clothings: Array<{
    id: string
    name: string
    category: string
    brand: string
    price: number
    color: string
    size: string
    season: string // spring, summer, autumn, winter, all
    purchasedAt: string // ISO date
    useCount: number
    lastUsedAt: string | null
    status: string // normal, damaged, lost
    tags: string[]
  }>
  
  // 搭配数据
  outfits: Array<{
    id: string
    name: string
    useCount: number
    lastUsedAt: string | null
    itemsCount: number
    tags: string[]
  }>
  
  // 用户偏好（新增）
  userPreferences?: {
    stylePreferences: string[] // 如: ["休闲", "正式", "运动", "复古"]
    favoriteColors: string[]
    favoriteBrands: string[]
    budgetLevel: 'low' | 'medium' | 'high' // 购买预算水平
  }
  
  // 上下文信息（新增）
  context: {
    currentSeason: 'spring' | 'summer' | 'autumn' | 'winter' // 当前季节
    upcomingSeason: 'spring' | 'summer' | 'autumn' | 'winter' // 即将到来的季节
    recentPurchases: number // 最近30天购买数量
    purchaseFrequency: 'low' | 'medium' | 'high' // 购买频率
  }
}

// 输出数据类型定义
export interface DeepSeekAnalysisOutput {
  recommendations: Array<{
    type: 'shopping' | 'style' | 'organization' | 'usage' | 'outfit'
    title: string // 简短标题，10字以内
    description: string // 简短描述，30-50字
    priority: 'high' | 'medium' | 'low'
    reasoning: string // AI 的分析理由，30-50字
    actionable?: {
      action: string // 具体行动建议
      relatedItems?: string[] // 相关的衣物ID
    }
  }>
  summary: string // 整体分析总结，50字以内
}

/**
 * 生成 DeepSeek Prompt
 */
export function generateDeepSeekPrompt(input: DeepSeekAnalysisInput): string {
  const seasonNames = {
    spring: '春季',
    summer: '夏季',
    autumn: '秋季',
    winter: '冬季'
  }
  
  const prompt = `你是一位专业的时尚衣橱管理顾问，擅长分析用户的衣物数据并提供个性化建议。

# 分析任务
请基于以下用户的衣橱数据，生成 **8 条** 最有价值的个性化建议。

# 用户衣橱数据

## 基础信息
- 衣橱名称：${input.wardrobe.name}
- 衣物总数：${input.wardrobe.totalClothings} 件
- 搭配总数：${input.wardrobe.totalOutfits} 个
- 总价值：¥${input.wardrobe.totalValue.toFixed(2)}
- 平均价格：¥${input.wardrobe.averagePrice.toFixed(2)}
- 利用率：${input.wardrobe.utilizationRate.toFixed(1)}%

## 上下文信息
- 当前季节：${seasonNames[input.context.currentSeason]}
- 即将到来的季节：${seasonNames[input.context.upcomingSeason]}
- 最近30天购买：${input.context.recentPurchases} 件
- 购买频率：${input.context.purchaseFrequency === 'high' ? '高频' : input.context.purchaseFrequency === 'medium' ? '中频' : '低频'}

${input.userPreferences ? `## 用户偏好
- 风格偏好：${input.userPreferences.stylePreferences.join('、')}
- 喜欢的颜色：${input.userPreferences.favoriteColors.join('、')}
- 喜欢的品牌：${input.userPreferences.favoriteBrands.join('、')}
- 预算水平：${input.userPreferences.budgetLevel === 'high' ? '高' : input.userPreferences.budgetLevel === 'medium' ? '中' : '低'}
` : ''}
## 衣物详情
${JSON.stringify(input.clothings, null, 2)}

## 搭配详情
${JSON.stringify(input.outfits, null, 2)}

# 分析维度

请从以下维度进行分析，并选择 **最重要的 8 个维度** 生成建议：

1. **使用频率分析**
   - 识别闲置衣物（超过30天未穿）
   - 分析高价衣物的使用性价比
   - 提升利用率建议

2. **季节性分析**（重要）
   - 当前季节（${seasonNames[input.context.currentSeason]}）的衣物是否充足
   - 即将到来的季节（${seasonNames[input.context.upcomingSeason]}）是否需要提前准备
   - 过季衣物的整理建议

3. **风格偏好匹配**（重要）
   - 现有衣物是否符合用户的风格偏好
   - 推荐符合用户风格的搭配组合
   - 建议尝试新风格或补充缺失的风格单品

4. **购买习惯分析**（重要）
   - 根据购买频率判断是否过度购买或购买不足
   - 分析购买的品类是否均衡
   - 预算控制建议

5. **分类平衡性**
   - 检查各分类（上装、下装、外套等）的比例
   - 识别缺失或过多的品类

6. **品牌与多样性**
   - 品牌集中度分析
   - 建议尝试符合用户偏好的新品牌

7. **搭配组合优化**
   - 推荐创建更多搭配
   - 基于现有衣物推荐搭配灵感

8. **整理与维护**
   - 检查破损、丢失状态的衣物
   - 提醒定期整理

# 输出要求

请严格按照以下 JSON 格式输出，不要包含任何其他内容：

\`\`\`json
{
  "recommendations": [
    {
      "type": "shopping | style | organization | usage | outfit",
      "title": "简短标题（10字以内）",
      "description": "简短描述，30-50字，直接告诉用户该做什么",
      "priority": "high | medium | low",
      "reasoning": "为什么给出这个建议，基于哪些数据分析，30-50字",
      "actionable": {
        "action": "具体的行动建议",
        "relatedItems": ["相关衣物ID数组，可选"]
      }
    }
  ],
  "summary": "整体分析总结，50字以内，概括用户衣橱的主要特点"
}
\`\`\`

# 建议类型说明
- **shopping**（购物建议）：推荐购买某类衣物
- **style**（风格建议）：风格搭配和穿搭建议
- **organization**（整理建议）：整理、清理、维护建议
- **usage**（使用建议）：提升衣物使用频率的建议
- **outfit**（搭配建议）：创建搭配组合的建议

# 优先级说明
- **high**（高）：需要立即关注的问题，如闲置严重、季节性缺失
- **medium**（中）：建议尽快处理，如分类不均衡、搭配不足
- **low**（低）：可选的优化建议，如尝试新品牌、风格多样化

# 注意事项
1. 建议必须基于数据分析，不要泛泛而谈
2. 优先考虑当前季节（${seasonNames[input.context.currentSeason]}）的实用性建议
3. 结合用户的风格偏好和购买习惯给出个性化建议
4. 每条建议的描述要简洁、具体、可操作
5. 必须严格返回 **8 条** 建议
6. 输出必须是有效的 JSON 格式，不要包含代码块标记

请开始分析并生成建议：`

  return prompt
}

/**
 * 解析 DeepSeek 的响应
 */
export function parseDeepSeekResponse(response: string): DeepSeekAnalysisOutput | null {
  try {
    // 移除可能的代码块标记
    let cleaned = response.trim()
    
    // 移除 ```json 和 ``` 标记
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.slice(7)
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.slice(3)
    }
    
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.slice(0, -3)
    }
    
    cleaned = cleaned.trim()
    
    // 解析 JSON
    const parsed = JSON.parse(cleaned) as DeepSeekAnalysisOutput
    
    // 验证数据格式
    if (!parsed.recommendations || !Array.isArray(parsed.recommendations)) {
      throw new Error('Invalid response format: missing recommendations array')
    }
    
    if (parsed.recommendations.length !== 8) {
      console.warn(`Expected 8 recommendations, got ${parsed.recommendations.length}`)
    }
    
    return parsed
  } catch (error) {
    console.error('Failed to parse DeepSeek response:', error)
    console.error('Raw response:', response)
    return null
  }
}

// AIRecommendation 类型（与 useAIRecommendations 保持一致）
export interface AIRecommendation {
  type: 'shopping' | 'style' | 'organization' | 'usage' | 'outfit'
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  icon: string
  actions?: Array<{
    label: string
    link: string
  }>
}

/**
 * 转换为应用内的 AIRecommendation 格式
 */
export function convertToAIRecommendations(
  output: DeepSeekAnalysisOutput
): AIRecommendation[] {
  return output.recommendations.map((rec) => {
    // 根据类型生成图标
    const iconMap = {
      shopping: '🛍️',
      style: '🎨',
      organization: '🧹',
      usage: '📊',
      outfit: '👔'
    }
    
    // 根据类型生成链接
    const generateLink = (type: string): string => {
      switch (type) {
        case 'shopping':
          return '/dashboard/clothings/new'
        case 'outfit':
          return '/dashboard/outfits/new'
        case 'usage':
          return '/dashboard/statistics'
        case 'organization':
          return '/dashboard/clothings'
        case 'style':
          return '/dashboard/analysis'
        default:
          return '/dashboard'
      }
    }
    
    return {
      type: rec.type,
      title: rec.title,
      description: `${rec.description}\n\n💡 分析理由：${rec.reasoning}`,
      priority: rec.priority,
      icon: iconMap[rec.type],
      actions: rec.actionable ? [
        {
          label: rec.actionable.action,
          link: generateLink(rec.type)
        }
      ] : undefined
    }
  })
}
