-- =====================================================
-- 物资领用管理系统 - 完整数据库迁移脚本
-- 包含Schema升级 + 数据导入
-- 一次性执行此文件即可
-- =====================================================
-- 执行说明:
-- 1. 在 Supabase 项目中,进入 SQL Editor
-- 2. 复制此文件的完整内容
-- 3. 粘贴到 SQL Editor 并执行
-- 4. 等待执行完成（约10-20秒）
-- =====================================================

-- 1. 修改 materials 表，添加 sizes 字段用于存储多规格信息
ALTER TABLE materials 
ADD COLUMN IF NOT EXISTS sizes JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 2. 修改 inventory_logs 表，添加 size_id 字段用于记录具体规格的变动
ALTER TABLE inventory_logs 
ADD COLUMN IF NOT EXISTS size_id TEXT,
ADD COLUMN IF NOT EXISTS size_label TEXT;

-- 3. 删除可能存在的旧视图并创建新视图
DROP VIEW IF EXISTS low_stock_materials;

CREATE VIEW low_stock_materials AS
SELECT
  m.id,
  m.name,
  m.category,
  m.specification,
  m.model,
  m.unit,
  m.stock,
  m.safe_stock,
  m.location,
  m.status,
  m.sizes,
  m.created_at,
  m.updated_at,
  CASE 
    WHEN m.sizes IS NULL OR jsonb_array_length(m.sizes) = 0 THEN
      -- 单规格物品
      CASE 
        WHEN m.stock = 0 THEN 'empty'
        WHEN m.stock <= CEIL(m.safe_stock * 0.3) THEN 'critical'
        WHEN m.stock <= m.safe_stock THEN 'warning'
        ELSE 'normal'
      END
    ELSE
      -- 多规格物品 - 只要有一个规格低于安全库存就显示
      'warning'
  END AS overall_status
FROM materials m
WHERE m.status = 'active';

-- 4. 创建函数：获取物资的当前库存状态
CREATE OR REPLACE FUNCTION get_material_status(material_id UUID)
RETURNS TEXT AS $$
DECLARE
  material_record materials%ROWTYPE;
  has_low_stock BOOLEAN := false;
  size_record JSONB;
BEGIN
  SELECT * INTO material_record FROM materials WHERE id = material_id;
  
  IF material_record.sizes IS NULL OR jsonb_array_length(material_record.sizes) = 0 THEN
    -- 单规格物品
    RETURN CASE 
      WHEN material_record.stock = 0 THEN 'empty'
      WHEN material_record.stock <= CEIL(material_record.safe_stock * 0.3) THEN 'critical'
      WHEN material_record.stock <= material_record.safe_stock THEN 'warning'
      ELSE 'normal'
    END;
  ELSE
    -- 多规格物品 - 检查所有规格
    FOR size_record IN SELECT * FROM jsonb_array_elements(material_record.sizes)
    LOOP
      IF (size_record->>'stock')::INTEGER <= (material_record.safe_stock)::INTEGER THEN
        has_low_stock := true;
      END IF;
    END LOOP;
    
    RETURN CASE 
      WHEN has_low_stock THEN 'warning'
      ELSE 'normal'
    END;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 5. 创建函数：更新物资库存（支持多规格）
CREATE OR REPLACE FUNCTION update_material_stock(
  p_material_id UUID,
  p_size_id TEXT,
  p_quantity INTEGER,
  p_operation_type inventory_operation_type,
  p_notes TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL
)
RETURNS TABLE(new_stock INTEGER, new_size_stock INTEGER) AS $$
DECLARE
  material_record materials%ROWTYPE;
  current_stock INTEGER;
  new_total_stock INTEGER;
  size_stock INTEGER;
  new_size_stock INTEGER;
  size_index INTEGER := -1;
  updated_sizes JSONB;
