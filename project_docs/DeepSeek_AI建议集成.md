# DeepSeek AI 建议集成文档

## 概述

本文档说明如何集成 DeepSeek AI 来生成个性化的衣橱管理建议。

## 系统架构

```
┌─────────────────┐
│  用户衣橱数据   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  数据预处理     │ ← 收集衣物、搭配、统计数据
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  生成 Prompt    │ ← deepseek-prompt.ts
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  DeepSeek API   │ ← deepseek-client.ts
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  解析响应       │ ← 转换为 AIRecommendation
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  展示建议       │ ← recommendations/page.tsx
└─────────────────┘
```

## 核心功能

### 1. 智能分析维度

DeepSeek 会分析以下维度（选择最重要的 3 个生成建议）：

1. **使用频率分析**
   - 识别闲置衣物（超过30天未穿）
   - 分析高价衣物的使用性价比

2. **季节性分析** ⭐ 重点
   - 当前季节衣物是否充足
   - 即将到来的季节准备提醒

3. **风格偏好匹配** ⭐ 重点
   - 现有衣物是否符合用户风格偏好
   - 推荐符合风格的搭配组合

4. **购买习惯分析** ⭐ 重点
   - 根据购买频率判断是否过度购买
   - 预算控制建议

5. **分类平衡性**
   - 各分类比例是否合理

6. **品牌与多样性**
   - 品牌集中度分析

7. **搭配组合优化**
   - 推荐创建更多搭配

8. **整理与维护**
   - 检查破损、丢失衣物

### 2. 输出规范

- **建议数量**：固定返回 3 条
- **标题长度**：10 字以内
- **描述长度**：30-50 字
- **分析理由**：30-50 字
- **总结长度**：50 字以内

### 3. 优先级分类

- **高优先级**（high）：需要立即关注的问题
  - 示例：闲置严重、季节性缺失、高价衣物利用率低

- **中优先级**（medium）：建议尽快处理
  - 示例：分类不均衡、搭配不足、购买频率异常

- **低优先级**（low）：可选的优化建议
  - 示例：尝试新品牌、风格多样化

## 使用方法

### Step 1: 准备输入数据

```typescript
import type { DeepSeekAnalysisInput } from '@/lib/ai/deepseek-prompt'

const input: DeepSeekAnalysisInput = {
  wardrobe: {
    id: 'wardrobe-id',
    name: '我的衣橱',
    totalClothings: 50,
    totalOutfits: 10,
    totalValue: 15000,
    averagePrice: 300,
    utilizationRate: 65
  },
  clothings: [
    {
      id: 'clothing-1',
      name: '白色T恤',
      category: '上装',
      brand: 'Uniqlo',
      price: 99,
      color: '白色',
      size: 'M',
      season: 'summer',
      purchasedAt: '2024-05-15',
      useCount: 15,
      lastUsedAt: '2026-01-20',
      status: 'normal',
      tags: ['休闲', '百搭']
    }
    // ... 更多衣物
  ],
  outfits: [
    {
      id: 'outfit-1',
      name: '夏日休闲',
      useCount: 8,
      lastUsedAt: '2026-01-18',
      itemsCount: 3,
      tags: ['休闲', '夏季']
    }
    // ... 更多搭配
  ],
  userPreferences: {
    stylePreferences: ['休闲', '简约', '运动'],
    favoriteColors: ['白色', '黑色', '蓝色'],
    favoriteBrands: ['Uniqlo', 'MUJI', 'Nike'],
    budgetLevel: 'medium'
  },
  context: {
    currentSeason: 'winter',
    upcomingSeason: 'spring',
    recentPurchases: 3,
    purchaseFrequency: 'medium'
  }
}
```

### Step 2: 调用 DeepSeek API

