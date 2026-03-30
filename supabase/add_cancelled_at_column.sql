-- =====================================================
-- 修复 requisitions 表 - 添加 cancelled_at 列
-- =====================================================
-- 执行说明:
-- 1. 在 Supabase 项目中,进入 SQL Editor
-- 2. 复制并执行此脚本
-- 3. 刷新页面后重新测试取消功能
-- =====================================================

-- 添加 cancelled_at 字段（用于记录取消时间）
ALTER TABLE requisitions 
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

-- 为 cancelled_at 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_requisitions_cancelled_at ON requisitions(cancelled_at);

-- 更新现有记录的 cancelled_at（如果 status 为 cancelled 但没有 cancelled_at 的）
UPDATE requisitions 
SET cancelled_at = updated_at 
WHERE status = 'cancelled' 
  AND cancelled_at IS NULL;

-- =====================================================
-- 验证修复结果
-- =====================================================
SELECT '✅ requisitions 表修复完成！' as status;
SELECT '✅ 已添加字段: cancelled_at (TIMESTAMPTZ)' as added_columns;

-- 查询表结构确认
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'requisitions' 
  AND column_name IN ('status', 'cancelled_at', 'confirmed_at', 'archived_at')
ORDER BY ordinal_position;

-- 查询最新记录确认
SELECT id, status, cancelled_at, confirmed_at, archived_at
FROM requisitions 
WHERE status = 'cancelled'
ORDER BY created_at DESC 
LIMIT 5;

-- =====================================================
-- 执行完成提示
-- =====================================================
SELECT '✅ 现在可以重新测试取消功能了！' as next_step;