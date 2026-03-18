import { useState, useEffect } from 'react';
import {
  CheckSquare, Search, Filter, AlertCircle, Clock,
  FileText, Package, X, CheckCircle2, XCircle,
  User, Briefcase, Hash, ShoppingBag, MessageSquare,
  CalendarDays, AlertTriangle, Eye
} from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '../components/ui/table';
import {
  getApplicationRecords,
  updateApplicationStatus,
  type ApplicationRecord,
} from '../utils/applicationStore';

// ── Types ─────────────────────────────────────────────────────────────────────
type ApprovalStatus = 'pending' | 'approved' | 'rejected';

interface Approval {
  id: string;
  applicant: string;
  role: string;
  workId: string;
  department: string;
  itemName: string;
  quantity: string;
  purpose: string;
  applicationType: string;
  applicationDate: string;
  status: ApprovalStatus;
  statusLabel: string;
  rejectReason?: string;
}

const STORAGE_KEY = 'approval_management_data';

function loadApprovals(): Approval[] {
  // Load from shared applicationStore and convert
  const appRecords = getApplicationRecords();
  const fromApp: Approval[] = appRecords.map((r) => ({
    id: r.id,
    applicant: r.applicant || '用户',
    role: '员工',
    workId: '-',
    department: r.department || '默认部门',
    itemName: r.itemName,
    quantity: `${r.quantity} ${r.unit}`,
    purpose: r.usage,
    applicationType: r.applicationType,
    applicationDate: r.applicationDate,
    status: r.status,
    statusLabel: r.statusLabel,
    rejectReason: r.rejectReason,
  }));
  return fromApp;
}

function saveApprovals(_list: Approval[]) {
  // No-op: we now use applicationStore as the source of truth
}

// ── Approve Confirm Modal ─────────────────────────────────────────────────────
interface ApproveModalProps {
  approval: Approval;
  onClose: () => void;
  onConfirm: () => void;
}
function ApproveModal({ approval, onClose, onConfirm }: ApproveModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md">
        <Card className="border-border shadow-2xl shadow-emerald-500/10 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-emerald-400 to-teal-500" />
          <div className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">确认批准</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">请确认以下申请信息后批准</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Request Summary */}
            <div className="rounded-xl bg-muted/40 border border-border divide-y divide-border mb-5">
              {[
                { icon: User,        label: '申请人',  value: `${approval.applicant} · ${approval.role}` },
                { icon: Briefcase,   label: '部门',    value: approval.department },
                { icon: Hash,        label: '工号',    value: approval.workId },
                { icon: Package,     label: '物品',    value: approval.itemName },
                { icon: ShoppingBag, label: '数量',    value: approval.quantity },
                { icon: MessageSquare, label: '用途',  value: approval.purpose },
                { icon: CalendarDays, label: '申请日', value: approval.applicationDate },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3 px-4 py-2.5">
                  <Icon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  <span className="text-xs text-muted-foreground w-14 flex-shrink-0">{label}</span>
                  <span className="text-sm text-foreground font-medium truncate">{value}</span>
                </div>
              ))}
            </div>

            {/* Tip */}
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20 mb-5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <p className="text-xs text-emerald-700">批准后申请人将收到通知，物品将从库存中扣减</p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                onClick={onConfirm}
                className="flex-1 h-11 bg-gradient-to-r from-emerald-500 to-teal-500 hover:shadow-lg hover:shadow-emerald-500/25 text-white transition-all"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                确认批准
              </Button>
              <Button variant="outline" onClick={onClose} className="px-6 h-11 border-border">
                取消
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── Reject Modal ───────────────────────────────────────────────────────────────
interface RejectModalProps {
  approval: Approval;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}
