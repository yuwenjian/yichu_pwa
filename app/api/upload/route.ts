import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { cos, generateUploadPath, getFileUrl } from '@/lib/cos'
import { cosConfigData } from '@/lib/cos'

/**
 * 图片上传 API
 * POST /api/upload
 */
export async function POST(request: NextRequest) {
  try {
    // 验证用户身份
    const supabase = createServerClient()
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: { code: 'AUTH_REQUIRED', message: '需要登录' } },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { code: 'AUTH_INVALID', message: '认证失败' } },
        { status: 401 }
      )
    }

    // 获取上传的文件
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: '未找到文件' } },
        { status: 400 }
      )
    }

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_FILE_TYPE', message: '不支持的文件类型' } },
        { status: 400 }
      )
    }

    // 验证文件大小（10MB）
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: { code: 'FILE_TOO_LARGE', message: '文件过大，最大 10MB' } },
        { status: 400 }
      )
    }

    // 生成上传路径
    const uploadPath = generateUploadPath(file.name, 'images')

    // 转换为 Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // 上传到腾讯云 COS
    await new Promise((resolve, reject) => {
      cos.putObject(
        {
          Bucket: cosConfigData.Bucket,
          Region: cosConfigData.Region,
          Key: uploadPath,
          Body: buffer,
          ContentType: file.type,
        },
        (err, data) => {
          if (err) {
            reject(err)
          } else {
            resolve(data)
          }
        }
      )
    })

    // 返回文件 URL
    const fileUrl = getFileUrl(uploadPath)

    return NextResponse.json({
      success: true,
      data: {
        imageUrl: fileUrl,
        key: uploadPath,
      },
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '上传失败',
        },
      },
      { status: 500 }
    )
  }
}
