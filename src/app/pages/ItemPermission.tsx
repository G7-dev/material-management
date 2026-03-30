import { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw, Search, Filter, Package, X,
  PackagePlus, CheckCircle2, AlertTriangle,
  TrendingUp, Layers, Sparkles,
  Trash2, Download,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { AppSelect } from '../components/ui/app-select';
import * as XLSX from 'xlsx';
import {
  fetchMaterials, restockMaterial, deleteMaterial,
  type Material, type MaterialSize,
} from '../utils/materialsDB';
import { invalidateMaterialCache } from '../utils/cache';

// ── Interfaces ────────────────────────────────────────────────────────────────

interface SizeVariant {
  id: string;
  label: string;
  spec: string;
  stock: number;
}

interface Item {
  id: string;
  name: string;
  category: string;
  spec: string;
  tags: string[];
  stock: number;
  unit_price: number;
  item_code: string;
  status: string;
  sizes: SizeVariant[];
  image?: string;
  safe_stock: number;
}

// ── Per-item per-size stock map ───────────────────────────────────────────────

type SizeStockMap = Record<string, Record<string, number>>;

// ── Size Preview Grid ─────────────────────────────────────────────────────────

interface SizePreviewGridProps {
  item: Item;
  sizeStock: Record<string, number>;
  selectedSizeId: string;
  onSelectSize: (id: string) => void;
}

function SizePreviewGrid({ item, sizeStock, selectedSizeId, onSelectSize }: SizePreviewGridProps) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-3">
        <Layers className="w-3.5 h-3.5 text-primary" />
        <span className="text-sm font-medium text-foreground">各规格库存预览</span>
      </div>
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${Math.min(item.sizes.length, 4)}, 1fr)` }}
      >
        {item.sizes.map(sv => {
          const qty       = sizeStock[sv.id] ?? sv.stock;
          const isEmpty   = qty === 0;
          const isLow     = qty > 0 && qty <= 2;
          const isSelected = selectedSizeId === sv.id;

          return (
            <button
              key={sv.id}
              onClick={() => onSelectSize(sv.id)}
              className={`flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl border transition-all duration-200 text-center ${
                isSelected
                  ? 'border-primary/60 bg-primary/8 shadow-sm ring-2 ring-primary/20'
                  : isEmpty
                    ? 'border-red-500/25 bg-red-500/4 hover:border-red-500/40'
                    : isLow
                      ? 'border-amber-500/25 bg-amber-500/4 hover:border-amber-500/40'
                      : 'border-border bg-muted/30 hover:border-primary/30 hover:bg-primary/4'
              }`}
            >
              <span className={`text-xs font-semibold leading-none ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                {sv.label}
              </span>
              <span className={`text-base font-bold leading-none ${
                isEmpty    ? 'text-red-500'   :
                isLow      ? 'text-amber-500' :
                isSelected ? 'text-primary'   :
                'text-emerald-600'
              }`}>
                {qty}
              </span>
              <span className="text-[10px] text-muted-foreground leading-none">件</span>
              <span className={`w-1.5 h-1.5 rounded-full ${
                isEmpty ? 'bg-red-500' : isLow ? 'bg-amber-500' : 'bg-emerald-500'
              }`} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Restock Modal ─────────────────────────────────────────────────────────────

interface RestockModalProps {
  item: Item;
  sizeStock: Record<string, number>;
  onClose: () => void;
  onConfirm: (itemId: string, sizeId: string, quantity: number) => void;
}

