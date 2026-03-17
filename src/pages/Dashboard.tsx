import { Row, Col, Card, Typography, Badge, Progress, Tag, Button, message } from 'antd'
import {
  ShoppingOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  RiseOutlined,
  AlertOutlined,
  BarChartOutlined,
  TeamOutlined,
  PlusOutlined,
  FileSearchOutlined,
  HistoryOutlined,
  AppstoreOutlined,
} from '@ant-design/icons'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const { Title, Text } = Typography

/**
 * 管理员 Dashboard - 丰富的数据展示
 * 特点: 多图表、色彩丰富、信息密度高
 */
export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalMaterials: 0,
    totalRequisitions: 0,
    approvedRequisitions: 0,
    pendingRequisitions: 0,
  })
  const [lowStockMaterials, setLowStockMaterials] = useState<Array<{ name: string; stock: number }>>([])
  const [userRole, setUserRole] = useState<string>('')

  // 从Supabase加载统计数据
  useEffect(() => {
    loadDashboardData()
  }, [])

  /**
   * 加载仪表板数据
   */
  async function loadDashboardData() {
    try {
      // 获取物资总数
      const { count: materialCount } = await supabase
        .from('materials')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')

      // 获取当前用户ID
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // 获取用户角色
      const { data: profileData } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      setUserRole(profileData?.role || 'employee')

      // 获取用户的申领记录
      const { count: requisitionCount } = await supabase
        .from('requisitions')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', user.id)

      // 获取已通过和待审批的申领数
      const { count: approvedCount } = await supabase
        .from('requisitions')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', user.id)
        .eq('status', 'approved')

      const { count: pendingCount } = await supabase
        .from('requisitions')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', user.id)
        .eq('status', 'pending')

      // 获取库存预警信息
      const { data: lowStockData } = await supabase
        .from('materials')
        .select('name, stock')
        .lt('stock', 10)
        .eq('status', 'active')
        .order('stock', { ascending: true })
        .limit(3)

      setStats({
        totalMaterials: materialCount || 0,
        totalRequisitions: requisitionCount || 0,
        approvedRequisitions: approvedCount || 0,
        pendingRequisitions: pendingCount || 0,
      })

      setLowStockMaterials(lowStockData || [])
    } catch (error) {
      console.error('加载仪表板数据失败:', error)
      message.error('加载数据失败')
    }
  }

  return (
    <div style={{ padding: '32px', background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e7f1 100%)', minHeight: 'calc(100vh - 64px)' }}>
      {/* 顶部统计卡片 - 优化后的统一风格 */}
      <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
        <Col xs={24} sm={12} md={6}>
          <Card style={{ 
            borderRadius: 12, 
            boxShadow: '0 6px 20px rgba(24, 144, 255, 0.15)',
            height: '100%',
            border: '1px solid rgba(24, 144, 255, 0.1)',
            overflow: 'hidden'
          }}>
            <div style={{ padding: '24px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 13, color: '#8c8c8c', marginBottom: 4 }}>可用物资</div>
                  <div style={{ fontSize: 26, color: '#1890ff', fontWeight: 700 }}>{stats.totalMaterials}</div>
                </div>
                <ShoppingOutlined style={{ color: '#1890ff', fontSize: 32, opacity: 0.85 }} />
              </div>
              <div style={{ paddingTop: 12, borderTop: '1px solid #f0f0f0', display: 'flex', alignItems: 'center' }}>
                <Badge status="success" />
                <Text style={{ fontSize: 12, marginLeft: 8 }}>正常运行</Text>
                <RiseOutlined style={{ color: '#52c41a', marginLeft: 'auto', fontSize: 14 }} />
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card style={{ 
            borderRadius: 12, 
            boxShadow: '0 6px 20px rgba(82, 196, 26, 0.15)',
            height: '100%',
            border: '1px solid rgba(82, 196, 26, 0.1)',
            overflow: 'hidden'
          }}>
            <div style={{ padding: '24px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 13, color: '#8c8c8c', marginBottom: 4 }}>我的申领</div>
                  <div style={{ fontSize: 26, color: '#52c41a', fontWeight: 700 }}>{stats.totalRequisitions}</div>
                </div>
                <FileTextOutlined style={{ color: '#52c41a', fontSize: 32, opacity: 0.85 }} />
              </div>
              <div style={{ paddingTop: 12, borderTop: '1px solid #f0f0f0', display: 'flex', alignItems: 'center' }}>
                <Badge status="processing" />
                <Text style={{ fontSize: 12, marginLeft: 8 }}>本月申请</Text>
                <Text style={{ fontSize: 12, color: '#8c8c8c', marginLeft: 'auto' }}>件</Text>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card style={{ 
            borderRadius: 12, 
            boxShadow: '0 6px 20px rgba(16, 185, 129, 0.15)',
            height: '100%',
            border: '1px solid rgba(16, 185, 129, 0.1)',
            overflow: 'hidden'
          }}>
            <div style={{ padding: '24px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 13, color: '#8c8c8c', marginBottom: 4 }}>已通过</div>
                  <div style={{ fontSize: 26, color: '#10b981', fontWeight: 700 }}>{stats.approvedRequisitions}</div>
                </div>
                <CheckCircleOutlined style={{ color: '#10b981', fontSize: 32, opacity: 0.85 }} />
              </div>
              <div style={{ paddingTop: 12, borderTop: '1px solid #f0f0f0', display: 'flex', alignItems: 'center' }}>
                <Badge status="success" />
                <Text style={{ fontSize: 12, marginLeft: 8 }}>审批完成</Text>
                <CheckCircleOutlined style={{ color: '#10b981', marginLeft: 'auto', fontSize: 14 }} />
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card style={{ 
            borderRadius: 12, 
            boxShadow: '0 6px 20px rgba(250, 173, 20, 0.15)',
            height: '100%',
            border: '1px solid rgba(250, 173, 20, 0.1)',
            overflow: 'hidden'
          }}>
            <div style={{ padding: '24px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 13, color: '#8c8c8c', marginBottom: 4 }}>待审批</div>
                  <div style={{ fontSize: 26, color: '#faad14', fontWeight: 700 }}>{stats.pendingRequisitions}</div>
                </div>
                <ClockCircleOutlined style={{ color: '#faad14', fontSize: 32, opacity: 0.85 }} />
              </div>
              <div style={{ paddingTop: 12, borderTop: '1px solid #f0f0f0', display: 'flex', alignItems: 'center' }}>
                <Badge status="warning" />
                <Text style={{ fontSize: 12, marginLeft: 8 }}>需要处理</Text>
                <AlertOutlined style={{ color: '#faad14', marginLeft: 'auto', fontSize: 14 }} />
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 第二行: 数据概览和操作快捷入口 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {/* 左侧: 快捷操作 */}
        <Col xs={24} md={12} lg={8}>
          <Card 
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <BarChartOutlined style={{ color: '#1890ff' }} />
                <Title level={5} style={{ margin: 0 }}>快捷操作</Title>
              </div>
            }
            style={{ borderRadius: 8 }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              {userRole !== 'admin' ? (
                <>
                  <Button 
                    type="primary" 
                    icon={<ShoppingOutlined />}
                    style={{ height: 48, fontSize: 14 }}
                    onClick={() => navigate('/materials')}
                  >
                    物资申领
                  </Button>
                  <Button 
                    icon={<PlusOutlined />}
                    style={{ height: 48, fontSize: 14 }}
                    onClick={() => navigate('/purchase-request')}
                  >
                    提交申购
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    type="primary" 
                    icon={<HistoryOutlined />}
                    style={{ height: 48, fontSize: 14 }}
                    onClick={() => navigate('/admin/approvals')}
                  >
                    审批管理
                  </Button>
                  <Button 
                    icon={<AppstoreOutlined />}
                    style={{ height: 48, fontSize: 14 }}
                    onClick={() => navigate('/admin/materials')}
                  >
                    物资管理
                  </Button>
                </>
              )}
              <Button 
                icon={<FileSearchOutlined />}
                style={{ height: 48, fontSize: 14 }}
                onClick={() => navigate('/my-requisitions')}
              >
                查看记录
              </Button>
              {userRole === 'admin' && (
                <Button 
                  icon={<TeamOutlined />}
                  style={{ height: 48, fontSize: 14 }}
                  onClick={() => navigate('/admin/users')}
                >
                  用户管理
                </Button>
              )}
            </div>
          </Card>
        </Col>

        {/* 中间: 申请状态分布 */}
        <Col xs={24} md={12} lg={8}>
          <Card 
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileTextOutlined style={{ color: '#722ed1' }} />
                <Title level={5} style={{ margin: 0 }}>申请状态</Title>
              </div>
            }
            style={{ borderRadius: 8 }}
          >
            <div style={{ padding: '8px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text>待审批</Text>
                <Tag color="warning">{stats.pendingRequisitions}</Tag>
              </div>
              <Progress 
                percent={stats.totalRequisitions > 0 ? Math.round((stats.approvedRequisitions / stats.totalRequisitions) * 100) : 0} 
                status="active" 
                size="small" 
                strokeColor="#faad14" 
              />
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 8 }}>
                完成率: {stats.totalRequisitions > 0 ? Math.round((stats.approvedRequisitions / stats.totalRequisitions) * 100) : 0}%
              </Text>
            </div>
          </Card>
        </Col>

        {/* 右侧: 库存预警 */}
        <Col xs={24} md={24} lg={8}>
          <Card 
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertOutlined style={{ color: '#fa8c16' }} />
                <Title level={5} style={{ margin: 0 }}>库存预警</Title>
              </div>
            }
            style={{ borderRadius: 8 }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {lowStockMaterials.length > 0 ? (
                lowStockMaterials.map((material, index) => (
                  <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 14 }}>{material.name}</Text>
                    <Badge count={material.stock} style={{ backgroundColor: '#faad14' }} />
                  </div>
                ))
              ) : (
                <Text type="secondary" style={{ textAlign: 'center', padding: 16 }}>
                  暂无库存预警
                </Text>
              )}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
