/**
 * 图片处理工具 - 简单抠图版本
 */

export interface RemoveBgOptions {
  backgroundColor?: string // 背景颜色，默认透明
  threshold?: number // 边缘检测阈值，默认 128
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
        'image/png',
        0.95
      )
    }

    img.onerror = () => {
      reject(new Error('Failed to load image'))
    }

    img.src = URL.createObjectURL(file)
  })
}

/**
 * 简单的背景移除算法
 * 使用 Canvas API 进行基础的背景移除
 */
export async function removeBackground(
  imageFile: File,
  options: RemoveBgOptions = {}
): Promise<Blob> {
  const { 
    backgroundColor = 'transparent', 
    threshold = 128,
    maxSize = 1024,
    onProgress 
  } = options

  onProgress?.(10)

  // 先压缩图片
  console.log('压缩图片中...')
  const compressedBlob = await compressImage(imageFile, maxSize)
  onProgress?.(30)

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

      // 绘制原图
      ctx.drawImage(img, 0, 0)
      onProgress?.(50)

      // 获取图像数据
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data

      console.log('开始处理背景...')
      
      // 简单的背景移除算法（基于亮度检测）
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]

        // 计算亮度
        const brightness = (r + g + b) / 3
        
        // 如果是亮色背景（接近白色）
        if (brightness > threshold) {
          if (backgroundColor === 'transparent') {
            // 设置为透明
            data[i + 3] = 0
          } else {
            // 设置为指定背景色
            data[i] = parseInt(backgroundColor.slice(1, 3), 16) // R
            data[i + 1] = parseInt(backgroundColor.slice(3, 5), 16) // G
            data[i + 2] = parseInt(backgroundColor.slice(5, 7), 16) // B
            data[i + 3] = 255 // A
          }
        }
      }

      onProgress?.(80)

      // 将处理后的数据绘制回画布
      ctx.putImageData(imageData, 0, 0)

      // 转换为 Blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            onProgress?.(100)
            console.log('背景处理完成')
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

    img.src = URL.createObjectURL(compressedBlob)
  })
}
