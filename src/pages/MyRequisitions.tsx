import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Table, Tag, Typography, Space, Button, message } from 'antd'
import { EyeOutlined } from '@ant-design/icons'
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
   * 获取类型标签
   */
  const getTypeTag = (type: string) => {
    return type === 'daily_request' ? '日常申领' : '物品申购'
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
      title: <span style={{ fontSize: 16, fontWeight: 600 }}>申请类型</span>,
      key: 'type',
      render: (_: any, record: Requisition) => (
        <Text style={{ fontSize: 15 }}>{getTypeTag(record.requisition_type)}</Text>
      ),
    },
    {
      title: <span style={{ fontSize: 16, fontWeight: 600 }}>物品信息</span>,
      key: 'material',
      render: (_: any, record: Requisition) => (
        <div>
          <Text style={{ fontSize: 15, fontWeight: 500 }}>
            {formatMaterialInfo(record)}
          </Text>
          <div style={{ fontSize: 13, color: '#6b7280' }}>
            数量: {formatQuantity(record)}
          </div>
        </div>
      ),
    },
    {
      title: <span style={{ fontSize: 16, fontWeight: 600 }}>用途</span>,
      dataIndex: 'purpose',
      key: 'purpose',
      render: (purpose: string) => (
        <Text style={{ fontSize: 15 }}>
          {purpose || '-'}
        </Text>
      ),
    },
    {
      title: <span style={{ fontSize: 16, fontWeight: 600 }}>状态</span>,
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status),
    },
    {
      title: <span style={{ fontSize: 16, fontWeight: 600 }}>申请时间</span>,
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => (
        <Text style={{ fontSize: 14, color: '#6b7280' }}>
          {new Date(date).toLocaleString('zh-CN')}
        </Text>
      ),
    },
    {
      title: <span style={{ fontSize: 16, fontWeight: 600 }}>操作</span>,
      key: 'action',
      render: (_: any, record: Requisition) => (
        <Space>
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/my-requisitions/${record.id}`)}
            style={{ fontSize: 14 }}
          >
            查看详情
          </Button>
          {isAdminUser && record.status === 'pending' && (
            <Button
              type="primary"
              onClick={() => navigate(`/admin/approvals`, { state: { requisitionId: record.id } })}
              style={{ fontSize: 14 }}
            >
              审批
            </Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ fontSize: 28, marginBottom: 8 }}>
          申请记录
        </Title>
        <Text style={{ fontSize: 16, color: '#6b7280' }}>
          {isAdminUser ? '查看和管理所有申请记录' : '查看您的所有申领和申购记录'}
        </Text>
      </div>

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
