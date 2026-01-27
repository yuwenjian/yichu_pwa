'use client'

import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis } from 'recharts'

interface PriceUsageChartProps {
  data: Array<{ price: number; use_count: number; name: string | null }>
}

export default function PriceUsageChart({ data }: PriceUsageChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-[var(--gray-500)]">
        暂无价格数据
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ScatterChart margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-200)" />
        <XAxis 
          type="number" 
          dataKey="price" 
          name="价格" 
          unit="元"
          stroke="var(--gray-600)"
          style={{ fontSize: '12px' }}
        />
        <YAxis 
          type="number" 
          dataKey="use_count" 
          name="穿搭次数"
          stroke="var(--gray-600)"
          style={{ fontSize: '12px' }}
        />
        <ZAxis range={[60, 400]} />
        <Tooltip
          cursor={{ strokeDasharray: '3 3' }}
          contentStyle={{
            backgroundColor: 'var(--card-bg)',
            border: '1px solid var(--gray-300)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-soft)',
          }}
          labelStyle={{ color: 'var(--gray-900)', fontWeight: 500 }}
          formatter={(value: any, name: string) => {
            if (name === 'price') return [`¥${value}`, '价格']
            if (name === 'use_count') return [`${value}次`, '穿搭次数']
            return [value, name]
          }}
        />
        <Scatter 
          name="衣物" 
          data={data} 
          fill="var(--accent)" 
          fillOpacity={0.6}
        />
      </ScatterChart>
    </ResponsiveContainer>
  )
}
