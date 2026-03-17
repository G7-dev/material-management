import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Card, Table, Tag, Modal, Form, Input, Select, Button, Space, message } from 'antd'
import { PlusOutlined, ShoppingOutlined } from '@ant-design/icons'
import { supabase } from '../lib/supabase'
import type { Requisition, Material } from '../lib/supabase'

/**
 * 我的申领记录页面
 */
export default function MyRequisitions() {
  const navigate = useNavigate()
  const location = useLocation()
  const [form] = Form.useForm()

  const [requisitions, setRequisitions] = useState<Requisition[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchRequisitions()
    fetchMaterials()

    // 如果从物资页面跳转过来,自动打开申领模态框
    if (location.state?.materialId) {
      form.setFieldsValue({ type: 'daily', material_id: location.state.materialId })
      setModalVisible(true)
    }
  }, [location.state])

  /**
   * 获取我的申领记录
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

      const { data, error } = await supabase
        .from('requisitions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setRequisitions(data || [])
    } catch (error) {
      console.error('获取申领记录失败:', error)
      message.error('获取申领记录失败')
    } finally {
      setLoading(false)
    }
  }

  /**
   * 获取物资列表
   */
  async function fetchMaterials() {
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .eq('status', 'active')
        .order('name', { ascending: true })

      if (error) throw error

      setMaterials(data || [])
    } catch (error) {
      console.error('获取物资列表失败:', error)
    }
  }

  /**
   * 提交申领
   */
  async function handleSubmit(values: any) {
    setSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        message.error('请先登录')
        return
      }

      // 日常申领
      if (values.type === 'daily') {
        const { error } = await supabase
          .from('requisitions')
          .insert({
            user_id: user.id,
            requisition_type: 'daily_request',
            material_id: values.material_id,
            request_quantity: values.quantity,
            purpose: values.purpose,
            status: 'pending'
          })

        if (error) throw error

        message.success('申领提交成功,等待审批')
      }
      // 申购
      else if (values.type === 'purchase') {
        const { error } = await supabase
          .from('requisitions')
          .insert({
            user_id: user.id,
            requisition_type: 'purchase_request',
            purchase_name: values.purchase_name,
            purchase_specification: values.purchase_specification,
            purchase_model: values.purchase_model,
            purchase_unit: values.purchase_unit,
            purchase_quantity: values.quantity,
            purchase_reason: values.purchase_reason,
            purpose: values.purpose,
            status: 'pending'
          })

        if (error) throw error

        message.success('申购提交成功,等待审批')
      }

      setModalVisible(false)
      form.resetFields()
      fetchRequisitions()
    } catch (error) {
      console.error('提交失败:', error)
      message.error('提交失败,请重试')
    } finally {
      setSubmitting(false)
    }
  }

  /**
   * 获取状态标签
   */
  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { text: string; color: string }> = {
      pending: { text: '待审批', color: 'processing' },
      approved: { text: '已通过', color: 'success' },
      rejected: { text: '已驳回', color: 'error' },
      completed: { text: '已完成', color: 'success' },
      cancelled: { text: '已取消', color: 'default' }
    }
    const { text, color } = statusMap[status] || { text: status, color: 'default' }
    return <Tag color={color}>{text}</Tag>
  }

  /**
   * 表格列定义
   */
  const columns = [
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
          return `${record.material_id} - ${record.request_quantity}个`
        } else {
          return `${record.purchase_name} - ${record.purchase_quantity}个`
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
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '提交时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>我的申领记录</h2>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setModalVisible(true)}
        >
          新建申领
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={requisitions}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* 申领模态框 */}
      <Modal
        title={
          <span>
            <ShoppingOutlined /> 物资申领
          </span>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ type: 'daily' }}
        >
          <Form.Item
            name="type"
            label="申领类型"
            rules={[{ required: true, message: '请选择申领类型' }]}
          >
            <Select
              options={[
                { label: '日常申领', value: 'daily' },
                { label: '申购', value: 'purchase' }
              ]}
            onChange={() => {
              form.setFieldsValue({
                material_id: undefined,
                purchase_name: undefined,
                purchase_specification: undefined,
                purchase_model: undefined,
                purchase_unit: undefined,
                quantity: undefined
              })
            }}
            />
          </Form.Item>

          {/* 日常申领表单 */}
          <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.type !== currentValues.type}>
            {({ getFieldValue }) =>
              getFieldValue('type') === 'daily' ? (
                <>
                  <Form.Item
                    name="material_id"
                    label="选择物资"
                    rules={[{ required: true, message: '请选择物资' }]}
                  >
                    <Select
                      placeholder="请选择物资"
                      showSearch
                      filterOption={(input, option) =>
                        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                      }
                      options={materials.map(m => ({
                        label: `${m.name} (${m.category}) - 库存: ${m.stock}${m.unit}`,
                        value: m.id
                      }))}
                    />
                  </Form.Item>

                  <Form.Item
                    name="quantity"
                    label="申领数量"
                    rules={[
                      { required: true, message: '请输入申领数量' },
                      { type: 'number', min: 1, message: '数量必须大于0' }
                    ]}
                  >
                    <Input type="number" placeholder="请输入申领数量" />
                  </Form.Item>
                </>
              ) : null
            }
          </Form.Item>

          {/* 申购表单 */}
          <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.type !== currentValues.type}>
            {({ getFieldValue }) =>
              getFieldValue('type') === 'purchase' ? (
                <>
                  <Form.Item
                    name="purchase_name"
                    label="物品名称"
                    rules={[{ required: true, message: '请输入物品名称' }]}
                  >
                    <Input placeholder="请输入物品名称" />
                  </Form.Item>

                  <Form.Item name="purchase_specification" label="规格">
                    <Input placeholder="请输入规格" />
                  </Form.Item>

                  <Form.Item name="purchase_model" label="型号">
                    <Input placeholder="请输入型号" />
                  </Form.Item>

                  <Form.Item name="purchase_unit" label="单位">
                    <Input placeholder="如:个、箱、件" />
                  </Form.Item>

                  <Form.Item
                    name="quantity"
                    label="申购数量"
                    rules={[
                      { required: true, message: '请输入申购数量' },
                      { type: 'number', min: 1, message: '数量必须大于0' }
                    ]}
                  >
                    <Input type="number" placeholder="请输入申购数量" />
                  </Form.Item>

                  <Form.Item
                    name="purchase_reason"
                    label="申购理由"
                    rules={[{ required: true, message: '请输入申购理由' }]}
                  >
                    <Input.TextArea
                      rows={3}
                      placeholder="请说明申购理由"
                    />
                  </Form.Item>
                </>
              ) : null
            }
          </Form.Item>

          <Form.Item
            name="purpose"
            label="用途说明"
            rules={[{ required: true, message: '请输入用途说明' }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="请说明物资用途"
            />
          </Form.Item>

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={submitting}>
                提交
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
