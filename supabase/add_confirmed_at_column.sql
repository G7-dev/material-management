-- =====================================================
-- 修复 requisitions 表 - 添加 confirmed_at 列
-- =====================================================
-- 执行说明:
-- 1. 在 Supabase 项目中,进入 SQL Editor
-- 2. 复制并执行此脚本
-- 3. 刷新页面后重新测试确认收货功能
-- =====================================================

-- 添加 confirmed_at 字段（用于记录确认收货时间）
ALTER TABLE requisitions 
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;

-- 为 confirmed_at 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_requisitions_confirmed_at ON requisitions(confirmed_at);

-- 更新现有记录的 confirmed_at（如果 status 为 confirmed 或 archived 但没有 confirmed_at 的）
UPDATE requisitions 
SET confirmed_at = COALESCE(archived_at, updated_at)
WHERE status IN ('confirmed', 'archived', 'arrival_notified') 
  AND confirmed_at IS NULL;

-- =====================================================
-- 验证修复结果
-- =====================================================
SELECT '✅ requisitions 表修复完成！' as status;
SELECT '✅ 已添加字段: confirmed_at (TIMESTAMPTZ)' as added_columns;

-- 查询表结构确认
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'requisitions' 
  AND column_name IN ('status', 'confirmed_at', 'archived_at', 'created_at', 'updated_at')
ORDER BY ordinal_position;

-- 查询最新记录确认
SELECT id, status, confirmed_at, archived_at
FROM requisitions 
WHERE status IN ('confirmed', 'archived')
ORDER BY created_at DESC 
LIMIT 5;

-- =====================================================
-- 执行完成提示
-- =====================================================
SELECT '✅ 现在可以重新测试确认收货功能了！' as next_step;