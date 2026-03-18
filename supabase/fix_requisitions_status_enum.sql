-- =====================================================
-- 修复 requisitions 表 - 扩展 status 枚举类型
-- =====================================================
-- 执行说明:
-- 1. 在 Supabase 项目中,进入 SQL Editor
-- 2. 复制并执行此脚本
-- 3. 刷新页面后重新测试申购功能
-- =====================================================

-- 查看当前的枚举类型
-- SELECT enumlabel FROM pg_enum WHERE enumtypid = 'requisition_status'::regtype;

-- 方式1: 添加新的枚举值（推荐）
-- 注意: 如果枚举类型名为 requisition_status，使用以下命令

-- 添加 'arrival_notified' 状态
ALTER TYPE requisition_status ADD VALUE IF NOT EXISTS 'arrival_notified';

-- 添加 'confirmed' 状态
ALTER TYPE requisition_status ADD VALUE IF NOT EXISTS 'confirmed';

-- 添加 'archived' 状态
ALTER TYPE requisition_status ADD VALUE IF NOT EXISTS 'archived';

-- =====================================================
-- 方式2: 如果方式1失败，可能是枚举名称不同，尝试以下查询找到正确的枚举名称
-- =====================================================
-- 查找所有枚举类型
-- SELECT t.typname AS enum_name, 
--        e.enumlabel AS enum_value
-- FROM pg_type t
-- JOIN pg_enum e ON t.oid = e.enumtypid
-- WHERE t.typname LIKE '%status%';

-- =====================================================
-- 验证修复结果
-- =====================================================
SELECT '✅ requisitions 状态枚举已扩展！' as status;
SELECT enumlabel AS available_status 
FROM pg_enum 
WHERE enumtypid = 'requisition_status'::regtype
ORDER BY enumsortorder;

-- =====================================================
-- 执行完成提示
-- =====================================================
SELECT '✅ 现在可以测试到货通知和归档功能了！' as next_step;