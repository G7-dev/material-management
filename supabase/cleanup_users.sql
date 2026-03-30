-- =============================================
-- 清除除管理员以外的所有账号
-- 运行前请确保已备份重要数据
-- 警告：此操作不可逆，请谨慎执行
-- =============================================

-- 1. 首先，确定管理员账号的ID
-- 请修改下面的条件来指定哪些账号是管理员账号（保留的账号）
-- 例如：保留邮箱为 admin@company.com 或用户名为 admin 的账号

-- 方法1：按邮箱保留（推荐）
-- DELETE FROM auth.users 
-- WHERE email NOT IN ('admin@company.com');

-- 方法2：按角色保留（如果profiles表中有角色信息）
-- DELETE FROM auth.users u
-- WHERE u.id NOT IN (
--   SELECT id FROM profiles WHERE role = 'admin'
-- );

-- 方法3：先查询要删除的账号，确认无误后再执行删除
-- 先运行这部分查看将要删除的账号
DO $$
BEGIN
  RAISE NOTICE '以下账号将被删除（非管理员账号）：';
END $$;

SELECT 
  u.id,
  u.email,
  p.full_name,
  p.role,
  p.created_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email NOT IN ('admin@company.com')  -- 修改这里的邮箱为实际的管理员邮箱
   OR p.role != 'admin';  -- 或者使用角色判断

-- 确认无误后，执行以下删除操作：

-- 2. 清除profiles表（用户资料）
DELETE FROM profiles 
WHERE id NOT IN (
  SELECT id FROM auth.users WHERE email IN ('admin@company.com')  -- 保留管理员
);

-- 3. 清除auth.users表（认证用户）
-- 注意：这是Supabase Auth的用户表，删除后无法恢复
DELETE FROM auth.users 
WHERE email NOT IN ('admin@company.com');  -- 保留管理员账号

-- 4. 重置相关序列
ALTER SEQUENCE profiles_id_seq RESTART WITH 1;

-- 5. 确认清除完成
DO $$
BEGIN
  RAISE NOTICE '用户清除操作完成！';
  RAISE NOTICE '剩余用户数量：%' , (SELECT COUNT(*) FROM auth.users);
  RAISE NOTICE '剩余资料数量：%' , (SELECT COUNT(*) FROM profiles);
END $$;

SELECT 
  '清理完成' as message,
  (SELECT COUNT(*) FROM auth.users) as remaining_users,
  (SELECT COUNT(*) FROM profiles) as remaining_profiles;
