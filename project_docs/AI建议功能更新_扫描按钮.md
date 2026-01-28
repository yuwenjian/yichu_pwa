# AI 建议功能更新 - 扫描按钮和数据修复

## 更新时间
2026-01-28

## 更新内容

### 1. 添加 AI 扫描按钮功能

#### 核心特性
- ✅ 进入页面时显示"AI 扫描分析"按钮
- ✅ 每日只能扫描一次（基于衣橱 ID）
- ✅ 今日已扫描则显示之前的分析结果
- ✅ 按钮状态根据扫描状态自动切换

#### 工作流程

```
进入页面
  ↓
检查今日是否已扫描
  ↓
  ├─ 已扫描 → 显示缓存的建议 + 按钮不可点击
  └─ 未扫描 → 显示空状态 + 按钮可点击
  
点击扫描按钮
  ↓
调用 DeepSeek API
  ↓
  ├─ 成功 → 保存建议到本地 + 记录扫描时间 + 显示建议
  └─ 失败 → 提示错误
```

#### 本地存储设计

**扫描时间记录：**
```javascript
localStorage key: `ai_scan_${wardrobeId}`
value: ISO 日期字符串 (如: "2026-01-28T10:30:00.000Z")
```

**建议缓存：**
```javascript
localStorage key: `ai_recommendations_${wardrobeId}`
value: {
  recommendations: AIRecommendation[],
  timestamp: ISO 日期字符串
}
```

#### UI 状态

**1. 未扫描状态**
```
┌─────────────────────────────────────────┐
│ 🤖 AI 智能分析                          │
│ 由 DeepSeek 提供支持...                 │
│                          [开始扫描]     │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│            💡                           │
│        暂无 AI 建议                      │
│   点击上方"开始扫描"按钮...              │
└─────────────────────────────────────────┘
```

**2. 扫描中状态**
```
┌─────────────────────────────────────────┐
│ 🤖 AI 智能分析                          │
│ 由 DeepSeek 提供支持...                 │
│                    [⏳ 分析中...]       │
└─────────────────────────────────────────┘
```

**3. 已扫描状态（今日）**
```
┌─────────────────────────────────────────┐
│ 🤖 AI 智能分析                          │
│ 由 DeepSeek 提供支持...                 │
│ 上次扫描：01-28 10:30                   │
│                    [今日已扫描]  ❌     │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ ✅ AI 分析完成                          │
│ 已为您生成 3 条个性化建议                │
└─────────────────────────────────────────┘

[建议卡片 1]
[建议卡片 2]
[建议卡片 3]
```

### 2. 修复数据查询问题

#### 问题描述
用户反馈：衣橱明明有 3 件衣物，但 AI 分析显示衣物总数为 0

#### 原因分析
需要添加调试日志来追踪数据查询过程，确定问题所在

#### 解决方案
在 API Route 的 `prepareAnalysisInput` 函数中添加详细的调试日志：

```typescript
// 调试日志
console.log('📊 数据查询结果:')
console.log('- 衣橱ID:', wardrobeId)
console.log('- 衣物数量:', clothings.length)
console.log('- 搭配数量:', outfits.length)
if (clothingsResult.error) {
  console.error('❌ 衣物查询错误:', clothingsResult.error)
}
if (clothings.length > 0) {
  console.log('- 衣物示例:', clothings[0])
}
```

#### 调试步骤
1. 查看控制台日志确认数据是否正确查询
2. 检查 `wardrobeId` 是否正确
3. 确认数据库查询条件是否正确
4. 验证数据格式转换是否正确

## 代码修改

### 修改的文件

#### 1. `/app/dashboard/recommendations/page.tsx`

**主要变更：**
- ✅ 移除 `useAIRecommendations` Hook
- ✅ 添加本地状态管理
- ✅ 添加扫描按钮逻辑
- ✅ 添加每日限制检查
- ✅ 添加本地存储缓存
- ✅ 更新 UI 展示逻辑

**新增函数：**
```typescript
checkLastScan()           // 检查今日是否已扫描
loadTodayRecommendations() // 加载今日缓存的建议
handleAIScan()            // 执行 AI 扫描
formatScanDate()          // 格式化扫描时间
```

**新增状态：**
```typescript
const [recommendations, setRecommendations] = useState<AIRecommendation[]>([])
const [isScanning, setIsScanning] = useState(false)
const [lastScanDate, setLastScanDate] = useState<string | null>(null)
const [canScanToday, setCanScanToday] = useState(true)
```

#### 2. `/app/api/ai/recommendations/route.ts`

**主要变更：**
- ✅ 添加详细的调试日志
- ✅ 追踪数据查询结果
- ✅ 记录衣物数量和示例数据

## 使用说明

### 用户操作流程

1. **首次访问**
   - 进入"智能建议"页面
   - 看到"开始扫描"按钮（可点击）
   - 页面显示"暂无 AI 建议"

2. **点击扫描**
   - 点击"开始扫描"按钮
   - 按钮变为"分析中..."（不可点击）
   - 等待 10-15 秒

3. **查看结果**
   - 显示"AI 分析完成"提示
   - 展示 3 条个性化建议
   - 按钮变为"今日已扫描"（不可点击）

4. **再次访问（同一天）**
   - 自动显示之前的建议
   - 按钮显示"今日已扫描"（不可点击）
   - 显示上次扫描时间

