-- ============================================
-- 部门库存功能 - 数据库迁移脚本
-- 执行时间：2026-04-11
-- ============================================

-- 1. 为 materials 表添加 department_stocks 字段
ALTER TABLE public.materials 
ADD COLUMN IF NOT EXISTS department_stocks JSONB DEFAULT '{}';

-- 2. 为现有数据初始化部门库存（可选，将总库存分配到"储运部"作为默认）
-- 如果你想保持现有数据不变，可以跳过这一步
UPDATE public.materials 
SET department_stocks = '{"储运部": stock}'::jsonb
WHERE department_stocks IS NULL OR department_stocks = '{}'::jsonb;

-- 3. 添加注释说明字段用途
COMMENT ON COLUMN public.materials.department_stocks IS '各部门库存数量，格式：{"部门名": 数量}';

-- 4. 验证字段已添加
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'materials' 
AND column_name = 'department_stocks';

-- ============================================
-- 执行完成后，请在前端测试：
-- 1. 管理员上架物品 -> 点击"上架数量" -> 分配各部门数量
-- 2. 员工领用 -> 选择部门 -> 优先显示本部门库存
-- ============================================