```typescript
import { generateAIRecommendations } from '@/lib/ai/deepseek-client'

const result = await generateAIRecommendations(input, {
  apiKey: process.env.DEEPSEEK_API_KEY!,
  model: 'deepseek-chat',
  temperature: 0.7,
  maxTokens: 2000
})

if (result) {
  console.log('建议:', result.recommendations)
  console.log('总结:', result.summary)
}
```

### Step 3: 转换为 UI 格式

```typescript
import { convertToAIRecommendations } from '@/lib/ai/deepseek-prompt'

const uiRecommendations = convertToAIRecommendations(result)

// 在 React 组件中使用
<div>
  {uiRecommendations.map((rec) => (
    <RecommendationCard key={rec.title} recommendation={rec} />
  ))}
</div>
```

## API 端点集成

### 创建 API Route

创建 `/app/api/ai/recommendations/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { generateAIRecommendations } from '@/lib/ai/deepseek-client'
import type { DeepSeekAnalysisInput } from '@/lib/ai/deepseek-prompt'

export async function POST(request: NextRequest) {
  try {
    const input: DeepSeekAnalysisInput = await request.json()
    
    // 验证 API Key
    const apiKey = process.env.DEEPSEEK_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'DeepSeek API key not configured' },
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
      return NextResponse.json(
        { error: 'Failed to generate recommendations' },
        { status: 500 }
      )
    }
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('AI recommendations API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### 客户端调用

```typescript
// 在 React 组件中
const fetchAIRecommendations = async (wardrobeId: string) => {
  // 准备数据
  const input = await prepareAnalysisInput(wardrobeId)
  
  // 调用 API
  const response = await fetch('/api/ai/recommendations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch AI recommendations')
  }
  
  const result = await response.json()
  return result
}
```

## 环境配置

### 1. 获取 DeepSeek API Key

访问 [DeepSeek 官网](https://platform.deepseek.com/) 注册并获取 API Key。

### 2. 配置环境变量

在 `.env.local` 文件中添加：

```env
DEEPSEEK_API_KEY=your_api_key_here
```

### 3. 配置 Next.js

确保在 `next.config.js` 中允许访问环境变量：

```javascript
module.exports = {
  env: {
    DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
  },
}
```

## Prompt 示例

### 输入示例

```json
{
  "wardrobe": {
    "name": "小明的衣橱",
    "totalClothings": 45,
    "totalOutfits": 8,
    "utilizationRate": 58.3
  },
  "context": {
    "currentSeason": "winter",
    "upcomingSeason": "spring",
    "recentPurchases": 5,
    "purchaseFrequency": "high"
  },
  "userPreferences": {
    "stylePreferences": ["休闲", "运动"],
    "budgetLevel": "medium"
  }
}
```

### 输出示例

```json
{
  "recommendations": [
    {
      "type": "shopping",
      "title": "准备春季外套",
      "description": "春季即将到来，但您只有2件轻薄外套。建议购买1-2件春季夹克或风衣，适合早春穿搭。",
      "priority": "high",
      "reasoning": "当前季节为冬季，即将进入春季。数据显示您的春季外套数量不足，且您的购买频率较高，适合提前准备。",
      "actionable": {
        "action": "浏览春季外套推荐",
        "relatedItems": []
      }
    },
    {
      "type": "usage",
      "title": "激活闲置运动装",
      "description": "您有5件运动服超过30天未穿，与您的运动风格偏好不符。建议本周尝试搭配运动装出门。",
      "priority": "medium",
      "reasoning": "用户风格偏好包含运动风，但运动类衣物利用率仅为35%，存在明显的使用与偏好不匹配。",
      "actionable": {
        "action": "查看运动装建议",
        "relatedItems": ["clothing-12", "clothing-23"]
      }
    },
    {
      "type": "organization",
      "title": "控制购买频率",
      "description": "您最近30天购买了5件衣物，购买频率较高。建议先充分利用现有衣物，暂缓新购。",
      "priority": "low",
      "reasoning": "购买频率为高频，但衣橱利用率仅为58.3%，说明现有衣物未被充分使用。",
      "actionable": {
        "action": "查看利用率报告"
      }
    }
  ],
  "summary": "您的衣橱利用率中等，建议重点关注春季准备和提升现有衣物使用率，近期可暂缓购买。"
}
```

## 性能优化

### 1. 缓存策略

```typescript
// 使用 React Query 缓存
const { data, isLoading } = useQuery({
  queryKey: ['ai-recommendations', wardrobeId],
  queryFn: () => fetchAIRecommendations(wardrobeId),
  staleTime: 1000 * 60 * 60, // 1 小时
  cacheTime: 1000 * 60 * 60 * 24 // 24 小时
})
```

### 2. 数据预处理

```typescript
// 在服务端预处理数据，减少 API 调用
export async function prepareAnalysisInput(wardrobeId: string) {
  // 并行查询
  const [clothings, outfits, statistics] = await Promise.all([
    fetchClothings(wardrobeId),
    fetchOutfits(wardrobeId),
    fetchStatistics(wardrobeId)
  ])
  
  // 只传递必要的字段
  return {
    wardrobe: statistics,
    clothings: clothings.map(c => ({
      id: c.id,
      name: c.name,
      category: c.category,
      // ... 只包含必要字段
    })),
    // ...
  }
}
```

### 3. 流式响应（可选）

```typescript
// 使用流式 API 实时显示生成过程
import { streamAIRecommendations } from '@/lib/ai/deepseek-client'

