-- =====================================================
-- 修复 profiles 表 RLS 递归死锁问题
-- 根本原因: Admins can view all profiles 策略在查询 profiles 表时
-- 需要先通过 RLS 判断权限，形成递归依赖，导致 500 错误
-- =====================================================

-- 1. 删除有问题的 profiles RLS 策略
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- 2. 创建一个 SECURITY DEFINER 函数来判断是否为管理员
-- 这个函数以定义者权限运行，绕过 RLS 递归
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 3. 重新创建 profiles 表的 RLS 策略（使用函数避免递归）
-- 用户可以查看自己的配置
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- 管理员可以查看所有用户配置（使用 SECURITY DEFINER 函数）
CREATE POLICY "Admins can view all profiles"
  ON profiles
  FOR SELECT
  USING (is_admin());

-- 用户可以更新自己的配置
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- 管理员可以更新所有用户配置
CREATE POLICY "Admins can update all profiles"
  ON profiles
  FOR UPDATE
  USING (is_admin());

-- =====================================================
-- 同样修复其他表的 RLS 策略（替换递归引用 profiles 的方式）
-- =====================================================

-- materials 表
DROP POLICY IF EXISTS "Authenticated users can view active materials" ON materials;
DROP POLICY IF EXISTS "Admins can view all materials" ON materials;
DROP POLICY IF EXISTS "Admins can insert materials" ON materials;
DROP POLICY IF EXISTS "Admins can update materials" ON materials;
DROP POLICY IF EXISTS "Admins can delete materials" ON materials;

CREATE POLICY "Authenticated users can view active materials"
  ON materials FOR SELECT
  USING (auth.uid() IS NOT NULL AND status = 'active');

CREATE POLICY "Admins can view all materials"
  ON materials FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can insert materials"
  ON materials FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update materials"
  ON materials FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admins can delete materials"
  ON materials FOR DELETE
  USING (is_admin());

-- requisitions 表
DROP POLICY IF EXISTS "Users can view own requisitions" ON requisitions;
DROP POLICY IF EXISTS "Admins can view all requisitions" ON requisitions;
DROP POLICY IF EXISTS "Authenticated users can insert requisitions" ON requisitions;
DROP POLICY IF EXISTS "Admins can update requisitions" ON requisitions;

CREATE POLICY "Users can view own requisitions"
  ON requisitions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all requisitions"
  ON requisitions FOR SELECT
  USING (is_admin());

CREATE POLICY "Authenticated users can insert requisitions"
  ON requisitions FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Admins can update requisitions"
  ON requisitions FOR UPDATE
  USING (is_admin());

-- approvals 表
DROP POLICY IF EXISTS "Users can view approvals for own requisitions" ON approvals;
DROP POLICY IF EXISTS "Admins can view all approvals" ON approvals;
DROP POLICY IF EXISTS "Admins can insert approvals" ON approvals;

CREATE POLICY "Users can view approvals for own requisitions"
  ON approvals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM requisitions
      WHERE requisitions.id = approvals.requisition_id
      AND requisitions.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all approvals"
  ON approvals FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can insert approvals"
  ON approvals FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND approver_id = auth.uid()
    AND is_admin()
  );

-- inventory_logs 表
DROP POLICY IF EXISTS "Authenticated users can view inventory logs" ON inventory_logs;
DROP POLICY IF EXISTS "Admins can insert inventory logs" ON inventory_logs;

CREATE POLICY "Authenticated users can view inventory logs"
  ON inventory_logs FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can insert inventory logs"
  ON inventory_logs FOR INSERT
  WITH CHECK (is_admin());

-- =====================================================
-- 验证修复结果
-- =====================================================
SELECT '✅ RLS 递归死锁修复完成！' AS status;
SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, policyname;
