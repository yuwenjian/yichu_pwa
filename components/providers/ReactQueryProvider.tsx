'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode, useState } from 'react'

interface Props {
  children: ReactNode
}

export default function ReactQueryProvider({ children }: Props) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 数据保持新鲜 1 分钟
            gcTime: 5 * 60 * 1000, // 缓存保持 5 分钟（之前叫 cacheTime）
            refetchOnWindowFocus: false, // 窗口聚焦时不自动refetch
            refetchOnReconnect: true, // 网络重连时重新获取
            retry: 1, // 失败重试 1 次
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
