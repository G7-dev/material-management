import { useEffect, useState } from 'react'
import { Card, Table, Button, Modal, Form, Input, Space, message, Tabs } from 'antd'
import { CheckOutlined } from '@ant-design/icons'
import { supabase } from '../../lib/supabase'
import type { Requisition } from '../../lib/supabase'

/**
 * 审批管理页面
 */
export default function Approvals() {
  const [form] = Form.useForm()
  const [activeTab, setActiveTab] = useState('pending')

  const [requisitions, setRequisitions] = useState<Requisition[]>([])
  const [loading, setLoading] = useState(false)
  const [approveModalVisible, setApproveModalVisible] = useState(false)
  const [currentRequisition, setCurrentRequisition] = useState<Requisition | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchRequisitions()
  }, [activeTab])

  /**
   * 获取申领列表
   */
  async function fetchRequisitions() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('requisitions')
        .select('*, profiles:user_id(full_name)')
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
    setApproveModalVisible(true)
  }

  /**
   * 处理审批
   */
  async function handleApproval(values: { result: 'approved' | 'rejected'; opinion: string }) {
    if (!currentRequisition) return

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
          result: values.result,
          opinion: values.opinion
        })

      if (approvalError) throw approvalError

      // 2. 更新申领状态
      const { error: updateError } = await supabase
        .from('requisitions')
        .update({
          status: values.result === 'approved' ? 'approved' : 'rejected'
        })
        .eq('id', currentRequisition.id)

      if (updateError) throw updateError

      // 3. 如果是日常申领且通过,扣减库存并记录流水
      if (currentRequisition.requisition_type === 'daily_request' && values.result === 'approved') {
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

      message.success(`审批${values.result === 'approved' ? '通过' : '驳回'}成功`)
      setApproveModalVisible(false)
      form.resetFields()
      fetchRequisitions()
    } catch (error) {
      console.error('审批失败:', error)
      message.error('审批失败,请重试')
    } finally {
      setSubmitting(false)
    }
  }



  /**
   * 表格列定义
   */
  const columns = [
    {
      title: '申请人',
      key: 'applicant',
      render: (_: any, record: any) => record.profiles?.full_name || '-',
    },
    {
      title: '类型',
      key: 'type',
      render: (_: any, record: Requisition) => (
        record.requisition_type === 'daily_request' ? '日常申领' : '申购'
      ),
    },
    {
      title: '物资信息',
      key: 'material',
      render: (_: any, record: Requisition) => {
        if (record.requisition_type === 'daily_request') {
          return `${record.material_id} - 数量: ${record.request_quantity}`
        } else {
          return `${record.purchase_name} - 数量: ${record.purchase_quantity}`
        }
      },
    },
    {
      title: '用途',
      dataIndex: 'purpose',
      key: 'purpose',
      render: (purpose: string) => purpose || '-',
    },
    {
      title: '提交时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
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
        ) : null
      ),
    },
  ]

  return (
    <div style={{ padding: '24px 32px' }}>
      <h2 style={{ marginBottom: 24, marginTop: 24 }}>审批管理</h2>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'pending',
            label: '待审批',
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
          }
        ]}
      />

      <Card>
        <Table
          columns={columns}
          dataSource={requisitions}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* 审批模态框 */}
      <Modal
        title="审批申领"
        open={approveModalVisible}
        onCancel={() => setApproveModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleApproval}
        >
          <Form.Item>
            <Card size="small">
              <p><strong>类型:</strong> {currentRequisition?.requisition_type === 'daily_request' ? '日常申领' : '申购'}</p>
              <p><strong>物资:</strong> {
                currentRequisition?.requisition_type === 'daily_request'
                  ? `${currentRequisition.material_id} - ${currentRequisition.request_quantity}个`
                  : `${currentRequisition?.purchase_name} - ${currentRequisition?.purchase_quantity}个`
              }</p>
              <p><strong>用途:</strong> {currentRequisition?.purpose || '-'}</p>
            </Card>
          </Form.Item>

          <Form.Item
            name="result"
            label="审批结果"
            rules={[{ required: true, message: '请选择审批结果' }]}
          >
            <Button.Group>
              <Button
                type="primary"
                onClick={() => form.setFieldsValue({ result: 'approved' })}
              >
                通过
              </Button>
              <Button
                danger
                onClick={() => form.setFieldsValue({ result: 'rejected' })}
              >
                驳回
              </Button>
            </Button.Group>
          </Form.Item>

          <Form.Item
            name="opinion"
            label="审批意见"
            rules={[{ required: true, message: '请输入审批意见' }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="请输入审批意见"
            />
          </Form.Item>

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setApproveModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={submitting}>
                确认
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
