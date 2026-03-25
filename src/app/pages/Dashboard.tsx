import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ShoppingBag, FileCheck, CheckCircle, Clock, TrendingUp, Package, Calendar, ArrowRight, BarChart2 } from 'lucide-react';
import { format, subMonths, isWithinInterval, parseISO } from 'date-fns';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { getApplicationRecords } from '../utils/applicationStore';
import { supabase } from '../../lib/supabase';

const quickActions = [
  { label: '快捷领用', subLabel: '查看库存', icon: Package, color: 'text-primary', bgColor: 'bg-primary/5', path: '/daily-collection' },
  { label: '提交申请', subLabel: '新建申请单', icon: FileCheck, color: 'text-secondary', bgColor: 'bg-secondary/5', path: '/item-purchase' },
  { label: '查看记录', subLabel: '历史记录', icon: Calendar, color: 'text-cyan-600', bgColor: 'bg-cyan-500/5', path: '/application-records' },
];

  const [recentApplications, setRecentApplications] = useState<Array<{
    id: string; item: string; quantity: number; status: string; date: string; type: string;
  }>>([]);



const BAR_COLORS = [
  '#6366f1', '#7c3aed', '#8b5cf6', '#a78bfa',
  '#818cf8', '#93c5fd', '#60a5fa', '#38bdf8',
];

const CATEGORY_COLOR: Record<string, string> = {
  '办公用品': 'bg-primary/10 text-primary border-primary/20',
  '电子设备': 'bg-purple-500/10 text-purple-600 border-purple-500/20',
};

