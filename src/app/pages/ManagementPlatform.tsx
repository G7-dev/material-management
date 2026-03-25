import { useState, useEffect } from 'react';
import {
  Settings, FileCheck, TrendingUp, Package,
  BarChart2, ArrowRight, Bell, AlertTriangle, TrendingDown
} from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { fetchMaterials, getMaterialStockStatus, SEVERITY_CONFIG } from '../utils/materialsDB';
import { useNavigate } from 'react-router';
import { format, subMonths } from 'date-fns';
import { supabase } from '../../lib/supabase';

const quickActions = [
  { label: '物品管理', subLabel: '管理库存物品', icon: Package, path: '/item-upload' },
  { label: '等待管理', subLabel: '处理待审批申请', icon: FileCheck, path: '/approval-management' },
];



const BAR_COLORS = [
  '#6366f1', '#7c3aed', '#8b5cf6', '#a78bfa',
  '#818cf8', '#93c5fd', '#60a5fa', '#38bdf8',
];

const CATEGORY_COLOR: Record<string, string> = {
  '办公用品': 'bg-primary/10 text-primary border-primary/20',
  '电子设备': 'bg-purple-500/10 text-purple-600 border-purple-500/20',
};

export function ManagementPlatform() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const navigate = useNavigate();
  const [collectionRanking, setCollectionRanking] = useState<Array<{ name: string; count: number; category: string }>>([]);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  
  const totalCount = collectionRanking.reduce((s, i) => s + i.count, 0);
  const topItem = collectionRanking[0] || { name: '-', count: 0 };

  // 加载近一个月领用排行
  useEffect(() => {
    const loadCollectionRanking = async () => {
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
          navigate('/login', { state: { from: '/management' }, replace: true });
          return;
        }
        
        setCollectionRanking([]);
      }
    };

    loadCollectionRanking();
    // 每30秒刷新一次数据
    const interval = setInterval(loadCollectionRanking, 30000);
    return () => clearInterval(interval);
  }, [navigate]);

  // Low stock summary
  const alertItems = inventoryItems.map(item => ({
    ...item,
    severity: getSeverity(item.stock, item.threshold),
  })).filter(i => i.severity !== 'normal');
  const emptyCnt    = alertItems.filter(i => i.severity === 'empty').length;
  const criticalCnt = alertItems.filter(i => i.severity === 'critical').length;
  const warningCnt  = alertItems.filter(i => i.severity === 'warning').length;

  // Severity pills — plain array, no `as const`, icons rendered inline
  const severityPills = [
    { label: '缺货', count: emptyCnt,    colorCls: 'bg-red-500/10 text-red-600 border-red-500/20' },
    { label: '危险', count: criticalCnt, colorCls: 'bg-orange-500/10 text-orange-600 border-orange-500/20' },
    { label: '预警', count: warningCnt,  colorCls: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  ];

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground flex items-center gap-2">
            <Settings className="w-8 h-8 text-primary" />
            管理平台
          </h1>
          <p className="text-muted-foreground mt-1">系统管理员控制台</p>
        </div>
      </div>

      {/* ── 低库存预警摘要 ── */}
      {alertItems.length > 0 && (
        <Card className="p-5 border-amber-500/20 bg-amber-500/3">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center border border-amber-500/20">
                <Bell className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">低库存预警</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  共 <span className="font-semibold text-amber-600">{alertItems.length}</span> 件物品需要关注
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 h-8 border-amber-500/30 text-amber-700 hover:bg-amber-500/10 text-xs"
              onClick={() => navigate('/low-stock-alert')}
            >
              查看全部
              <ArrowRight className="w-3 h-3" />
            </Button>
          </div>

          {/* Severity pills */}
          <div className="flex flex-wrap gap-2 mb-4">
            {severityPills.map(pill => {
              if (pill.count === 0) return null;
              return (
                <div key={pill.label} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium ${pill.colorCls}`}>
                  {pill.label === '缺货' && <TrendingDown className="w-3.5 h-3.5" />}
                  {pill.label === '危险' && <AlertTriangle className="w-3.5 h-3.5" />}
                  {pill.label === '预警' && <Bell className="w-3.5 h-3.5" />}
                  {pill.label} {pill.count} 件
                </div>
              );
            })}
          </div>

          {/* Top 3 alert items */}
          <div className="space-y-2">
            {alertItems.slice(0, 3).map(item => {
              const cfg = SEVERITY_CONFIG[item.severity];
              const pct = Math.min(100, Math.round((item.stock / item.threshold) * 100));
              return (
                <div key={item.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white border border-border">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.bg} border ${cfg.border}`}>
                    <Package className={`w-3.5 h-3.5 ${cfg.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-foreground">{item.name}</span>
                      <span className={`text-xs font-semibold ${cfg.color}`}>{item.stock} / {item.threshold} {item.unit}</span>
                    </div>
                    <div className="h-1 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, background: cfg.bar }}
                      />
                    </div>
                  </div>
                  <span className={`flex-shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-md border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                    {cfg.label}
                  </span>
                </div>
              );
            })}
            {alertItems.length > 3 && (
              <button
                onClick={() => navigate('/low-stock-alert')}
                className="w-full text-xs text-muted-foreground hover:text-primary text-center py-1 transition-colors"
              >
                还有 {alertItems.length - 3} 件 →
              </button>
            )}
          </div>
        </Card>
      )}

      {/* ── 近一个月领用排行 ── */}
      <Card className="p-6 border-border">
        {/* Card Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <BarChart2 className="w-4 h-4 text-primary" />
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
            {collectionRanking.map((item, i) => {
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
            })}
          </div>

          {/* Rank List */}
          <div className="w-52 flex flex-col gap-2 justify-center">
            {collectionRanking.slice(0, 6).map((item, i) => {
              const pct = Math.round((item.count / topItem.count) * 100);
              return (
                <div
                  key={item.name}
                  className="flex items-center gap-2.5 cursor-default"
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
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
                          opacity: hoveredIndex === null || hoveredIndex === i ? 1 : 0.35,
                        }}
                      />
                    </div>
                  </div>
                  {i < 3 && (
                    <span className={`flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded border font-medium ${CATEGORY_COLOR[item.category]}`}>
                      {item.category}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card className="p-6 border-border lg:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Settings className="w-4 h-4 text-primary" />
            </div>
            <h2 className="font-semibold text-foreground">快捷操作</h2>
          </div>
          <div className="space-y-3">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Button
                  key={index}
                  variant="outline"
                  className="w-full justify-start h-auto py-4 border-border hover:bg-accent group transition-all"
                  onClick={() => navigate(action.path)}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="bg-primary/10 p-2 rounded-lg">
                      <Icon className="w-4 h-4 text-primary" />
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

        {/* Approval Stats */}
        <Card className="p-6 border-border lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
                <FileCheck className="w-4 h-4 text-secondary" />
              </div>
              <h2 className="font-semibold text-foreground">审批管理</h2>
            </div>
          </div>
          <div className="space-y-4">
            <div className="p-4 rounded-lg border border-border bg-muted/30 text-center">
              <p className="text-sm text-muted-foreground">暂无待审批项目</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}