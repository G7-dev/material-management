-- =====================================================
-- 安全的数据库初始化脚本(不删除已有表)
-- =====================================================
-- 此脚本会检查表是否存在,如果存在则跳过创建
-- =====================================================

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. 用户配置表 (profiles)
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
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
  END IF;
END
$$;

-- 创建更新时间戳的触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为 profiles 表创建更新时间戳触发器
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- profiles 表的 RLS 策略
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 删除并重新创建 RLS 策略
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles"
  ON profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
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
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'materials') THEN
    CREATE TABLE materials (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      specification TEXT,
      model TEXT,
      unit TEXT NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0,
      safe_stock INTEGER NOT NULL DEFAULT 10,
      location TEXT,
      image_url TEXT,
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
      created_by UUID REFERENCES profiles(id)
    );
  END IF;
END
$$;

-- 为 materials 表创建更新时间戳触发器
DROP TRIGGER IF EXISTS update_materials_updated_at ON materials;
CREATE TRIGGER update_materials_updated_at
  BEFORE UPDATE ON materials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- materials 表的 RLS 策略
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view active materials" ON materials;
CREATE POLICY "Authenticated users can view active materials"
  ON materials
  FOR SELECT
  USING (auth.uid() IS NOT NULL AND status = 'active');

DROP POLICY IF EXISTS "Admins can view all materials" ON materials;
CREATE POLICY "Admins can view all materials"
  ON materials
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can insert materials" ON materials;
CREATE POLICY "Admins can insert materials"
  ON materials
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update materials" ON materials;
CREATE POLICY "Admins can update materials"
  ON materials
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can delete materials" ON materials;
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
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'inventory_logs') THEN
    CREATE TYPE inventory_operation_type AS ENUM (
      'initial',
      'restock',
      'request_out',
      'adjustment'
    );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'inventory_logs') THEN
    CREATE TABLE inventory_logs (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
      operation_type inventory_operation_type NOT NULL,
      quantity INTEGER NOT NULL,
      stock_before INTEGER NOT NULL,
      stock_after INTEGER NOT NULL,
      reference_id UUID,
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
      created_by UUID REFERENCES profiles(id)
    );
  END IF;
END
$$;

-- inventory_logs 表的 RLS 策略
ALTER TABLE inventory_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view inventory logs" ON inventory_logs;
CREATE POLICY "Authenticated users can view inventory logs"
  ON inventory_logs
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admins can insert inventory logs" ON inventory_logs;
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
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'requisitions') THEN
    CREATE TYPE requisition_type AS ENUM (
      'daily_request',
      'purchase_request'
    );

    CREATE TYPE requisition_status AS ENUM (
      'pending',
      'approved',
      'rejected',
      'completed',
      'cancelled'
    );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'requisitions') THEN
    CREATE TABLE requisitions (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      requisition_type requisition_type NOT NULL,
      status requisition_status DEFAULT 'pending' NOT NULL,
      material_id UUID REFERENCES materials(id) ON DELETE SET NULL,
      request_quantity INTEGER,
      purchase_name TEXT,
      purchase_specification TEXT,
      purchase_model TEXT,
      purchase_unit TEXT,
      purchase_quantity INTEGER,
      purchase_reason TEXT,
      purpose TEXT,
      urgent BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
    );
  END IF;
END
$$;

-- 为 requisitions 表创建更新时间戳触发器
DROP TRIGGER IF EXISTS update_requisitions_updated_at ON requisitions;
CREATE TRIGGER update_requisitions_updated_at
  BEFORE UPDATE ON requisitions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_requisitions_user_id ON requisitions(user_id);
CREATE INDEX IF NOT EXISTS idx_requisitions_status ON requisitions(status);
CREATE INDEX IF NOT EXISTS idx_requisitions_material_id ON requisitions(material_id);
CREATE INDEX IF NOT EXISTS idx_requisitions_created_at ON requisitions(created_at DESC);

-- requisitions 表的 RLS 策略
ALTER TABLE requisitions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own requisitions" ON requisitions;
CREATE POLICY "Users can view own requisitions"
  ON requisitions
  FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all requisitions" ON requisitions;
CREATE POLICY "Admins can view all requisitions"
  ON requisitions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Authenticated users can insert requisitions" ON requisitions;
CREATE POLICY "Authenticated users can insert requisitions"
  ON requisitions
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can update requisitions" ON requisitions;
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
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'approvals') THEN
    CREATE TYPE approval_result AS ENUM (
      'approved',
      'rejected'
    );

    CREATE TABLE approvals (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      requisition_id UUID NOT NULL REFERENCES requisitions(id) ON DELETE CASCADE,
      approver_id UUID NOT NULL REFERENCES profiles(id),
      result approval_result NOT NULL,
      opinion TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
    );
  END IF;
END
$$;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_approvals_requisition_id ON approvals(requisition_id);
CREATE INDEX IF NOT EXISTS idx_approvals_created_at ON approvals(created_at DESC);

-- approvals 表的 RLS 策略
ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view approvals for own requisitions" ON approvals;
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

DROP POLICY IF EXISTS "Admins can view all approvals" ON approvals;
CREATE POLICY "Admins can view all approvals"
  ON approvals
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can insert approvals" ON approvals;
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
DROP VIEW IF EXISTS low_stock_materials CASCADE;
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
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 7. 初始数据插入(只在表为空时插入)
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM materials LIMIT 1) THEN
    INSERT INTO materials (name, category, specification, model, unit, stock, safe_stock, location) VALUES
    ('A4打印纸', '办公用品', '80g, 500张/包', '', '包', 50, 20, 'A区-1号货架'),
    ('中性笔', '办公用品', '黑色, 0.5mm', '', '支', 100, 30, 'A区-2号货架'),
    ('订书机', '办公用品', '24/6', '', '个', 15, 5, 'A区-3号货架'),
    ('文件夹', '办公用品', '蓝色, 5cm厚', '', '个', 30, 10, 'A区-4号货架'),
    ('U盘', '电子设备', '64GB, USB 3.0', 'SanDisk', '个', 20, 10, 'B区-1号货架');
  END IF;
END
$$;

-- =====================================================
-- 执行完成!
-- =====================================================
-- '数据库初始化脚本执行完成!';
-- '所有表和策略已正确配置!';
