import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  ShoppingCart, Sparkles, Upload, Send, ShieldCheck,
} from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { EnhancedSelect } from '../components/ui/enhanced-select';
import { DatePicker } from '../components/ui/date-picker';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { saveApplicationRecord } from '../utils/applicationStore';

export function ItemPurchase() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [itemName, setItemName] = useState('');
  const [itemCategory, setItemCategory] = useState('');
  const [specification, setSpecification] = useState('');
  const [unit, setUnit] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [expectedDate, setExpectedDate] = useState('');
  const [purchaseReason, setPurchaseReason] = useState('');
  const [department, setDepartment] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  
  const DEPARTMENTS = ['设备部', '技术部', '生产一部', '生产二部', '供应部', '储运部', '能源部', 'TPM'];
  
  // Auto-fill department based on user info
  useEffect(() => {
    const loadUserDept = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Get user profile to check if department is stored
          const { data: profile } = await supabase
            .from('profiles')
            .select('department')
            .eq('id', user.id)
            .single();
          
          if (profile?.department) {
            setDepartment(profile.department);
          }

        }
      } catch (error) {
        console.error('Failed to load user department:', error);
      }
    };
    
    loadUserDept();
  }, []);
  
  // Form validation
  const validateForm = () => {
    if (!itemName.trim()) {
      toast.error('请输入物品名称');
      return false;
    }
    if (!itemCategory) {
      toast.error('请选择物品分类');
      return false;
    }
    if (!specification.trim()) {
      toast.error('请输入规格型号');
      return false;
    }
    if (!quantity || quantity <= 0) {
      toast.error('请输入有效的申购数量');
      return false;
    }
    if (!expectedDate) {
      toast.error('请选择预计到货日期');
      return false;
    }
    if (!department) {
      toast.error('请选择所属部门');
      return false;
    }
    if (!employeeId.trim()) {
      toast.error('请输入工号');
      return false;
    }
    if (!purchaseReason.trim()) {
      toast.error('请输入申购理由');
      return false;
    }
    return true;
  };
  
  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('请选择图片文件');
      return;
    }
    
    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('图片大小不能超过5MB');
      return;
    }
    
    // Read file as data URL
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setSelectedImage(result);
        toast.success('图片上传成功');
      }
    };
    reader.readAsDataURL(file);
  };
  
  // Submit purchase request
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user?.id) {
        console.error('Auth error:', authError);
        toast.error('请先登录');
        setLoading(false);
        navigate('/login');
        return; // Stop execution
      }
      
      // Verify user exists in profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, department')
        .eq('id', user.id)
        .single();
      
      if (profileError || !profile) {
        console.error('Profile error:', profileError);
        throw new Error('用户资料不存在，请联系管理员');
      }
      
      // Save department to user profile if not exists
      if (department && (!profile.department || profile.department !== department)) {
        await supabase
          .from('profiles')
          .update({ department })
          .eq('id', user.id);
      }
      
      // Submit to requisitions table
      const { error } = await supabase
        .from('requisitions')
        .insert({
          user_id: user.id,
          requisition_type: 'purchase_request',
          status: 'pending',
          purchase_name: itemName,
          purchase_specification: specification,
          purchase_model: itemCategory, // 使用分类作为模型
          purchase_unit: unit || '个',
          purchase_quantity: quantity,
          purchase_reason: purchaseReason,
          purpose: itemCategory, // 将分类也存入用途
          estimated_delivery_date: expectedDate,
          applicant_name: profile.full_name || '未知用户',
          department: department,
          employee_id: employeeId.trim(),
          created_at: new Date().toISOString(),
        });
      
      if (error) {
        throw error;
      }
      
      toast.success('申购申请提交成功！已推送给系统管理员');
      
      // Reset form
      setItemName('');
      setItemCategory('');
      setSpecification('');
      setUnit('');
      setQuantity(1);
      setExpectedDate('');
      setPurchaseReason('');
      setEmployeeId('');
      
      // Navigate to application records after 2 seconds
      setTimeout(() => {
        navigate('/application-records');
      }, 2000);
      
    } catch (error: any) {
      console.error('Submit error:', error);
      toast.error(`提交失败: ${error.message || '请重试'}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle cancel
  const handleCancel = () => {
    if (itemName || specification || purchaseReason) {
      if (window.confirm('确定要取消申购吗？所有填写的内容将会丢失。')) {
        navigate('/');
      }
    } else {
      navigate('/');
    }
  };

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



      {/* Form */}
      <Card className="p-8 border-0 bg-white shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-8">
  

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
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label 
                htmlFor="image-upload"
                className="border-2 border-dashed border-indigo-200 rounded-2xl p-10 hover:border-indigo-400 transition-all cursor-pointer bg-gradient-to-br from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 group block"
              >
                {selectedImage ? (
                  <div className="flex flex-col items-center justify-center text-center">
                    <img src={selectedImage} alt="预览" className="w-24 h-24 rounded-xl object-cover mb-3 border border-indigo-100" />
                    <p className="text-sm font-medium text-foreground">图片已选择</p>
                    <p className="text-xs text-muted-foreground">点击重新选择</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/30 group-hover:scale-110 transition-transform">
                      <Upload className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-sm font-medium text-foreground mb-1">点击选择上传物品图片</p>
                    <p className="text-xs text-muted-foreground">支持 JPG, PNG 格式，单张 5MB</p>
                  </div>
                )}
              </label>
            </div>

            {/* Product Name and Category */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  物品名称<span className="text-rose-500 ml-1">*</span>
                </label>
                <Input
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="输入 E.g. 办公用品"
                  className="h-12 bg-gradient-to-br from-slate-50 to-slate-100/50 border-border"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  物品分类<span className="text-rose-500 ml-1">*</span>
                </label>
                <EnhancedSelect
                  value={itemCategory}
                  onChange={setItemCategory}
                  placeholder="请选择物品分类"
                  options={[
                    { value: '办公耗材', label: '办公耗材' },
                    { value: '清洁工具', label: '清洁工具' },
                    { value: '穿戴品',   label: '穿戴品'   },
                    { value: '衣服',     label: '衣服'     },
                    { value: '鞋子',     label: '鞋子'     },
                    { value: '其他',     label: '其他'     },
                  ]}
                  size="lg"
                  variant="filled"
                />
              </div>
            </div>

            {/* Specifications */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  规格型号<span className="text-rose-500 ml-1">*</span>
                </label>
                <Input
                  value={specification}
                  onChange={(e) => setSpecification(e.target.value)}
                  placeholder="型号、A4, 100张、营业号"
                  className="h-12 bg-gradient-to-br from-slate-50 to-slate-100/50 border-border"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">单位</label>
                <Input
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="个、里、包、厘"
                  className="h-12 bg-gradient-to-br from-slate-50 to-slate-100/50 border-border"
                />
              </div>
            </div>

            {/* Quantity and Expected Date */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  申购数量<span className="text-rose-500 ml-1">*</span>
                </label>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  placeholder="请输入申购数量"
                  className="h-12 bg-gradient-to-br from-slate-50 to-slate-100/50 border-border"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  预计到货日期<span className="text-rose-500 ml-1">*</span>
                </label>
                <DatePicker
                  value={expectedDate ? new Date(expectedDate) : undefined}
                  onChange={(date) => setExpectedDate(date ? date.toISOString().split('T')[0] : '')}
                  placeholder="请选择预计到货日期"
                  size="lg"
                  variant="filled"
                  minDate={new Date()}
                />
              </div>
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

            {/* Department Selection */}
            <div className="mb-5">
              <label className="block text-sm font-semibold text-foreground mb-2">
                所属部门<span className="text-rose-500 ml-1">*</span>
              </label>
              <EnhancedSelect
                value={department}
                onChange={setDepartment}
                placeholder="请选择部门"
                options={DEPARTMENTS.map(dept => ({ value: dept, label: dept }))}
                size="lg"
                variant="filled"
                required={true}
              />
            </div>

            {/* Employee ID */}
            <div className="mb-5">
              <label className="block text-sm font-semibold text-foreground mb-2">
                工号<span className="text-rose-500 ml-1">*</span>
              </label>
              <Input
                type="text"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="请输入您的工号"
                className="h-12 bg-gradient-to-br from-slate-50 to-slate-100/50 border-border"
                required
              />
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
                value={purchaseReason}
                onChange={(e) => setPurchaseReason(e.target.value)}
                placeholder="请填写申购原因及需求说明（选填）"
                className="min-h-[120px] bg-gradient-to-br from-slate-50 to-slate-100/50 border-border resize-none"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-6">
            <Button 
              type="submit" 
              disabled={loading}
              className="flex-1 h-12 bg-gradient-to-r from-pink-500 to-rose-500 hover:shadow-xl hover:shadow-pink-500/30 transition-all duration-200"
            >
              <Send className="w-4 h-4 mr-2" />
              {loading ? '提交中...' : '提交申购'}
            </Button>
            <Button variant="outline" type="button" onClick={handleCancel} className="px-8 h-12 border-2 border-border">
              取消
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
