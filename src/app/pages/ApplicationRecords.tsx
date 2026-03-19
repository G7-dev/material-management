import { useState, useEffect } from 'react';
import { FileText, Calendar, Filter, Search, TrendingUp, Package, Trash2, CheckCircle2, X } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { EnhancedSelect } from '../components/ui/enhanced-select';
import {
  getApplicationRecords,
  deleteApplicationRecord,
  type ApplicationRecord,
} from '../utils/applicationStore';
import { supabase } from '../../lib/supabase';

export function ApplicationRecords() {
  const [records, setRecords] = useState<ApplicationRecord[]>([]);
  const [requisitions, setRequisitions] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    applicant: '',
    itemName: '',
    applicationType: '',
    status: ''
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load both application records and purchase requisitions
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      // Load local application records
      setRecords(getApplicationRecords());
      
      // Load purchase requisitions from Supabase
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from('requisitions')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (error) throw error;
          setRequisitions(data || []);
        }
      } catch (error) {
        console.error('Failed to load requisitions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Handle confirm receipt - auto archive
  const handleConfirmReceipt = async (requisitionId: string) => {
    try {
      const { error } = await supabase
        .from('requisitions')
        .update({ 
          status: 'archived',
          confirmed_at: new Date().toISOString(),
          archived_at: new Date().toISOString()
        })
        .filter('id', 'eq', requisitionId);

      if (error) throw error;

      toast.success('已确认收货并归档');
      
      // Reload data
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('requisitions')
          .select('*')
          .filter('user_id', 'eq', user.id)
          .filter('status', 'neq', 'archived') // Don't show archived in user view
          .order('created_at', { ascending: false });
        setRequisitions(data || []);
      }
    } catch (error: any) {
      console.error('Failed to confirm receipt:', error);
      toast.error(`确认收货失败: ${error.message || '请重试'}`);
    }
  };

  // Handle cancel requisition
  const handleCancel = async (requisitionId: string) => {
    if (!confirm('确定要取消该申购吗？')) return;
    
    try {
      const { error } = await supabase
        .from('requisitions')
        .update({ 
          status: 'cancelled',
          cancelled_at: new Date().toISOString()
        })
        .filter('id', 'eq', requisitionId);

      if (error) throw error;

      toast.success('已取消申购');
      
      // Reload data
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('requisitions')
          .select('*')
          .filter('user_id', 'eq', user.id)
          .order('created_at', { ascending: false });
        setRequisitions(data || []);
      }
    } catch (error: any) {
      console.error('Failed to cancel:', error);
      toast.error(`取消失败: ${error.message || '请重试'}`);
    }
  };

  const handleDelete = (id: string) => {
    // 删除申请记录
    deleteApplicationRecord(id);
    setRecords(getApplicationRecords());
    toast.success('申请单已删除');
  };

  // Filter both records and requisitions
  const filteredRecords = records.filter((r) => {
    const matchSearch =
      !searchQuery ||
      r.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.applicationType.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchApplicant = !filters.applicant || r.applicant === filters.applicant;
    const matchItemName = !filters.itemName || r.itemName.toLowerCase().includes(filters.itemName.toLowerCase());
    const matchAppType = !filters.applicationType || r.applicationType === filters.applicationType;
    const matchStatus = !filters.status || r.status === filters.status;
    
    return matchSearch && matchApplicant && matchItemName && matchAppType && matchStatus;
  });

  // Filter requisitions with the same criteria
  const filteredRequisitions = requisitions.filter((req) => {
    const matchSearch =
      !searchQuery ||
      (req.purchase_name && req.purchase_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      '物品申购'.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchApplicant = !filters.applicant || (req.applicant_name && req.applicant_name === filters.applicant);
    const matchItemName = !filters.itemName || (req.purchase_name && req.purchase_name.toLowerCase().includes(filters.itemName.toLowerCase()));
    const matchAppType = !filters.applicationType || '物品申购' === filters.applicationType;
    const matchStatus = !filters.status || req.status === filters.status;
    
    return matchSearch && matchApplicant && matchItemName && matchAppType && matchStatus;
  });

  // Calculate combined stats
  const pendingCount = records.filter((r) => r.status === 'pending').length;
  const approvedCount = records.filter((r) => r.status === 'approved').length;
  const rejectedCount = records.filter((r) => r.status === 'rejected').length;
  const totalCount = records.length + requisitions.length;

  const stats = [
    { label: '总申请数', value: String(totalCount), color: 'text-amber-600', bgColor: 'bg-amber-500/5' },
    { label: '待审批', value: String(pendingCount), color: 'text-primary', bgColor: 'bg-primary/5' },
    { label: '已通过', value: String(approvedCount), color: 'text-emerald-600', bgColor: 'bg-emerald-500/5' },
  ];

  const statusBadge = (status: string, label: string) => {
    const cls =
      status === 'approved'
        ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20'
        : status === 'rejected'
        ? 'bg-red-500/10 text-red-600 border-red-500/20'
        : 'bg-amber-500/10 text-amber-700 border-amber-500/20';
    return <Badge className={`${cls} border hover:${cls}`}>{label}</Badge>;
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-foreground tracking-tight">申请记录</h1>
        <p className="text-muted-foreground mt-1">查看您的物资申领和申购记录</p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3 text-muted-foreground">
            <div className="w-6 h-6 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
            <span>正在加载申请记录...</span>
          </div>
        </div>
      )}

      {/* Stats */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, index) => (
            <Card key={index} className="p-6 border-border hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.bgColor} p-3 rounded-xl`}>
                  <Calendar className={`w-5 h-5 ${stat.color}`} />
                </div>
                <TrendingUp className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                <h3 className="text-3xl font-bold text-foreground">{stat.value}</h3>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Filters and Search */}
      {!isLoading && (
        <Card className="p-5 border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="搜索物资名称或申请类型..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 h-11 bg-muted/50 border-border"
              />
            </div>
            <Button 
              className="gap-2 h-11 px-6 bg-primary hover:bg-primary/90"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              <Filter className="w-4 h-4" />
              高级筛选
            </Button>
          </div>
        
        {/* Advanced Filters Panel */}
        <div className={showAdvancedFilters ? 'block' : 'hidden'}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {/* Applicant Filter */}
            <div>
              <label className="block text-xs text-muted-foreground mb-1">申请人</label>
              <Input
                type="text"
                value={filters.applicant}
                onChange={(e) => setFilters(prev => ({ ...prev, applicant: e.target.value }))}
                placeholder="输入姓名"
                className="h-9 bg-muted/30 border-border text-sm"
              />
            </div>
            
            {/* Item Name Filter */}
            <div>
              <label className="block text-xs text-muted-foreground mb-1">物品名称</label>
              <Input
                type="text"
                value={filters.itemName}
                onChange={(e) => setFilters(prev => ({ ...prev, itemName: e.target.value }))}
                placeholder="输入物品名"
                className="h-9 bg-muted/30 border-border text-sm"
              />
            </div>
            
            {/* Application Type Filter */}
            <div>
              <label className="block text-xs text-muted-foreground mb-1">申请类型</label>
              <EnhancedSelect
                value={filters.applicationType}
                onChange={(value) => setFilters(prev => ({ ...prev, applicationType: value === 'all' ? '' : value }))}
                placeholder="全部类型"
                options={[
                  { value: 'all', label: '全部类型' },
                  { value: '日常领用', label: '日常领用' },
                  { value: '物品申购', label: '物品申购' },
                ]}
                size="sm"
                variant="filled"
                clearable={false}
              />
            </div>
            
            {/* Status Filter */}
            <div>
              <label className="block text-xs text-muted-foreground mb-1">审批状态</label>
              <EnhancedSelect
                value={filters.status}
                onChange={(value) => setFilters(prev => ({ ...prev, status: value === 'all' ? '' : value }))}
                placeholder="全部状态"
                options={[
                  { value: 'all', label: '全部状态' },
                  { value: 'pending', label: '待审核' },
                  { value: 'approved', label: '已批准' },
                  { value: 'rejected', label: '已驳回' },
                ]}
                size="sm"
                variant="filled"
                clearable={false}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2 pb-1">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setFilters({ applicant: '', itemName: '', applicationType: '', status: '' })}
              className="h-8 text-xs"
            >
              重置筛选
            </Button>
          </div>
        </div>
      </Card>
      )}

      {/* Table */}
      {!isLoading && (
      <Card className="border-border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50 border-b border-border">
                <TableHead className="font-semibold text-foreground">序号</TableHead>
                <TableHead className="font-semibold text-foreground">物品名称</TableHead>
                <TableHead className="font-semibold text-foreground">数量</TableHead>
                <TableHead className="font-semibold text-foreground">用途</TableHead>
                <TableHead className="font-semibold text-foreground">申请日期</TableHead>
                <TableHead className="font-semibold text-foreground">预计使用日期</TableHead>
                <TableHead className="font-semibold text-foreground">申请类型</TableHead>
                <TableHead className="font-semibold text-foreground">状态</TableHead>
                <TableHead className="font-semibold text-foreground">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Show requisitions first */}
              {filteredRequisitions.map((req, index) => {
                const statusConfig = {
                  pending: { cls: 'bg-amber-50 text-amber-600', label: '待审批' },
                  approved: { cls: 'bg-emerald-50 text-emerald-600', label: '已批准' },
                  arrival_notified: { cls: 'bg-blue-50 text-blue-600', label: '已到货', showConfirm: true },
                  confirmed: { cls: 'bg-purple-50 text-purple-600', label: '已确认' },
                  archived: { cls: 'bg-gray-50 text-gray-600', label: '已归档' },
                };
                const status = statusConfig[req.status as keyof typeof statusConfig] || { cls: 'bg-muted text-muted-foreground', label: '未知' };
                
                return (
                  <TableRow key={`req-${req.id}`} className="hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-sm font-medium text-foreground">
                        {index + 1}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-foreground">{req.purchase_name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {req.purchase_quantity} {req.purchase_unit}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{req.purchase_specification || '-'}</TableCell>
                    <TableCell className="text-muted-foreground">{new Date(req.created_at).toLocaleDateString('zh-CN')}</TableCell>
                    <TableCell className="text-muted-foreground">{req.expected_date ? new Date(req.expected_date).toLocaleDateString('zh-CN') : '-'}</TableCell>
                    <TableCell>
                      <Badge className="bg-primary/10 text-primary border border-primary/20">
                        物品申购
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge className={`${status.cls} border`}>
                          {status.label}
                        </Badge>
                        {req.status === 'arrival_notified' && (
                          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="已到货通知" />
                        )}
                        {req.status === 'confirmed' && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" title="已确认收货" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {/* Show confirm button for arrival_notified */}
                        {req.status === 'arrival_notified' && (
                          <Button
                            size="sm"
                            className="h-7 px-2 text-xs bg-gradient-to-r from-blue-500 to-blue-600 hover:shadow-lg"
                            onClick={() => handleConfirmReceipt(req.id)}
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            确认收货
                          </Button>
                        )}
                        
                        {/* Show cancel button for pending */}
                        {req.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs border-red-500 text-red-600 hover:bg-red-500/10"
                            onClick={() => handleCancel(req.id)}
                          >
                            <X className="w-3 h-3 mr-1" />
                            取消
                          </Button>
                        )}
                        
                        {/* Green notification for arrival_notified */}
                        {req.status === 'arrival_notified' && (
                          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="已到货通知" />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              
              {/* Then show regular application records */}
              {records.map((record, index) => (
                <TableRow key={record.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell>
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-sm font-medium text-foreground">
                      {requisitions.length + index + 1}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-foreground">{record.itemName}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {record.quantity} {record.unit}
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-[200px] truncate">{record.usage}</TableCell>
                  <TableCell className="text-muted-foreground">{record.applicationDate}</TableCell>
                  <TableCell className="text-muted-foreground">{record.expectedDate || '-'}</TableCell>
                  <TableCell>
                    <Badge className="bg-primary/10 text-primary border border-primary/20 hover:bg-primary/10">
                      {record.applicationType}
                    </Badge>
                  </TableCell>
                  <TableCell>{statusBadge(record.status, record.statusLabel)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {record.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-500 hover:text-red-600 hover:bg-red-500/5"
                          onClick={() => handleDelete(record.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/30">
          <p className="text-sm text-muted-foreground">共 {filteredRecords.length + filteredRequisitions.length} 条记录</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled className="border-border">
              上一页
            </Button>
            <div className="flex items-center gap-1">
              <Button size="sm" className="bg-primary hover:bg-primary/90">
                1
              </Button>
            </div>
            <Button variant="outline" size="sm" disabled className="border-border">
              下一页
            </Button>
            <span className="text-sm text-muted-foreground ml-2">/ 10 条/页</span>
          </div>
        </div>
      </Card>
      )}
    </div>
  );
}
