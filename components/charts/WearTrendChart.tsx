'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface WearTrendChartProps {
  data: Array<{ date: string; count: number }>
}

export default function WearTrendChart({ data }: WearTrendChartProps) {
  // 格式化日期显示
  const formattedData = data.map(item => ({
    ...item,
    displayDate: new Date(item.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={formattedData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-200)" />
        <XAxis 
          dataKey="displayDate" 
          stroke="var(--gray-600)"
          style={{ fontSize: '12px' }}
          interval="preserveStartEnd"
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
          itemStyle={{ color: 'var(--accent-dark)' }}
        />
        <Line 
          type="monotone" 
          dataKey="count" 
          stroke="var(--accent)" 
          strokeWidth={2}
          dot={{ fill: 'var(--accent)', r: 4 }}
          activeDot={{ r: 6 }}
          name="穿搭次数"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
