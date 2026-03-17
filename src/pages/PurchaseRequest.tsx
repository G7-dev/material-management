import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Form, Input, InputNumber, Button, message, Typography } from 'antd'
import { PlusOutlined, ShoppingOutlined } from '@ant-design/icons'
import { supabase } from '../lib/supabase'

const { Title, Text } = Typography
const { TextArea } = Input

/**
 * 物品申购页面
 * 员工可以申请系统中不存在的新物品
 */
export default function PurchaseRequest() {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)

  /**
   * 提交申购申请
   */
  const handleSubmit = async (values: any) => {
    setSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        message.error('请先登录')
        return
      }

      // 创建申购申请
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
      form.resetFields()
      navigate('/my-requisitions')
    } catch (error) {
      console.error('提交失败:', error)
      message.error('提交失败,请重试')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ fontSize: 28, marginBottom: 8 }}>
          <ShoppingOutlined style={{ marginRight: 12 }} />
          物品申购
        </Title>
        <Text style={{ fontSize: 16, color: '#6b7280' }}>
          申请系统中不存在的新物品
        </Text>
      </div>

      <Card style={{ maxWidth: 800 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          size="large"
        >
          <Form.Item
            name="purchase_name"
            label="物品名称"
            rules={[{ required: true, message: '请输入物品名称' }]}
          >
            <Input placeholder="请输入需要申购的物品名称" />
          </Form.Item>

          <Form.Item
            name="purchase_specification"
            label="规格"
          >
            <Input placeholder="请输入规格(可选)" />
          </Form.Item>

          <Form.Item
            name="purchase_model"
            label="型号"
          >
            <Input placeholder="请输入型号(可选)" />
          </Form.Item>

          <Form.Item
            name="purchase_unit"
            label="单位"
          >
            <Input placeholder="如:个、箱、件" />
          </Form.Item>

          <Form.Item
            name="quantity"
            label="申购数量"
            rules={[{ required: true, message: '请输入申购数量' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} placeholder="请输入申购数量" />
          </Form.Item>

          <Form.Item
            name="purchase_reason"
            label="申购理由"
            rules={[{ required: true, message: '请输入申购理由' }]}
          >
            <TextArea rows={4} placeholder="请说明申购理由" />
          </Form.Item>

          <Form.Item
            name="purpose"
            label="用途说明"
            rules={[{ required: true, message: '请输入用途说明' }]}
          >
            <TextArea rows={3} placeholder="请说明物资用途" />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={submitting}
              icon={<PlusOutlined />}
              size="large"
              style={{ width: '100%' }}
            >
              提交申购申请
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
