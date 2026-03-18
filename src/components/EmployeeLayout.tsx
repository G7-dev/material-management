import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { Layout, Menu, message } from 'antd';
import {
  DashboardOutlined,
  ShoppingCartOutlined,
  PlusOutlined,
  FileTextOutlined,
  LogoutOutlined,
  UserOutlined,
  BellOutlined
} from '@ant-design/icons';
import { supabase } from '../lib/supabase';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';

const { Sider, Content } = Layout;

export default function EmployeeLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [pendingCount, setPendingCount] = useState(0);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    fetchPendingCount();
  }, [location.pathname]);

  async function fetchPendingCount() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { count } = await supabase
        .from('requisitions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'pending');

      setPendingCount(count || 0);
    } catch (error) {
      console.error('获取待审批数量失败:', error);
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    message.success('已退出登录');
    navigate('/login');
  };

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined className="text-lg" />,
      label: <Link to="/">工作台</Link>,
    },
    {
      key: '/materials',
      icon: <ShoppingCartOutlined className="text-lg" />,
      label: <Link to="/materials">物资申领</Link>,
    },
    {
      key: '/purchase-request',
      icon: <PlusOutlined className="text-lg" />,
      label: <Link to="/purchase-request">物品申购</Link>,
    },
    {
      key: '/my-requisitions',
      icon: <FileTextOutlined className="text-lg" />,
      label: (
        <Link to="/my-requisitions" className="flex items-center justify-between">
          <span>申请记录</span>
          {pendingCount > 0 && (
            <Badge className="ml-auto bg-red-500 text-white">
              {pendingCount}
            </Badge>
          )}
        </Link>
      ),
    },
  ];

  return (
    <Layout className="min-h-screen">
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed} 
        theme="light" 
        width={240}
        className="shadow-lg"
      >
        <div className="h-16 flex items-center justify-center border-b border-gray-100 bg-gradient-to-r from-indigo-500 to-purple-500">
          <div className="text-white font-bold text-lg flex items-center gap-2">
            <BellOutlined />
            <span className={collapsed ? 'hidden' : ''}>物资管理系统</span>
          </div>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          style={{ height: 'calc(100vh - 112px)', borderRight: 0 }}
          className="pt-2"
        />
        <div className="p-4 border-t border-gray-200 bg-white">
          <Button
            variant="ghost"
            className="w-full flex items-center justify-center gap-2 text-gray-700 hover:text-red-500 hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogoutOutlined className="text-lg" />
            <span className={collapsed ? 'hidden' : ''}>退出登录</span>
          </Button>
        </div>
      </Sider>
      <Layout>
        <Content className="m-6 p-6 bg-gray-50 rounded-xl">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
