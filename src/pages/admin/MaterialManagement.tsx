import { useEffect, useState } from 'react'
import { Card, Table, Button, Modal, Form, Input, InputNumber, message, Space, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SyncOutlined } from '@ant-design/icons'
import { supabase } from '../../lib/supabase'
import type { Material } from '../../lib/supabase'

/**
 * 物资管理页面
 */
export default function MaterialManagement() {
  const [form] = Form.useForm()
  const [restockForm] = Form.useForm()

  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [restockModalVisible, setRestockModalVisible] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null)
  const [submitting, setSubmitting] = useState(false)
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
   * 打开编辑/新增模态框
   */
  const openModal = (material?: Material) => {
    setEditingMaterial(material || null)
    if (material) {
      form.setFieldsValue(material)
    } else {
      form.resetFields()
    }
    setModalVisible(true)
  }

  /**
   * 提交物资表单
   */
  async function handleSubmit(values: any) {
    setSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        message.error('请先登录')
        return
      }

      if (editingMaterial) {
        // 更新物资
        const { error } = await supabase
          .from('materials')
          .update(values)
          .eq('id', editingMaterial.id)

        if (error) throw error

        message.success('更新成功')
      } else {
        // 新增物资
        const { error } = await supabase
          .from('materials')
          .insert({
            ...values,
            created_by: user.id
          })

        if (error) throw error

        // 记录初始库存流水
        const { data: newMaterial } = await supabase
          .from('materials')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (newMaterial) {
          await supabase
            .from('inventory_logs')
            .insert({
              material_id: newMaterial.id,
              operation_type: 'initial',
              quantity: newMaterial.stock,
              stock_before: 0,
              stock_after: newMaterial.stock,
              created_by: user.id
            })
        }

        message.success('添加成功')
      }

      setModalVisible(false)
      form.resetFields()
      setEditingMaterial(null)
      fetchMaterials()
    } catch (error) {
      console.error('操作失败:', error)
      message.error('操作失败,请重试')
    } finally {
      setSubmitting(false)
    }
  }

  /**
   * 删除物资
   */
  async function handleDelete(id: string) {
    try {
      const { error } = await supabase
        .from('materials')
        .update({ status: 'inactive' })
        .eq('id', id)

      if (error) throw error

      message.success('删除成功')
      fetchMaterials()
    } catch (error) {
      console.error('删除失败:', error)
      message.error('删除失败')
    }
  }

  /**
   * 打开补货模态框
   */
  const openRestockModal = (material: Material) => {
    restockForm.setFieldsValue({ material_id: material.id, quantity: 10 })
    setRestockModalVisible(true)
  }

  /**
   * 处理补货
   */
  async function handleRestock(values: any) {
    setRestocking(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        message.error('请先登录')
        return
      }

      // 获取当前库存
      const { data: material } = await supabase
        .from('materials')
        .select('stock')
        .eq('id', values.material_id)
        .single()

      if (!material) {
        message.error('物资不存在')
        return
      }

      const stockBefore = material.stock
      const stockAfter = stockBefore + values.quantity

      // 更新库存
      const { error: updateError } = await supabase
        .from('materials')
        .update({ stock: stockAfter })
        .eq('id', values.material_id)

      if (updateError) throw updateError

      // 记录库存流水
      const { error: logError } = await supabase
        .from('inventory_logs')
        .insert({
          material_id: values.material_id,
          operation_type: 'restock',
          quantity: values.quantity,
          stock_before: stockBefore,
          stock_after: stockAfter,
          notes: values.notes,
          created_by: user.id
        })

      if (logError) throw logError

      message.success('补货成功')
      setRestockModalVisible(false)
      restockForm.resetFields()
      fetchMaterials()
    } catch (error) {
      console.error('补货失败:', error)
      message.error('补货失败,请重试')
    } finally {
      setRestocking(false)
    }
  }

  /**
   * 表格列定义
   */
  const columns = [
    {
      title: '物资名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: '规格/型号',
      key: 'spec',
      render: (_: any, record: Material) => (
        <span>
          {record.specification || '-'}
          {record.model ? ` / ${record.model}` : ''}
        </span>
      ),
    },
    {
      title: '单位',
      dataIndex: 'unit',
      key: 'unit',
    },
    {
      title: '当前库存',
      dataIndex: 'stock',
      key: 'stock',
      render: (stock: number, record: Material) => (
        <span style={{ color: stock < record.safe_stock ? '#ff4d4f' : '#52c41a' }}>
          {stock}
        </span>
      ),
    },
    {
      title: '安全库存',
      dataIndex: 'safe_stock',
      key: 'safe_stock',
    },
    {
      title: '存放位置',
      dataIndex: 'location',
      key: 'location',
      render: (location: string) => location || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => status === 'active' ? '正常' : '停用',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Material) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => openModal(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            icon={<SyncOutlined />}
            onClick={() => openRestockModal(record)}
          >
            补货
          </Button>
          <Popconfirm
            title="确定要删除这个物资吗?"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>物资管理</h2>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => openModal()}
        >
          添加物资
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={materials}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* 新增/编辑物资模态框 */}
      <Modal
        title={editingMaterial ? '编辑物资' : '添加物资'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="name"
            label="物资名称"
            rules={[{ required: true, message: '请输入物资名称' }]}
          >
            <Input placeholder="请输入物资名称" />
          </Form.Item>

          <Form.Item
            name="category"
            label="分类"
            rules={[{ required: true, message: '请输入分类' }]}
          >
            <Input placeholder="如:办公用品、电子设备等" />
          </Form.Item>

          <Form.Item name="specification" label="规格">
            <Input placeholder="请输入规格" />
          </Form.Item>

          <Form.Item name="model" label="型号">
            <Input placeholder="请输入型号" />
          </Form.Item>

          <Form.Item
            name="unit"
            label="单位"
            rules={[{ required: true, message: '请输入单位' }]}
          >
            <Input placeholder="如:个、箱、件等" />
          </Form.Item>

          <Form.Item
            name="stock"
            label="初始库存"
            rules={[{ required: true, message: '请输入初始库存' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入初始库存" />
          </Form.Item>

          <Form.Item
            name="safe_stock"
            label="安全库存"
            rules={[{ required: true, message: '请输入安全库存' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} placeholder="低于此数值将提醒" />
          </Form.Item>

          <Form.Item name="location" label="存放位置">
            <Input placeholder="如:A区-1号货架" />
          </Form.Item>

          <Form.Item name="image_url" label="图片URL">
            <Input placeholder="请输入图片URL" />
          </Form.Item>

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={submitting}>
                {editingMaterial ? '更新' : '添加'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 补货模态框 */}
      <Modal
        title="物资补货"
        open={restockModalVisible}
        onCancel={() => setRestockModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form
          form={restockForm}
          layout="vertical"
          onFinish={handleRestock}
        >
          <Form.Item
            name="material_id"
            style={{ display: 'none' }}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="quantity"
            label="补货数量"
            rules={[{ required: true, message: '请输入补货数量' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} placeholder="请输入补货数量" />
          </Form.Item>

          <Form.Item name="notes" label="备注">
            <Input.TextArea
              rows={3}
              placeholder="请输入备注(可选)"
            />
          </Form.Item>

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setRestockModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={restocking}>
                确认补货
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
