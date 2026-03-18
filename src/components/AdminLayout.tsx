import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { Layout, Menu, message, Row, Col } from 'antd';
import {
  DashboardOutlined,
  CheckCircleOutlined,
  InboxOutlined,
  UserOutlined,
  FileTextOutlined,
  LogoutOutlined,
  AlertOutlined,
  ClockCircleOutlined,
  BellOutlined
} from '@ant-design/icons';
import { supabase } from '../lib/supabase';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

const { Sider, Content } = Layout;

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [stats, setStats] = useState({
    pendingApprovals: 0,
    lowStockCount: 0
  });
  const [collapsed, _setCollapsed] = useState(false);

  useEffect(() => {
    fetchAdminStats();
  }, [location.pathname]);

  async function fetchAdminStats() {
    try {
      const { count: pendingApprovals } = await supabase
        .from('requisitions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      const { data: lowStock } = await supabase
        .from('materials')
        .select('*')
        .eq('status', 'active')
        .lt('stock', 10);

      setStats({
        pendingApprovals: pendingApprovals || 0,
        lowStockCount: lowStock?.length || 0
      });
    } catch (error) {
      console.error('获取统计信息失败:', error);
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    message.success('已退出登录');
    navigate('/login');
  };

  const menuItems = [
    {
      key: '/admin',
      icon: <DashboardOutlined className="text-lg" />,
      label: <Link to="/admin">管理控制台</Link>,
    },
    {
      key: '/admin/approvals',
      icon: <CheckCircleOutlined className="text-lg" />,
      label: (
        <Link to="/admin/approvals" className="flex items-center justify-between">
          <span>审批管理</span>
          {stats.pendingApprovals > 0 && (
            <Badge className="ml-auto bg-red-500 text-white">
              {stats.pendingApprovals}
            </Badge>
          )}
        </Link>
      ),
    },
    {
      key: '/admin/materials',
      icon: <InboxOutlined className="text-lg" />,
      label: (
        <Link to="/admin/materials" className="flex items-center justify-between">
          <span>物资管理</span>
          {stats.lowStockCount > 0 && (
            <Badge className="ml-auto bg-amber-500 text-white">
              {stats.lowStockCount}
            </Badge>
          )}
        </Link>
      ),
    },
    {
      key: '/admin/users',
      icon: <UserOutlined className="text-lg" />,
      label: <Link to="/admin/users">用户管理</Link>,
    },
    {
      key: '/admin/my-requisitions',
      icon: <FileTextOutlined className="text-lg" />,
      label: <Link to="/admin/my-requisitions">申请记录</Link>,
    },
  ];

  return (
    <Layout className="min-h-screen">
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed} 
        theme="light" 
        width={260}
        className="shadow-lg"
      >
        <div className="h-16 flex items-center justify-center border-b border-gray-100 bg-gradient-to-r from-indigo-600 to-purple-600">
          <div className="text-white font-bold text-lg flex items-center gap-2">
            <BellOutlined />
            <span className={collapsed ? 'hidden' : ''}>物资管理系统</span>
          </div>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          style={{ height: 'calc(100vh - 160px)', borderRight: 0 }}
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
        <div className="m-6">
          <Row gutter={[16, 16]} className="mb-6">
            <Col span={6}>
              <Card className="p-4 border-gray-200 bg-white">
                <div className="flex items-center justify-between">
                  <div className="bg-amber-500/10 p-2 rounded-lg">
                    <ClockCircleOutlined className="text-amber-600 text-xl" />
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">待审批</div>
                    <div className="text-2xl font-bold text-gray-900">{stats.pendingApprovals}</div>
                  </div>
                </div>
              </Card>
            </Col>
            <Col span={6}>
              <Card className="p-4 border-gray-200 bg-white">
                <div className="flex items-center justify-between">
                  <div className="bg-amber-500/10 p-2 rounded-lg">
                    <AlertOutlined className="text-amber-600 text-xl" />
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">库存预警</div>
                    <div className="text-2xl font-bold text-gray-900">{stats.lowStockCount}</div>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </div>
        <Content className="m-6 p-6 bg-gray-50 rounded-xl">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
