# 移除组件库存台字段说明

## 变更背景

根据用户需求，决定从系统中完全移除"组件库存台"（stockPlatform）字段，用户无需选择库存位置即可完成物品上架操作。

## 修改内容

### 1. 数据接口 (`src/app/utils/itemStore.ts`)

**移除前：**
```typescript
export interface StoredItem {
  id: string;
  name: string;
  category: string;
  specModel: string;
  unit: string;
  quantity: number;
  lowStockThreshold: number;
  stockPlatform: string;  // ← 移除此字段
  expiry: string;
  notes: string;
  image?: string;
  uploadedAt: string;
}
```

**移除后：**
```typescript
export interface StoredItem {
  id: string;
  name: string;
  category: string;
  specModel: string;
  unit: string;
  quantity: number;
  lowStockThreshold: number;
  expiry: string;
  notes: string;
  image?: string;
  uploadedAt: string;
}
```

### 2. 物品上架页面 (`src/app/pages/ItemUpload.tsx`)

**移除内容：**

#### (1) 表单初始化数据
```typescript
const EMPTY_FORM = {
  name: '',
  category: '',
  specModel: '',
  unit: '',
  quantity: '',
  expiry: TODAY,
  lowStockThreshold: '',
  notes: '',
  // stockPlatform: '',  ← 移除此字段
};
```

#### (2) 必填字段验证
```typescript
// 修改前
const requiredFilled = formData.name && formData.category && formData.quantity && formData.stockPlatform;

// 修改后
const requiredFilled = formData.name && formData.category && formData.quantity;
```

#### (3) 库存信息区域的"组件库存台"选择框
- 删除了整个下拉选择框组件
- 包含6个选项：备件库存、耗材库存、办公用品库、设备库、应急物资库、其他

#### (4) 成功提示中的库存类型显示
- 删除了成功提示框中的"库存类型"信息行

#### (5) 预览卡片中的类型显示
```typescript
// 修改前
{[
  { label: '规格', value: formData.specModel },
  { label: '数量', value: formData.quantity },
  { label: '类型', value: formData.stockPlatform },  // ← 移除此行
  { label: '有效期', value: formData.expiry },
].map(...)}

// 修改后
{[
  { label: '规格', value: formData.specModel },
  { label: '数量', value: formData.quantity },
  { label: '有效期', value: formData.expiry },
].map(...)}
```

#### (6) 右侧必填项检查清单
```typescript
// 修改前
{[
  { key: 'image',         label: '物品图片',   filled: !!previewImage },
  { key: 'name',          label: '物品名称',   filled: !!formData.name },
  { key: 'category',      label: '物品分类',   filled: !!formData.category },
  { key: 'quantity',      label: '上架数量',   filled: !!formData.quantity },
  { key: 'stockPlatform', label: '组件库存台', filled: !!formData.stockPlatform },  // ← 移除此行
].map(...)}

// 修改后
{[
  { key: 'image',         label: '物品图片',   filled: !!previewImage },
  { key: 'name',          label: '物品名称',   filled: !!formData.name },
  { key: 'category',      label: '物品分类',   filled: !!formData.category },
  { key: 'quantity',      label: '上架数量',   filled: !!formData.quantity },
].map(...)}
```

#### (7) 保存数据时的字段
```typescript
// 修改前
saveStoredItem({
  name: formData.name,
  category: formData.category,
  specModel: formData.specModel,
  unit: formData.unit,
  quantity: parseInt(formData.quantity) || 0,
  lowStockThreshold: parseInt(formData.lowStockThreshold) || 0,
  stockPlatform: formData.stockPlatform,  // ← 移除此行
  expiry: formData.expiry,
  notes: formData.notes,
  image: previewImage ?? undefined,
});

// 修改后
saveStoredItem({
  name: formData.name,
  category: formData.category,
  specModel: formData.specModel,
  unit: formData.unit,
  quantity: parseInt(formData.quantity) || 0,
  lowStockThreshold: parseInt(formData.lowStockThreshold) || 0,
  expiry: formData.expiry,
  notes: formData.notes,
  image: previewImage ?? undefined,
});
```

#### (8) SuccessOverlay类型定义
```typescript
// 修改前
item: { name: string; category: string; quantity: string; stockPlatform: string };

// 修改后
item: { name: string; category: string; quantity: string };
```

### 3. 日常领用页面 (`src/app/pages/DailyCollection.tsx`)

