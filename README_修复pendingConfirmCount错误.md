# 修复 pendingConfirmCount 未定义错误

## 错误描述

登录时出现错误：`pendingConfirmCount is not defined`

## 错误原因

在 `src/app/components/Sidebar.tsx` 中，代码引用了 `pendingConfirmCount` 变量，但未正确定义：

1. **缺少 state 定义**：没有使用 `useState` 定义 `pendingConfirmCount`
2. **缺少更新函数**：没有定义 `getPendingConfirmCount` 函数
3. **缺少 useEffect**：没有添加更新 `pendingConfirmCount` 的副作用
4. **存在未使用的常量**：存在未使用的 `userNavItems` 常量

## 修复内容

### 1. 添加 state 定义

```typescript
// 修改前
const [pendingCount, setPendingCount] = useState(0);
const [userRole, setUserRole] = useState<string | null>(null);
const [userName, setUserName] = useState<string>('当前用户');

// 修改后
const [pendingCount, setPendingCount] = useState(0);
const [pendingConfirmCount, setPendingConfirmCount] = useState(0);  // 新增
const [userRole, setUserRole] = useState<string | null>(null);
const [userName, setUserName] = useState<string>('当前用户');
```

### 2. 添加 getPendingConfirmCount 函数

```typescript
// 新增函数
const getPendingConfirmCount = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;
    
    const { count } = await supabase
      .from('requisitions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'arrival_notified');
    
    return count || 0;
  } catch (error) {
    console.error('Failed to get pending confirm count:', error);
    return 0;
  }
};
```

### 3. 添加更新 useEffect

```typescript
// 新增 useEffect
useEffect(() => {
  const updateConfirmCount = async () => {
    const count = await getPendingConfirmCount();
    setPendingConfirmCount(count);
  };
  
  updateConfirmCount();
  const interval = setInterval(updateConfirmCount, 30000); // 每30秒更新一次
  return () => clearInterval(interval);
}, []);
```

### 4. 删除未使用的常量

```typescript
// 删除以下未使用的常量
const userNavItems: NavItem[] = [
  { name: '工作台', path: '/', icon: LayoutDashboard },
  { name: '日常领用', path: '/daily-collection', icon: Package },
  { name: '物品申购', path: '/item-purchase', icon: ShoppingCart },
  { name: '申请记录', path: '/application-records', icon: FileText },
];
```

## 验证修复

### 测试步骤

1. **重新构建应用**
   ```bash
   npm run build
   ```

2. **启动开发服务器**
   ```bash
   npm run dev
   ```

3. **登录系统**
   - 访问登录页面
   - 输入用户名和密码
   - 验证是否成功登录，不再出现错误

4. **验证菜单提示**
   - 登录后查看侧边栏
   - 如果存在状态为 `arrival_notified` 的申购记录，"申请记录"菜单旁应显示蓝色数字标记
   - 标记数字表示待确认的到货记录数量

5. **验证数据加载**
   - 点击"申请记录"菜单
   - 验证是否正常加载申请记录列表
   - 验证是否显示加载动画

### 预期结果

- ✅ 登录成功，不再出现 `pendingConfirmCount is not defined` 错误
- ✅ 侧边栏正常显示，所有菜单项可点击
- ✅ "申请记录"菜单旁显示正确的待确认数量标记（如果有）
- ✅ 申请记录页面正常加载数据

## 相关文件

- `src/app/components/Sidebar.tsx` - 修复的组件文件

## 错误根源分析

此错误是由于代码重构不完整导致的：

1. 在添加"申请记录"菜单提示功能时，只添加了变量引用
2. 忘记添加变量的 state 定义
3. 忘记添加更新变量的逻辑函数
4. 留下未使用的旧代码

**教训**：在进行代码重构时，必须确保所有引用的变量都有完整的定义和更新逻辑。

## 版本信息

- **修复日期**: 2026年3月19日
- **修复版本**: v1.1.1
- **错误级别**: 严重（导致无法登录）
- **影响范围**: 所有用户登录功能