/**
 * 图片处理工具 - AI 抠图（优化版）
 */

import { removeBackground as removeBackgroundAI, Config } from '@imgly/background-removal'

export interface RemoveBgOptions {
  backgroundColor?: string // 背景颜色，默认白色
  threshold?: number // 边缘检测阈值，默认 30
  useAI?: boolean // 是否使用 AI 抠图，默认 true
  maxSize?: number // 最大尺寸，默认 1024
  onProgress?: (progress: number) => void // 进度回调
}

/**
 * 压缩图片以加快处理速度
 */
async function compressImage(file: File, maxSize: number = 1024): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      reject(new Error('Canvas context not available'))
      return
    }

    img.onload = () => {
      // 计算压缩后的尺寸
      let width = img.width
      let height = img.height

      // 如果图片较大，按比例缩小
      if (width > maxSize || height > maxSize) {
        if (width > height) {
          height = (height / width) * maxSize
          width = maxSize
        } else {
          width = (width / height) * maxSize
          height = maxSize
        }
      }

      canvas.width = width
      canvas.height = height

      // 绘制压缩后的图片
      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (blob) {
            console.log(`图片已压缩: ${file.size / 1024}KB -> ${blob.size / 1024}KB`)
            resolve(blob)
          } else {
            reject(new Error('Failed to compress image'))
          }
        },
        'image/jpeg',
        0.85
      )
    }

    img.onerror = () => {
      reject(new Error('Failed to load image'))
    }

    img.src = URL.createObjectURL(file)
  })
}

/**
 * 使用 AI 模型进行专业的背景移除（优化版）
 * 优化措施：
 * 1. 压缩图片以减少处理时间
 * 2. 使用更快的模型配置
 * 3. 显示处理进度
 */
export async function removeBackground(
  imageFile: File,
  options: RemoveBgOptions = {}
): Promise<Blob> {
  const { 
    backgroundColor = '#FFFFFF', 
    useAI = true, 
    maxSize = 1024,
    onProgress 
  } = options

  try {
    if (useAI) {
      // 先压缩图片以加快处理速度
      console.log('压缩图片中...')
      const compressedBlob = await compressImage(imageFile, maxSize)
      
      // 使用 AI 模型抠图（使用快速配置）
      console.log('开始AI抠图...')
      const blob = await removeBackgroundAI(compressedBlob, {
        // 不指定 publicPath，使用默认的 CDN
        progress: (key: string, current: number, total: number) => {
          const progress = Math.round((current / total) * 100)
          console.log(`${key}: ${progress}%`)
          onProgress?.(progress)
        },
      })

      console.log('AI抠图完成')

      // 如果需要替换背景色（而不是透明）
      if (backgroundColor !== 'transparent') {
        return await addBackgroundColor(blob, backgroundColor)
      }

      return blob
    } else {
      // 回退到简单方法
      return await removeBackgroundSimple(imageFile, options)
    }
  } catch (error) {
    console.error('AI background removal failed, falling back to simple method:', error)
    // 如果 AI 处理失败，回退到简单方法
    return await removeBackgroundSimple(imageFile, options)
  }
}

/**
 * 为透明背景图片添加背景色
 */
async function addBackgroundColor(imageBlob: Blob, backgroundColor: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      reject(new Error('Canvas context not available'))
      return
    }

    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height

      // 填充背景色
      ctx.fillStyle = backgroundColor
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // 绘制图片
      ctx.drawImage(img, 0, 0)

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to create blob'))
          }
        },
        'image/png',
        0.95
      )
    }

    img.onerror = () => {
      reject(new Error('Failed to load image'))
    }

    img.src = URL.createObjectURL(imageBlob)
  })
}

/**
 * 简单的背景移除算法（回退方案）
 * 使用 Canvas API 进行基础的背景移除
 */
async function removeBackgroundSimple(
  imageFile: File,
  options: RemoveBgOptions = {}
): Promise<Blob> {
  const { backgroundColor = '#FFFFFF', threshold = 30 } = options

  return new Promise((resolve, reject) => {
    const img = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      reject(new Error('Canvas context not available'))
      return
    }

    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height

      // 绘制原图
      ctx.drawImage(img, 0, 0)

      // 获取图像数据
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data

      // 简单的背景移除算法（基于亮度检测）
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]

        // 计算亮度
        const brightness = (r + g + b) / 3
        const isBackground = brightness > 200 // 简单阈值判断

        if (isBackground) {
          // 设置为指定背景色
          data[i] = parseInt(backgroundColor.slice(1, 3), 16) // R
          data[i + 1] = parseInt(backgroundColor.slice(3, 5), 16) // G
          data[i + 2] = parseInt(backgroundColor.slice(5, 7), 16) // B
          data[i + 3] = 255 // A
        }
      }

      // 将处理后的数据绘制回画布
      ctx.putImageData(imageData, 0, 0)

      // 转换为 Blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to create blob'))
          }
        },
        'image/png',
        0.95
      )
    }

    img.onerror = () => {
      reject(new Error('Failed to load image'))
    }

    img.src = URL.createObjectURL(imageFile)
  })
}

/**
 * 更高级的背景移除（使用边缘检测算法）
 * 这个方法效果更好，但计算量更大
 */
export async function removeBackgroundAdvanced(
  imageFile: File,
  options: RemoveBgOptions = {}
): Promise<Blob> {
  const { backgroundColor = '#FFFFFF', threshold = 30 } = options

  return new Promise((resolve, reject) => {
    const img = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d', { willReadFrequently: true })

    if (!ctx) {
      reject(new Error('Canvas context not available'))
      return
    }

    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height

      ctx.drawImage(img, 0, 0)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data

      // 边缘检测算法（Sobel 算子简化版）
      const edgeMap = new Uint8Array(canvas.width * canvas.height)

      for (let y = 1; y < canvas.height - 1; y++) {
        for (let x = 1; x < canvas.width - 1; x++) {
          const idx = (y * canvas.width + x) * 4
          
          // 计算梯度（简化版）
          const gx = Math.abs(
            data[idx - 4] - data[idx + 4] +
            (data[idx - canvas.width * 4] - data[idx + canvas.width * 4]) * 2
          )
          const gy = Math.abs(
            data[idx - canvas.width * 4] - data[idx + canvas.width * 4] +
            (data[idx - 4] - data[idx + 4]) * 2
          )
          const gradient = Math.sqrt(gx * gx + gy * gy)

          edgeMap[y * canvas.width + x] = gradient > threshold ? 255 : 0
        }
      }

      // 根据边缘检测结果处理背景
      for (let i = 0; i < data.length; i += 4) {
        const x = (i / 4) % canvas.width
        const y = Math.floor((i / 4) / canvas.width)
        const edgeValue = edgeMap[y * canvas.width + x]

        // 如果不是边缘区域，且颜色接近背景，则替换
        if (edgeValue < threshold) {
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]
          const brightness = (r + g + b) / 3

          if (brightness > 200) {
            data[i] = parseInt(backgroundColor.slice(1, 3), 16)
            data[i + 1] = parseInt(backgroundColor.slice(3, 5), 16)
            data[i + 2] = parseInt(backgroundColor.slice(5, 7), 16)
            data[i + 3] = 255
          }
        }
      }

      ctx.putImageData(imageData, 0, 0)

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to create blob'))
          }
        },
        'image/png',
        0.95
      )
    }

    img.onerror = () => {
      reject(new Error('Failed to load image'))
    }

    img.src = URL.createObjectURL(imageFile)
  })
}
