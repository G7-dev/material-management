import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Button, Dropdown, Typography } from 'antd'
import {
  DashboardOutlined,
  ShoppingOutlined,
  HistoryOutlined,
  UserOutlined,
  LogoutOutlined,
  AppstoreOutlined,
} from '@ant-design/icons'
import { signOut } from '../lib/auth'

const { Header, Sider, Content } = Layout
const { Title, Text } = Typography

/**
 * 现代化员工布局组件
 * 设计特点: 大尺寸、精致视觉、专业美感
 */
export default function EmployeeLayout() {
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (error) {
      console.error('退出登录失败:', error)
    }
  }

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: <span style={{ fontSize: 15 }}>退出登录</span>,
      onClick: handleLogout,
    },
  ]

  // 重构菜单结构
  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined style={{ fontSize: 18 }} />,
      label: <span style={{ fontSize: 15 }}>首页</span>,
    },
    {
      key: 'item-request',
      icon: <ShoppingOutlined style={{ fontSize: 18 }} />,
      label: <span style={{ fontSize: 15 }}>物品领用</span>,
      children: [
        {
          key: '/materials',
          label: <span style={{ fontSize: 14 }}>日常领用</span>,
        },
        {
          key: '/purchase-request',
          label: <span style={{ fontSize: 14 }}>物品申购</span>,
        },
      ],
    },
    {
      key: '/my-requisitions',
      icon: <HistoryOutlined style={{ fontSize: 18 }} />,
      label: <span style={{ fontSize: 15 }}>申请记录</span>,
    },
  ]

  return (
    <Layout style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* 侧边栏 */}
      <Sider
        width={280}
        breakpoint="lg"
        collapsedWidth="0"
        theme="light"
        style={{
          background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
          boxShadow: '2px 0 8px rgba(0, 0, 0, 0.05)',
          borderRight: '1px solid #e5e7eb',
          zIndex: 10,
        }}
      >
        {/* Logo 区域 */}
        <div style={{
          height: 80,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 24px',
          background: 'white',
          borderBottom: '1px solid #e5e7eb',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}>
            <div style={{
              width: 40,
              height: 40,
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <AppstoreOutlined style={{ fontSize: 22, color: 'white' }} />
            </div>
            <Title level={4} style={{ margin: 0, color: '#1f2937', fontSize: 20 }}>
              物资管理系统
            </Title>
          </div>
        </div>

        {/* 菜单区域 */}
        <div style={{ padding: '24px 16px' }}>
          <Menu
            theme="light"
            mode="inline"
            selectedKeys={[location.pathname]}
            openKeys={['item-request']}
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
      </Sider>

      {/* 主内容区 */}
      <Layout style={{ marginLeft: 0 }}>
        {/* 顶部导航栏 */}
        <Header style={{
          background: 'white',
          padding: '0 24px',
          height: 70,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 4px rgba(0, 0, 0, 0.05)',
          position: 'sticky',
          top: 0,
          zIndex: 9,
          marginLeft: 280,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Title level={3} style={{ margin: 0, color: '#1f2937', fontSize: 24 }}>
              物资领用管理系统
            </Title>
            <Text style={{ color: '#6b7280', fontSize: 14 }}>
              智能化物资管理平台
            </Text>
          </div>

          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Button
              type="text"
              icon={<UserOutlined style={{ fontSize: 18 }} />}
              style={{ height: 44, padding: '0 16px' }}
            >
              <span style={{ fontSize: 15, marginLeft: 8 }}>个人中心</span>
            </Button>
          </Dropdown>
        </Header>

        {/* 内容区域 */}
        <div style={{
          marginLeft: 280,
          padding: '24px',
          minHeight: 'calc(100vh - 70px)',
        }}>
          <Content style={{
            padding: '24px',
            minHeight: '100%',
            background: 'white',
            borderRadius: 8,
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          }}>
            <Outlet />
          </Content>
        </div>
      </Layout>
    </Layout>
  )
}
