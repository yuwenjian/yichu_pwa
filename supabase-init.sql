-- Supabase 数据库初始化脚本
-- 在 Supabase Dashboard 的 SQL Editor 中执行此脚本

-- 1. 创建 users 表（Supabase Auth 会自动创建，这里只添加扩展字段）
-- 注意：Supabase 的 auth.users 表是自动管理的，我们只需要创建应用相关的表

-- 2. 创建 wardrobes 表（衣橱表）
CREATE TABLE IF NOT EXISTS public.wardrobes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  avatar TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 创建 categories 表（分类表）
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wardrobe_id UUID NOT NULL REFERENCES public.wardrobes(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  level INTEGER NOT NULL CHECK (level IN (1, 2)),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 创建 clothings 表（衣物表）
CREATE TABLE IF NOT EXISTS public.clothings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wardrobe_id UUID NOT NULL REFERENCES public.wardrobes(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  name TEXT,
  image_url TEXT NOT NULL,
  colors TEXT[] DEFAULT '{}',
  seasons TEXT[] DEFAULT '{}',
  brand TEXT,
  price DECIMAL(10,2),
  purchase_date DATE,
  status TEXT DEFAULT 'normal' CHECK (status IN ('normal', 'damaged', 'idle', 'discarded')),
  use_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 创建 tags 表（标签表）
CREATE TABLE IF NOT EXISTS public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- 6. 创建 clothing_tags 表（衣物标签关联表）
CREATE TABLE IF NOT EXISTS public.clothing_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clothing_id UUID NOT NULL REFERENCES public.clothings(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(clothing_id, tag_id)
);

-- 7. 创建 outfits 表（搭配表）
CREATE TABLE IF NOT EXISTS public.outfits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wardrobe_id UUID NOT NULL REFERENCES public.wardrobes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  is_template BOOLEAN DEFAULT false,
  use_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. 创建 outfit_items 表（搭配单品表）
CREATE TABLE IF NOT EXISTS public.outfit_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outfit_id UUID NOT NULL REFERENCES public.outfits(id) ON DELETE CASCADE,
  clothing_id UUID NOT NULL REFERENCES public.clothings(id) ON DELETE CASCADE,
  position_x INTEGER DEFAULT 0,
  position_y INTEGER DEFAULT 0,
  width INTEGER,
  height INTEGER,
  rotation INTEGER DEFAULT 0,
  z_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_wardrobes_user_id ON public.wardrobes(user_id);
CREATE INDEX IF NOT EXISTS idx_wardrobes_user_sort ON public.wardrobes(user_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_categories_wardrobe_id ON public.categories(wardrobe_id);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_wardrobe_level ON public.categories(wardrobe_id, level);

CREATE INDEX IF NOT EXISTS idx_clothings_wardrobe_id ON public.clothings(wardrobe_id);
CREATE INDEX IF NOT EXISTS idx_clothings_category_id ON public.clothings(category_id);
CREATE INDEX IF NOT EXISTS idx_clothings_status ON public.clothings(status);
CREATE INDEX IF NOT EXISTS idx_clothings_brand ON public.clothings(brand);
CREATE INDEX IF NOT EXISTS idx_clothings_created_at ON public.clothings(created_at);

CREATE INDEX IF NOT EXISTS idx_tags_user_id ON public.tags(user_id);
CREATE INDEX IF NOT EXISTS idx_tags_user_name ON public.tags(user_id, name);

CREATE INDEX IF NOT EXISTS idx_clothing_tags_clothing_id ON public.clothing_tags(clothing_id);
CREATE INDEX IF NOT EXISTS idx_clothing_tags_tag_id ON public.clothing_tags(tag_id);

CREATE INDEX IF NOT EXISTS idx_outfits_wardrobe_id ON public.outfits(wardrobe_id);
CREATE INDEX IF NOT EXISTS idx_outfits_template ON public.outfits(wardrobe_id, is_template);
CREATE INDEX IF NOT EXISTS idx_outfits_created_at ON public.outfits(created_at);

CREATE INDEX IF NOT EXISTS idx_outfit_items_outfit_id ON public.outfit_items(outfit_id);
CREATE INDEX IF NOT EXISTS idx_outfit_items_clothing_id ON public.outfit_items(clothing_id);

-- 启用 Row Level Security (RLS)
ALTER TABLE public.wardrobes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clothings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clothing_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outfits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outfit_items ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略
-- wardrobes 表策略：用户只能访问自己的衣橱
CREATE POLICY "Users can only access their own wardrobes"
ON public.wardrobes
FOR ALL
USING (auth.uid() = user_id);

-- categories 表策略：用户只能访问自己衣橱的分类
CREATE POLICY "Users can only access categories in their own wardrobes"
ON public.categories
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.wardrobes
    WHERE wardrobes.id = categories.wardrobe_id
    AND wardrobes.user_id = auth.uid()
  )
);

-- clothings 表策略：用户只能访问自己衣橱的衣物
CREATE POLICY "Users can only access clothings in their own wardrobes"
ON public.clothings
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.wardrobes
    WHERE wardrobes.id = clothings.wardrobe_id
    AND wardrobes.user_id = auth.uid()
  )
);

-- tags 表策略：用户只能访问自己的标签
CREATE POLICY "Users can only access their own tags"
ON public.tags
FOR ALL
USING (auth.uid() = user_id);

-- clothing_tags 表策略：用户只能访问自己衣物的标签关联
CREATE POLICY "Users can only access clothing_tags for their own clothings"
ON public.clothing_tags
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.clothings
    JOIN public.wardrobes ON wardrobes.id = clothings.wardrobe_id
    WHERE clothings.id = clothing_tags.clothing_id
    AND wardrobes.user_id = auth.uid()
  )
);

-- outfits 表策略：用户只能访问自己衣橱的搭配
CREATE POLICY "Users can only access outfits in their own wardrobes"
ON public.outfits
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.wardrobes
    WHERE wardrobes.id = outfits.wardrobe_id
    AND wardrobes.user_id = auth.uid()
  )
);

-- outfit_items 表策略：用户只能访问自己搭配的单品
CREATE POLICY "Users can only access outfit_items for their own outfits"
ON public.outfit_items
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.outfits
    JOIN public.wardrobes ON wardrobes.id = outfits.wardrobe_id
    WHERE outfits.id = outfit_items.outfit_id
    AND wardrobes.user_id = auth.uid()
  )
);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为需要自动更新 updated_at 的表创建触发器
CREATE TRIGGER set_updated_at_wardrobes
  BEFORE UPDATE ON public.wardrobes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_categories
  BEFORE UPDATE ON public.categories
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_clothings
  BEFORE UPDATE ON public.clothings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_tags
  BEFORE UPDATE ON public.tags
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_outfits
  BEFORE UPDATE ON public.outfits
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
