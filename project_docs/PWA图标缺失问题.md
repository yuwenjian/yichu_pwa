# PWA 图标缺失问题

## 问题描述
`manifest.json` 中配置了 PWA 图标，但实际文件不存在，导致 404 错误：
- `/icon-192x192.png` (404)
- `/icon-512x512.png` (404)

## 临时解决方案（二选一）

### 方案一：注释掉图标配置
编辑 `ClientProject/public/manifest.json`，暂时注释掉 icons 配置：

```json
{
  "name": "个人衣橱管理系统",
  "short_name": "衣橱管理",
  "description": "管理你的衣物，创建搭配，统计数据",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#ffffff",
  "orientation": "portrait-primary"
  // "icons": [
  //   {
  //     "src": "/icon-192x192.png",
  //     "sizes": "192x192",
  //     "type": "image/png",
  //     "purpose": "any maskable"
  //   },
  //   {
  //     "src": "/icon-512x512.png",
  //     "sizes": "512x512",
  //     "type": "image/png",
  //     "purpose": "any maskable"
  //   }
  // ]
}
```

### 方案二：添加实际图标文件

需要在 `ClientProject/public/` 目录下添加两个 PNG 图标文件：
- `icon-192x192.png` (192x192 像素)
- `icon-512x512.png` (512x512 像素)

#### 图标设计建议
- 使用简洁的衣橱或衣服图标
- 背景色建议使用主题色或白色
- 确保图标在不同尺寸下清晰可见
- 可以使用 AI 工具或在线图标生成器创建

#### 在线工具推荐
1. **Favicon.io** - https://favicon.io/
2. **RealFaviconGenerator** - https://realfavicongenerator.net/
3. **PWA Builder** - https://www.pwabuilder.com/

## 影响
- 不影响应用核心功能
- 仅在 PWA 安装和部分浏览器中会看到默认图标
- 建议在正式发布前添加正式图标

## 下一步
1. 决定采用哪个方案
2. 如果选择方案二，准备或设计图标
3. 测试 PWA 功能是否正常

---

**创建时间**: 2026-01-27
