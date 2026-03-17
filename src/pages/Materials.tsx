import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Table, Input, Button, Space, Tag, message } from 'antd'
import { SearchOutlined, ShoppingCartOutlined } from '@ant-design/icons'
import { supabase } from '../lib/supabase'
import type { Material } from '../lib/supabase'

/**
 * 物资列表页面
 */
export default function Materials() {
  const navigate = useNavigate()
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')

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
    item.name.includes(searchText) ||
    item.category.includes(searchText) ||
    (item.specification && item.specification.includes(searchText))
  )

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
      title: '库存',
      dataIndex: 'stock',
      key: 'stock',
      render: (stock: number, record: Material) => (
        <Tag color={stock < record.safe_stock ? 'red' : 'green'}>
          {stock} {record.unit}
        </Tag>
      ),
    },
    {
      title: '存放位置',
      dataIndex: 'location',
      key: 'location',
      render: (location: string) => location || '-',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Material) => (
        <Button
          type="primary"
          size="small"
          icon={<ShoppingCartOutlined />}
          onClick={() => navigate('/my-requisitions', { state: { materialId: record.id } })}
          disabled={record.stock <= 0}
        >
          申领
        </Button>
      ),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>物资申领</h2>
        <Space>
          <Input
            placeholder="搜索物资名称、分类..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
            allowClear
          />
        </Space>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={filteredMaterials}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  )
}
