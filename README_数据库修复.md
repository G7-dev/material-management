# 数据库修复说明 - confirmed_at 字段缺失

## 问题描述
确认收货功能失败，错误信息：`Could not find the 'confirmed_at' column of 'requisitions' in the schema cache`

## 问题原因
`requisitions` 表中缺少 `confirmed_at` 字段，该字段用于记录确认收货的时间。

## 修复步骤

### 方法一：使用 Supabase SQL Editor（推荐）

1. 登录 Supabase 控制台
2. 进入 `SQL Editor`
3. 复制并执行 `supabase/add_confirmed_at_column.sql` 文件中的 SQL 脚本

### 方法二：使用 Supabase CLI

```bash
supabase db reset  # 注意：这会重置数据库，谨慎使用
```

### 方法三：手动执行 SQL

在 Supabase SQL Editor 中执行以下 SQL：

```sql
-- 添加 confirmed_at 字段
ALTER TABLE requisitions 
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_requisitions_confirmed_at ON requisitions(confirmed_at);

-- 更新现有记录
UPDATE requisitions 
SET confirmed_at = COALESCE(archived_at, updated_at)
WHERE status IN ('confirmed', 'archived', 'arrival_notified') 
  AND confirmed_at IS NULL;
```

## 验证修复

执行以下 SQL 验证：

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'requisitions' 
  AND column_name = 'confirmed_at';
```

如果返回结果中包含 `confirmed_at` 列，说明修复成功。

## 重新测试

1. 刷新前端页面
2. 进入"申请记录"页面
3. 找到状态为"已到货"的申购记录
4. 点击"确认收货"按钮
5. 检查是否成功

## 相关文件

- `supabase/add_confirmed_at_column.sql` - 修复脚本
- `src/app/pages/ApplicationRecords.tsx` - 确认收货功能代码

## 注意事项

- 执行 SQL 前建议备份数据库
- 修复后需要刷新前端页面
- 如果问题仍然存在，请清除浏览器缓存或等待 Supabase schema cache 刷新