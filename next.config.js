/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development', // 开发环境禁用 PWA
})

const nextConfig = {
  reactStrictMode: true,
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
