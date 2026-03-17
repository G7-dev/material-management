import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Row, Col, Card, Input, Button, Tag, message, Typography, Badge, Empty, Modal, Form, InputNumber } from 'antd'
import { SearchOutlined, ShoppingCartOutlined, InboxOutlined, TagsOutlined } from '@ant-design/icons'
import { supabase } from '../lib/supabase'
import type { Material } from '../lib/supabase'

const { Title, Text } = Typography

/**
 * 日常领用页面 - 卡片式展示
 * 优化设计: 卡片网格布局、精美图标、减少空白
 */
export default function Materials() {
  const navigate = useNavigate()
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [applyModalVisible, setApplyModalVisible] = useState(false)
  const [applyingMaterial, setApplyingMaterial] = useState<Material | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    fetchMaterials()
  }, [])

  /**
   * 获取物资列表
   */
  async function fetchMaterials() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (error) throw error

      setMaterials(data || [])
    } catch (error) {
      console.error('获取物资列表失败:', error)
      message.error('获取物资列表失败')
    } finally {
      setLoading(false)
    }
  }

  /**
   * 筛选物资
   */
  const filteredMaterials = materials.filter(item =>
    item.name.toLowerCase().includes(searchText.toLowerCase()) ||
    item.category.toLowerCase().includes(searchText.toLowerCase()) ||
    (item.specification && item.specification.toLowerCase().includes(searchText.toLowerCase()))
  )

  /**
   * 获取库存状态
   */
  const getStockStatus = (stock: number, safeStock: number) => {
    if (stock <= 0) return { color: '#dc2626', text: '缺货' }
    if (stock < safeStock) return { color: '#f59e0b', text: '库存不足' }
    return { color: '#10b981', text: '库存充足' }
  }

  /**
   * 处理申领
   */
  const handleApply = (material: Material) => {
    if (material.stock <= 0) {
      message.error('该物资暂缺货,无法申领')
      return
    }
    setApplyingMaterial(material)
    form.setFieldsValue({ quantity: 1 })
    setApplyModalVisible(true)
  }

  /**
   * 提交申领申请
   */
  const handleSubmitApplication = async (values: any) => {
    if (!applyingMaterial) return
    
    setSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        message.error('请先登录')
        return
      }

      // 检查申领数量是否超过库存
      if (values.quantity > applyingMaterial.stock) {
        message.error(`申领数量不能超过当前库存 (${applyingMaterial.stock})`)
        return
      }

      // 创建申领记录
      const { error } = await supabase
        .from('requisitions')
        .insert({
          material_id: applyingMaterial.id,
          quantity: values.quantity,
          purpose: values.purpose || '',
          status: 'pending',
          created_by: user.id
        })

      if (error) throw error

      message.success('申领申请已提交，等待审批')
      setApplyModalVisible(false)
      form.resetFields()
      setApplyingMaterial(null)
      
      // 跳转到申请记录页面
      navigate('/my-requisitions')
    } catch (error) {
      console.error('提交申领失败:', error)
      message.error('提交申领失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  /**
   * 物资卡片组件
   */
  const MaterialCard = ({ material }: { material: Material }) => {
    const stockStatus = getStockStatus(material.stock, material.safe_stock)
    const isOutOfStock = material.stock <= 0

    return (
      <Card
        hoverable
        style={{
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          transition: 'all 0.3s ease',
          height: '100%',
        }}
        bodyStyle={{
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}
      >
        {/* 卡片头部 - 图标和分类 */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
          <div style={{
            width: 48,
            height: 48,
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
          }}>
            <InboxOutlined style={{ fontSize: 24, color: 'white' }} />
          </div>
          <div style={{ flex: 1 }}>
            <Tag color="blue" style={{ fontSize: 12, marginBottom: 4 }}>
              <TagsOutlined style={{ marginRight: 4 }} />
              {material.category}
            </Tag>
            <div style={{ fontSize: 10, color: '#6b7280' }}>
              {material.location || '暂无位置信息'}
            </div>
          </div>
        </div>

        {/* 物资名称 */}
        <Title level={4} style={{ margin: '8px 0', fontSize: 18, color: '#1f2937' }}>
          {material.name}
        </Title>

        {/* 规格型号 */}
        <Text style={{ fontSize: 14, color: '#6b7280', marginBottom: 12 }}>
          {material.specification || '无规格'} {material.model ? `| ${material.model}` : ''}
        </Text>

        {/* 库存信息 */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ fontSize: 14, color: '#6b7280' }}>当前库存</Text>
            <Badge
              count={material.stock}
              style={{
                backgroundColor: stockStatus.color,
                fontSize: 14,
                fontWeight: 600,
                minWidth: 32,
                height: 22,
                lineHeight: '22px',
                borderRadius: 11,
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 12, color: '#9ca3af' }}>安全库存: {material.safe_stock}</Text>
            <Text style={{ fontSize: 12, color: stockStatus.color, fontWeight: 500 }}>
              {stockStatus.text}
            </Text>
          </div>
        </div>

        {/* 单位 */}
        <div style={{ marginBottom: 16 }}>
          <Tag style={{ fontSize: 12 }}>单位: {material.unit}</Tag>
        </div>

        {/* 申领按钮 */}
        <Button
          type="primary"
          block
          size="large"
          icon={<ShoppingCartOutlined />}
          onClick={() => handleApply(material)}
          disabled={isOutOfStock}
          style={{
            height: 44,
            borderRadius: 8,
            fontSize: 15,
            fontWeight: 500,
            background: isOutOfStock ? '#d1d5db' : 'linear-gradient(135deg, #667eea, #764ba2)',
            border: 'none',
          }}
        >
          {isOutOfStock ? '暂缺货' : '立即申领'}
        </Button>
      </Card>
    )
  }

  return (
    <div style={{ padding: '24px 32px' }}>
      {/* 申领弹窗 */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShoppingCartOutlined style={{ color: '#667eea' }} />
            <Title level={5} style={{ margin: 0 }}>物资申领</Title>
          </div>
        }
        open={applyModalVisible}
        onCancel={() => {
          setApplyModalVisible(false)
          form.resetFields()
          setApplyingMaterial(null)
        }}
        footer={null}
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmitApplication}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            label="物资名称"
          >
            <Input value={applyingMaterial?.name} disabled style={{ fontWeight: 500 }} />
          </Form.Item>

          <Form.Item
            name="quantity"
            label="申领数量"
            rules={[
              { required: true, message: '请输入申领数量' },
              { type: 'number', min: 1, message: '申领数量至少为1' },
              { type: 'number', max: applyingMaterial?.stock || 0, message: '不能超过当前库存' }
            ]}
          >
            <InputNumber
              min={1}
              max={applyingMaterial?.stock || 1}
              style={{ width: '100%' }}
              placeholder="请输入申领数量"
            />
          </Form.Item>

          <Form.Item
            name="purpose"
            label="申领用途"
            rules={[{ required: true, message: '请填写申领用途' }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="请详细说明申领用途..."
            />
          </Form.Item>

          <Form.Item
            name="notes"
            label="备注（可选）"
          >
            <Input.TextArea
              rows={2}
              placeholder="如有特殊要求，请在此说明..."
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <Button
                onClick={() => {
                  setApplyModalVisible(false)
                  form.resetFields()
                  setApplyingMaterial(null)
                }}
              >
                取消
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={submitting}
                style={{
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  border: 'none',
                }}
              >
                提交申请
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
      {/* 页面头部 */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <Title level={2} style={{ fontSize: 28, marginBottom: 8, color: '#1f2937' }}>
              <InboxOutlined style={{ marginRight: 12, color: '#667eea' }} />
              日常领用
            </Title>
            <Text style={{ fontSize: 16, color: '#6b7280' }}>
              选择您需要的物资，提交领用申请
            </Text>
          </div>
        </div>
      </div>

      {/* 搜索栏 */}
      <Card style={{ borderRadius: 12, marginBottom: 24, boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
        <Input
          placeholder="搜索物资名称、分类或规格..."
          prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ height: 48, fontSize: 15, border: 'none' }}
          allowClear
        />
      </Card>

      {/* 统计信息 */}
      <div style={{ marginBottom: 24 }}>
        <Text style={{ fontSize: 14, color: '#6b7280' }}>
          共找到 <Text strong style={{ color: '#667eea' }}>{filteredMaterials.length}</Text> 种物资
        </Text>
      </div>

      {/* 物资卡片网格 */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ fontSize: 16, color: '#6b7280' }}>加载中...</div>
        </div>
      ) : filteredMaterials.length === 0 ? (
        <Empty
          description={
            <div>
              <Text style={{ fontSize: 16, color: '#6b7280' }}>
                暂无物资数据
              </Text>
              <div style={{ marginTop: 8 }}>
                <Text style={{ fontSize: 14, color: '#9ca3af' }}>
                  {searchText ? '没有找到匹配的物资' : '请联系管理员添加物资'}
                </Text>
              </div>
            </div>
          }
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          style={{ padding: '60px 0' }}
        />
      ) : (
        <Row gutter={[24, 24]}>
          {filteredMaterials.map(material => (
            <Col key={material.id} xs={24} sm={12} md={8} lg={6} xl={6}>
              <MaterialCard material={material} />
            </Col>
          ))}
        </Row>
      )}
    </div>
  )
}
