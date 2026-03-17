import { useEffect, useState } from 'react'
import { Card, Table, Tag, Form, Input, message } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { supabase } from '../../lib/supabase'
import type { Profile } from '../../lib/supabase'

/**
 * 用户管理页面
 */
export default function UserManagement() {
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  /**
   * 获取用户列表
   */
  async function fetchUsers() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setUsers(data || [])
    } catch (error) {
      console.error('获取用户列表失败:', error)
      message.error('获取用户列表失败')
    } finally {
      setLoading(false)
    }
  }

  /**
   * 表格列定义
   */
  const columns = [
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '姓名',
      dataIndex: 'full_name',
      key: 'full_name',
      render: (name: string) => name || '-',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <Tag color={role === 'admin' ? 'red' : 'blue'}>
          {role === 'admin' ? '管理员' : '员工'}
        </Tag>
      ),
    },
    {
      title: '部门',
      dataIndex: 'department',
      key: 'department',
      render: (dept: string) => dept || '-',
    },
    {
      title: '电话',
      dataIndex: 'phone',
      key: 'phone',
      render: (phone: string) => phone || '-',
    },
    {
      title: '注册时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
    },
  ]

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>用户管理</h2>

      <Card>
        <Form layout="inline" style={{ marginBottom: 16 }}>
          <Form.Item name="search">
            <Input
              prefix={<SearchOutlined />}
              placeholder="搜索用户"
              style={{ width: 300 }}
              allowClear
            />
          </Form.Item>
        </Form>

        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  )
}
