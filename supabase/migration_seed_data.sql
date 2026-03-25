-- =====================================================
-- 数据迁移脚本：将静态数据导入 Supabase
-- 清理旧数据并插入完整的多规格物资数据
-- =====================================================
-- 执行说明:
-- 1. 先执行 migration_add_sizes_support.sql 修改schema
-- 2. 再执行此脚本导入数据
-- 3. 此脚本会删除现有测试数据并插入完整数据
-- =====================================================

-- 1. 删除现有的测试数据（保留其他表数据）
DELETE FROM inventory_logs WHERE material_id IN (SELECT id FROM materials);
DELETE FROM materials WHERE name IN ('A4打印纸', '中性笔', '订书机', '文件夹', 'U盘');

-- 2. 插入完整的物资数据（支持多规格）
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

-- 3. 为每个物资创建初始库存流水记录
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

-- 4. 创建辅助视图：库存状态汇总
CREATE OR REPLACE VIEW material_stock_status AS
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

-- 5. 验证数据导入
SELECT 
  name,
  stock as total_stock,
  safe_stock,
  jsonb_array_length(sizes) as size_count,
  CASE 
    WHEN sizes IS NULL OR jsonb_array_length(sizes) = 0 THEN '单规格'
    ELSE '多规格'
  END as size_type
FROM materials 
ORDER BY size_type DESC, name;

-- =====================================================
-- 数据导入完成
-- =====================================================
-- 验证查询：
-- SELECT * FROM material_stock_status WHERE stock_status != 'normal';
-- SELECT * FROM inventory_logs ORDER BY created_at DESC LIMIT 10;
-- =====================================================
