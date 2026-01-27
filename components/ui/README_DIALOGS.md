# 自定义对话框和提示系统

## 概述

应用现在使用自定义的对话框和提示组件，替代了原生的 `alert()` 和 `confirm()` 对话框，提供更好的用户体验和一致的设计风格。

## 组件

### 1. ConfirmDialog - 确认对话框

用于需要用户确认的操作（如删除）。

**特性：**
- Editorial Luxury 设计风格
- 支持自定义标题、消息、按钮文本
- 支持 danger 和 primary 两种变体
- 背景模糊效果
- 流畅的动画

### 2. Toast - 提示通知

用于显示临时消息（成功、错误、警告、信息）。

**特性：**
- 4种类型：success、error、warning、info
- 自动消失（默认3秒）
- 可手动关闭
- 从顶部滑入的动画效果

## 使用方法

### 在组件中使用

```tsx
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Toast from '@/components/ui/Toast'
import { useConfirm, useToast } from '@/hooks/useDialog'

export default function YourPage() {
  const confirmDialog = useConfirm()
  const toast = useToast()

  // 确认对话框
  const handleDelete = async () => {
    const confirmed = await confirmDialog.confirm({
      title: '删除确认',
      message: '确定要删除吗？',
      confirmText: '删除',
      cancelText: '取消',
      variant: 'danger', // 'danger' | 'primary'
    })

    if (!confirmed) return

    try {
      // 执行删除操作
      toast.success('删除成功')
    } catch (error) {
      toast.error('删除失败，请重试')
    }
  }

  // Toast 提示
  toast.success('操作成功')
  toast.error('操作失败')
  toast.warning('请注意')
  toast.info('提示信息')

  return (
    <>
      {/* 你的页面内容 */}
      
      {/* 添加对话框组件 */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.options.title}
        message={confirmDialog.options.message}
        confirmText={confirmDialog.options.confirmText}
        cancelText={confirmDialog.options.cancelText}
        variant={confirmDialog.options.variant}
        onConfirm={confirmDialog.handleConfirm}
        onCancel={confirmDialog.handleCancel}
      />
      <Toast
        isOpen={toast.isOpen}
        message={toast.options.message}
        type={toast.options.type}
        duration={toast.options.duration}
        onClose={toast.handleClose}
      />
    </>
  )
}
```

## 已集成页面

✅ 衣物详情页
✅ 衣橱列表页
✅ 搭配列表页
✅ 搭配详情页
✅ 衣物编辑页
✅ 新建衣物页
✅ 新建搭配页

## API 参考

### useConfirm()

返回值：
- `isOpen`: boolean - 对话框是否打开
- `options`: ConfirmOptions - 对话框配置
- `confirm(options)`: Promise<boolean> - 显示确认对话框，返回用户选择
- `handleConfirm()`: void - 确认处理器
- `handleCancel()`: void - 取消处理器

### useToast()

返回值：
- `isOpen`: boolean - 提示是否显示
- `options`: ToastOptions - 提示配置
- `showToast(options)`: void - 显示自定义提示
- `success(message, duration?)`: void - 显示成功提示
- `error(message, duration?)`: void - 显示错误提示
- `warning(message, duration?)`: void - 显示警告提示
- `info(message, duration?)`: void - 显示信息提示
- `handleClose()`: void - 关闭提示
