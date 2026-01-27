/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development', // 开发环境禁用 PWA
})

const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // 允许在生产环境构建时存在 ESLint 警告/错误（Vercel 部署常用）
    ignoreDuringBuilds: true,
  },
  typescript: {
    // 如果您也想忽略 TypeScript 错误（可选，不推荐，除非急着部署）
    // ignoreBuildErrors: true,
  },
  images: {
    domains: [
      // 腾讯云 COS 域名
      process.env.NEXT_PUBLIC_COS_DOMAIN?.replace('https://', '').replace('http://', '') || '',
    ].filter(Boolean),
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.cos.**.myqcloud.com',
      },
    ],
  },
}

module.exports = withPWA(nextConfig)