BEGIN
  -- 获取物资记录
  SELECT * INTO material_record FROM materials WHERE id = p_material_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Material not found: %', p_material_id;
  END IF;
  
  current_stock := material_record.stock;
  
  IF p_size_id IS NULL THEN
    -- 更新总库存（单规格物品）
    new_total_stock := current_stock + p_quantity;
    
    -- 记录库存流水
    INSERT INTO inventory_logs (
      material_id, operation_type, quantity, stock_before, stock_after, 
      notes, reference_id, created_by
    ) VALUES (
      p_material_id, p_operation_type, p_quantity, current_stock, new_total_stock,
      p_notes, p_reference_id, auth.uid()
    );
    
    -- 更新物资库存
    UPDATE materials 
    SET stock = new_total_stock, updated_at = TIMEZONE('utc', NOW())
    WHERE id = p_material_id;
    
    new_size_stock := NULL;
  ELSE
    -- 更新多规格库存
    IF material_record.sizes IS NULL THEN
      RAISE EXCEPTION 'Material does not have sizes: %', p_material_id;
    END IF;
    
    -- 查找规格索引
    SELECT i INTO size_index 
    FROM jsonb_array_elements(material_record.sizes) WITH ORDINALITY arr(elem, i)
    WHERE elem->>'id' = p_size_id;
    
    IF size_index IS NULL THEN
      RAISE EXCEPTION 'Size not found: %', p_size_id;
    END IF;
    
    -- 获取当前规格库存
    size_stock := (material_record.sizes->(size_index-1)->>'stock')::INTEGER;
    new_size_stock := size_stock + p_quantity;
    
    -- 更新规格库存
    updated_sizes := jsonb_set(
      material_record.sizes,
      ARRAY[(size_index-1)::TEXT, 'stock'],
      to_jsonb(new_size_stock)
    );
    
    -- 重新计算总库存（所有规格之和）
    new_total_stock := (
      SELECT SUM((elem->>'stock')::INTEGER)
      FROM jsonb_array_elements(updated_sizes) elem
    );
    
    -- 记录库存流水（带规格信息）
    INSERT INTO inventory_logs (
      material_id, operation_type, quantity, stock_before, stock_after, 
      size_id, size_label, notes, reference_id, created_by
    ) VALUES (
      p_material_id, p_operation_type, p_quantity, size_stock, new_size_stock,
      p_size_id, (material_record.sizes->(size_index-1)->>'label'), p_notes, p_reference_id, auth.uid()
    );
    
    -- 更新物资库存和规格信息
    UPDATE materials 
    SET stock = new_total_stock, sizes = updated_sizes, updated_at = TIMEZONE('utc', NOW())
    WHERE id = p_material_id;
  END IF;
  
  RETURN QUERY SELECT new_total_stock, new_size_stock;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. 创建视图：库存流水详情（包含规格信息）
CREATE OR REPLACE VIEW inventory_logs_with_details AS
SELECT
  il.id,
  il.material_id,
  m.name as material_name,
  il.operation_type,
  il.quantity,
  il.stock_before,
  il.stock_after,
  il.size_id,
  il.size_label,
  il.notes,
  il.reference_id,
  il.created_at,
  il.created_by,
  p.full_name as created_by_name
FROM inventory_logs il
JOIN materials m ON il.material_id = m.id
LEFT JOIN profiles p ON il.created_by = p.id;

-- 7. 删除可能存在的旧视图并创建新视图
DROP VIEW IF EXISTS material_stock_status;

