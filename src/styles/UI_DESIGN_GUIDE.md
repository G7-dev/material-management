# 物资管理系统 - UI设计规范

## 设计目标
统一员工端和管理员端的视觉风格，确保双端在色彩搭配、字体规范、组件样式及交互逻辑的高度一致，提供丝滑流畅的用户体验。

## 设计原则

### 1. 一致性原则
- **色彩统一**: 双端使用相同的色彩系统
- **字体统一**: 统一的字体大小、字重、行高
- **组件统一**: 相同的组件样式和交互行为
- **间距统一**: 统一的间距系统

### 2. 现代化设计
- 采用明亮、简洁的现代风格
- 使用渐变色彩增强视觉层次
- 卡片式布局提升信息展示效果
- 圆角设计增加亲和力

### 3. 用户体验优先
- 清晰的视觉层次
- 直观的操作流程
- 流畅的过渡动画
- 快速的页面加载

## 色彩系统

### 主色调
```css
--primary-color: #1890ff;        /* 科技蓝 - 主品牌色 */
--primary-light: #40a9ff;        /* 浅蓝 */
--primary-dark: #096dd9;         /* 深蓝 */
```

### 辅助色彩
```css
--success-color: #52c41a;        /* 成功绿 */
--warning-color: #faad14;        /* 警告橙 */
--error-color: #ff4d4f;          /* 错误红 */
--info-color: #722ed1;           /* 信息紫 */
```

### 中性色
```css
--white: #ffffff;
--gray-1: #fafafa;
--gray-2: #f5f7fa;               /* 页面背景 */
--gray-3: #f0f2f5;
--gray-4: #e8e8e8;
--gray-5: #d9d9d9;
--gray-6: #bfbfbf;
--gray-7: #8c8c8c;
--gray-8: #595959;
--gray-9: #434343;
--gray-10: #262626;              /* 主要文字 */
--black: #000000;
```

### 渐变色系
```css
--gradient-primary: linear-gradient(135deg, #1890ff 0%, #722ed1 100%);
--gradient-success: linear-gradient(135deg, #52c41a 0%, #73d13d 100%);
--gradient-warning: linear-gradient(135deg, #faad14 0%, #ffc53d 100%);
--gradient-error: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
```

## 字体系统

### 字体大小
```css
--font-size-xs: 11px;            /* 辅助信息 */
--font-size-sm: 12px;            /* 小字 */
--font-size-base: 14px;          /* 正文 */
--font-size-md: 15px;            /* 中等 */
--font-size-lg: 16px;            /* 标题 */
--font-size-xl: 18px;            /* 大标题 */
--font-size-2xl: 20px;
--font-size-3xl: 24px;
```

### 字重
```css
--font-weight-normal: 400;       /* 常规 */
--font-weight-medium: 500;       /* 中等 */
--font-weight-semibold: 600;     /* 半粗 */
--font-weight-bold: 700;         /* 粗体 */
```

### 行高
```css
--line-height-tight: 1.4;        /* 紧凑 */
--line-height-base: 1.5;         /* 标准 */
--line-height-relaxed: 1.6;      /* 宽松 */
```

## 阴影系统

```css
--shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.03);
--shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.06);
--shadow-base: 0 2px 8px rgba(0, 0, 0, 0.08);    /* 基础卡片 */
--shadow-md: 0 4px 12px rgba(0, 0, 0, 0.1);     /* 悬停效果 */
--shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.12);    /* 重要元素 */
--shadow-xl: 4px 0 20px rgba(24, 144, 255, 0.15); /* 侧边栏 */
```

## 圆角系统

```css
--radius-xs: 2px;                /* 小圆角 */
--radius-sm: 4px;                /* 输入框 */
--radius-base: 6px;              /* 按钮 */
--radius-md: 8px;                /* 卡片 */
--radius-lg: 10px;               /* 大卡片 */
--radius-xl: 16px;               /* 登录卡片 */
--radius-round: 9999px;          /* 圆形 */
```

## 间距系统

```css
--spacing-xs: 4px;               /* 最小间距 */
--spacing-sm: 8px;               /* 小组件间距 */
--spacing-base: 12px;            /* 基础间距 */
--spacing-md: 16px;              /* 组件内间距 */
--spacing-lg: 20px;              /* 组件间距 */
--spacing-xl: 24px;              /* 区域间距 */
--spacing-2xl: 32px;             /* 大区域 */
--spacing-3xl: 48px;             /* 页面边距 */
```

