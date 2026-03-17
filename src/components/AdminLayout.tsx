import { Layout, Menu, Button, Typography, Badge, Avatar, Tag, message } from 'antd'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  DashboardOutlined,
  InboxOutlined,
  UserOutlined,
  LogoutOutlined,
  AppstoreOutlined,
  HistoryOutlined,
  PlusOutlined,
  WarningOutlined,
  BellOutlined,
} from '@ant-design/icons'
import { signOut } from '../lib/auth'

const { Header, Sider, Content } = Layout
const { Title, Text } = Typography

/**
 * 互联网大厂风格的管理员布局
 * 特点: 色彩丰富、图标突出、信息密度高
 */
export default function AdminLayout() {
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

  // 管理员菜单 - 更丰富的图标和色彩
  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined style={{ fontSize: 18, color: '#1890ff' }} />,
      label: <span style={{ fontSize: 14, fontWeight: 500 }}>首页</span>,
    },
    {
      key: 'inventory-manage',
      icon: <AppstoreOutlined style={{ fontSize: 18, color: '#fa8c16' }} />,
      label: <span style={{ fontSize: 14, fontWeight: 500 }}>库存管理</span>,
      children: [
        {
          key: '/admin/materials/add',
          icon: <PlusOutlined style={{ fontSize: 16, color: '#fa8c16' }} />,
          label: <span style={{ fontSize: 13 }}>物品上架</span>,
        },
        {
          key: '/admin/materials/restock',
          icon: <InboxOutlined style={{ fontSize: 16, color: '#fa8c16' }} />,
          label: <span style={{ fontSize: 13 }}>物品补货</span>,
        },
      ],
    },
    {
      key: '/admin/approvals',
      icon: <HistoryOutlined style={{ fontSize: 18, color: '#722ed1' }} />,
      label: <span style={{ fontSize: 14, fontWeight: 500 }}>审批管理</span>,
    },
    {
      key: '/admin/users',
      icon: <UserOutlined style={{ fontSize: 18, color: '#eb2f96' }} />,
      label: <span style={{ fontSize: 14, fontWeight: 500 }}>用户管理</span>,
    },
  ]

  // 顶部快捷操作 - 霓虹风格
  const quickActions = [
    { 
      icon: <BellOutlined />, 
      color: '#00f0ff', 
      badge: 3,
      onClick: () => message.info('通知功能开发中...')
    },
    { 
      icon: <WarningOutlined />, 
      color: '#ffaa00', 
      badge: 2,
      onClick: () => {
        message.info('跳转到库存预警...')
        navigate('/admin/materials/restock')
      }
    },
  ]

  return (
    <Layout style={{ minHeight: '100vh', background: 'var(--cyber-darker)' }}>
      {/* 侧边栏 - 霓虹科技风格 */}
      <Sider
        width={240}
        breakpoint="lg"
        collapsedWidth="0"
        style={{
          background: 'linear-gradient(180deg, var(--cyber-darker) 0%, #001a33 100%)',
          boxShadow: '0 0 30px rgba(0, 240, 255, 0.3)',
          borderRight: '1px solid rgba(0, 240, 255, 0.2)',
        }}
      >
        {/* Logo 区域 - 霓虹科技风 */}
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          background: 'linear-gradient(135deg, var(--cyber-primary) 0%, var(--cyber-purple) 100%)',
          boxShadow: '0 0 20px rgba(0, 240, 255, 0.5)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div className="cyber-flicker">
            <AppstoreOutlined style={{ fontSize: 28, color: 'var(--cyber-darker)', marginRight: 12 }} />
          </div>
          <div>
            <Title level={5} style={{ margin: 0, color: 'var(--cyber-darker)', fontSize: 16, fontWeight: 700 }}>
              管理后台
            </Title>
            <Text style={{ fontSize: 11, color: 'rgba(0,0,0,0.7)' }}>
              系统管理中心
            </Text>
          </div>
        </div>

        {/* 管理员信息卡片 - 霓虹风格 */}
        <div style={{ 
          padding: 16, 
          background: 'rgba(0, 240, 255, 0.05)',
          borderBottom: '1px solid rgba(0, 240, 255, 0.2)',
          borderTop: '1px solid rgba(0, 240, 255, 0.2)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar 
              size={40} 
              icon={<UserOutlined />} 
              style={{ 
                background: 'linear-gradient(135deg, var(--cyber-primary), var(--cyber-purple))',
                boxShadow: '0 0 15px rgba(0, 240, 255, 0.5)'
              }}
            />
            <div style={{ flex: 1 }}>
              <Text style={{ 
                color: 'var(--cyber-primary)', 
                fontSize: 14, 
                fontWeight: 600, 
                display: 'block',
                textShadow: '0 0 10px rgba(0, 240, 255, 0.5)'
              }}>
                系统管理员
              </Text>
              <Tag className="cyber-tag" style={{ fontSize: 11, marginTop: 4 }}>
                超级管理员
              </Tag>
            </div>
          </div>
        </div>

        {/* 快捷统计 */}
        <div style={{ 
          padding: '12px 16px', 
          background: 'rgba(0,0,0,0.2)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ 
              flex: 1, 
              background: 'rgba(24, 144, 255, 0.15)', 
              padding: '8px 12px', 
              borderRadius: 6,
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 18, fontWeight: 600, color: '#1890ff' }}>5</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>待审批</div>
            </div>
            <div style={{ 
              flex: 1, 
              background: 'rgba(250, 140, 22, 0.15)', 
              padding: '8px 12px', 
              borderRadius: 6,
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 18, fontWeight: 600, color: '#fa8c16' }}>3</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>库存预警</div>
            </div>
          </div>
        </div>

        {/* 菜单区域 */}
        <div style={{ padding: '8px 0' }}>
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[location.pathname]}
            openKeys={['item-request', 'inventory-manage']}
            items={menuItems}
            onClick={({ key }) => {
              if (key && !key.startsWith('http')) {
                navigate(key)
              }
            }}
            style={{
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
          padding: '12px 16px', 
          background: 'rgba(0,0,0,0.25)',
          borderTop: '1px solid rgba(255,255,255,0.05)',
        }}>
          <Button
            type="text"
            icon={<LogoutOutlined />}
            onClick={handleLogout}
            style={{ 
              width: '100%', 
              justifyContent: 'flex-start', 
              color: 'rgba(255,255,255,0.85)',
            }}
          >
            退出登录
          </Button>
        </div>
      </Sider>

      {/* 主内容区 */}
      <Layout>
        {/* 顶部栏 - 更丰富的信息 */}
        <Header style={{
          background: 'white',
          padding: '0 24px',
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
        }}>
          {/* 左侧面包屑 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Title level={4} style={{ margin: 0, color: '#262626', fontSize: 16 }}>
              物资领用管理系统
            </Title>
            <Tag color="blue" style={{ fontSize: 12 }}>
              管理员控制台
            </Tag>
          </div>

          {/* 右侧快捷操作 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {quickActions.map((action, index) => (
              <Badge key={index} count={action.badge} size="small">
                <Button 
                  type="text" 
                  icon={action.icon} 
                  onClick={action.onClick}
                  style={{ 
                    fontSize: 18, 
                    color: action.color,
                    width: 40,
                    height: 40,
                  }} 
                />
              </Badge>
            ))}
            <Avatar 
              size={36} 
              icon={<UserOutlined />} 
              style={{ 
                background: 'linear-gradient(135deg, #1890ff, #096dd9)',
                cursor: 'pointer',
              }}
            />
          </div>
        </Header>

        {/* 内容区域 - 紧贴边缘 */}
        <Content style={{
          margin: 0,
          padding: 0,
          minHeight: 'calc(100vh - 64px)',
          background: '#f0f2f5',
        }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
