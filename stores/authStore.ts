import { create } from 'zustand'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, name?: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  checkUser: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,

  signIn: async (email: string, password: string) => {
    if (!isSupabaseConfigured()) {
      return { error: { message: 'Supabase 未配置，请检查环境变量' } }
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { error }
      }

      set({ user: data.user })
      return { error: null }
    } catch (error) {
      return { error }
    }
  },

  signUp: async (email: string, password: string, name?: string) => {
    if (!isSupabaseConfigured()) {
      return { error: { message: 'Supabase 未配置，请检查环境变量' } }
    }

    try {
      // 清理邮箱地址（去除空格）
      const cleanEmail = email.trim().toLowerCase()
      
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            name: name?.trim() || '',
          },
          emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/dashboard` : undefined,
        },
      })

      if (error) {
        return { error }
      }

      // 如果注册成功但需要邮箱验证
      if (data.user && !data.session) {
        // Supabase 可能需要邮箱验证，用户需要检查邮箱
        return { 
          error: null,
          needsVerification: true 
        }
      }

      set({ user: data.user })
      return { error: null }
    } catch (error: any) {
      return { error: { message: error?.message || '注册失败，请稍后重试' } }
    }
  },

  signOut: async () => {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut()
    }
    set({ user: null })
  },

  checkUser: async () => {
    if (!isSupabaseConfigured()) {
      set({ user: null, loading: false })
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      set({ user, loading: false })
    } catch (error) {
      set({ user: null, loading: false })
    }
  },
}))

// 监听认证状态变化
if (typeof window !== 'undefined' && isSupabaseConfigured()) {
  supabase.auth.onAuthStateChange((event, session) => {
    // 根据事件更新状态，避免重复调用 getUser 发起网络请求
    if (session) {
      useAuthStore.setState({ user: session.user, loading: false })
    } else {
      useAuthStore.setState({ user: null, loading: false })
    }
  })
}