for await (const chunk of streamAIRecommendations(input, config)) {
  console.log('接收到:', chunk)
  // 实时更新 UI
}
```

## 成本控制

### DeepSeek 定价（参考）

- **deepseek-chat**: ~¥0.001/1K tokens
- 每次请求预估: 1500-2500 tokens
- 每次调用成本: ~¥0.002-0.004

### 优化建议

1. **限制调用频率**
   - 每日每用户限制 5 次
   - 使用 Redis 记录调用次数

2. **智能触发**
   - 只在数据变化时重新生成
   - 设置 24 小时缓存

3. **降级策略**
   - API 失败时使用本地规则
   - 逐步回退到简单建议

## 测试

### 单元测试

```typescript
import { generateDeepSeekPrompt, parseDeepSeekResponse } from '@/lib/ai/deepseek-prompt'

test('生成正确的 Prompt', () => {
  const input = { /* ... */ }
  const prompt = generateDeepSeekPrompt(input)
  
  expect(prompt).toContain('当前季节')
  expect(prompt).toContain('用户偏好')
})

test('解析 API 响应', () => {
  const response = '{"recommendations": [...]}'
  const result = parseDeepSeekResponse(response)
  
  expect(result?.recommendations).toHaveLength(3)
})
```

### 集成测试

```typescript
test('完整 AI 建议流程', async () => {
  const input = prepareTestInput()
  const result = await generateAIRecommendations(input, testConfig)
  
  expect(result).not.toBeNull()
  expect(result?.recommendations).toHaveLength(3)
  expect(result?.summary).toBeTruthy()
})
```

## 故障排查

### 常见问题

1. **API 返回 401**
   - 检查 API Key 是否正确配置
   - 确认环境变量已加载

2. **解析失败**
   - 检查 DeepSeek 返回的格式
   - 查看控制台日志确认原始响应

3. **超时**
   - 增加 `maxTokens` 限制
   - 优化输入数据量

4. **建议质量不佳**
   - 调整 `temperature` 参数（推荐 0.7-0.8）
   - 完善输入数据的完整性

## 后续优化方向

1. **多轮对话**
   - 支持用户追问
   - 基于历史对话优化建议

2. **个性化学习**
   - 记录用户反馈
   - 训练个性化模型

3. **多模态分析**
   - 分析衣物图片
   - 基于视觉特征推荐

4. **社交功能**
   - 对比同类用户
   - 分享优质建议

---

**文档版本**: v1.0  
**创建日期**: 2026-01-28  
**作者**: AI Assistant
