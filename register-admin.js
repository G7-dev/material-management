// 注册管理员账号脚本
// 用法: node register-admin.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const adminEmail = 'lihong@company.com'; // 可以修改这个邮箱
const adminPassword = 'jyyl123456';
const adminName = '李红';

async function registerAdmin() {
  console.log('🔐 正在注册管理员账号...');
  console.log('姓名:', adminName);
  console.log('邮箱:', adminEmail);
  console.log('密码:', adminPassword);

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    // 1. 先登录管理员账号（需要有管理员权限才能调用 Edge Function）
    console.log('\n1. 请输入当前管理员账号的邮箱和密码：');
    const readline = (await import('readline')).createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const askQuestion = (query) => new Promise(resolve => readline.question(query, resolve));
    
    const loginEmail = await askQuestion('当前管理员邮箱: ');
    const loginPassword = await askQuestion('当前管理员密码: ');
    
    readline.close();

    const { data: { session }, error: loginError } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword
    });

    if (loginError || !session) {
      console.error('❌ 登录失败:', loginError?.message);
      process.exit(1);
    }

    console.log('✅ 登录成功');

    // 2. 调用 Edge Function 创建新管理员
    const response = await fetch(`${supabaseUrl}/functions/v1/admin-create-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        email: adminEmail,
        password: adminPassword,
        full_name: adminName,
        role: 'admin',
        department: '管理层',
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || `创建失败 (${response.status})`);
    }

    console.log('\n🎉 管理员账号创建成功！');
    console.log('用户ID:', result.userId);
    console.log('邮箱:', result.email);
    console.log('\n首次登录后需要修改密码');

    // 3. 登出当前账号
    await supabase.auth.signOut();
    console.log('\n✅ 已退出当前账号');

  } catch (error) {
    console.error('\n❌ 创建失败:', error.message);
    process.exit(1);
  }
}

registerAdmin();
