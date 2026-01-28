'use client'

import { useEffect, useRef, useState } from 'react'
import Script from 'next/script'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import type { Clothing } from '@/types'

// 声明全局 fabric 变量
declare global {
  interface Window {
    fabric: any
  }
}

interface OutfitCanvasModalProps {
  isOpen: boolean
  onClose: () => void
  clothings: Clothing[]
  onSave: (imageDataUrl: string) => void
}

const PRESET_BACKGROUNDS = [
  '#FFFFFF', // 纯白
  '#F3F4F6', // 极简灰
  '#2C2C2E', // 深岩黑
  '#DBCFB0', // 亚麻色
  '#F9F1E7', // 奶油米
  '#FEF3C7', // 暖阳黄
  '#E0F2FE', // 清新蓝
  '#FCE7F3', // 浪漫粉
  '#ECFDF5', // 薄荷绿
  '#EDE9FE', // 薰衣草紫
  '#FFE4E1', // 浅玫瑰
  '#E5E7EB', // 水泥灰
]

export default function OutfitCanvasModal({
  isOpen,
  onClose,
  clothings,
  onSave,
}: OutfitCanvasModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fabricCanvasRef = useRef<any>(null)
  const [backgroundColor, setBackgroundColor] = useState('#FFFFFF')
  const [isLoading, setIsLoading] = useState(false)
  const [isFabricReady, setIsFabricReady] = useState(false)

  const loadClothings = (canvas: any, items: Clothing[]) => {
    if (!window.fabric || items.length === 0) return
    
    setIsLoading(true)
    const canvasSize = canvas.getWidth()
    let loadedCount = 0

    items.forEach((item, index) => {
      if (!item.image_url) {
        loadedCount++
        if (loadedCount === items.length) setIsLoading(false)
        return
      }

      const proxyUrl = `/api/proxy/image?url=${encodeURIComponent(item.image_url)}`

      window.fabric.Image.fromURL(proxyUrl, (img: any) => {
        loadedCount++
        
        if (img) {
          const scale = (canvasSize * 0.4) / Math.max(img.width || 1, img.height || 1)
          img.scale(scale)
          
          img.set({
            left: (canvasSize * 0.1) + (index % 3) * (canvasSize * 0.2),
            top: (canvasSize * 0.1) + Math.floor(index / 3) * (canvasSize * 0.2),
            cornerColor: '#7c3aed',
            cornerStrokeColor: '#FFFFFF',
            cornerSize: 10,
            transparentCorners: false,
            padding: 5,
          })

          canvas.add(img)
          canvas.renderAll()
        }

        if (loadedCount === items.length) {
          setIsLoading(false)
          canvas.renderAll()
        }
      }, { crossOrigin: 'anonymous' })
    })
  }

  // 初始化 canvas
  useEffect(() => {
    if (isOpen && isFabricReady && canvasRef.current && !fabricCanvasRef.current) {
      const containerWidth = Math.min(window.innerWidth - 64, 500)
      
      const canvas = new window.fabric.Canvas(canvasRef.current, {
        width: containerWidth,
        height: containerWidth,
        backgroundColor: backgroundColor,
      })

      fabricCanvasRef.current = canvas
      // 不在这里加载衣物，统一由下面的 useEffect 处理
    }

    return () => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose()
        fabricCanvasRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isFabricReady])

  // 加载和更新衣物
  useEffect(() => {
    if (isOpen && fabricCanvasRef.current && clothings.length > 0) {
      const canvas = fabricCanvasRef.current
      canvas.clear()
      canvas.setBackgroundColor(backgroundColor, () => {
        canvas.renderAll()
      })
      loadClothings(canvas, clothings)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clothings, backgroundColor, isOpen])

  const handleSave = () => {
    if (!fabricCanvasRef.current) return
    
    fabricCanvasRef.current.discardActiveObject()
    fabricCanvasRef.current.renderAll()

    try {
      const dataUrl = fabricCanvasRef.current.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 2,
      })
      onSave(dataUrl)
      onClose()
    } catch (error) {
      console.error('Canvas export failed:', error)
      alert('图片导出失败，可能是因为图片跨域限制。')
    }
  }

  const changeBgColor = (color: string) => {
    setBackgroundColor(color)
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.setBackgroundColor(color, () => {
        fabricCanvasRef.current?.renderAll()
      })
    }
  }

  const deleteSelected = () => {
    if (!fabricCanvasRef.current) return
    const activeObjects = fabricCanvasRef.current.getActiveObjects()
    fabricCanvasRef.current.remove(...activeObjects)
    fabricCanvasRef.current.discardActiveObject().renderAll()
  }

  const bringToFront = () => {
    const activeObject = fabricCanvasRef.current?.getActiveObject()
    if (activeObject) {
      activeObject.bringToFront()
      fabricCanvasRef.current?.renderAll()
    }
  }

  const sendToBack = () => {
    const activeObject = fabricCanvasRef.current?.getActiveObject()
    if (activeObject) {
      activeObject.sendToBack()
      fabricCanvasRef.current?.renderAll()
    }
  }

  return (
    <>
      <Script 
        src="https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.1/fabric.min.js"
        onLoad={() => setIsFabricReady(true)}
      />
      
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="制作搭配图"
        size="xl"
      >
        <div className="flex flex-col md:flex-row gap-6">
          {/* 画布区域 - Editorial 风格 */}
          <div className="flex-1 flex flex-col items-center bg-[var(--background)] rounded-[var(--radius-xl)] overflow-hidden p-6 border border-[var(--gray-200)]">
            <div className="relative shadow-[var(--shadow-elevated)] rounded-lg overflow-hidden">
              {!isFabricReady ? (
                <div className="w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] flex items-center justify-center bg-white">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent)]"></div>
                </div>
              ) : (
                <canvas ref={canvasRef} />
              )}
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent)]"></div>
                </div>
              )}
            </div>
            <p className="mt-4 text-xs text-[var(--gray-600)] tracking-wide">
              {clothings.length} 件衣物已加载
            </p>
          </div>

          {/* 控制面板 - Editorial 风格 */}
          <div className="w-full md:w-72 space-y-6">
            {/* 背景颜色 */}
            <div>
              <h3 className="text-sm font-medium text-[var(--gray-900)] mb-3 tracking-wide uppercase">背景颜色</h3>
              <div className="grid grid-cols-4 gap-2.5">
                {PRESET_BACKGROUNDS.map((color) => (
                  <button
                    key={color}
                    onClick={() => changeBgColor(color)}
                    className={`aspect-square rounded-full border-2 transition-all duration-300 shadow-sm hover:shadow-md ${
                      backgroundColor === color 
                        ? 'border-[var(--accent)] scale-110 ring-2 ring-[var(--accent)]/30' 
                        : 'border-[var(--gray-300)] hover:border-[var(--accent)]/50'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>

            {/* 图层操作 */}
            <div className="border-t border-[var(--gray-200)] pt-6">
              <h3 className="text-sm font-medium text-[var(--gray-900)] mb-3 tracking-wide uppercase">图层操作</h3>
              <div className="grid grid-cols-2 gap-2.5">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={bringToFront}
                  className="!text-xs"
                >
                  置于顶层
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={sendToBack}
                  className="!text-xs"
                >
                  置于底层
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={deleteSelected}
                  className="!text-xs !text-[var(--error)] !border-[var(--error)]/30 hover:!bg-[var(--error)]/5"
                >
                  删除选中
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    if (fabricCanvasRef.current) {
                      fabricCanvasRef.current.clear()
                      fabricCanvasRef.current.setBackgroundColor(backgroundColor, () => {
                        loadClothings(fabricCanvasRef.current, clothings)
                      })
                    }
                  }}
                  className="!text-xs"
                >
                  重置画布
                </Button>
              </div>
            </div>

            {/* 提示和操作按钮 */}
            <div className="pt-6 border-t border-[var(--gray-200)]">
              <div className="p-4 bg-[var(--accent)]/5 rounded-[var(--radius-lg)] border border-[var(--accent)]/20 mb-4">
                <p className="text-xs text-[var(--gray-700)] leading-relaxed">
                  <span className="text-[var(--accent)] font-medium">💡 提示：</span>
                  您可以点击并拖动衣物图片来移动位置，使用边框角进行缩放和旋转。
                </p>
              </div>
              <div className="flex gap-3">
                <Button 
                  variant="ghost" 
                  className="flex-1" 
                  onClick={onClose}
                >
                  取消
                </Button>
                <Button 
                  variant="secondary" 
                  className="flex-1" 
                  onClick={handleSave} 
                  disabled={isLoading || !isFabricReady}
                >
                  确认完成
                </Button>
              </div>
            </div>
          </div>
        </div>

        <style jsx global>{`
          .canvas-container {
            margin: 0 auto;
            touch-action: none;
          }
        `}</style>
      </Modal>
    </>
  )
}
