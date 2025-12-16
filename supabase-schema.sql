-- One Bottle V2 数据库结构
-- 在 Supabase SQL Editor 中运行

-- 删除旧表（如果存在）
DROP TABLE IF EXISTS views;
DROP TABLE IF EXISTS bottles;

-- 创建 bottles 表
CREATE TABLE bottles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id TEXT NOT NULL UNIQUE,  -- localStorage UUID，每人只能有一条
  content_url TEXT NOT NULL,
  content_type TEXT CHECK (content_type IN ('image', 'video')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE
);

-- 创建 views 表
CREATE TABLE views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  viewer_id TEXT NOT NULL,        -- localStorage UUID
  bottle_id UUID NOT NULL REFERENCES bottles(id) ON DELETE CASCADE,
  viewed_at DATE NOT NULL DEFAULT CURRENT_DATE,
  UNIQUE(viewer_id, bottle_id)    -- 同一个人不能重复看同一个瓶子
);

-- 创建索引
CREATE INDEX idx_bottles_owner_id ON bottles(owner_id);
CREATE INDEX idx_bottles_status ON bottles(status);
CREATE INDEX idx_views_viewer_id ON views(viewer_id);
CREATE INDEX idx_views_viewed_at ON views(viewed_at);

-- 启用 RLS
ALTER TABLE bottles ENABLE ROW LEVEL SECURITY;
ALTER TABLE views ENABLE ROW LEVEL SECURITY;

-- 允许所有操作（简化版）
CREATE POLICY "Allow all on bottles" ON bottles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on views" ON views FOR ALL USING (true) WITH CHECK (true);

