// Supabase Edge Function: admin-create-user
// 在 Supabase Dashboard → Edge Functions 中创建此函数
// 函数名: admin-create-user

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  // 只允许 POST 请求
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    // 验证调用者是已登录的管理员
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // 使用 service_role key 创建 admin 客户端
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    // 使用用户的 token 创建客户端来验证身份
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    })

    // 获取当前用户信息
    const { data: { user: currentUser }, error: authError } = await userClient.auth.getUser()
    if (authError || !currentUser) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // 验证调用者是管理员
    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', currentUser.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden: admin only' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // 解析请求体
    const body = await req.json()
    const { email, password, full_name, role, department, employee_id, phone } = body

    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email and password are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // 1. 创建认证用户
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: full_name || '',
        role: role || 'employee',
      },
    })

    if (createError) {
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 2. 创建 profile 记录
    const { error: profileInsertError } = await adminClient
      .from('profiles')
      .insert({
        id: newUser.user.id,
        email,
        username: email.split('@')[0],
        full_name: full_name || '',
        role: role || 'employee',
        department: department || null,
        employee_id: employee_id || null,
        phone: phone || null,
        is_first_login: true,
      })

    if (profileInsertError) {
      // 回滚：删除已创建的认证用户
      await adminClient.auth.admin.deleteUser(newUser.user.id)
      return new Response(
        JSON.stringify({ error: `创建profile失败: ${profileInsertError.message}` }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, userId: newUser.user.id, email }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
