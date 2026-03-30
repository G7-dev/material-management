import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  AlertTriangle, Package, RefreshCw, Search,
  Settings2, PackagePlus, X, TrendingDown,
  CheckCircle2, Bell, Filter, ArrowUpRight, Clock, ShieldAlert,
  Pencil, Save, RotateCcw, Info, Tag, FileText,
  Hash
} from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import {
  fetchMaterials,
  updateMaterialStock,
  type Material,
  type MaterialSize,
  getMaterialStockStatus,
  SEVERITY_CONFIG,
  type StockSeverity,
} from '../utils/materialsDB';
import { invalidateMaterialCache } from '../utils/cache';

// ── Types ─────────────────────────────────────────────────────────────────────
interface ItemOverride {
  name?: string;
  category?: string;
  spec?: string;
  location?: string;
  unit?: string;
}

// 扩展 Material 类型，添加运行时计算属性
interface MaterialWithStatus extends Material {
  currentThreshold: number;
  severity: StockSeverity;
  currentStock: number;
  lowStockSizes: MaterialSize[];
  spec?: string;
  lastRestock?: string;
  // 合并相关属性
  sourceIds?: string[];
}

// 兼容性修复：Cloudflare Workers 自动注入变量可能缺失
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const itemOverrides: Record<string, ItemOverride> = {};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const stockData: Record<string, number> = {};

// ── Restock Modal ─────────────────────────────────────────────────────────────
interface RestockModalProps {
  item: MaterialWithStatus;
  onClose: () => void;
  onConfirm: (materialId: string, sizeId: string | null, qty: number) => void;
}
function RestockModal({ item, onClose, onConfirm }: RestockModalProps) {
  const hasSizes = item.sizes && item.sizes.length > 0;
  const [selectedSize, setSelectedSize] = useState<MaterialSize | null>(
    hasSizes && item.sizes.length === 1 ? item.sizes[0] : null
  );
  const [qty, setQty] = useState('');
  const { severity } = getMaterialStockStatus(item);
  const cfg = SEVERITY_CONFIG[severity];
  const numQty = Number(qty);
  const currentQty = selectedSize ? selectedSize.stock : item.stock;
  const afterStock = currentQty + numQty;
  const canConfirm = (hasSizes ? selectedSize !== null : true) && numQty > 0;

  const handleConfirm = () => {
    if (!canConfirm) return;
    onConfirm(item.id, selectedSize?.id || null, numQty);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md mx-4 max-h-[90vh] flex flex-col">
        <Card className="border-border shadow-2xl shadow-primary/10 overflow-hidden flex flex-col">
          <div className="h-1 bg-gradient-to-r from-primary to-secondary" />
          
          {/* Header - Fixed */}
          <div className="p-6 pb-4 border-b border-border">
            <div className="flex items-start justify-between">
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
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto p-6 pt-4">
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

            {/* Size selection grid - optimized layout */}
            {item.sizes && item.sizes.length > 0 && (
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <Package className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-foreground">选择规格</span>
                  {selectedSize && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      当前：{selectedSize.stock} 件
                    </span>
                  )}
                </div>
                <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(item.sizes.length, 3)}, 1fr)` }}>
                  {item.sizes.map(size => {
                    const isSelected = selectedSize?.id === size.id;
                    const isEmpty = size.stock === 0;
                    const isLow = size.stock > 0 && size.stock <= 2;

                    return (
                      <button
                        key={size.id}
                        onClick={() => setSelectedSize(size)}
                        className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border transition-all duration-200 text-center min-h-[80px] ${
                          isSelected
                            ? 'border-primary/60 bg-primary/8 shadow-sm ring-2 ring-primary/20 scale-[1.02]'
                            : isEmpty
                              ? 'border-red-500/25 bg-red-500/4 hover:border-red-500/40'
                              : isLow
                                ? 'border-amber-500/25 bg-amber-500/4 hover:border-amber-500/40'
                                : 'border-border bg-muted/30 hover:border-primary/30 hover:bg-primary/4 hover:scale-[1.01]'
                        }`}
                      >
                        <span className={`text-sm font-semibold ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                          {size.label}
                        </span>
                        <span className={`text-2xl font-bold ${
                          isEmpty ? 'text-red-500' :
                          isLow ? 'text-amber-500' :
                          isSelected ? 'text-primary' :
                          'text-emerald-600'
                        }`}>
                          {size.stock}
                        </span>
                        <span className="text-[11px] text-muted-foreground font-medium">{item.unit}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mb-5 space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>当前 <span className={`font-semibold ${cfg.color}`}>{currentQty} {item.unit}</span></span>
                <span>阈值 <span className="font-semibold text-foreground">{item.currentThreshold} {item.unit}</span></span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Math.round((currentQty / item.currentThreshold) * 100))}%`,
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
                <Input
                  value="日常领用"
                  disabled={true}
                  className="h-11 bg-muted/30 border-border cursor-not-allowed opacity-75"
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
          </div>

          {/* Actions - Fixed at bottom */}
          <div className="p-6 pt-4 border-t border-border bg-muted/20">
            <div className="flex gap-3">
              <Button
                onClick={handleConfirm}
                disabled={!canConfirm}
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
  item: MaterialWithStatus;
  onClose: () => void;
  onSave: (
    materialId: string,
    override: ItemOverride,
    newStock: number,
    newThreshold: number | Record<string, number>
  ) => void;
}

