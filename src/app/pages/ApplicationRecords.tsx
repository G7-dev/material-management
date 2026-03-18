import { useState, useEffect } from 'react';
import { FileText, Calendar, Filter, Search, TrendingUp, Package, Trash2 } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  getApplicationRecords,
  deleteApplicationRecord,
  type ApplicationRecord,
} from '../utils/applicationStore';

export function ApplicationRecords() {
  const [records, setRecords] = useState<ApplicationRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setRecords(getApplicationRecords());
  }, []);

  const handleDelete = (id: string) => {
    deleteApplicationRecord(id);
    setRecords(getApplicationRecords());
  };

  const filtered = records.filter(
    (r) =>
      !searchQuery ||
      r.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.applicationType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingCount = records.filter((r) => r.status === 'pending').length;
  const approvedCount = records.filter((r) => r.status === 'approved').length;
  const rejectedCount = records.filter((r) => r.status === 'rejected').length;

  const stats = [
    { label: '总申请数', value: String(records.length), color: 'text-amber-600', bgColor: 'bg-amber-500/5' },
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

      {/* Stats */}
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

      {/* Filters and Search */}
      <Card className="p-5 border-border">
        <div className="flex items-center gap-3">
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
          <Button className="gap-2 h-11 px-6 bg-primary hover:bg-primary/90">
            <Filter className="w-4 h-4" />
            筛选
          </Button>
        </div>
      </Card>

      {/* Table */}
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
                <TableHead className="font-semibold text-foreground">申请类型</TableHead>
                <TableHead className="font-semibold text-foreground">状态</TableHead>
                <TableHead className="font-semibold text-foreground">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-16">
                    <div className="flex flex-col items-center">
                      <Package className="w-10 h-10 text-muted-foreground/30 mb-3" />
                      <p className="text-muted-foreground text-sm">暂无申请记录</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((record, index) => (
                  <TableRow key={record.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-sm font-medium text-foreground">
                        {index + 1}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-foreground">{record.itemName}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {record.quantity} {record.unit}
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-[200px] truncate">{record.usage}</TableCell>
                    <TableCell className="text-muted-foreground">{record.applicationDate}</TableCell>
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
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/30">
          <p className="text-sm text-muted-foreground">共 {filtered.length} 条记录</p>
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
    </div>
  );
}
