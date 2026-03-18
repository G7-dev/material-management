// Unified inventory data for both LowStockAlert and ItemPermission
import { getStoredItems, type StoredItem } from '../utils/itemStore';

// Size variant interface
export interface SizeVariant {
  id: string;
  label: string;
  spec: string;
  stock: number;
}

// Unified inventory item interface
export interface UnifiedInventoryItem {
  id: number;
  name: string;
  category: string;
  spec: string;
  stock: number;
  threshold: number;
  unit: string;
  lastRestock: string;
  location: string;
  sizes: SizeVariant[];
  _storedId?: string;
}

// Static seed data - same as ItemPermission's STATIC_ITEMS
const STATIC_ITEMS: UnifiedInventoryItem[] = [
  {
    id: 1,
    name: '123',
    category: '办用品',
    spec: '规格: B-5',
    stock: 2,
    threshold: 5,
    unit: '个',
    lastRestock: '2026-03-15',
    location: '备件库存',
    sizes: [
      { id: 'A4', label: 'A4', spec: '297×210mm', stock: 2 },
      { id: 'A5', label: 'A5', spec: '210×148mm', stock: 0 },
      { id: 'B5', label: 'B5', spec: '257×182mm', stock: 5 },
      { id: 'B4', label: 'B4', spec: '364×257mm', stock: 1 },
    ],
  },
  {
    id: 2,
    name: '订书机',
    category: '办公用品',
    spec: '型号: B标准型',
    stock: 9,
    threshold: 5,
    unit: '个',
    lastRestock: '2026-03-10',
    location: '备件库存',
    sizes: [
      { id: 'mini', label: '迷你型', spec: '针10mm', stock: 3 },
      { id: 'standard', label: '标准型', spec: '针12mm', stock: 4 },
      { id: 'heavy', label: '重型', spec: '针23mm', stock: 2 },
    ],
  },
  {
    id: 3,
    name: 'U盘',
    category: '电子设备',
    spec: '规格: USB 3.0',
    stock: 22,
    threshold: 10,
    unit: '个',
    lastRestock: '2026-03-12',
    location: '备件库存',
    sizes: [
      { id: '32gb', label: '32GB', spec: 'USB 3.0', stock: 8 },
      { id: '64gb', label: '64GB', spec: 'USB 3.0', stock: 10 },
      { id: '128gb', label: '128GB', spec: 'USB 3.0', stock: 4 },
      { id: '256gb', label: '256GB', spec: 'USB 3.0', stock: 0 },
    ],
  },
  {
    id: 4,
    name: '文件夹',
    category: '办公用品',
    spec: '规格: 塑料 档案夹',
    stock: 30,
    threshold: 15,
    unit: '个',
    lastRestock: '2026-03-14',
    location: '备件库存',
    sizes: [
      { id: 'a4_thin', label: 'A4 薄', spec: '2cm背宽', stock: 13 },
      { id: 'a4_thick', label: 'A4 厚', spec: '4cm背宽', stock: 9 },
      { id: 'a3', label: 'A3', spec: '2cm背宽', stock: 8 },
    ],
  },
  {
    id: 5,
    name: 'A4打印纸',
    category: '办公用品',
    spec: '规格: 复印纸',
    stock: 110,
    threshold: 30,
    unit: '包',
    lastRestock: '2026-03-16',
    location: '备件库存',
    sizes: [
      { id: '70g', label: '70g', spec: '500张/包', stock: 40 },
      { id: '80g', label: '80g', spec: '500张/包', stock: 45 },
      { id: '90g', label: '90g', spec: '500张/包', stock: 25 },
    ],
  },
  {
    id: 6,
    name: '中性笔',
    category: '办公用品',
    spec: '规格: 墨蓝/黑/红',
    stock: 90,
    threshold: 30,
    unit: '支',
    lastRestock: '2026-03-11',
    location: '备件库存',
    sizes: [
      { id: '0.5mm_blue', label: '0.5mm 蓝', spec: '墨蓝色', stock: 30 },
      { id: '0.5mm_black', label: '0.5mm 黑', spec: '黑色', stock: 35 },
      { id: '0.5mm_red', label: '0.5mm 红', spec: '红色', stock: 25 },
      { id: '0.7mm_black', label: '0.7mm 黑', spec: '黑色', stock: 0 },
    ],
  },
  {
    id: 7,
    name: '55',
    category: '电子设备',
    spec: '规格: 123 | 213',
    stock: 0,
    threshold: 5,
    unit: '个',
    lastRestock: '2026-02-20',
    location: '备件库存',
    sizes: [
      { id: 's', label: 'S', spec: '小号', stock: 0 },
      { id: 'm', label: 'M', spec: '中号', stock: 0 },
    ],
  },
];