export function Dashboard() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const navigate = useNavigate();
  const [stats, setStats] = useState([
    { label: '当前领用', value: '0', icon: ShoppingBag, color: 'text-primary', bgColor: 'bg-primary/5', change: '+0%' },
    { label: '等待申购', value: '0', icon: FileCheck, color: 'text-emerald-600', bgColor: 'bg-emerald-500/5', change: '+0%' },
    { label: '已通过', value: '0', icon: CheckCircle, color: 'text-purple-600', bgColor: 'bg-purple-500/5', change: '+0%' },
    { label: '待签收', value: '0', icon: Clock, color: 'text-amber-600', bgColor: 'bg-amber-500/5', change: '+0%' },
  ]);
  const [collectionRanking, setCollectionRanking] = useState<Array<{ name: string; count: number; category: string }>>([]);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const totalCount = collectionRanking.reduce((s, i) => s + i.count, 0);
  const topItem = collectionRanking[0] || { name: '-', count: 0 };

  // 加载实时统计数据和近一个月领用排行
  useEffect(() => {
    const loadStats = async () => {
      const records = await getApplicationRecords();
      
      // 计算各状态数量
      const pendingCount = records.filter(r => r.status === 'pending').length;
      const approvedCount = records.filter(r => r.status === 'approved').length;
      const rejectedCount = records.filter(r => r.status === 'rejected').length;
      
      // 计算等待申购（物品申购且待审核）
      const waitingPurchase = records.filter(r => 
        r.applicationType === '物品申购' && r.status === 'pending'
      ).length;
      
      // 计算当前领用（日常领用且已通过）
      const currentCollection = records.filter(r =>
        r.applicationType === '日常领用' && r.status === 'approved'
      ).length;
      
      // 更新统计数据
      setStats([
        { label: '当前领用', value: String(currentCollection), icon: ShoppingBag, color: 'text-primary', bgColor: 'bg-primary/5', change: `+${currentCollection}%` },
        { label: '等待申购', value: String(waitingPurchase), icon: FileCheck, color: 'text-emerald-600', bgColor: 'bg-emerald-500/5', change: `+${waitingPurchase}%` },
        { label: '已通过', value: String(approvedCount), icon: CheckCircle, color: 'text-purple-600', bgColor: 'bg-purple-500/5', change: `+${approvedCount}%` },
        { label: '待签收', value: String(pendingCount), icon: Clock, color: 'text-amber-600', bgColor: 'bg-amber-500/5', change: `+${pendingCount}%` },
      ]);

      // 加载最近申请记录（动态数据）
      const recent = records.slice(0, 5).map(r => ({
        id: r.id,
        item: r.itemName,
        quantity: r.quantity,
        status: r.status,
        date: r.applicationDate,
        type: r.applicationType,
      }));
      setRecentApplications(recent);

      // 加载近一个月领用排行
      try {
        const today = new Date();
        const oneMonthAgo = subMonths(today, 1);
        
        // 设置日期范围显示
        setDateRange({
          start: format(oneMonthAgo, 'yyyy年M月d日'),
          end: format(today, 'yyyy年M月d日')
        });
        
        // 从Supabase获取近一个月的已批准日常领用记录
        const { data, error } = await supabase
          .from('requisitions')
          .select('purchase_name, purchase_quantity, created_at, status, requisition_type')
          .eq('status', 'approved')
          .eq('requisition_type', 'daily_request')
          .gte('created_at', oneMonthAgo.toISOString())
          .lte('created_at', today.toISOString());

        if (error) throw error;

        // 按物品名称分组统计数量
        const itemCounts: Record<string, number> = {};
        data?.forEach(record => {
          const itemName = record.purchase_name || '未知物品';
          const quantity = parseInt(record.purchase_quantity) || 1;
          itemCounts[itemName] = (itemCounts[itemName] || 0) + quantity;
        });

        // 转换为数组并排序，取前8名
        const ranking = Object.entries(itemCounts)
          .map(([name, count]) => ({
            name,
            count,
            category: '办公用品' // 默认分类，可以根据需要调整
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 8);

        setCollectionRanking(ranking);
      } catch (error: any) {
        console.error('加载领用排行失败:', error);
        
        // 检测认证错误，token失效时跳转到登录页
        if (error?.message?.includes('Invalid Refresh Token') || 
            error?.message?.includes('Refresh Token Not Found') ||
            error?.status === 401) {
          console.warn('认证已过期，正在跳转到登录页...');
          await supabase.auth.signOut();
          navigate('/login', { state: { from: '/' }, replace: true });
          return;
        }
        
        setCollectionRanking([]);
      }
    };

    loadStats();
    // 每30秒刷新一次数据
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground tracking-tight">工作台</h1>
          <p className="text-muted-foreground mt-1">欢迎回来，查看您的物资管理概况</p>
        </div>
        <div className="text-right px-5 py-3 rounded-xl bg-muted border border-border">
          <p className="text-xs text-muted-foreground">今天是</p>
          <p className="text-sm font-semibold text-foreground">2026年3月18日</p>
        </div>
      </div>

      {/* ── 近一个月领用排行 ── */}
      <Card className="p-6 border-border">
        {/* Card Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <BarChart2 className="w-4.5 h-4.5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">近一个月领用排行</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {dateRange.start ? `${dateRange.start} — ${dateRange.end}` : '加载中...'}
              </p>
            </div>
          </div>
          {/* Summary Pills */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted border border-border text-sm">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-muted-foreground">总领用</span>
              <span className="font-semibold text-foreground">{totalCount} 件</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/5 border border-primary/15 text-sm">
              <span className="text-muted-foreground">Top 1</span>
              <span className="font-semibold text-primary">{topItem.name}</span>
              <span className="text-muted-foreground">{topItem.count} 件</span>
            </div>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Bar Chart — pure CSS */}
          <div className="flex-1 flex flex-col gap-1.5 justify-center">
            {collectionRanking.length > 0 ? collectionRanking.map((item, i) => {
              const pct = Math.round((item.count / topItem.count) * 100);
              const isActive = hoveredIndex === null || hoveredIndex === i;
              return (
                <div
                  key={item.name}
                  className="flex items-center gap-3 cursor-default"
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <span className="w-16 text-xs font-medium text-foreground text-right truncate">{item.name}</span>
                  <div className="flex-1 h-5 bg-muted/50 rounded-md overflow-hidden">
                    <div
                      className="h-full rounded-md transition-all duration-300"
                      style={{
                        width: `${pct}%`,
                        background: BAR_COLORS[i % BAR_COLORS.length],
                        opacity: isActive ? 1 : 0.35,
                      }}
                    />
                  </div>
                  <span
                    className="text-[11px] font-semibold text-muted-foreground w-12 transition-opacity duration-200"
                    style={{ opacity: isActive ? 1 : 0.35 }}
                  >
                    {item.count} 件
                  </span>
                </div>
              );
            }) : (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                <div className="text-center">
                  <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">暂无近一个月领用数据</p>
                </div>
              </div>
            )}
          </div>

          {/* Rank List */}
          <div className="w-52 flex flex-col gap-2">
            {collectionRanking.length > 0 ? collectionRanking.slice(0, 6).map((item, i) => {
              const pct = Math.round((item.count / topItem.count) * 100);
              const isTop3 = i < 3;
              return (
                <div
                  key={item.name}
                  className="flex items-center gap-2.5 group cursor-default"
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  {/* Rank badge */}
                  <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[11px] font-bold flex-shrink-0 ${
                    i === 0 ? 'bg-amber-400/20 text-amber-600' :
                    i === 1 ? 'bg-slate-300/40 text-slate-600' :
                    i === 2 ? 'bg-orange-400/20 text-orange-600' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-foreground truncate">{item.name}</span>
                      <span className="text-xs text-muted-foreground ml-1">{item.count}</span>
                    </div>
                    <div className="h-1 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          background: BAR_COLORS[i % BAR_COLORS.length],
                          opacity: hoveredIndex === null || hoveredIndex === i ? 1 : 0.4
                        }}
                      />
                    </div>
                  </div>
                  {isTop3 && (
                    <span className={`flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded border font-medium ${CATEGORY_COLOR[item.category]}`}>
                      {item.category}
                    </span>
                  )}
                </div>
              );
            }) : (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                <div className="text-center">
                  <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">暂无排行数据</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="p-6 border-border hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <div className={`${stat.bgColor} p-3 rounded-xl`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div className="flex items-center gap-1 text-emerald-600 text-xs font-medium">
                  <TrendingUp className="w-3 h-3" />
                  <span>{stat.change}</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                <h3 className="text-3xl font-bold text-foreground">{stat.value}</h3>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card className="p-6 border-border lg:col-span-1">
          <h2 className="font-semibold text-foreground mb-5">快捷操作</h2>
          <div className="space-y-3">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Button
                  key={index}
                  variant="outline"
                  className="w-full justify-start h-auto py-4 hover:shadow-md transition-all duration-200 group border-border"
                  onClick={() => navigate(action.path)}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className={`${action.bgColor} p-2.5 rounded-lg`}>
                      <Icon className={`w-5 h-5 ${action.color}`} />
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-medium text-foreground">{action.label}</p>
                      <p className="text-xs text-muted-foreground">{action.subLabel}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </div>
                </Button>
              );
            })}
          </div>
        </Card>

        {/* Recent Applications */}
        <Card className="p-6 border-border lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-foreground">申请列表</h2>
            <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/5 -mr-2" onClick={() => navigate('/application-records')}>
              查看全部 →
            </Button>
          </div>
          <div className="space-y-3">
            {recentApplications.map((app) => (
              <div
                key={app.id}
                className="flex items-center justify-between p-4 rounded-xl border border-border hover:shadow-md hover:shadow-primary/5 transition-all duration-200 group"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-11 h-11 rounded-xl bg-primary/5 flex items-center justify-center border border-primary/10">
                    <Package className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{app.item}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">数量: {app.quantity}</span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">{app.date}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
                    app.status === 'pending'
                      ? 'bg-primary/5 text-primary border-primary/10'
                      : 'bg-amber-500/5 text-amber-600 border-amber-500/10'
                  }`}>
                    {app.status === 'pending' ? '日常领用' : '等待中'}
                  </span>
                  <Button size="sm" className="bg-primary hover:bg-primary/90" onClick={() => navigate('/application-records')}>
                    查看
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}