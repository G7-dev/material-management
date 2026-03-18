import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, ShoppingBag, Search, Building2, User, Hash, FileText, Plus, Minus, ArrowRight } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Badge } from '../components/ui/Badge'
import { supabase } from '../lib/supabase'
import type { Material } from '../lib/supabase'
import { message } from 'antd'
import { Modal } from '../components/ui/Modal'

const DEPARTMENTS = ['设备部', '技术部', '能源部', '生产一部', '生产二部', '供应部', '储运部']

export default function Materials() {
  const navigate = useNavigate()
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null)
  const [applyModalVisible, setApplyModalVisible] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  
  const [formData, setFormData] = useState({
    quantity: 1,
    department: '',
    applicantName: '',
    employeeId: '',
    purpose: ''
  })

  useEffect(() => {
    fetchMaterials()
  }, [])

  async function fetchMaterials() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .eq('status', 'active')
        .order('name', { ascending: true })

      if (error) throw error
      setMaterials(data || [])
    } catch (error) {
      console.error('获取物资列表失败:', error)
      message.error('获取物资列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleApply = (material: Material) => {
    setSelectedMaterial(material)
    setFormData({
      quantity: 1,
      department: '',
      applicantName: '',
      employeeId: '',
      purpose: ''
    })
    setApplyModalVisible(true)
  }

  const handleSubmit = async () => {
    if (!selectedMaterial) return
    
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
          material_id: selectedMaterial.id,
          requisition_type: 'daily_request',
          request_quantity: formData.quantity,
          purpose: formData.purpose,
          department: formData.department,
          employee_id: formData.employeeId,
          applicant_name: formData.applicantName,
          status: 'pending'
        })

      if (error) throw error

      message.success('申领申请已提交，等待审批')
      setApplyModalVisible(false)
    } catch (error) {
      console.error('提交申请失败:', error)
      message.error('提交申请失败')
    } finally {
      setSubmitting(false)
    }
  }

  const filteredMaterials = materials.filter(material => {
    if (!searchQuery) return true
    return material.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           material.category.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const isLowStock = (material: Material) => material.stock < material.safe_stock
  const canApply = selectedMaterial && formData.quantity > 0 && formData.department && 
                   formData.applicantName && formData.employeeId && formData.purpose

  return (
    <div className="p-8 space-y-8 bg-gray-50 min-h-screen">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-8 text-white">
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20 shadow-lg">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">日常领用</h1>
                <p className="text-white/70 text-sm mt-0.5">选择您需要的物资进行申领，快速完成审批流程</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="relative z-10 grid grid-cols-3 gap-4 mt-6">
          <div className="flex items-center gap-3.5 px-5 py-4 rounded-xl bg-white/10 border border-white/15 text-white">
            <div className="w-10 h-10 rounded-lg bg-white/60 flex items-center justify-center shadow-sm">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold leading-none">{materials.length}</p>
              <p className="text-xs mt-1 opacity-70 font-medium">可选物品</p>
            </div>
          </div>
          <div className="flex items-center gap-3.5 px-5 py-4 rounded-xl bg-white/10 border border-white/15 text-white">
            <div className="w-10 h-10 rounded-lg bg-white/60 flex items-center justify-center shadow-sm">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold leading-none">
                {materials.reduce((sum, m) => sum + m.stock, 0)}
              </p>
              <p className="text-xs mt-1 opacity-70 font-medium">总库存量</p>
            </div>
          </div>
          <div className="flex items-center gap-3.5 px-5 py-4 rounded-xl bg-white/10 border border-white/15 text-white">
            <div className="w-10 h-10 rounded-lg bg-white/60 flex items-center justify-center shadow-sm">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold leading-none">
                {materials.filter(m => m.stock <= m.safe_stock).length}
              </p>
              <p className="text-xs mt-1 opacity-70 font-medium">低库存预警</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <Card className="p-5 border-gray-200 bg-white shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              type="text"
              placeholder="搜索物资名称、分类或规格..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 border-gray-300 rounded-xl focus:border-indigo-500"
            />
          </div>
        </div>
      </Card>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredMaterials.map((material) => (
          <Card key={material.id} className="group flex flex-col overflow-hidden border-gray-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            {/* Image area */}
            <div className="relative w-full h-40 bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/40 flex items-center justify-center overflow-hidden">
              <div className="relative z-10 w-16 h-16 rounded-2xl bg-white/90 shadow-lg border border-indigo-100/60 flex items-center justify-center">
                <Package className="w-8 h-8 text-indigo-400/70" />
              </div>

              {/* Status badge */}
              <div className="absolute top-3 right-3 z-20">
                <Badge className={`text-[10px] font-bold border backdrop-blur-md shadow-sm ${
                  isLowStock(material) 
                    ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' 
                    : 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    isLowStock(material) ? 'bg-amber-500' : 'bg-emerald-500'
                  } mr-1 animate-pulse`} />
                  {isLowStock(material) ? '低库存' : '库存充足'}
                </Badge>
              </div>
            </div>

            {/* Content */}
            <div className="flex flex-col flex-1 p-5">
              <div className="mb-3">
                <h3 className="font-bold text-gray-900 text-[15px] leading-tight truncate group-hover:text-indigo-600 transition-colors">
                  {material.name}
                </h3>
                <p className="text-xs text-gray-500 mt-1 truncate">{material.specification || material.model || '标准规格'}</p>
              </div>

              <div className="text-xs bg-gradient-to-r from-gray-50 to-gray-100 p-3.5 rounded-xl border border-gray-200 space-y-2 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 flex items-center gap-1.5">
                    <Package className="w-3 h-3" />
                    {material.category || '未分类'}
                  </span>
                  <span className="text-gray-900 font-bold">
                    库存 <span className="text-indigo-600">{material.stock}</span>
                  </span>
                </div>
              </div>

              <div className="flex-1" />

              <Button
                onClick={() => handleApply(material)}
                disabled={material.stock === 0}
                className={`w-full h-11 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-300 ${
                  material.stock === 0 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:shadow-lg hover:shadow-indigo-500/25'
                }`}
              >
                {material.stock === 0 ? '暂不可领' : (
                  <>
                    立即申请
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Apply Modal */}
      <Modal
        title={
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500/15 to-purple-500/15 flex items-center justify-center border border-indigo-500/20">
              <ShoppingBag className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-bold text-lg">申请领用</h3>
              <p className="text-xs text-gray-500 mt-0.5">{selectedMaterial?.name}</p>
            </div>
          </div>
        }
        open={applyModalVisible}
        onClose={() => setApplyModalVisible(false)}
        width={600}
        footer={
          <>
            <Button 
              variant="outline" 
              className="flex-1 h-11 rounded-xl"
              onClick={() => setApplyModalVisible(false)}
            >
              取消
            </Button>
            <Button 
              className="flex-1 h-11 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white"
              onClick={handleSubmit}
              disabled={!canApply || submitting}
              loading={submitting}
            >
              提交申请
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          {/* Item info */}
          <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 rounded-xl border border-indigo-100/60">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
              <Package className="w-7 h-7 text-indigo-500/60" />
            </div>
            <div>
              <p className="font-bold text-gray-900">{selectedMaterial?.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {selectedMaterial?.specification || selectedMaterial?.model || '标准规格'} · 
                库存 {selectedMaterial?.stock} {selectedMaterial?.unit || '个'}
              </p>
            </div>
          </div>

          {/* Form fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-500/60" />
                姓名 *
              </label>
              <Input
                value={formData.applicantName}
                onChange={(e) => setFormData({...formData, applicantName: e.target.value})}
                placeholder="请输入姓名"
                className="h-11"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-indigo-500/60" />
                工号 *
              </label>
              <Input
                value={formData.employeeId}
                onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
                placeholder="请输入工号"
                className="h-11"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-indigo-500/60" />
              所属部门 *
            </label>
            <select
              value={formData.department}
              onChange={(e) => setFormData({...formData, department: e.target.value})}
              className="w-full h-11 rounded-xl border border-gray-300 bg-white px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/40 cursor-pointer"
            >
              <option value="">请选择部门</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-indigo-500/60" />
              申领数量
            </label>
            <div className="flex items-center gap-3">
              <Button 
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setFormData({...formData, quantity: Math.max(1, formData.quantity - 1)})}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <Input
                type="number"
                min={1}
                max={selectedMaterial?.stock || 1}
                value={formData.quantity}
                onChange={(e) => setFormData({...formData, quantity: Math.max(1, parseInt(e.target.value) || 1)})}
                className="h-11 text-center w-20 font-bold"
              />
              <Button 
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setFormData({...formData, quantity: Math.min(selectedMaterial?.stock || 1, formData.quantity + 1)})}
              >
                <Plus className="w-4 h-4" />
              </Button>
              <span className="text-sm text-gray-500 font-medium">
                {selectedMaterial?.unit || '个'}
              </span>
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-indigo-500/60" />
              用途说明 *
            </label>
            <textarea
              value={formData.purpose}
              onChange={(e) => setFormData({...formData, purpose: e.target.value})}
              placeholder="请简要描述领用用途..."
              rows={3}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/40 resize-none"
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}
