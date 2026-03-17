-- =====================================================
-- 数据库清理和重新初始化脚本
-- =====================================================
-- ⚠️  警告: 此脚本会删除所有数据,仅在开发环境使用!
-- =====================================================

-- 1. 删除所有视图
DROP VIEW IF EXISTS low_stock_materials CASCADE;

-- 2. 删除所有表(按依赖关系顺序)
DROP TABLE IF EXISTS approvals CASCADE;
DROP TABLE IF EXISTS requisitions CASCADE;
DROP TABLE IF EXISTS inventory_logs CASCADE;
DROP TABLE IF EXISTS materials CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- 3. 删除触发器函数
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- =====================================================
-- 数据库清理完成
-- 现在可以执行 init.sql 重新初始化
-- =====================================================
