import COS from 'cos-nodejs-sdk-v5'

// 腾讯云 COS 配置
const cosConfig = {
  SecretId: process.env.TENCENT_COS_SECRET_ID!,
  SecretKey: process.env.TENCENT_COS_SECRET_KEY!,
  Region: process.env.TENCENT_COS_REGION || 'ap-beijing',
  Bucket: process.env.TENCENT_COS_BUCKET!,
}

if (!cosConfig.SecretId || !cosConfig.SecretKey || !cosConfig.Bucket) {
  throw new Error('Missing Tencent COS environment variables')
}

// 创建 COS 实例
export const cos = new COS({
  SecretId: cosConfig.SecretId,
  SecretKey: cosConfig.SecretKey,
})

export const cosConfigData = cosConfig

// 生成文件上传路径
export const generateUploadPath = (filename: string, folder: string = 'images'): string => {
  const timestamp = Date.now()
  const randomStr = Math.random().toString(36).substring(2, 15)
  const ext = filename.split('.').pop()
  return `${folder}/${timestamp}-${randomStr}.${ext}`
}

// 获取文件 URL
export const getFileUrl = (key: string): string => {
  const domain = process.env.NEXT_PUBLIC_COS_DOMAIN
  if (!domain) {
    throw new Error('Missing NEXT_PUBLIC_COS_DOMAIN')
  }
  return `${domain}/${key}`
}
