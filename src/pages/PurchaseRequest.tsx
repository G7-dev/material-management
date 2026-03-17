import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Form, Input, InputNumber, Button, message, Typography, Row, Col, DatePicker, Select, Divider, Badge, Tag, Space } from 'antd'
import { PlusOutlined, ShoppingOutlined, InboxOutlined, TagsOutlined, TeamOutlined, HistoryOutlined, InfoCircleOutlined } from '@ant-design/icons'
import { supabase } from '../lib/supabase'
import type { Material } from '../lib/supabase'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { TextArea } = Input
const { Option } = Select

// 部门选项
const DEPARTMENTS = [
  { label: '设备部', value: '设备部', icon: '🏭' },
  { label: '技术部', value: '技术部', icon: '💻' },
  { label: '能源部', value: '能源部', icon: '⚡' },
  { label: '生产一部', value: '生产一部', icon: '🏭' },
  { label: '生产二部', value: '生产二部', icon: '🏭' },
  { label: '供应部', value: '供应部', icon: '📦' },
  { label: '储运部', value: '储运部', icon: '🚛' },
]

/**
 * 物品申购页面
 * 员工可以申请系统中不存在的新物品
 */
export default function PurchaseRequest() {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)
  const [lowStockMaterials, setLowStockMaterials] = useState<Material[]>([])
  const [allMaterials, setAllMaterials] = useState<Material[]>([])

  useEffect(() => {
    fetchMaterials()
  }, [])

  /**
   * 获取物资列表（包括缺货物品）
   */
  async function fetchMaterials() {
    try {
      // 获取缺货物品（优先显示）
      const { data: lowStockData } = await supabase
        .from('materials')
        .select('*')
        .eq('status', 'active')
        .lt('stock', 10)  // 库存少于10的视为缺货
        .order('stock', { ascending: true })

      // 获取所有物品
      const { data: allData } = await supabase
        .from('materials')
        .select('*')
        .eq('status', 'active')
        .order('name', { ascending: true })

      setLowStockMaterials(lowStockData || [])
      setAllMaterials(allData || [])
    } catch (error) {
      console.error('获取物资列表失败:', error)
    }
  }

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
          estimated_delivery_date: values.estimated_delivery_date?.format('YYYY-MM-DD'),
          department: values.department,
          employee_id: values.employee_id,
          applicant_name: values.applicant_name,
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
    <div style={{ 
      padding: '24px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start',
      minHeight: 'calc(100vh - 64px)',
      background: '#f5f7fa'
    }}>
      <div style={{ width: '100%', maxWidth: 900 }}>
        {/* 页面头部 - 更丰富的信息 */}
        <Card style={{ marginBottom: 24, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <Title level={2} style={{ fontSize: 28, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                <ShoppingOutlined style={{ color: '#667eea' }} />
                物品申购
                <Badge count={lowStockMaterials.length} overflowCount={99} style={{ backgroundColor: '#faad14' }} />
              </Title>
              <Text style={{ fontSize: 16, color: '#6b7280' }}>
                申请新物品或补充库存不足物品
              </Text>
            </div>
            <div style={{ textAlign: 'right' }}>
              <Tag color="orange" style={{ marginBottom: 4 }}>缺货物品: {lowStockMaterials.length} 种</Tag>
              <div style={{ fontSize: 12, color: '#9ca3af' }}>建议优先申购缺货物品</div>
            </div>
          </div>
        </Card>

        {/* 缺货提示 - 如果有缺货物品 */}
        {lowStockMaterials.length > 0 && (
          <Card style={{ marginBottom: 24, borderRadius: 12, border: '1px solid #faad20' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <InfoCircleOutlined style={{ color: '#faad14' }} />
              <Text strong style={{ color: '#faad14' }}>库存不足物品推荐</Text>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {lowStockMaterials.slice(0, 6).map(material => (
                <Tag key={material.id} color="orange" style={{ margin: 0 }}>
                  <InboxOutlined style={{ marginRight: 4 }} />
                  {material.name} ({material.stock}/{material.safe_stock})
                </Tag>
              ))}
              {lowStockMaterials.length > 6 && (
                <Tag style={{ margin: 0 }}>还有 {lowStockMaterials.length - 6} 种...</Tag>
              )}
            </div>
          </Card>
        )}

        {/* 申购表单 */}
        <Card 
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <PlusOutlined style={{ color: '#667eea' }} />
              <Title level={4} style={{ margin: 0 }}>申购申请单</Title>
              <Text type="secondary" style={{ marginLeft: 'auto', fontSize: 12 }}>
                带 <span style={{ color: 'red' }}>*</span> 为必填项
              </Text>
            </div>
          }
          style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            size="large"
            style={{ padding: '20px 0' }}
          >
            {/* 物品基本信息 - 带图标 */}
            <Divider orientation="left"><TagsOutlined /> 物品基本信息</Divider>
            
            <Row gutter={24}>
              <Col span={24}>
                <Form.Item
                  name="purchase_name"
                  label="物品名称"
                  rules={[{ required: true, message: '请选择或输入物品名称' }]}
                >
                  <Select 
                    placeholder="请选择或搜索物品名称"
                    showSearch
                    allowClear
                    dropdownRender={menu => (
                      <div>
                        {menu}
                        <Divider style={{ margin: '8px 0' }} />
                        <div style={{ padding: '8px', fontSize: 12, color: '#999' }}>
                          <Text type="secondary">未找到？直接输入新物品名称</Text>
                        </div>
                      </div>
                    )}
                  >
                    {/* 缺货物品分组 */}
                    {lowStockMaterials.length > 0 && (
                      <Select.OptGroup label={
                        <span style={{ color: '#faad14' }}>
                          <InfoCircleOutlined style={{ marginRight: 8 }} />
                          库存不足物品（建议优先申购）
                        </span>
                      }>
                        {lowStockMaterials.map(material => (
                          <Option key={`low-${material.id}`} value={material.name}>
                            <Badge status="warning" style={{ marginRight: 8 }} />
                            {material.name} 
                            <Text type="secondary" style={{ marginLeft: 8 }}>
                              (库存: {material.stock} {material.unit})
                            </Text>
                          </Option>
                        ))}
                      </Select.OptGroup>
                    )}
                    
                    {/* 所有物品分组 */}
                    <Select.OptGroup label={<span><InboxOutlined style={{ marginRight: 8 }} />所有物品</span>}>
                      {allMaterials.map(material => (
                        <Option key={material.id} value={material.name}>
                          {material.name}
                          <Text type="secondary" style={{ marginLeft: 8 }}>
                            ({material.category})
                          </Text>
                        </Option>
                      ))}
                    </Select.OptGroup>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={24}>
              <Col span={12}>
                <Form.Item
                  name="purchase_specification"
                  label="规格"
                >
                  <Input placeholder="如: A4, 100ml, 大号" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="purchase_unit"
                  label="单位"
                  rules={[{ required: true, message: '请输入单位' }]}
                >
                  <Input placeholder="如: 个、箱、包、件" addonAfter="单位" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={24}>
              <Col span={12}>
                <Form.Item
                  name="purchase_model"
                  label="型号"
                >
                  <Input placeholder="如: HP-1020, 得力-001 (可选)" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="quantity"
                  label="申购数量"
                  rules={[{ required: true, message: '请输入申购数量' }]}
                >
                  <InputNumber min={1} style={{ width: '100%' }} placeholder="请输入申购数量" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={24}>
              <Col span={12}>
                <Form.Item
                  name="estimated_delivery_date"
                  label="预计到货日期"
                  rules={[{ required: true, message: '请选择预计到货日期' }]}
                >
                  <DatePicker 
                    style={{ width: '100%' }} 
                    placeholder="请选择预计到货日期"
                    disabledDate={(current) => current && current < dayjs().startOf('day')}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Divider orientation="left"><TeamOutlined /> 申请人信息</Divider>

            <Row gutter={24}>
              <Col span={12}>
                <Form.Item
                  name="department"
                  label="部门"
                  rules={[{ required: true, message: '请选择部门' }]}
                >
                  <Select placeholder="请选择部门">
                    {DEPARTMENTS.map(dept => (
                      <Option key={dept.value} value={dept.value}>
                        <span style={{ marginRight: 8 }}>{dept.icon}</span>
                        {dept.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="employee_id"
                  label="工号"
                  rules={[{ required: true, message: '请输入工号' }]}
                >
                  <Input placeholder="请输入工号" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={24}>
              <Col span={12}>
                <Form.Item
                  name="applicant_name"
                  label="申请人姓名"
                  rules={[{ required: true, message: '请输入姓名' }]}
                >
                  <Input placeholder="请输入姓名" />
                </Form.Item>
              </Col>
            </Row>

            <Divider orientation="left"><HistoryOutlined /> 申购说明</Divider>

            <Form.Item
              name="purchase_reason"
              label="申购理由"
              rules={[{ required: true, message: '请输入申购理由' }]}
            >
              <TextArea rows={3} placeholder="请说明申购理由，如库存不足、新项目需求等" />
            </Form.Item>

            <Form.Item
              name="purpose"
              label="用途说明"
              rules={[{ required: true, message: '请输入用途说明' }]}
            >
              <TextArea rows={4} placeholder="请详细说明物资的具体用途、使用场景等" />
            </Form.Item>

            <Divider />

            <Form.Item style={{ marginBottom: 0 }}>
              <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Button
                  size="large"
                  onClick={() => {
                    form.resetFields()
                  }}
                >
                  重置
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={submitting}
                  icon={<PlusOutlined />}
                  size="large"
                  style={{
                    minWidth: 180,
                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                    border: 'none',
                  }}
                >
                  提交申购申请
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </div>
  )
}
