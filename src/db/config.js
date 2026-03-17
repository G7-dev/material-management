// 数据库配置模块
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// 加载环境变量
dotenv.config();

// 验证必要的环境变量
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'JWT_SECRET'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.warn(`⚠️ 警告: 环境变量 ${envVar} 未设置，请检查 .env 文件`);
  }
}

// 创建Supabase客户端
export const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_ANON_KEY || ''
);

// 创建服务角色客户端（用于后台任务）
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || ''
);

// 数据库配置
export const dbConfig = {
  maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20'),
  idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT_MS || '30000'),
  connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT_MS || '2000'),
};

// 数据库连接测试函数
export async function testDatabaseConnection() {
  try {
    const { data, error } = await supabase.from('user_profiles').select('count');
    
    if (error) {
      console.error('❌ 数据库连接测试失败:', error.message);
      return false;
    }
    
    console.log('✅ 数据库连接成功');
    return true;
  } catch (error) {
    console.error('❌ 数据库连接测试异常:', error.message);
    return false;
  }
}