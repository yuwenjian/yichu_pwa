'use client'

import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import Card from '@/components/ui/Card'

interface FeatureCard {
  title: string
  description: string
  icon: string
  path: string
  color: string
  badge?: string
}

const features: FeatureCard[] = [
  {
    title: '穿搭日历',
    description: '以日历形式查看每月的穿搭记录，了解穿搭习惯和频率',
    icon: '📅',
    path: '/dashboard/calendar',
    color: 'from-blue-500/10 to-blue-500/5',
  },
  {
    title: '搭配关联分析',
    description: '分析衣物的搭配关联关系，发现最佳搭配组合',
    icon: '🔗',
    path: '/dashboard/analysis',
    color: 'from-purple-500/10 to-purple-500/5',
  },
  {
    title: '衣橱对比',
    description: '对比不同衣橱的数据，了解家庭成员间的差异',
    icon: '⚖️',
    path: '/dashboard/compare',
    color: 'from-green-500/10 to-green-500/5',
  },
  {
    title: 'AI 智能建议',
    description: '基于数据分析，AI 为您提供个性化的建议和洞察',
    icon: '🤖',
    path: '/dashboard/recommendations',
    color: 'from-orange-500/10 to-orange-500/5',
    badge: 'NEW',
  },
]

export default function MorePage() {
  const router = useRouter()
  const { user, signOut } = useAuthStore()

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  return (
    <div className="space-y-8">
      {/* 顶部标题 */}
      <div className="md:static sticky top-0 z-30 bg-[var(--background)] md:bg-transparent pb-4 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 border-b md:border-b-0 border-[var(--gray-200)]">
        <div className="space-y-3 md:space-y-4">
          <div>
            <p className="text-[10px] md:text-xs tracking-[0.2em] uppercase text-[var(--gray-500)] mb-2">MORE FEATURES</p>
            <h1 className="text-display text-3xl md:text-5xl text-[var(--gray-900)]">
              更多功能
            </h1>
          </div>
          <div className="h-px w-20 md:w-32 bg-gradient-to-r from-[var(--accent)] to-transparent" />
          <p className="text-sm md:text-base text-[var(--gray-600)]">
            探索更多强大的衣橱管理功能，让数据为您服务
          </p>
        </div>
      </div>

      {/* 功能卡片网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map((feature, index) => (
          <Card
            key={feature.path}
            className={`p-6 cursor-pointer hover:shadow-[var(--shadow-soft)] transition-all hover:scale-[1.02] bg-gradient-to-br ${feature.color} border-2 border-transparent hover:border-[var(--accent)]/30 animate-fade-in stagger-${Math.min(index % 5 + 1, 5)}`}
            onClick={() => router.push(feature.path)}
          >
            <div className="flex items-start gap-4">
              <div className="text-5xl flex-shrink-0">{feature.icon}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-xl font-medium text-[var(--gray-900)]">
                    {feature.title}
                  </h3>
                  {feature.badge && (
                    <span className="px-2 py-0.5 bg-[var(--accent)] text-white text-xs rounded-[var(--radius-full)] font-medium">
                      {feature.badge}
                    </span>
                  )}
                </div>
                <p className="text-sm text-[var(--gray-600)] leading-relaxed">
                  {feature.description}
                </p>
                <div className="mt-4 flex items-center text-[var(--accent)] text-sm font-medium">
                  立即体验
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* 快捷功能 */}
      <Card className="p-6">
        <h2 className="text-2xl font-medium mb-5 text-[var(--gray-900)]">
          快捷功能
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => router.push('/dashboard/wardrobes/new')}
            className="p-4 rounded-[var(--radius-lg)] bg-[var(--accent)]/5 hover:bg-[var(--accent)]/10 transition-all text-center group"
          >
            <div className="text-3xl mb-2">➕</div>
            <div className="text-sm font-medium text-[var(--gray-900)] group-hover:text-[var(--accent-dark)]">
              创建衣橱
            </div>
          </button>
          <button
            onClick={() => router.push('/dashboard/outfits/new')}
            className="p-4 rounded-[var(--radius-lg)] bg-[var(--primary)]/5 hover:bg-[var(--primary)]/10 transition-all text-center group"
          >
            <div className="text-3xl mb-2">👔</div>
            <div className="text-sm font-medium text-[var(--gray-900)] group-hover:text-[var(--primary)]">
              创建搭配
            </div>
          </button>
          <button
            onClick={() => router.push('/dashboard/statistics')}
            className="p-4 rounded-[var(--radius-lg)] bg-[var(--success)]/5 hover:bg-[var(--success)]/10 transition-all text-center group"
          >
            <div className="text-3xl mb-2">📊</div>
            <div className="text-sm font-medium text-[var(--gray-900)] group-hover:text-[var(--success)]">
              数据统计
            </div>
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="p-4 rounded-[var(--radius-lg)] bg-[var(--gray-100)] hover:bg-[var(--gray-200)] transition-all text-center group"
          >
            <div className="text-3xl mb-2">🏠</div>
            <div className="text-sm font-medium text-[var(--gray-900)]">
              返回首页
            </div>
          </button>
        </div>
      </Card>

      {/* 账户设置 */}
      <Card className="p-6">
        <h2 className="text-2xl font-medium mb-5 text-[var(--gray-900)]">
          账户设置
        </h2>
        <div className="space-y-4">
          {/* 当前账户信息 */}
          <div className="flex items-center justify-between p-4 rounded-[var(--radius-lg)] bg-[var(--gray-100)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--accent)] flex items-center justify-center">
                <span className="text-white text-lg font-medium">
                  {user?.email?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              <div>
                <div className="text-sm font-medium text-[var(--gray-900)]">
                  {user?.email || '未登录'}
                </div>
                <div className="text-xs text-[var(--gray-600)]">
                  当前账户
                </div>
              </div>
            </div>
          </div>
          
          {/* 退出登录按钮 */}
          <button
            onClick={handleSignOut}
            className="w-full p-4 rounded-[var(--radius-lg)] bg-[var(--error)]/5 hover:bg-[var(--error)]/10 transition-all text-center group border border-[var(--error)]/20"
          >
            <div className="flex items-center justify-center gap-2 text-[var(--error)] group-hover:text-[var(--error-dark)]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="font-medium">退出登录</span>
            </div>
          </button>
        </div>
      </Card>

      {/* 功能说明 */}
      <Card className="p-6 bg-gradient-to-br from-[var(--accent)]/5 to-transparent border border-[var(--accent)]/20">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-[var(--accent)]/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium mb-3 text-[var(--gray-900)]">关于高级功能</h3>
            <ul className="space-y-2 text-sm text-[var(--gray-700)]">
              <li className="flex items-start gap-2">
                <span className="text-[var(--accent)] mt-1">•</span>
                <span>这些功能基于您的衣橱数据自动分析，数据越多，分析越准确</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--accent)] mt-1">•</span>
                <span>建议定期记录衣物和搭配的穿搭次数，以获得更好的数据洞察</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--accent)] mt-1">•</span>
                <span>所有分析功能完全在本地计算，保护您的隐私数据</span>
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}
