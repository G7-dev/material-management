-- =====================================================
-- 邮件模板配置 - 用于密码重置和用户通知
-- =====================================================

-- 在 Supabase 项目设置中配置邮件模板
-- 路径：Authentication -> Email Templates

-- 1. 密码重置邮件模板
-- 主题：重置您的物资管理系统密码
-- 内容：
<!--
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
-->

-- 2. 用户邀请邮件模板（批量注册时使用）
-- 主题：您已被添加到物资管理系统
-- 内容：
<!--
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>账号创建通知</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .content { padding: 30px; }
    .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
    .info { background: #e8f4fd; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>物资管理系统</h1>
    </div>
    <div class="content">
      <h2>账号创建通知</h2>
      <p>尊敬的 {{ .User.full_name }}，</p>
      <p>管理员已为您在物资管理系统中创建了账号。</p>
      
      <div class="info">
        <strong>登录信息：</strong><br>
        邮箱：{{ .User.email }}<br>
        默认密码：jyyl123456
      </div>
      
      <p>请登录后及时修改密码，以确保账号安全。</p>
      
      <div style="text-align: center;">
        <a href="{{ .SiteURL }}/login" class="button">立即登录</a>
      </div>
      
      <p>如非本人操作，请联系系统管理员。</p>
    </div>
    <div class="footer">
      <p>© 2024 物资管理系统 | 系统自动发送，请勿回复</p>
    </div>
  </div>
</body>
</html>
-->

-- =====================================================
-- SMTP 配置（在 Supabase 项目设置中配置）
-- =====================================================
-- 路径：Project Settings -> SMTP Settings

-- 配置项：
-- SMTP Host: smtp.gmail.com (或其他SMTP服务商)
-- SMTP Port: 587 (TLS) 或 465 (SSL)
-- SMTP User: 您的邮箱地址
-- SMTP Pass: 您的邮箱密码或应用专用密码
-- Sender Email: 发送邮件的邮箱地址
-- Sender Name: 物资管理系统

-- =====================================================
-- 在 profiles 表中添加 is_first_login 列
-- =====================================================
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_first_login BOOLEAN DEFAULT false;

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS password_updated_at TIMESTAMPTZ;

-- 更新现有用户（批量注册的用户）
UPDATE profiles 
SET is_first_login = true 
WHERE created_at > '2024-01-01';

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_profiles_is_first_login ON profiles(is_first_login);

-- =====================================================
-- 验证配置
-- =====================================================
SELECT '邮件模板配置完成！' as status;
SELECT '请确保在Supabase项目设置中配置了SMTP' as reminder;
SELECT '首次登录的用户需要修改默认密码' as feature;