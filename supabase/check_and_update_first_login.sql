-- =====================================================
-- 检查和更新 is_first_login 字段
-- =====================================================

-- 1. 检查 is_first_login 列是否存在
SELECT 
    column_name, 
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name = 'is_first_login';

-- 2. 如果列不存在，创建它
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_first_login BOOLEAN DEFAULT false;

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS password_updated_at TIMESTAMPTZ;

-- 3. 为所有现有用户设置 is_first_login = true（除了管理员）
UPDATE profiles 
SET is_first_login = true 
WHERE is_first_login IS NULL 
  AND role != 'admin'
  AND created_at < NOW();

-- 4. 验证更新结果
SELECT 
    id,
    email,
    full_name,
    role,
    is_first_login,
    created_at
FROM profiles 
WHERE is_first_login = true
ORDER BY created_at DESC
LIMIT 20;

-- 5. 统计需要首次登录的用户数量
SELECT 
    COUNT(*) as users_needing_password_reset
FROM profiles 
WHERE is_first_login = true;

-- =====================================================
-- 执行结果提示
-- =====================================================
SELECT '✅ is_first_login 字段检查和更新完成！' as status;
SELECT '✅ 需要重置密码的用户数量: ' || (SELECT COUNT(*) FROM profiles WHERE is_first_login = true) as user_count;
SELECT '✅ 用户下次登录时将提示修改密码' as message;