function RestockModal({ item, sizeStock, onClose, onConfirm }: RestockModalProps) {
  const [selectedSize, setSelectedSize] = useState<SizeVariant | null>(
    item.sizes.length === 1 ? item.sizes[0] : null
  );
  const [quantity, setQuantity] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const qty        = parseInt(quantity) || 0;
  const currentQty = selectedSize ? (sizeStock[selectedSize.id] ?? selectedSize.stock) : 0;
  const afterStock = currentQty + qty;

  const canConfirm = selectedSize && qty > 0 && !submitting;

  const handleConfirm = async () => {
    if (!canConfirm) return;
    setSubmitting(true);
    await onConfirm(item.id, selectedSize.id, qty);
    setSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <Card className="w-full max-w-lg border-border shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <PackagePlus className="w-4.5 h-4.5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">物品补货</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                为 <span className="text-primary font-medium">{item.name}</span> 补充库存
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Size Preview Grid */}
          <SizePreviewGrid
            item={item}
            sizeStock={sizeStock}
            selectedSizeId={selectedSize?.id ?? ''}
            onSelectSize={id => {
              const sv = item.sizes.find(s => s.id === id) ?? null;
              setSelectedSize(sv);
              setQuantity('');
            }}
          />

          {/* Form fields - compact layout */}
          <div className="space-y-3">
            {/* 补货数量 */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                补货数量 <span className="text-destructive">*</span>
                {selectedSize && (
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    当前：{currentQty} 件
                  </span>
                )}
              </label>
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="请输入本次补货数量"
                className="h-10 bg-muted/50 border-border"
                disabled={!selectedSize}
              />
            </div>

            {/* After-stock preview */}
            {selectedSize && qty > 0 && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-emerald-500/8 border border-emerald-500/20">
                <TrendingUp className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <p className="text-sm text-emerald-700">
                  <span className="font-semibold">{selectedSize.label}</span> 补货后库存将变为{' '}
                  <span className="font-semibold">{afterStock} 件</span>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 pt-0">
          <Button
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="flex-1 h-11 bg-gradient-to-r from-primary to-secondary hover:shadow-lg hover:shadow-primary/25 disabled:opacity-50 transition-all"
          >
            <PackagePlus className="w-4 h-4 mr-2" />
            {submitting ? '补货中...' : '确认补货'}
          </Button>
          <Button variant="outline" onClick={onClose} className="px-6 h-11 border-border">
            取消
          </Button>
        </div>
      </Card>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function ItemPermission() {
  const [searchQuery, setSearchQuery]   = useState('');
  const [selectedTab, setSelectedTab]   = useState('all');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [restockedIds, setRestockedIds] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<Item | null>(null);
  const [deletedIds, setDeletedIds]     = useState<string[]>([]);
  const [selectedSizesToDelete, setSelectedSizesToDelete] = useState<Set<string>>(new Set());
  const [deleting, setDeleting]         = useState(false);
  const [loading, setLoading]           = useState(false);

  // Dynamic item list from Supabase
  const [allItems, setAllItems] = useState<Item[]>([]);

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      invalidateMaterialCache();
      const materials = await fetchMaterials(false);
      const items: Item[] = materials
        .filter(m => m.status === 'active')
        .map(m => {
          const hasSizes = m.sizes && m.sizes.length > 0;
          const sizes: SizeVariant[] = hasSizes
            ? m.sizes.map(s => ({ id: s.id, label: s.label, spec: s.spec, stock: s.stock }))
            : [{ id: 'default', label: m.specification || '标准', spec: m.specification || '', stock: m.stock }];

          const totalStock = sizes.reduce((sum, s) => sum + s.stock, 0);
          const status = totalStock === 0 ? 'issued' : (m.safe_stock > 0 && totalStock <= m.safe_stock ? 'low' : 'available');

          return {
            id: m.id,
            name: m.name,
            category: m.category || '未分类',
            spec: m.specification ? `规格: ${m.specification}` : '—',
            tags: totalStock === 0 ? ['已发'] : (m.safe_stock > 0 && totalStock <= m.safe_stock ? ['可用库存', '低库存'] : ['可用库存']),
            stock: totalStock,
            unit_price: m.unit_price || 0,
            item_code: m.item_code || '',
            status,
            sizes,
            image: m.image_url || undefined,
            safe_stock: m.safe_stock,
          };
        });
      setAllItems(items);
    } catch (error) {
      console.error('Failed to load items:', error);
      setAllItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
    window.addEventListener('inventoryUpdated', loadItems);
    return () => {
      window.removeEventListener('inventoryUpdated', loadItems);
    };
  }, [loadItems]);

  // Per-item per-size stock map
  const [sizeStockData, setSizeStockData] = useState<SizeStockMap>({});

  const refresh = useCallback(() => {
    loadItems();
  }, [loadItems]);

  const handleRestock = async (itemId: string, sizeId: string, quantity: number) => {
    const item = allItems.find(i => i.id === itemId);
    if (!item) return;

    const isDefaultSize = sizeId === 'default';
    const sizeIdOrNull = isDefaultSize ? null : sizeId;

    const result = await restockMaterial(itemId, sizeIdOrNull, quantity, `${item.name} 手动补货`);
    if (result.success) {
      setRestockedIds(prev => [...prev, itemId]);
      setTimeout(() => {
        setRestockedIds(prev => prev.filter(id => id !== itemId));
      }, 3000);
      loadItems();
    }
  };

  const handleDelete = async (itemId: string) => {
    const success = await deleteMaterial(itemId);
    if (success) {
      setDeletedIds(prev => [...prev, itemId]);
      setTimeout(() => {
        setDeletedIds(prev => prev.filter(id => id !== itemId));
      }, 3000);
      loadItems();
    }
  };

  const getTotalStock = (item: Item) =>
    item.sizes.reduce((sum, s) => sum + (sizeStockData[item.id]?.[s.id] ?? s.stock), 0);

  const isAnyLow = (item: Item) =>
    item.sizes.some(s => (sizeStockData[item.id]?.[s.id] ?? s.stock) <= 2);

  // Merge items with same name into one item with multiple size variants
  const mergedItems = (() => {
    const itemMap = new Map<string, Item>();

    allItems.forEach(item => {
      if (deletedIds.includes(item.id)) return;

      const existingItem = itemMap.get(item.name);
      if (existingItem) {
        // 从 specification 字段提取实际规格名
        const specLabel = item.spec !== '—' && item.spec.startsWith('规格: ')
          ? item.spec.replace('规格: ', '')
          : item.spec !== '—' ? item.spec : '默认';
        const newSize: SizeVariant = {
          id: `size_${existingItem.sizes.length}`,
          label: specLabel,
          spec: specLabel,
          stock: getTotalStock(item),
        };
        existingItem.sizes.push(newSize);
        if (item.image && !existingItem.image) {
          existingItem.image = item.image;
        }
      } else {
        const specLabel = item.spec !== '—' && item.spec.startsWith('规格: ')
          ? item.spec.replace('规格: ', '')
          : item.spec !== '—' ? item.spec : '默认';
        const newItem: Item = {
          ...item,
          sizes: item.sizes && item.sizes.length > 0
            ? [...item.sizes]
            : [{
                id: 'default',
                label: specLabel,
                spec: specLabel,
                stock: getTotalStock(item)
              }]
        };
        itemMap.set(item.name, newItem);
      }
    });

    return Array.from(itemMap.values());
  })();

  const filteredItems = mergedItems.filter(item => {
    const matchSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.spec.toLowerCase().includes(searchQuery.toLowerCase());
    const matchTab =
      selectedTab === 'all' ||
      (selectedTab === 'office'       && item.category === '办公类') ||
      (selectedTab === 'electronics'  && item.category === '劳保类') ||
      (selectedTab === 'custom'       && item.tags && item.tags.includes('新上架'));
    return matchSearch && matchTab;
  });

  const officeCount      = allItems.filter(i => i.category === '办公类').length;
  const electronicsCount = allItems.filter(i => i.category === '劳保类').length;
  const customCount      = allItems.filter(i => i.tags && i.tags.includes('新上架')).length;
  const lowStockCount    = allItems.filter(i => isAnyLow(i)).length;

  // Export to Excel
  const exportToExcel = (items: Item[]) => {
    const data = items.map((item, index) => {
      const totalStock = getTotalStock(item);
      const hasLow = isAnyLow(item);
      const status = totalStock === 0 ? '已发' : hasLow ? '低库存' : '正常';
      
      // 合并规格和库存信息
      const sizeDetails = item.sizes.map(s => `${s.label}: ${s.stock}件`).join(', ');
      
      return {
        '序号': index + 1,
        '物品名称': item.name,
        '分类': item.category,
        '规格详情': sizeDetails || '-',
        '总库存': `${totalStock}件`,
        '单价': item.unit_price ? `¥${item.unit_price}` : '-',
        '物品编码': item.item_code || '-',
        '状态': status,
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '物品补货清单');
    
    // 设置列宽
    const colWidths = [
      { wch: 6 },   // 序号
      { wch: 20 },  // 物品名称
      { wch: 12 },  // 分类
      { wch: 40 },  // 规格详情
      { wch: 10 },  // 总库存
      { wch: 10 },  // 单价
      { wch: 15 },  // 物品编码
      { wch: 10 },  // 状态
    ];
    ws['!cols'] = colWidths;
    
    // 导出文件
    const timestamp = new Date().toLocaleDateString('zh-CN').replace(/\//g, '-');
    XLSX.writeFile(wb, `物品补货清单_${timestamp}.xlsx`);
    
    toast.success('Excel导出成功！');
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <RefreshCw className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-3xl font-semibold text-foreground tracking-tight">物品补货</h1>
          </div>
          <p className="text-muted-foreground mt-1">查看库存状态并对不足物品进行补货操作</p>
        </div>
        <div className="flex items-center gap-3">
          {lowStockCount > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/8 border border-amber-500/20">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span className="text-sm text-amber-700 font-medium">{lowStockCount} 件库存不足</span>
            </div>
          )}
          <Button
            variant="outline"
            className="gap-2 h-10 border-border"
            onClick={refresh}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <Card className="p-4 border-border">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="请输入物品名称、分类或规格搜索..."
              className="pl-10 h-10 bg-muted/50 border-border"
            />
          </div>
          <Button variant="outline" className="gap-2 h-10 border-border">
            <Filter className="w-4 h-4" />
            筛选
          </Button>
          <Button
            variant="outline"
            className="gap-2 h-10 border-border"
            onClick={() => exportToExcel(filteredItems)}
          >
            <Download className="w-4 h-4" />
            导出Excel
          </Button>
        </div>
        <div className="flex gap-2 mt-4 pt-4 border-t border-border flex-wrap">
          {[
            { key: 'all',         label: `全部物资 (${allItems.length})` },
            { key: 'office',      label: `办公类 (${officeCount})`      },
            { key: 'electronics', label: `劳保类 (${electronicsCount})` },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setSelectedTab(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                selectedTab === tab.key
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Empty state */}
      {filteredItems.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
            <Package className="w-8 h-8 text-muted-foreground/50" />
          </div>
          <p className="text-foreground font-medium mb-1">暂无匹配物品</p>
          <p className="text-sm text-muted-foreground">
            {searchQuery
              ? `未找到包含「${searchQuery}」的物品`
              : '该分类下暂无物品，可前往「物品上架」添加'}
          </p>
        </div>
      )}

      {/* Skeleton Loading */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="p-5 border-border animate-pulse">
              <div className="w-full h-32 rounded-xl bg-muted/50 mb-4" />
              <div className="h-4 w-24 rounded bg-muted/50 mb-2" />
              <div className="h-3 w-32 rounded bg-muted/40 mb-3" />
              <div className="space-y-2 mb-4">
                <div className="h-3 w-20 rounded bg-muted/40" />
                <div className="h-3 w-16 rounded bg-muted/40" />
              </div>
              <div className="h-9 w-full rounded-lg bg-muted/40" />
            </Card>
          ))}
        </div>
      )}

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredItems.map(item => {
          const totalStock  = getTotalStock(item);
          const hasLow      = isAnyLow(item);
          const isRestocked = restockedIds.includes(item.id);
          const emptySizes  = item.sizes.filter(s => (sizeStockData[item.id]?.[s.id] ?? s.stock) === 0);
          const lowSizes    = item.sizes.filter(s => {
            const q = sizeStockData[item.id]?.[s.id] ?? s.stock;
            return q > 0 && q <= 2;
          });

          return (
            <Card
              key={item.id}
              className={`p-5 border-border hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 group flex flex-col`}
            >
              {/* Thumbnail */}
              <div className="relative w-full h-32 rounded-xl bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center mb-4 border border-primary/10 group-hover:border-primary/20 transition-all overflow-hidden flex-shrink-0">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <Package className="w-12 h-12 text-primary/40" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-white/30 to-transparent" />

                {/* Tags */}
                <div className="absolute top-2 right-2 flex flex-wrap gap-1 justify-end">
                  {item.tags?.map((tag, idx) => (
                    <Badge
                      key={idx}
                      variant="secondary"
                      className={`text-xs font-medium border ${
                        tag === '已发'
                          ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20'
                          : tag === '低库存'
                          ? 'bg-amber-500/10 text-amber-700 border-amber-500/20'
                          : 'bg-secondary/10 text-secondary border-secondary/20'
                      }`}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* Low stock badge */}
                {hasLow && (
                  <div className="absolute bottom-2 left-2">
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/25 text-amber-700 text-xs font-medium">
                      <AlertTriangle className="w-3 h-3" />
                      库存不足
                    </span>
                  </div>
                )}

                {/* Size count */}
                <div className="absolute bottom-2 right-2">
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/20 backdrop-blur-sm text-white text-xs font-medium">
                    <Layers className="w-3 h-3" />
                    {item.sizes.length} 规格
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="flex flex-col flex-1 gap-3">
                <div>
                  <h3 className="font-semibold text-foreground mb-0.5">{item.name}</h3>
                  <p className="text-xs text-muted-foreground">{item.category} {item.item_code && <span className="text-primary/70">· {item.item_code}</span>}</p>
                </div>

                {/* Mini size stock pills */}
                <div className="flex flex-wrap gap-1">
                  {item.sizes.slice(0, 4).map(sv => {
                    const qty     = sizeStockData[item.id]?.[sv.id] ?? sv.stock;
                    const isEmpty = qty === 0;
                    const isLow   = qty > 0 && qty <= 2;
                    return (
                      <span
                        key={sv.id}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                          isEmpty ? 'bg-red-500/8 text-red-600 border-red-500/20'        :
                          isLow   ? 'bg-amber-500/8 text-amber-700 border-amber-500/20'  :
                          'bg-emerald-500/8 text-emerald-700 border-emerald-500/20'
                        }`}
                      >
                        <span className={`w-1 h-1 rounded-full ${
                          isEmpty ? 'bg-red-500' : isLow ? 'bg-amber-500' : 'bg-emerald-500'
                        }`} />
                        {sv.label} {qty} 件
                      </span>
                    );
                  })}
                  {item.sizes.length > 4 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] text-muted-foreground border border-border bg-muted/50">
                      +{item.sizes.length - 4}
                    </span>
                  )}
                </div>

                {/* Bottom: total stock + restock button */}
                <div className="mt-auto space-y-3">
                  <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-muted/50 border border-border">
                    <span className="text-xs text-muted-foreground">合计库存</span>
                    <div className="flex items-center gap-2">
                      {(emptySizes.length > 0 || lowSizes.length > 0) && (
                        <span className="text-xs text-amber-600 font-medium">
                          {emptySizes.length > 0 && `${emptySizes.length}款缺货`}
                          {emptySizes.length > 0 && lowSizes.length > 0 && ' · '}
                          {lowSizes.length > 0 && `${lowSizes.length}款不足`}
                        </span>
                      )}
                      <span className={`text-sm font-semibold ${hasLow ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {totalStock} 件
                      </span>
                    </div>
                  </div>
                  {item.unit_price > 0 && (
                    <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-primary/5 border border-primary/15">
                      <span className="text-xs text-muted-foreground">合计金额</span>
                      <span className="text-sm font-bold text-primary">¥{(item.unit_price * totalStock).toFixed(2)}</span>
                    </div>
                  )}

                  {isRestocked ? (
                    <div className="flex items-center justify-center gap-1.5 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-sm font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      补货成功
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => setSelectedItem(item)}
                        className="flex-1 bg-gradient-to-r from-primary to-secondary hover:shadow-md hover:shadow-primary/20 transition-all"
                      >
                        <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                        补货
                      </Button>
                      <button
                        onClick={() => setDeleteTarget(item)}
                        className="h-9 w-9 rounded-lg border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 hover:border-red-500/30 flex items-center justify-center transition-all duration-200 shrink-0 group/del"
                        title="删除物品"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-500/70 group-hover/del:text-red-500 transition-colors" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteTarget(null)}>
          <Card className="w-full max-w-lg border-border shadow-2xl" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <div className="p-6">
              <div className="text-center mb-4">
                <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-7 h-7 text-red-500" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">删除物品规格</h3>
                <p className="text-sm text-muted-foreground">
                  选择要删除的规格，或删除整个物品
                </p>
              </div>

              {/* Size selector */}
              {deleteTarget.sizes && deleteTarget.sizes.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-foreground">选择要删除的规格</span>
                    <button
                      onClick={() => {
                        if (selectedSizesToDelete.size === deleteTarget.sizes.length) {
                          // 如果已全部选中，则取消全选
                          setSelectedSizesToDelete(new Set());
                        } else {
                          // 否则全选
                          setSelectedSizesToDelete(new Set(deleteTarget.sizes.map(s => s.id)));
                        }
                      }}
                      className="text-xs text-primary hover:text-primary/80 font-medium"
                    >
                      {selectedSizesToDelete.size === deleteTarget.sizes.length ? '取消全选' : '全选'}
                    </button>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {deleteTarget.sizes.map((size) => (
                      <label
                        key={size.id}
                        className="flex items-center gap-3 p-2 rounded-lg border border-border hover:bg-muted/30 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedSizesToDelete.has(size.id)}
                          onChange={(e) => {
                            const newSelected = new Set(selectedSizesToDelete);
                            if (e.target.checked) {
                              newSelected.add(size.id);
                            } else {
                              newSelected.delete(size.id);
                            }
                            setSelectedSizesToDelete(newSelected);
                          }}
                          className="w-4 h-4 rounded border-border text-primary focus:ring-primary/30"
                        />
                        <div className="flex-1">
                          <span className="text-sm font-medium text-foreground">{size.label}</span>
                          <span className="text-xs text-muted-foreground ml-2">库存: {size.stock}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                  {selectedSizesToDelete.size > 0 && selectedSizesToDelete.size >= deleteTarget.sizes.length - 1 && (
                    <div className="mt-3 p-2 rounded-lg bg-red-500/5 border border-red-500/20">
                      <p className="text-xs text-red-700">
                        ⚠️ 注意：删除后该物品将只剩 {deleteTarget.sizes.length - selectedSizesToDelete.size} 个规格
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Delete entire item warning */}
              <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20 mb-4">
                <p className="text-xs text-red-700 font-medium mb-1">⚠️ 危险操作：永久删除整个物品</p>
                <p className="text-xs text-red-600/80">
                  此操作将永久删除该物品及其所有规格，数据将从数据库中彻底删除，无法恢复！
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 px-6 pb-6">
              <Button variant="outline" className="flex-1 h-10 border-border" onClick={() => {
                setDeleteTarget(null);
                setSelectedSizesToDelete(new Set());
              }} disabled={deleting}>
                取消
              </Button>
              
              {/* Delete selected sizes */}
              <Button
                className="h-10 bg-orange-500 hover:bg-orange-600 text-white"
                onClick={async () => {
                  if (selectedSizesToDelete.size === 0) {
                    toast.error('请先选择要删除的规格');
                    return;
                  }
                  setDeleting(true);
                  const { deleteMaterialSizes } = await import('../utils/materialsDB');
                  const result = await deleteMaterialSizes(
                    deleteTarget.id,
                    Array.from(selectedSizesToDelete)
                  );
                  setDeleting(false);
                  if (result.success) {
                    setDeleteTarget(null);
                    setSelectedSizesToDelete(new Set());
                    loadItems();
                  }
                }}
                disabled={deleting || selectedSizesToDelete.size === 0}
              >
                {deleting ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" />
                    删除中...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-1.5" />
                    删除选中规格 ({selectedSizesToDelete.size})
                  </>
                )}
              </Button>
              
              {/* Delete entire item */}
              <Button
                className="flex-1 h-10 bg-red-500 hover:bg-red-600 text-white"
                onClick={async () => {
                  setDeleting(true);
                  await handleDelete(deleteTarget.id);
                  setDeleting(false);
                  setDeleteTarget(null);
                  setSelectedSizesToDelete(new Set());
                }}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" />
                    删除中...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-1.5" />
                    删除整个物品
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Restock Modal */}
      {selectedItem && (
        <RestockModal
          item={selectedItem}
          sizeStock={sizeStockData[selectedItem.id] ?? {}}
          onClose={() => setSelectedItem(null)}
          onConfirm={handleRestock}
        />
      )}
    </div>
  );
}
