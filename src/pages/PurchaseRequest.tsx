import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Sparkles, AlertCircle, Plus, Calendar, Building2, User, Hash, FileText } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { message, DatePicker, Select, Row, Col } from 'antd';
import { supabase } from '../lib/supabase'
import type { Material } from '../lib/supabase'
import dayjs from 'dayjs'

const { Option } = Select

const DEPARTMENTS = [
  { label: '设备部', value: '设备部' },
  { label: '技术部', value: '技术部' },
  { label: '能源部', value: '能源部' },
  { label: '生产一部', value: '生产一部' },
  { label: '生产二部', value: '生产二部' },
  { label: '供应部', value: '供应部' },
  { label: '储运部', value: '储运部' },
]

export default function PurchaseRequest() {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [lowStockMaterials, setLowStockMaterials] = useState<Material[]>([])
  const [allMaterials, setAllMaterials] = useState<Material[]>([])
  
  const [formData, setFormData] = useState({
    purchase_name: '',
    purchase_specification: '',
    purchase_model: '',
    purchase_unit: '',
    quantity: 1,
    estimated_delivery_date: null as any,
    department: '',
    employee_id: '',
    applicant_name: '',
    purchase_reason: '',
    purpose: ''
  })

  useEffect(() => {
    fetchMaterials()
  }, [])

  async function fetchMaterials() {
    try {
      const { data: lowStockData } = await supabase
        .from('materials')
        .select('*')
        .eq('status', 'active')
        .lt('stock', 10)
        .order('stock', { ascending: true })

      const { data: allData } = await supabase
        .from('materials')
        .select('*')
        .eq('status', 'active')
        .order('name', { ascending: true })

      setLowStockMaterials(lowStockData || [])
      setAllMaterials(allData || [])
    } catch (error) {
      console.error('获取物资列表失败:', error)
    }
  }

  const handleSubmit = async () => {
    if (!formData.purchase_name || !formData.purchase_unit || !formData.quantity || 
        !formData.department || !formData.employee_id || !formData.applicant_name ||
        !formData.purchase_reason || !formData.purpose || !formData.estimated_delivery_date) {
      message.error('请填写所有必填项')
      return
    }

    setSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        message.error('请先登录')
        return
      }

      const { error } = await supabase
        .from('requisitions')
        .insert({
          user_id: user.id,
          requisition_type: 'purchase_request',
          purchase_name: formData.purchase_name,
          purchase_specification: formData.purchase_specification,
          purchase_model: formData.purchase_model,
          purchase_unit: formData.purchase_unit,
          purchase_quantity: formData.quantity,
          purchase_reason: formData.purchase_reason,
          purpose: formData.purpose,
          estimated_delivery_date: formData.estimated_delivery_date.format('YYYY-MM-DD'),
          department: formData.department,
          employee_id: formData.employee_id,
          applicant_name: formData.applicant_name,
          status: 'pending'
        })

      if (error) throw error

      message.success('申购提交成功,等待审批')
      navigate('/my-requisitions')
    } catch (error) {
      console.error('提交失败:', error)
      message.error('提交失败,请重试')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-8 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-gray-900 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
            <ShoppingCart className="w-5 h-5 text-white" />
          </div>
          物品申购
          <Sparkles className="w-6 h-6 text-amber-500" />
        </h1>
        <p className="text-gray-500 mt-1">申请添加新物品至库存，提交后将直接推送至系统管理员处理</p>
      </div>

      {/* Alert */}
      {lowStockMaterials.length > 0 && (
        <Card className="p-4 border-0 bg-gradient-to-br from-amber-50 to-orange-50 shadow-md">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-amber-900 mb-1">库存不足物品提醒</h3>
              <p className="text-sm text-amber-700">发现 {lowStockMaterials.length} 种物品库存不足，建议优先申购</p>
            </div>
          </div>
        </Card>
      )}

      {/* Form */}
      <Card className="p-8 border-0 bg-white shadow-xl">
        <div className="space-y-8">
          {/* Section: Product Info */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                <ShoppingCart className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 text-lg">物品信息</h3>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  物品名称<span className="text-rose-500 ml-1">*</span>
                </label>
                <Select
                  style={{ width: '100%' }}
                  placeholder="请选择或输入物品名称"
                  showSearch
                  allowClear
                  value={formData.purchase_name || undefined}
                  onChange={(value) => setFormData({...formData, purchase_name: value})}
                  dropdownRender={menu => (
                    <div>
                      {menu}
                      {lowStockMaterials.length > 0 && (
                        <>
                          <div className="px-3 py-2 text-xs text-amber-600 bg-amber-50 border-t border-amber-200">
                            库存不足物品（建议优先申购）
                          </div>
                          {lowStockMaterials.map(material => (
                            <div
                              key={material.id}
                              className="px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer"
                              onClick={() => setFormData({...formData, purchase_name: material.name})}
                            >
                              {material.name} 
                              <span className="text-gray-500 ml-2">
                                (库存: {material.stock} {material.unit})
                              </span>
                            </div>
                          ))}
                        </>
                      )}
                      <div className="px-3 py-2 text-xs text-gray-500 border-t border-gray-200">
                        所有物品
                      </div>
                    </div>
                  )}
                >
                  {allMaterials.map(material => (
                    <Option key={material.id} value={material.name}>
                      {material.name}
                      <span className="text-gray-500 ml-2">
                        ({material.category})
                      </span>
                    </Option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  物品分类<span className="text-rose-500 ml-1">*</span>
                </label>
                <Select
                  style={{ width: '100%' }}
                  placeholder="请选择物品分类"
                  value={formData.purchase_specification || undefined}
                  onChange={(value) => setFormData({...formData, purchase_specification: value})}
                >
                  <Option value="办公耗材">办公耗材</Option>
                  <Option value="清洁工具">清洁工具</Option>
                  <Option value="电子设备">电子设备</Option>
                  <Option value="办公用品">办公用品</Option>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  规格型号
                </label>
                <Input
                  value={formData.purchase_model}
                  onChange={(e) => setFormData({...formData, purchase_model: e.target.value})}
                  placeholder="如: USB 3.0, A4, 标准型"
                  className="h-12"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  单位<span className="text-rose-500 ml-1">*</span>
                </label>
                <Input
                  value={formData.purchase_unit}
                  onChange={(e) => setFormData({...formData, purchase_unit: e.target.value})}
                  placeholder="如: 个、箱、包、件"
                  className="h-12"
                />
              </div>
            </div>
          </div>

          {/* Section: Application Details */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 text-lg">申购详情</h3>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  申购数量<span className="text-rose-500 ml-1">*</span>
                </label>
                <Input
                  type="number"
                  min={1}
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 1})}
                  placeholder="请输入申购数量"
                  className="h-12"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  预计到货日期<span className="text-rose-500 ml-1">*</span>
                </label>
                <DatePicker 
                  style={{ width: '100%', height: 48 }}
                  placeholder="请选择预计到货日期"
                  value={formData.estimated_delivery_date}
                  onChange={(date) => setFormData({...formData, estimated_delivery_date: date})}
                  disabledDate={(current) => current && current < dayjs().startOf('day')}
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                申购理由<span className="text-rose-500 ml-1">*</span>
              </label>
              <Input
                value={formData.purchase_reason}
                onChange={(e) => setFormData({...formData, purchase_reason: e.target.value})}
                placeholder="如: 库存不足、新项目需求、设备更新等"
                className="h-12"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                用途说明<span className="text-rose-500 ml-1">*</span>
              </label>
              <textarea
                value={formData.purpose}
                onChange={(e) => setFormData({...formData, purpose: e.target.value})}
                placeholder="请详细说明物资的具体用途、使用场景、预期效果等..."
                rows={4}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/40 resize-none"
              />
            </div>
          </div>

          {/* Section: Applicant Info */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 text-lg">申请人信息</h3>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  姓名<span className="text-rose-500 ml-1">*</span>
                </label>
                <Input
                  value={formData.applicant_name}
                  onChange={(e) => setFormData({...formData, applicant_name: e.target.value})}
                  placeholder="请输入姓名"
                  className="h-12"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  工号<span className="text-rose-500 ml-1">*</span>
                </label>
                <Input
                  value={formData.employee_id}
                  onChange={(e) => setFormData({...formData, employee_id: e.target.value})}
                  placeholder="请输入工号"
                  className="h-12"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                所属部门<span className="text-rose-500 ml-1">*</span>
              </label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({...formData, department: e.target.value})}
                className="w-full h-12 rounded-xl border border-gray-300 bg-white px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/40 cursor-pointer"
              >
                <option value="">请选择部门</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center pt-6">
            <Button 
              className="h-12 px-8 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold hover:shadow-lg hover:shadow-indigo-500/30 transition-all"
              onClick={handleSubmit}
              loading={submitting}
              disabled={submitting}
            >
              <Send className="w-4 h-4 mr-2" />
              提交申购申请
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
