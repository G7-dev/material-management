-- =====================================================
-- 修复 requisitions 表 - 添加 archived_at 列
-- =====================================================
-- 执行说明:
-- 1. 在 Supabase 项目中,进入 SQL Editor
-- 2. 复制并执行此脚本
-- 3. 刷新页面后重新测试确认收货功能
-- =====================================================

-- 添加 archived_at 字段（用于记录归档时间）
ALTER TABLE requisitions 
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- 为 archived_at 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_requisitions_archived_at ON requisitions(archived_at);

-- 更新现有记录的 archived_at（如果有confirmed但没有archived_at的）
UPDATE requisitions 
SET archived_at = confirmed_at 
WHERE status = 'archived' 
  AND archived_at IS NULL 
  AND confirmed_at IS NOT NULL;

-- =====================================================
-- 验证修复结果
-- =====================================================
SELECT '✅ requisitions 表修复完成！' as status;
SELECT '✅ 已添加字段: archived_at (TIMESTAMPTZ)' as added_columns;

-- 查询表结构确认
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'requisitions' 
  AND column_name IN ('status', 'confirmed_at', 'archived_at')
ORDER BY ordinal_position;

-- 查询最新记录确认
SELECT id, status, confirmed_at, archived_at
FROM requisitions 
WHERE status = 'archived'
ORDER BY created_at DESC 
LIMIT 5;

-- =====================================================
-- 执行完成提示
-- =====================================================
SELECT '✅ 现在可以重新测试确认收货功能了！' as next_step;