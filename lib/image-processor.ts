/**
 * 图片处理工具 - AI 智能抠图版本
 * 使用 TensorFlow.js + BodyPix 进行高质量背景移除
 */

// 动态导入 TensorFlow.js 和 BodyPix
let bodyPixModel: any = null

/**
 * 预加载 BodyPix 模型（可在应用启动时调用）
 * @returns Promise<Model> BodyPix 模型实例
 */
export async function loadBodyPix() {
  if (bodyPixModel) return bodyPixModel
  
  try {
    const bodyPix = await import('@tensorflow-models/body-pix')
    const tf = await import('@tensorflow/tfjs')
    
    // 设置后端（优先使用 WebGL）
    await tf.ready()
    
    console.log('加载 BodyPix 模型...')
    bodyPixModel = await bodyPix.load({
      architecture: 'MobileNetV1',
      outputStride: 16,
      multiplier: 0.75,
      quantBytes: 2
    })
    console.log('模型加载完成')
    
    return bodyPixModel
  } catch (error) {
    console.error('加载 BodyPix 模型失败:', error)
    throw new Error('无法加载 AI 模型，请检查网络连接')
  }
}

export interface RemoveBgOptions {
  backgroundColor?: string // 背景颜色，默认透明
  threshold?: number // 边缘检测阈值（仅用于回退方案），默认 128
  maxSize?: number // 最大尺寸，默认 1024
  onProgress?: (progress: number) => void // 进度回调
  useAI?: boolean // 是否使用 AI 模型，默认 true
  edgeBlur?: number // 边缘羽化程度，默认 5
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
 * AI 智能背景移除（使用 BodyPix + 增强后处理）
 */
async function removeBackgroundWithAI(
  imageFile: File,
  options: RemoveBgOptions
): Promise<Blob> {
  const { 
    backgroundColor = 'transparent',
    maxSize = 1024,
    onProgress,
    edgeBlur = 5
  } = options

  onProgress?.(10)

  // 压缩图片
  console.log('压缩图片中...')
  const compressedBlob = await compressImage(imageFile, maxSize)
  onProgress?.(20)

  // 加载 AI 模型
  const model = await loadBodyPix()
  onProgress?.(40)

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = async () => {
      try {
        console.log('AI 分析图像中...')
        
        // 使用 BodyPix 进行分割（注意：BodyPix 主要识别人体，对于衣物可能需要调整参数）
        const segmentation = await model.segmentPerson(img, {
          flipHorizontal: false,
          internalResolution: 'medium',
          segmentationThreshold: 0.5, // 降低阈值以包含更多物体
          maxDetections: 1,
          scoreThreshold: 0.3
        })
        onProgress?.(60)
        
        // 如果没有检测到人体/物体，尝试使用增强算法
        const hasObject = segmentation.data.some((value: number) => value === 1)
        if (!hasObject) {
          console.log('AI 未检测到物体，使用增强算法...')
          reject(new Error('No object detected'))
          return
        }
        
        onProgress?.(70)

        // 创建画布
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        
        if (!ctx) {
          reject(new Error('Canvas context not available'))
          return
        }

        canvas.width = img.width
        canvas.height = img.height

        // 绘制原图
        ctx.drawImage(img, 0, 0)
        
        // 获取图像数据
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data

        console.log('应用 AI 遮罩...')

        // 创建边缘模糊效果
        const mask = segmentation.data
        const blurredMask = applyEdgeBlur(mask, canvas.width, canvas.height, edgeBlur)

        // 应用遮罩
        for (let i = 0; i < mask.length; i++) {
          const pixelIndex = i * 4
          
          // 如果 mask[i] === 0，说明是背景
          if (mask[i] === 0) {
            if (backgroundColor === 'transparent') {
              // 使用模糊的 alpha 值实现边缘羽化
              data[pixelIndex + 3] = Math.round(blurredMask[i] * 255)
            } else {
              // 设置为指定背景色
              const alpha = blurredMask[i]
              const bgR = parseInt(backgroundColor.slice(1, 3), 16)
              const bgG = parseInt(backgroundColor.slice(3, 5), 16)
              const bgB = parseInt(backgroundColor.slice(5, 7), 16)
              
              // 混合前景和背景
              data[pixelIndex] = Math.round(data[pixelIndex] * alpha + bgR * (1 - alpha))
              data[pixelIndex + 1] = Math.round(data[pixelIndex + 1] * alpha + bgG * (1 - alpha))
              data[pixelIndex + 2] = Math.round(data[pixelIndex + 2] * alpha + bgB * (1 - alpha))
              data[pixelIndex + 3] = 255
            }
          }
        }

        onProgress?.(90)

        // 绘制处理后的图像
        ctx.putImageData(imageData, 0, 0)

        // 转换为 Blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              onProgress?.(100)
              console.log('AI 背景处理完成')
              resolve(blob)
            } else {
              reject(new Error('Failed to create blob'))
            }
          },
          'image/png',
          1.0
        )
      } catch (error) {
        console.error('AI 处理失败:', error)
        reject(error)
      }
    }

    img.onerror = () => {
      reject(new Error('Failed to load image'))
    }

    img.src = URL.createObjectURL(compressedBlob)
  })
}

