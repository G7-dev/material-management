import { useState, useEffect, useCallback } from 'react';
import {
  CheckSquare, Package, Calendar, Clock, Eye, Bell,
  Search, Filter, User, Building2, PackagePlus,
  CheckCircle2, X, Send
} from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../components/ui/table';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Requisition {
  id: string;
  user_id: string;
  applicant_name: string;
  department: string;
  purchase_name: string;
  purchase_specification: string;
  purchase_unit: string;
  purchase_quantity: number;
  status: 'pending' | 'approved' | 'arrival_notified' | 'confirmed' | 'archived';
  status_label: string;
  created_at: string;
  estimated_delivery_date: string;
  notification_time?: string;
}

// ── Notification Modal ────────────────────────────────────────────────────────
interface NotificationModalProps {
  requisition: Requisition;
  onClose: () => void;
  onConfirm: (notificationTime: string) => void;
}

function NotificationModal({ requisition, onClose, onConfirm }: NotificationModalProps) {
  // Default to next day 10:00
  const defaultTime = new Date();
  defaultTime.setDate(defaultTime.getDate() + 1);
  defaultTime.setHours(10, 0, 0, 0);
  const defaultValue = defaultTime.toISOString().slice(0, 16);
  
  const [notificationTime, setNotificationTime] = useState(defaultValue);

  const handleConfirm = () => {
    onConfirm(notificationTime);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <Card className="relative z-10 w-full max-w-md border-border shadow-2xl">
        <div className="flex items-center gap-3 p-6 border-b border-border">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
            <Bell className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">到货通知</h2>
            <p className="text-xs text-muted-foreground">设置领用时间并发送通知</p>
          </div>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">选择领用时间</label>
            <input
              type="datetime-local"
              value={notificationTime}
              onChange={(e) => setNotificationTime(e.target.value)}
              className="w-full h-11 rounded-lg border border-border bg-muted/50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
            <p className="text-xs text-muted-foreground">默认时间为第二天 10:00</p>
          </div>
          
          <div className="bg-muted/30 rounded-lg p-4 border border-border">
            <p className="text-sm font-medium text-foreground mb-1">{requisition.purchase_name}</p>
            <p className="text-xs text-muted-foreground">{requisition.applicant_name} · {requisition.department}</p>
          </div>
        </div>
        
        <div className="flex gap-3 p-6 pt-0">
          <Button onClick={handleConfirm} className="flex-1 bg-gradient-to-r from-primary to-secondary hover:shadow-lg">
            <Send className="w-4 h-4 mr-2" />
            发送通知
          </Button>
          <Button variant="outline" onClick={onClose}>取消</Button>
        </div>
      </Card>
    </div>
  );
}

// ── View Modal ─────────────────────────────────────────────────────────────────
interface ViewModalProps {
  requisition: Requisition;
  onClose: () => void;
}