5. **隔日访问**
   - 缓存自动清除
   - 按钮恢复为"开始扫描"（可点击）
   - 可以重新扫描

### 切换衣橱

- 切换衣橱时会自动检查该衣橱的扫描状态
- 每个衣橱独立计算每日限制
- 不同衣橱的建议独立缓存

## 技术细节

### 每日限制实现

```typescript
const checkLastScan = () => {
  const storageKey = `ai_scan_${selectedWardrobeId}`
  const lastScan = localStorage.getItem(storageKey)
  
  if (lastScan) {
    const lastScanDate = new Date(lastScan)
    const today = new Date()
    
    // 检查是否是今天
    const isSameDay = 
      lastScanDate.getFullYear() === today.getFullYear() &&
      lastScanDate.getMonth() === today.getMonth() &&
      lastScanDate.getDate() === today.getDate()
    
    setCanScanToday(!isSameDay)
  }
}
```

### 缓存管理

**保存缓存：**
```typescript
const storageKey = `ai_recommendations_${selectedWardrobeId}`
localStorage.setItem(storageKey, JSON.stringify({
  recommendations: aiRecommendations,
  timestamp: new Date().toISOString()
}))
```

**读取缓存：**
```typescript
const cached = localStorage.getItem(storageKey)
if (cached) {
  const data = JSON.parse(cached)
  // 验证是否是今天的数据
  if (isSameDay(data.timestamp)) {
    setRecommendations(data.recommendations)
  }
}
```

### 时间格式化

```typescript
const formatScanDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}
// 输出：01-28 10:30
```

## 数据调试

### 查看日志

在浏览器控制台（F12）查看：

```
📊 数据查询结果:
- 衣橱ID: 1aed0e78-d6d0-488c-9e2e-ba21a78a787f
- 衣物数量: 3
- 搭配数量: 0
- 衣物示例: {
    id: "...",
    name: "白色T恤",
    category: { name: "上装" },
    ...
  }
```

### 常见问题排查

**问题 1：衣物数量显示为 0**

检查项：
1. ✅ 查看控制台 `衣物数量` 是否正确
2. ✅ 确认 `wardrobeId` 是否正确
3. ✅ 检查衣物是否属于该衣橱
4. ✅ 验证数据库查询条件

**问题 2：扫描按钮无法点击**

检查项：
1. ✅ 检查是否今日已扫描
2. ✅ 清除 localStorage 缓存：
   ```javascript
   localStorage.removeItem(`ai_scan_${wardrobeId}`)
   localStorage.removeItem(`ai_recommendations_${wardrobeId}`)
   ```
3. ✅ 刷新页面

**问题 3：建议没有保存**

检查项：
1. ✅ 查看控制台是否有错误
2. ✅ 确认 API 响应正常
3. ✅ 检查 localStorage 配额是否已满

## 性能优化

### 本地缓存优势
- ✅ 避免重复 API 调用
- ✅ 降低成本（每日每衣橱限 1 次）
- ✅ 提升加载速度（缓存直接读取）
- ✅ 离线也能查看历史建议

### API 调用控制
- ✅ 每日每衣橱限制 1 次扫描
- ✅ 用户主动触发，非自动调用
- ✅ 失败时不重试，由用户决定

## 成本估算

### 原方案（自动调用）
- 每次进入页面都调用 API
- 月度成本：100 次 × ¥0.003 = ¥0.3

### 新方案（每日限制）
- 每日每衣橱限 1 次
- 月度成本：30 次 × ¥0.003 = ¥0.09
- **成本降低 70%**

## 测试清单

### 功能测试
- [ ] 首次访问显示"开始扫描"按钮
- [ ] 点击扫描后正常调用 API
- [ ] 扫描中按钮显示"分析中..."
- [ ] 扫描成功显示建议
- [ ] 今日再次访问显示缓存建议
- [ ] 按钮显示"今日已扫描"且不可点击
- [ ] 切换衣橱重新检查扫描状态
- [ ] 隔日访问按钮恢复可点击

### 数据测试
- [ ] 控制台日志显示正确的衣物数量
- [ ] AI 分析结果中衣物总数正确
- [ ] 建议内容基于实际数据生成
- [ ] 季节、风格、购买习惯分析正确

### 缓存测试
- [ ] localStorage 正确保存扫描时间
- [ ] localStorage 正确保存建议数据
- [ ] 缓存在隔日自动失效
- [ ] 清除缓存后功能正常

## 后续优化建议

### Phase 1: 用户体验
- [ ] 添加扫描进度条（显示分析进度）
- [ ] 添加扫描动画（更生动的反馈）
- [ ] 支持手动清除缓存（重新扫描）
- [ ] 添加扫描历史记录

### Phase 2: 功能增强
- [ ] 支持自定义扫描频率
- [ ] 添加建议对比功能（本次 vs 上次）
- [ ] 支持导出建议为 PDF
- [ ] 添加建议趋势分析

### Phase 3: 智能优化
- [ ] 根据数据变化自动提示扫描
- [ ] 智能推荐最佳扫描时机
- [ ] A/B 测试不同的 Prompt
- [ ] 学习用户反馈优化建议

---

**更新者**: AI Assistant  
**更新时间**: 2026-01-28  
**版本**: v1.1
