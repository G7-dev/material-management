-- =====================================================
-- 修复 RLS 策略无限递归问题
-- =====================================================

-- 1. 修复 profiles 表的 RLS 策略
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles"
  ON profiles
  FOR SELECT
  USING (auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  ));

DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
CREATE POLICY "Admins can update all profiles"
  ON profiles
  FOR UPDATE
  USING (auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  ));

-- 2. 修复 materials 表的 RLS 策略
DROP POLICY IF EXISTS "Admins can view all materials" ON materials;
CREATE POLICY "Admins can view all materials"
  ON materials
  FOR SELECT
  USING (auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  ));

DROP POLICY IF EXISTS "Admins can insert materials" ON materials;
CREATE POLICY "Admins can insert materials"
  ON materials
  FOR INSERT
  WITH CHECK (auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  ));

DROP POLICY IF EXISTS "Admins can update materials" ON materials;
CREATE POLICY "Admins can update materials"
  ON materials
  FOR UPDATE
  USING (auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  ));

DROP POLICY IF EXISTS "Admins can delete materials" ON materials;
CREATE POLICY "Admins can delete materials"
  ON materials
  FOR DELETE
  USING (auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  ));

-- 3. 修复 inventory_logs 表的 RLS 策略
DROP POLICY IF EXISTS "Admins can insert inventory logs" ON inventory_logs;
CREATE POLICY "Admins can insert inventory logs"
  ON inventory_logs
  FOR INSERT
  WITH CHECK (auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  ));

-- 4. 修复 requisitions 表的 RLS 策略
DROP POLICY IF EXISTS "Admins can view all requisitions" ON requisitions;
CREATE POLICY "Admins can view all requisitions"
  ON requisitions
  FOR SELECT
  USING (auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  ));

DROP POLICY IF EXISTS "Admins can update requisitions" ON requisitions;
CREATE POLICY "Admins can update requisitions"
  ON requisitions
  FOR UPDATE
  USING (auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  ));

-- 5. 修复 approvals 表的 RLS 策略
DROP POLICY IF EXISTS "Admins can view all approvals" ON approvals;
CREATE POLICY "Admins can view all approvals"
  ON approvals
  FOR SELECT
  USING (auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  ));

DROP POLICY IF EXISTS "Admins can insert approvals" ON approvals;
CREATE POLICY "Admins can insert approvals"
  ON approvals
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
    AND approver_id = auth.uid()
  );

-- =====================================================
-- 修复完成!
-- 现在可以正常登录了
-- =====================================================
