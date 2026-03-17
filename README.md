# 物资领用管理系统

一个基于 Vercel + Supabase 架构的企业内部物资领用管理系统,提供完整的用户权限控制和物资流转流程。

## 功能特性

### 员工功能
- 物资浏览与搜索
- 日常物资申领
- 物资申购(申请新物品)
- 查看个人申领记录和审批状态

### 管理员功能
- 审批管理(审批申领/申购)
- 物资管理(添加、编辑、删除、补货)
- 库存预警(低于安全库存提醒)
- 用户管理

## 技术栈

- **前端**: React 18 + TypeScript + Vite
- **UI组件库**: Ant Design 5
- **路由**: React Router 6
- **后端/数据库**: Supabase (PostgreSQL)
- **部署**: Vercel
- **认证**: Supabase Auth

## 快速开始

### 1. 克隆项目

```bash
git clone <repository-url>
cd material-management-system
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置 Supabase

#### 3.1 创建 Supabase 项目

1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 点击 "New Project" 创建新项目
3. 等待项目创建完成

#### 3.2 初始化数据库

1. 在 Supabase Dashboard 中,进入 **SQL Editor**
2. 复制 `supabase/init.sql` 文件中的所有内容
3. 粘贴到 SQL Editor 中并点击 "Run"
4. 确认所有表和 RLS 策略创建成功

#### 3.3 创建管理员账户

**方法一: 通过 Supabase Dashboard**

1. 在 Supabase Dashboard 中,进入 **Authentication** → **Users**
2. 点击 "Add user" 添加新用户
3. 进入 **SQL Editor**,执行以下 SQL 将该用户设为管理员:

```sql
UPDATE profiles
SET role = 'admin'
WHERE email = 'admin@company.com';
```

**方法二: 直接插入**

在 SQL Editor 中执行:

```sql
-- 替换 <user-id> 为你的用户ID
INSERT INTO profiles (id, email, role, full_name)
VALUES ('<user-id>', 'admin@company.com', 'admin', '管理员');
```

### 4. 配置环境变量

1. 在 Supabase Dashboard 中,进入 **Settings** → **API**
2. 复制以下信息:
   - Project URL
   - anon/public key

3. 在项目根目录创建 `.env` 文件:

```bash
# 复制 .env.example 并重命名为 .env
cp .env.example .env
```

4. 编辑 `.env` 文件,填入 Supabase 配置:

```env
VITE_SUPABASE_URL=你的项目URL
VITE_SUPABASE_ANON_KEY=你的anon密钥
```

### 5. 本地开发

```bash
npm run dev
```

应用将在 http://localhost:3000 启动

## 部署到 Vercel

### 方法一: 通过 Vercel CLI

1. 安装 Vercel CLI:

```bash
npm i -g vercel
```

2. 登录 Vercel:

```bash
vercel login
```

3. 部署项目:

```bash
vercel
```

4. 添加环境变量:

在 Vercel Dashboard 中:
- 进入项目设置 → Environment Variables
- 添加 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY`

### 方法二: 通过 Git

1. 推送代码到 GitHub/GitLab/Bitbucket
2. 在 Vercel Dashboard 中点击 "New Project"
3. 导入你的仓库
4. 配置环境变量
5. 点击 "Deploy"

## 数据库表结构

### profiles (用户配置)
扩展 Supabase Auth 用户信息

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 关联 auth.users |
| email | TEXT | 邮箱 |
| full_name | TEXT | 姓名 |
| role | TEXT | 角色(employee/admin) |
| department | TEXT | 部门 |
| phone | TEXT | 电话 |

### materials (物资表)
存储物资的基本信息和库存

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| name | TEXT | 物资名称 |
| category | TEXT | 分类 |
| specification | TEXT | 规格 |
| model | TEXT | 型号 |
| unit | TEXT | 单位 |
| stock | INTEGER | 当前库存 |
| safe_stock | INTEGER | 安全库存 |
| location | TEXT | 存放位置 |
| image_url | TEXT | 图片URL |

