import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Table, Tag, Typography, Space, message } from 'antd'
import { supabase } from '../lib/supabase'
import type { Requisition } from '../lib/supabase'
import { isAdmin } from '../lib/auth'

const { Title, Text } = Typography

/**
 * 申请记录页面
 * 所有人可查看,管理员可以在此审批
 */
export default function MyRequisitions() {
  const navigate = useNavigate()
  const [requisitions, setRequisitions] = useState<Requisition[]>([])
  const [loading, setLoading] = useState(false)
  const [isAdminUser, setIsAdminUser] = useState(false)

  useEffect(() => {
    fetchRequisitions()
    checkAdmin()
  }, [])

  /**
   * 检查是否为管理员
   */
  async function checkAdmin() {
    const admin = await isAdmin()
    setIsAdminUser(admin)
  }

  /**
   * 获取申领/申购记录
   */
  async function fetchRequisitions() {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        message.error('请先登录')
        navigate('/login')
        return
      }

      // 如果是管理员,查看所有记录;否则只查看自己的
      let query = supabase
        .from('requisitions')
        .select('*, profiles:user_id(full_name, email), materials:material_id(name, category)')
        .order('created_at', { ascending: false })

      if (!isAdminUser) {
        query = query.eq('user_id', user.id)
      }

      const { data, error } = await query

      if (error) throw error

      setRequisitions(data || [])
    } catch (error) {
      console.error('获取记录失败:', error)
      message.error('获取记录失败')
    } finally {
      setLoading(false)
    }
  }

  /**
   * 获取状态标签
   */
  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { text: string; color: string }> = {
      pending: { text: '待审批', color: 'warning' },
      approved: { text: '已通过', color: 'success' },
      rejected: { text: '已驳回', color: 'error' },
      completed: { text: '已完成', color: 'success' },
      cancelled: { text: '已取消', color: 'default' }
    }
    const { text, color } = statusMap[status] || { text: status, color: 'default' }
    return <Tag color={color} style={{ fontSize: 14, padding: '4px 12px' }}>{text}</Tag>
  }

  /**
   * 格式化物品信息
   */
  const formatMaterialInfo = (record: Requisition) => {
    if (record.requisition_type === 'daily_request') {
      return record.materials?.name || `物资ID: ${record.material_id}`
    } else {
      return record.purchase_name || '申购物品'
    }
  }

  /**
   * 格式化数量
   */
  const formatQuantity = (record: Requisition) => {
    if (record.requisition_type === 'daily_request') {
      return `${record.quantity || record.request_quantity || 0} 个`
    } else {
      return `${record.purchase_quantity || 0} ${record.purchase_unit || '个'}`
    }
  }

  const columns = [
    {
      title: <div style={{ textAlign: 'center', fontSize: 16, fontWeight: 600 }}>序号</div>,
      key: 'index',
      width: 80,
      align: 'center' as const,
      render: (_: any, __: Requisition, index: number) => (
        <Text strong style={{ color: '#1890ff', fontSize: 14 }}>{index + 1}</Text>
      ),
    },
    {
      title: <div style={{ textAlign: 'center', fontSize: 16, fontWeight: 600 }}>物品名称</div>,
      key: 'material_name',
      align: 'center' as const,
      render: (_: any, record: Requisition) => (
        <Text style={{ fontSize: 15, fontWeight: 500 }}>
          {formatMaterialInfo(record)}
        </Text>
      ),
    },
    {
      title: <div style={{ textAlign: 'center', fontSize: 16, fontWeight: 600 }}>数量</div>,
      key: 'quantity',
      width: 90,
      align: 'center' as const,
      render: (_: any, record: Requisition) => (
        <Text style={{ fontSize: 15, color: '#262626' }}>
          {formatQuantity(record)}
        </Text>
      ),
    },
    {
      title: <div style={{ textAlign: 'center', fontSize: 16, fontWeight: 600 }}>用途</div>,
      dataIndex: 'purpose',
      key: 'purpose',
      align: 'center' as const,
      render: (purpose: string) => (
        <Text style={{ fontSize: 15 }}>
          {purpose || '-'}
        </Text>
      ),
    },
    {
      title: <div style={{ textAlign: 'center', fontSize: 16, fontWeight: 600 }}>申请日期</div>,
      dataIndex: 'created_at',
      key: 'created_at',
      width: 140,
      align: 'center' as const,
      render: (date: string) => (
        <Text style={{ fontSize: 14, color: '#6b7280' }}>
          {date ? new Date(date).toLocaleString('zh-CN') : '-'}
        </Text>
      ),
    },
    {
      title: <div style={{ textAlign: 'center', fontSize: 16, fontWeight: 600 }}>申请类型</div>,
      key: 'type',
      align: 'center' as const,
      render: (_: any, record: Requisition) => (
        record.requisition_type === 'daily_request' ? (
          <Tag color="blue" style={{ fontSize: 13, fontWeight: 500 }}>日常申领</Tag>
        ) : (
          <Tag color="orange" style={{ fontSize: 13, fontWeight: 600 }}>物品申购</Tag>
        )
      ),
    },
    {
      title: <div style={{ textAlign: 'center', fontSize: 16, fontWeight: 600 }}>状态</div>,
      dataIndex: 'status',
      key: 'status',
      align: 'center' as const,
      render: (status: string) => getStatusTag(status),
    },
  ]

  return (
    <div style={{ padding: '24px 32px', background: '#f5f7fa', minHeight: '100%' }}>
      {/* 页面标题 */}
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ fontSize: 24, marginBottom: 8, fontWeight: 600 }}>
          申请记录
        </Title>
        <Text style={{ fontSize: 14, color: '#6b7280' }}>
          {isAdminUser ? '查看和管理所有申请记录' : '查看您的所有申领和申购记录'}
        </Text>
      </div>

      {/* 统计卡片 */}
      <Card style={{ marginBottom: 24, borderRadius: 8 }} bodyStyle={{ padding: '16px' }}>
        <Space size={40}>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>总申请数</Text>
            <Title level={4} style={{ margin: 0, fontSize: 20, color: '#1890ff' }}>{requisitions.length}</Title>
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>待审批</Text>
            <Title level={4} style={{ margin: 0, fontSize: 20, color: '#faad14' }}>
              {requisitions.filter(r => r.status === 'pending').length}
            </Title>
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>已通过</Text>
            <Title level={4} style={{ margin: 0, fontSize: 20, color: '#52c41a' }}>
              {requisitions.filter(r => r.status === 'approved' || r.status === 'completed').length}
            </Title>
          </div>
        </Space>
      </Card>

      {/* 申请列表 */}
      <Card style={{ borderRadius: 12 }}>
        <Table
          columns={columns}
          dataSource={requisitions}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => <span style={{ fontSize: 14 }}>共 {total} 条记录</span>,
          }}
          style={{ fontSize: 15 }}
        />
      </Card>
    </div>
  )
}
