import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Button, Typography, Badge, Tag } from 'antd'
import {
  DashboardOutlined,
  HistoryOutlined,
  UserOutlined,
  LogoutOutlined,
  AppstoreOutlined,
  PlusOutlined,
  ContainerOutlined,
  BellOutlined,
  BarChartOutlined,
} from '@ant-design/icons'
import { signOut } from '../lib/auth'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const { Header, Sider, Content } = Layout
const { Title, Text } = Typography

/**
 * 管理员布局 - 与员工端统一风格
 * 特点: 色彩丰富、图标突出、信息密度高、科技感
 */
export default function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [stats, setStats] = useState({ pendingCount: 0, lowStockCount: 0 })

  useEffect(() => {
    fetchStats()
  }, [])

  /**
   * 获取统计信息
   */
  async function fetchStats() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // 获取待审批数量
      const { count: pendingCount } = await supabase
        .from('requisitions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      // 获取库存预警数量
      const { count: lowStockCount } = await supabase
        .from('materials')
        .select('*', { count: 'exact', head: true })
        .lt('stock', 10)
        .eq('status', 'active')

      setStats({
        pendingCount: pendingCount || 0,
        lowStockCount: lowStockCount || 0
      })
    } catch (error) {
      console.error('获取统计信息失败:', error)
    }
  }

  const handleLogout = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (error) {
      console.error('退出登录失败:', error)
    }
  }

  // 色彩丰富的菜单结构 - 与员工端统一
  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined style={{ fontSize: 20, color: '#1890ff' }} />,
      label: <span style={{ fontSize: 15, fontWeight: 500 }}>首页</span>,
    },
    {
      key: 'inventory-manage',
      icon: <AppstoreOutlined style={{ fontSize: 20, color: '#fa8c16' }} />,
      label: <span style={{ fontSize: 15, fontWeight: 500 }}>库存管理</span>,
      children: [
        {
          key: '/admin/materials/add',
          icon: <PlusOutlined style={{ fontSize: 16, color: '#fa8c16' }} />,
          label: <span style={{ fontSize: 14 }}>物品上架</span>,
        },
        {
          key: '/admin/materials/restock',
          icon: <ContainerOutlined style={{ fontSize: 16, color: '#fa8c16' }} />,
          label: <span style={{ fontSize: 14 }}>物品补货</span>,
        },
      ],
    },
    {
      key: '/admin/approvals',
      icon: <HistoryOutlined style={{ fontSize: 20, color: '#722ed1' }} />,
      label: (
        <span style={{ fontSize: 15, fontWeight: 500, display: 'flex', alignItems: 'center' }}>
          审批管理
          {stats.pendingCount > 0 && (
            <Badge 
              count={stats.pendingCount} 
              style={{ 
                backgroundColor: '#ff4d4f', 
                marginLeft: 8,
                boxShadow: '0 0 0 2px #fff'
              }} 
            />
          )}
        </span>
      ),
    },
    {
      key: '/admin/users',
      icon: <UserOutlined style={{ fontSize: 20, color: '#eb2f96' }} />,
      label: <span style={{ fontSize: 15, fontWeight: 500 }}>用户管理</span>,
    },
  ]

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f7fa' }}>
      {/* 左侧边栏 - 与员工端统一风格 */}
      <Sider
        width={280}
        breakpoint="lg"
        collapsedWidth="0"
        theme="light"
        style={{
          background: 'linear-gradient(180deg, #ffffff 0%, #f0f7ff 100%)',
          boxShadow: '4px 0 20px rgba(24, 144, 255, 0.15)',
          borderRight: '1px solid #e6f7ff',
        }}
      >
        {/* Logo 区域 - 与员工端统一 */}
        <div style={{
          height: 80,
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          background: 'linear-gradient(135deg, #1890ff 0%, #722ed1 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.2)',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}>
            <div style={{
              width: 40,
              height: 40,
              background: 'rgba(255,255,255,0.2)',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(10px)',
            }}>
              <AppstoreOutlined style={{ fontSize: 22, color: 'white' }} />
            </div>
            <div>
              <Title level={4} style={{ margin: 0, color: 'white', fontSize: 18, fontWeight: 700 }}>
                物资管理系统
              </Title>
              <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)' }}>管理后台</Text>
            </div>
          </div>
        </div>

        {/* 管理员信息中心和统计 */}
        <div style={{ 
          padding: '16px 20px', 
          background: 'rgba(24, 144, 255, 0.05)',
          borderBottom: '1px solid #e6f7ff',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              background: 'linear-gradient(135deg, #1890ff, #722ed1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 10px rgba(24, 144, 255, 0.3)',
            }}>
              <UserOutlined style={{ fontSize: 18, color: 'white' }} />
            </div>
            <div style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, color: '#262626', display: 'block', fontWeight: 600 }}>
                系统管理员
              </Text>
              <Tag color="gold" style={{ fontSize: 11, marginTop: 4 }}>超级管理员</Tag>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, paddingTop: 8, borderTop: '1px solid #e8e8e8' }}>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <Text strong style={{ color: '#faad14', fontSize: 16 }}>{stats.pendingCount}</Text>
              <div style={{ fontSize: 11, color: '#8c8c8c' }}>待审批</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <Text strong style={{ color: '#ff4d4f', fontSize: 16 }}>{stats.lowStockCount}</Text>
              <div style={{ fontSize: 11, color: '#8c8c8c' }}>库存预警</div>
            </div>
          </div>
        </div>

        {/* 快捷功能 */}
        <div style={{ padding: '12px 16px', background: '#fafafa', borderBottom: '1px solid #e8e8e8' }}>
          <Text strong style={{ fontSize: 12, color: '#595959', display: 'block', marginBottom: 8 }}>快捷操作</Text>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button 
              type="primary" 
              size="small" 
              icon={<PlusOutlined />}
              onClick={() => navigate('/admin/materials/add')}
              style={{ flex: 1, fontSize: 11 }}
            >
              上架物品
            </Button>
            <Button 
              icon={<HistoryOutlined />}
              size="small"
              onClick={() => navigate('/admin/approvals')}
              style={{ flex: 1, fontSize: 11 }}
            >
              审批
            </Button>
          </div>
        </div>

        {/* 菜单区域 */}
        <div style={{ padding: '12px 0', flex: 1, overflow: 'auto' }}>
          <Menu
            theme="light"
            mode="inline"
            selectedKeys={[location.pathname]}
            openKeys={['inventory-manage']}
            items={menuItems}
            onClick={({ key }) => {
              if (key && !key.startsWith('http')) {
                navigate(key)
              }
            }}
            style={{
              border: 'none',
              background: 'transparent',
            }}
          />
        </div>

        {/* 底部信息 */}
        <div style={{ 
          position: 'absolute', 
          bottom: 0, 
          left: 0, 
          right: 0, 
          padding: '16px 20px', 
          background: 'linear-gradient(180deg, transparent 0%, rgba(24,144,255,0.05) 100%)',
          borderTop: '1px solid #e6f7ff',
        }}>
          <Button
            type="text"
            icon={<LogoutOutlined style={{ fontSize: 16, color: '#ff4d4f' }} />}
            onClick={handleLogout}
            style={{ 
              width: '100%', 
              justifyContent: 'flex-start', 
              height: 44,
              fontSize: 14,
              fontWeight: 500,
              color: '#ff4d4f',
            }}
          >
            <span style={{ marginLeft: 8 }}>退出登录</span>
          </Button>
        </div>
      </Sider>

      {/* 主内容区 */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* 顶部导航栏 */}
        <Header style={{
          background: '#ffffff',
          padding: '0 24px',
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          borderBottom: '1px solid #e8e8e8',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {location.pathname === '/dashboard' && <DashboardOutlined style={{ fontSize: 20, color: '#1890ff' }} />}
              {location.pathname === '/admin' && <BarChartOutlined style={{ fontSize: 20, color: '#722ed1' }} />}
              {location.pathname === '/admin/approvals' && <HistoryOutlined style={{ fontSize: 20, color: '#faad14' }} />}
              {location.pathname.startsWith('/admin/materials') && <AppstoreOutlined style={{ fontSize: 20, color: '#fa8c16' }} />}
              {location.pathname === '/admin/users' && <UserOutlined style={{ fontSize: 20, color: '#eb2f96' }} />}
              
              <Title level={4} style={{ margin: 0, color: '#262626', fontSize: 18, fontWeight: 600 }}>
                {location.pathname === '/dashboard' && '工作台'}
                {location.pathname === '/admin' && '管理控制台'}
                {location.pathname === '/admin/approvals' && '审批管理'}
                {location.pathname.startsWith('/admin/materials') && '库存管理'}
                {location.pathname === '/admin/users' && '用户管理'}
              </Title>
            </div>
            <Tag color="purple" style={{ fontSize: 11 }}>管理员视图</Tag>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Badge count={stats.pendingCount} size="small">
              <Button 
                type="text" 
                icon={<BellOutlined style={{ fontSize: 18, color: '#faad14' }} />}
                onClick={() => navigate('/admin/approvals')}
                style={{ width: 40, height: 40 }}
              />
            </Badge>
            
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              background: 'linear-gradient(135deg, #eb2f96, #722ed1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(235, 47, 150, 0.3)',
            }}>
              <UserOutlined style={{ fontSize: 16, color: 'white' }} />
            </div>
          </div>
        </Header>

        {/* 内容区域 */}
        <Content style={{
          flex: 1,
          overflow: 'auto',
          padding: '0',
          background: '#f5f7fa',
        }}>
          <Outlet />
        </Content>
      </div>
    </Layout>
  )
}
