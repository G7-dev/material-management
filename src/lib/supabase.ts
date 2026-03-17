import { createClient } from '@supabase/supabase-js'

/**
 * Supabase 客户端配置
 *
 * 使用说明:
 * 1. 在 Supabase Dashboard (https://supabase.com/dashboard)
 * 2. 选择你的项目
 * 3. 进入 Settings -> API
 * 4. 复制 Project URL 和 anon/public key
 * 5. 在项目根目录创建 .env 文件,内容如下:
 *    VITE_SUPABASE_URL=你的项目URL
 *    VITE_SUPABASE_ANON_KEY=你的anon密钥
 */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('请配置 Supabase 环境变量 (VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY)')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * 类型定义
 */

// 用户角色
export type UserRole = 'employee' | 'admin'

// 用户配置
export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  department: string | null
  phone: string | null
  created_at: string
  updated_at: string
}

// 物资类型
export interface Material {
  id: string
  name: string
  category: string
  specification: string | null
  model: string | null
  unit: string
  stock: number
  safe_stock: number
  location: string | null
  image_url: string | null
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
  created_by: string | null
}

// 库存操作类型
export type InventoryOperationType = 'initial' | 'restock' | 'request_out' | 'adjustment'

// 库存流水
export interface InventoryLog {
  id: string
  material_id: string
  operation_type: InventoryOperationType
  quantity: number
  stock_before: number
  stock_after: number
  reference_id: string | null
  notes: string | null
  created_at: string
  created_by: string | null
}

// 申领类型
export type RequisitionType = 'daily_request' | 'purchase_request'

// 申领状态
export type RequisitionStatus = 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled'

// 申领/申购
export interface Requisition {
  id: string
  user_id: string
  requisition_type: RequisitionType
  status: RequisitionStatus

  // 日常申领相关
  material_id: string | null
  request_quantity: number | null

  // 申购相关
  purchase_name: string | null
  purchase_specification: string | null
  purchase_model: string | null
  purchase_unit: string | null
  purchase_quantity: number | null
  purchase_reason: string | null

  purpose: string | null
  urgent: boolean
  created_at: string
  updated_at: string
}

// 审批结果
export type ApprovalResult = 'approved' | 'rejected'

// 审批记录
export interface Approval {
  id: string
  requisition_id: string
  approver_id: string
  result: ApprovalResult
  opinion: string | null
  created_at: string
}
