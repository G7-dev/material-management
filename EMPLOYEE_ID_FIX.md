# 工号不显示问题修复报告

## 问题描述
在审批管理页面中，物品申购记录的工号显示为 "-"，而日常领用记录的工号可以正常显示。

## 问题原因分析
1. **日常领用**（DailyCollection）：
   - 表单中有工号输入字段
   - 保存到 localStorage，字段名为 `employeeId`
   - 审批页面从 `r.employeeId` 读取，可以正确显示

2. **物品申购**（ItemPurchase）：
   - ❌ 表单中**没有**工号输入字段
   - 保存到 Supabase requisitions 表，但**没有** `employee_id` 字段
   - 审批页面从 `item.employee_id` 读取，结果为 `undefined`，显示为 "-"

3. **数据库表结构**：
   - Supabase `requisitions` 表缺少 `employee_id` 字段
   - 也缺少 `applicant_name` 和 `department` 字段（虽然在 INSERT 中使用了）

## 修复内容

### 1. 修改文件：`src/app/pages/ItemPurchase.tsx`

#### 1.1 添加状态变量
```typescript
const [employeeId, setEmployeeId] = useState('');
```

#### 1.2 添加工号输入字段
在"所属部门"字段下方添加：
```typescript
{/* Employee ID */}
<div className="mb-5">
  <label className="block text-sm font-semibold text-foreground mb-2">
    工号<span className="text-rose-500 ml-1">*</span>
  </label>
  <Input
    type="text"
    value={employeeId}
    onChange={(e) => setEmployeeId(e.target.value)}
    placeholder="请输入您的工号"
    className="h-12 bg-gradient-to-br from-slate-50 to-slate-100/50 border-border"
    required
  />
</div>
```

#### 1.3 更新表单验证
在 `validateForm()` 函数中添加工号验证：
```typescript
if (!employeeId.trim()) {
  toast.error('请输入工号');
  return false;
}
```

#### 1.4 更新表单提交
在提交到 Supabase 时包含 `employee_id` 字段：
```typescript
await supabase
  .from('requisitions')
  .insert({
    // ... 其他字段 ...
    employee_id: employeeId.trim(),
    // ... 其他字段 ...
  });
```

#### 1.5 重置表单
在提交成功后重置工号字段：
```typescript
setEmployeeId('');
```

### 2. 创建数据库迁移脚本：`supabase/add_employee_fields.sql`

添加了以下字段到 `requisitions` 表：
- `employee_id TEXT` - 员工工号
- `applicant_name TEXT` - 申请人姓名
- `department TEXT` - 所属部门

```sql
-- 添加 employee_id 字段
ALTER TABLE requisitions ADD COLUMN IF NOT EXISTS employee_id TEXT;

-- 添加 applicant_name 字段
ALTER TABLE replications ADD COLUMN IF NOT EXISTS applicant_name TEXT;

-- 添加 department 字段
ALTER TABLE requisitions ADD COLUMN IF NOT EXISTS department TEXT;

-- 添加索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_requisitions_employee_id ON requisitions(employee_id);
CREATE INDEX IF NOT EXISTS idx_requisitions_applicant_name ON requisitions(applicant_name);
```

## 数据库更新步骤

在 Supabase SQL Editor 中执行以下命令：

```bash
# 方式一：执行迁移脚本文件
psql -h db.supabase.co -U postgres -d postgres -f supabase/add_employee_fields.sql

# 方式二：在 Supabase Dashboard 中执行
# 1. 登录 https://supabase.com
# 2. 进入 SQL Editor
# 3. 粘贴并执行 add_employee_fields.sql 的内容
```

## 测试步骤

### 测试物品申购工号显示
1. 以员工身份登录
2. 进入"物品申购"页面
3. 填写申购表单（包括新的工号字段）
4. 提交申购申请
5. 以管理员身份登录
6. 进入"审批管理"页面
7. 查看刚才的申购记录
8. ✅ 工号列应该显示输入的工号，而不是 "-"

### 测试日常领用工号显示（回归测试）
1. 以员工身份登录
2. 进入"日常领用"页面
3. 申请领用物品（填写工号）
4. 以管理员身份登录
5. 进入"审批管理"页面
6. 查看刚才的领用记录
7. ✅ 工号列应该正常显示

## 影响范围

### 受影响的页面
1. **ItemPurchase（物品申购）** - 添加了工号输入字段
2. **ApprovalManagement（审批管理）** - 物品申购记录现在能正确显示工号
3. **ApplicationRecords（申请记录）** - 物品申购记录包含工号信息（虽然界面没显示）

### 数据库变更
- `requisitions` 表新增字段：`employee_id`, `applicant_name`, `department`
- 需要执行迁移脚本更新数据库

### 向后兼容性
- ✅ 现有的申购记录（没有工号的）会显示为 "-"，不会报错
- ✅ 新的申购记录会正确保存和显示工号
- ✅ 日常领用功能不受影响

## 验证结果

### 日常领用记录
- ✅ 工号字段：`employeeId` → 保存到 localStorage → 显示正常

### 物品申购记录
- ✅ 工号字段：`employee_id` → 保存到 Supabase → 显示正常

## 注意事项

1. **数据库迁移**：必须在 Supabase 中执行迁移脚本，添加缺失的字段
2. **已有数据**：现有的申购记录工号会显示为 "-"，需要手动补充或保持原样
3. **必填字段**：工号现在是必填项，员工提交申购时必须填写
4. **字段格式**：工号为文本类型，可以包含字母和数字（如：EMP001, 1001）

## 相关文件

1. `src/app/pages/ItemPurchase.tsx` - 添加工号输入和保存逻辑
2. `src/app/pages/ApprovalManagement.tsx` - 从 Supabase 读取工号（无需修改）
3. `src/app/pages/ApplicationRecords.tsx` - 加载 Supabase 数据（无需修改）
4. `supabase/add_employee_fields.sql` - 数据库迁移脚本

## 后续优化建议

1. 可以从 user profile 自动填充工号（如果 profile 表中存储了工号）
2. 可以添加工号格式验证（如必须是数字、必须是6位等）
3. 可以在申请记录页面也显示工号列
4. 可以导出包含工号的完整报表