// 本地辅助函数：根据库存和阈值计算严重等级
function getSeverity(stock: number, threshold: number): StockSeverity {
  if (stock === 0) return 'empty';
  if (stock <= Math.ceil(threshold * 0.3)) return 'critical';
  if (stock <= threshold) return 'warning';
  return 'normal';
}

type Severity = StockSeverity;

function EditItemModal({ item, onClose, onSave }: EditModalProps) {
  // Basic info states
  const [name,      setName]      = useState(item.name);
  const [category,  setCategory]  = useState(item.category);
  const [unit,      setUnit]      = useState(item.unit);
  
  // Threshold state - used for both single-item and size-specific thresholds
  const [threshold, setThreshold] = useState(String(item.currentThreshold));
  
  // Size-specific thresholds
  const [sizeThresholds, setSizeThresholds] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    item.sizes.forEach(size => {
      initial[size.id] = String(item.currentThreshold);
    });
    return initial;
  });

  const numStock     = item.currentStock;
  const numThreshold = Math.max(0, Number(threshold) || 0);
  const hasSizes     = item.sizes && item.sizes.length > 0;
  const previewSev   = getSeverity(numStock, numThreshold);
  const previewCfg   = SEVERITY_CONFIG[previewSev];
  const origSev      = getSeverity(item.currentStock, item.currentThreshold);
  const origCfg      = SEVERITY_CONFIG[origSev];

  const isDirty = hasSizes
    ? Object.keys(sizeThresholds).some(id => 
        Number(sizeThresholds[id]) !== item.currentThreshold &&
        Number(sizeThresholds[id]) > 0
      )
    : numThreshold !== item.currentThreshold && numThreshold > 0;

  const handleReset = () => {
    setName(item.name); 
    setCategory(item.category); 
    setUnit(item.unit);
    setThreshold(String(item.currentThreshold));
    const resetThresholds: Record<string, string> = {};
    item.sizes.forEach(size => {
      resetThresholds[size.id] = String(item.currentThreshold);
    });
    setSizeThresholds(resetThresholds);
  };

  const handleSave = () => {
    if (hasSizes) {
      // Save size-specific thresholds
      const sizeThresholdMap: Record<string, number> = {};
      Object.keys(sizeThresholds).forEach(id => {
        sizeThresholdMap[id] = Math.max(1, Number(sizeThresholds[id]) || 1);
      });
      onSave(item.id, { name, category, unit }, numStock, sizeThresholdMap);
    } else {
      // Save overall threshold
      onSave(item.id, { name, category, unit }, numStock, numThreshold);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-xl max-h-[90vh] flex flex-col">
        <Card className="border-border shadow-2xl shadow-primary/10 overflow-hidden flex flex-col">
          {/* Top gradient bar */}
          <div className="h-1 bg-gradient-to-r from-violet-500 via-primary to-secondary" />

          {/* Header - Fixed at top */}
          <div className="p-6 pb-4 border-b border-border">
            <div className="flex items-start justify-between">
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
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto p-6 pt-4">
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
                    disabled={true}
                    className="h-10 bg-muted/30 border-border cursor-not-allowed opacity-75"
                  />
                </div>

                {/* Category & Unit - side by side */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    <Tag className="w-3.5 h-3.5 inline mr-1.5 text-muted-foreground" />
                    分类
                  </label>
                  <Input
                    value={category}
                    disabled={true}
                    className="h-10 bg-muted/30 border-border cursor-not-allowed opacity-75"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    <Hash className="w-3.5 h-3.5 inline mr-1.5 text-muted-foreground" />
                    计量单位
                  </label>
                  <Input
                    value={unit}
                    disabled={true}
                    className="h-10 bg-muted/30 border-border cursor-not-allowed opacity-75"
                  />
                </div>
              </div>
            </div>

            {/* ── Section 2: Stock Settings ── */}
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-3">
                <Package className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">库存设置</span>
              </div>

              <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">当前库存（只读）</label>
                  <Input
                    type="number" min="0"
                    value={numStock}
                    disabled={true}
                    className={`h-10 bg-muted/30 border-border font-semibold text-center cursor-not-allowed opacity-75 ${
                      numStock === 0 ? 'text-red-600' :
                      numStock <= 5 ? 'text-orange-600' :
                      numStock <= 10 ? 'text-amber-600' : 'text-emerald-600'
                    }`}
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">
                    💡 提示：当前库存不能在此修改，请使用"补货"功能调整库存
                  </p>
                </div>
              </div>
            </div>

            {/* ── Section 3: Size-Specific Thresholds ── */}
            {item.sizes && item.sizes.length > 0 ? (
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">规格预警设置</span>
                </div>

                <div className="space-y-3">
                  {item.sizes.map((size) => (
                    <div key={size.id} className="p-3 rounded-lg bg-muted/20 border border-border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-foreground">{size.label}</span>
                        <span className="text-xs text-muted-foreground">库存: {size.stock} {unit}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="text-xs text-muted-foreground whitespace-nowrap">预警阈值:</label>
                        <Input
                          type="number" min="1"
                          value={sizeThresholds[size.id] || ''}
                          onChange={(e) => setSizeThresholds(prev => ({ ...prev, [size.id]: e.target.value }))}
                          className="h-8 bg-muted/50 border-border text-sm flex-1"
                          placeholder="输入预警值"
                        />
                        <span className="text-xs text-muted-foreground">{unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">预警阈值设置</span>
                </div>
                <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">预警阈值</label>
                    <Input
                      type="number" min="1"
                      value={threshold}
                      onChange={(e) => setThreshold(e.target.value)}
                      className="h-10 bg-muted/50 border-border font-semibold text-center"
                      placeholder="输入预警阈值"
                    />
                    <p className="text-xs text-muted-foreground mt-1.5">
                      库存低于此值时将触发预警，当前值: {item.currentThreshold} {unit}
                    </p>
                  </div>
                </div>

                {/* Live Preview */}
                {numThreshold > 0 && (
                  <div className="mt-4 space-y-2">
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
                        style={{ width: `${Math.min(100, Math.round((numStock / numThreshold) * 100))}%`, background: previewCfg.bar }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>库存 <span className={`font-semibold ${previewCfg.color}`}>{numStock} {unit}</span></span>
                      <span>{Math.min(100, Math.round((numStock / numThreshold) * 100))}%</span>
                      <span>阈值 <span className="font-semibold text-foreground">{numThreshold} {unit}</span></span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions - Fixed at bottom */}
          <div className="p-6 pt-4 border-t border-border bg-muted/20">
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
  thresholds: Record<string, number>;
  itemOverrides: Record<string, ItemOverride>;
  allItems: Array<Material & { currentThreshold: number; severity: StockSeverity; currentStock: number; lowStockSizes: MaterialSize[] }>;
  onChange: (id: string, val: number) => void;
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
                    value={thresholds[item.id] ?? item.safe_stock}
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
type TabKey = StockSeverity | 'all';

export function LowStockAlert() {
  const [search, setSearch]             = useState('');
  const [activeTab, setActiveTab]       = useState<TabKey>('all');
  const [thresholds, setThresholds]     = useState<Record<string, number>>({});
  const [restockedIds, setRestockedIds] = useState<string[]>([]);
  const [selectedItem, setSelectedItem] = useState<MaterialWithStatus | null>(null);
  const [editingItem, setEditingItem]   = useState<MaterialWithStatus | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [dismissedBanner, setDismissedBanner] = useState(false);
  const [materials, setMaterials]       = useState<Material[]>([]);
  const [loading, setLoading]           = useState(true);

  // Load data from database
  const loadData = useCallback(async () => {
    setLoading(true);
    // 先清除缓存，确保从数据库获取最新数据
    invalidateMaterialCache();
    const data = await fetchMaterials(false);
    setMaterials(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
    // Refresh when window regains focus or inventory updated
    window.addEventListener('focus', loadData);
    window.addEventListener('inventoryUpdated', loadData);
    return () => {
      window.removeEventListener('focus', loadData);
      window.removeEventListener('inventoryUpdated', loadData);
    };
  }, [loadData]);

  const getThreshold = (material: Material) => thresholds[material.id] ?? material.safe_stock;

  const enriched = useMemo(() =>
    materials.map(material => {
      const threshold = getThreshold(material);
      const status = getMaterialStockStatus({ ...material, safe_stock: threshold });
      
      return {
        ...material,
        currentThreshold: threshold,
        severity: status.severity,
        currentStock: status.overallStock,
        lowStockSizes: status.lowStockSizes,
      } as MaterialWithStatus;
    }),
    [materials, thresholds]
  );

  // 按物品名称合并：将同名物品的多条记录合并为一行显示
  const merged = useMemo(() => {
    const itemMap = new Map<string, MaterialWithStatus>();

    enriched.forEach(item => {
      const existing = itemMap.get(item.name);
      if (existing) {
        // 合并 sizes
        const combinedSizes = [...(existing.sizes || [])];
        (item.sizes || []).forEach(size => {
          if (!combinedSizes.find(s => s.id === size.id)) {
            combinedSizes.push(size);
          }
        });

        // 库存直接取各记录 currentStock 之和（每个记录的 currentStock 已由 getMaterialStockStatus 正确计算）
        existing.currentStock += item.currentStock;

        // 合并低库存规格
        existing.lowStockSizes = [...existing.lowStockSizes, ...item.lowStockSizes];

        // 取最严重的等级
        const severityOrder = ['empty', 'critical', 'warning', 'normal'];
        if (severityOrder.indexOf(item.severity) < severityOrder.indexOf(existing.severity)) {
          existing.severity = item.severity;
        }

        // 合并来源ID
        existing.sourceIds = [...(existing.sourceIds || []), item.id];
        existing.sizes = combinedSizes;
      } else {
        itemMap.set(item.name, {
          ...item,
          sizes: [...(item.sizes || [])],
          lowStockSizes: [...item.lowStockSizes],
          sourceIds: [item.id],
        });
      }
    });

    return Array.from(itemMap.values());
  }, [enriched]);

  const counts = useMemo(() => ({
    empty:    merged.filter(i => i.severity === 'empty').length,
    critical: merged.filter(i => i.severity === 'critical').length,
    warning:  merged.filter(i => i.severity === 'warning').length,
    normal:   merged.filter(i => i.severity === 'normal').length,
  }), [merged]);

  const alertCount = counts.empty + counts.critical + counts.warning;

  const filtered = useMemo(() =>
    merged.filter(item => {
      const q = search.toLowerCase();
      const matchSearch = item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q);
      const matchTab    = activeTab === 'all' || item.severity === activeTab;
      return matchSearch && matchTab;
    }),
    [merged, search, activeTab]
  );

  const handleRestock = async (materialId: string, sizeId: string | null, qty: number) => {
    const material = materials.find(m => m.id === materialId);
    if (!material) return;

    const result = await updateMaterialStock(materialId, sizeId, qty, 'restock');
    
    if (result.success) {
      setRestockedIds(prev => [...prev, materialId]);
      setTimeout(() => setRestockedIds(prev => prev.filter(id => id !== materialId)), 3000);
    }
  };

  const handleSaveEdit = (
    materialId: string,
    _override: ItemOverride,
    _newStock: number,
    newThreshold: number | Record<string, number>
  ) => {
    // 找到合并后的物品，获取所有源记录ID
    const mergedItem = merged.find(m => m.id === materialId);
    const allIds = mergedItem?.sourceIds || [materialId];

    // Handle threshold update
    if (typeof newThreshold === 'number') {
      // 整体阈值 - 应用到所有源记录
      setThresholds(prev => {
        const updated = { ...prev };
        allIds.forEach(id => { updated[id] = newThreshold; });
        return updated;
      });
    } else if (typeof newThreshold === 'object') {
      // 多规格物品 - 使用最小值作为整体阈值，应用到所有源记录
      const allValues = Object.values(newThreshold);
      const minThreshold = allValues.length > 0 ? Math.min(...allValues) : 5;
      setThresholds(prev => {
        const updated = { ...prev };
        allIds.forEach(id => { updated[id] = minThreshold; });
        // 同时存储规格级别的阈值
        Object.entries(newThreshold).forEach(([sizeId, val]) => {
          updated[`${materialId}_${sizeId}`] = val;
        });
        return updated;
      });
    }
    
    toast.success('预警设置已保存');
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
        {loading ? (
          <div className="space-y-3 px-2">
            <div className="grid grid-cols-8 gap-4 mb-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-3 w-full rounded bg-muted/50 animate-pulse" />
              ))}
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="grid grid-cols-8 gap-4 py-4 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-muted/40 animate-pulse flex-shrink-0" />
                  <div className="space-y-1.5">
                    <div className="h-3.5 w-20 rounded bg-muted/50 animate-pulse" />
                    <div className="h-2.5 w-14 rounded bg-muted/40 animate-pulse" />
                  </div>
                </div>
                <div className="h-3 w-12 rounded bg-muted/40 animate-pulse self-center" />
                <div className="h-5 w-10 rounded bg-muted/40 animate-pulse self-center" />
                <div className="h-3 w-10 rounded bg-muted/40 animate-pulse self-center" />
                <div className="h-2 w-24 rounded-full bg-muted/40 animate-pulse self-center" />
                <div className="h-5 w-14 rounded-md bg-muted/40 animate-pulse self-center" />
                <div className="h-3 w-16 rounded bg-muted/40 animate-pulse self-center" />
                <div className="h-8 w-16 rounded-lg bg-muted/40 animate-pulse self-center" />
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/30 border-b border-border">
                {['物品名称', '物品编码', '当前库存', '预警阈值', '库存水位', '状态', '最近补货', '操作'].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-muted-foreground px-5 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-muted-foreground text-sm">
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
                            <p className="text-xs text-muted-foreground">
                            {item.category}
                            {item.sizes && item.sizes.length > 0 && (
                              <span className="ml-1">· {item.sizes.length} 个规格</span>
                            )}
                            </p>
                            {item.lowStockSizes && item.lowStockSizes.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {item.lowStockSizes.map(s => (
                                  <span key={s.id} className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/8 text-red-600 border border-red-500/15">
                                    {s.label}: {s.stock}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Item code & unit price */}
                      <td className="px-5 py-4">
                        <p className="text-xs text-primary font-medium">{item.item_code || '-'}</p>
                        {item.unit_price ? <p className="text-xs text-muted-foreground mt-0.5">¥{item.unit_price}</p> : null}
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
                          {item.lastRestock || '-'}
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
        )}

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
          allItems={enriched}
          onChange={(id, val) => setThresholds(prev => ({ ...prev, [id]: val }))}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}