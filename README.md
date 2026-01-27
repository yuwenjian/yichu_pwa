# 个人衣橱管理系统 - 前端项目

## 技术栈

- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **状态管理**: Zustand
- **后端服务**: Supabase
- **文件存储**: 腾讯云 COS
- **图片处理**: Canvas API (前端抠图)

## 项目结构

```
ClientProject/
├── app/                    # Next.js App Router 页面
│   ├── layout.tsx         # 根布局
│   ├── page.tsx           # 首页
│   └── globals.css        # 全局样式
├── components/            # React 组件
├── lib/                   # 工具库
│   ├── supabase.ts        # Supabase 客户端
│   ├── cos.ts             # 腾讯云 COS 配置
│   └── image-processor.ts # 图片处理工具
├── hooks/                 # React Hooks
├── stores/                # Zustand 状态管理
├── utils/                 # 工具函数
├── types/                 # TypeScript 类型定义
├── api/                   # API Routes
└── public/                # 静态资源
```

## 环境变量

复制 `.env.example` 为 `.env.local` 并填写配置：

```bash
cp .env.example .env.local
```

详细配置说明请参考 `../project_docs/env-config.md`

## 安装依赖

```bash
npm install
```

## 开发

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

## 构建

```bash
npm run build
npm start
```

## 部署

项目部署在 Vercel，配置好环境变量后会自动部署。

## 功能模块

- [ ] 用户认证（Supabase Auth）
- [ ] 多衣橱管理
- [ ] 分类系统
- [ ] 衣物管理（上传、编辑、删除）
- [ ] 图片抠图（前端 Canvas）
- [ ] 搭配模块
- [ ] 统计模块
- [ ] PWA 支持
