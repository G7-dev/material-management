import { useState, useEffect } from 'react';
import {
  Package, Search, ArrowRight, X, ShoppingBag, CheckCircle2,
  ChevronDown, ChevronUp, User, Building2, Hash, FileText,
  Sparkles, Box, Minus, Plus, Layers, Calendar,
} from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { EnhancedSelect } from '../components/ui/enhanced-select';
import { DatePicker } from '../components/ui/date-picker';
import { saveApplicationRecord } from '../utils/applicationStore';
import { getAllInventoryItems, updateItemStock, updateItemStockWithSizes, type UnifiedInventoryItem } from '../data/unifiedInventoryData';

// ── Size / Spec variant ───────────────────────────────────────────────────────
interface SizeVariant {
  id: string;
  label: string;
  spec: string;
  stock: number;
}

interface DisplayItem {
  id: number;
  name: string;
  category: string;
  specModel: string;
  unit: string;
  quantity: number;
  lowStockThreshold: number;
  expiry: string;
  notes: string;
  sizes?: SizeVariant[];
}

// ── Departments ───────────────────────────────────────────────────────────────
const DEPARTMENTS = ['设备部', '技术部', '生产一部', '生产二部', '供应部', '储运部', '能源部', 'TPM'];

// ── Helper: Calculate total stock from sizes ─────────────────────────────────
function calculateTotalStock(item: DisplayItem): number {
  if (item.sizes && item.sizes.length > 0) {
    return item.sizes.reduce((sum, size) => sum + size.stock, 0);
  }
  return item.quantity;
}

