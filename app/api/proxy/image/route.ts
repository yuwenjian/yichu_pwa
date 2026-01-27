import { NextRequest, NextResponse } from 'next/server'

/**
 * 图片代理 API
 * 用于解决 Canvas 跨域图片显示和导出问题
 * GET /api/proxy/image?url=...
 */
export async function GET(request: NextRequest) {
  const imageUrl = request.nextUrl.searchParams.get('url')
  
  if (!imageUrl) {
    return new NextResponse('Missing URL', { status: 400 })
  }

  try {
    const response = await fetch(imageUrl)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`)
    }

    const blob = await response.blob()
    const contentType = response.headers.get('Content-Type') || 'image/png'

    return new NextResponse(blob, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*', // 确保同源策略允许
      },
    })
  } catch (error) {
    console.error('Image proxy error:', error)
    return new NextResponse('Failed to fetch image', { status: 500 })
  }
}
