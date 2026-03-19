import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  PackagePlus, CloudUpload, Upload, X, CheckCircle2, AlertCircle,
  Package, Tag, Layers, Hash, Calendar, FileText,
  Info, Sparkles, ChevronRight, Image as ImageIcon, Loader2,
  Save, ArrowRight, RotateCcw, AlertTriangle, BellRing,
  ChevronDown, Check, Pencil,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { AppSelect } from '../components/ui/app-select';
import { saveStoredItem } from '../utils/itemStore';
import { getAllInventoryItems } from '../data/unifiedInventoryData';

const tips = [
  { icon: ImageIcon, text: '建议上传清晰正面图，分辨率不低于 800×800px' },
  { icon: Tag,       text: '分类命名请参考已有标准，保持一致性' },
  { icon: Hash,      text: '上架数量须与实际盘库数量一致' },
  { icon: Calendar,  text: '有效期限默认为今日上架日期，可按需修改' },
  { icon: BellRing,  text: '低库存预警数量建议设为上架数量的 10%–20%，留出补货缓冲' },
];

const TODAY = new Date().toISOString().split('T')[0];

const EMPTY_FORM = {
  name: '',
  category: '',
  specModel: '',
  unit: '',
  quantity: '',
  expiry: TODAY,
  lowStockThreshold: '',
  notes: '',
  stockPlatform: '',
};

const UNIT_OPTIONS = ['件', '个', '包', '张', '本', '盒', '套', '卷', '瓶', '箱'];

