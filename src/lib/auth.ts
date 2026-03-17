import { supabase } from './supabase'
import type { Profile } from './supabase'

/**
 * 用户认证相关函数
 * 支持邮箱或用户名登录
 */

/**
 * 用户登录
 * @param identifier 邮箱或用户名
 * @param password 密码
 */
export async function signIn(identifier: string, password: string) {
  // 检查输入的是邮箱还是用户名
  const isEmail = identifier.includes('@')
  
  let email = identifier
  
  // 如果是用户名,查找对应的邮箱
  if (!isEmail) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('username', identifier)
      .single()
    
    if (!profile?.email) {
      throw new Error('用户名不存在')
    }
    
    email = profile.email
  }
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    throw error
  }

  return data
}

/**
 * 用户注册
 * @param email 邮箱
 * @param password 密码
 * @param fullName 姓名
 * @param username 用户名(可选)
 */
export async function signUp(email: string, password: string, fullName?: string, username?: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName || '',
        role: 'employee', // 默认角色为员工
        username: username || null,
      },
    },
  })

  if (error) {
    throw error
  }

  return data
}

/**
 * 用户登出
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut()

  if (error) {
    throw error
  }
}

/**
 * 获取当前用户
 */
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

/**
 * 获取当前用户配置
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  const user = await getCurrentUser()

  if (!user) {
    return null
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    console.error('获取用户配置失败:', error)
    return null
  }

  return data
}

/**
 * 检查用户是否为管理员
 */
export async function isAdmin(): Promise<boolean> {
  const profile = await getCurrentProfile()
  return profile?.role === 'admin'
}

/**
 * 监听认证状态变化
 */
export function onAuthStateChange(callback: (event: string, session: any) => void) {
  return supabase.auth.onAuthStateChange(callback)
}
