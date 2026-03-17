-- =====================================================
-- 物资领用管理系统 - Supabase 数据库初始化脚本
-- =====================================================
-- 使用说明:
-- 1. 在 Supabase 项目中,进入 SQL Editor
-- 2. 复制并执行此脚本
-- 3. 执行完成后,检查所有表和策略是否创建成功
-- =====================================================

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. 用户配置表 (profiles)
-- 扩展 Supabase Auth 用户信息,存储用户角色
-- =====================================================
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('employee', 'admin')),
  department TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 创建更新时间戳的触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为 profiles 表创建更新时间戳触发器
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- profiles 表的 RLS 策略
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 用户可以查看自己的配置
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- 管理员可以查看所有用户配置
CREATE POLICY "Admins can view all profiles"
  ON profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 用户可以更新自己的配置
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- 管理员可以更新所有用户配置
CREATE POLICY "Admins can update all profiles"
  ON profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- 2. 物资表 (materials)
-- 存储物资的基本信息和库存
-- =====================================================
CREATE TABLE materials (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  specification TEXT,
  model TEXT,
  unit TEXT NOT NULL, -- 单位,如:个、箱、件
  stock INTEGER NOT NULL DEFAULT 0, -- 当前库存
  safe_stock INTEGER NOT NULL DEFAULT 10, -- 安全库存阈值
  location TEXT, -- 存放位置
  image_url TEXT, -- 物资图片URL
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  created_by UUID REFERENCES profiles(id)
);

-- 为 materials 表创建更新时间戳触发器
CREATE TRIGGER update_materials_updated_at
  BEFORE UPDATE ON materials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- materials 表的 RLS 策略
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;

-- 所有登录用户可以查看活跃物资
CREATE POLICY "Authenticated users can view active materials"
  ON materials
  FOR SELECT
  USING (auth.uid() IS NOT NULL AND status = 'active');

-- 管理员可以查看所有物资
CREATE POLICY "Admins can view all materials"
  ON materials
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 管理员可以插入物资
CREATE POLICY "Admins can insert materials"
  ON materials
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 管理员可以更新物资
CREATE POLICY "Admins can update materials"
  ON materials
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 管理员可以删除物资
CREATE POLICY "Admins can delete materials"
  ON materials
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- 3. 库存流水表 (inventory_logs)
-- 记录库存的每一次变动(入库、出库)
-- =====================================================
CREATE TYPE inventory_operation_type AS ENUM (
  'initial',     -- 初始上架
  'restock',     -- 补货
  'request_out', -- 申领出库
  'adjustment'   -- 盘点调整
);

CREATE TABLE inventory_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  operation_type inventory_operation_type NOT NULL,
  quantity INTEGER NOT NULL, -- 变动数量(正数表示入库,负数表示出库)
  stock_before INTEGER NOT NULL, -- 变动前库存
  stock_after INTEGER NOT NULL, -- 变动后库存
  reference_id UUID, -- 关联ID(如申领单ID)
  notes TEXT, -- 备注说明
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  created_by UUID REFERENCES profiles(id)
);

-- inventory_logs 表的 RLS 策略
ALTER TABLE inventory_logs ENABLE ROW LEVEL SECURITY;

-- 所有登录用户可以查看库存流水
CREATE POLICY "Authenticated users can view inventory logs"
  ON inventory_logs
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- 管理员可以插入库存流水
CREATE POLICY "Admins can insert inventory logs"
  ON inventory_logs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- 4. 申领/申购表 (requisitions)
-- 存储员工的物资申领和申购请求
-- =====================================================
CREATE TYPE requisition_type AS ENUM (
  'daily_request', -- 日常申领
  'purchase_request' -- 申购
);

CREATE TYPE requisition_status AS ENUM (
  'pending',     -- 待审批
  'approved',    -- 已通过
  'rejected',    -- 已驳回
  'completed',   -- 已完成(已出库)
  'cancelled'    -- 已取消
);

CREATE TABLE requisitions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  requisition_type requisition_type NOT NULL,
  status requisition_status DEFAULT 'pending' NOT NULL,

  -- 日常申领相关字段
  material_id UUID REFERENCES materials(id) ON DELETE SET NULL,
  request_quantity INTEGER,

  -- 申购相关字段
  purchase_name TEXT, -- 申购物品名称
  purchase_specification TEXT,
  purchase_model TEXT,
  purchase_unit TEXT,
  purchase_quantity INTEGER, -- 申购数量
  purchase_reason TEXT, -- 申购理由

  purpose TEXT, -- 用途说明
  urgent BOOLEAN DEFAULT false, -- 是否紧急

  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 为 requisitions 表创建更新时间戳触发器
