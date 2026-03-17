import { Card, Statistic } from 'antd'
import {
  ShoppingOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons'

/**
 * 首页/仪表盘
 */
export default function Dashboard() {
  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>欢迎使用物资领用管理系统</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <Card>
          <Statistic
            title="可用物资"
            value={5}
            prefix={<ShoppingOutlined style={{ color: '#1890ff' }} />}
            valueStyle={{ color: '#1890ff' }}
          />
        </Card>

        <Card>
          <Statistic
            title="我的申领"
            value={0}
            prefix={<FileTextOutlined style={{ color: '#52c41a' }} />}
            valueStyle={{ color: '#52c41a' }}
          />
        </Card>

        <Card>
          <Statistic
            title="已通过"
            value={0}
            prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            valueStyle={{ color: '#52c41a' }}
          />
        </Card>

        <Card>
          <Statistic
            title="待审批"
            value={0}
            prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
            valueStyle={{ color: '#faad14' }}
          />
        </Card>
      </div>

      <Card style={{ marginTop: 24 }}>
        <h3>快速开始</h3>
        <ul style={{ lineHeight: 2, color: '#666' }}>
          <li>点击左侧菜单的"物资申领"查看并申请所需物资</li>
          <li>在"我的记录"中查看所有申领历史和审批状态</li>
          <li>如有急需物资,可以提交申购申请</li>
        </ul>
      </Card>
    </div>
  )
}
