# 申请记录功能优化说明

## 问题描述

1. **加载延迟**：点击"申请记录"菜单后，需要等待约2秒才会显示申请记录列表
2. **缺少提示**：当有到货待确认的记录时，菜单栏的"申请记录"旁没有提示标记

## 问题分析

### 加载延迟原因

在 `src/app/pages/ApplicationRecords.tsx` 中：
- 从localStorage加载本地申请记录（同步，很快）
- 从Supabase查询申购记录（异步，需要网络请求，耗时约2秒）
- 网络延迟 + 数据库查询 = 约2秒的等待时间

### 缺少提示原因

在 `src/app/components/Sidebar.tsx` 中：
- 只有"申购管理"和"审批管理"显示待审批数量标记
- 只有"低库存预警"显示低库存数量标记
- "申请记录"菜单没有检查到货待确认（arrival_notified）状态

## 修复内容

### 1. 添加加载状态

在 `src/app/pages/ApplicationRecords.tsx` 中添加：

- `isLoading` 状态变量
- 加载中的动画提示（旋转圆圈 + "正在加载申请记录..."）
- 在数据加载完成前隐藏统计卡片、筛选器和表格
- 加载完成后显示完整内容

### 2. 添加菜单提示标记

在 `src/app/components/Sidebar.tsx` 中添加：

- `getPendingConfirmCount()` 函数：查询Supabase中状态为 `arrival_notified` 的记录数
- `pendingConfirmCount` 状态变量：保存待确认数量
- 定时更新（每30秒）待确认数量
- 在"申请记录"菜单旁显示蓝色标记，显示待确认的到货数量

## 优化后的用户体验

### 加载体验

1. 点击"申请记录"菜单
2. 立即看到加载动画提示（旋转圆圈）
3. 数据加载完成后，加载动画消失，显示完整的申请记录列表
4. 用户可以清楚地知道系统正在工作，而不是无响应

### 提示标记

1. 当有状态为"已到货"（arrival_notified）的申购记录时
2. "申请记录"菜单旁显示蓝色数字标记
3. 用户无需进入页面即可知道有待确认的记录
4. 点击菜单进入页面后，可以直接确认收货

## 相关文件

- `src/app/pages/ApplicationRecords.tsx` - 申请记录页面，添加加载状态
- `src/app/components/Sidebar.tsx` - 侧边栏菜单，添加待确认提示标记

## 技术细节

### 加载状态实现

```typescript
const [isLoading, setIsLoading] = useState(true);

// 在useEffect中
setIsLoading(true);  // 开始加载
try {
  // 加载数据...
} finally {
  setIsLoading(false);  // 加载完成
}

// 在JSX中
{isLoading ? (
  <div className="flex items-center justify-center py-12">
    <div className="w-6 h-6 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
    <span>正在加载申请记录...</span>
  </div>
) : (
  // 显示数据
)}
```

### 提示标记实现

```typescript
// 查询待确认数量
const getPendingConfirmCount = async () => {
  const { count } = await supabase
    .from('requisitions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'arrival_notified');
  return count || 0;
};

// 定时更新（30秒一次）
useEffect(() => {
  const updateConfirmCount = async () => {
    const count = await getPendingConfirmCount();
    setPendingConfirmCount(count);
  };
  
  updateConfirmCount();
  const interval = setInterval(updateConfirmCount, 30000);
  return () => clearInterval(interval);
}, []);

// 在菜单配置中
{
  name: '申请记录',
  path: '/application-records',
  icon: FileText,
  badge: pendingConfirmCount,
  badgeColor: pendingConfirmCount > 0 ? 'bg-blue-500' : undefined
}
```

## 注意事项

- 加载状态只影响申购记录部分，本地申请记录仍然即时显示
- 菜单提示标记每30秒更新一次，减少频繁查询数据库
- 提示标记只在用户有"已到货"状态的申购记录时显示
- 确认收货后，标记会自动消失（刷新页面或等待30秒更新）