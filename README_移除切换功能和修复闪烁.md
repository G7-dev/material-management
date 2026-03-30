# 移除切换用户功能和修复菜单闪烁

## 变更内容

### 1. 删除"切换到用户"功能

**修改前：**
```tsx
{isAdmin && (
  <div className="mt-6 pt-4 border-t border-border">
    <Link
      to="/"
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200"
    >
      <LayoutDashboard className="w-4 h-4" />
      <span className="text-sm font-medium">切换到用户</span>
    </Link>
  </div>
)}
```

**修改后：**
- 删除了整个`isAdmin`条件下的"切换到用户"区块
- 保留`!isAdmin && userRole === 'admin'`条件下的"切换到管理"功能

### 2. 修复菜单闪烁问题

**问题描述：**
- 登录管理员账号时，先显示员工菜单（约1秒）
- 然后才切换到管理员菜单
- 造成界面闪烁和不良用户体验

**问题根源：**
```tsx
// 初始状态
const [userRole, setUserRole] = useState<string | null>(null);
// userRole = null, isAdmin = false
// 渲染员工菜单

// 1秒后获取到真实角色
setUserRole('admin');
// isAdmin = true
// 重新渲染管理员菜单
```

**解决方案：**

1. **添加加载状态**
```tsx
const [isLoading, setIsLoading] = useState(true);
```

2. **在获取角色后关闭加载状态**
```tsx
useEffect(() => {
  const getUserInfo = async () => {
    try {
      // ... 获取用户信息
      setUserRole(profile?.role || null);
    } catch (error) {
      console.error('Failed to get user info:', error);
    } finally {
      setIsLoading(false);  // ← 关键：获取完成后关闭加载
    }
  };

  getUserInfo();
}, []);
```

3. **加载时不渲染菜单**
```tsx
{isLoading ? (
  <div className="flex-1 flex items-center justify-center">
    <div className="flex items-center gap-2 text-muted-foreground">
      <div className="w-4 h-4 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
      <span className="text-sm">加载中...</span>
    </div>
  </div>
) : (
  <nav className="flex-1 p-4 overflow-y-auto">
    {/* 渲染菜单 */}
  </nav>
)}
```

## 修改文件

- `src/app/components/Sidebar.tsx` - 移除切换功能并修复闪烁

## 优化后的行为

### 登录管理员账号

1. **显示加载状态**（旋转动画）
   ```
   加载中...
   ```

2. **获取角色信息**（约0.5-1秒）
   - 查询 Supabase profiles 表
   - 获取 role 字段

3. **直接显示管理员菜单**
   - 不再显示员工菜单
   - 无闪烁切换
   - 用户体验流畅

### 登录普通员工账号

1. **显示加载状态**
2. **获取角色信息**
3. **直接显示员工菜单**

### 普通员工但角色是 admin

- 显示员工菜单
- 底部显示"切换到管理"链接
- 点击后跳转到管理界面

## 相关变更

### 保留的功能
- ✅ 管理员登录显示管理功能菜单
- ✅ 员工登录显示物资操作菜单
- ✅ 员工账号但有 admin 角色时可"切换到管理"
- ✅ 所有菜单提示标记（低库存、待审批、待确认）
- ✅ 用户信息显示
- ✅ 退出登录

### 删除的功能
- ❌ 管理员界面的"切换到用户"（不再需要）

## 测试验证

### 测试场景 1：管理员登录
1. [ ] 使用管理员账号登录
2. [ ] 验证侧边栏显示"加载中..."
3. [ ] 验证加载完成后直接显示管理功能菜单
4. [ ] 验证菜单项：管理平台、批量注册、物品上架、物品补货、低库存预警、申购管理、审批管理
5. [ ] 验证底部没有"切换到用户"链接
6. [ ] 验证用户信息显示"系统管理员"

### 测试场景 2：普通员工登录
1. [ ] 使用普通员工账号登录
2. [ ] 验证侧边栏显示"加载中..."
3. [ ] 验证加载完成后直接显示物资操作菜单
4. [ ] 验证菜单项：工作台、日常领用、物品申购、申请记录
5. [ ] 验证底部没有"切换到管理"链接（因为 userRole 不是 admin）
6. [ ] 验证用户信息显示正确的用户名

### 测试场景 3：员工账号但角色是 admin
1. [ ] 使用员工账号登录（但该用户在 profiles 表的 role 字段为 'admin'）
2. [ ] 验证显示物资操作菜单
3. [ ] 验证底部显示"切换到管理"链接
4. [ ] 点击"切换到管理"
5. [ ] 验证跳转到管理界面

### 测试场景 4：菜单提示标记
1. [ ] 创建低库存物品（库存低于预警值）
2. [ ] 验证"低库存预警"菜单显示琥珀色标记
3. [ ] 创建待审批申购记录
4. [ ] 验证"申购管理"和"审批管理"显示红色标记
5. [ ] 创建到货通知（arrival_notified）记录
6. [ ] 验证"申请记录"显示蓝色标记

## 性能优化

### 加载时间优化
- 角色查询使用单列索引：`profiles(id, role)`
- 减少不必要的数据传输
- 使用 `select('role, full_name, username')` 只查询需要的字段

### 渲染优化
- 加载状态使用轻量级动画
- 避免不必要的重渲染
- 菜单项使用稳定的 key

## 版本信息

- **修改日期**: 2026年3月19日
- **版本**: v1.2.0
- **变更类型**: 功能优化和用户体验改进
- **影响范围**: 登录流程和侧边栏菜单

## 注意事项

1. **首次登录加载**：首次登录时会有约0.5-1秒的加载时间，这是正常的（查询数据库）
2. **缓存考虑**：如果用户角色不会频繁变更，可以考虑缓存角色信息减少查询
3. **错误处理**：如果获取角色失败，默认显示员工菜单（安全考虑）
4. **权限控制**：前端菜单仅做展示控制，真正的权限控制应在后端API实现