**移除内容：**

#### (1) DisplayItem接口定义
```typescript
// 修改前
interface DisplayItem {
  id: number;
  name: string;
  category: string;
  specModel: string;
  unit: string;
  quantity: number;
  lowStockThreshold: number;
  stockPlatform: string;  // ← 移除此字段
  expiry: string;
  notes: string;
  sizes?: SizeVariant[];
}

// 修改后
interface DisplayItem {
  id: number;
  name: string;
  category: string;
  specModel: string;
  unit: string;
  quantity: number;
  lowStockThreshold: number;
  expiry: string;
  notes: string;
  sizes?: SizeVariant[];
}
```

#### (2) 数据转换时的字段赋值
```typescript
// 修改前
setItems(inventoryItems.map(item => ({
  id: item.id,
  name: item.name,
  category: item.category,
  specModel: item.spec,
  unit: item.unit,
  quantity: item.stock,
  lowStockThreshold: item.threshold,
  stockPlatform: item.location,  // ← 移除此行
  expiry: item.lastRestock,
  notes: '',
  sizes: item.sizes
})));

// 修改后
setItems(inventoryItems.map(item => ({
  id: item.id,
  name: item.name,
  category: item.category,
  specModel: item.spec,
  unit: item.unit,
  quantity: item.stock,
  lowStockThreshold: item.threshold,
  expiry: item.lastRestock,
  notes: '',
  sizes: item.sizes
})));
```

## 影响范围

### 功能影响
- ✅ 物品上架：无需选择库存位置即可完成上架
- ✅ 日常领用：不再显示库存位置信息
- ✅ 数据存储：localStorage中不再存储stockPlatform字段

### 界面变化
- ✅ 物品上架页面：移除"组件库存台"选择框
- ✅ 物品预览卡片：移除"类型"显示
- ✅ 成功提示：移除"库存类型"显示
- ✅ 必填项检查：减少一项检查（从5项变为4项）

## 测试验证

### 物品上架测试
1. [ ] 进入物品上架页面
2. [ ] 填写物品名称、分类、数量等必填信息
3. [ ] 验证"确认上架"按钮是否可用（无需选择组件库存台）
4. [ ] 点击"确认上架"按钮
5. [ ] 验证是否成功上架并显示成功提示
6. [ ] 进入物品补货页面，验证新上架的物品是否显示

### 数据验证
1. [ ] 使用浏览器开发者工具查看localStorage
2. [ ] 验证存储的item数据不包含stockPlatform字段
3. [ ] 验证其他字段（name, category, quantity等）正常存储

### 日常领用测试
1. [ ] 进入日常领用页面
2. [ ] 搜索或选择物品
3. [ ] 验证物品信息中不显示库存位置
4. [ ] 正常进行领用操作

## 数据兼容性

### 现有数据处理
- 已经存储在localStorage中的旧数据（包含stockPlatform字段）仍然可以正常读取
- 新上传的物品将不再包含stockPlatform字段
- 系统会自动忽略多余的stockPlatform字段

### 清理旧数据（可选）
如果需要清理旧数据中的stockPlatform字段，可以在浏览器控制台执行：

```javascript
// 清理已上传物品中的stockPlatform字段
const items = JSON.parse(localStorage.getItem('wms_uploaded_items_v1') || '[]');
const cleanedItems = items.map(item => {
  const { stockPlatform, ...rest } = item;
  return rest;
});
localStorage.setItem('wms_uploaded_items_v1', JSON.stringify(cleanedItems));
console.log('已清理stockPlatform字段', cleanedItems.length, '条记录');
```

## 相关文件

- `src/app/utils/itemStore.ts` - 数据接口定义
- `src/app/pages/ItemUpload.tsx` - 物品上架页面
- `src/app/pages/DailyCollection.tsx` - 日常领用页面

## 版本信息

- **修改日期**: 2026年3月19日
- **版本**: v1.1.0
- **变更类型**: 功能简化（移除不必要的字段）
- **向后兼容**: 是（旧数据仍可正常读取）

## 注意事项

1. **无需数据库修改**：此变更仅涉及前端代码，不涉及数据库schema
2. **用户培训**：如有必要，通知用户无需再选择库存位置
3. **文档更新**：更新相关操作文档，移除关于"组件库存台"的说明
4. **测试验证**：在生产环境部署前，请在测试环境充分验证