export interface InventoryItem {
  id: number;
  name: string;
  category: string;
  spec: string;
  stock: number;
  threshold: number;
  unit: string;
  lastRestock: string;
  location: string;
}

export const inventoryItems: InventoryItem[] = [
  { id: 1,  name: 'A4打印纸',   category: '办公用品', spec: '规格: 90g',           stock: 3,  threshold: 10, unit: '包', lastRestock: '2026-03-10', location: '备件库A-01' },
  { id: 2,  name: '中性笔',     category: '办公用品', spec: '规格: 蓝色 0.5mm',    stock: 8,  threshold: 20, unit: '支', lastRestock: '2026-03-05', location: '备件库A-02' },
  { id: 3,  name: 'U盘 64G',    category: '电子设备', spec: '规格: 64GB USB 3.0', stock: 0,  threshold: 5,  unit: '个', lastRestock: '2026-02-20', location: '备件库B-01' },
  { id: 4,  name: '订书机',     category: '办公用品', spec: '型号: B标准型',        stock: 2,  threshold: 5,  unit: '个', lastRestock: '2026-03-01', location: '备件库A-03' },
  { id: 5,  name: '文件夹',     category: '办公用品', spec: '规格: 塑料档案夹',     stock: 13, threshold: 10, unit: '个', lastRestock: '2026-03-12', location: '备件库A-04' },
  { id: 6,  name: '剪刀',       category: '办公用品', spec: '规格: 不锈钢',         stock: 5,  threshold: 8,  unit: '把', lastRestock: '2026-02-28', location: '备件库A-05' },
  { id: 7,  name: '固体胶',     category: '办公用品', spec: '规格: 40g',           stock: 4,  threshold: 15, unit: '支', lastRestock: '2026-03-08', location: '备件库A-06' },
  { id: 8,  name: '计算器',     category: '电子设备', spec: '规格: 12位',          stock: 1,  threshold: 3,  unit: '个', lastRestock: '2026-01-15', location: '备件库B-02' },
  { id: 9,  name: '便利贴',     category: '办公用品', spec: '规格: 76×76mm',      stock: 20, threshold: 30, unit: '本', lastRestock: '2026-03-14', location: '备件库A-07' },
  { id: 10, name: '白板笔',     category: '办公用品', spec: '规格: 黑/红/蓝',      stock: 6,  threshold: 10, unit: '支', lastRestock: '2026-03-11', location: '备件库A-08' },
  { id: 11, name: '鼠标垫',     category: '电子设备', spec: '规格: 标准尺寸',       stock: 0,  threshold: 5,  unit: '个', lastRestock: '2026-02-10', location: '备件库B-03' },
  { id: 12, name: '打印机墨盒', category: '耗材',     spec: '型号: HP 803',        stock: 2,  threshold: 4,  unit: '个', lastRestock: '2026-03-03', location: '备件库C-01' },
];

export type Severity = 'empty' | 'critical' | 'warning' | 'normal';

export function getSeverity(stock: number, threshold: number): Severity {
  if (stock === 0) return 'empty';
  if (stock <= Math.ceil(threshold * 0.3)) return 'critical';
  if (stock <= threshold) return 'warning';
  return 'normal';
}

export const SEVERITY_CONFIG = {
  empty:    { label: '缺货',  color: 'text-red-600',   bg: 'bg-red-500/10',    border: 'border-red-500/20',    bar: '#ef4444' },
  critical: { label: '危险',  color: 'text-orange-600', bg: 'bg-orange-500/10', border: 'border-orange-500/20', bar: '#f97316' },
  warning:  { label: '预警',  color: 'text-amber-600',  bg: 'bg-amber-500/10',  border: 'border-amber-500/20',  bar: '#f59e0b' },
  normal:   { label: '正常',  color: 'text-emerald-600', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', bar: '#10b981' },
};