-- 8. 创建辅助视图：库存状态汇总
CREATE VIEW material_stock_status AS
SELECT 
  m.id,
  m.name,
  m.category,
  m.unit,
  m.stock as total_stock,
  m.safe_stock,
  m.location,
  m.sizes,
  -- 单规格物品状态
  CASE 
    WHEN m.sizes IS NULL OR jsonb_array_length(m.sizes) = 0 THEN
      CASE 
        WHEN m.stock = 0 THEN 'empty'
        WHEN m.stock <= CEIL(m.safe_stock * 0.3) THEN 'critical'
        WHEN m.stock <= m.safe_stock THEN 'warning'
        ELSE 'normal'
      END
    -- 多规格物品状态（取最低状态）
    ELSE
      CASE 
        WHEN EXISTS (SELECT 1 FROM jsonb_array_elements(m.sizes) s WHERE (s->>'stock')::int = 0) THEN 'empty'
        WHEN EXISTS (SELECT 1 FROM jsonb_array_elements(m.sizes) s WHERE (s->>'stock')::int <= CEIL(m.safe_stock * 0.3)) THEN 'critical'
        WHEN EXISTS (SELECT 1 FROM jsonb_array_elements(m.sizes) s WHERE (s->>'stock')::int <= m.safe_stock) THEN 'warning'
        ELSE 'normal'
      END
  END as stock_status,
  -- 低库存的规格数量
  CASE 
    WHEN m.sizes IS NULL OR jsonb_array_length(m.sizes) = 0 THEN
      CASE WHEN m.stock <= m.safe_stock THEN 1 ELSE 0 END
    ELSE
      (SELECT COUNT(*) FROM jsonb_array_elements(m.sizes) s WHERE (s->>'stock')::int <= m.safe_stock)
  END as low_stock_count,
  -- 缺货的规格数量
  CASE 
    WHEN m.sizes IS NULL OR jsonb_array_length(m.sizes) = 0 THEN
      CASE WHEN m.stock = 0 THEN 1 ELSE 0 END
    ELSE
      (SELECT COUNT(*) FROM jsonb_array_elements(m.sizes) s WHERE (s->>'stock')::int = 0)
  END as empty_count
FROM materials m
WHERE m.status = 'active';

-- 9. 创建索引优化查询
CREATE INDEX IF NOT EXISTS idx_materials_category ON materials(category);
CREATE INDEX IF NOT EXISTS idx_materials_status ON materials(status);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_material_id ON inventory_logs(material_id);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_created_at ON inventory_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_operation_type ON inventory_logs(operation_type);

-- 10. 添加注释
COMMENT ON COLUMN materials.sizes IS '多规格库存信息，JSON数组格式: [{"id": "规格ID", "label": "规格名称", "spec": "规格描述", "stock": 库存数量}]';
COMMENT ON COLUMN inventory_logs.size_id IS '变动的规格ID，为空表示变动总库存';
COMMENT ON COLUMN inventory_logs.size_label IS '变动的规格名称';

-- =====================================================
-- 数据导入部分
-- 删除现有的测试数据并插入完整数据
-- =====================================================

-- 11. 删除现有的测试数据（保留其他表数据）
DELETE FROM inventory_logs WHERE material_id IN (SELECT id FROM materials);
DELETE FROM materials WHERE name IN ('A4打印纸', '中性笔', '订书机', '文件夹', 'U盘');

-- 12. 插入完整的物资数据（支持多规格）
INSERT INTO materials (
  id, name, category, specification, model, unit, stock, safe_stock, location, status, sizes
) VALUES 
-- 文件夹（多规格）
(
  uuid_generate_v4(),
  '文件夹',
  '办公用品',
  '塑料档案夹',
  '',
  '个',
  30,
  15,
  'A区-4号货架',
  'active',
  '[
    {"id": "a4_thin", "label": "A4 薄", "spec": "2cm背宽", "stock": 13},
    {"id": "a4_thick", "label": "A4 厚", "spec": "4cm背宽", "stock": 9},
    {"id": "a3", "label": "A3", "spec": "2cm背宽", "stock": 8}
  ]'::jsonb
),

-- A4打印纸（多规格）
(
  uuid_generate_v4(),
  'A4打印纸',
  '办公用品',
  '复印纸',
  '',
  '包',
  110,
  30,
  'A区-1号货架',
  'active',
  '[
    {"id": "70g", "label": "70g", "spec": "500张/包", "stock": 40},
    {"id": "80g", "label": "80g", "spec": "500张/包", "stock": 45},
    {"id": "90g", "label": "90g", "spec": "500张/包", "stock": 25}
  ]'::jsonb
),

-- 中性笔（多规格）
(
  uuid_generate_v4(),
  '中性笔',
  '办公用品',
  '签字笔',
  '',
  '支',
  90,
  30,
  'A区-2号货架',
  'active',
  '[
    {"id": "0.5mm_blue", "label": "0.5mm 蓝", "spec": "墨蓝色", "stock": 30},
    {"id": "0.5mm_black", "label": "0.5mm 黑", "spec": "黑色", "stock": 35},
    {"id": "0.5mm_red", "label": "0.5mm 红", "spec": "红色", "stock": 25},
    {"id": "0.7mm_black", "label": "0.7mm 黑", "spec": "黑色", "stock": 0}
  ]'::jsonb
),