function RejectModal({ approval, onClose, onConfirm }: RejectModalProps) {
  const [reason, setReason] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md">
        <Card className="border-border shadow-2xl shadow-red-500/10 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-red-400 to-rose-500" />
          <div className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">确认驳回</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">请填写驳回理由后提交</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Request Summary — compact */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border mb-5">
              <div className="w-9 h-9 rounded-lg bg-red-500/8 flex items-center justify-center border border-red-500/10 flex-shrink-0">
                <Package className="w-4 h-4 text-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {approval.applicant} <span className="text-muted-foreground font-normal">申请</span> {approval.itemName}
                </p>
                <p className="text-xs text-muted-foreground">{approval.department} · {approval.applicationType} · {approval.quantity} 件</p>
              </div>
              <Badge variant="secondary" className="bg-amber-50 text-amber-600 flex-shrink-0">
                待审核
              </Badge>
            </div>

            {/* Warning tip */}
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20 mb-5">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">驳回后申请人将收到通知，此操作不可撤销</p>
            </div>

            {/* Reject Reason */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-foreground mb-2">
                驳回理由 <span className="text-destructive">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="请填写驳回原因，将同步通知给申请人..."
                rows={4}
                className="w-full px-3 py-2.5 rounded-md border border-border bg-muted/50 text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500/50 transition-colors placeholder:text-muted-foreground"
              />
              <p className="text-xs text-muted-foreground mt-1 text-right">{reason.length} / 200</p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                onClick={() => reason.trim() && onConfirm(reason.trim())}
                disabled={!reason.trim()}
                className="flex-1 h-11 bg-gradient-to-r from-red-500 to-rose-500 hover:shadow-lg hover:shadow-red-500/25 disabled:opacity-50 text-white transition-all"
              >
                <XCircle className="w-4 h-4 mr-2" />
                确认驳回
              </Button>
              <Button variant="outline" onClick={onClose} className="px-6 h-11 border-border">
                取消
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function ApprovalManagement() {
  const [approvals, setApprovals]         = useState<Approval[]>(loadApprovals);
  const [approvingItem, setApprovingItem] = useState<Approval | null>(null);
  const [rejectingItem, setRejectingItem] = useState<Approval | null>(null);
  const [viewingItem, setViewingItem]     = useState<Approval | null>(null);
  const [activeTab, setActiveTab]         = useState<ApprovalStatus | 'all'>('pending');
  const [search, setSearch]               = useState('');
  const [filters, setFilters]             = useState({
    applicant: '',
    itemName: '',
    applicationType: '',
    status: ''
  });

  // 每次 approvals 变化时同步写入 localStorage
  useEffect(() => {
    saveApprovals(approvals);
  }, [approvals]);

  const pending  = approvals.filter(a => a.status === 'pending').length;
  const approved = approvals.filter(a => a.status === 'approved').length;
  const rejected = approvals.filter(a => a.status === 'rejected').length;

  const stats = [
    { label: '待审核',  value: String(pending),  color: 'text-amber-500',  bg: 'bg-amber-50',  icon: Clock        },
    { label: '今日已审', value: String(approved + rejected), color: 'text-blue-500', bg: 'bg-blue-50', icon: FileText },
    { label: '已驳回',  value: String(rejected), color: 'text-red-500',    bg: 'bg-red-50',    icon: AlertCircle  },
    { label: '已批准',  value: String(approved), color: 'text-green-500',  bg: 'bg-green-50',  icon: CheckSquare  },
  ];

  const handleApprove = (id: string) => {
    setApprovals(prev => prev.map(a =>
      a.id === id ? { ...a, status: 'approved', statusLabel: '已批准' } : a
    ));
    setApprovingItem(null);
    updateApplicationStatus(id, 'approved');
  };

  const handleReject = (id: string, reason: string) => {
    setApprovals(prev => prev.map(a =>
      a.id === id ? { ...a, status: 'rejected', statusLabel: '已驳回', rejectReason: reason } : a
    ));
    setRejectingItem(null);
    updateApplicationStatus(id, 'rejected', reason);
  };

  const filtered = approvals.filter(a => {
    const matchTab = activeTab === 'all' || a.status === activeTab;
    
    // Enhanced search
    const q = search.toLowerCase();
    const matchSearch = !q || 
      a.applicant.toLowerCase().includes(q) || 
      a.itemName.toLowerCase().includes(q) || 
      a.department.toLowerCase().includes(q);
    
    // Advanced filters
    const matchApplicant = !filters.applicant || a.applicant === filters.applicant;
    const matchItemName = !filters.itemName || a.itemName.toLowerCase().includes(filters.itemName.toLowerCase());
    const matchAppType = !filters.applicationType || a.applicationType === filters.applicationType;
    const matchStatus = !filters.status || a.status === filters.status;
    
    return matchTab && matchSearch && matchApplicant && matchItemName && matchAppType && matchStatus;
  });

  const tabs: { key: ApprovalStatus | 'all'; label: string; count: number }[] = [
    { key: 'pending',  label: '待审核', count: pending          },
    { key: 'approved', label: '已批准', count: approved         },
    { key: 'rejected', label: '已驳回', count: rejected         },
    { key: 'all',      label: '全部',   count: approvals.length },
  ];

  const statusStyle: Record<ApprovalStatus, string> = {
    pending:  'bg-amber-50 text-amber-600',
    approved: 'bg-emerald-50 text-emerald-600',
    rejected: 'bg-red-50 text-red-600',
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-foreground flex items-center gap-2">
          <CheckSquare className="w-8 h-8 text-primary" />
          审批管理
        </h1>
        <p className="text-muted-foreground mt-1">处理物资申请和审批流程，确保资源合理分配</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="p-5 border-border bg-white hover:shadow-lg transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                  <h3 className={`text-3xl font-semibold ${stat.color}`}>{stat.value}</h3>
                </div>
                <div className={`${stat.bg} ${stat.color} p-3 rounded-xl`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <Card className="p-4 border-border bg-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索申请人、物品名称..."
              className="pl-10 h-10 bg-muted/50 border-border"
            />
          </div>
          <Button 
            variant="outline" 
            className="gap-2 border-border"
            onClick={() => {
              // Toggle advanced filters visibility
              const panel = document.getElementById('advanced-filters');
              if (panel) {
                panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
              }
            }}
          >
            <Filter className="w-4 h-4" />高级筛选
          </Button>
        </div>

        {/* Advanced Filters Panel */}
        <div id="advanced-filters" className="hidden">
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
              <select
                value={filters.applicationType}
                onChange={(e) => setFilters(prev => ({ ...prev, applicationType: e.target.value }))}
                className="w-full h-9 rounded-lg border border-border bg-muted/30 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
              >
                <option value="">全部类型</option>
                <option value="日常领用">日常领用</option>
                <option value="物品申购">物品申购</option>
              </select>
            </div>
            
            {/* Status Filter */}
            <div>
              <label className="block text-xs text-muted-foreground mb-1">审批状态</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full h-9 rounded-lg border border-border bg-muted/30 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
              >
                <option value="">全部状态</option>
                <option value="pending">待审核</option>
                <option value="approved">已批准</option>
                <option value="rejected">已驳回</option>
              </select>
            </div>
          </div>
          
          <div className="flex items-center gap-2 pb-3">
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

        {/* Status Tabs */}
        <div className="flex gap-2 pt-4 border-t border-border">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
                activeTab === tab.key
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                activeTab === tab.key
                  ? 'bg-white/20 text-white'
                  : 'bg-muted-foreground/15 text-muted-foreground'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </Card>

      {/* Approval Table */}
      <Card className="border-border bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="font-semibold text-foreground text-center">序号</TableHead>
                <TableHead className="font-semibold text-foreground text-center">申请人</TableHead>
                <TableHead className="font-semibold text-foreground text-center">工号</TableHead>
                <TableHead className="font-semibold text-foreground text-center">部门</TableHead>
                <TableHead className="font-semibold text-foreground text-center">物品名称</TableHead>
                <TableHead className="font-semibold text-foreground text-center">数量</TableHead>
                <TableHead className="font-semibold text-foreground text-center">用途</TableHead>
                <TableHead className="font-semibold text-foreground text-center">申请类型</TableHead>
                <TableHead className="font-semibold text-foreground text-center">申请日期</TableHead>
                <TableHead className="font-semibold text-foreground text-center">查看</TableHead>
                <TableHead className="font-semibold text-foreground text-center">状态</TableHead>
                <TableHead className="font-semibold text-foreground text-center">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-16 text-muted-foreground">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    暂无匹配记录
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((approval, index) => (
                  <TableRow
                    key={approval.id}
                    className={`hover:bg-accent/50 ${
                      approval.status === 'approved' ? 'bg-emerald-500/2' :
                      approval.status === 'rejected' ? 'bg-red-500/2' : ''
                    }`}
                  >
                    <TableCell className="font-medium text-center">{index + 1}</TableCell>
                    <TableCell className="text-center">
                      <div>
                        <p className="font-medium text-foreground">{approval.applicant}</p>
                        <p className="text-xs text-muted-foreground">{approval.role}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{approval.workId}</TableCell>
                    <TableCell className="text-center">
                      <span className="px-2 py-1 rounded-md bg-primary/8 text-primary text-xs font-medium border border-primary/15">
                        {approval.department}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium text-center">{approval.itemName}</TableCell>
                    <TableCell className="text-center">{approval.quantity}</TableCell>
                    <TableCell className="text-center">
                      <span className="text-sm text-muted-foreground max-w-[120px] truncate block mx-auto" title={approval.purpose}>
                        {approval.purpose}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="bg-blue-50 text-blue-600">
                        {approval.applicationType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-center">{approval.applicationDate}</TableCell>
                    <TableCell className="text-center">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-xs border-border hover:bg-primary/10 hover:text-primary hover:border-primary/30 flex items-center gap-1"
                        onClick={() => setViewingItem(approval)}
                      >
                        <Eye className="w-3 h-3" />
                        查看
                      </Button>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        <Badge variant="secondary" className={statusStyle[approval.status]}>
                          {approval.statusLabel}
                        </Badge>
                        {approval.status === 'rejected' && approval.rejectReason && (
                          <span className="text-[10px] text-red-500 max-w-[100px] truncate" title={approval.rejectReason}>
                            {approval.rejectReason}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {approval.status === 'pending' ? (
                        <div className="flex gap-2 justify-center">
                          <Button
                            size="sm"
                            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:shadow-md text-white"
                            onClick={() => setApprovingItem(approval)}
                          >
                            批准
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-border hover:bg-red-500/10 hover:text-red-600 hover:border-red-500/30"
                            onClick={() => setRejectingItem(approval)}
                          >
                            驳回
                          </Button>
                        </div>
                      ) : (
                        <span className={`text-xs font-medium ${
                          approval.status === 'approved' ? 'text-emerald-600' : 'text-red-500'
                        }`}>
                          {approval.status === 'approved' ? '已处理' : '已驳回'}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border">
          <p className="text-sm text-muted-foreground">共 {filtered.length} 条记录</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled className="border-border">上一页</Button>
            <Button size="sm" className="bg-primary text-white">1</Button>
            <Button variant="outline" size="sm" disabled className="border-border">下一页</Button>
            <span className="text-sm text-muted-foreground ml-2">/ 10 条/页</span>
          </div>
        </div>
      </Card>

      {/* ── Modals ── */}
      {approvingItem && (
        <ApproveModal
          approval={approvingItem}
          onClose={() => setApprovingItem(null)}
          onConfirm={() => handleApprove(approvingItem.id)}
        />
      )}
      {rejectingItem && (
        <RejectModal
          approval={rejectingItem}
          onClose={() => setRejectingItem(null)}
          onConfirm={(reason) => handleReject(rejectingItem.id, reason)}
        />
      )}
      {viewingItem && (
        <ViewModal
          approval={viewingItem}
          onClose={() => setViewingItem(null)}
        />
      )}
    </div>
  );
}

// ── View Modal ────────────────────────────────────────────────────────────────
interface ViewModalProps {
  approval: Approval;
  onClose: () => void;
}
function ViewModal({ approval, onClose }: ViewModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl mx-4">
        <Card className="border-border shadow-2xl shadow-primary/10 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500" />
          
          <div className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 flex items-center justify-center border border-indigo-500/20">
                  <FileText className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h2 className="font-bold text-foreground text-lg">申请详情</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {approval.applicationType} · {approval.applicationDate}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {/* Applicant Info */}
              <div className="col-span-2 p-4 rounded-xl bg-muted/30 border border-border">
                <h3 className="font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  申请人信息
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">姓名：</span>
                    <span className="font-medium text-foreground">{approval.applicant}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">工号：</span>
                    <span className="font-medium text-foreground">{approval.workId}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">部门：</span>
                    <span className="font-medium text-foreground">{approval.department}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">角色：</span>
                    <span className="font-medium text-foreground">{approval.role}</span>
                  </div>
                </div>
              </div>

              {/* Item Info */}
              <div className="p-4 rounded-xl bg-muted/30 border border-border">
                <h3 className="font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4 text-primary" />
                  物品信息
                </h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">名称：</span>
                    <span className="font-medium text-foreground">{approval.itemName}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">数量：</span>
                    <span className="font-medium text-foreground">{approval.quantity}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">类型：</span>
                    <span className="font-medium text-foreground">{approval.applicationType}</span>
                  </div>
                </div>
              </div>

              {/* Purpose */}
              <div className="p-4 rounded-xl bg-muted/30 border border-border">
                <h3 className="font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  用途说明
                </h3>
                <p className="text-sm text-foreground">{approval.purpose || '未填写'}</p>
              </div>

              {/* Status */}
              <div className="col-span-2 p-4 rounded-xl bg-primary/5 border border-primary/15">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <CheckSquare className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">审批状态</p>
                    <Badge variant="secondary" className={statusStyle[approval.status]}>
                      {approval.statusLabel}
                    </Badge>
                  </div>
                </div>
                {approval.status === 'rejected' && approval.rejectReason && (
                  <div className="mt-3 p-3 rounded-lg bg-red-500/5 border border-red-500/15">
                    <p className="text-xs text-muted-foreground mb-1">驳回理由：</p>
                    <p className="text-sm text-red-600">{approval.rejectReason}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Image placeholder */}
            <div className="p-4 rounded-xl bg-muted/30 border border-border border-dashed">
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                <div className="text-center">
                  <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">物品图片预览区域</p>
                  <p className="text-xs">（功能开发中）</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 p-6 pt-4 border-t border-border">
            <Button 
              className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 hover:shadow-lg hover:shadow-indigo-500/25"
              onClick={onClose}
            >
              关闭
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}