function ViewModal({ requisition, onClose }: ViewModalProps) {
  const statusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return { cls: 'bg-amber-50 text-amber-600', label: '待审批' };
      case 'approved':
        return { cls: 'bg-emerald-50 text-emerald-600', label: '已批准' };
      case 'arrival_notified':
        return { cls: 'bg-blue-50 text-blue-600', label: '已通知' };
      case 'confirmed':
        return { cls: 'bg-purple-50 text-purple-600', label: '已确认' };
      case 'archived':
        return { cls: 'bg-gray-50 text-gray-600', label: '已归档' };
      default:
        return { cls: 'bg-muted text-muted-foreground', label: status };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <Card className="relative z-10 w-full max-w-2xl border-border shadow-2xl">
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <Eye className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h2 className="font-bold text-foreground text-lg">申购详情</h2>
                <p className="text-xs text-muted-foreground">{requisition.purchase_name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Applicant Info */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-muted/30 border border-border">
            <div>
              <span className="text-xs text-muted-foreground">申请人</span>
              <p className="font-medium text-foreground">{requisition.applicant_name}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">部门</span>
              <p className="font-medium text-foreground">{requisition.department}</p>
            </div>
          </div>
          
          {/* Item Details */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" />
              物品信息
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 rounded-lg bg-muted/30 border border-border">
                <span className="text-xs text-muted-foreground">物品名称</span>
                <p className="font-medium text-foreground">{requisition.purchase_name}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30 border border-border">
                <span className="text-xs text-muted-foreground">规格</span>
                <p className="font-medium text-foreground">{requisition.purchase_specification}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30 border border-border">
                <span className="text-xs text-muted-foreground">数量</span>
                <p className="font-medium text-foreground">{requisition.purchase_quantity} {requisition.purchase_unit}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30 border border-border">
                <span className="text-xs text-muted-foreground">预计到货</span>
                <p className="font-medium text-foreground">{new Date(requisition.estimated_delivery_date).toLocaleDateString('zh-CN')}</p>
              </div>
            </div>
          </div>
          
          {/* Status */}
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/15">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <CheckSquare className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">审批状态</p>
                <Badge className={statusBadge(requisition.status).cls}>
                  {statusBadge(requisition.status).label}
                </Badge>
              </div>
            </div>
            {requisition.notification_time && (
              <div className="mt-3 p-3 rounded-lg bg-blue-500/5 border border-blue-500/15">
                <p className="text-xs text-muted-foreground mb-1">通知时间：</p>
                <p className="text-sm text-blue-600 font-medium">
                  {new Date(requisition.notification_time).toLocaleString('zh-CN')}
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
// Purchase Management Component
export function PurchaseManagement() {
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequisition, setSelectedRequisition] = useState<Requisition | null>(null);
  const [viewingRequisition, setViewingRequisition] = useState<Requisition | null>(null);
  const [loading, setLoading] = useState(false);

  // Load requisitions from Supabase
  const loadRequisitions = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('requisitions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const reqs: Requisition[] = (data || []).map((item: any) => ({
        id: item.id,
        user_id: item.user_id,
        applicant_name: item.applicant_name || '未知用户',
        department: item.department || '未指定',
        purchase_name: item.purchase_name,
        purchase_specification: item.purchase_specification || '-',
        purchase_unit: item.purchase_unit || '个',
        purchase_quantity: item.purchase_quantity || 0,
        status: item.status || 'pending',
        status_label: getStatusLabel(item.status),
        created_at: item.created_at,
        estimated_delivery_date: item.estimated_delivery_date,
        notification_time: item.notification_time,
      }));

      setRequisitions(reqs);
    } catch (error) {
      console.error('Failed to load requisitions:', error);
      toast.error('加载申购列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return '待审批';
      case 'approved': return '已批准';
      case 'arrival_notified': return '已通知';
      case 'confirmed': return '已确认';
      case 'archived': return '已归档';
      default: return '未知';
    }
  };

  // Handle approval
  const handleApprove = async (id: string) => {
    try {
      const { error } = await supabase
        .from('requisitions')
        .update({ status: 'approved' })
        .eq('id', id);

      if (error) throw error;

      toast.success('申购已批准');
      loadRequisitions();
    } catch (error) {
      console.error('Failed to approve:', error);
      toast.error('批准失败');
    }
  };

  // Handle notification
  const handleNotification = async (id: string, notificationTime: string) => {
    try {
      // Use filter instead of eq to avoid encoding issues
      const { error } = await supabase
        .from('requisitions')
        .update({ 
          status: 'arrival_notified',
          notification_time: notificationTime
        })
        .filter('id', 'eq', id);

      if (error) throw error;

      toast.success('到货通知已发送');
      loadRequisitions();
    } catch (error) {
      console.error('Failed to send notification:', error);
      toast.error('发送通知失败');
    }
  };

  // Handle rejection
  const handleReject = async (id: string) => {
    try {
      const { error } = await supabase
        .from('requisitions')
        .update({ status: 'rejected' })
        .eq('id', id);

      if (error) throw error;

      toast.success('申购已驳回');
      loadRequisitions();
    } catch (error) {
      console.error('Failed to reject:', error);
      toast.error('驳回失败');
    }
  };

  // Handle auto-archive when user confirms receipt
  const handleAutoArchive = async (id: string) => {
    try {
      const { error } = await supabase
        .from('requisitions')
        .update({ status: 'archived' })
        .eq('id', id);

      if (error) throw error;

      // Also create an approval record for tracking
      const { data: req } = await supabase
        .from('requisitions')
        .select('*')
        .eq('id', id)
        .single();

      if (req) {
        await supabase
          .from('approval_records')
          .insert({
            requisition_id: id,
            applicant_name: req.applicant_name,
            department: req.department,
            item_name: req.purchase_name,
            quantity: req.purchase_quantity,
            status: 'archived',
            archived_at: new Date().toISOString(),
          });
      }

      loadRequisitions();
    } catch (error) {
      console.error('Failed to auto-archive:', error);
    }
  };

  // Listen for user confirmation
  useEffect(() => {
    const interval = setInterval(() => {
      checkUserConfirmations();
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const checkUserConfirmations = async () => {
    try {
      const { data } = await supabase
        .from('requisitions')
        .select('*')
        .filter('status', 'eq', 'confirmed');

      if (data) {
        for (const req of data) {
          await handleAutoArchive(req.id);
        }
      }
    } catch (error) {
      console.error('Failed to check confirmations:', error);
    }
  };

  // Filtered requisitions
  const filtered = requisitions.filter(r => {
    const q = searchQuery.toLowerCase();
    return !q || 
      r.applicant_name.toLowerCase().includes(q) ||
      r.department.toLowerCase().includes(q) ||
      r.purchase_name.toLowerCase().includes(q);
  });

  useEffect(() => {
    loadRequisitions();
  }, [loadRequisitions]);

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-foreground tracking-tight">申购管理</h1>
        <p className="text-muted-foreground mt-1">处理物资申购请求和到货通知</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: '待审批', value: requisitions.filter(r => r.status === 'pending').length, color: 'text-amber-600', bgColor: 'bg-amber-500/5' },
          { label: '已批准', value: requisitions.filter(r => r.status === 'approved').length, color: 'text-emerald-600', bgColor: 'bg-emerald-500/5' },
          { label: '已通知', value: requisitions.filter(r => r.status === 'arrival_notified').length, color: 'text-blue-600', bgColor: 'bg-blue-500/5' },
          { label: '已归档', value: requisitions.filter(r => r.status === 'archived').length, color: 'text-gray-600', bgColor: 'bg-gray-500/5' },
        ].map(stat => (
          <Card key={stat.label} className="p-4 border-border">
            <div className="flex items-center justify-between">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <Package className={`w-5 h-5 ${stat.color}`} />
              </div>
              <span className="text-2xl font-bold text-foreground">{stat.value}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">{stat.label}</p>
          </Card>
        ))}
      </div>

      {/* Search */}
      <Card className="p-4 border-border">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="搜索申请人、部门或物品名称..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 bg-muted/50 border-border"
            />
          </div>
          <Button variant="outline" className="gap-2 h-11 border-border">
            <Filter className="w-4 h-4" />
            筛选
          </Button>
        </div>
      </Card>

      {/* Table */}
      <Card className="border-border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50 border-b border-border">
              <TableHead className="font-semibold text-foreground">序号</TableHead>
              <TableHead className="font-semibold text-foreground">姓名</TableHead>
              <TableHead className="font-semibold text-foreground">部门</TableHead>
              <TableHead className="font-semibold text-foreground">物品名称</TableHead>
              <TableHead className="font-semibold text-foreground">规格</TableHead>
              <TableHead className="font-semibold text-foreground">数量</TableHead>
              <TableHead className="font-semibold text-foreground text-center">查看</TableHead>
              <TableHead className="font-semibold text-foreground text-center">审批</TableHead>
              <TableHead className="font-semibold text-foreground text-center">状态</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-16 text-muted-foreground">
                  <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  暂无申购记录
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((req, index) => (
                <TableRow key={req.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell className="font-medium text-foreground">{req.applicant_name}</TableCell>
                  <TableCell className="text-muted-foreground">{req.department}</TableCell>
                  <TableCell className="font-medium text-foreground">{req.purchase_name}</TableCell>
                  <TableCell className="text-muted-foreground">{req.purchase_specification}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {req.purchase_quantity} {req.purchase_unit}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-xs border-border hover:bg-primary/10 hover:text-primary hover:border-primary/30 flex items-center gap-1"
                        onClick={() => setViewingRequisition(req)}
                      >
                        <Eye className="w-3 h-3" />
                        查看
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {req.status === 'pending' ? (
                      <div className="flex gap-2 justify-center">
                        <Button
                          size="sm"
                          className="h-7 px-3 text-xs bg-gradient-to-r from-emerald-500 to-emerald-600 hover:shadow-lg"
                          onClick={() => handleApprove(req.id)}
                        >
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          批准
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-7 px-3 text-xs"
                          onClick={() => handleReject(req.id)}
                        >
                          <X className="w-3 h-3 mr-1" />
                          驳回
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">{req.status_label}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {req.status === 'approved' ? (
                      <Button
                        size="sm"
                        className="h-7 px-3 text-xs bg-gradient-to-r from-blue-500 to-blue-600 hover:shadow-lg"
                        onClick={() => setSelectedRequisition(req)}
                      >
                        <Bell className="w-3 h-3 mr-1" />
                        到货通知
                      </Button>
                    ) : (
                      <Badge className={`${getStatusBadgeStyle(req.status)} border`}>
                        {req.status_label}
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Modals */}
      {selectedRequisition && (
        <NotificationModal
          requisition={selectedRequisition}
          onClose={() => setSelectedRequisition(null)}
          onConfirm={(time) => handleNotification(selectedRequisition.id, time)}
        />
      )}
      
      {viewingRequisition && (
        <ViewModal
          requisition={viewingRequisition}
          onClose={() => setViewingRequisition(null)}
        />
      )}

      {/* Loading */}
      {loading && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
          <div className="relative z-10 flex items-center gap-3 px-6 py-4 rounded-xl bg-background border border-border shadow-2xl">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <span className="text-sm font-medium text-foreground">加载中...</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper: Get status badge styles
function getStatusBadgeStyle(status: string): string {
  switch (status) {
    case 'pending': return 'bg-amber-50 text-amber-600';
    case 'approved': return 'bg-emerald-50 text-emerald-600';
    case 'arrival_notified': return 'bg-blue-50 text-blue-600';
    case 'confirmed': return 'bg-purple-50 text-purple-600';
    case 'archived': return 'bg-gray-50 text-gray-600';
    default: return 'bg-muted text-muted-foreground';
  }
}