## 布局规范

### 页面容器
```css
.page-container {
  padding: var(--spacing-lg);
  background: var(--bg-primary);
  min-height: 100%;
}
```

### 卡片容器
```css
.card-container {
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-base);
  overflow: hidden;
  transition: all var(--duration-base) var(--ease-out);
}

.card-container:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}
```

### 响应式断点
- **移动端**: < 768px
- **平板端**: 768px - 1024px
- **桌面端**: > 1024px

## 组件样式

### 按钮
```css
.btn-primary {
  background: var(--gradient-primary) !important;
  border: none !important;
  border-radius: var(--radius-base) !important;
  font-weight: var(--font-weight-medium) !important;
  transition: all var(--duration-base) var(--ease-out) !important;
}

.btn-primary:hover {
  transform: translateY(-2px) !important;
  box-shadow: var(--shadow-md) !important;
}
```

### 标签
```css
.tag-primary {     /* 主要标签 */
  background: rgba(24, 144, 255, 0.1);
  border-color: var(--primary-color);
  color: var(--primary-color);
}

tag-success {       /* 成功标签 */
  background: rgba(82, 196, 26, 0.1);
  border-color: var(--success-color);
  color: var(--success-color);
}

tag-warning {       /* 警告标签 */
  background: rgba(250, 173, 20, 0.1);
  border-color: var(--warning-color);
  color: var(--warning-color);
}

tag-error {         /* 错误标签 */
  background: rgba(255, 77, 79, 0.1);
  border-color: var(--error-color);
  color: var(--error-color);
}
```

## 动画系统

### 动画时长
```css
--duration-fast: 0.2s;           /* 快速 */
--duration-base: 0.3s;           /* 标准 */
--duration-slow: 0.5s;           /* 缓慢 */
```

### 缓动函数
```css
--ease-in: cubic-bezier(0.4, 0, 1, 1);                    /* 加速 */
--ease-out: cubic-bezier(0, 0, 0.2, 1);                   /* 减速 */
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);              /* 先加速后减速 */
--ease-standard: cubic-bezier(0.645, 0.045, 0.355, 1);    /* 标准曲线 */
```

## 已完成的统一工作

### 1. 布局统一 ✅
- [x] 员工端和管理员端采用相同的布局结构
- [x] 统一的侧边栏宽度（280px）
- [x] 统一的顶部导航栏高度（64px）
- [x] 相同的背景色（#f5f7fa）

### 2. 色彩统一 ✅
- [x] 主色调统一为科技蓝（#1890ff）
- [x] 相同的渐变风格
- [x] 统一的状态颜色（success、warning、error、info）

### 3. 字体统一 ✅
- [x] 相同的字体族
- [x] 统一的标题层级和大小
- [x] 一致的字体权重

### 4. 组件统一 ✅
- [x] 按钮样式统一
- [x] 卡片样式统一
- [x] 标签样式统一
- [x] 表单组件统一

### 5. 交互统一 ✅
- [x] 相同的悬停效果
- [x] 一致的点击反馈
- [x] 统一的过渡动画

### 6. 性能优化 ✅
- [x] 移除沉重的Cyberpunk动画
- [x] 优化页面加载速度
- [x] 减少不必要的动画效果

### 7. 文件清理 ✅
- [x] 删除cyberpunk.css文件
- [x] 创建design-tokens.css统一管理设计变量
- [x] 创建animations.css统一管理动画

## 后续优化建议

1. **图标统一**: 考虑使用统一的图标库（如Ant Design Icons）
2. **插画风格**: 如需添加插画，保持统一的插画风格
3. **加载动画**: 统一所有页面的加载动画
4. **错误页面**: 统一404、500等错误页面的设计
5. **空状态**: 统一空状态的展示样式

## 浏览器兼容性

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## 设计资源

- 主色卡: `#1890ff` (科技蓝)
- 辅助色: `#52c41a` (成功绿), `#faad14` (警告橙), `#ff4d4f` (错误红)
- 背景色: `#f5f7fa` (浅灰背景)
- 文字色: `#262626` (主要文字)

## 版本记录

- v1.0 (2024-03-17): 初始版本，统一双端UI风格
