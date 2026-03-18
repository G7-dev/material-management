import { useEffect, useState } from 'react';
import { PackagePlus, Edit, Trash2, RefreshCw, Package, Search, Plus } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { supabase } from '../../lib/supabase';
import type { Material } from '../../lib/supabase';
import { message } from 'antd';

export default function MaterialManagement() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [_loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [restockModalVisible, setRestockModalVisible] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [restocking, setRestocking] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    specification: '',
    model: '',
    unit: '',
    stock: 0,
    safe_stock: 0,
    location: '',
    image_url: ''
  });
  
  const [restockData, setRestockData] = useState({
    material_id: '',
    quantity: 10,
    notes: ''
  });

  useEffect(() => {
    fetchMaterials();
  }, []);

  async function fetchMaterials() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMaterials(data || []);
    } catch (error) {
      console.error('获取物资列表失败:', error);
      message.error('获取物资列表失败');
    } finally {
      setLoading(false);
    }
  }

  const openModal = (material?: Material) => {
    setEditingMaterial(material || null);
    if (material) {
      setFormData({
        name: material.name,
        category: material.category,
        specification: material.specification || '',
        model: material.model || '',
        unit: material.unit,
        stock: material.stock,
        safe_stock: material.safe_stock,
        location: material.location || '',
        image_url: material.image_url || ''
      });
    } else {
      setFormData({
        name: '',
        category: '',
        specification: '',
        model: '',
        unit: '',
        stock: 0,
        safe_stock: 0,
        location: '',
        image_url: ''
      });
    }
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.category || !formData.unit || formData.stock < 0 || formData.safe_stock < 0) {
      message.error('请填写所有必填项');
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        message.error('请先登录');
        return;
      }

      if (editingMaterial) {
        const { error } = await supabase
          .from('materials')
          .update(formData)
          .eq('id', editingMaterial.id);

        if (error) throw error;
        message.success('更新成功');
      } else {
        const { error } = await supabase
          .from('materials')
          .insert({
            ...formData,
            created_by: user.id,
            status: 'active'
          });

        if (error) throw error;
        message.success('添加成功');
      }

      setModalVisible(false);
      fetchMaterials();
    } catch (error) {
      console.error('操作失败:', error);
      message.error('操作失败,请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('materials')
        .update({ status: 'inactive' })
        .eq('id', id);

      if (error) throw error;
      message.success('删除成功');
      fetchMaterials();
    } catch (error) {
      console.error('删除失败:', error);
      message.error('删除失败');
    }
  };

  const openRestockModal = (material: Material) => {
    setRestockData({
      material_id: material.id,
      quantity: 10,
      notes: ''
    });
    setRestockModalVisible(true);
  };

  const handleRestock = async () => {
    if (!restockData.quantity || restockData.quantity < 1) {
      message.error('请输入有效的补货数量');
      return;
    }

    setRestocking(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        message.error('请先登录');
        return;
      }

      const { data: material } = await supabase
        .from('materials')
        .select('stock')
        .eq('id', restockData.material_id)
        .single();

      if (!material) {
        message.error('物资不存在');
        return;
      }

      const stockBefore = material.stock;
      const stockAfter = stockBefore + restockData.quantity;

      const { error: updateError } = await supabase
        .from('materials')
        .update({ stock: stockAfter })
        .eq('id', restockData.material_id);

      if (updateError) throw updateError;

      const { error: logError } = await supabase
        .from('inventory_logs')
        .insert({
          material_id: restockData.material_id,
          operation_type: 'restock',
          quantity: restockData.quantity,
          stock_before: stockBefore,
          stock_after: stockAfter,
          notes: restockData.notes,
          created_by: user.id
        });

      if (logError) throw logError;

      message.success('补货成功');
      setRestockModalVisible(false);
      fetchMaterials();
    } catch (error) {
      console.error('补货失败:', error);
      message.error('补货失败,请重试');
    } finally {
      setRestocking(false);
    }
  };

  const filteredMaterials = materials.filter(m =>
    !searchQuery ||
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">物资管理</h1>
          <p className="text-gray-500 mt-1">管理系统中所有物资信息，包括库存、分类、规格等</p>
        </div>
        <Button 
          className="h-11 bg-indigo-500 hover:bg-indigo-600 text-white gap-2"
          onClick={() => openModal()}
        >
          <Plus className="w-4 h-4" />
          添加物资
        </Button>
      </div>

      {/* Search */}
      <Card className="p-4 border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              type="text"
              placeholder="搜索物资名称或分类..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 border-gray-300 rounded-xl focus:border-indigo-500"
            />
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="border-gray-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">物资名称</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">分类</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">规格/型号</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">单位</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">当前库存</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">安全库存</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">存放位置</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMaterials.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center">
                      <Package className="w-10 h-10 text-gray-300 mb-3" />
                      <p className="text-gray-500 text-sm">暂无物资记录</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredMaterials.map((material) => (
                  <tr key={material.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center mr-3">
                          <Package className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div className="text-sm font-medium text-gray-900">{material.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {material.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {material.specification || '-'}
                      {material.model ? ` / ${material.model}` : ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {material.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${
                        material.stock < material.safe_stock ? 'text-red-600' : 'text-emerald-600'
                      }`}>
                        {material.stock}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {material.safe_stock}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {material.location || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                        onClick={() => openModal(material)}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                        onClick={() => openRestockModal(material)}
                      >
                        <RefreshCw className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => {
                          if (confirm('确定要删除这个物资吗?')) {
                            handleDelete(material.id);
                          }
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <PackagePlus className="w-5 h-5 text-indigo-500" />
            <span className="text-lg font-semibold">
              {editingMaterial ? '编辑物资' : '添加物资'}
            </span>
          </div>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">物资名称 *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="请输入物资名称"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">分类 *</label>
              <Input
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                placeholder="如: 办公用品、电子设备"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">规格</label>
              <Input
                value={formData.specification}
                onChange={(e) => setFormData({...formData, specification: e.target.value})}
                placeholder="如: A4, 标准型"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">型号</label>
              <Input
                value={formData.model}
                onChange={(e) => setFormData({...formData, model: e.target.value})}
                placeholder="如: HP-1020"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">单位 *</label>
              <Input
                value={formData.unit}
                onChange={(e) => setFormData({...formData, unit: e.target.value})}
                placeholder="如: 个、箱、件"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">存放位置</label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                placeholder="如: A区-1号货架"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">初始库存 *</label>
              <Input
                type="number"
                min={0}
                value={formData.stock}
                onChange={(e) => setFormData({...formData, stock: parseInt(e.target.value) || 0})}
                placeholder="请输入初始库存"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">安全库存 *</label>
              <Input
                type="number"
                min={0}
                value={formData.safe_stock}
                onChange={(e) => setFormData({...formData, safe_stock: parseInt(e.target.value) || 0})}
                placeholder="低于此数值将提醒"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button variant="outline" onClick={() => setModalVisible(false)}>
              取消
            </Button>
            <Button 
              className="bg-indigo-500 hover:bg-indigo-600 text-white"
              onClick={handleSubmit}
              loading={submitting}
            >
              {editingMaterial ? '更新' : '添加'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Restock Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-emerald-500" />
            <span className="text-lg font-semibold">物资补货</span>
          </div>
        }
        open={restockModalVisible}
        onCancel={() => setRestockModalVisible(false)}
        footer={null}
        width={500}
      >
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">补货数量 *</label>
            <Input
              type="number"
              min={1}
              value={restockData.quantity}
              onChange={(e) => setRestockData({...restockData, quantity: parseInt(e.target.value) || 1})}
              placeholder="请输入补货数量"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">备注</label>
            <Input
              value={restockData.notes}
              onChange={(e) => setRestockData({...restockData, notes: e.target.value})}
              placeholder="请输入备注(可选)"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button variant="outline" onClick={() => setRestockModalVisible(false)}>
              取消
            </Button>
            <Button 
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
              onClick={handleRestock}
              loading={restocking}
            >
              确认补货
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
