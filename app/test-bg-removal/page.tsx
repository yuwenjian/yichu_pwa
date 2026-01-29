'use client'

import { useState } from 'react'
import { removeBackground, loadBodyPix } from '@/lib/image-processor'

export default function TestBgRemovalPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [originalImage, setOriginalImage] = useState<string>('')
  const [processedImage, setProcessedImage] = useState<string>('')
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [modelLoading, setModelLoading] = useState(false)
  const [modelLoaded, setModelLoaded] = useState(false)
  const [processingTime, setProcessingTime] = useState(0)

  // 参数配置
  const [useAI, setUseAI] = useState(true)
  const [edgeBlur, setEdgeBlur] = useState(7)
  const [threshold, setThreshold] = useState(80)
  const [maxSize, setMaxSize] = useState(800)
  const [bgColor, setBgColor] = useState('transparent')
  
  // 预览背景切换
  const [previewBg, setPreviewBg] = useState<'checkerboard' | 'white' | 'black' | 'dark'>('checkerboard')

  // 预加载模型
  const handlePreloadModel = async () => {
    setModelLoading(true)
    try {
      await loadBodyPix()
      setModelLoaded(true)
      alert('AI 模型加载成功！')
    } catch (error) {
      console.error('加载模型失败:', error)
      alert('加载模型失败，请检查网络连接')
    } finally {
      setModelLoading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSelectedFile(file)
    const url = URL.createObjectURL(file)
    setOriginalImage(url)
    setProcessedImage('')
    setProgress(0)
  }

  // 获取预览背景样式
  const getPreviewBgStyle = () => {
    switch (previewBg) {
      case 'checkerboard':
        return { background: 'linear-gradient(rgba(128, 128, 128, 0.1), rgba(128, 128, 128, 0.1)), #d4b896' }
      case 'white':
        return { backgroundColor: '#ffffff' }
      case 'black':
        return { backgroundColor: '#000000' }
      case 'dark':
        return { backgroundColor: '#1f2937' }
      default:
        return {}
    }
  }

  const handleProcess = async () => {
    if (!selectedFile) return

    setProcessing(true)
    setProgress(0)
    const startTime = Date.now()

    try {
      const result = await removeBackground(selectedFile, {
        backgroundColor: bgColor === 'transparent' ? 'transparent' : bgColor,
        maxSize,
        edgeBlur,
        threshold,
        useAI,
        onProgress: (p) => {
          setProgress(p)
        }
      })

      const url = URL.createObjectURL(result)
      setProcessedImage(url)
      const elapsed = Date.now() - startTime
      setProcessingTime(elapsed)
    } catch (error) {
      console.error('处理失败:', error)
      alert(`处理失败: ${error}`)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">背景移除测试工具</h1>

        {/* 控制面板 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">参数配置</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 模型选择 */}
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={useAI}
                  onChange={(e) => setUseAI(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="font-medium">使用 AI 模型（推荐）</span>
              </label>
              <p className="text-sm text-gray-500 mt-1">
                {modelLoaded ? '✅ 模型已加载' : '⚠️ 模型未加载'}
              </p>
              <button
                onClick={handlePreloadModel}
                disabled={modelLoading || modelLoaded}
                className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 text-sm"
              >
                {modelLoading ? '加载中...' : modelLoaded ? '已加载' : '预加载模型'}
              </button>
            </div>

            {/* 边缘羽化 */}
            <div>
              <label className="block font-medium mb-2">
                边缘羽化: {edgeBlur}
              </label>
              <input
                type="range"
                min="0"
                max="15"
                value={edgeBlur}
                onChange={(e) => setEdgeBlur(Number(e.target.value))}
                className="w-full"
              />
              <p className="text-sm text-gray-500 mt-1">
                AI 模式下控制边缘柔和度
              </p>
            </div>

            {/* 色差阈值 */}
            <div>
              <label className="block font-medium mb-2">
                色差阈值: {threshold}
              </label>
              <input
                type="range"
                min="20"
                max="200"
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="w-full"
              />
              <p className="text-sm text-gray-500 mt-1">
                增强模式下的背景检测灵敏度（越小越严格）
              </p>
            </div>

            {/* 最大尺寸 */}
            <div>
              <label className="block font-medium mb-2">
                最大尺寸: {maxSize}px
              </label>
              <input
                type="range"
                min="400"
                max="2048"
                step="100"
                value={maxSize}
                onChange={(e) => setMaxSize(Number(e.target.value))}
                className="w-full"
              />
              <p className="text-sm text-gray-500 mt-1">
                图片会等比缩放到此尺寸
              </p>
            </div>

            {/* 背景色 */}
            <div>
              <label className="block font-medium mb-2">背景色</label>
              <select
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="w-full border rounded px-3 py-2"
              >
                <option value="transparent">透明</option>
                <option value="#FFFFFF">白色</option>
                <option value="#000000">黑色</option>
                <option value="#F3F4F6">浅灰色</option>
              </select>
            </div>
          </div>

          {/* 文件选择和处理按钮 */}
          <div className="mt-6 flex gap-4">
            <label className="px-6 py-3 bg-gray-800 text-white rounded-lg cursor-pointer hover:bg-gray-700">
              选择图片
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>

            <button
              onClick={handleProcess}
              disabled={!selectedFile || processing}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300"
            >
              {processing ? `处理中 (${progress}%)` : '开始处理'}
            </button>
          </div>

          {processingTime > 0 && (
            <p className="mt-4 text-sm text-gray-600">
              处理耗时: {(processingTime / 1000).toFixed(2)} 秒
            </p>
          )}
        </div>

        {/* 图片对比 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* 原图 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">原图</h3>
            {originalImage ? (
              <div className="relative">
                <img
                  src={originalImage}
                  alt="原图"
                  className="w-full h-auto rounded"
                />
              </div>
            ) : (
              <div className="w-full h-64 bg-gray-100 rounded flex items-center justify-center text-gray-400">
                请选择图片
              </div>
            )}
          </div>

          {/* 处理后 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">处理后</h3>
              
              {/* 背景切换按钮 */}
              <div className="flex gap-1 border rounded overflow-hidden">
                <button
                  onClick={() => setPreviewBg('checkerboard')}
                  className={`px-2 py-1 text-xs ${previewBg === 'checkerboard' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                  title="浅色背景"
                >
                  ⬜
                </button>
                <button
                  onClick={() => setPreviewBg('white')}
                  className={`px-2 py-1 text-xs ${previewBg === 'white' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                  title="白色背景"
                >
                  ◻️
                </button>
                <button
                  onClick={() => setPreviewBg('dark')}
                  className={`px-2 py-1 text-xs ${previewBg === 'dark' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                  title="深灰色背景"
                >
                  ⬛
                </button>
                <button
                  onClick={() => setPreviewBg('black')}
                  className={`px-2 py-1 text-xs ${previewBg === 'black' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                  title="黑色背景"
                >
                  ⚫
                </button>
              </div>
            </div>
            
            {processedImage ? (
              <div className="relative">
                <div 
                  className="rounded p-4"
                  style={getPreviewBgStyle()}
                >
                  <img
                    src={processedImage}
                    alt="处理后"
                    className="w-full h-auto rounded"
                  />
                </div>
                <div className="mt-2 text-xs text-gray-500 text-center">
                  当前背景: {
                    previewBg === 'checkerboard' ? '浅色' :
                    previewBg === 'white' ? '白色' :
                    previewBg === 'dark' ? '深灰色' :
                    '黑色'
                  }
                </div>
              </div>
            ) : (
              <div className="w-full h-64 bg-gray-100 rounded flex items-center justify-center text-gray-400">
                {processing ? `处理中... ${progress}%` : '等待处理'}
              </div>
            )}
          </div>
        </div>

        {/* 使用建议 */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3">💡 使用建议</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• <strong>AI 模式</strong>：效果最好，适合复杂背景和衣物细节</li>
            <li>• <strong>增强模式</strong>：速度快，适合纯色背景</li>
            <li>• <strong>边缘羽化</strong>：建议 5-10，数值越大边缘越柔和</li>
            <li>• <strong>色差阈值</strong>：背景简单时可降低（60-80），复杂时提高（100-120）</li>
            <li>• <strong>最大尺寸</strong>：建议 600-1000，过大会影响性能</li>
            <li>• <strong>拍摄建议</strong>：使用纯色背景（白色最佳）、光线均匀、衣物平铺</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
