# 批量注册和密码管理功能配置指南

## 功能概述

已完成以下功能模块：

### 1. ✅ 批量用户注册
- **路径**：管理员菜单 -> 批量注册
- **功能**：上传Excel文件批量创建用户账号
- **支持格式**：.xlsx, .xls, .csv
- **必填列**：姓名、邮箱
- **选填列**：部门、工号、电话、角色
- **默认密码**：jyyl123456

### 2. ✅ 取消注册账号
- **位置**：批量注册页面，每个用户右侧有删除按钮
- **功能**：删除已注册但未激活的用户账号

### 3. ✅ 首次登录强制修改密码
- **触发条件**：用户在profiles表中的is_first_login=true
- **弹窗提示**：登录后自动弹出密码修改窗口
- **密码要求**：至少8位，包含大小写字母和数字

### 4. ✅ 忘记密码功能
- **访问路径**：登录页面 -> 忘记密码？
- **流程**：
  1. 输入注册邮箱
  2. 接收重置密码邮件
  3. 点击邮件链接
  4. 设置新密码

## 配置步骤

### 第一步：安装依赖

在终端中执行：

```bash
cd "c:\Users\85149\Desktop\新建文件夹"
npm install xlsx @supabase/auth-helpers-react
```

### 第二步：配置Supabase邮件模板

1. 登录Supabase控制台
2. 进入 Authentication -> Email Templates
3. 配置以下模板：

#### 密码重置邮件模板

**主题**：重置您的物资管理系统密码

**HTML内容**：
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>重置密码</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .content { padding: 30px; }
    .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>物资管理系统</h1>
    </div>
    <div class="content">
      <h2>重置密码</h2>
      <p>您好，</p>
      <p>您收到了这封邮件，是因为您在物资管理系统中申请了密码重置。</p>
      <p>请点击下面的链接重置您的密码：</p>
      <div style="text-align: center;">
        <a href="{{ .ConfirmationURL }}" class="button">重置密码</a>
      </div>
      <p>如果这不是您本人的操作，请忽略此邮件。</p>
      <p>此链接将在24小时后失效。</p>
    </div>
    <div class="footer">
      <p>© 2024 物资管理系统 | 系统自动发送，请勿回复</p>
    </div>
  </div>
</body>
</html>
```

### 第三步：配置SMTP（重要）

在Supabase项目设置中配置SMTP：

**路径**：Project Settings -> SMTP Settings

**配置项**：
- SMTP Host: smtp.gmail.com 或您的邮件服务商
- SMTP Port: 587 (推荐) 或 465
- SMTP User: 您的邮箱地址
- SMTP Pass: 您的邮箱密码或应用专用密码
- Sender Email: noreply@yourdomain.com
- Sender Name: 物资管理系统

**示例（Gmail）**：
```
SMTP Host: smtp.gmail.com
SMTP Port: 587
SMTP User: your-email@gmail.com
SMTP Pass: your-app-password
Sender Email: noreply@yourdomain.com
Sender Name: 物资管理系统
```

### 第四步：执行数据库迁移

在Supabase SQL Editor中执行：

```sql
-- 添加首次登录标记
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_first_login BOOLEAN DEFAULT false;

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS password_updated_at TIMESTAMPTZ;

-- 为批量注册的用户设置首次登录标记
UPDATE profiles 
SET is_first_login = true, role = 'employee'
WHERE created_at > '2024-01-01' AND is_first_login IS NULL;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_profiles_is_first_login ON profiles(is_first_login);
```

### 第五步：Excel文件格式准备

创建Excel文件（.xlsx），格式如下：

| 姓名 | 邮箱 | 部门 | 工号 | 电话 | 角色 |
|------|------|------|------|------|------|
| 张三 | zhangsan@company.com | 技术部 | 1001 | 13800138000 | employee |
| 李四 | lisi@company.com | 市场部 | 1002 | 13900139000 | employee |

**注意**：
- 姓名和邮箱是必填项
- 角色可以是：employee（普通员工）或 admin（管理员）
- 默认密码统一为：jyyl123456

## 使用说明

### 批量注册用户

1. 使用管理员账号登录系统
2. 点击侧边栏的「批量注册」菜单
3. 上传准备好的Excel文件
4. 系统将自动创建用户账号并发送通知邮件

### 首次登录流程

1. 用户使用邮箱和默认密码（jyyl123456）登录
2. 系统自动弹出密码修改窗口
3. 用户按要求设置新密码
4. 密码修改成功后自动进入系统

### 忘记密码流程

1. 在登录页面点击「忘记密码？」
2. 输入注册邮箱地址
3. 查收密码重置邮件
4. 点击邮件中的重置链接
5. 设置新密码
6. 使用新密码登录

### 取消注册账号

1. 在批量注册页面查看待注册用户列表
2. 点击用户右侧的删除按钮
3. 确认删除操作
4. 账号将被永久删除

## 安全注意事项

1. **密码强度**：强制要求8位以上，包含大小写字母和数字
2. **首次登录**：必须修改默认密码才能使用系统
3. **邮件安全**：确保SMTP配置安全，避免密码泄露
4. **数据备份**：批量操作前建议备份用户数据
5. **权限控制**：只有管理员可以访问批量注册功能

## 故障排查

### 问题：邮件发送失败
- **检查**：SMTP配置是否正确
- **检查**：邮箱密码/应用专用密码是否有效
- **检查**：网络连接是否正常

### 问题：用户无法重置密码
- **检查**：邮箱地址是否正确
- **检查**：邮件是否被拦截到垃圾邮件箱
- **检查**：重置链接是否已过期（24小时有效）

### 问题：首次登录弹窗不显示
- **检查**：profiles表中is_first_login字段是否为true
- **检查**：用户是否已成功登录
- **检查**：浏览器是否禁用了弹窗

## 技术实现说明

### 批量注册核心逻辑
- 使用 `xlsx` 库解析Excel文件
- 使用 `supabase.auth.signUp()` 创建认证用户
- 使用 `supabase.from('profiles').insert()` 创建用户资料
- 使用 `supabase.auth.admin.deleteUser()` 删除用户

### 首次登录检测
- 登录后查询profiles表的is_first_login字段
- 如果为true，显示密码修改弹窗
- 修改成功后更新is_first_login为false

### 密码重置流程
- 使用 `supabase.auth.resetPasswordForEmail()` 发送重置邮件
- 使用 `supabase.auth.updateUser()` 更新密码
- 使用 `supabase.auth.onAuthStateChange()` 监听密码重置状态

## 后续优化建议

1. 添加批量导入进度条
2. 支持Excel数据验证和错误提示
3. 添加邮件发送日志
4. 支持用户状态管理（启用/禁用）
5. 添加密码强度实时检测
6. 支持双因素认证（2FA）

---

配置完成后，请重启开发服务器并测试所有功能。

如有问题，请检查：
1. Supabase SMTP配置
2. 邮箱服务商设置
3. 数据库字段是否正确添加
4. 浏览器控制台错误信息