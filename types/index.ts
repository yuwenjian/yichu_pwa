// 数据库类型定义（基于 Supabase）

export interface User {
  id: string
  email: string
  name?: string
  avatar?: string
  created_at: string
  updated_at: string
}

export interface Wardrobe {
  id: string
  user_id: string
  name: string
  avatar?: string
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  wardrobe_id: string
  parent_id?: string | null
  name: string
  level: 1 | 2
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Clothing {
  id: string
  wardrobe_id: string
  category_id: string
  name?: string
  image_url: string
  colors: string[]
  seasons: string[]
  brand?: string
  price?: number
  purchase_date?: string
  status: 'normal' | 'damaged' | 'idle' | 'discarded'
  use_count: number
  last_used_at?: string
  notes?: string
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Tag {
  id: string
  user_id: string
  name: string
  color?: string
  created_at: string
  updated_at: string
}

export interface ClothingTag {
  id: string
  clothing_id: string
  tag_id: string
  created_at: string
}

export interface Outfit {
  id: string
  wardrobe_id: string
  name: string
  description?: string
  image_url: string
  is_template: boolean
  use_count: number
  tags?: string[]
  seasons?: string[]
  last_used_at?: string
  created_at: string
  updated_at: string
}

export interface OutfitItem {
  id: string
  outfit_id: string
  clothing_id: string
  position_x: number
  position_y: number
  width?: number
  height?: number
  rotation: number
  z_index: number
  created_at: string
}

// API 响应类型
export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: {
    code: string
    message: string
  }
}

// 分页类型
export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface PaginatedResponse<T> {
  items: T[]
  pagination: Pagination
}
