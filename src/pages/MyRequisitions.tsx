import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Calendar, Search, TrendingUp, Package, FileCheck, Clock, CheckCircle } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { supabase } from '../lib/supabase';
import type { Requisition } from '../lib/supabase';
import { isAdmin } from '../lib/auth';
import { message } from 'antd';

export default function MyRequisitions() {
  const navigate = useNavigate();
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdminUser, setIsAdminUser] = useState(false);

  useEffect(() => {
    fetchRequisitions();
    checkAdmin();
  }, []);

  async function checkAdmin() {
    const admin = await isAdmin();
    setIsAdminUser(admin);
  }

  async function fetchRequisitions() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        message.error('请先登录');
        navigate('/login');
        return;
      }

      let query = supabase
        .from('requisitions')
        .select('*, profiles:user_id(full_name, email), materials:material_id(name, category)')
        .order('created_at', { ascending: false });

      if (!isAdminUser) {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query;
      if (error) throw error;

      setRequisitions(data || []);
    } catch (error) {
      console.error('获取记录失败:', error);
      message.error('获取记录失败');
    } finally {
      setLoading(false);
    }
  }

  const formatMaterialInfo = (record: Requisition) => {
    if (record.requisition_type === 'daily_request') {
      return record.materials?.name || `物资ID: ${record.material_id}`;
    } else {
      return record.purchase_name || '申购物品';
    }
  };

  const formatQuantity = (record: Requisition) => {
    if (record.requisition_type === 'daily_request') {
      return `${record.quantity || record.request_quantity || 0} 个`;
    } else {
      return `${record.purchase_quantity || 0} ${record.purchase_unit || '个'}`;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { text: string; cls: string }> = {
      pending: { text: '待审批', cls: 'bg-amber-500/10 text-amber-700 border-amber-500/20' },
      approved: { text: '已通过', cls: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20' },
      rejected: { text: '已驳回', cls: 'bg-red-500/10 text-red-600 border-red-500/20' },
      completed: { text: '已完成', cls: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20' },
      cancelled: { text: '已取消', cls: 'bg-gray-500/10 text-gray-600 border-gray-500/20' }
    };
    const { text, cls } = statusMap[status] || { text: status, cls: 'bg-gray-500/10 text-gray-600 border-gray-500/20' };
    return <Badge className={`${cls} border`}>{text}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    return type === 'daily_request' ? (
      <Badge className="bg-indigo-500/10 text-indigo-600 border-indigo-500/20">日常领用</Badge>
    ) : (
      <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">物品申购</Badge>
    );
  };

  const filtered = requisitions.filter(r =>
    !searchQuery ||
    formatMaterialInfo(r).toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.purpose?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingCount = requisitions.filter(r => r.status === 'pending').length;
  const approvedCount = requisitions.filter(r => r.status === 'approved' || r.status === 'completed').length;
  const totalCount = requisitions.length;

  return (
    <div className="p-8 space-y-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">
          {isAdminUser ? '所有申请记录' : '我的申请记录'}
        </h1>
        <p className="text-gray-500 mt-1">
          {isAdminUser ? '查看和管理所有申请记录' : '查看您的物资申领和申购记录'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 border-gray-200 bg-white hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-amber-500/5 p-3 rounded-xl">
              <FileText className="w-5 h-5 text-amber-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">总申请数</p>
            <h3 className="text-3xl font-bold text-gray-900">{totalCount}</h3>
          </div>
        </Card>
        <Card className="p-6 border-gray-200 bg-white hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-indigo-500/5 p-3 rounded-xl">
              <Clock className="w-5 h-5 text-indigo-500" />
            </div>
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">待审批</p>
            <h3 className="text-3xl font-bold text-gray-900">{pendingCount}</h3>
          </div>
        </Card>
        <Card className="p-6 border-gray-200 bg-white hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-emerald-500/5 p-3 rounded-xl">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">已通过</p>
            <h3 className="text-3xl font-bold text-gray-900">{approvedCount}</h3>
          </div>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="p-5 border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <Input
              type="text"
              placeholder="搜索物资名称或用途..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-11 border-gray-300 rounded-xl focus:border-indigo-500"
            />
          </div>
          <Button 
            className="gap-2 h-11 px-6 bg-indigo-500 hover:bg-indigo-600 text-white"
            onClick={() => fetchRequisitions()}
          >
            <Package className="w-4 h-4" />
            刷新
          </Button>
        </div>
      </Card>

      {/* Table */}
      <Card className="border-gray-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">序号</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">物品名称</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">数量</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">用途</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">申请日期</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">申请类型</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center">
                      <Package className="w-10 h-10 text-gray-300 mb-3" />
                      <p className="text-gray-500 text-sm">暂无申请记录</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((record, index) => (
                  <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-900">
                        {index + 1}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                      {formatMaterialInfo(record)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {formatQuantity(record)}
                    </td>
                    <td className="px-6 py-4 text-gray-500 max-w-xs truncate">
                      {record.purpose || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {record.created_at ? new Date(record.created_at).toLocaleDateString('zh-CN') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getTypeBadge(record.requisition_type)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(record.status)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