/**
 * 改进的边缘模糊处理（使用高斯模糊）
 */
function applyEdgeBlur(
  mask: Uint8Array,
  width: number,
  height: number,
  blurRadius: number
): Float32Array {
  const blurred = new Float32Array(mask.length)
  const radius = Math.max(1, Math.floor(blurRadius))
  
  // 生成高斯权重
  const gaussianKernel = generateGaussianKernel(radius)
  const kernelSize = gaussianKernel.length
  const kernelHalf = Math.floor(kernelSize / 2)
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x
      
      let sum = 0
      let weightSum = 0
      
      // 应用高斯核
      for (let ky = -kernelHalf; ky <= kernelHalf; ky++) {
        for (let kx = -kernelHalf; kx <= kernelHalf; kx++) {
          const nx = x + kx
          const ny = y + ky
          
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const nidx = ny * width + nx
            const weight = gaussianKernel[ky + kernelHalf] * gaussianKernel[kx + kernelHalf]
            
            sum += mask[nidx] * weight
            weightSum += weight
          }
        }
      }
      
      // 归一化
      blurred[idx] = weightSum > 0 ? sum / weightSum : mask[idx]
    }
  }
  
  return blurred
}

/**
 * 生成一维高斯核
 */
function generateGaussianKernel(radius: number): Float32Array {
  const size = radius * 2 + 1
  const kernel = new Float32Array(size)
  const sigma = radius / 2
  let sum = 0
  
  for (let i = 0; i < size; i++) {
    const x = i - radius
    kernel[i] = Math.exp(-(x * x) / (2 * sigma * sigma))
    sum += kernel[i]
  }
  
  // 归一化
  for (let i = 0; i < size; i++) {
    kernel[i] /= sum
  }
  
  return kernel
}

/**
 * 形态学处理：去除小的噪点和孔洞
 */
function morphologicalClean(
  mask: Uint8Array,
  width: number,
  height: number
): Uint8Array {
  const cleaned = new Uint8Array(mask.length)
  const kernelSize = 3 // 3x3 核
  const kernelHalf = Math.floor(kernelSize / 2)
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x
      
      // 统计周围像素
      let foregroundCount = 0
      let totalCount = 0
      
      for (let ky = -kernelHalf; ky <= kernelHalf; ky++) {
        for (let kx = -kernelHalf; kx <= kernelHalf; kx++) {
          const nx = x + kx
          const ny = y + ky
          
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const nidx = ny * width + nx
            foregroundCount += mask[nidx]
            totalCount++
          }
        }
      }
      
      // 如果大部分邻居是前景，则标记为前景
      cleaned[idx] = foregroundCount > totalCount / 2 ? 1 : 0
    }
  }
  
  return cleaned
}

/**
 * 增强的背景移除（基于色度分析）- 回退方案
 */
