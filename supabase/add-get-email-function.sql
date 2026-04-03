-- =====================================================
-- 创建通过用户名获取邮箱的 RPC 函数
-- =====================================================
-- 执行说明:
-- 1. 在 Supabase 项目中,进入 SQL Editor
-- 2. 复制并执行此脚本
-- 3. 刷新登录页面后重试
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_email_by_username(username_input TEXT)
RETURNS TEXT AS $$
DECLARE
  user_email TEXT;
BEGIN
  -- 优先按 username 精确匹配，再按 full_name 匹配
  SELECT email INTO user_email
  FROM public.profiles
  WHERE username = username_input
  LIMIT 1;
  
  -- 如果 username 没找到，尝试按 full_name（姓名）匹配
  IF user_email IS NULL THEN
    SELECT email INTO user_email
    FROM public.profiles
    WHERE full_name = username_input
    LIMIT 1;
  END IF;
  
  RETURN user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 验证函数是否创建成功
-- =====================================================
-- 测试查询（可选）:
-- SELECT public.get_email_by_username('admin');

-- =====================================================
-- 执行完成提示
-- =====================================================
SELECT '✅ get_email_by_username 函数创建成功！' as status;
SELECT '✅ 现在可以使用用户名登录了！' as next_step;