// Convert stored item to unified format
function storedToUnified(s: StoredItem, index: number): UnifiedInventoryItem {
  const qty = s.quantity;
  const thr = s.lowStockThreshold || 5; // default threshold
  return {
    id: 10000 + index,
    name: s.name,
    category: s.category,
    spec: [
      s.specModel && `型号: ${s.specModel}`,
      s.unit && `单位: ${s.unit}`,
    ].filter(Boolean).join(' | ') || '—',
    stock: qty,
    threshold: thr,
    unit: s.unit || '个',
    lastRestock: new Date().toLocaleDateString('zh-CN'),
    location: '备件库存',
    sizes: [
      {
        id: 'default',
        label: s.specModel || '标准',
        spec: s.unit || '—',
        stock: qty,
      },
    ],
    _storedId: s.id,
  };
}

// Get deleted items from localStorage
function getDeletedItemIds(): number[] {
  try {
    const raw = localStorage.getItem('deleted_inventory_items');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// Add item ID to deleted list
function addDeletedItemId(id: number): void {
  const deleted = getDeletedItemIds();
  if (!deleted.includes(id)) {
    deleted.push(id);
    localStorage.setItem('deleted_inventory_items', JSON.stringify(deleted));
  }
}

// Remove item ID from deleted list
function removeDeletedItemId(id: number): void {
  const deleted = getDeletedItemIds().filter(did => did !== id);
  localStorage.setItem('deleted_inventory_items', JSON.stringify(deleted));
}



// Delete item (static items are marked as deleted, stored items are actually deleted)
export function deleteInventoryItem(itemId: number): void {
  const target = getAllInventoryItems().find(i => i.id === itemId);
  if (target?._storedId) {
    // Actually delete from localStorage
    const { deleteStoredItem } = require('../utils/itemStore');
    deleteStoredItem(target._storedId);
  }
  // Mark as deleted (for static items)
  addDeletedItemId(itemId);
}

// Static item stock overrides (for static items)
const STATIC_STOCK_KEY = 'static_item_stock_overrides';

function getStaticStockOverrides(): Record<number, number> {
  try {
    const raw = localStorage.getItem(STATIC_STOCK_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setStaticStockOverride(itemId: number, stock: number): void {
  const overrides = getStaticStockOverrides();
  overrides[itemId] = stock;
  localStorage.setItem(STATIC_STOCK_KEY, JSON.stringify(overrides));
}

// Update item stock (both stored and static items)
export function updateItemStock(itemId: number, newStock: number): void {
  const target = getAllInventoryItems().find(i => i.id === itemId);
  if (target?._storedId) {
    updateStoredItemStock(target._storedId, newStock);
  } else {
    // Static item - update override
    setStaticStockOverride(itemId, newStock);
  }
}

// Get all inventory items (static + uploaded, excluding deleted) with stock overrides applied
export function getAllInventoryItems(): UnifiedInventoryItem[] {
  const custom = getStoredItems().map((s, i) => storedToUnified(s, i));
  const deletedIds = getDeletedItemIds();
  const stockOverrides = getStaticStockOverrides();
  
  const all = [...STATIC_ITEMS, ...custom].map(item => {
    if (stockOverrides[item.id] !== undefined) {
      return { ...item, stock: stockOverrides[item.id] };
    }
    return item;
  });
  
  return all.filter(item => !deletedIds.includes(item.id));
}

// Get severity level
export { getSeverity, SEVERITY_CONFIG } from './inventoryData';
export type { Severity } from './inventoryData';