-- U盘（多规格）
(
  uuid_generate_v4(),
  'U盘',
  '电子设备',
  'USB 3.0',
  'SanDisk',
  '个',
  22,
  10,
  'B区-1号货架',
  'active',
  '[
    {"id": "32gb", "label": "32GB", "spec": "USB 3.0", "stock": 8},
    {"id": "64gb", "label": "64GB", "spec": "USB 3.0", "stock": 10},
    {"id": "128gb", "label": "128GB", "spec": "USB 3.0", "stock": 4},
    {"id": "256gb", "label": "256GB", "spec": "USB 3.0", "stock": 0}
  ]'::jsonb
),

-- 订书机（多规格）
(
  uuid_generate_v4(),
  '订书机',
  '办公用品',
  '标准型/重型',
  '',
  '个',
  9,
  5,
  'A区-3号货架',
  'active',
  '[
    {"id": "mini", "label": "迷你型", "spec": "针10mm", "stock": 3},
    {"id": "standard", "label": "标准型", "spec": "针12mm", "stock": 4},
    {"id": "heavy", "label": "重型", "spec": "针23mm", "stock": 2}
  ]'::jsonb
),

-- 剪刀（单规格）
(
  uuid_generate_v4(),
  '剪刀',
  '办公用品',
  '不锈钢',
  '',
  '把',
  5,
  8,
  'A区-5号货架',
  'active',
  '[]'::jsonb
),

-- 固体胶（单规格）
(
  uuid_generate_v4(),
  '固体胶',
  '办公用品',
  '40g',
  '',
  '支',
  4,
  15,
  'A区-6号货架',
  'active',
  '[]'::jsonb
),

-- 计算器（单规格）
(
  uuid_generate_v4(),
  '计算器',
  '电子设备',
  '12位',
  '',
  '个',
  1,
  3,
  'B区-2号货架',
  'active',
  '[]'::jsonb
),

-- 便利贴（单规格）
(
  uuid_generate_v4(),
  '便利贴',
  '办公用品',
  '76×76mm',
  '',
  '本',
  20,
  30,
  'A区-7号货架',
  'active',
  '[]'::jsonb
),

-- 白板笔（单规格）
(
  uuid_generate_v4(),
  '白板笔',
  '办公用品',
  '黑/红/蓝',
  '',
  '支',
  6,
  10,
  'A区-8号货架',
  'active',
  '[]'::jsonb
),

-- 鼠标垫（单规格，缺货）
(
  uuid_generate_v4(),
  '鼠标垫',
  '电子设备',
  '标准尺寸',
  '',
  '个',
  0,
  5,
  'B区-3号货架',
  'active',
  '[]'::jsonb
),

-- 打印机墨盒（单规格）
(
  uuid_generate_v4(),
  '打印机墨盒',
  '耗材',
  'HP 803',
  'HP',
  '个',
  2,
  4,
  'C区-1号货架',
  'active',
  '[]'::jsonb
);

-- 13. 为每个物资创建初始库存流水记录
INSERT INTO inventory_logs (
  material_id, operation_type, quantity, stock_before, stock_after, notes
)
SELECT 
  id,
  'initial'::inventory_operation_type,
  stock,
  0,
  stock,
  '初始数据导入 - ' || CURRENT_DATE
FROM materials;

-- =====================================================
-- 迁移完成！
-- =====================================================
-- 验证查询（可以单独执行验证）：
-- SELECT name, stock, safe_stock, jsonb_array_length(sizes) as size_count 
-- FROM materials ORDER BY name;
-- 
-- SELECT * FROM material_stock_status WHERE stock_status != 'normal';
-- 
-- SELECT COUNT(*) as total_items FROM materials;
-- SELECT COUNT(*) as total_logs FROM inventory_logs;
-- =====================================================
