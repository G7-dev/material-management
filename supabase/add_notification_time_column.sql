-- =====================================================
-- 修复 requisitions 表 - 添加 notification_time 列
-- =====================================================
-- 执行说明:
-- 1. 在 Supabase 项目中,进入 SQL Editor
-- 2. 复制并执行此脚本
-- 3. 刷新页面后重新测试到货通知功能
-- =====================================================

-- 添加 notification_time 字段（用于存储到货通知时间）
ALTER TABLE requisitions 
ADD COLUMN IF NOT EXISTS notification_time TIMESTAMPTZ;

-- 为 notification_time 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_requisitions_notification_time ON requisitions(notification_time);

-- =====================================================
-- 验证修复结果
-- =====================================================
-- 查询表结构，确认字段已添加
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'requisitions' 
-- ORDER BY ordinal_position;

-- 查询最新的一条记录，确认字段可以正常使用
-- SELECT id, purchase_name, status, notification_time
-- FROM requisitions 
-- ORDER BY created_at DESC 
-- LIMIT 1;

-- =====================================================
-- 执行完成提示
-- =====================================================
SELECT '✅ requisitions 表修复完成！' as status;
SELECT '✅ 已添加字段: notification_time (TIMESTAMPTZ)' as added_columns;
SELECT '✅ 现在可以重新测试到货通知功能了！' as next_step;