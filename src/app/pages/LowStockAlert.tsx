import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  AlertTriangle, Package, RefreshCw, Search,
  Settings2, PackagePlus, X, TrendingDown,
  CheckCircle2, Bell, Filter, ArrowUpRight, Clock, ShieldAlert,
  Pencil, Save, RotateCcw, Info, MapPin, Tag, FileText,
  Hash, Layers
} from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  getAllInventoryItems,
  updateItemStock,
  deleteInventoryItem,
  type UnifiedInventoryItem,
  getSeverity,
  SEVERITY_CONFIG,
  type Severity,
} from '../data/unifiedInventoryData';
import { AppSelect } from '../components/ui/app-select';

// ── Types ─────────────────────────────────────────────────────────────────────
interface ItemOverride {
  name?: string;
  category?: string;
  spec?: string;
  location?: string;
  unit?: string;
}

// ── Restock Modal ─────────────────────────────────────────────────────────────
interface RestockModalProps {
  item: UnifiedInventoryItem & { currentStock: number; currentThreshold: number };
  onClose: () => void;
  onConfirm: (itemId: number, qty: number) => void;
}
function RestockModal({ item, onClose, onConfirm }: RestockModalProps) {
  const [qty, setQty] = useState('');
  const sev = getSeverity(item.currentStock, item.currentThreshold);
  const cfg = SEVERITY_CONFIG[sev];
  const numQty = Number(qty);
  const afterStock = item.currentStock + numQty;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md mx-4">
        <Card className="border-border shadow-2xl shadow-primary/10 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-primary to-secondary" />
          <div className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                  <PackagePlus className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">快速补货</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    为 <span className="text-primary font-medium">{item.name}</span> 补充库存
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border mb-5">
              <div className="w-9 h-9 rounded-lg bg-primary/8 flex items-center justify-center border border-primary/10">
                <Package className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{item.name}</p>
                <p className="text-xs text-muted-foreground">{item.spec} · {item.category}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground mb-1">当前状态</p>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                  {cfg.label}
                </span>
              </div>
            </div>

            <div className="mb-5 space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>当前 <span className={`font-semibold ${cfg.color}`}>{item.currentStock} {item.unit}</span></span>
                <span>阈值 <span className="font-semibold text-foreground">{item.currentThreshold} {item.unit}</span></span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Math.round((item.currentStock / item.currentThreshold) * 100))}%`,
                    background: cfg.bar,
                  }}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  补货数量 <span className="text-destructive">*</span>
                </label>
                <Input
                  type="number" min="1" value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  placeholder={`建议补货 ${Math.max(1, item.currentThreshold - item.currentStock + 5)} ${item.unit}`}
                  className="h-11 bg-muted/50 border-border"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">库存类型</label>
                <AppSelect
                  defaultValue="日常领用"
                  options={[
                    { value: '日常领用', label: '日常领用' },
                    { value: '申购物品', label: '申购物品' },
                  ]}
                />
              </div>
              {qty && numQty > 0 && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <p className="text-sm text-emerald-700">
                    补货后库存 <span className="font-semibold">{afterStock} {item.unit}</span>
                    {afterStock >= item.currentThreshold && ' — 已达安全水位 ✓'}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => { if (qty && numQty > 0) { onConfirm(item.id, numQty); onClose(); } }}
                disabled={!qty || numQty <= 0}
                className="flex-1 h-11 bg-gradient-to-r from-primary to-secondary hover:shadow-lg hover:shadow-primary/25 disabled:opacity-50 transition-all"
              >
                <PackagePlus className="w-4 h-4 mr-2" />确认补货
              </Button>
              <Button variant="outline" onClick={onClose} className="px-6 h-11 border-border">取消</Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── Edit Item Modal ────────────────────────────────────────────────────────────
interface EditModalProps {
  item: UnifiedInventoryItem & { currentStock: number; currentThreshold: number };
  onClose: () => void;
  onSave: (
    itemId: number,
    override: ItemOverride,
    newStock: number,
    newThreshold: number
  ) => void;
}

const CATEGORIES = ['办公用品', '电子设备', '耗材', '清洁用品', '劳保用品', '其他'];
const UNITS      = ['个', '支', '包', '把', '本', '件', '盒', '瓶', '卷', '套'];

function EditItemModal({ item, onClose, onSave }: EditModalProps) {
  const [name,      setName]      = useState(item.name);
  const [category,  setCategory]  = useState(item.category);
  const [spec,      setSpec]      = useState(item.spec);
  const [location,  setLocation]  = useState(item.location);
  const [unit,      setUnit]      = useState(item.unit);
  const [stock,     setStock]     = useState(String(item.currentStock));
  const [threshold, setThreshold] = useState(String(item.currentThreshold));

  const numStock     = Math.max(0, Number(stock)     || 0);
  const numThreshold = Math.max(1, Number(threshold) || 1);
  const previewSev   = getSeverity(numStock, numThreshold);
  const previewCfg   = SEVERITY_CONFIG[previewSev];
  const origSev      = getSeverity(item.currentStock, item.currentThreshold);
  const origCfg      = SEVERITY_CONFIG[origSev];
  const pct          = Math.min(100, Math.round((numStock / numThreshold) * 100));

  const isDirty =
    name !== item.name || category !== item.category || spec !== item.spec ||
    location !== item.location || unit !== item.unit ||
    numStock !== item.currentStock || numThreshold !== item.currentThreshold;

  const handleReset = () => {
    setName(item.name); setCategory(item.category); setSpec(item.spec);
    setLocation(item.location); setUnit(item.unit);
    setStock(String(item.currentStock)); setThreshold(String(item.currentThreshold));
  };

  const handleSave = () => {
    onSave(item.id, { name, category, spec, location, unit }, numStock, numThreshold);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-xl">
        <Card className="border-border shadow-2xl shadow-primary/10 overflow-hidden">
          {/* Top gradient bar */}
          <div className="h-1 bg-gradient-to-r from-violet-500 via-primary to-secondary" />

          <div className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center border border-violet-500/20">
                  <Pencil className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">编辑预警信息</h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-muted-foreground">正在编辑：<span className="text-foreground font-medium">{item.name}</span></p>
                    <span className="text-muted-foreground">·</span>
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded-md border ${origCfg.bg} ${origCfg.color} ${origCfg.border}`}>
                      {origCfg.label}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isDirty && (
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted border border-border transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    重置
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* ── Section 1: Basic Info ── */}
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-3">
                <Info className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">基本信息</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {/* Name */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    <FileText className="w-3.5 h-3.5 inline mr-1.5 text-muted-foreground" />
                    物品名称
                  </label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="请输入物品名称"
                    className="h-10 bg-muted/50 border-border"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    <Tag className="w-3.5 h-3.5 inline mr-1.5 text-muted-foreground" />
                    分类
                  </label>
                  <AppSelect
                    value={category}
                    onChange={(v) => setCategory(v)}
                    height="h-10"
                    options={CATEGORIES.map(c => ({ value: c, label: c }))}
                  />
                </div>

                {/* Spec */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    <Layers className="w-3.5 h-3.5 inline mr-1.5 text-muted-foreground" />
                    规格型号
                  </label>
                  <Input
                    value={spec}
                    onChange={(e) => setSpec(e.target.value)}
                    placeholder="如：规格: 90g"
                    className="h-10 bg-muted/50 border-border"
                  />
                </div>

                {/* Location */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    <MapPin className="w-3.5 h-3.5 inline mr-1.5 text-muted-foreground" />
                    存放位置
                  </label>
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="如：备件库A-01"
                    className="h-10 bg-muted/50 border-border"
                  />
                </div>
              </div>
            </div>

            {/* ── Section 2: Stock & Threshold ── */}
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-3">
                <Hash className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">库存与预警设置</span>
              </div>

              <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  {/* Current Stock */}
                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-foreground mb-1.5">当前库存</label>
                    <Input
                      type="number" min="0"
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      className={`h-10 bg-muted/50 border-border font-semibold text-center ${
                        numStock === 0 ? 'text-red-600' :
                        numStock <= Math.ceil(numThreshold * 0.3) ? 'text-orange-600' :
                        numStock <= numThreshold ? 'text-amber-600' : 'text-emerald-600'
                      }`}
                    />
                  </div>

                  {/* Threshold */}
                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-foreground mb-1.5">预警阈值</label>
                    <Input
                      type="number" min="1"
                      value={threshold}
                      onChange={(e) => setThreshold(e.target.value)}
                      className="h-10 bg-muted/50 border-border text-center"
                    />
                  </div>

                  {/* Unit */}
                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-foreground mb-1.5">计量单位</label>
                    <AppSelect
                      value={unit}
                      onChange={(v) => setUnit(v)}
                      height="h-10"
                      options={UNITS.map(u => ({ value: u, label: u }))}
                    />
                  </div>
                </div>

                {/* Live Preview Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">库存水位预览</span>
                    <div className="flex items-center gap-2">
                      {previewSev !== origSev && (
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs font-medium px-1.5 py-0.5 rounded-md border ${origCfg.bg} ${origCfg.color} ${origCfg.border}`}>
                            {origCfg.label}
                          </span>
                          <span className="text-xs text-muted-foreground">→</span>
                        </div>
                      )}
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${previewCfg.bg} ${previewCfg.color} ${previewCfg.border}`}>
                        {previewCfg.label}
                      </span>
                    </div>
                  </div>
                  <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${pct}%`, background: previewCfg.bar }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>库存 <span className={`font-semibold ${previewCfg.color}`}>{numStock} {unit}</span></span>
                    <span>{pct}%</span>
                    <span>阈值 <span className="font-semibold text-foreground">{numThreshold} {unit}</span></span>
                  </div>
                </div>

                {/* Threshold tip */}
                {numThreshold !== item.currentThreshold && (
                  <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-primary/5 border border-primary/15">
                    <Info className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-primary/80">
                      预警阈值已从 <span className="font-semibold">{item.currentThreshold}</span> 调整为{' '}
                      <span className="font-semibold">{numThreshold}</span> {unit}，
                      库存低于此值时将触发预警
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                onClick={handleSave}
                disabled={!isDirty || !name.trim()}
                className="flex-1 h-11 bg-gradient-to-r from-violet-600 to-primary hover:shadow-lg hover:shadow-primary/25 disabled:opacity-50 transition-all"
              >
                <Save className="w-4 h-4 mr-2" />
                保存修改
              </Button>
              <Button variant="outline" onClick={onClose} className="px-6 h-11 border-border">
                取消
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── Threshold Settings Side Panel ─────────────────────────────────────────────
interface ThresholdPanelProps {
  thresholds: Record<number, number>;
  itemOverrides: Record<number, ItemOverride>;
  allItems: UnifiedInventoryItem[];
  onChange: (id: number, val: number) => void;
  onClose: () => void;
}
function ThresholdPanel({ thresholds, itemOverrides, allItems, onChange, onClose }: ThresholdPanelProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 h-full w-full max-w-sm bg-white border-l border-border flex flex-col shadow-2xl">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-foreground">预警阈值设置</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-muted-foreground px-5 py-3 border-b border-border bg-muted/30">
          当物品库存低于设定阈值时触发预警提示
        </p>
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {allItems.map((item) => {
            const displayName = itemOverrides[item.id]?.name ?? item.name;
            const displayCat  = itemOverrides[item.id]?.category ?? item.category;
            return (
              <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/20 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{displayName}</p>
                  <p className="text-xs text-muted-foreground">{displayCat}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <input
                    type="number" min="1"
                    value={thresholds[item.id] ?? item.threshold}
                    onChange={(e) => onChange(item.id, Math.max(1, Number(e.target.value)))}
                    className="w-16 h-8 text-center text-sm rounded-lg border border-border bg-muted/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                  <span className="text-xs text-muted-foreground w-4">
                    {itemOverrides[item.id]?.unit ?? item.unit}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="p-4 border-t border-border">
          <Button onClick={onClose} className="w-full h-10 bg-gradient-to-r from-primary to-secondary">
            保存设置
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Severity Badge ─────────────────────────────────────────────────────────────
function SeverityBadge({ severity }: { severity: Severity }) {
  const cfg = SEVERITY_CONFIG[severity];
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
      {severity === 'empty'
        ? <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
        : <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.bar }} />
      }
      {cfg.label}
    </span>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
type TabKey = Severity | 'all';

export function LowStockAlert() {
  const [search, setSearch]             = useState('');
  const [activeTab, setActiveTab]       = useState<TabKey>('all');
  const [thresholds, setThresholds]     = useState<Record<number, number>>({});
  const [stockData, setStockData]       = useState<Record<number, number>>({});
  const [itemOverrides, setItemOverrides] = useState<Record<number, ItemOverride>>({});
  const [restockedIds, setRestockedIds] = useState<number[]>([]);
  const [selectedItem, setSelectedItem] =
    useState<(UnifiedInventoryItem & { currentStock: number; currentThreshold: number }) | null>(null);
  const [editingItem, setEditingItem]   =
    useState<(UnifiedInventoryItem & { currentStock: number; currentThreshold: number }) | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [dismissedBanner, setDismissedBanner] = useState(false);
  const [allItems, setAllItems] = useState<UnifiedInventoryItem[]>([]);

  // Load data from unified source
  const loadData = useCallback(() => {
    setAllItems(getAllInventoryItems());
  }, []);

  useEffect(() => {
    loadData();
    // Refresh when window regains focus
    window.addEventListener('focus', loadData);
    return () => window.removeEventListener('focus', loadData);
  }, [loadData]);

  const getThreshold = (item: UnifiedInventoryItem) => thresholds[item.id]  ?? item.threshold;
  const getStock     = (item: UnifiedInventoryItem) => stockData[item.id]   ?? item.stock;
  const getName      = (item: UnifiedInventoryItem) => itemOverrides[item.id]?.name     ?? item.name;
  const getCategory  = (item: UnifiedInventoryItem) => itemOverrides[item.id]?.category ?? item.category;
  const getSpec      = (item: UnifiedInventoryItem) => itemOverrides[item.id]?.spec     ?? item.spec;
  const getLocation  = (item: UnifiedInventoryItem) => itemOverrides[item.id]?.location ?? item.location;
  const getUnit      = (item: UnifiedInventoryItem) => itemOverrides[item.id]?.unit     ?? item.unit;

  const enriched = useMemo(() =>
    allItems.map(item => {
      const currentStock     = getStock(item);
      const currentThreshold = getThreshold(item);
      return {
        ...item,
        name:      getName(item),
        category:  getCategory(item),
        spec:      getSpec(item),
        location:  getLocation(item),
        unit:      getUnit(item),
        currentStock,
        currentThreshold,
        severity: getSeverity(currentStock, currentThreshold),
      };
    }),
    [allItems, thresholds, stockData, itemOverrides]
  );

  const counts = useMemo(() => ({
    empty:    enriched.filter(i => i.severity === 'empty').length,
    critical: enriched.filter(i => i.severity === 'critical').length,
    warning:  enriched.filter(i => i.severity === 'warning').length,
    normal:   enriched.filter(i => i.severity === 'normal').length,
  }), [enriched]);

  const alertCount = counts.empty + counts.critical + counts.warning;

  const filtered = useMemo(() =>
    enriched.filter(item => {
      const q = search.toLowerCase();
      const matchSearch = item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q);
      const matchTab    = activeTab === 'all' || item.severity === activeTab;
      return matchSearch && matchTab;
    }),
    [enriched, search, activeTab]
  );

  const handleRestock = (itemId: number, qty: number) => {
    const current = getStock(allItems.find(i => i.id === itemId)!);
    const newStock = current + qty;
    
    // Update in state
    setStockData(prev => ({ ...prev, [itemId]: newStock }));
    
    // Persist to storage
    updateItemStock(itemId, newStock);
    
    setRestockedIds(prev => [...prev, itemId]);
    setTimeout(() => setRestockedIds(prev => prev.filter(id => id !== itemId)), 3000);
  };

  const handleSaveEdit = (
    itemId: number,
    override: ItemOverride,
    newStock: number,
    newThreshold: number
  ) => {
    setItemOverrides(prev => ({ ...prev, [itemId]: override }));
    setStockData(prev => ({ ...prev, [itemId]: newStock }));
    setThresholds(prev => ({ ...prev, [itemId]: newThreshold }));
    
    // Persist stock change
    updateItemStock(itemId, newStock);
  };

  const statCards: Array<{ key: Severity; label: string; val: number; color: string; bg: string; border: string }> = [
    { key: 'empty',    label: '缺货物品', val: counts.empty,    color: 'text-red-600',     bg: 'bg-red-500/8',     border: 'border-red-500/15'    },
    { key: 'critical', label: '危险库存', val: counts.critical, color: 'text-orange-600',  bg: 'bg-orange-500/8',  border: 'border-orange-500/15' },
    { key: 'warning',  label: '预警库存', val: counts.warning,  color: 'text-amber-600',   bg: 'bg-amber-500/8',   border: 'border-amber-500/15'  },
    { key: 'normal',   label: '库存正常', val: counts.normal,   color: 'text-emerald-600', bg: 'bg-emerald-500/8', border: 'border-emerald-500/15' },
  ];

  const tabList: Array<{ key: TabKey; label: string }> = [
    { key: 'all',      label: '全部物资' },
    { key: 'empty',    label: '缺货'     },
    { key: 'critical', label: '危险'     },
    { key: 'warning',  label: '预警'     },
    { key: 'normal',   label: '正常'     },
  ];

  const tabCount = (key: TabKey) => key === 'all' ? enriched.length : counts[key as Severity];

  return (
    <div className="p-8 space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
              <Bell className="w-5 h-5 text-amber-600" />
            </div>
            <h1 className="text-3xl font-semibold text-foreground tracking-tight">低库存预警</h1>
            {alertCount > 0 && (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-600 text-sm font-semibold">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse inline-block" />
                {alertCount} 项需关注
              </span>
            )}
          </div>
          <p className="text-muted-foreground mt-1">监控库存水位，及时发现并处理低库存风险</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2 h-10 border-border" onClick={() => setShowSettings(true)}>
            <Settings2 className="w-4 h-4" />
            阈值设置
          </Button>
          <Button 
            className="gap-2 h-10 bg-gradient-to-r from-primary to-secondary hover:shadow-lg hover:shadow-primary/20"
            onClick={loadData}
          >
            <RefreshCw className="w-4 h-4" />
            刷新数据
          </Button>
        </div>
      </div>

      {/* ── Alert Banner ── */}
      {counts.empty > 0 && !dismissedBanner && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/5 border border-red-500/20">
          <div className="w-8 h-8 rounded-lg bg-red-500/15 flex items-center justify-center flex-shrink-0">
            <ShieldAlert className="w-4 h-4 text-red-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-700">
              {counts.empty} 件物品已完全缺货，请立即补货
            </p>
            <p className="text-xs text-red-600/80 mt-0.5">
              {enriched.filter(i => i.severity === 'empty').map(i => i.name).join('、')}
            </p>
          </div>
          <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white text-xs h-8" onClick={() => setActiveTab('empty')}>
            查看缺货
          </Button>
          <button
            onClick={() => setDismissedBanner(true)}
            className="w-7 h-7 rounded-md flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-500/10 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(card => (
          <Card
            key={card.key}
            onClick={() => setActiveTab(card.key)}
            className={`p-5 border cursor-pointer transition-all duration-200 hover:shadow-lg ${card.border} ${
              activeTab === card.key ? 'ring-2 ring-primary/30 shadow-md' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${card.bg}`}>
                {card.key === 'empty'    && <TrendingDown  className={`w-4 h-4 ${card.color}`} />}
                {card.key === 'critical' && <AlertTriangle className={`w-4 h-4 ${card.color}`} />}
                {card.key === 'warning'  && <Bell          className={`w-4 h-4 ${card.color}`} />}
                {card.key === 'normal'   && <CheckCircle2  className={`w-4 h-4 ${card.color}`} />}
              </div>
              {card.val > 0 && card.key !== 'normal' && (
                <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
            <p className={`text-3xl font-bold ${card.color}`}>{card.val}</p>
            <p className="text-sm text-muted-foreground mt-1">{card.label}</p>
          </Card>
        ))}
      </div>

      {/* ── Table Card ── */}
      <Card className="border-border overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-border space-y-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索物品名称或分类..."
                className="pl-10 h-10 bg-muted/50 border-border"
              />
            </div>
            <Button variant="outline" className="gap-2 h-10 border-border">
              <Filter className="w-4 h-4" />筛选
            </Button>
          </div>
          {/* Tabs */}
          <div className="flex gap-2 flex-wrap">
            {tabList.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
                  activeTab === tab.key
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                  activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-muted-foreground/15 text-muted-foreground'
                }`}>
                  {tabCount(tab.key)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/30 border-b border-border">
                {['物品名称', '当前库存', '预警阈值', '库存水位', '状态', '最近补货', '操作'].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-muted-foreground px-5 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-muted-foreground text-sm">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    暂无匹配物品
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const isRestocked = restockedIds.includes(item.id);
                  const pct = Math.min(100, Math.round((item.currentStock / item.currentThreshold) * 100));
                  const cfg = SEVERITY_CONFIG[item.severity];
                  const isUrgent = item.severity === 'empty' || item.severity === 'critical';
                  const isEdited = !!itemOverrides[item.id] ||
                    (stockData[item.id] !== undefined && stockData[item.id] !== item.stock) ||
                    thresholds[item.id] !== undefined;

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-muted/20 transition-colors ${
                        item.severity === 'empty'    ? 'bg-red-500/3'    :
                        item.severity === 'critical' ? 'bg-orange-500/3' : ''
                      }`}
                    >
                      {/* Name */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border ${cfg.bg} ${cfg.border}`}>
                            <Package className={`w-4 h-4 ${cfg.color}`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-medium text-foreground">{item.name}</p>
                              {isEdited && (
                                <span className="w-1.5 h-1.5 rounded-full bg-violet-500 flex-shrink-0" title="已编辑" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{item.category} · {item.location}</p>
                          </div>
                        </div>
                      </td>

                      {/* Current stock */}
                      <td className="px-5 py-4">
                        <span className={`text-lg font-bold ${cfg.color}`}>{item.currentStock}</span>
                        <span className="text-xs text-muted-foreground ml-1">{item.unit}</span>
                      </td>

                      {/* Threshold */}
                      <td className="px-5 py-4">
                        <span className="text-sm font-medium text-foreground">{item.currentThreshold}</span>
                        <span className="text-xs text-muted-foreground ml-1">{item.unit}</span>
                      </td>

                      {/* Progress bar */}
                      <td className="px-5 py-4">
                        <div className="w-28 space-y-1">
                          <div className="flex justify-between text-[11px] text-muted-foreground">
                            <span>{pct}%</span>
                            {item.severity !== 'normal' && (
                              <span className={cfg.color}>
                                缺 {Math.max(0, item.currentThreshold - item.currentStock)}
                              </span>
                            )}
                          </div>
                          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${pct}%`, background: cfg.bar }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Severity badge */}
                      <td className="px-5 py-4">
                        <SeverityBadge severity={item.severity} />
                      </td>

                      {/* Last restock */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
                          <Clock className="w-3 h-3 flex-shrink-0" />
                          {item.lastRestock}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          {/* Edit button */}
                          <button
                            onClick={() => setEditingItem(item)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center border border-border text-muted-foreground hover:text-violet-600 hover:border-violet-500/40 hover:bg-violet-500/5 transition-all"
                            title="编辑"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          {/* Restock button */}
                          {isRestocked ? (
                            <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium whitespace-nowrap">
                              <CheckCircle2 className="w-4 h-4" />
                              补货成功
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => setSelectedItem(item)}
                              className={`h-8 text-xs gap-1.5 whitespace-nowrap ${
                                isUrgent
                                  ? 'bg-gradient-to-r from-primary to-secondary hover:shadow-md hover:shadow-primary/20 text-white'
                                  : 'bg-muted text-foreground border border-border hover:bg-muted/80'
                              }`}
                            >
                              <RefreshCw className="w-3 h-3" />
                              补货
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border bg-muted/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <p className="text-xs text-muted-foreground">共 {filtered.length} 条记录</p>
            {Object.keys(itemOverrides).length > 0 && (
              <span className="flex items-center gap-1 text-xs text-violet-600 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                {Object.keys(itemOverrides).length} 条已编辑
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            最后更新：2026-03-18 10:30
          </p>
        </div>
      </Card>

      {/* ── Modals ── */}
      {selectedItem && (
        <RestockModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onConfirm={handleRestock}
        />
      )}
      {editingItem && (
        <EditItemModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSave={handleSaveEdit}
        />
      )}
      {showSettings && (
        <ThresholdPanel
          thresholds={thresholds}
          itemOverrides={itemOverrides}
          allItems={allItems}
          onChange={(id, val) => setThresholds(prev => ({ ...prev, [id]: val }))}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}