async function removeBackgroundEnhanced(
  imageFile: File,
  options: RemoveBgOptions
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

      console.log('增强背景处理中...')
      
      // 采样边缘像素来确定背景色
      const bgColor = detectBackgroundColor(data, canvas.width, canvas.height)
      console.log('检测到背景色:', bgColor)
      
      // 增强的背景移除算法（两次遍历：检测 + 羽化）
      const mask = new Uint8Array(data.length / 4)
      
      // 第一次遍历：检测前景和背景
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        const idx = i / 4

        // 计算与背景色的色差（使用感知色差公式）
        const colorDiff = Math.sqrt(
          2 * Math.pow(r - bgColor.r, 2) +
          4 * Math.pow(g - bgColor.g, 2) +
          3 * Math.pow(b - bgColor.b, 2)
        )
        
        // 标记前景（1）和背景（0）
        mask[idx] = colorDiff > threshold ? 1 : 0
      }
      
      // 应用形态学操作（去除噪点）
      const cleanedMask = morphologicalClean(mask, canvas.width, canvas.height)
      
      // 应用边缘模糊
      const blurredMask = applyEdgeBlur(cleanedMask, canvas.width, canvas.height, 3)
      
      // 第二次遍历：应用遮罩
      for (let i = 0; i < data.length; i += 4) {
        const idx = i / 4
        const alpha = blurredMask[idx]
        
        if (alpha < 1) {
          if (backgroundColor === 'transparent') {
            // 设置透明度
            data[i + 3] = Math.round(alpha * 255)
          } else {
            // 混合前景和背景色
            const bgR = parseInt(backgroundColor.slice(1, 3), 16)
            const bgG = parseInt(backgroundColor.slice(3, 5), 16)
            const bgB = parseInt(backgroundColor.slice(5, 7), 16)
            
            data[i] = Math.round(data[i] * alpha + bgR * (1 - alpha))
            data[i + 1] = Math.round(data[i + 1] * alpha + bgG * (1 - alpha))
            data[i + 2] = Math.round(data[i + 2] * alpha + bgB * (1 - alpha))
            data[i + 3] = 255
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
            console.log('增强背景处理完成')
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

/**
 * 检测背景颜色（采样边缘像素）
 */
function detectBackgroundColor(
  data: Uint8ClampedArray,
  width: number,
  height: number
): { r: number; g: number; b: number } {
  const samples: number[][] = []
  const sampleSize = 10 // 每边采样10个点

  // 采样四条边的像素
  for (let i = 0; i < sampleSize; i++) {
    // 上边
    const topIdx = (Math.floor((i / sampleSize) * width)) * 4
    samples.push([data[topIdx], data[topIdx + 1], data[topIdx + 2]])
    
    // 下边
    const bottomIdx = ((height - 1) * width + Math.floor((i / sampleSize) * width)) * 4
    samples.push([data[bottomIdx], data[bottomIdx + 1], data[bottomIdx + 2]])
    
    // 左边
    const leftIdx = (Math.floor((i / sampleSize) * height) * width) * 4
    samples.push([data[leftIdx], data[leftIdx + 1], data[leftIdx + 2]])
    
    // 右边
    const rightIdx = (Math.floor((i / sampleSize) * height) * width + width - 1) * 4
    samples.push([data[rightIdx], data[rightIdx + 1], data[rightIdx + 2]])
  }

  // 计算平均颜色
  const avgR = samples.reduce((sum, s) => sum + s[0], 0) / samples.length
  const avgG = samples.reduce((sum, s) => sum + s[1], 0) / samples.length
  const avgB = samples.reduce((sum, s) => sum + s[2], 0) / samples.length

  return { r: avgR, g: avgG, b: avgB }
}

/**
 * 智能背景移除（主函数）
 * 优先使用 AI 模型，失败时回退到增强算法
 */
export async function removeBackground(
  imageFile: File,
  options: RemoveBgOptions = {}
): Promise<Blob> {
  const { useAI = true } = options

  try {
    if (useAI) {
      console.log('使用 AI 模型进行背景移除...')
      return await removeBackgroundWithAI(imageFile, options)
    } else {
      console.log('使用增强算法进行背景移除...')
      return await removeBackgroundEnhanced(imageFile, options)
    }
  } catch (error) {
    console.error('AI 处理失败，回退到增强算法:', error)
    return await removeBackgroundEnhanced(imageFile, options)
  }
}
