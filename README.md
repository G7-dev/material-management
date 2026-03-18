# 物资管理系统

基于React + TypeScript + Supabase + Tailwind CSS的现代化物资管理系统

## 🚀 快速开始

### 前置要求
- Node.js 18+ 
- npm或yarn包管理器
- Supabase账号（用于后端服务）

### 安装依赖

```bash
cd "C:\Users\85149\Desktop\新建文件夹"
npm install
```

### 开发环境配置

1. 复制 `.env.example` 到 `.env`（如果存在）
2. 在 `.env` 文件中添加您的Supabase配置：

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. 确保package.json中包含以下依赖：

```json
{
  "dependencies": {
    "@mui/material": "^7.3.5",
    "@mui/icons-material": "^7.3.5",
    "@emotion/react": "^11.14.0",
    "@emotion/styled": "^11.14.0",
    "@radix-ui/react-slot": "^1.1.2",
    "lucide-react": "^0.487.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "tailwind-merge": "^3.2.0",
    "tailwindcss": "^4.1.12",
    "@supabase/supabase-js": "^2.39.0",
    "antd": "^5.12.0",
    "dayjs": "^1.11.10",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0"
  }
}
```

### 启动开发服务器

```bash
npm run dev
```

项目将在 http://localhost:3000 启动

## 📂 项目结构

```
src/
├── components/          # 共享组件
│   ├── ui/             # UI组件（Button, Input, Card等）
│   ├── AdminLayout.tsx # 管理员布局
│   └── EmployeeLayout.tsx # 员工布局
├── pages/              # 页面组件
│   ├── Login.tsx       # 登录页
│   ├── Dashboard.tsx   # 仪表盘
│   ├── Materials.tsx   # 物资申领
│   ├── PurchaseRequest.tsx # 物品申购
│   ├── MyRequisitions.tsx  # 申请记录
│   └── admin/          # 管理页面
│       ├── Approvals.tsx      # 审批管理
│       ├── MaterialManagement.tsx # 物资管理
│       └── UserManagement.tsx # 用户管理
├── lib/                # 工具库
│   ├── supabase.ts     # Supabase客户端
│   ├── auth.ts         # 认证相关函数
│   └── utils.ts        # 工具函数
└── index.css           # Tailwind CSS样式
```

## 🎯 功能特性

### 员工功能
- ✅ 物资申领（日常物资）
- ✅ 物品申购（新物品）
- ✅ 查看申请记录
- ✅ 用户名/邮箱登录

### 管理员功能
- ✅ 审批管理（通过/驳回）
- ✅ 物资管理（增删改查）
- ✅ 用户管理
- ✅ 库存预警
- ✅ 自动库存扣减

### UI特性
- 🎨 现代化界面设计
- 📱 响应式布局
- 🎪 动画效果
- 🌗 毛玻璃效果
- 📊 数据可视化

## 🔧 技术栈

- **前端框架**: React 18 + TypeScript
- **UI库**: Radix UI Primitives + Material-UI Icons
- **样式**: Tailwind CSS + Emotion
- **数据库**: Supabase (PostgreSQL)
- **图标**: Lucide React
- **日期**: dayjs
- **构建工具**: Vite

## 🗄️ 数据库结构

### 核心表

1. **profiles** - 用户信息
2. **materials** - 物资信息
3. **requisitions** - 申领/申购记录
4. **approvals** - 审批记录
5. **inventory_logs** - 库存流水

## 🐛 常见问题

### 1. Tailwind CSS未找到错误
**解决**: 确保已运行 `npm install tailwindcss postcss autoprefixer`

### 2. ES模块错误
**解决**: package.json已添加 `"type": "module"`

### 3. PostCSS配置错误
**解决**: 使用最新的postcss.config.js格式

## 📞 支持

如有问题，请检查：
1. Supabase配置是否正确
2. 所有依赖是否已安装
3. Node.js版本是否为18+
4. 端口3000是否被占用

## 📝 许可证

MIT License
