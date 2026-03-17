import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { message } from 'antd'
import { getCurrentProfile } from './lib/auth'
import type { Profile } from './lib/supabase'

// 导入科技感动画样式
import './styles/cyberpunk.css'

// 页面组件
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Materials from './pages/Materials'
import MyRequisitions from './pages/MyRequisitions'
import PurchaseRequest from './pages/PurchaseRequest'
import AdminLayout from './components/AdminLayout'
import EmployeeLayout from './components/EmployeeLayout'
import Approvals from './pages/admin/Approvals'
import MaterialManagement from './pages/admin/MaterialManagement'
import UserManagement from './pages/admin/UserManagement'
import AddMaterial from './pages/admin/AddMaterial'
import RestockMaterial from './pages/admin/RestockMaterial'

/**
 * 受保护的路由组件
 */
function ProtectedRoute({ children, requiredRole }: { children: React.ReactNode; requiredRole?: 'admin' }) {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const location = useLocation()

  useEffect(() => {
    async function checkAuth() {
      try {
        const userProfile = await getCurrentProfile()

        if (!userProfile) {
          message.error('请先登录')
          setProfile(null)
        } else if (requiredRole === 'admin' && userProfile.role !== 'admin') {
          message.error('需要管理员权限')
          setProfile(userProfile)
        } else {
          setProfile(userProfile)
        }
      } catch (error) {
        console.error('认证检查失败:', error)
        setProfile(null)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [requiredRole])

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>加载中...</div>
  }

  if (!profile) {
    return <Navigate to="/login" replace />
  }

  // 如果是管理员访问员工页面,重定向到 /admin
  if (profile.role === 'admin' && location.pathname.startsWith('/dashboard') || 
      profile.role === 'admin' && location.pathname.startsWith('/materials') ||
      profile.role === 'admin' && location.pathname.startsWith('/my-requisitions')) {
    return <Navigate to="/admin" replace />
  }

  if (requiredRole === 'admin' && profile.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

/**
 * 应用主组件
 */
function App() {
  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      {/* 背景层 - 确保在内容层之下 */}
      <div className="cyber-background" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1 }} />
      
      {/* 主要内容层 */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Routes>
          {/* 公开路由 */}
          <Route path="/login" element={<Login />} />

          {/* 员工布局路由 */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <EmployeeLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="materials" element={<Materials />} />
            <Route path="purchase-request" element={<PurchaseRequest />} />
            <Route path="my-requisitions" element={<MyRequisitions />} />
          </Route>

          {/* 管理员布局路由 */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="approvals" element={<Approvals />} />
            <Route path="materials" element={<MaterialManagement />} />
            <Route path="materials/add" element={<AddMaterial />} />
            <Route path="materials/restock" element={<RestockMaterial />} />
            <Route path="users" element={<UserManagement />} />
          </Route>

          {/* 默认重定向 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  )
}

export default App
