-- =============================================
-- 最终上线前清理脚本
-- 执行顺序：
-- 1. 清除测试数据（领用记录、审批记录）
-- 2. 清除测试账号（保留管理员）
-- 3. 重置序列
-- 4. 验证清理结果
-- =============================================

BEGIN;

-- ===================================================================
-- 阶段1：清除所有领用记录和审批记录
-- ===================================================================

RAISE NOTICE '=================================';
RAISE NOTICE '阶段1：清除领用和审批记录';
RAISE NOTICE '=================================';

-- 清除申购记录
DELETE FROM requisitions;
ALTER SEQUENCE requisitions_id_seq RESTART WITH 1;

-- 如果还有其他审批记录表，也在这里清除
-- DELETE FROM approval_records;
-- ALTER SEQUENCE approval_records_id_seq RESTART WITH 1;

SELECT 
  '领用记录清除完成' as message, 
  COUNT(*) as remaining_records 
FROM requisitions;


-- ===================================================================
-- 阶段2：清除除管理员以外的所有账号
-- ===================================================================

RAISE NOTICE '';
RAISE NOTICE '=================================';
RAISE NOTICE '阶段2：清除非管理员账号';
RAISE NOTICE '=================================';

-- 请先修改下面的管理员邮箱列表，添加所有需要保留的管理员账号
-- 可以保留多个管理员账号
WITH admin_emails AS (
  SELECT * FROM (VALUES 
    ('admin@company.com'),  -- 主要管理员
    ('admin2@company.com')  -- 次要管理员（如需要）
  ) AS t(email)
),
deleted_profiles AS (
  DELETE FROM profiles 
  WHERE id NOT IN (
    SELECT id FROM auth.users WHERE email IN (SELECT email FROM admin_emails)
  )
  RETURNING id
),
deleted_users AS (
  DELETE FROM auth.users 
  WHERE email NOT IN (SELECT email FROM admin_emails)
  RETURNING id
)
SELECT 
  '账号清除完成' as message,
  (SELECT COUNT(*) FROM deleted_profiles) as deleted_profiles_count,
  (SELECT COUNT(*) FROM deleted_users) as deleted_users_count;

-- 重置序列
ALTER SEQUENCE profiles_id_seq RESTART WITH 1;


-- ===================================================================
-- 阶段3：验证清理结果
-- ===================================================================

RAISE NOTICE '';
RAISE NOTICE '=================================';
RAISE NOTICE '阶段3：验证清理结果';
RAISE NOTICE '=================================';

-- 检查剩余用户
RAISE NOTICE '剩余用户列表：';
SELECT 
  u.id,
  u.email,
  p.full_name,
  p.role,
  p.created_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
ORDER BY u.email;

-- 统计信息
SELECT 
  '清理完成' as status,
  (SELECT COUNT(*) FROM auth.users) as total_users,
  (SELECT COUNT(*) FROM profiles) as total_profiles,
  (SELECT COUNT(*) FROM requisitions) as total_requisitions;


-- ===================================================================
-- 阶段4：系统状态检查
-- ===================================================================

RAISE NOTICE '';
RAISE NOTICE '=================================';
RAISE NOTICE '阶段4：系统状态检查';
RAISE NOTICE '=================================';

-- 检查系统是否准备好上线
DO $$
DECLARE
  user_count INTEGER;
  record_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count FROM auth.users;
  SELECT COUNT(*) INTO record_count FROM requisitions;
  
  IF user_count = 0 THEN
    RAISE WARNING '警告：系统中没有管理员账号！';
    RAISE WARNING '请先创建至少一个管理员账号再上线！';
  ELSIF user_count > 5 THEN
    RAISE WARNING '警告：系统中保留了 % 个用户账号，请确认是否都需要保留', user_count;
  ELSE
    RAISE NOTICE '✓ 用户账号数量正常（% 个）', user_count;
  END IF;
  
  IF record_count > 0 THEN
    RAISE WARNING '警告：系统中仍有 % 条领用记录！', record_count;
  ELSE
    RAISE NOTICE '✓ 领用记录已清空';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '系统准备状态检查完成！';
  RAISE NOTICE '如果以上检查都通过，系统可以上线使用。';
END $$;

COMMIT;
