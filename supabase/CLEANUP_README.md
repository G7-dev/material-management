# 最终上线前清理操作指南

## 清理脚本说明

本目录包含三个SQL清理脚本，用于系统上线前的最终准备工作。

### 1. cleanup_records.sql
**功能**：清除所有领用记录和审批记录

- 清除 `requisitions` 表中的所有申购记录
- 重置相关序列
- 清除后无法恢复，请确保已备份重要数据

### 2. cleanup_users.sql
**功能**：清除除管理员以外的所有用户账号

- 清除 `profiles` 表中的非管理员用户资料
- 清除 `auth.users` 表中的非管理员认证账号
- 重置相关序列
- ⚠️ **警告**：用户删除后无法恢复

### 3. final_cleanup_before_launch.sql
**功能**：完整的上线前清理脚本（推荐）

- 包含以上两个脚本的全部功能
- 增加清理结果验证
- 系统状态检查
- 在一个事务中执行所有操作

## 使用方法

### 步骤1：修改管理员邮箱列表

在 `final_cleanup_before_launch.sql` 或 `cleanup_users.sql` 中，修改管理员邮箱列表：

```sql
WITH admin_emails AS (
  SELECT * FROM (VALUES 
    ('admin@company.com'),  -- 主要管理员
    ('admin2@company.com')  -- 次要管理员（如需要）
  ) AS t(email)
)
```

**注意**：请确保至少保留一个管理员账号，否则系统将无法登录和管理！

### 步骤2：在Supabase中执行SQL

1. 登录 Supabase 控制台
2. 进入 "SQL Editor"
3. 打开 `final_cleanup_before_launch.sql` 文件
4. 点击 "Run" 执行脚本

### 步骤3：验证清理结果

执行脚本后，查看输出结果：

- 检查剩余用户列表（应为管理员账号）
- 确认领用记录数量为 0
- 检查系统状态警告（如有）

## 注意事项

### ⚠️ 重要警告

1. **数据不可恢复**：清理操作不可逆，执行前请确保：
   - 已完成所有测试
   - 已备份需要保留的数据
   - 已确认管理员邮箱列表正确

2. **至少保留一个管理员**：如果清除了所有管理员账号，需要手动在数据库中创建新的管理员。

3. **生产环境谨慎操作**：建议先在测试环境验证脚本效果。

### 建议的执行顺序

```bash
# 1. 清除领用记录
psql -f cleanup_records.sql

# 2. 清除非管理员账号
psql -f cleanup_users.sql

# 或者一次性执行所有清理（推荐）
psql -f final_cleanup_before_launch.sql
```

## 清理后检查清单

清理完成后，请确认：

- [ ] 系统可以正常登录（使用管理员账号）
- [ ] 所有测试数据已清除
- [ ] 只有管理员账号存在
- [ ] 系统功能正常运行
- [ ] 审批流程可以正常发起和处理
- [ ] 库存数据已重置或符合预期

## 问题处理

### 如果误删了管理员账号

如果清除了所有管理员账号，需要通过Supabase控制台手动创建：

```sql
-- 创建新的管理员账号
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at)
VALUES ('admin@company.com', '加密后的密码', NOW());

-- 创建对应的profiles记录
INSERT INTO profiles (id, email, full_name, role)
VALUES 
  ((SELECT id FROM auth.users WHERE email = 'admin@company.com'), 
   'admin@company.com', 
   '系统管理员', 
   'admin');
```

### 如果需要保留部分测试账号

修改 `admin_emails` 部分的SQL，将需要保留的账号添加到排除列表：

```sql
WHERE u.email NOT IN (
  'admin@company.com',
  'testuser1@company.com',  -- 保留的测试账号
  'testuser2@company.com'   -- 保留的测试账号
)
```

## 联系支持

如果在清理过程中遇到问题，请联系技术团队获取支持。
