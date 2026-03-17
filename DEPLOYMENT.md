# 部署指南

本文档详细说明如何将物资领用管理系统部署到生产环境。

## 目录

1. [环境准备](#环境准备)
2. [Supabase 配置](#supabase-配置)
3. [本地开发](#本地开发)
4. [Vercel 部署](#vercel-部署)
5. [部署后验证](#部署后验证)

## 环境准备

### 必需工具

- Node.js 18+ 
- npm 或 yarn
- Git
- Supabase 账号
- Vercel 账号

### 检查 Node.js 版本

```bash
node --version  # 应该是 v18.0.0 或更高
```

## Supabase 配置

### 1. 创建 Supabase 项目

1. 访问 [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. 点击 "New Project"
3. 填写项目信息:
   - **Name**: material-management-system
   - **Database Password**: 设置一个强密码(请妥善保存)
   - **Region**: 选择离你最近的区域
4. 点击 "Create new project"
5. 等待项目创建完成(通常需要 1-2 分钟)

### 2. 初始化数据库

1. 在 Supabase Dashboard 中,进入 **SQL Editor**
2. 点击 "New query"
3. 复制项目根目录下 `supabase/init.sql` 文件的全部内容
4. 粘贴到 SQL Editor 中
5. 点击 "Run" 执行脚本
6. 确认看到 "数据库初始化脚本执行完成!" 的提示

### 3. 获取项目凭据

1. 在 Supabase Dashboard 中,进入 **Settings** → **API**
2. 复制以下信息:
   - **Project URL**: `https://xxxxxxxxxxxx.supabase.co`
   - **anon/public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 4. 创建管理员账户

#### 方法 A: 通过 Supabase UI 创建

1. 在 Supabase Dashboard 中,进入 **Authentication** → **Users**
2. 点击 "Add user" → "Create new user"
3. 填写用户信息:
   - **Email**: admin@company.com
   - **Password**: 设置密码
   - **Auto Confirm User**: 勾选
4. 点击 "Create user"
5. 记下自动生成的 **User ID**

6. 在 SQL Editor 中执行以下命令,将用户设为管理员:

```sql
-- 替换 <user-id> 为上面的 User ID
UPDATE profiles
SET role = 'admin'
WHERE id = '<user-id>';
```

#### 方法 B: 直接插入管理员记录

在 SQL Editor 中执行:

```sql
-- 先通过 Auth 创建用户,然后手动插入 profile
-- 或者直接创建(假设已经通过 Auth 创建了用户)
INSERT INTO profiles (id, email, full_name, role)
VALUES ('your-user-id-here', 'admin@company.com', '系统管理员', 'admin');
```

### 5. 配置数据库策略验证

在 SQL Editor 中执行以下查询验证 RLS 策略:

```sql
-- 检查 profiles 表的 RLS
SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- 检查 materials 表的 RLS
SELECT * FROM pg_policies WHERE tablename = 'materials';

-- 检查 requisitions 表的 RLS
SELECT * FROM pg_policies WHERE tablename = 'requisitions';
```

## 本地开发

### 1. 安装依赖

```bash
# 进入项目目录
cd material-management-system

# 安装依赖
npm install
```

### 2. 配置环境变量

1. 复制环境变量示例文件:

```bash
cp .env.example .env
```

2. 编辑 `.env` 文件:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

### 4. 测试功能

1. **注册普通用户**:
   - 访问 `/login`
   - 点击 "注册" 标签
   - 填写信息并注册

2. **登录管理员**:
   - 使用之前创建的管理员账户登录
   - 验证可以访问所有管理功能

3. **测试物资申领流程**:
   - 用普通用户登录
   - 浏览物资列表
   - 提交申领申请
   - 用管理员账户审批

## Vercel 部署

### 方法一: 通过 Vercel CLI (推荐)

#### 1. 安装 Vercel CLI

```bash
npm i -g vercel
```

#### 2. 登录 Vercel

```bash
vercel login
```

按照提示完成登录。

#### 3. 部署项目

```bash
# 在项目根目录执行
vercel
```

按照提示操作:
- **Set up and deploy** → 选择 "Continue"
- **Scope** → 选择你的团队/个人账号
- **Link to existing project** → 选择 "No"
- **Project name** → 输入项目名称
- **Build settings** → 使用默认设置

#### 4. 添加环境变量

在 Vercel Dashboard 中:

1. 进入项目 → **Settings** → **Environment Variables**
2. 添加以下变量:

   | Key | Value | Environment |
   |-----|-------|-------------|
   | VITE_SUPABASE_URL | `你的 Supabase URL` | Production, Preview, Development |
   | VITE_SUPABASE_ANON_KEY | `你的 Supabase anon key` | Production, Preview, Development |

3. 点击 "Save"

#### 5. 重新部署

环境变量添加后,需要重新部署:

```bash
vercel --prod
```

或者进入 Vercel Dashboard → **Deployments** → 点击最新部署右侧的 "..." → **Redeploy**

### 方法二: 通过 Git 仓库

#### 1. 推送代码到 GitHub

```bash
# 初始化 Git 仓库
git init
git add .
git commit -m "Initial commit"

# 推送到 GitHub
git branch -M main
git remote add origin https://github.com/your-username/material-management-system.git
git push -u origin main
```

#### 2. 在 Vercel 导入项目

1. 访问 [https://vercel.com/dashboard](https://vercel.com/dashboard)
2. 点击 "Add New" → "Project"
3. 导入你的 GitHub 仓库
4. 配置项目:
   - **Framework Preset**: Vite
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

5. 添加环境变量(同方法一的步骤 4)

6. 点击 "Deploy"

#### 3. 配置自定义域名(可选)

1. 进入 Vercel Dashboard → **Settings** → **Domains**
2. 添加你的域名,如 `materials.yourcompany.com`
3. 按照提示配置 DNS 记录

## 部署后验证

### 1. 检查部署状态

访问 Vercel Dashboard,确认部署状态为 "Ready"。

### 2. 测试应用功能

#### 基本功能测试

- [ ] 访问部署的 URL
- [ ] 注册新用户
- [ ] 用户登录
- [ ] 查看物资列表
- [ ] 提交物资申领
- [ ] 查看申领记录

#### 管理员功能测试

- [ ] 管理员登录
- [ ] 查看待审批列表
- [ ] 审批申领(通过/驳回)
- [ ] 添加新物资
- [ ] 补货操作
- [ ] 查看用户列表

### 3. 检查浏览器控制台

打开浏览器开发者工具,检查是否有错误:

- **Console**: 不应该有 JavaScript 错误
- **Network**: 检查 API 请求是否成功
- **Application**: 确认用户 token 正常保存

### 4. 测试响应式设计

- 在不同设备尺寸下测试:
  - 桌面 (1920x1080)
  - 平板 (768x1024)
  - 手机 (375x667)

## 常见部署问题

### 问题 1: 环境变量未生效

**症状**: 应用显示 "请配置 Supabase 环境变量"

**解决**:
1. 确认在 Vercel 中正确添加了环境变量
2. 重新部署项目
3. 清除浏览器缓存

### 问题 2: Supabase 连接失败

**症状**: API 请求返回 401 或 500 错误

**解决**:
1. 检查 Supabase URL 是否正确
2. 确认 anon key 未过期
3. 在 Supabase Dashboard 检查 API 限额

### 问题 3: RLS 策略导致权限错误

**症状**: 用户无法查看数据或提交表单

**解决**:
1. 在 SQL Editor 中检查 RLS 策略:
   ```sql
   SELECT * FROM pg_policies;
   ```
2. 确认策略正确配置
3. 检查用户角色是否正确

### 问题 4: 构建失败

**症状**: Vercel 部署时构建失败

**解决**:
1. 检查 Vercel Dashboard 中的构建日志
2. 确认 `package.json` 中的脚本正确
3. 检查 TypeScript 类型错误

## 监控与维护

### 1. 日志查看

- **Vercel**: Dashboard → **Logs**
- **Supabase**: Dashboard → **Logs** → **Database**

### 2. 性能监控

- Vercel Analytics: 提供页面性能和用户行为分析
- Supabase Dashboard: 查看 API 使用情况和数据库性能

### 3. 备份策略

- **Supabase 自动备份**: Dashboard → **Database** → **Backups**
- **手动备份**: 定期导出数据和数据库 schema

### 4. 更新流程

1. 在本地开发并测试新功能
2. 提交代码到 Git
3. Vercel 自动部署预览版本
4. 测试预览版本
5. 合并到主分支触发生产部署

## 安全建议

1. **定期更新依赖**:
   ```bash
   npm audit
   npm update
   ```

2. **使用强密码**: Supabase 数据库密码和用户密码

3. **启用双因素认证**: 在 Supabase 和 Vercel 账户中

4. **定期审查权限**: 定期检查用户角色和 RLS 策略

5. **监控异常活动**: 关注登录日志和 API 使用情况

## 技术支持

如遇到部署问题,请:

1. 检查本文档的 "常见部署问题" 章节
2. 查看 [Vercel 文档](https://vercel.com/docs)
3. 查看 [Supabase 文档](https://supabase.com/docs)
4. 在项目 Issues 中提问

---

祝你部署顺利! 🚀
