import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, FileCheck, CheckCircle, Clock, TrendingUp, Package, Calendar, ArrowRight, BarChart2 } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
// import { supabase } from '../lib/supabase';
import { isAdmin } from '../lib/auth';

const stats = [
  { label: '当前领用', value: '1', icon: ShoppingBag, color: 'text-indigo-500', bgColor: 'bg-indigo-500/5', change: '+12%' },
  { label: '等待申购', value: '0', icon: FileCheck, color: 'text-emerald-600', bgColor: 'bg-emerald-500/5', change: '+0%' },
  { label: '已通过', value: '0', icon: CheckCircle, color: 'text-purple-600', bgColor: 'bg-purple-500/5', change: '+0%' },
  { label: '待签收', value: '0', icon: Clock, color: 'text-amber-600', bgColor: 'bg-amber-500/5', change: '+0%' },
];

const quickActions = [
  { label: '快捷领用', subLabel: '查看库存', icon: Package, color: 'text-indigo-500', bgColor: 'bg-indigo-500/5', path: '/materials' },
  { label: '提交申请', subLabel: '新建申请单', icon: FileCheck, color: 'text-gray-700', bgColor: 'bg-gray-200/50', path: '/purchase-request' },
  { label: '查看记录', subLabel: '历史记录', icon: Calendar, color: 'text-cyan-600', bgColor: 'bg-cyan-500/5', path: '/my-requisitions' },
];

const recentApplications = [
  { id: 1, item: '订书机', quantity: 1, status: 'pending', date: '2026/3/17', type: '日常领用' },
  { id: 2, item: '生成申购单', quantity: 1, status: 'waiting', date: '2026/3/18', type: '物品申购' },
];

const collectionRanking = [
  { name: 'A4打印纸', count: 87, category: '办公用品' },
  { name: '中性笔',   count: 74, category: '办公用品' },
  { name: 'U盘',      count: 52, category: '电子设备' },
  { name: '订书机',   count: 41, category: '办公用品' },
  { name: '文件夹',   count: 38, category: '办公用品' },
  { name: '剪刀',     count: 29, category: '办公用品' },
  { name: '固体胶',   count: 24, category: '办公用品' },
  { name: '计算器',   count: 18, category: '电子设备' },
];

const BAR_COLORS = [
  '#6366f1', '#7c3aed', '#8b5cf6', '#a78bfa',
  '#818cf8', '#93c5fd', '#60a5fa', '#38bdf8',
];

const CATEGORY_COLOR: Record<string, string> = {
  '办公用品': 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
  '电子设备': 'bg-purple-500/10 text-purple-600 border-purple-500/20',
};

export default function Dashboard() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const navigate =useNavigate();
  const [isAdminUser, setIsAdminUser] = useState(false);
  
  const totalCount = collectionRanking.reduce((s, i) => s + i.count, 0);
  const topItem = collectionRanking[0];

  useEffect(() => {
    checkAdmin();
  }, []);

  async function checkAdmin() {
    const admin = await isAdmin();
    setIsAdminUser(admin);
  }

  return (
    <div className="p-8 space-y-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">
            {isAdminUser ? '管理控制台' : '我的工作台'}
          </h1>
          <p className="text-gray-500 mt-1">
            {isAdminUser ? '监控系统运行状态，管理物资和审批' : '快速申领物资，查看申请状态'}
          </p>
        </div>
        <div className="text-right px-5 py-3 rounded-xl bg-gray-100 border border-gray-200">
          <p className="text-xs text-gray-500">今天是</p>
          <p className="text-sm font-semibold text-gray-900">
            {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* ── 近一个月领用排行 ── */}
      <Card className="p-6 border border-gray-200 bg-white">
        {/* Card Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
              <BarChart2 className="w-4.5 h-4.5 text-indigo-500" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">近一个月领用排行</h2>
              <p className="text-xs text-gray-500 mt-0.5">2026年2月18日 — 2026年3月18日</p>
            </div>
          </div>
          {/* Summary Pills */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 border border-gray-200 text-sm">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-gray-500">总领用</span>
              <span className="font-semibold text-gray-900">{totalCount} 件</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-500/5 border border-indigo-500/15 text-sm">
              <span className="text-gray-500">Top 1</span>
              <span className="font-semibold text-indigo-500">{topItem.name}</span>
              <span className="text-gray-500">{topItem.count} 件</span>
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
                  <span className="w-16 text-xs font-medium text-gray-900 text-right truncate">{item.name}</span>
                  <div className="flex-1 h-5 bg-gray-100 rounded-md overflow-hidden">
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
                    className="text-[11px] font-semibold text-gray-500 w-12 transition-opacity duration-200"
                    style={{ opacity: isActive ? 1 : 0.35 }}
                  >
                    {item.count} 件
                  </span>
                </div>
              );
            })}
          </div>

          {/* Rank List */}
          <div className="w-52 flex flex-col gap-2">
            {collectionRanking.slice(0, 6).map((item, i) => {
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
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-900 truncate">{item.name}</span>
                      <span className="text-xs text-gray-500 ml-1">{item.count}</span>
                    </div>
                    <div className="h-1 rounded-full bg-gray-100 overflow-hidden">
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
            })}
          </div>
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="p-6 border border-gray-200 bg-white hover:shadow-lg transition-all duration-300">
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
                <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
                <h3 className="text-3xl font-bold text-gray-900">{stat.value}</h3>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card className="p-6 border border-gray-200 bg-white lg:col-span-1">
          <h2 className="font-semibold text-gray-900 mb-5">快捷操作</h2>
          <div className="space-y-3">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Button
                  key={index}
                  variant="outline"
                  className="w-full justify-start h-auto py-4 hover:shadow-md transition-all duration-200 group border-gray-300"
                  onClick={() => navigate(action.path)}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className={`${action.bgColor} p-2.5 rounded-lg`}>
                      <Icon className={`w-5 h-5 ${action.color}`} />
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-medium text-gray-900">{action.label}</p>
                      <p className="text-xs text-gray-500">{action.subLabel}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-500 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Button>
              );
            })}
          </div>
        </Card>

        {/* Recent Applications */}
        <Card className="p-6 border border-gray-200 bg-white lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-900">申请列表</h2>
            <Button variant="ghost" className="text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 -mr-2" onClick={() => navigate('/my-requisitions')}>
              查看全部 →
            </Button>
          </div>
          <div className="space-y-3">
            {recentApplications.map((app) => (
              <div
                key={app.id}
                className="flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:shadow-md transition-all duration-200 group"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-11 h-11 rounded-xl bg-indigo-500/5 flex items-center justify-center border border-indigo-500/10">
                    <Package className="w-5 h-5 text-indigo-500" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{app.item}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">数量: {app.quantity}</span>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-xs text-gray-500">{app.date}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
                    app.status === 'pending'
                      ? 'bg-indigo-500/5 text-indigo-500 border-indigo-500/10'
                      : 'bg-amber-500/5 text-amber-600 border-amber-500/10'
                  }`}>
                    {app.status === 'pending' ? '日常领用' : '等待中'}
                  </span>
                  <Button size="sm" className="bg-indigo-500 hover:bg-indigo-600" onClick={() => navigate('/my-requisitions')}>
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
