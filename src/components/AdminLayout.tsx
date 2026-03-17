import { Layout, Menu, Button, Dropdown } from 'antd'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  CheckSquareOutlined,
  InboxOutlined,
  UserOutlined,
  LogoutOutlined
} from '@ant-design/icons'
import { signOut } from '../lib/auth'

const { Header, Sider, Content } = Layout

/**
 * 管理员布局组件
 */
export default function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()

  /**
   * 退出登录
   */
  const handleLogout = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (error) {
      console.error('退出登录失败:', error)
    }
  }

  /**
   * 用户菜单
   */
  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout
    }
  ]

  /**
   * 侧边栏菜单项
   */
  const menuItems = [
    {
      key: '/admin/approvals',
      icon: <CheckSquareOutlined />,
      label: '审批管理'
    },
    {
      key: '/admin/materials',
      icon: <InboxOutlined />,
      label: '物资管理'
    },
    {
      key: '/admin/users',
      icon: <UserOutlined />,
      label: '用户管理'
    }
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        breakpoint="lg"
        collapsedWidth="0"
        theme="dark"
      >
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: 18,
          fontWeight: 600
        }}>
          管理后台
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{
          background: '#fff',
          padding: '0 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 1px 4px rgba(0, 21, 41, 0.08)'
        }}>
          <div style={{ fontSize: 18, fontWeight: 600 }}>
            物资领用管理系统
          </div>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Button type="text" icon={<UserOutlined />}>
              管理员
            </Button>
          </Dropdown>
        </Header>
        <Content style={{ margin: '24px', background: '#fff', padding: 24, borderRadius: 4 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
