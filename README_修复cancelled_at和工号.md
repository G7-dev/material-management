# 修复 cancelled_at 字段缺失和工号未绑定问题

## 问题1：取消失败 - 缺少 cancelled_at 字段

### 错误信息
```
取消失败: Could not find the 'cancelled_at' column of 'requisitions' in the schema cache
```

### 问题原因
`requisitions` 表中缺少 `cancelled_at` 字段，该字段用于记录取消时间。

### 修复方案

#### 1. 创建 SQL 修复脚本

文件：`supabase/add_cancelled_at_column.sql`

```sql
-- 添加 cancelled_at 字段
ALTER TABLE requisitions 
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_requisitions_cancelled_at ON requisitions(cancelled_at);

-- 更新现有记录
UPDATE requisitions 
SET cancelled_at = updated_at 
WHERE status = 'cancelled' 
  AND cancelled_at IS NULL;
```

#### 2. 执行修复

在 Supabase SQL Editor 中执行上述脚本。

#### 3. 验证修复

```sql
-- 查询表结构
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'requisitions' 
  AND column_name = 'cancelled_at';

-- 应该返回：
-- cancelled_at | timestamptz
```

---

## 问题2：工号未绑定

### 问题描述
申请记录详情中，工号显示为 "-" 或未显示。

### 问题原因
1. 提交申请时没有保存工号信息
2. ApplicationRecord 接口缺少 employeeId 字段

### 修复方案

#### 1. 更新数据接口

文件：`src/app/utils/applicationStore.ts`

```typescript
export interface ApplicationRecord {
  id: string;
  itemId: string;
  itemName: string;
  quantity: number;
  unit: string;
  usage: string;
  applicationType: '日常领用' | '物品申购';
  applicationDate: string;
  status: ApplicationStatus;
  statusLabel: string;
  rejectReason?: string;
  applicant?: string;
  department?: string;
  employeeId?: string;  // 新增：工号字段
}
```

#### 2. 保存工号信息

文件：`src/app/pages/DailyCollection.tsx`

```typescript
const handleSubmit = () => {
  // ... 其他代码 ...
  
  saveApplicationRecord({
    itemId: item.id,
    itemName: item.name + (selectedSize ? ` (${selectedSize.label})` : ''),
    quantity,
    unit: item.unit || '个',
    usage: usage.trim(),
    applicationType: '日常领用',
    applicant: name.trim(),
    department,
    employeeId: employeeId.trim(),  // 新增：保存工号
  });
  
  // ... 其他代码 ...
};
```

#### 3. 在申请记录中显示工号

在申请记录表格中添加一列显示工号：

```tsx
<TableHead className="font-semibold text-foreground">工号</TableHead>

// 在表格行中
<TableCell className="text-muted-foreground">
  {record.employeeId || '-'}
</TableCell>
```

---

## 实施步骤

### 步骤1：修复数据库（必须）

1. 打开 Supabase 控制台
2. 进入 SQL Editor
3. 复制 `supabase/add_cancelled_at_column.sql` 内容
4. 粘贴并执行
5. 验证字段已添加

### 步骤2：更新前端代码

1. 更新 `src/app/utils/applicationStore.ts`
   - 添加 `employeeId?: string` 字段

2. 更新 `src/app/pages/DailyCollection.tsx`
   - 在 `handleSubmit` 中添加 `employeeId: employeeId.trim()`

3. 在申请记录显示页面添加工号列（可选）

### 步骤3：重新部署

```bash
npm run build
# 部署到生产环境
```

---

## 验证测试

### 测试1：取消功能

1. [ ] 登录系统
2. [ ] 进入申请记录页面
3. [ ] 找到一条待审批的申购记录
4. [ ] 点击"取消"按钮
5. [ ] 验证取消成功，不再报错
6. [ ] 验证记录状态变为"已取消"

### 测试2：工号显示

1. [ ] 进入日常领用页面
2. [ ] 选择物品并填写申请信息（包括工号）
3. [ ] 提交申请
4. [ ] 进入申请记录页面
5. [ ] 查看刚提交的申请
6. [ ] 验证工号正确显示（不是 "-"）

### 测试3：申购工号

1. [ ] 进入物品申购页面
2. [ ] 填写申购信息（包括工号）
3. [ ] 提交申购
4. [ ] 进入申请记录页面
5. [ ] 查看申购记录
6. [ ] 验证工号正确显示

---

## 数据库字段总结

### requisitions 表字段

| 字段名 | 类型 | 说明 |
|--------|------|------|
| status | enum | 状态 |
| created_at | timestamptz | 创建时间 |
| updated_at | timestamptz | 更新时间 |
| confirmed_at | timestamptz | 确认收货时间 |
| archived_at | timestamptz | 归档时间 |
| cancelled_at | timestamptz | **取消时间** |

### application_records（localStorage）字段

| 字段名 | 类型 | 说明 |
|--------|------|------|
| employeeId | string | **工号** |
| applicant | string | 申请人姓名 |
| department | string | 部门 |
| ... | ... | 其他字段 |

---

## 版本信息

- **修复日期**: 2026年3月19日
- **版本**: v1.2.2
- **影响范围**: 数据库schema + 前端代码
- **向后兼容**: 是（新增字段，不影响旧数据）

## 注意事项

1. **数据库修复必须先执行**：前端代码更新后，如果数据库没有对应字段，会导致功能失败
2. **现有数据处理**：旧记录中 employeeId 字段为 undefined，显示为 "-"
3. **新提交的申请**：会自动保存工号信息
4. **测试验证**：务必在测试环境验证通过后再部署到生产环境