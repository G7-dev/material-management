import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Form, Input, Button, Card, Tabs, message, ConfigProvider } from 'antd'
import { UserOutlined, LockOutlined, KeyOutlined } from '@ant-design/icons'
import { signIn, signUp, getCurrentProfile } from '../lib/auth'
import type { FormInstance } from 'antd'

/**
 * 现代化的登录/注册页面
 * 设计特点:
 * - 渐变背景与玻璃拟态效果
 * - 流畅的动画过渡
 * - 品牌化的视觉元素
 * - 响应式布局
 */
export default function Login() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('login')
  const [loginForm] = Form.useForm()
  const [registerForm] = Form.useForm()

  // 切换标签时清空表单,防止密码泄露
  useEffect(() => {
    if (activeTab === 'login') {
      registerForm.resetFields()
    } else {
      loginForm.resetFields()
    }
  }, [activeTab, loginForm, registerForm])

  /**
   * 处理登录
   */
  const handleLogin = async (values: { email: string; password: string }) => {
    setLoading(true)
    try {
      await signIn(values.email, values.password)
      message.success('登录成功')
      
      // 获取用户信息,根据角色跳转到不同页面
      const profile = await getCurrentProfile()
      if (profile?.role === 'admin') {
        navigate('/admin')
      } else {
        navigate('/dashboard')
      }
    } catch (error: any) {
      if (error.message?.includes('Email not confirmed')) {
        message.error('邮箱未验证,请联系管理员确认用户')
      } else {
        message.error(error.message || '登录失败')
      }
    } finally {
      setLoading(false)
    }
  }

  /**
   * 处理注册
   */
  const handleRegister = async (values: { email: string; password: string; confirmPassword: string; fullName: string; username?: string }) => {
    if (values.password !== values.confirmPassword) {
      message.error('两次输入的密码不一致')
      return
    }

    setLoading(true)
    try {
      await signUp(values.email, values.password, values.fullName, values.username)
      message.success('注册成功,请登录')
      setActiveTab('login')
      registerForm.resetFields()
    } catch (error: any) {
      message.error(error.message || '注册失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#4f46e5',
          borderRadius: 8,
        },
      }}
    >
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* 背景装饰元素 */}
        <div style={{
          position: 'absolute',
          top: '-50%',
          left: '-50%',
          width: '200%',
          height: '200%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
          animation: 'spin 20s linear infinite',
        }} />

        <Card
          style={{
            width: '100%',
            maxWidth: 420,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
            borderRadius: 16,
            overflow: 'hidden',
            zIndex: 1,
          }}
          bodyStyle={{
            padding: '40px 32px',
          }}
        >
          {/* Logo 区域 */}
          <div style={{
            textAlign: 'center',
            marginBottom: 32,
          }}>
            <div style={{
              width: 64,
              height: 64,
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              borderRadius: 16,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
            }}>
              <KeyOutlined style={{ fontSize: 32, color: 'white' }} />
            </div>
            <h1 style={{
              fontSize: 24,
              fontWeight: 700,
              marginBottom: 8,
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              物资管理系统
            </h1>
            <p style={{
              color: '#6b7280',
              fontSize: 14,
              margin: 0,
            }}>
              智能化物资领用与管理平台
            </p>
          </div>

          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            centered
            style={{ marginBottom: 24 }}
            items={[
              {
                key: 'login',
                label: '登录',
                children: (
                  <LoginForm form={loginForm} loading={loading} onFinish={handleLogin} />
                ),
              },
              {
                key: 'register',
                label: '注册',
                children: (
                  <RegisterForm form={registerForm} loading={loading} onFinish={handleRegister} />
                ),
              },
            ]}
          />

          {/* 底部提示 */}
          <div style={{
            textAlign: 'center',
            marginTop: 24,
            paddingTop: 24,
            borderTop: '1px solid #e5e7eb',
          }}>
            <p style={{
              color: '#9ca3af',
              fontSize: 12,
              margin: 0,
            }}>
              © 2024 物资管理系统 | 企业内部使用
            </p>
          </div>
        </Card>

        {/* 添加 CSS 动画 */}
        <style>
          {`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    </ConfigProvider>
  )
}

/**
 * 登录表单组件
 */
function LoginForm({ form, loading, onFinish }: { 
  form: FormInstance
  loading: boolean
  onFinish: (values: any) => void 
}) {
  return (
    <Form
      form={form}
      name="login"
      onFinish={onFinish}
      autoComplete="off"
      layout="vertical"
      size="large"
    >
      <Form.Item
        name="email"
        label="邮箱/用户名"
        rules={[
          { required: true, message: '请输入邮箱或用户名' },
        ]}
      >
        <Input
          prefix={<UserOutlined style={{ color: '#9ca3af' }} />}
          placeholder="请输入邮箱或用户名"
        />
      </Form.Item>

      <Form.Item
        name="password"
        label="密码"
        rules={[
          { required: true, message: '请输入密码' },
          { min: 6, message: '密码至少6位' }
        ]}
      >
        <Input.Password
          prefix={<LockOutlined style={{ color: '#9ca3af' }} />}
          placeholder="请输入密码"
        />
      </Form.Item>

      <Form.Item style={{ marginBottom: 0 }}>
        <Button
          type="primary"
          htmlType="submit"
          loading={loading}
          block
          size="large"
          style={{
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            border: 'none',
            height: 44,
          }}
        >
          登录
        </Button>
      </Form.Item>
    </Form>
  )
}

/**
 * 注册表单组件
 */
function RegisterForm({ form, loading, onFinish }: { 
  form: FormInstance
  loading: boolean
  onFinish: (values: any) => void 
}) {
  return (
    <Form
      form={form}
      name="register"
      onFinish={onFinish}
      autoComplete="off"
      layout="vertical"
      size="large"
    >
      <Form.Item
        name="fullName"
        label="姓名"
        rules={[{ required: true, message: '请输入姓名' }]}
      >
        <Input placeholder="请输入姓名" />
      </Form.Item>

                  <Form.Item
                    name="email"
                    label="邮箱"
                    rules={[
                      { required: true, message: '请输入邮箱' },
                      { type: 'email', message: '请输入有效的邮箱地址' }
                    ]}
                  >
                    <Input
                      prefix={<UserOutlined style={{ color: '#9ca3af' }} />}
                      placeholder="请输入邮箱"
                    />
                  </Form.Item>

                  <Form.Item
                    name="username"
                    label="用户名"
                    rules={[
                      { required: false, message: '请输入用户名' },
                      { min: 3, message: '用户名至少3位' },
                      { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线' }
                    ]}
                  >
                    <Input
                      prefix={<UserOutlined style={{ color: '#9ca3af' }} />}
                      placeholder="请输入用户名(可选)"
                    />
                  </Form.Item>

                  <Form.Item
                    name="password"
                    label="密码"
        rules={[
          { required: true, message: '请输入密码' },
          { min: 6, message: '密码至少6位' }
        ]}
        hasFeedback
      >
        <Input.Password
          prefix={<LockOutlined style={{ color: '#9ca3af' }} />}
          placeholder="请输入密码(至少6位)"
        />
      </Form.Item>

      <Form.Item
        name="confirmPassword"
        label="确认密码"
        dependencies={['password']}
        hasFeedback
        rules={[
          { required: true, message: '请再次输入密码' },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue('password') === value) {
                return Promise.resolve()
              }
              return Promise.reject(new Error('两次输入的密码不一致'))
            },
          }),
        ]}
      >
        <Input.Password
          prefix={<LockOutlined style={{ color: '#9ca3af' }} />}
          placeholder="请再次输入密码"
        />
      </Form.Item>

      <Form.Item style={{ marginBottom: 0 }}>
        <Button
          type="primary"
          htmlType="submit"
          loading={loading}
          block
          size="large"
          style={{
            background: 'linear-gradient(135deg, #10b981, #059669)',
            border: 'none',
            height: 44,
          }}
        >
          注册
        </Button>
      </Form.Item>
    </Form>
  )
}
