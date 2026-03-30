# 首次登录密码修改问题排查指南

## 问题现象
用户首次登录后，没有弹出修改密码的窗口。

## 可能原因

### 1. 数据库字段不存在
检查 `profiles.is_first_login` 字段是否存在。

**检查方法**：
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name = 'is_first_login';
```

**解决方案**：
```sql
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_first_login BOOLEAN DEFAULT false;

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS password_updated_at TIMESTAMPTZ;
```

### 2. 用户没有设置 is_first_login = true
批量注册的用户可能没有正确设置该字段。

**检查方法**：
```sql
SELECT id, email, full_name, is_first_login, created_at
FROM profiles 
WHERE email = '用户的邮箱地址';
```

**解决方案**：
```sql
UPDATE profiles 
SET is_first_login = true 
WHERE email = '用户的邮箱地址';
```

### 3. 批量注册时字段未正确插入
检查批量注册代码是否包含 `is_first_login: true`。

**确认代码**：在 `AdminBatchRegister.tsx` 中应该看到：
```typescript
const { error: profileError } = await supabase
  .from('profiles')
  .insert({
    id: authData.user.id,
    email: user.email,
    username: user.email.split('@')[0],
    full_name: user.full_name,
    role: user.role || 'employee',
    department: user.department,
    employee_id: user.employee_id,
    phone: user.phone,
    is_first_login: true, // <-- 确认这一行存在
    created_at: new Date().toISOString()
  });
```

### 4. 登录检查逻辑问题
确认登录后正确检查了 `is_first_login` 字段。

**确认代码**：在 `LoginPage.tsx` 中应该看到：
```typescript
// 检查是否需要首次登录修改密码
const { data: { user } } = await supabase.auth.getUser();
if (user) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_first_login')
    .eq('id', user.id)
    .single();

  if (profile?.is_first_login) {
    setShowFirstLoginModal(true);
  } else {
    navigate('/');
  }
}
```

### 5. 浏览器缓存问题
可能缓存了旧代码，没有加载最新的修改。

**解决方案**：
1. 清除浏览器缓存（Ctrl+Shift+Delete）
2. 强制刷新页面（Ctrl+F5）
3. 重启 Vite 开发服务器

## 完整排查步骤

### 步骤 1：检查数据库字段
在Supabase SQL Editor中执行：
```sql
-- 检查字段是否存在
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name = 'is_first_login';

-- 如果不存在，创建它
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_first_login BOOLEAN DEFAULT false;
```

### 步骤 2：检查用户数据
```sql
-- 检查特定用户
SELECT id, email, full_name, is_first_login, created_at
FROM profiles 
WHERE email = 'test@example.com';

-- 统计所有需要重置密码的用户
SELECT COUNT(*) as count 
FROM profiles 
WHERE is_first_login = true;
```

### 步骤 3：手动更新用户（如果需要）
```sql
-- 为特定用户设置首次登录标记
UPDATE profiles 
SET is_first_login = true 
WHERE email = 'test@example.com';

-- 为所有非管理员用户设置
UPDATE profiles 
SET is_first_login = true 
WHERE role != 'admin' AND is_first_login IS NULL;
```

### 步骤 4：重启服务
```bash
# 停止当前服务器（按 Ctrl+C）

# 清除Vite缓存
rm -rf node_modules/.vite

# 重新启动
npm run dev
```

### 步骤 5：清除浏览器缓存
1. 打开开发者工具（F12）
2. 右键点击刷新按钮 → "清空缓存并硬性重新加载"
3. 或者按 Ctrl+Shift+Delete 清除所有缓存

### 步骤 6：测试登录
1. 使用测试账号登录
2. 打开浏览器控制台（F12）
3. 查看Console中是否有错误信息
4. 查看Network中是否有失败的请求

## 验证成功

如果配置正确，用户登录后应该：
1. 成功登录
2. 自动弹出密码修改窗口
3. 显示提示信息："为了您的账号安全，请修改默认密码"
4. 必须修改密码后才能进入系统

## 常见问题

### Q: 为什么只有批量注册的用户才需要修改密码？
A: 因为批量注册时设置了 `is_first_login: true`，而手动注册的用户这个字段默认为false。

### Q: 如何取消首次登录限制？
A: 将用户的 `is_first_login` 字段更新为 false：
```sql
UPDATE profiles 
SET is_first_login = false 
WHERE email = 'user@example.com';
```

### Q: 管理员也需要修改密码吗？
A: 不需要。代码中排除了管理员（role != 'admin'）。

### Q: 用户跳过弹窗怎么办？
A: 在弹窗的关闭按钮上会执行 `supabase.auth.signOut()`，强制用户退出登录。

## 技术支持

如果以上步骤都无法解决问题，请提供：
1. 浏览器控制台的错误截图
2. Supabase中profiles表的结构截图
3. 登录时的Network请求记录
4. 相关代码文件的内容