CREATE TRIGGER update_requisitions_updated_at
  BEFORE UPDATE ON requisitions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 创建索引优化查询性能
CREATE INDEX idx_requisitions_user_id ON requisitions(user_id);
CREATE INDEX idx_requisitions_status ON requisitions(status);
CREATE INDEX idx_requisitions_material_id ON requisitions(material_id);
CREATE INDEX idx_requisitions_created_at ON requisitions(created_at DESC);

-- requisitions 表的 RLS 策略
ALTER TABLE requisitions ENABLE ROW LEVEL SECURITY;

-- 用户可以查看自己的申领/申购记录
CREATE POLICY "Users can view own requisitions"
  ON requisitions
  FOR SELECT
  USING (user_id = auth.uid());

-- 管理员可以查看所有申领/申购记录
CREATE POLICY "Admins can view all requisitions"
  ON requisitions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 用户可以创建申领/申购记录
CREATE POLICY "Authenticated users can insert requisitions"
  ON requisitions
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- 管理员可以更新申领/申购记录
CREATE POLICY "Admins can update requisitions"
  ON requisitions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- 5. 审批流水表 (approvals)
-- 记录申领/申购的审批过程
-- =====================================================
CREATE TYPE approval_result AS ENUM (
  'approved', -- 通过
  'rejected'  -- 驳回
);

CREATE TABLE approvals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  requisition_id UUID NOT NULL REFERENCES requisitions(id) ON DELETE CASCADE,
  approver_id UUID NOT NULL REFERENCES profiles(id),
  result approval_result NOT NULL,
  opinion TEXT, -- 审批意见
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- 创建索引优化查询性能
CREATE INDEX idx_approvals_requisition_id ON approvals(requisition_id);
CREATE INDEX idx_approvals_created_at ON approvals(created_at DESC);

-- approvals 表的 RLS 策略
ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;

-- 用户可以查看与自己的申领/申购相关的审批记录
CREATE POLICY "Users can view approvals for own requisitions"
  ON approvals
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM requisitions
      WHERE requisitions.id = approvals.requisition_id
      AND requisitions.user_id = auth.uid()
    )
  );

-- 管理员可以查看所有审批记录
CREATE POLICY "Admins can view all approvals"
  ON approvals
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 管理员可以插入审批记录
CREATE POLICY "Admins can insert approvals"
  ON approvals
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND approver_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- 6. 创建视图和函数
-- =====================================================

-- 视图: 库存低于安全库存的物资
CREATE OR REPLACE VIEW low_stock_materials AS
SELECT
  m.id,
  m.name,
  m.category,
  m.stock,
  m.safe_stock,
  (m.safe_stock - m.stock) AS shortage,
  m.unit,
  m.location
FROM materials m
WHERE m.status = 'active'
  AND m.stock < m.safe_stock
ORDER BY (m.safe_stock - m.stock) DESC;

-- 函数: 创建用户配置(当用户注册时自动触发)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::text, 'employee')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 触发器: 当新用户注册时自动创建配置
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 7. 初始数据插入
-- =====================================================

-- 插入测试物资(可选)
INSERT INTO materials (name, category, specification, model, unit, stock, safe_stock, location) VALUES
('A4打印纸', '办公用品', '80g, 500张/包', '', '包', 50, 20, 'A区-1号货架'),
('中性笔', '办公用品', '黑色, 0.5mm', '', '支', 100, 30, 'A区-2号货架'),
('订书机', '办公用品', '24/6', '', '个', 15, 5, 'A区-3号货架'),
('文件夹', '办公用品', '蓝色, 5cm厚', '', '个', 30, 10, 'A区-4号货架'),
('U盘', '电子设备', '64GB, USB 3.0', 'SanDisk', '个', 20, 10, 'B区-1号货架');

-- =====================================================
-- 8. 预设管理员账户
-- 说明: 首次需要手动创建管理员账户
-- 方法: 在 Supabase Dashboard 的 Authentication 中创建用户,
--       然后执行以下SQL将该用户设置为管理员:
--
--       UPDATE profiles
--       SET role = 'admin'
--       WHERE email = 'admin@company.com';
--
--       或直接创建:
--       INSERT INTO profiles (id, email, role)
--       VALUES ('your-user-id', 'admin@company.com', 'admin');
-- =====================================================

-- =====================================================
-- 执行完成提示
-- =====================================================
-- '数据库初始化脚本执行完成!';
-- '请检查以下内容:';
-- '1. 所有表是否创建成功';
-- '2. RLS策略是否正确配置';
-- '3. 首次需要手动创建管理员账户';
-- '4. 请在 .env 文件中配置 Supabase 项目 URL 和密钥';
