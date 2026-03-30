-- =====================================================
-- 正确的 RLS 策略修复(使用 auth.users 而非 profiles)
-- =====================================================

-- 1. 删除所有旧的 RLS 策略
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- 2. 使用 auth.user_id() 而不是引用 profiles 表
-- 查看自己的配置
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- 管理员查看所有配置
CREATE POLICY "Admins can view all profiles"
  ON profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
    )
    OR auth.uid() IN (
      SELECT id FROM (
        SELECT DISTINCT id FROM profiles WHERE role = 'admin'
      ) AS admin_ids
    )
  );

-- 更新自己的配置
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- 管理员更新所有配置
CREATE POLICY "Admins can update all profiles"
  ON profiles
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM (
        SELECT DISTINCT id FROM profiles WHERE role = 'admin'
      ) AS admin_ids
    )
  );

-- =====================================================
-- materials 表 RLS 策略修复
-- =====================================================

DROP POLICY IF EXISTS "Authenticated users can view active materials" ON materials;
DROP POLICY IF EXISTS "Admins can view all materials" ON materials;
DROP POLICY IF EXISTS "Admins can insert materials" ON materials;
DROP POLICY IF EXISTS "Admins can update materials" ON materials;
DROP POLICY IF EXISTS "Admins can delete materials" ON materials;

-- 所有认证用户查看活跃物资
CREATE POLICY "Authenticated users can view active materials"
  ON materials
  FOR SELECT
  USING (auth.uid() IS NOT NULL AND status = 'active');

-- 管理员查看所有物资
CREATE POLICY "Admins can view all materials"
  ON materials
  FOR SELECT
  USING (auth.uid() IN (
    SELECT id FROM (SELECT DISTINCT id FROM profiles WHERE role = 'admin') AS admins
  ));

-- 管理员插入物资
CREATE POLICY "Admins can insert materials"
  ON materials
  FOR INSERT
  WITH CHECK (auth.uid() IN (
    SELECT id FROM (SELECT DISTINCT id FROM profiles WHERE role = 'admin') AS admins
  ));

-- 管理员更新物资
CREATE POLICY "Admins can update materials"
  ON materials
  FOR UPDATE
  USING (auth.uid() IN (
    SELECT id FROM (SELECT DISTINCT id FROM profiles WHERE role = 'admin') AS admins
  ));

-- 管理员删除物资
CREATE POLICY "Admins can delete materials"
  ON materials
  FOR DELETE
  USING (auth.uid() IN (
    SELECT id FROM (SELECT DISTINCT id FROM profiles WHERE role = 'admin') AS admins
  ));

-- =====================================================
-- requisitions 表 RLS 策略修复
-- =====================================================

DROP POLICY IF EXISTS "Users can view own requisitions" ON requisitions;
DROP POLICY IF EXISTS "Admins can view all requisitions" ON requisitions;
DROP POLICY IF EXISTS "Authenticated users can insert requisitions" ON requisitions;
DROP POLICY IF EXISTS "Admins can update requisitions" ON requisitions;

-- 用户查看自己的申领
CREATE POLICY "Users can view own requisitions"
  ON requisitions
  FOR SELECT
  USING (auth.uid() = user_id);

-- 管理员查看所有申领
CREATE POLICY "Admins can view all requisitions"
  ON requisitions
  FOR SELECT
  USING (auth.uid() IN (
    SELECT id FROM (SELECT DISTINCT id FROM profiles WHERE role = 'admin') AS admins
  ));

-- 用户插入申领
CREATE POLICY "Authenticated users can insert requisitions"
  ON requisitions
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- 管理员更新申领
CREATE POLICY "Admins can update requisitions"
  ON requisitions
  FOR UPDATE
  USING (auth.uid() IN (
    SELECT id FROM (SELECT DISTINCT id FROM profiles WHERE role = 'admin') AS admins
  ));

-- =====================================================
-- approvals 表 RLS 策略修复
-- =====================================================

DROP POLICY IF EXISTS "Users can view approvals for own requisitions" ON approvals;
DROP POLICY IF EXISTS "Admins can view all approvals" ON approvals;
DROP POLICY IF EXISTS "Admins can insert approvals" ON approvals;

-- 用户查看与自己的申领相关的审批
CREATE POLICY "Users can view approvals for own requisitions"
  ON approvals
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM requisitions
      WHERE requisitions.id = approvals.requisition_id
      AND requisitions.user_id = auth.uid()
    )
  );

-- 管理员查看所有审批
CREATE POLICY "Admins can view all approvals"
  ON approvals
  FOR SELECT
  USING (auth.uid() IN (
    SELECT id FROM (SELECT DISTINCT id FROM profiles WHERE role = 'admin') AS admins
  ));

-- 管理员插入审批
CREATE POLICY "Admins can insert approvals"
  ON approvals
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND approver_id = auth.uid()
    AND auth.uid() IN (
      SELECT id FROM (SELECT DISTINCT id FROM profiles WHERE role = 'admin') AS admins
    )
  );

-- =====================================================
-- inventory_logs 表 RLS 策略修复
-- =====================================================

DROP POLICY IF EXISTS "Authenticated users can view inventory logs" ON inventory_logs;
DROP POLICY IF EXISTS "Admins can insert inventory logs" ON inventory_logs;

-- 所有认证用户查看库存流水
CREATE POLICY "Authenticated users can view inventory logs"
  ON inventory_logs
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- 管理员插入库存流水
CREATE POLICY "Admins can insert inventory logs"
  ON inventory_logs
  FOR INSERT
  WITH CHECK (auth.uid() IN (
    SELECT id FROM (SELECT DISTINCT id FROM profiles WHERE role = 'admin') AS admins
  ));

-- =====================================================
-- 修复完成!
-- =====================================================
