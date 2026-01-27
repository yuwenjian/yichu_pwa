'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface BrandChartProps {
  data: Array<{ brand: string; count: number; totalUseCount: number }>
}

export default function BrandChart({ data }: BrandChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-[var(--gray-500)]">
        暂无品牌数据
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-200)" />
        <XAxis 
          dataKey="brand" 
          stroke="var(--gray-600)"
          style={{ fontSize: '12px' }}
        />
        <YAxis 
          stroke="var(--gray-600)"
          style={{ fontSize: '12px' }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--card-bg)',
            border: '1px solid var(--gray-300)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-soft)',
          }}
          labelStyle={{ color: 'var(--gray-900)', fontWeight: 500 }}
        />
        <Legend 
          wrapperStyle={{ fontSize: '12px', color: 'var(--gray-700)' }}
        />
        <Bar 
          dataKey="count" 
          fill="var(--accent)" 
          name="衣物数量"
          radius={[8, 8, 0, 0]}
        />
        <Bar 
          dataKey="totalUseCount" 
          fill="var(--primary)" 
          name="穿搭次数"
          radius={[8, 8, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
