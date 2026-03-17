import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Button, Dropdown, Typography, Divider } from 'antd'
import {
  DashboardOutlined,
  ShoppingOutlined,
  HistoryOutlined,
  UserOutlined,
  LogoutOutlined,
  AppstoreOutlined,
  PlusOutlined,
  FileAddOutlined,
  ContainerOutlined,
} from '@ant-design/icons'
import { signOut } from '../lib/auth'

const { Header, Sider, Content } = Layout
const { Title, Text } = Typography

/**
 * 互联网大厂风格的员工布局组件
 * 设计特点: 紧凑、图标突出、色彩鲜明、减少空白
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
      icon: <LogoutOutlined style={{ fontSize: 16 }} />,
      label: <span style={{ fontSize: 14 }}>退出登录</span>,
      onClick: handleLogout,
    },
  ]

  // 紧凑的菜单结构,减少空白
  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined style={{ fontSize: 20 }} />,
      label: <span style={{ fontSize: 15, fontWeight: 500 }}>首页</span>,
    },
    {
      key: 'item-request',
      icon: <ShoppingOutlined style={{ fontSize: 20 }} />,
      label: <span style={{ fontSize: 15, fontWeight: 500 }}>物品领用</span>,
      children: [
        {
          key: '/materials',
          icon: <ContainerOutlined style={{ fontSize: 16 }} />,
          label: <span style={{ fontSize: 14 }}>日常领用</span>,
        },
        {
          key: '/purchase-request',
          icon: <PlusOutlined style={{ fontSize: 16 }} />,
          label: <span style={{ fontSize: 14 }}>物品申购</span>,
        },
      ],
    },
    {
      key: '/my-requisitions',
      icon: <HistoryOutlined style={{ fontSize: 20 }} />,
      label: <span style={{ fontSize: 15, fontWeight: 500 }}>申请记录</span>,
    },
  ]

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      {/* 左侧边栏 - 大厂风格,紧凑布局 */}
      <Sider
        width={256}
        breakpoint="lg"
        collapsedWidth="0"
        theme="light"
        style={{
          background: '#ffffff',
          boxShadow: '2px 0 6px rgba(0, 0, 0, 0.05)',
          borderRight: '1px solid #e8e8e8',
          zIndex: 10,
        }}
      >
        {/* Logo 区域 - 更紧凑 */}
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          background: '#ffffff',
          borderBottom: '1px solid #e8e8e8',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <div style={{
              width: 32,
              height: 32,
              background: 'linear-gradient(135deg, #1890ff, #096dd9)',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <AppstoreOutlined style={{ fontSize: 18, color: 'white' }} />
            </div>
            <Title level={5} style={{ margin: 0, color: '#1890ff', fontSize: 16, fontWeight: 600 }}>
              物资管理系统
            </Title>
          </div>
        </div>

        {/* 用户简要信息 - 更紧凑 */}
        <div style={{ padding: '12px 16px', background: '#fafafa', borderBottom: '1px solid #e8e8e8' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              background: '#e6f7ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <UserOutlined style={{ fontSize: 16, color: '#1890ff' }} />
            </div>
            <div style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, color: '#262626', display: 'block', fontWeight: 500 }}>
                当前用户
              </Text>
              <Text style={{ fontSize: 12, color: '#8c8c8c' }}>员工</Text>
            </div>
          </div>
        </div>

        {/* 菜单区域 - 更紧凑,减少空白 */}
        <div style={{ padding: '8px 0' }}>
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

        {/* 底部信息 - 更紧凑 */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 16px', background: '#fafafa', borderTop: '1px solid #e8e8e8' }}>
          <Button
            type="text"
            icon={<LogoutOutlined style={{ fontSize: 16 }} />}
            onClick={handleLogout}
            style={{ width: '100%', justifyContent: 'flex-start', height: 40, fontSize: 14 }}
          >
            <span style={{ marginLeft: 8 }}>退出登录</span>
          </Button>
        </div>
      </Sider>

      {/* 主内容区 - 紧凑布局 */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* 顶部导航栏 - 更紧凑 */}
        <Header style={{
          background: '#ffffff',
          padding: '0 20px',
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
          borderBottom: '1px solid #e8e8e8',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Title level={4} style={{ margin: 0, color: '#262626', fontSize: 16, fontWeight: 600 }}>
              {location.pathname === '/dashboard' && '首页'}
              {location.pathname === '/materials' && '日常领用'}
              {location.pathname === '/purchase-request' && '物品申购'}
              {location.pathname === '/my-requisitions' && '申请记录'}
            </Title>
            <Text style={{ fontSize: 12, color: '#8c8c8c' }}>
              物资管理系统
            </Text>
          </div>
        </Header>

        {/* 内容区域 - 紧贴顶部 */}
        <Content style={{
          flex: 1,
          overflow: 'auto',
          padding: '0',
          background: '#f0f2f5',
        }}>
          <Outlet />
        </Content>
      </div>
    </Layout>
  )
}
