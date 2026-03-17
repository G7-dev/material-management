-- Row Level Security (RLS) 策略
-- 启用RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- 用户配置表策略
-- 用户只能查看自己的信息
CREATE POLICY "用户只能查看自己的配置信息" 
  ON user_profiles FOR SELECT 
  USING (auth.uid() = id);

-- 管理员可以查看所有用户信息
CREATE POLICY "管理员可以查看所有用户信息" 
  ON user_profiles FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up 
      WHERE up.id = auth.uid() 
      AND up.role = 'admin'
    )
  );

-- 用户可以更新自己的信息（不能修改角色）
CREATE POLICY "用户可以更新自己的配置信息" 
  ON user_profiles FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 物资表策略
-- 所有认证用户可以查看物资
CREATE POLICY "所有认证用户可以查看物资" 
  ON materials FOR SELECT 
  USING (auth.role() = 'authenticated');

-- 管理员可以插入新物资
CREATE POLICY "管理员可以添加物资" 
  ON materials FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up 
      WHERE up.id = auth.uid() 
      AND up.role = 'admin'
    )
  );

-- 管理员可以更新物资
CREATE POLICY "管理员可以更新物资" 
  ON materials FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up 
      WHERE up.id = auth.uid() 
      AND up.role = 'admin'
    )
  );

-- 管理员可以删除物资
CREATE POLICY "管理员可以删除物资" 
  ON materials FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up 
      WHERE up.id = auth.uid() 
      AND up.role = 'admin'
    )
  );

-- 申请表策略
-- 用户可以查看自己的申请
CREATE POLICY "用户可以查看自己的申请" 
  ON applications FOR SELECT 
  USING (applicant_id = auth.uid());

-- 用户可以添加申请
CREATE POLICY "用户可以添加申请" 
  ON applications FOR INSERT 
  WITH CHECK (applicant_id = auth.uid());

-- 用户可以更新自己的待处理申请（只允许更新部分字段）
CREATE POLICY "用户可以更新自己的待处理申请" 
  ON applications FOR UPDATE 
  USING (
    applicant_id = auth.uid() 
    AND status = 'pending'
  )
  WITH CHECK (
    applicant_id = auth.uid() 
    AND status = 'pending'
  );

-- 管理员可以查看所有申请
CREATE POLICY "管理员可以查看所有申请" 
  ON applications FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up 
      WHERE up.id = auth.uid() 
      AND up.role = 'admin'
    )
  );

-- 管理员可以审批申请
CREATE POLICY "管理员可以审批申请" 
  ON applications FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up 
      WHERE up.id = auth.uid() 
      AND up.role = 'admin'
    )
  );

-- 插入默认管理员策略（如果需要创建初始用户）
-- 注意：这个策略只在初始化时使用
CREATE POLICY "允许服务角色插入初始用户" 
  ON user_profiles FOR INSERT 
  WITH CHECK (true);

-- 插入初始测试数据（仅限开发环境使用）
DO $$
BEGIN
  -- 只在开发环境中插入测试数据
  IF current_setting('app.env', true) = 'development' THEN
    -- 插入测试用户（需要先在Supabase Auth中创建对应的用户）
    INSERT INTO user_profiles (id, username, name, role, department)
    VALUES 
      ('00000000-0000-0000-0000-000000000001', 'admin', '系统管理员', 'admin', 'IT部门'),
      ('00000000-0000-0000-0000-000000000002', 'employee', '普通员工', 'employee', '行政部门')
    ON CONFLICT (id) DO NOTHING;

    -- 插入测试物资
    INSERT INTO materials (name, description, category, quantity, unit, location, min_stock)
    VALUES 
      ('A4打印纸', '80g A4规格打印纸', '办公用品', 500, '包', '仓库A-01', 50),
      ('黑色签字笔', '0.5mm黑色中性笔', '文具', 200, '支', '仓库A-02', 30),
      ('笔记本电脑', '15.6寸商务笔记本', '电子设备', 15, '台', '仓库B-01', 5),
      ('显示器', '24寸IPS显示器', '电子设备', 25, '台', '仓库B-02', 10),
      ('办公椅', '人体工学办公椅', '家具', 30, '把', '仓库C-01', 15)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;