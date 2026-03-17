import { useEffect, useState } from 'react'
import { Card, Table, Button, Modal, Form, Input, Space, message, Tabs, Tag, Descriptions, Badge, Divider, Typography, Row, Col, Statistic } from 'antd'
import { CheckOutlined, CloseOutlined, EyeOutlined, CalendarOutlined, UserOutlined, NumberOutlined, ShopOutlined, FileTextOutlined, AlertOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { supabase } from '../../lib/supabase'
import type { Requisition, RequisitionType, RequisitionStatus } from '../../lib/supabase'

const { Title, Text } = Typography

/**
 * 审批管理页面 - 重新设计
 */
export default function Approvals() {
  const [form] = Form.useForm()
  const [activeTab, setActiveTab] = useState('pending')

  const [requisitions, setRequisitions] = useState<Requisition[]>([])
  const [loading, setLoading] = useState(false)
  const [approveModalVisible, setApproveModalVisible] = useState(false)
  const [currentRequisition, setCurrentRequisition] = useState<Requisition | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [selectedResult, setSelectedResult] = useState<'approved' | 'rejected' | null>(null)

  useEffect(() => {
    fetchRequisitions()
  }, [activeTab])

  /**
   * 获取申领列表 - 包含完整的关联数据
   */
  async function fetchRequisitions() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('requisitions')
        .select('*, profiles:user_id(full_name, email), materials:material_id(name, category, specification, model, unit)')
        .eq('status', activeTab)
        .order('created_at', { ascending: false })

      if (error) throw error

      setRequisitions(data || [])
    } catch (error) {
      console.error('获取申领列表失败:', error)
      message.error('获取申领列表失败')
    } finally {
      setLoading(false)
    }
  }

  /**
   * 打开审批模态框
   */
  const openApproveModal = (requisition: Requisition) => {
    setCurrentRequisition(requisition)
    setSelectedResult(null)
    form.resetFields()
    setApproveModalVisible(true)
  }

  /**
   * 处理审批
   */
  async function handleApproval(values: { opinion: string }) {
    if (!currentRequisition || !selectedResult) {
      message.error('请选择审批结果')
      return
    }

    setSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        message.error('请先登录')
        return
      }

      // 1. 创建审批记录
      const { error: approvalError } = await supabase
        .from('approvals')
        .insert({
          requisition_id: currentRequisition.id,
          approver_id: user.id,
          result: selectedResult,
          opinion: values.opinion
        })

      if (approvalError) throw approvalError

      // 2. 更新申领状态
      const { error: updateError } = await supabase
        .from('requisitions')
        .update({
          status: selectedResult === 'approved' ? 'approved' : 'rejected'
        })
        .eq('id', currentRequisition.id)

      if (updateError) throw updateError

      // 3. 如果是日常申领且通过,扣减库存并记录流水
      if (currentRequisition.requisition_type === 'daily_request' && selectedResult === 'approved') {
        const { data: material } = await supabase
          .from('materials')
          .select('stock')
          .eq('id', currentRequisition.material_id)
          .single()

        if (material && currentRequisition.request_quantity) {
          const stockBefore = material.stock
          const stockAfter = stockBefore - currentRequisition.request_quantity

          // 更新库存
          await supabase
            .from('materials')
            .update({ stock: stockAfter })
            .eq('id', currentRequisition.material_id)

          // 记录库存流水
          await supabase
            .from('inventory_logs')
            .insert({
              material_id: currentRequisition.material_id!,
              operation_type: 'request_out',
              quantity: -currentRequisition.request_quantity,
              stock_before: stockBefore,
              stock_after: stockAfter,
              reference_id: currentRequisition.id,
              created_by: user.id
            })

          // 更新申领状态为已完成
          await supabase
            .from('requisitions')
            .update({ status: 'completed' })
            .eq('id', currentRequisition.id)
        }
      }

      message.success(`审批${selectedResult === 'approved' ? '通过' : '驳回'}成功`)
      setApproveModalVisible(false)
      form.resetFields()
      setSelectedResult(null)
      fetchRequisitions()
    } catch (error) {
      console.error('审批失败:', error)
      message.error('审批失败,请重试')
    } finally {
      setSubmitting(false)
    }
  }

  /**
   * 获取类型标签
   */
  const getTypeTag = (type: RequisitionType) => {
    if (type === 'daily_request') {
      return <Tag color="blue" style={{ fontWeight: 500 }}>日常领用</Tag>
    }
    return (
      <Tag color="orange" style={{ fontWeight: 600 }}>
        <AlertOutlined style={{ marginRight: 4 }} />
        物品申购
      </Tag>
    )
  }

  /**
   * 获取状态标签
   */
  const getStatusTag = (status: RequisitionStatus) => {
    const statusMap = {
      pending: { color: 'warning', text: '待审批' },
      approved: { color: 'success', text: '已通过' },
      rejected: { color: 'error', text: '已驳回' },
      completed: { color: 'default', text: '已完成' },
      cancelled: { color: 'default', text: '已取消' }
    }
    const config = statusMap[status] || { color: 'default', text: '未知' }
    return <Tag color={config.color}>{config.text}</Tag>
  }

  /**
   * 格式化物资信息
   */
  const formatMaterialInfo = (record: Requisition) => {
    if (record.requisition_type === 'daily_request') {
      return record.materials?.name || `物资ID: ${record.material_id}`
    }
    return record.purchase_name || '申购物品'
  }

  /**
   * 格式化数量
   */
  const formatQuantity = (record: Requisition) => {
    if (record.requisition_type === 'daily_request') {
      const qty = record.quantity || record.request_quantity || 0
      const unit = record.materials?.unit || '个'
      return `${qty} ${unit}`
    }
    return `${record.purchase_quantity || 0} ${record.purchase_unit || '个'}`
  }

  /**
   * 表格列定义
   */
  const columns = [
    {
      title: '序号',
      key: 'index',
      width: 60,
      align: 'center' as const,
      render: (_: any, __: Requisition, index: number) => (
        <Text strong style={{ color: '#1890ff' }}>{index + 1}</Text>
      ),
    },
    {
      title: '申请人',
      key: 'applicant',
      width: 120,
      render: (_: any, record: Requisition) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.profiles?.full_name || '-'}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.department || '未分配'}
          </Text>
        </Space>
      ),
    },
    {
      title: '工号',
      key: 'employee_id',
      width: 100,
      render: (_: any, record: Requisition) => (
        <Text code>{record.employee_id || '-'}</Text>
      ),
    },
    {
      title: '物品名称',
      key: 'material_name',
      width: 150,
      render: (_: any, record: Requisition) => (
        <Text style={{ fontWeight: 500 }}>{formatMaterialInfo(record)}</Text>
      ),
    },
    {
      title: '数量',
      key: 'quantity',
      width: 80,
      align: 'center' as const,
      render: (_: any, record: Requisition) => (
        <Badge 
          count={formatQuantity(record)} 
          style={{ backgroundColor: record.requisition_type === 'daily_request' ? '#52c41a' : '#faad14' }}
        />
      ),
    },
    {
      title: '申请类型',
      key: 'type',
      width: 110,
      render: (_: any, record: Requisition) => getTypeTag(record.requisition_type),
    },
    {
      title: '申请日期',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 140,
      align: 'center' as const,
      render: (date: string) => (
        <Space direction="vertical" size={0}>
          <Text>{date ? new Date(date).toLocaleDateString('zh-CN') : '-'}</Text>
          {date && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {new Date(date).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: '状态',
      key: 'status',
      width: 90,
      fixed: 'right' as const,
      render: (_: any, record: Requisition) => getStatusTag(record.status),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right' as const,
      render: (_: any, record: Requisition) => (
        activeTab === 'pending' ? (
          <Space>
            <Button
              type="primary"
              size="small"
              icon={<CheckOutlined />}
              onClick={() => openApproveModal(record)}
            >
              审批
            </Button>
          </Space>
        ) : (
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => openApproveModal(record)}
          >
            查看
          </Button>
        )
      ),
    },
  ]

  return (
    <div style={{ padding: '24px 32px', background: '#f5f7fa', minHeight: '100%' }}>
      {/* 页面标题 */}
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ marginBottom: 8 }}>
          审批管理
        </Title>
        <Text type="secondary">
          处理物资申领和申购申请，确保物资合理分配
        </Text>
      </div>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card bodyStyle={{ padding: '16px' }}>
            <Statistic
              title="待审批"
              value={requisitions.filter(r => r.status === 'pending').length}
              prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14', fontSize: 20 }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card bodyStyle={{ padding: '16px' }}>
            <Statistic
              title="今日申请"
              value={requisitions.filter(r => 
                new Date(r.created_at).toDateString() === new Date().toDateString()
              ).length}
              prefix={<CalendarOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff', fontSize: 20 }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card bodyStyle={{ padding: '16px' }}>
            <Statistic
              title="申购申请"
              value={requisitions.filter(r => r.requisition_type === 'purchase_request').length}
              prefix={<AlertOutlined style={{ color: '#fa8c16' }} />}
              valueStyle={{ color: '#fa8c16', fontSize: 20 }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card bodyStyle={{ padding: '16px' }}>
            <Statistic
              title="总申请数"
              value={requisitions.length}
              prefix={<FileTextOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1', fontSize: 20 }}
            />
          </Card>
        </Col>
      </Row>

      {/* 标签页 */}
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'pending',
              label: (
                <Space>
                  待审批
                  <Badge count={requisitions.filter(r => r.status === 'pending').length} size="small" />
                </Space>
              ),
            },
            {
              key: 'approved',
              label: '已通过',
            },
            {
              key: 'rejected',
              label: '已驳回',
            },
            {
              key: 'completed',
              label: '已完成',
            },
          ]}
        />

        <Table
          columns={columns}
          dataSource={requisitions}
          rowKey="id"
          loading={loading}
          pagination={{ 
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* 审批模态框 - 重新设计 */}
      <Modal
        title={
          <div style={{ 
            background: selectedResult === 'rejected' ? 
              'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)' : 
              'linear-gradient(135deg, #1890ff 0%, #722ed1 100%)',
            color: 'white',
            padding: '16px 24px',
            margin: '-24px -24px 24px -24px',
            borderRadius: '8px 8px 0 0'
          }}>
            <Title level={4} style={{ margin: 0, color: 'white' }}>
              {selectedResult === 'rejected' ? '驳回申请' : '审批申请'}
            </Title>
          </div>
        }
        open={approveModalVisible}
        onCancel={() => {
          setApproveModalVisible(false)
          setSelectedResult(null)
          form.resetFields()
        }}
        footer={null}
        width={800}
        styles={{
          body: { padding: '24px', background: '#fafafa' }
        }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleApproval}
        >
          {/* 申请信息卡片 */}
          <Card 
            title={
              <Space>
                <FileTextOutlined style={{ color: '#1890ff' }} />
                <Text strong>申请信息</Text>
              </Space>
            }
            style={{ marginBottom: 24, borderRadius: 8 }}
            bodyStyle={{ padding: '20px' }}
          >
            <Descriptions column={2} size="middle">
              <Descriptions.Item label={<Space><UserOutlined />申请人</Space>}>
                <Text strong>{currentRequisition?.profiles?.full_name || '-'}</Text>
              </Descriptions.Item>
              <Descriptions.Item label={<Space><NumberOutlined />工号</Space>}>
                <Text code>{currentRequisition?.employee_id || '-'}</Text>
              </Descriptions.Item>
      <Descriptions.Item label={<Space><ShopOutlined />部门</Space>}>
        <Text>{currentRequisition?.department || '未分配'}</Text>
      </Descriptions.Item>
              <Descriptions.Item label={<Space><CalendarOutlined />申请日期</Space>}>
                <Text>
                  {currentRequisition?.created_at ? new Date(currentRequisition.created_at).toLocaleDateString('zh-CN') : '-'}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label={<Space><AlertOutlined />申请类型</Space>} span={2}>
                {currentRequisition && getTypeTag(currentRequisition.requisition_type)}
              </Descriptions.Item>
            </Descriptions>

            <Divider style={{ margin: '16px 0' }} />

            <Descriptions column={2} size="middle">
              <Descriptions.Item label="物品名称" span={2}>
                <Text style={{ fontSize: 16, fontWeight: 500 }}>
                  {currentRequisition && formatMaterialInfo(currentRequisition)}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="数量">
                <Badge 
                  count={currentRequisition ? formatQuantity(currentRequisition) : 0} 
                  style={{ backgroundColor: '#1890ff', fontSize: 14 }}
                />
              </Descriptions.Item>
              {currentRequisition?.requisition_type === 'purchase_request' && (
                <Descriptions.Item label="期望到货日期">
                  <Tag color="orange">
                    {currentRequisition?.estimated_delivery_date 
                      ? new Date(currentRequisition.estimated_delivery_date).toLocaleDateString('zh-CN')
                      : '未指定'}
                  </Tag>
                </Descriptions.Item>
              )}
              {currentRequisition?.requisition_type === 'purchase_request' && (
                <Descriptions.Item label="规格型号" span={2}>
                  <Text>
                    {currentRequisition.purchase_specification || '-'}
                    {currentRequisition.purchase_model ? ` (${currentRequisition.purchase_model})` : ''}
                  </Text>
                </Descriptions.Item>
              )}
              {currentRequisition?.requisition_type === 'purchase_request' && (
                <Descriptions.Item label="申购理由" span={2}>
                  <Text type="secondary" style={{ background: '#f0f2f5', padding: '8px 12px', borderRadius: 6, display: 'block' }}>
                    {currentRequisition.purchase_reason || '未填写'}
                  </Text>
                </Descriptions.Item>
              )}
              <Descriptions.Item label="申请用途" span={2}>
                <Text style={{ background: '#e6f7ff', padding: '12px', borderRadius: 6, display: 'block' }}>
                  {currentRequisition?.purpose || '未填写'}
                </Text>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* 审批结果选择 */}
          <Card 
            title={
              <Space>
                <CheckOutlined style={{ color: '#52c41a' }} />
                <Text strong>审批结果</Text>
              </Space>
            }
            style={{ marginBottom: 24, borderRadius: 8 }}
            bodyStyle={{ padding: '20px' }}
          >
            <Row gutter={16}>
              <Col span={12}>
                <div
                  onClick={() => setSelectedResult('approved')}
                  style={{
                    border: selectedResult === 'approved' ? '2px solid #52c41a' : '1px solid #d9d9d9',
                    borderRadius: 8,
                    padding: '16px',
                    cursor: 'pointer',
                    background: selectedResult === 'approved' ? '#f6ffed' : 'white',
                    transition: 'all 0.3s',
                  }}
                >
                  <Space direction="vertical" align="center" style={{ width: '100%' }}>
                    <CheckOutlined style={{ fontSize: 32, color: '#52c41a' }} />
                    <Text strong style={{ fontSize: 16 }}>审批通过</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>同意该申请</Text>
                  </Space>
                </div>
              </Col>
              <Col span={12}>
                <div
                  onClick={() => setSelectedResult('rejected')}
                  style={{
                    border: selectedResult === 'rejected' ? '2px solid #ff4d4f' : '1px solid #d9d9d9',
                    borderRadius: 8,
                    padding: '16px',
                    cursor: 'pointer',
                    background: selectedResult === 'rejected' ? '#fff2e8' : 'white',
                    transition: 'all 0.3s',
                  }}
                >
                  <Space direction="vertical" align="center" style={{ width: '100%' }}>
                    <CloseOutlined style={{ fontSize: 32, color: '#ff4d4f' }} />
                    <Text strong style={{ fontSize: 16 }}>审批驳回</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>拒绝该申请</Text>
                  </Space>
                </div>
              </Col>
            </Row>
          </Card>

          {/* 审批意见 */}
          <Form.Item
            name="opinion"
            label={<Text strong>审批意见</Text>}
            rules={[{ required: true, message: '请输入审批意见' }]}
          >
            <Input.TextArea
              rows={4}
              placeholder={selectedResult === 'rejected' 
                ? '请输入驳回理由（必填）'
                : '请输入审批意见（建议填写，便于申请人了解审批情况）'}
              style={{ borderRadius: 6, fontSize: 14 }}
            />
          </Form.Item>

          {/* 操作按钮 */}
          <Form.Item style={{ marginBottom: 0 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button 
                size="large"
                onClick={() => {
                  setApproveModalVisible(false)
                  setSelectedResult(null)
                  form.resetFields()
                }}
              >
                取消
              </Button>
              <Button 
                type="primary" 
                size="large" 
                htmlType="submit" 
                loading={submitting}
                disabled={!selectedResult}
                style={{ minWidth: 120 }}
              >
                确认{selectedResult === 'approved' ? '通过' : selectedResult === 'rejected' ? '驳回' : ''}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
