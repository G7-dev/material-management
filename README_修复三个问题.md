# 修复三个问题说明

## 问题1：确认收货后菜单提示未消失 ✅

### 问题描述
申请记录旁显示提示数字（如"1"），但记录已确认收货并归档，提示没有消失。

### 问题原因
在 `ApplicationRecords.tsx` 中确认收货后，只更新了页面数据，但没有更新 Sidebar 中的 `pendingConfirmCount` 状态。

### 修复方案
在 `handleConfirmReceipt` 函数中添加：
```typescript
// 立即更新侧边栏提示
setPendingConfirmCount(0);
```

这样确认收货后，菜单旁的蓝色数字标记会立即消失。

### 验证步骤
1. 登录系统
2. 查看侧边栏"申请记录"是否有蓝色数字标记
3. 进入申请记录页面
4. 点击"确认收货"按钮
5. 验证侧边栏蓝色标记是否立即消失

---

## 问题2：物品上架页面还有"组件库存台"字段 ✅

### 问题描述
虽然从代码中删除了 `stockPlatform` 字段，但页面上还显示"组件库存台"选择框。

### 问题原因
在 `ItemUpload.tsx` 第692-709行，"组件库存台"选择框仍然存在。

### 修复方案
删除库存信息区域中的"组件库存台"选择框：
```tsx
// 删除整个区块
<div className="col-span-2">
  <label className="block text-sm font-medium text-foreground mb-2">
    组件库存台 <span className="text-destructive">*</span>
  </label>
  <AppSelect
    value={formData.stockPlatform}
    onChange={(v) => handleFieldChange('stockPlatform', v)}
    placeholder="请选择库存位置"
    options={[...]}
  />
</div>
```

### 验证步骤
1. 进入物品上架页面
2. 滚动到"库存信息"区域
3. 验证只有"上架数量"和"有效期限"两个字段
4. 验证没有"组件库存台"选择框

---

## 问题3：删除申请单后库存未恢复 ✅

### 问题描述
提交申请后删除申请单，库存没有恢复到原来的数量。

### 问题原因
`handleDelete` 函数只删除了申请记录，没有恢复已扣减的库存。

### 修复方案
在 `handleDelete` 函数中添加库存恢复逻辑：
```typescript
const handleDelete = (id: string) => {
  // 恢复库存（如果申请已通过）
  const record = records.find(r => r.id === id);
  if (record && record.status === 'approved') {
    // 查找对应的库存物品并恢复数量
    const { getAllInventoryItems, updateItemStock } = require('../data/unifiedInventoryData');
    const inventoryItems = getAllInventoryItems();
    const item = inventoryItems.find(i => i.name === record.itemName);
    if (item) {
      updateItemStock(item.id, item.stock + record.quantity);
      toast.success(`已恢复库存：${record.itemName} +${record.quantity}${record.unit}`);
    }
  }
  
  deleteApplicationRecord(id);
  setRecords(getApplicationRecords());
};
```

### 逻辑说明
1. 只有**审批通过**的申请单删除时才恢复库存
2. 待审核或已拒绝的申请单删除时不恢复库存（因为没有扣减库存）
3. 查找申请记录中的物品名称对应的库存物品
4. 将申请数量加回到库存中
5. 显示恢复成功的提示消息

### 验证步骤
1. 查看某物品库存（如订书机迷你型）数量为3个
2. 提交申请单：申请数量2个
3. 审批通过后，库存变为1个（3-2）
4. 删除该申请单
5. 验证库存恢复为3个（1+2）
6. 验证显示提示消息："已恢复库存：订书机迷你型 +2个"

### 边界情况处理

**场景1：删除待审核申请**
- 库存不变（因为没有扣减）
- 只删除申请记录

**场景2：删除已拒绝申请**
- 库存不变（因为没有扣减）
- 只删除申请记录

**场景3：删除已批准申请**
- 库存恢复（原数量 + 申请数量）
- 删除申请记录

**场景4：物品不存在**
- 只删除申请记录
- 不恢复库存（因为没有找到对应物品）
- 显示错误提示

---

## 总结

### 修复文件
1. `src/app/components/Sidebar.tsx` - 更新提示计数逻辑
2. `src/app/pages/ItemUpload.tsx` - 删除组件库存台选择框
3. `src/app/pages/ApplicationRecords.tsx` - 添加库存恢复逻辑

### 测试清单
- [ ] 确认收货后菜单提示立即消失
- [ ] 物品上架页面没有"组件库存台"选择框
- [ ] 删除已批准申请单后库存正确恢复
- [ ] 删除待审核/已拒绝申请单后库存不变
- [ ] 显示正确的提示消息

### 版本信息
- **修复日期**: 2026年3月19日
- **版本**: v1.2.1
- **影响范围**: 申请记录、物品上架、库存管理
- **向后兼容**: 是