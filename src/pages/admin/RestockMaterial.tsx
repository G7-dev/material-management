import { useState, useEffect } from 'react'
import { Row, Col, Card, Button, message, Typography, Badge, Tag, InputNumber, Form, Modal, Space } from 'antd'
import { InboxOutlined, ShoppingCartOutlined, CheckOutlined, PlusOutlined, AlertOutlined } from '@ant-design/icons'
import { supabase } from '../../lib/supabase'
import type { Material } from '../../lib/supabase'

const { Title, Text } = Typography

/**
 * 物品补货页面 - 卡片式展示
 * 功能: 查看库存不足的物资，快速补货
 */
export default function RestockMaterial() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(false)
  const [restockModalVisible, setRestockModalVisible] = useState(false)
  const [restockingMaterial, setRestockingMaterial] = useState<Material | null>(null)
  const [restockQuantity, setRestockQuantity] = useState(10)
  const [restocking, setRestocking] = useState(false)

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
        .order('stock', { ascending: true })

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
   * 获取库存状态
   */
  const getStockStatus = (stock: number, safeStock: number) => {
    if (stock <= 0) return { color: '#dc2626', text: '缺货', type: 'error' }
    if (stock < safeStock) return { color: '#f59e0b', text: '库存不足', type: 'warning' }
    return { color: '#10b981', text: '库存充足', type: 'success' }
  }

  /**
   * 打开补货弹窗
   */
  const openRestockModal = (material: Material) => {
    setRestockingMaterial(material)
    setRestockQuantity(10)
    setRestockModalVisible(true)
  }

  /**
   * 处理补货
   */
  const handleRestock = async () => {
    if (!restockingMaterial) return

    setRestocking(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        message.error('请先登录')
        return
      }

      const stockBefore = restockingMaterial.stock
      const stockAfter = stockBefore + restockQuantity

      // 更新库存
      const { error: updateError } = await supabase
        .from('materials')
        .update({ stock: stockAfter })
        .eq('id', restockingMaterial.id)

      if (updateError) throw updateError

      // 记录库存流水
      const { error: logError } = await supabase
        .from('inventory_logs')
        .insert({
          material_id: restockingMaterial.id,
          operation_type: 'restock',
          quantity: restockQuantity,
          stock_before: stockBefore,
          stock_after: stockAfter,
          created_by: user.id
        })

      if (logError) throw logError

      message.success('补货成功')
      setRestockModalVisible(false)
      setRestockingMaterial(null)
      fetchMaterials()
    } catch (error) {
      console.error('补货失败:', error)
      message.error('补货失败，请重试')
    } finally {
      setRestocking(false)
    }
  }

  /**
   * 物资卡片组件
   */
  const MaterialCard = ({ material }: { material: Material }) => {
    const stockStatus = getStockStatus(material.stock, material.safe_stock)
    const isLowStock = material.stock < material.safe_stock

    return (
      <Card
        hoverable
        style={{
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          transition: 'all 0.3s ease',
          height: '100%',
          border: isLowStock ? '2px solid #faad14' : '1px solid #f0f0f0',
        }}
        bodyStyle={{
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}
      >
        {/* 库存预警标识 */}
        {isLowStock && (
          <div style={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 1,
          }}>
            <Badge count="!" style={{ backgroundColor: '#faad14' }} />
          </div>
        )}

        {/* 图片区域 */}
        {material.image_url ? (
          <div style={{ width: '100%', height: 160, overflow: 'hidden', borderRadius: 8, marginBottom: 12 }}>
            <img
              src={material.image_url}
              alt={material.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        ) : (
          <div style={{
            width: '100%',
            height: 160,
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 12,
          }}>
            <InboxOutlined style={{ fontSize: 48, color: 'white' }} />
          </div>
        )}

        {/* 物品信息 */}
        <div style={{ flex: 1 }}>
          <Title level={4} style={{ margin: '0 0 8px 0', fontSize: 18, color: '#1f2937' }}>
            {material.name}
          </Title>

          <Tag color="blue" style={{ fontSize: 12, marginBottom: 8 }}>
            {material.category}
          </Tag>

          {material.specification && (
            <Text style={{ fontSize: 14, color: '#6b7280', display: 'block', marginBottom: 4 }}>
              规格: {material.specification}
            </Text>
          )}

          {material.model && (
            <Text style={{ fontSize: 14, color: '#6b7280', display: 'block', marginBottom: 8 }}>
              型号: {material.model}
            </Text>
          )}

          {material.location && (
            <Text style={{ fontSize: 13, color: '#9ca3af', display: 'block', marginBottom: 12 }}>
              📍 {material.location}
            </Text>
          )}

          {/* 库存信息 */}
          <div style={{ background: '#f9fafb', padding: 12, borderRadius: 8, marginBottom: 12 }}>
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
              <Text style={{ fontSize: 13, color: '#9ca3af' }}>最低库存: {material.safe_stock}</Text>
              <Tag color={stockStatus.type} style={{ fontSize: 12, margin: 0 }}>
                {stockStatus.text}
              </Tag>
            </div>
          </div>
        </div>

        {/* 补货按钮 */}
        <Button
          type="primary"
          block
          size="large"
          icon={<PlusOutlined />}
          onClick={() => openRestockModal(material)}
          disabled={material.stock === 0}
          style={{
            height: 44,
            borderRadius: 8,
            fontSize: 15,
            fontWeight: 500,
            background: material.stock === 0 ? '#d1d5db' : 'linear-gradient(135deg, #10b981, #059669)',
            border: 'none',
          }}
        >
          {material.stock === 0 ? '缺货中' : '补货'}
        </Button>
      </Card>
    )
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* 页面头部 */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <Title level={2} style={{ fontSize: 28, marginBottom: 8, color: '#1f2937' }}>
              <ShoppingCartOutlined style={{ marginRight: 12, color: '#667eea' }} />
              物品补货
            </Title>
            <Text style={{ fontSize: 16, color: '#6b7280' }}>
              查看库存状态，快速补充物资
            </Text>
          </div>
          <Button
            type="primary"
            icon={<AlertOutlined />}
            size="large"
            style={{
              background: '#faad14',
              borderColor: '#faad14',
            }}
          >
            库存预警
          </Button>
        </div>
      </div>

      {/* 筛选标签 */}
      <div style={{ marginBottom: 24 }}>
        <Tag color="red" style={{ marginRight: 8 }}>缺货 ({materials.filter(m => m.stock <= 0).length})</Tag>
        <Tag color="orange" style={{ marginRight: 8 }}>库存不足 ({materials.filter(m => m.stock > 0 && m.stock < m.safe_stock).length})</Tag>
        <Tag color="green">库存充足 ({materials.filter(m => m.stock >= m.safe_stock).length})</Tag>
      </div>

      {/* 物资卡片网格 */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ fontSize: 16, color: '#6b7280' }}>加载中...</div>
        </div>
      ) : (
        <Row gutter={[24, 24]}>
          {materials.map(material => (
            <Col key={material.id} xs={24} sm={12} md={8} lg={6} xl={6}>
              <MaterialCard material={material} />
            </Col>
          ))}
        </Row>
      )}

      {/* 补货弹窗 */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <PlusOutlined style={{ color: '#10b981' }} />
            <Title level={5} style={{ margin: 0 }}>物品补货</Title>
          </div>
        }
        open={restockModalVisible}
        onCancel={() => {
          setRestockModalVisible(false)
          setRestockingMaterial(null)
        }}
        footer={null}
        width={450}
      >
        <div style={{ padding: '20px 0' }}>
          <div style={{ background: '#f9fafb', padding: 16, borderRadius: 8, marginBottom: 20 }}>
            <Text strong style={{ fontSize: 16 }}>{restockingMaterial?.name}</Text>
            <div style={{ marginTop: 8 }}>
              <Text style={{ color: '#6b7280' }}>当前库存: </Text>
              <Text strong style={{ color: '#1f2937' }}>{restockingMaterial?.stock}</Text>
              <Text style={{ color: '#6b7280', marginLeft: 12 }}>最低库存: </Text>
              <Text strong style={{ color: '#1f2937' }}>{restockingMaterial?.safe_stock}</Text>
            </div>
          </div>

          <Form layout="vertical">
            <Form.Item
              label="补货数量"
              required
            >
              <InputNumber
                min={1}
                max={9999}
                value={restockQuantity}
                onChange={(value) => setRestockQuantity(value || 1)}
                style={{ width: '100%' }}
                size="large"
                addonAfter={restockingMaterial?.unit}
              />
            </Form.Item>
          </Form>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
            <Button
              onClick={() => {
                setRestockModalVisible(false)
                setRestockingMaterial(null)
              }}
              size="large"
            >
              取消
            </Button>
            <Button
              type="primary"
              onClick={handleRestock}
              loading={restocking}
              icon={<CheckOutlined />}
              size="large"
              style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                border: 'none',
              }}
            >
              确认补货
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
