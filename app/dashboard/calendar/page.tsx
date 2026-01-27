'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { useWearCalendar } from '@/lib/hooks/useWearCalendar'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import PullToRefresh from '@/components/ui/PullToRefresh'

export default function CalendarPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [selectedWardrobeId, setSelectedWardrobeId] = useState<string>('')
  const [wardrobes, setWardrobes] = useState<Array<{ id: string; name: string }>>([])
  
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)

  const { data: wearRecords, isLoading, refetch } = useWearCalendar(selectedWardrobeId || undefined, year, month)

  useEffect(() => {
    loadWardrobes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const loadWardrobes = async () => {
    if (!user?.id) return

    try {
      const { data } = await supabase
        .from('wardrobes')
        .select('id, name')
        .eq('user_id', user.id)
        .order('sort_order', { ascending: true })

      if (data && data.length > 0) {
        setWardrobes(data)
        setSelectedWardrobeId(data[0].id)
      }
    } catch (error) {
      console.error('Error loading wardrobes:', error)
    }
  }

  const handleRefresh = async () => {
    await Promise.all([refetch(), loadWardrobes()])
  }

  const handlePrevMonth = () => {
    if (month === 1) {
      setYear(year - 1)
      setMonth(12)
    } else {
      setMonth(month - 1)
    }
  }

  const handleNextMonth = () => {
    if (month === 12) {
      setYear(year + 1)
      setMonth(1)
    } else {
      setMonth(month + 1)
    }
  }

  const getDaysInMonth = () => {
    return new Date(year, month, 0).getDate()
  }

  const getFirstDayOfMonth = () => {
    return new Date(year, month - 1, 1).getDay()
  }

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth()
    const firstDay = getFirstDayOfMonth()
    const days = []

    // 添加空白日期（月初前的空格）
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="aspect-square" />)
    }

    // 添加实际日期
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const record = wearRecords?.find(r => r.date === dateStr)
      const hasRecord = record && (record.clothings.length > 0 || record.outfits.length > 0)
      const isToday = dateStr === new Date().toISOString().split('T')[0]

      days.push(
        <div
          key={day}
          className={`aspect-square p-2 rounded-[var(--radius-md)] cursor-pointer transition-all ${
            hasRecord
              ? 'bg-[var(--accent)]/10 border-2 border-[var(--accent)] hover:bg-[var(--accent)]/20'
              : 'bg-[var(--gray-100)] hover:bg-[var(--gray-200)]'
          } ${isToday ? 'ring-2 ring-[var(--primary)]' : ''}`}
          onClick={() => hasRecord && setSelectedDate(dateStr)}
        >
          <div className="flex flex-col h-full">
            <span className={`text-sm ${hasRecord ? 'font-bold text-[var(--accent-dark)]' : 'text-[var(--gray-600)]'}`}>
              {day}
            </span>
            {hasRecord && (
              <div className="flex-1 flex items-center justify-center">
                <div className="flex gap-1">
                  {record.clothings.length > 0 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                  )}
                  {record.outfits.length > 0 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )
    }

    return days
  }

  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const selectedRecord = wearRecords?.find(r => r.date === selectedDate)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--primary)]"></div>
      </div>
    )
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="space-y-8">
        {/* 顶部标题 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs tracking-[0.2em] uppercase text-[var(--gray-500)] mb-2">CALENDAR</p>
              <h1 className="text-display text-4xl md:text-5xl text-[var(--gray-900)]">
                穿搭日历
              </h1>
            </div>
            {wardrobes.length > 0 && (
              <select
                value={selectedWardrobeId}
                onChange={(e) => setSelectedWardrobeId(e.target.value)}
                className="px-4 py-3 border border-[var(--gray-300)] rounded-[var(--radius-lg)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)] text-[var(--gray-900)] bg-[var(--input-bg)] shadow-[var(--shadow-subtle)] transition-all"
              >
                {wardrobes.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="h-px w-32 bg-gradient-to-r from-[var(--accent)] to-transparent" />
        </div>

        {/* 日历导航 */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" onClick={handlePrevMonth}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Button>
            <h2 className="text-2xl font-medium text-[var(--gray-900)]">
              {year}年 {month}月
            </h2>
            <Button variant="ghost" onClick={handleNextMonth}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          </div>

          {/* 星期标题 */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['日', '一', '二', '三', '四', '五', '六'].map((day) => (
              <div key={day} className="text-center text-sm font-medium text-[var(--gray-600)] py-2">
                {day}
              </div>
            ))}
          </div>

          {/* 日历网格 */}
          <div className="grid grid-cols-7 gap-2">
            {renderCalendar()}
          </div>

          {/* 图例 */}
          <div className="flex items-center gap-6 mt-6 pt-6 border-t border-[var(--gray-200)]">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[var(--accent)]" />
              <span className="text-sm text-[var(--gray-600)]">单品穿搭</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[var(--primary)]" />
              <span className="text-sm text-[var(--gray-600)]">搭配记录</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-[var(--radius-sm)] ring-2 ring-[var(--primary)]" />
              <span className="text-sm text-[var(--gray-600)]">今天</span>
            </div>
          </div>
        </Card>

        {/* 选中日期的详情 */}
        {selectedRecord && (
          <Card className="p-6 border-2 border-[var(--accent)]/30">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-2xl font-medium text-[var(--gray-900)]">
                {new Date(selectedDate!).toLocaleDateString('zh-CN', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  weekday: 'long'
                })}
              </h2>
              <Button variant="ghost" onClick={() => setSelectedDate(null)}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>

            {/* 单品记录 */}
            {selectedRecord.clothings.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3 text-[var(--gray-900)]">
                  单品穿搭 ({selectedRecord.clothings.length})
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {selectedRecord.clothings.map((clothing) => (
                    <div
                      key={clothing.id}
                      className="cursor-pointer group"
                      onClick={() => router.push(`/dashboard/wardrobes/${selectedWardrobeId}/clothings/${clothing.id}`)}
                    >
                      <div className="aspect-square rounded-[var(--radius-md)] overflow-hidden bg-[var(--gray-100)] shadow-[var(--shadow-subtle)] hover:shadow-[var(--shadow-soft)] transition-all group-hover:scale-105">
                        <img
                          src={clothing.image_url}
                          alt={clothing.name || '衣物'}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="mt-1 text-xs text-[var(--gray-900)] text-center line-clamp-1">
                        {clothing.name || clothing.category.name}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 搭配记录 */}
            {selectedRecord.outfits.length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-3 text-[var(--gray-900)]">
                  搭配记录 ({selectedRecord.outfits.length})
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {selectedRecord.outfits.map((outfit) => (
                    <div
                      key={outfit.id}
                      className="cursor-pointer group"
                      onClick={() => router.push(`/dashboard/outfits/${outfit.id}`)}
                    >
                      <div className="aspect-square rounded-[var(--radius-lg)] overflow-hidden bg-[var(--gray-100)] shadow-[var(--shadow-subtle)] hover:shadow-[var(--shadow-soft)] transition-all group-hover:scale-105">
                        <img
                          src={outfit.image_url}
                          alt={outfit.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="mt-2 text-sm text-[var(--gray-900)] text-center line-clamp-1 group-hover:text-[var(--accent-dark)] transition-colors">
                        {outfit.name}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        )}

        {/* 本月统计 */}
        {wearRecords && wearRecords.length > 0 && (
          <Card className="p-6">
            <h2 className="text-2xl font-medium mb-5 text-[var(--gray-900)]">
              本月统计
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-[var(--accent)]/5 rounded-[var(--radius-lg)]">
                <div className="text-3xl font-bold text-[var(--accent-dark)] mb-1">
                  {wearRecords.length}
                </div>
                <div className="text-sm text-[var(--gray-600)]">穿搭天数</div>
              </div>
              <div className="text-center p-4 bg-[var(--accent)]/5 rounded-[var(--radius-lg)]">
                <div className="text-3xl font-bold text-[var(--accent-dark)] mb-1">
                  {wearRecords.reduce((sum, r) => sum + r.clothings.length, 0)}
                </div>
                <div className="text-sm text-[var(--gray-600)]">单品次数</div>
              </div>
              <div className="text-center p-4 bg-[var(--primary)]/5 rounded-[var(--radius-lg)]">
                <div className="text-3xl font-bold text-[var(--primary)] mb-1">
                  {wearRecords.reduce((sum, r) => sum + r.outfits.length, 0)}
                </div>
                <div className="text-sm text-[var(--gray-600)]">搭配次数</div>
              </div>
              <div className="text-center p-4 bg-[var(--success)]/5 rounded-[var(--radius-lg)]">
                <div className="text-3xl font-bold text-[var(--success)] mb-1">
                  {((wearRecords.length / getDaysInMonth()) * 100).toFixed(0)}%
                </div>
                <div className="text-sm text-[var(--gray-600)]">活跃度</div>
              </div>
            </div>
          </Card>
        )}

        {/* 空状态 */}
        {(!wearRecords || wearRecords.length === 0) && (
          <Card className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--gray-200)] flex items-center justify-center">
              <svg className="w-8 h-8 text-[var(--gray-400)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-[var(--gray-600)] mb-2">本月还没有穿搭记录</p>
            <p className="text-sm text-[var(--gray-500)]">记录衣物或搭配的穿搭，数据会显示在日历上</p>
          </Card>
        )}
      </div>
    </PullToRefresh>
  )
}