// ── UnitSelect: 预设单位 + 自主编辑 ──────────────────────────────────────────
function UnitSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen]           = useState(false);
  const [customMode, setCustomMode] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef     = useRef<HTMLInputElement>(null);

  const isCustom = value !== '' && !UNIT_OPTIONS.includes(value);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setCustomMode(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); setCustomMode(false); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  // 进入自主编辑模式时聚焦输入框
  useEffect(() => {
    if (customMode && inputRef.current) {
      inputRef.current.focus();
    }
  }, [customMode]);

  const handleSelect = (v: string) => {
    onChange(v);
    setOpen(false);
    setCustomMode(false);
  };

  const handleCustomConfirm = () => {
    const trimmed = customInput.trim();
    if (trimmed) {
      onChange(trimmed);
      setCustomInput('');
    }
    setOpen(false);
    setCustomMode(false);
  };

  const displayLabel = value || '请选择单位';

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => { setOpen(v => !v); setCustomMode(false); }}
        className={`w-full flex items-center justify-between gap-2 px-3 h-11 rounded-lg border text-sm transition-all duration-200 outline-none ${
          open
            ? 'border-primary/60 ring-3 ring-primary/15 bg-white shadow-sm shadow-primary/10'
            : 'border-border bg-white hover:border-primary/30 hover:bg-primary/[0.02] shadow-sm'
        } ${!value ? 'text-muted-foreground/70' : 'text-foreground'}`}
      >
        <span className="flex items-center gap-2">
          {isCustom && <Pencil className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
          <span className={!value ? 'text-muted-foreground/70' : ''}>{displayLabel}</span>
          {isCustom && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 font-medium">自定义</span>
          )}
        </span>
        <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180 text-primary' : 'text-muted-foreground/60'}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 w-full mt-1.5 rounded-xl border border-border/80 bg-white shadow-xl shadow-black/10 overflow-hidden animate-in fade-in-0 zoom-in-95 slide-in-from-top-1 duration-150">
          <div className="h-0.5 bg-gradient-to-r from-primary/60 via-secondary/60 to-transparent" />

          {customMode ? (
            /* 自主编辑模式 */
            <div className="p-3 space-y-2">
              <p className="text-xs text-muted-foreground px-1">请输入自定义单位</p>
              <input
                ref={inputRef}
                type="text"
                value={customInput}
                onChange={e => setCustomInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleCustomConfirm(); }}
                placeholder="例如：捆、根、片、颗..."
                className="w-full px-3 py-2 h-9 rounded-lg border border-primary/40 bg-primary/3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/60 placeholder:text-muted-foreground/60 transition-all"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCustomConfirm}
                  disabled={!customInput.trim()}
                  className="flex-1 h-8 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  确认
                </button>
                <button
                  type="button"
                  onClick={() => setCustomMode(false)}
                  className="flex-1 h-8 rounded-lg border border-border text-xs text-muted-foreground hover:bg-muted/60 transition-colors"
                >
                  返回列表
                </button>
              </div>
            </div>
          ) : (
            /* 选项列表模式 */
            <div className="p-1.5">
              <div className="max-h-52 overflow-y-auto">
                {UNIT_OPTIONS.map(opt => {
                  const isSelected = opt === value;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handleSelect(opt)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-left transition-all duration-150 group ${
                        isSelected
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'text-foreground hover:bg-primary/6 hover:text-primary'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors ${
                        isSelected ? 'bg-primary' : 'bg-border group-hover:bg-primary/50'
                      }`} />
                      <span className="flex-1">{opt}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* 未找到？自主编辑 footer */}
              <div className="mt-1 pt-1 border-t border-border/60">
                <button
                  type="button"
                  onClick={() => { setCustomMode(true); setCustomInput(''); }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-primary/6 hover:text-primary transition-all duration-150 group"
                >
                  <Pencil className="w-3.5 h-3.5 flex-shrink-0 transition-colors group-hover:text-primary" />
                  <span>未找到？自主编辑</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Success Overlay ────────────────────────────────────────────────────────────
function SuccessOverlay({
  item,
  onContinue,
  onViewInventory,
}: {
  item: { name: string; category: string; quantity: string; stockPlatform: string };
  onContinue: () => void;
  onViewInventory: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative bg-white rounded-2xl shadow-2xl shadow-primary/20 border border-border w-full max-w-md mx-4 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-2 duration-300">
        <div className="h-1.5 bg-gradient-to-r from-emerald-400 via-primary to-secondary" />
        <div className="p-8 text-center">
          <div className="relative mx-auto mb-6 w-20 h-20">
            <div className="absolute inset-0 rounded-full bg-emerald-500/15 animate-ping" style={{ animationDuration: '1.5s' }} />
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
          </div>

          <h2 className="text-xl font-bold text-foreground mb-1">上架成功！</h2>
          <p className="text-sm text-muted-foreground mb-6">物品已成功录入系统库存</p>

          <div className="bg-muted/40 border border-border rounded-xl p-4 text-left mb-6 space-y-2.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">物品名称</span>
              <span className="font-semibold text-foreground">{item.name}</span>
            </div>
            <div className="h-px bg-border" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">分类</span>
              <span className="font-medium text-foreground">{item.category}</span>
            </div>
            <div className="h-px bg-border" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">上架数量</span>
              <span className="font-semibold text-primary">{item.quantity} 件</span>
            </div>
            <div className="h-px bg-border" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">库存类型</span>

            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 h-11 border-border gap-2"
              onClick={onContinue}
            >
              <RotateCcw className="w-4 h-4" />
              继续上架
            </Button>
            <Button
              className="flex-1 h-11 bg-gradient-to-r from-primary to-secondary gap-2 hover:shadow-lg hover:shadow-primary/25 transition-all"
              onClick={onViewInventory}
            >
              查看库存
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Cancel Confirm Dialog ────────────────────────────────────────────────────────
function CancelConfirmDialog({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative bg-white rounded-2xl shadow-2xl border border-border w-full max-w-sm mx-4 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="h-1 bg-gradient-to-r from-rose-400 to-orange-400" />
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">放弃当前填写？</h3>
              <p className="text-xs text-muted-foreground mt-0.5">此操作将清空所有已填写内容</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-5 pl-1">
            表单中的内容尚未保存，确认放弃后数据将无法恢复，建议先「保存草稿」。
          </p>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 h-10 border-border" onClick={onCancel}>
              继续填写
            </Button>
            <Button
              className="flex-1 h-10 bg-rose-500 hover:bg-rose-600 text-white border-0 transition-colors"
              onClick={onConfirm}
            >
              确认放弃
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export function ItemUpload() {
  const navigate = useNavigate();
  const [dragOver, setDragOver]           = useState(false);
  const [previewImage, setPreviewImage]   = useState<string | null>(null);
  const [formData, setFormData]           = useState({ ...EMPTY_FORM });
  const [isUploading, setIsUploading]     = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [savedItem, setSavedItem]         = useState<typeof EMPTY_FORM | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [draftSaved, setDraftSaved]       = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showNameSuggestions, setShowNameSuggestions] = useState(false);
  const nameInputRef = useRef<HTMLDivElement>(null);

  const completedFields = Object.values(formData).filter(v => v.trim() !== '').length;
  const totalFields     = Object.keys(formData).length;
  const progress        = Math.round((completedFields / totalFields) * 100);

  const handleFieldChange = (key: string, value: string) => {
    setFormData(prev => {
      const updated = { ...prev, [key]: value };
      
      // Auto-fill category and unit if name matches existing item
      if (key === 'name' && value) {
        const existingItems = getAllInventoryItems();
        const matchedItem = existingItems.find(item => 
          item.name.toLowerCase() === value.toLowerCase()
        );
        
        if (matchedItem) {
          updated.category = matchedItem.category;
          updated.unit = matchedItem.unit;
        }
      }
      
      return updated;
    });
    
    // Show/hide name suggestions
    if (key === 'name') {
      setShowNameSuggestions(value.length > 0);
    }
  };

  const getNameSuggestions = () => {
    if (!formData.name) return [];
    const existingItems = getAllInventoryItems();
    return existingItems
      .filter(item => 
        item.name.toLowerCase().includes(formData.name.toLowerCase()) &&
        item.name.toLowerCase() !== formData.name.toLowerCase()
      )
      .slice(0, 5);
  };

  const isDirty       = Object.values(formData).some(v => v !== '' && v !== TODAY) || !!previewImage;
  const requiredFilled = formData.name && formData.category && formData.quantity && formData.stockPlatform;

  // Close suggestions when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!nameInputRef.current?.contains(e.target as Node)) {
        setShowNameSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleUpload = async () => {
    if (!requiredFilled || isUploading) return;
    
    // Check for duplicates (name + specModel)
    const existingItems = getAllInventoryItems();
    const isDuplicate = existingItems.some(item => 
      item.name.toLowerCase() === formData.name.toLowerCase() &&
      item.spec.toLowerCase() === formData.specModel.toLowerCase()
    );
    
    if (isDuplicate) {
      toast.error('该物品已存在，无法重复上架');
      return;
    }
    
    setIsUploading(true);
    await new Promise(r => setTimeout(r, 1600));

    // Persist to shared localStorage store so 物品补货 can read it
    saveStoredItem({
      name: formData.name,
      category: formData.category,
      specModel: formData.specModel,
      unit: formData.unit,
      quantity: parseInt(formData.quantity) || 0,
      lowStockThreshold: parseInt(formData.lowStockThreshold) || 0,
      stockPlatform: formData.stockPlatform,
      expiry: formData.expiry,
      notes: formData.notes,
      image: previewImage ?? undefined,
    });

    setIsUploading(false);
    setSavedItem({ ...formData });
    setUploadSuccess(true);
  };

  const handleAfterSuccess = () => {
    setUploadSuccess(false);
    setSavedItem(null);
    setFormData({ ...EMPTY_FORM });
    setPreviewImage(null);
  };

  const handleSaveDraft = () => {
    if (draftSaved) return;
    setDraftSaved(true);
    toast.success('草稿已保存', {
      description: `「${formData.name || '未命名物品'}」已暂存，随时可继续编辑`,
      duration: 3000,
      icon: '📄',
    });
    setTimeout(() => setDraftSaved(false), 2500);
  };

  const handleCancelClick = () => {
    if (isDirty) {
      setShowCancelConfirm(true);
    } else {
      setFormData({ ...EMPTY_FORM });
      setPreviewImage(null);
    }
  };

  const handleConfirmCancel = () => {
    setShowCancelConfirm(false);
    setFormData({ ...EMPTY_FORM });
    setPreviewImage(null);
    toast('已放弃填写', { description: '表单已重置', duration: 2000 });
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <PackagePlus className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-3xl font-semibold text-foreground tracking-tight">物品上架</h1>
          </div>
          <p className="text-muted-foreground mt-1 ml-13">添加新物品到系统库存，填写完整信息以便管理和领用</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-primary/5 border border-primary/10 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium">表单完成度 {progress}%</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500 rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Left: Form */}
        <div className="xl:col-span-2 space-y-5">

          {/* Image Upload */}
          <Card className="p-6 border-border">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
                <ImageIcon className="w-3.5 h-3.5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">物品图片</h3>
              <span className="text-destructive text-sm ml-0.5">*</span>
            </div>

            {previewImage ? (
              <div className="relative rounded-xl overflow-hidden border border-border group">
                <img src={previewImage} alt="预览" className="w-full h-52 object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button
                    onClick={() => setPreviewImage(null)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-white/90 text-foreground rounded-lg text-sm font-medium hover:bg-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                    移除图片
                  </button>
                </div>
                <div className="absolute bottom-3 left-3 px-2.5 py-1 bg-black/60 backdrop-blur-sm rounded-lg text-white text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  图片已上传
                </div>
              </div>
            ) : (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const file = e.dataTransfer.files[0];
                  if (file && file.type.startsWith('image/')) {
                    setPreviewImage(URL.createObjectURL(file));
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-10 cursor-pointer transition-all duration-300 group ${
                  dragOver
                    ? 'border-primary bg-primary/5 scale-[1.01]'
                    : 'border-border hover:border-primary/50 hover:bg-primary/3'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && file.type.startsWith('image/')) {
                      setPreviewImage(URL.createObjectURL(file));
                    }
                  }}
                  accept="image/*"
                  className="hidden"
                />
                <div className="flex flex-col items-center justify-center text-center">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300 ${
                    dragOver ? 'bg-primary/20 scale-110' : 'bg-primary/8 group-hover:bg-primary/15'
                  }`}>
                    <CloudUpload className="w-7 h-7 text-primary" />
                  </div>
                  <p className="font-medium text-foreground mb-1">
                    {dragOver ? '释放以上传图片' : '点击或拖拽上传物品图片'}
                  </p>
                  <p className="text-sm text-muted-foreground">支持 JPG、PNG、WebP 格式，单张最大 5MB</p>
                  <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="h-px w-12 bg-border" />
                    <span>或者</span>
                    <div className="h-px w-12 bg-border" />
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-3 px-4 py-2 border border-border rounded-lg text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    浏览文件
                  </button>
                </div>
              </div>
            )}
          </Card>

          {/* Basic Info */}
          <Card className="p-6 border-border">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-6 h-6 rounded-md bg-secondary/10 flex items-center justify-center">
                <FileText className="w-3.5 h-3.5 text-secondary" />
              </div>
              <h3 className="font-semibold text-foreground">基本信息</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="relative" ref={nameInputRef}>
                <label className="block text-sm font-medium text-foreground mb-2">
                  物品名称 <span className="text-destructive">*</span>
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  placeholder="E.g. 办公用品名称"
                  className="h-11 bg-muted/50 border-border"
                />
                
                {/* Name suggestions dropdown */}
                {showNameSuggestions && getNameSuggestions().length > 0 && (
                  <div className="absolute z-50 w-full mt-1 rounded-xl border border-border bg-white shadow-xl overflow-hidden">
                    {getNameSuggestions().map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            name: item.name,
                            category: item.category,
                            unit: item.unit
                          }));
                          setShowNameSuggestions(false);
                        }}
                        className="w-full px-4 py-2.5 text-left text-sm hover:bg-muted/50 transition-colors flex items-center justify-between"
                      >
                        <span className="text-foreground font-medium">{item.name}</span>
                        <span className="text-xs text-muted-foreground">{item.category}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  物品分类 <span className="text-destructive">*</span>
                </label>
                <AppSelect
                  value={formData.category}
                  onChange={(v) => handleFieldChange('category', v)}
                  placeholder="请选择物品分类"
                  options={[
                    { value: '办公耗材', label: '办公耗材' },
                    { value: '清洁工具', label: '清洁工具' },
                    { value: '穿戴品',   label: '穿戴品'   },
                    { value: '衣服',     label: '衣服'     },
                    { value: '鞋子',     label: '鞋子'     },
                    { value: '其他',     label: '其他'     },
                  ]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">规格型号</label>
                <Input
                  value={formData.specModel}
                  onChange={(e) => handleFieldChange('specModel', e.target.value)}
                  placeholder="型号、A4, 100张、营业号"
                  className="h-11 bg-muted/50 border-border"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">单位</label>
                <UnitSelect
                  value={formData.unit}
                  onChange={(v) => handleFieldChange('unit', v)}
                />
              </div>
            </div>
          </Card>

          {/* Inventory Info */}
          <Card className="p-6 border-border">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-6 h-6 rounded-md bg-emerald-500/10 flex items-center justify-center">
                <Layers className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-foreground">库存信息</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  上架数量 <span className="text-destructive">*</span>
                </label>
                <Input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => handleFieldChange('quantity', e.target.value)}
                  placeholder="请输入数量"
                  className="h-11 bg-muted/50 border-border"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                  有效期限
                </label>
                <Input
                  type="date"
                  value={formData.expiry}
                  onChange={(e) => handleFieldChange('expiry', e.target.value)}
                  className="h-11 bg-muted/50 border-border"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-foreground mb-2">
                  组件库存台 <span className="text-destructive">*</span>
                </label>
                <AppSelect
                  value={formData.stockPlatform}
                  onChange={(v) => handleFieldChange('stockPlatform', v)}
                  placeholder="请选择库存位置"
                  options={[
                    { value: '备件库存', label: '备件库存' },
                    { value: '耗材库存', label: '耗材库存' },
                    { value: '办公用品库', label: '办公用品库' },
                    { value: '设备库', label: '设备库' },
                    { value: '应急物资库', label: '应急物资库' },
                    { value: '其他', label: '其他' },
                  ]}
                />
              </div>
              {/* ── 低库存预警数量 ── */}
              <div className="col-span-2">
                {(() => {
                  const qty  = parseInt(formData.quantity)  || 0;
                  const thr  = parseInt(formData.lowStockThreshold) || 0;
                  const suggested = qty > 0 ? Math.max(1, Math.round(qty * 0.15)) : 0;
                  const pct  = qty > 0 ? Math.min(100, Math.round((thr / qty) * 100)) : 0;
                  const isOver   = thr > 0 && qty > 0 && thr >= qty;
                  const isHigh   = thr > 0 && qty > 0 && pct > 40 && !isOver;
                  const barColor = isOver ? 'bg-rose-500' : isHigh ? 'bg-amber-400' : 'bg-emerald-500';
                  return (
                    <div className={`rounded-xl border p-4 transition-all duration-300 ${
                      isOver
                        ? 'border-rose-300 bg-rose-500/5'
                        : isHigh
                        ? 'border-amber-300 bg-amber-500/5'
                        : 'border-border bg-muted/30'
                    }`}>
                      {/* Row: label + auto-suggest */}
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                          <BellRing className={`w-3.5 h-3.5 ${isOver ? 'text-rose-500' : isHigh ? 'text-amber-500' : 'text-muted-foreground'}`} />
                          低库存预警数量
                        </label>
                        {suggested > 0 && (
                          <button
                            type="button"
                            onClick={() => handleFieldChange('lowStockThreshold', String(suggested))}
                            className="text-xs px-2.5 py-1 rounded-lg bg-primary/8 text-primary border border-primary/15 hover:bg-primary/15 transition-colors font-medium"
                          >
                            建议值 {suggested} 件
                          </button>
                        )}
                      </div>

                      {/* Input row */}
                      <div className="flex items-center gap-3">
                        <div className="relative flex-1">
                          <Input
                            type="number"
                            min={0}
                            value={formData.lowStockThreshold}
                            onChange={(e) => handleFieldChange('lowStockThreshold', e.target.value)}
                            placeholder={suggested > 0 ? `建议 ${suggested}` : '请输入预警数量'}
                            className={`h-11 bg-white/80 pr-10 transition-colors ${
                              isOver
                                ? 'border-rose-400 focus-visible:ring-rose-400/30'
                                : isHigh
                                ? 'border-amber-400 focus-visible:ring-amber-400/30'
                                : 'border-border'
                            }`}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">件</span>
                        </div>
                        {/* Status badge */}
                        {thr > 0 && qty > 0 && (
                          <div className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border ${
                            isOver
                              ? 'bg-rose-500/10 text-rose-600 border-rose-300'
                              : isHigh
                              ? 'bg-amber-500/10 text-amber-600 border-amber-300'
                              : 'bg-emerald-500/10 text-emerald-600 border-emerald-300'
                          }`}>
                            {isOver
                              ? <><AlertTriangle className="w-3.5 h-3.5" /> 超过库存</>
                              : isHigh
                              ? <><AlertCircle className="w-3.5 h-3.5" /> 偏高 {pct}%</>
                              : <><CheckCircle2 className="w-3.5 h-3.5" /> {pct}%</>
                            }
                          </div>
                        )}
                      </div>

                      {/* Ratio bar */}
                      {thr > 0 && qty > 0 && (
                        <div className="mt-3 space-y-1">
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                              style={{ width: `${Math.min(100, pct)}%` }}
                            />
                          </div>
                          <p className={`text-xs ${isOver ? 'text-rose-500' : isHigh ? 'text-amber-600' : 'text-muted-foreground'}`}>
                            {isOver
                              ? `⚠️ 预警值（${thr}件）不能大于或等于上架数量（${qty}件）`
                              : `库存降至 ${thr} 件（总量的 ${pct}%）时触发补货预警`
                            }
                          </p>
                        </div>
                      )}
                      {!thr && (
                        <p className="text-xs text-muted-foreground mt-2">
                          设置预警值后，当库存低于该数量时系统将自动提醒补货
                        </p>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          </Card>

          {/* Notes */}
          <Card className="p-6 border-border">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-6 h-6 rounded-md bg-amber-500/10 flex items-center justify-center">
                <FileText className="w-3.5 h-3.5 text-amber-600" />
              </div>
              <h3 className="font-semibold text-foreground">备注信息</h3>
            </div>
            <Textarea
              value={formData.notes}
              onChange={(e) => handleFieldChange('notes', e.target.value)}
              placeholder="可填入物资用途说明、使用注意事项、特殊存放要求等..."
              className="min-h-[120px] bg-muted/50 border-border resize-none"
            />
            <p className="text-xs text-muted-foreground mt-2">{formData.notes.length} / 500 字</p>
          </Card>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              className="flex-1 h-12 bg-gradient-to-r from-primary to-secondary hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!requiredFilled || isUploading}
              onClick={handleUpload}
            >
              {isUploading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />上架中...</>
              ) : (
                <><Upload className="w-4 h-4 mr-2" />确认上架</>
              )}
            </Button>
            <Button
              variant="outline"
              className={`px-8 h-12 border-border transition-all duration-300 ${
                draftSaved
                  ? 'border-emerald-500/40 bg-emerald-500/5 text-emerald-600 hover:bg-emerald-500/10'
                  : 'hover:bg-muted/50'
              }`}
              onClick={handleSaveDraft}
              disabled={!isDirty}
            >
              {draftSaved ? (
                <><CheckCircle2 className="w-4 h-4 mr-2" />已保存</>
              ) : (
                <><Save className="w-4 h-4 mr-2" />保存草稿</>
              )}
            </Button>
            <Button
              variant="ghost"
              className="px-6 h-12 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              onClick={handleCancelClick}
            >
              取消
            </Button>
          </div>
        </div>

        {/* Right: Preview & Guide */}
        <div className="space-y-5">

          {/* Preview Card */}
          <Card className="p-5 border-border overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/5 to-transparent rounded-bl-full" />
            <h3 className="font-semibold text-foreground mb-4">物品预览</h3>
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="relative h-36 bg-gradient-to-br from-primary/8 to-secondary/8 flex items-center justify-center">
                {previewImage ? (
                  <img src={previewImage} alt="预览" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Package className="w-10 h-10 text-primary/30" />
                    <span className="text-xs text-muted-foreground">上传图片后预览</span>
                  </div>
                )}
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <p className="font-semibold text-foreground text-sm">
                    {formData.name || <span className="text-muted-foreground font-normal">物品名称</span>}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{formData.category || '物品分类'}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { label: '规格', value: formData.specModel },
                    { label: '数量', value: formData.quantity },
                    { label: '类型', value: formData.stockPlatform },
                    { label: '有效期', value: formData.expiry },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-muted/50 rounded-lg p-2.5 border border-border">
                      <p className="text-muted-foreground mb-0.5">{label}</p>
                      <p className="font-medium text-foreground truncate">{value || '—'}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Required Fields Checklist */}
          <Card className="p-5 border-border">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              必填项检查
            </h3>
            <div className="space-y-2.5">
              {[
                { key: 'image',         label: '物品图片',   filled: !!previewImage },
                { key: 'name',          label: '物品名称',   filled: !!formData.name },
                { key: 'category',      label: '物品分类',   filled: !!formData.category },
                { key: 'quantity',      label: '上架数量',   filled: !!formData.quantity },
                { key: 'stockPlatform', label: '组件库存台', filled: !!formData.stockPlatform },
              ].map((item) => (
                <div
                  key={item.key}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg border text-sm transition-all duration-200 ${
                    item.filled
                      ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-700'
                      : 'bg-muted/30 border-border text-muted-foreground'
                  }`}
                >
                  <span>{item.label}</span>
                  {item.filled
                    ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    : <AlertCircle  className="w-4 h-4 text-muted-foreground/50" />
                  }
                </div>
              ))}
            </div>
          </Card>

          {/* Tips */}
          <Card className="p-5 border-border">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Info className="w-4 h-4 text-primary" />
              填写提示
            </h3>
            <div className="space-y-3">
              {tips.map((tip, i) => {
                const Icon = tip.icon;
                return (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-md bg-primary/8 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{tip.text}</p>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Recent Uploads */}
          <Card className="p-5 border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">最近上架</h3>
              <button className="text-xs text-primary hover:underline flex items-center gap-0.5">
                查看全部 <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-2.5">
              {[
                { name: '订书机',   category: '办公用品', qty: '10个', date: '3月17日' },
                { name: 'A4打印纸', category: '耗材',     qty: '50包', date: '3月15日' },
                { name: 'U盘 64G', category: '电子设备', qty: '5个',  date: '3月12日' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                  <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center flex-shrink-0 border border-primary/10">
                    <Package className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.category} · {item.qty}</p>
                  </div>
                  <span className="text-xs text-muted-foreground flex-shrink-0">{item.date}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Overlays */}
      {uploadSuccess && savedItem && (
        <SuccessOverlay
          item={savedItem}
          onContinue={handleAfterSuccess}
          onViewInventory={() => navigate('/item-permission')}
        />
      )}
      {showCancelConfirm && (
        <CancelConfirmDialog
          onConfirm={handleConfirmCancel}
          onCancel={() => setShowCancelConfirm(false)}
        />
      )}
    </div>
  );
}