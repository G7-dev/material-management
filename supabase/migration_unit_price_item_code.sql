-- 迁移：materials 表添加 unit_price、item_code 列，删除 location 列
-- 请在 Supabase SQL Editor 中执行此 SQL

-- 1. 添加 unit_price 列（单价，单位：元）
ALTER TABLE materials ADD COLUMN IF NOT EXISTS unit_price NUMERIC(10, 2) DEFAULT 0;

-- 2. 添加 item_code 列（物品编码）
ALTER TABLE materials ADD COLUMN IF NOT EXISTS item_code VARCHAR(50);

-- 3. 删除依赖 location 的视图
DROP VIEW IF EXISTS low_stock_materials;
DROP VIEW IF EXISTS material_stock_status;

-- 4. 删除 location 列（库存位置）
ALTER TABLE materials DROP COLUMN IF EXISTS location;

-- 5. 重建 low_stock_materials 视图（不含 location）
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
  m.unit_price,
  m.item_code,
  m.status,
  m.sizes,
  m.created_at,
  m.updated_at,
  CASE
    WHEN m.sizes IS NULL OR jsonb_array_length(m.sizes) = 0 THEN
      CASE
        WHEN m.stock = 0 THEN 'empty'
        WHEN m.stock <= CEIL(m.safe_stock * 0.3) THEN 'critical'
        WHEN m.stock <= m.safe_stock THEN 'warning'
        ELSE 'normal'
      END
    ELSE
      'warning'
  END AS overall_status
FROM materials m
WHERE m.status = 'active';

-- 6. 重建 material_stock_status 视图（不含 location，新增 unit_price/item_code）
CREATE VIEW material_stock_status AS
SELECT
  m.id,
  m.name,
  m.category,
  m.unit,
  m.stock as total_stock,
  m.safe_stock,
  m.unit_price,
  m.item_code,
  m.sizes,
  CASE
    WHEN m.sizes IS NULL OR jsonb_array_length(m.sizes) = 0 THEN
      CASE
        WHEN m.stock = 0 THEN 'empty'
        WHEN m.stock <= CEIL(m.safe_stock * 0.3) THEN 'critical'
        WHEN m.stock <= m.safe_stock THEN 'warning'
        ELSE 'normal'
      END
    ELSE
      CASE
        WHEN EXISTS (SELECT 1 FROM jsonb_array_elements(m.sizes) s WHERE (s->>'stock')::int = 0) THEN 'empty'
        WHEN EXISTS (SELECT 1 FROM jsonb_array_elements(m.sizes) s WHERE (s->>'stock')::int <= CEIL(m.safe_stock * 0.3)) THEN 'critical'
        WHEN EXISTS (SELECT 1 FROM jsonb_array_elements(m.sizes) s WHERE (s->>'stock')::int <= m.safe_stock) THEN 'warning'
        ELSE 'normal'
      END
  END as stock_status,
  CASE
    WHEN m.sizes IS NULL OR jsonb_array_length(m.sizes) = 0 THEN
      CASE WHEN m.stock <= m.safe_stock THEN 1 ELSE 0 END
    ELSE
      (SELECT COUNT(*) FROM jsonb_array_elements(m.sizes) s WHERE (s->>'stock')::int <= m.safe_stock)
  END as low_stock_count,
  CASE
    WHEN m.sizes IS NULL OR jsonb_array_length(m.sizes) = 0 THEN
      CASE WHEN m.stock = 0 THEN 1 ELSE 0 END
    ELSE
      (SELECT COUNT(*) FROM jsonb_array_elements(m.sizes) s WHERE (s->>'stock')::int = 0)
  END as empty_count
FROM materials m
WHERE m.status = 'active';

-- 7. 为 item_code 创建索引
CREATE INDEX IF NOT EXISTS idx_materials_item_code ON materials(item_code);

-- 8. 添加注释
COMMENT ON COLUMN materials.unit_price IS '单价（元）';
COMMENT ON COLUMN materials.item_code IS '物品编码';