### requisitions (申领/申购表)
存储员工的物资申领和申购请求

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| user_id | UUID | 申请人ID |
| requisition_type | ENUM | 申领类型 |
| status | ENUM | 状态 |
| material_id | UUID | 物资ID(日常申领) |
| request_quantity | INTEGER | 申领数量 |
| purchase_name | TEXT | 申购物品名称 |
| purchase_quantity | INTEGER | 申购数量 |
| purchase_reason | TEXT | 申购理由 |
| purpose | TEXT | 用途说明 |

### inventory_logs (库存流水表)
记录库存的每一次变动

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| material_id | UUID | 物资ID |
| operation_type | ENUM | 操作类型 |
| quantity | INTEGER | 变动数量 |
| stock_before | INTEGER | 变动前库存 |
| stock_after | INTEGER | 变动后库存 |
| reference_id | UUID | 关联ID |

### approvals (审批流水表)
记录申领/申购的审批过程

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| requisition_id | UUID | 申领单ID |
| approver_id | UUID | 审批人ID |
| result | ENUM | 审批结果 |
| opinion | TEXT | 审批意见 |

## 安全与权限

### RLS (行级安全) 策略

系统为每张表配置了严格的 RLS 策略:

- **profiles**: 用户只能查看/编辑自己的配置,管理员可查看全部
- **materials**: 所有登录用户可查看活跃物资,管理员可增删改
- **requisitions**: 用户只能查看/创建自己的申领,管理员可查看全部
- **approvals**: 用户只能查看与自己申领相关的审批,管理员可查看全部

### 权限说明

| 角色 | 权限 |
|------|------|
| 员工 | 查看物资、申领物资、申购、查看个人记录 |
| 管理员 | 所有权限 + 审批 + 物资管理 + 用户管理 |

## 项目结构

```
material-management-system/
├── public/                 # 静态资源
├── src/
│   ├── components/         # 公共组件
│   │   ├── AdminLayout.tsx       # 管理员布局
│   │   └── EmployeeLayout.tsx    # 员工布局
│   ├── lib/               # 工具库
│   │   ├── supabase.ts    # Supabase 客户端配置
│   │   └── auth.ts        # 认证相关函数
│   ├── pages/             # 页面组件
│   │   ├── Login.tsx            # 登录/注册页面
│   │   ├── Dashboard.tsx         # 首页
│   │   ├── Materials.tsx         # 物资列表
│   │   ├── MyRequisitions.tsx    # 我的申领记录
│   │   └── admin/               # 管理员页面
│   │       ├── Approvals.tsx            # 审批管理
│   │       ├── MaterialManagement.tsx   # 物资管理
│   │       └── UserManagement.tsx       # 用户管理
│   ├── App.tsx            # 应用主组件
│   ├── main.tsx           # 入口文件
│   └── index.css          # 全局样式
├── supabase/
│   └── init.sql           # 数据库初始化脚本
├── .env.example           # 环境变量示例
├── package.json           # 项目配置
├── tsconfig.json          # TypeScript 配置
├── vite.config.ts         # Vite 配置
└── README.md              # 项目文档
```

## 常见问题

### 1. 如何修改 Supabase 配置?

编辑 `.env` 文件,修改 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY`

### 2. 如何创建更多管理员?

在 Supabase SQL Editor 中执行:

```sql
UPDATE profiles
SET role = 'admin'
WHERE email = 'user@example.com';
```

### 3. 如何重置数据库?

在 Supabase SQL Editor 中执行 `supabase/init.sql` 中的内容

### 4. 如何导出数据?

在 Supabase Dashboard 中,进入 **Database** → **Backups** 进行备份

### 5. 开发环境报错?

确保已创建 `.env` 文件并配置了正确的 Supabase URL 和密钥

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request!

## 联系方式

如有问题,请联系项目维护者。
