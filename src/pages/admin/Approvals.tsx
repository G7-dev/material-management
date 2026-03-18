import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckSquare, Search, AlertCircle, Clock, FileText, Package, X, CheckCircle2, XCircle,
  User, Building2, Hash, Calendar, FileCheck, AlertTriangle
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { supabase } from '../../lib/supabase';
import type { Requisition } from '../../lib/supabase';
import { message, Modal, Tabs } from 'antd';

const { TabPane } = Tabs;

export default function Approvals() {
  const [activeTab, setActiveTab] = useState('pending');
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [loading, setLoading] = useState(false);
  const [approveModalVisible, setApproveModalVisible] = useState(false);
  const [currentRequisition, setCurrentRequisition] = useState<Requisition | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedResult, setSelectedResult] = useState<'approved' | 'rejected' | null>(null);
  const [opinion, setOpinion] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchRequisitions();
  }, [activeTab]);

  async function fetchRequisitions() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('requisitions')
        .select('*, profiles:user_id(full_name, email), materials:material_id(name, category, specification, model, unit)')
        .eq('status', activeTab)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequisitions(data || []);
    } catch (error) {
      console.error('获取申领列表失败:', error);
      message.error('获取申领列表失败');
    } finally {
      setLoading(false);
    }
  }

  const openApproveModal = (requisition: Requisition) => {
    setCurrentRequisition(requisition);
    setSelectedResult(null);
    setOpinion('');
    setApproveModalVisible(true);
  };

  const handleApproval = async () => {
    if (!currentRequisition || !selectedResult) {
      message.error('请选择审批结果');
      return;
    }

    if (!opinion.trim()) {
      message.error('请输入审批意见');
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        message.error('请先登录');
        return;
      }

      const { error: approvalError } = await supabase
        .from('approvals')
        .insert({
          requisition_id: currentRequisition.id,
          approver_id: user.id,
          result: selectedResult,
          opinion: opinion.trim()
        });

      if (approvalError) throw approvalError;

      const { error: updateError } = await supabase
        .from('requisitions')
        .update({ status: selectedResult })
        .eq('id', currentRequisition.id);

      if (updateError) throw updateError;

      if (currentRequisition.requisition_type === 'daily_request' && selectedResult === 'approved') {
        const { data: material } = await supabase
          .from('materials')
          .select('stock')
          .eq('id', currentRequisition.material_id)
          .single();

        if (material && currentRequisition.request_quantity) {
          const stockBefore = material.stock;
          const stockAfter = stockBefore - currentRequisition.request_quantity;

          await supabase
            .from('materials')
            .update({ stock: stockAfter })
            .eq('id', currentRequisition.material_id);

          await supabase
            .from('inventory_logs')
            .insert({
              material_id: currentRequisition.material_id!,
              operation_type: 'request_out',
              quantity: -currentRequisition.request_quantity,
              stock_before: stockBefore,
              stock_after: stockAfter,
              reference_id: currentRequisition.id,
              created_by: user.id
            });

          await supabase
            .from('requisitions')
            .update({ status: 'completed' })
            .eq('id', currentRequisition.id);
        }
      }

      message.success(`审批${selectedResult === 'approved' ? '通过' : '驳回'}成功`);
      setApproveModalVisible(false);
      setSelectedResult(null);
      setOpinion('');
      fetchRequisitions();
    } catch (error) {
      console.error('审批失败:', error);
      message.error('审批失败,请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const formatMaterialInfo = (record: Requisition) => {
    if (record.requisition_type === 'daily_request') {
      return record.materials?.name || `物资ID: ${record.material_id}`;
    }
    return record.purchase_name || '申购物品';
  };

  const formatQuantity = (record: Requisition) => {
    if (record.requisition_type === 'daily_request') {
      const qty = record.quantity || record.request_quantity || 0;
      const unit = record.materials?.unit || '个';
      return `${qty} ${unit}`;
    }
    return `${record.purchase_quantity || 0} ${record.purchase_unit || '个'}`;
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { text: '待审批', cls: 'bg-amber-500/10 text-amber-700 border-amber-500/20' },
      approved: { text: '已通过', cls: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20' },
      rejected: { text: '已驳回', cls: 'bg-red-500/10 text-red-600 border-red-500/20' },
      completed: { text: '已完成', cls: 'bg-gray-500/10 text-gray-600 border-gray-500/20' }
    };
    const config = statusMap[status as keyof typeof statusMap] || { text: '未知', cls: 'bg-gray-500/10 text-gray-600 border-gray-500/20' };
    return <Badge className={`${config.cls} border`}>{config.text}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    return type === 'daily_request' ? (
      <Badge className="bg-indigo-500/10 text-indigo-600 border-indigo-500/20">日常领用</Badge>
    ) : (
      <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">物品申购</Badge>
    );
  };

  const pendingCount = requisitions.filter(r => r.status === 'pending').length;
  const todayCount = requisitions.filter(r => 
    new Date(r.created_at).toDateString() === new Date().toDateString()
  ).length;
  const purchaseCount = requisitions.filter(r => r.requisition_type === 'purchase_request').length;
  const totalCount = requisitions.length;

  return (
    <div className="p-8 space-y-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">审批管理</h1>
        <p className="text-gray-500 mt-1">处理物资申领和申购申请，确保物资合理分配</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 border-gray-200 bg-white">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-amber-500/5 p-3 rounded-xl">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <AlertCircle className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">待审批</p>
            <h3 className="text-3xl font-bold text-gray-900">{pendingCount}</h3>
          </div>
        </Card>
        <Card className="p-6 border-gray-200 bg-white">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-indigo-500/5 p-3 rounded-xl">
              <Calendar className="w-5 h-5 text-indigo-500" />
            </div>
            <TrendingUp className="w-5 h-5 text-indigo-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">今日申请</p>
            <h3 className="text-3xl font-bold text-gray-900">{todayCount}</h3>
          </div>
        </Card>
        <Card className="p-6 border-gray-200 bg-white">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-amber-500/5 p-3 rounded-xl">
              <FileCheck className="w-5 h-5 text-amber-600" />
            </div>
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">申购申请</p>
            <h3 className="text-3xl font-bold text-gray-900">{purchaseCount}</h3>
          </div>
        </Card>
        <Card className="p-6 border-gray-200 bg-white">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-purple-500/5 p-3 rounded-xl">
              <FileText className="w-5 h-5 text-purple-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">总申请数</p>
            <h3 className="text-3xl font-bold text-gray-900">{totalCount}</h3>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Card className="border-gray-200 bg-white">
        <Tabs activeKey={activeTab} onChange={setActiveTab} className="px-4 pt-4">
          <TabPane tab={`待审批 (${pendingCount})`} key="pending" />
          <TabPane tab="已通过" key="approved" />
          <TabPane tab="已驳回" key="rejected" />
          <TabPane tab="已完成" key="completed" />
        </Tabs>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">申请人</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">工号</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">物品名称</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">数量</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">申请类型</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">申请日期</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requisitions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center">
                      <Package className="w-10 h-10 text-gray-300 mb-3" />
                      <p className="text-gray-500 text-sm">暂无申请记录</p>
                    </div>
                  </td>
                </tr>
              ) : (
                requisitions.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center mr-3">
                          <User className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{record.profiles?.full_name || '-'}</div>
                          <div className="text-xs text-gray-500">{record.department || '未分配'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.employee_id || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatMaterialInfo(record)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className="bg-indigo-500/10 text-indigo-600 border-indigo-500/20">
                        {formatQuantity(record)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getTypeBadge(record.requisition_type)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.created_at ? new Date(record.created_at).toLocaleDateString('zh-CN') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(record.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {activeTab === 'pending' && (
                        <Button
                          size="sm"
                          className="bg-indigo-500 hover:bg-indigo-600 text-white"
                          onClick={() => openApproveModal(record)}
                        >
                          <CheckSquare className="w-4 h-4 mr-1" />
                          审批
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Approval Modal */}
      <Modal
        title={
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500/15 to-purple-500/15 flex items-center justify-center border border-indigo-500/20">
              <CheckSquare className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-bold text-lg">审批申请</h3>
              <p className="text-xs text-gray-500 mt-0.5">{currentRequisition?.profiles?.full_name || '申请人'}</p>
            </div>
          </div>
        }
        open={approveModalVisible}
        onCancel={() => {
          setApproveModalVisible(false);
          setSelectedResult(null);
          setOpinion('');
        }}
        footer={null}
        width={800}
      >
        <div className="px-6 pb-6 space-y-5">
          {/* Application Info */}
          <Card className="p-4 border-gray-200">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-500" />
                <div>
                  <div className="text-xs text-gray-500">申请人</div>
                  <div className="font-medium text-gray-900">{currentRequisition?.profiles?.full_name || '-'}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-indigo-500" />
                <div>
                  <div className="text-xs text-gray-500">工号</div>
                  <div className="font-medium text-gray-900">{currentRequisition?.employee_id || '-'}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-500" />
                <div>
                  <div className="text-xs text-gray-500">部门</div>
                  <div className="font-medium text-gray-900">{currentRequisition?.department || '未分配'}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-500" />
                <div>
                  <div className="text-xs text-gray-500">申请日期</div>
                  <div className="font-medium text-gray-900">
                    {currentRequisition?.created_at ? new Date(currentRequisition.created_at).toLocaleDateString('zh-CN') : '-'}
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              {currentRequisition?.requisition_type === 'purchase_request' && (
                <div className="mb-3">
                  <div className="text-xs text-gray-500 mb-1">申购理由</div>
                  <div className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                    {currentRequisition.purchase_reason || '-'}
                  </div>
                </div>
              )}
              <div>
                <div className="text-xs text-gray-500 mb-1">用途说明</div>
                <div className="text-sm text-gray-700 bg-blue-50 p-3 rounded">
                  {currentRequisition?.purpose || '未填写'}
                </div>
              </div>
            </div>
          </Card>

          {/* Approval Result Selection */}
          <Card className="p-4 border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-3">审批结果</h4>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setSelectedResult('approved')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  selectedResult === 'approved'
                    ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500/20'
                    : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/30'
                }`}
              >
                <div className="flex flex-col items-center">
                  <CheckCircle2 className={`w-8 h-8 ${selectedResult === 'approved' ? 'text-indigo-600' : 'text-gray-400'} mb-2`} />
                  <div className="font-semibold text-gray-900">审批通过</div>
                  <div className="text-xs text-gray-500 mt-1">同意该申请</div>
                </div>
              </button>
              <button
                onClick={() => setSelectedResult('rejected')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  selectedResult === 'rejected'
                    ? 'border-red-500 bg-red-50 ring-2 ring-red-500/20'
                    : 'border-gray-200 hover:border-red-300 hover:bg-red-50/30'
                }`}
              >
                <div className="flex flex-col items-center">
                  <XCircle className={`w-8 h-8 ${selectedResult === 'rejected' ? 'text-red-600' : 'text-gray-400'} mb-2`} />
                  <div className="font-semibold text-gray-900">审批驳回</div>
                  <div className="text-xs text-gray-500 mt-1">拒绝该申请</div>
                </div>
              </button>
            </div>
          </Card>

          {/* Approval Opinion */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              审批意见 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={opinion}
              onChange={(e) => setOpinion(e.target.value)}
              placeholder={selectedResult === 'rejected' ? '请输入驳回理由（必填）' : '请输入审批意见（建议填写）'}
              rows={4}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/40 resize-none"
            />
          </div>

          {/* Footer */}
          <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50 -mx-6 -mb-6 rounded-b-xl">
            <Button 
              variant="outline" 
              className="flex-1 h-11 rounded-xl"
              onClick={() => {
                setApproveModalVisible(false);
                setSelectedResult(null);
                setOpinion('');
              }}
            >
              取消
            </Button>
            <Button 
              className="flex-1 h-11 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white"
              onClick={handleApproval}
              disabled={!selectedResult || !opinion.trim() || submitting}
              loading={submitting}
            >
              确认{selectedResult === 'approved' ? '通过' : selectedResult === 'rejected' ? '驳回' : ''}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
