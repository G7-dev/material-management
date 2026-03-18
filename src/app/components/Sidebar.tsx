import { Link, useLocation } from 'react-router';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  FileText, 
  Settings,
  PackagePlus,
  PackageCheck,
  CheckSquare,
  LogOut,
  Bell,
} from 'lucide-react';
import { cn } from './ui/utils';

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}
import { inventoryItems, getSeverity } from '../data/inventoryData';
import { useState, useEffect } from 'react';
import { getApplicationRecords } from '../utils/applicationStore';
import { supabase } from '../../lib/supabase';

// Compute live low-stock count from shared data
const lowStockCount = inventoryItems.filter(
  item => getSeverity(item.stock, item.threshold) !== 'normal'
).length;

const userNavItems: NavItem[] = [
  { name: '工作台', path: '/', icon: LayoutDashboard },
  { name: '日常领用', path: '/daily-collection', icon: Package },
  { name: '物品申购', path: '/item-purchase', icon: ShoppingCart },
  { name: '申请记录', path: '/application-records', icon: FileText },
];

const adminNavItems: NavItem[] = [
  { name: '管理平台', path: '/management', icon: Settings },
  { name: '物品上架', path: '/item-upload', icon: PackagePlus },
  { name: '物品补货', path: '/item-permission', icon: PackageCheck },
  { name: '低库存预警', path: '/low-stock-alert', icon: Bell, badge: lowStockCount },
  { name: '审批管理', path: '/approval-management', icon: CheckSquare },
];

export function Sidebar() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/management') || 
                  location.pathname.includes('upload') || 
                  location.pathname.includes('permission') ||
                  location.pathname.includes('low-stock') ||
                  location.pathname.includes('approval');

  // Dynamic pending approval count
  const [pendingCount, setPendingCount] = useState(0);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const update = () => {
      const records = getApplicationRecords();
      setPendingCount(records.filter(r => r.status === 'pending').length);
    };
    update();
    const interval = setInterval(update, 2000);
    return () => clearInterval(interval);
  }, []);

  // Get user role
  useEffect(() => {
    const getUserRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
          setUserRole(profile?.role || null);
        }
      } catch (error) {
        console.error('Failed to get user role:', error);
      }
    };

    getUserRole();
  }, []);

  const adminNavItemsDynamic: NavItem[] = [
    { name: '管理平台', path: '/management', icon: Settings },
    { name: '物品上架', path: '/item-upload', icon: PackagePlus },
    { name: '物品补货', path: '/item-permission', icon: PackageCheck },
    { name: '低库存预警', path: '/low-stock-alert', icon: Bell, badge: lowStockCount },
    { name: '审批管理', path: '/approval-management', icon: CheckSquare, badge: pendingCount },
  ];

  const navItems = isAdmin ? adminNavItemsDynamic : userNavItems;

  return (
    <aside className="w-64 bg-white border-r border-border h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
            <Package className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-foreground">物资管理系统</h1>
            <p className="text-xs text-muted-foreground">Material System</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center border border-border">
            <span className="text-sm font-semibold text-foreground">管</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {isAdmin ? '系统管理员' : '当前用户'}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-xs text-muted-foreground">在线</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <div className="mb-2 px-3">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {isAdmin ? '管理功能' : '物资操作'}
          </h3>
        </div>
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            const isAlert = item.path === '/low-stock-alert';
            
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group',
                    isActive 
                      ? 'bg-primary text-white shadow-sm' 
                      : isAlert && !isActive
                        ? 'text-amber-700 hover:text-amber-800 hover:bg-amber-500/8'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium flex-1">{item.name}</span>
                  {typeof item.badge === 'number' && item.badge > 0 && (
                    <span className={cn(
                      'min-w-[18px] h-[18px] px-1 rounded-full text-[11px] font-semibold flex items-center justify-center leading-none',
                      isActive
                        ? 'bg-white text-primary'
                        : isAlert
                          ? 'bg-amber-500 text-white'
                          : 'bg-red-500 text-white'
                    )}>
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Switch view */}
        {!isAdmin && userRole === 'admin' && (
          <div className="mt-6 pt-4 border-t border-border">
            <Link
              to="/management"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200"
            >
              <Settings className="w-4 h-4" />
              <span className="text-sm font-medium">切换到管理</span>
            </Link>
          </div>
        )}
        {isAdmin && (
          <div className="mt-6 pt-4 border-t border-border">
            <Link
              to="/"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="text-sm font-medium">切换到用户</span>
            </Link>
          </div>
        )}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-border">
        <Link
          to="/login"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all duration-200 group"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm font-medium">退出登录</span>
        </Link>
      </div>
    </aside>
  );
}