/**
 * 图片处理工具 - 前端 Canvas 抠图
 */

export interface RemoveBgOptions {
  backgroundColor?: string // 背景颜色，默认白色
  threshold?: number // 边缘检测阈值，默认 30
}

/**
 * 使用 Canvas API 进行简单的背景移除
 * 注意：这是一个简化版本，效果可能不如专业 AI 服务
 */
export async function removeBackground(
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

      // 简单的背景移除算法（基于边缘检测和颜色相似度）
      // 这里使用一个简化的方法：检测边缘并移除相似背景色
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        const a = data[i + 3]

        // 计算与背景色的相似度（简化版）
        // 这里假设背景是浅色或接近白色
        const brightness = (r + g + b) / 3
        const isBackground = brightness > 200 // 简单阈值判断

        if (isBackground) {
          // 设置为透明或指定背景色
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
