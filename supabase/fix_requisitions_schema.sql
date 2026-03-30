-- =====================================================
-- 修复 requisitions 表结构 - 添加缺失的字段
-- =====================================================
-- 执行说明:
-- 1. 在 Supabase 项目中,进入 SQL Editor
-- 2. 复制并执行此脚本
-- 3. 刷新页面后重新测试申领功能
-- =====================================================

-- 添加 created_by 字段（与用户ID关联）
ALTER TABLE requisitions 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id);

-- 添加部门字段
ALTER TABLE requisitions 
ADD COLUMN IF NOT EXISTS department TEXT;

-- 添加工号字段
ALTER TABLE requisitions 
ADD COLUMN IF NOT EXISTS employee_id TEXT;

-- 添加申请人姓名字段
ALTER TABLE requisitions 
ADD COLUMN IF NOT EXISTS applicant_name TEXT;

-- 添加预计到货日期字段（用于申购）
ALTER TABLE requisitions 
ADD COLUMN IF NOT EXISTS estimated_delivery_date DATE;

-- 更新 created_by 字段的值为 user_id（如果为空）
UPDATE requisitions 
SET created_by = user_id 
WHERE created_by IS NULL;

-- 为 created_by 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_requisitions_created_by ON requisitions(created_by);

-- 为 department 创建索引
CREATE INDEX IF NOT EXISTS idx_requisitions_department ON requisitions(department);

-- 为 employee_id 创建索引
CREATE INDEX IF NOT EXISTS idx_requisitions_employee_id ON requisitions(employee_id);

-- =====================================================
-- 验证修复结果
-- =====================================================
-- 查询表结构，确认字段已添加
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'requisitions' 
-- ORDER BY ordinal_position;

-- 查询最新的一条记录，确认字段可以正常使用
-- SELECT id, user_id, created_by, department, employee_id, applicant_name, estimated_delivery_date
-- FROM requisitions 
-- ORDER BY created_at DESC 
-- LIMIT 1;

-- =====================================================
-- 执行完成提示
-- =====================================================
SELECT '✅ requisitions 表结构修复完成！' as status;
SELECT '✅ 已添加字段: created_by, department, employee_id, applicant_name, estimated_delivery_date' as added_columns;
SELECT '✅ 现在可以重新测试申领和申购功能了！' as next_step;
