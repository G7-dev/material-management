-- =====================================================
-- 修复批量注册功能
-- 问题1: profiles 表缺少 INSERT 策略，导致无法插入用户资料
-- 问题2: profiles 表缺少 username, employee_id, phone, is_first_login, password_updated_at 等字段
-- =====================================================

-- 1. 添加缺失的列
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS username TEXT,
  ADD COLUMN IF NOT EXISTS employee_id TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS is_first_login BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS password_updated_at TIMESTAMPTZ;

-- 2. 确保 RLS 已启用
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 3. 删除旧的 INSERT 策略（如果存在）
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON profiles;

-- 4. 创建 INSERT 策略 - 允许认证用户插入自己的 profile（signUp 触发器也会用）
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 5. 创建 INSERT 策略 - 允许管理员为其他用户插入 profile
CREATE POLICY "Admins can insert profiles"
  ON profiles
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 6. 确保 DELETE 策略也存在（取消注册功能需要）
DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;

CREATE POLICY "Admins can delete profiles"
  ON profiles
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 7. 为 username 创建唯一索引
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_key ON profiles(username) WHERE username IS NOT NULL;

-- =====================================================
-- 验证
-- =====================================================
SELECT '✅ 批量注册修复完成！' as status;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;
