-- =====================================================
-- 添加用户名支持
-- =====================================================
-- 此脚本为现有系统添加用户名字段
-- =====================================================

-- 1. 在 profiles 表中添加 username 字段
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- 创建索引优化查询
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username) 
WHERE username IS NOT NULL;

-- 2. 创建函数: 通过用户名查找邮箱
CREATE OR REPLACE FUNCTION public.get_email_by_username(username_input TEXT)
RETURNS TEXT AS $$
DECLARE
  user_email TEXT;
BEGIN
  SELECT email INTO user_email
  FROM profiles
  WHERE username = username_input
  LIMIT 1;
  
  RETURN user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. 更新 handle_new_user 函数,支持用户名
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::text, 'employee'),
    COALESCE(NEW.raw_user_meta_data->>'username', NULL)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 为现有用户生成默认用户名(基于邮箱前缀)
DO $$
BEGIN
  UPDATE profiles 
  SET username = LOWER(SPLIT_PART(email, '@', 1))
  WHERE username IS NULL 
  AND email IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM profiles p2 
    WHERE p2.username = LOWER(SPLIT_PART(profiles.email, '@', 1))
    AND p2.id != profiles.id
  );
END $$;

-- 5. 处理重复的用户名
DO $$
DECLARE
  dup_record RECORD;
  suffix INT := 1;
BEGIN
  FOR dup_record IN
    SELECT email, COUNT(*) as cnt
    FROM profiles
    WHERE username = LOWER(SPLIT_PART(email, '@', 1))
    GROUP BY email
    HAVING COUNT(*) > 1
  LOOP
    UPDATE profiles
    SET username = LOWER(SPLIT_PART(email, '@', 1)) || suffix
    WHERE email = dup_record.email
    AND username = LOWER(SPLIT_PART(email, '@', 1));
    suffix := suffix + 1;
  END LOOP;
END $$;

-- =====================================================
-- 完成!
-- 现在系统支持用户名登录
-- =====================================================
