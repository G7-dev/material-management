-- =====================================================
-- 临时禁用所有表的 RLS(用于快速测试)
-- =====================================================

-- 禁用所有表的 RLS
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE materials DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE requisitions DISABLE ROW LEVEL SECURITY;
ALTER TABLE approvals DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- 所有表的 RLS 已临时禁用
-- 现在应该可以正常使用系统了
-- =====================================================