// ── Status helper ─────────────────────────────────────────────────────────────
function getStatusInfo(item: DisplayItem) {
  const totalStock = calculateTotalStock(item);
  if (totalStock <= 0)
    return { label: '无库存', cls: 'bg-red-500/10 text-red-600 border-red-500/25', dot: 'bg-red-500', disabled: true };
  if (totalStock <= item.lowStockThreshold)
    return { label: '低库存', cls: 'bg-amber-500/10 text-amber-600 border-amber-500/25', dot: 'bg-amber-500', disabled: false };
  return { label: '库存充足', cls: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/25', dot: 'bg-emerald-500', disabled: false };
}

// ── Apply Modal ───────────────────────────────────────────────────────────────
function ApplyModal({
  item,
  onClose,
  onSuccess,
}: {
  item: DisplayItem;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [selectedSize, setSelectedSize] = useState<SizeVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [department, setDepartment] = useState('');
  const [name, setName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [usage, setUsage] = useState('');
  const [expectedDate, setExpectedDate] = useState<Date | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);

  const hasSizes = item.sizes && item.sizes.length > 0;
  const totalStock = calculateTotalStock(item);
  const maxStock = selectedSize ? selectedSize.stock : totalStock;

  const canSubmit =
    name.trim() &&
    employeeId.trim() &&
    department &&
    usage.trim() &&
    expectedDate instanceof Date &&
    quantity > 0 &&
    maxStock > 0 &&
    (!hasSizes || selectedSize);

  const handleSubmit = () => {
    if (!canSubmit) return;
    setSubmitting(true);
    
    // Format expectedDate to include time
    const formattedExpectedDate = expectedDate ? expectedDate.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).replace(/\//g, '-') : new Date().toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).replace(/\//g, '-');
    
    // Save application record (do NOT deduct stock here - wait for approval)
    saveApplicationRecord({
      itemId: item.id,
      itemName: item.name + (selectedSize ? ` (${selectedSize.label})` : ''),
      quantity,
      unit: item.unit || '个',
      usage: usage.trim(),
      applicationType: '日常领用',
      applicant: name.trim(),
      department,
      employeeId: employeeId.trim(),
      expectedDate: formattedExpectedDate,
    });
    
    setTimeout(() => {
      setSubmitting(false);
      onSuccess();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md" onClick={onClose}>
      <div
        className="bg-background rounded-2xl shadow-2xl shadow-black/20 border border-border/80 w-full max-w-lg mx-4 overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with gradient bar */}
        <div className="relative">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
          <div className="flex items-center justify-between p-6 pt-7">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500/15 to-purple-500/15 flex items-center justify-center border border-indigo-500/20 shadow-sm">
                <ShoppingBag className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-bold text-foreground text-lg">申请领用</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{item.name}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2.5 rounded-xl hover:bg-muted/80 transition-colors border border-transparent hover:border-border">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 pb-2 space-y-5 overflow-y-auto flex-1">
          {/* Item info card */}
          <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 rounded-xl border border-indigo-100/60">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center shrink-0 shadow-sm">
              {item.image ? (
                <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-xl" />
              ) : (
                <Package className="w-7 h-7 text-indigo-500/60" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-foreground truncate">{item.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{item.specModel} · 总库存 {totalStock} {item.unit || '个'}</p>
            </div>
          </div>

          {/* Size / Spec selection */}
          {hasSizes && (
            <div>
              <label className="text-sm font-semibold text-foreground mb-3 block">
                选择规格 <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {item.sizes!.map((s) => {
                  const isSelected = selectedSize?.id === s.id;
                  const outOfStock = s.stock <= 0;
                  return (
                    <button
                      key={s.id}
                      disabled={outOfStock}
                      onClick={() => {
                        setSelectedSize(isSelected ? null : s);
                        setQuantity(1);
                      }}
                      className={`relative p-3.5 rounded-xl border text-left transition-all duration-200 ${
                        outOfStock
                          ? 'border-border bg-muted/30 opacity-50 cursor-not-allowed'
                          : isSelected
                          ? 'border-indigo-500/50 bg-indigo-500/5 ring-2 ring-indigo-500/20 shadow-sm'
                          : 'border-border hover:border-indigo-500/30 hover:bg-indigo-500/[0.02] hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-semibold ${isSelected ? 'text-indigo-600' : 'text-foreground'}`}>
                          {s.label}
                        </span>
                        {outOfStock && (
                          <Badge variant="secondary" className="text-[10px] bg-red-500/10 text-red-500 border-red-500/20">
                            无库存
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{s.spec} · 库存 {s.stock}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Employee info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-500/60" />
                姓名 <span className="text-red-500">*</span>
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="请输入姓名"
                className="h-11 bg-muted/30 border-border/80 rounded-xl focus:ring-indigo-500/20 focus:border-indigo-500/40"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-indigo-500/60" />
                工号 <span className="text-red-500">*</span>
              </label>
              <Input
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="请输入工号"
                className="h-11 bg-muted/30 border-border/80 rounded-xl focus:ring-indigo-500/20 focus:border-indigo-500/40"
              />
            </div>
          </div>

          {/* Department */}
          <div>
            <label className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-indigo-500/60" />
              所属部门 <span className="text-red-500">*</span>
            </label>
            <EnhancedSelect
              value={department}
              onChange={setDepartment}
              placeholder="请选择部门"
              options={DEPARTMENTS.map(d => ({ value: d, label: d }))}
              size="md"
              variant="filled"
            />
          </div>

          {/* Quantity */}
          <div>
            <label className="text-sm font-semibold text-foreground mb-2 block">申领数量</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-11 h-11 rounded-xl border border-border/80 bg-muted/30 flex items-center justify-center hover:bg-muted/60 hover:border-border transition-all active:scale-95"
              >
                <Minus className="w-4 h-4 text-foreground" />
              </button>
              <Input
                type="number"
                min={1}
                max={maxStock}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Math.min(maxStock, parseInt(e.target.value) || 1)))}
                className="h-11 text-center w-20 font-bold text-base rounded-xl"
              />
              <button
                onClick={() => setQuantity(Math.min(maxStock, quantity + 1))}
                className="w-11 h-11 rounded-xl border border-border/80 bg-muted/30 flex items-center justify-center hover:bg-muted/60 hover:border-border transition-all active:scale-95"
              >
                <Plus className="w-4 h-4 text-foreground" />
              </button>
              <span className="text-sm text-muted-foreground font-medium">
                {item.unit || '个'}
                {selectedSize && <span className="ml-1.5 text-xs text-indigo-500">(可用 {selectedSize.stock})</span>}
              </span>
            </div>
          </div>

          {/* Usage */}
          <div>
            <label className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-indigo-500/60" />
              用途说明 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={usage}
              onChange={(e) => setUsage(e.target.value)}
              placeholder="请简要描述领用用途..."
              rows={3}
              className="w-full rounded-xl border border-border/80 bg-muted/30 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/40 transition-all resize-none"
            />
          </div>

          {/* Expected DateTime */}
          <div>
            <DatePicker
              label={
                <span className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-500/60" />
                  预计领用时间 <span className="text-red-500">*</span>
                </span>
              }
              value={expectedDate}
              onChange={(date) => setExpectedDate(date)}
              placeholder="请选择预计领用时间"
              showTime={true}
              minDate={new Date()}
              helperText="预计什么时候使用（精确到分钟）"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-border/60 bg-muted/10 shrink-0">
          <Button variant="outline" className="flex-1 h-11 rounded-xl border-border/80 font-medium" onClick={onClose}>
            取消
          </Button>
          <button
            className={`flex-1 h-11 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 ${
              canSubmit && !submitting
                ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-md shadow-indigo-500/25 hover:shadow-lg hover:shadow-indigo-500/30 active:scale-[0.98]'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            }`}
            disabled={!canSubmit || submitting}
            onClick={handleSubmit}
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                提交中...
              </>
            ) : (
              <>
                提交申请
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Success Toast ─────────────────────────────────────────────────────────────
function SuccessToast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 2500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed top-6 right-6 z-[60] flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-700 px-5 py-3.5 rounded-xl shadow-lg shadow-emerald-500/10 animate-in slide-in-from-top-2">
      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
}

// ── Item Card ─────────────────────────────────────────────────────────────────
function ItemCard({ item, onApply }: { item: DisplayItem; onApply: () => void }) {
  const [showSizes, setShowSizes] = useState(false);
  const status = getStatusInfo(item);
  const hasSizes = item.sizes && item.sizes.length > 0;
  const totalStock = calculateTotalStock(item);

  return (
    <Card className={`group flex flex-col overflow-hidden border-border/60 transition-all duration-300 ${
      status.disabled
        ? 'opacity-50 grayscale-[30%]'
        : 'hover:shadow-xl hover:shadow-indigo-500/[0.06] hover:-translate-y-1 hover:border-indigo-500/20'
    }`}>
      {/* Top gradient accent */}
      <div className="h-0.5 bg-gradient-to-r from-indigo-500/40 via-purple-500/40 to-pink-500/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Image area */}
      <div className="relative w-full h-40 bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/40 flex items-center justify-center overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-gradient-to-br from-indigo-200/20 to-purple-200/20 blur-xl" />
        <div className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full bg-gradient-to-br from-purple-200/15 to-pink-200/15 blur-lg" />

        {item.image ? (
          <img src={item.image} alt={item.name} className="w-full h-full object-cover relative z-10" />
        ) : (
          <div className="relative z-10 w-16 h-16 rounded-2xl bg-white/90 shadow-lg shadow-indigo-500/[0.08] border border-indigo-100/60 flex items-center justify-center backdrop-blur-sm">
            <Package className="w-8 h-8 text-indigo-400/70" />
          </div>
        )}

        {/* Status badge */}
        <div className="absolute top-3 right-3 z-20">
          <Badge variant="secondary" className={`text-[10px] font-bold border backdrop-blur-md shadow-sm ${status.cls}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status.dot} mr-1 animate-pulse`} />
            {status.label}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5">
        {/* Name & spec */}
        <div className="mb-3">
          <h3 className="font-bold text-foreground text-[15px] leading-tight truncate group-hover:text-indigo-600 transition-colors">
            {item.name}
          </h3>
          <p className="text-xs text-muted-foreground mt-1 truncate">{item.specModel}</p>
        </div>

        {/* Stock info */}
        <div className="text-xs bg-gradient-to-r from-muted/50 to-muted/30 p-3.5 rounded-xl border border-border/50 space-y-2 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Box className="w-3 h-3" />
              {item.category || '未分类'}
            </span>
            <span className="text-foreground font-bold">
              总库存 <span className="text-indigo-600">{totalStock}</span>
            </span>
          </div>
          {hasSizes && (
            <>
              <button
                onClick={() => setShowSizes(!showSizes)}
                className="flex items-center gap-1 text-indigo-500 hover:text-indigo-600 transition-colors font-semibold pt-0.5"
              >
                {showSizes ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                查看各规格库存
              </button>
              {showSizes && (
                <div className="space-y-1.5 pt-2 border-t border-border/50">
                  {item.sizes!.map((s) => (
                    <div key={s.id} className="flex justify-between items-center py-0.5">
                      <span className="text-muted-foreground">{s.label}</span>
                      <span className={`font-semibold ${s.stock <= 0 ? 'text-red-500' : s.stock <= 3 ? 'text-amber-500' : 'text-emerald-600'}`}>
                        {s.stock <= 0 ? '无库存' : s.stock}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Action */}
        {status.disabled ? (
          <div className="w-full h-11 rounded-xl bg-muted/60 border border-border/60 flex items-center justify-center text-sm text-muted-foreground font-medium cursor-not-allowed">
            暂无库存
          </div>
        ) : (
          <button
            onClick={onApply}
            className="w-full h-11 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-300 shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/30 active:scale-[0.97] group/btn"
          >
            立即申请
            <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
          </button>
        )}
      </div>
    </Card>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, accent }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  accent: string;
}) {
  return (
    <div className={`flex items-center gap-3.5 px-5 py-4 rounded-xl border backdrop-blur-sm ${accent}`}>
      <div className="w-10 h-10 rounded-lg bg-white/60 flex items-center justify-center shadow-sm">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold leading-none">{value}</p>
        <p className="text-xs mt-1 opacity-70 font-medium">{label}</p>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function DailyCollection() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');
  const [items, setItems] = useState<DisplayItem[]>([]);
  const [applyItem, setApplyItem] = useState<DisplayItem | null>(null);
  const [toast, setToast] = useState('');

  const loadItems = () => {
    const inventoryItems = getAllInventoryItems();
    const displayItems: DisplayItem[] = inventoryItems.map(item => ({
      id: item.id,
      name: item.name,
      category: item.category,
      specModel: item.spec,
      unit: item.unit,
      quantity: item.stock,
      lowStockThreshold: item.threshold,
      expiry: item.lastRestock,
      notes: '',
      sizes: item.sizes
    }));
    setItems(displayItems);
  };

  useEffect(() => {
    loadItems();
    // 添加事件监听器，当库存更新时自动刷新
    window.addEventListener('inventoryUpdated', loadItems);
    return () => window.removeEventListener('inventoryUpdated', loadItems);
  }, []);

  const handleSuccess = () => {
    setApplyItem(null);
    loadItems();
    setToast('申请已提交，请等待审批');
  };

  const categories = Array.from(new Set(items.map((i) => i.category).filter(Boolean)));

  const filtered = items.filter((item) => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q) || item.specModel.toLowerCase().includes(q);
    const matchTab = selectedTab === 'all' || item.category === selectedTab;
    return matchSearch && matchTab;
  });

  const totalItems = items.length;
  const totalStock = items.reduce((sum, i) => sum + i.quantity, 0);
  const lowStockCount = items.filter(i => i.quantity > 0 && i.quantity <= i.lowStockThreshold).length;

  return (
    <div className="p-8 space-y-8">
      {toast && <SuccessToast message={toast} onClose={() => setToast('')} />}
      {applyItem && <ApplyModal item={applyItem} onClose={() => setApplyItem(null)} onSuccess={handleSuccess} />}

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-8 text-white">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4 blur-xl" />
        <div className="absolute top-1/2 right-1/4 w-3 h-3 bg-white/20 rounded-full" />
        <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-white/15 rounded-full" />
        <div className="absolute bottom-1/3 left-1/3 w-2 h-2 bg-white/10 rounded-full" />

        <div className="relative z-10 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20 shadow-lg shadow-black/10">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">日常领用</h1>
                <p className="text-white/70 text-sm mt-0.5">选择您需要的物资进行申领，快速完成审批流程</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/15 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-yellow-300" />
            <span className="text-sm font-medium">自助申领</span>
          </div>
        </div>

        {/* Stats row */}
        <div className="relative z-10 grid grid-cols-3 gap-4 mt-6">
          <StatCard
            icon={Layers}
            label="可选物品"
            value={totalItems}
            accent="bg-white/10 border-white/15 text-white"
          />
          <StatCard
            icon={Package}
            label="总库存量"
            value={totalStock}
            accent="bg-white/10 border-white/15 text-white"
          />
          <StatCard
            icon={Sparkles}
            label="低库存预警"
            value={lowStockCount}
            accent={lowStockCount > 0 ? 'bg-amber-400/20 border-amber-300/20 text-amber-100' : 'bg-white/10 border-white/15 text-white'}
          />
        </div>
      </div>

      {/* Search + Filter */}
      <Card className="p-5 border-border/60 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="搜索物资名称、分类或规格..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 bg-muted/40 border-border/60 rounded-xl focus:ring-indigo-500/20 focus:border-indigo-500/40"
            />
          </div>
        </div>
        <div className="flex gap-2 mt-4 pt-4 border-t border-border/50 flex-wrap">
          <button
            onClick={() => setSelectedTab('all')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
              selectedTab === 'all'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md shadow-indigo-500/20'
                : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            全部物资
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedTab(cat)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                selectedTab === cat
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md shadow-indigo-500/20'
                  : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </Card>

      {/* Empty */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-100/50 to-purple-100/50 flex items-center justify-center mb-5 shadow-sm border border-indigo-100/40">
            <Package className="w-10 h-10 text-indigo-300" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-1">暂无可领用物资</h3>
          <p className="text-sm text-muted-foreground">
            {items.length === 0 ? '管理员尚未上架物品，请稍后再来查看' : '没有找到匹配的物资'}
          </p>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filtered.map((item) => (
          <ItemCard key={item.id} item={item} onApply={() => setApplyItem(item)} />
        ))}
      </div>
    </div>
  );
}
