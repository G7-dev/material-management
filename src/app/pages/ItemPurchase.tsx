import { useState } from 'react';
import {
  ShoppingCart, Sparkles, AlertCircle, Upload, Send, ShieldCheck,
} from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { AppSelect } from '../components/ui/app-select';

export function ItemPurchase() {
  const [_quantity, setQuantity] = useState(1);

  return (
    <div className="p-8 space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-foreground flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-lg shadow-pink-500/30">
            <ShoppingCart className="w-5 h-5 text-white" />
          </div>
          物品申购
          <Sparkles className="w-6 h-6 text-amber-500" />
        </h1>
        <p className="text-muted-foreground mt-1">申请添加新物品至库存，提交后将直接推送至系统管理员处理</p>
      </div>

      {/* Alert */}
      <Card className="p-4 border-0 bg-gradient-to-br from-amber-50 to-orange-50 shadow-md">
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-md shadow-amber-500/20 flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-amber-900 mb-1">备注不一般物品逾期</h3>
            <p className="text-sm text-amber-700">备注 [12] 条</p>
          </div>
        </div>
      </Card>

      {/* Form */}
      <Card className="p-8 border-0 bg-white shadow-xl">
        <div className="space-y-8">
          {/* Section: Apply Method */}
          <div className="flex items-center gap-3 pb-4 border-b border-border">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-semibold text-foreground text-lg">申购申请提示</h3>
          </div>

          {/* Section: Product Info */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-md shadow-cyan-500/20">
                <ShoppingCart className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-semibold text-foreground text-lg">物品信息</h3>
            </div>

            {/* Upload Image */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-foreground mb-3">
                点击添加上传物品图片
              </label>
              <div className="border-2 border-dashed border-indigo-200 rounded-2xl p-10 hover:border-indigo-400 transition-all cursor-pointer bg-gradient-to-br from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 group">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/30 group-hover:scale-110 transition-transform">
                    <Upload className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-sm font-medium text-foreground mb-1">点击选择上传物品图片</p>
                  <p className="text-xs text-muted-foreground">支持 JPG, PNG 格式，单张 5MB</p>
                </div>
              </div>
            </div>

            {/* Product Name and Category */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  物品名称<span className="text-rose-500 ml-1">*</span>
                </label>
                <Input
                  placeholder="输入 E.g. 办公用品"
                  className="h-12 bg-gradient-to-br from-slate-50 to-slate-100/50 border-border"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  物品分类<span className="text-rose-500 ml-1">*</span>
                </label>
                <AppSelect
                  height="h-12"
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
            </div>

            {/* Specifications */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">规格型号</label>
                <Input
                  placeholder="型号、A4, 100张、营业号"
                  className="h-12 bg-gradient-to-br from-slate-50 to-slate-100/50 border-border"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  型号<span className="text-rose-500 ml-1">*</span>
                </label>
                <Input
                  placeholder="型号、长、宽、厚、磅 (g)"
                  className="h-12 bg-gradient-to-br from-slate-50 to-slate-100/50 border-border"
                />
              </div>
            </div>

            {/* Detail Info */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  吉通规格<span className="text-rose-500 ml-1">*</span>
                </label>
                <Input
                  placeholder="型号、个、里、包、厘"
                  className="h-12 bg-gradient-to-br from-slate-50 to-slate-100/50 border-border"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  上报数量<span className="text-rose-500 ml-1">*</span>
                </label>
                <Input
                  type="number"
                  placeholder="请输入数量"
                  className="h-12 bg-gradient-to-br from-slate-50 to-slate-100/50 border-border"
                  onChange={(e) => setQuantity(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  组件库存台<span className="text-rose-500 ml-1">*</span>
                </label>
                <Input
                  placeholder="组件库存台"
                  className="h-12 bg-gradient-to-br from-slate-50 to-slate-100/50 border-border"
                  defaultValue="厂区组厅台"
                  readOnly
                />
              </div>
            </div>

            {/* Expected Date */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-foreground mb-2">
                预计到货日期<span className="text-rose-500 ml-1">*</span>
              </label>
              <Input
                type="date"
                className="h-12 bg-gradient-to-br from-slate-50 to-slate-100/50 border-border"
              />
            </div>
          </div>

          {/* Section: Submission Info */}
          <div className="pt-6 border-t border-border">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-500/20">
                <Send className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-semibold text-foreground text-lg">提交信息</h3>
            </div>

            {/* Admin push notice */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/15 mb-5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">直接推送至系统管理员</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  提交后申购单将自动推送给系统管理员，无需手动指定审批人，管理员审核后将及时反馈处理结果
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">申购理由</label>
              <Textarea
                placeholder="请填写申购原因及需求说明（选填）"
                className="min-h-[120px] bg-gradient-to-br from-slate-50 to-slate-100/50 border-border resize-none"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-6">
            <Button className="flex-1 h-12 bg-gradient-to-r from-pink-500 to-rose-500 hover:shadow-xl hover:shadow-pink-500/30 transition-all duration-200">
              <Send className="w-4 h-4 mr-2" />
              提交申购
            </Button>
            <Button variant="outline" className="px-8 h-12 border-2 border-border">
              取消
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
