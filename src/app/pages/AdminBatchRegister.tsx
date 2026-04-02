import { useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Upload, Users, X, CheckCircle2, AlertCircle, Loader2, Download } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

// ── 类型定义 ────────────────────────────────────────────────────────────
interface UserRecord {
  full_name: string;
  department: string;
  email: string;
  employee_id?: string;
  phone?: string;
  role?: string;
}

interface RegisterResult {
  success: boolean;
  email: string;
  full_name: string;
  error?: string;
}

// ── Supabase Admin API 封装 ─────────────────────────────────────────────
// 使用 supabase-js 的 GoTrue Admin API 创建用户，不会影响当前登录会话
function getAdminAuth() {
  return supabase.auth.admin;
}

// 通过 REST API 直接插入 profiles 记录（绕过 RLS）
async function insertProfileDirectly(profile: Record<string, unknown>) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const res = await fetch(`${supabaseUrl}/rest/v1/profiles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify(profile),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const msg = errorData?.message || errorData?.msg || res.statusText;
    throw new Error(`插入profiles失败: ${msg}`);
  }
}

// 通过 REST API 删除 profiles 记录
async function deleteProfileDirectly(userId: string) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const res = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${userId}`, {
    method: 'DELETE',
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`,
    },
  });

  if (!res.ok) {
    console.error('删除profile失败:', res.status);
  }
}

// ── Excel 模板生成 ──────────────────────────────────────────────────────
function generateUserTemplate() {
  const headers = ['姓名', '邮箱', '部门', '工号', '电话', '角色'];
  const sampleRows = [
    ['张三', 'zhangsan@company.com', '技术部', '1001', '13800138000', 'employee'],
    ['李四', 'lisi@company.com', '市场部', '1002', '13900139000', 'employee'],
  ];
  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
  ws['!cols'] = headers.map(h => ({ wch: Math.max(h.length * 3, 16) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '批量注册');
  XLSX.writeFile(wb, '批量用户注册模板.xlsx');
}

// ── 主组件 ──────────────────────────────────────────────────────────────
export function AdminBatchRegister() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [userList, setUserList] = useState<UserRecord[]>([]);
  const [results, setResults] = useState<RegisterResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const DEFAULT_PASSWORD = 'jyyl123456';

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const aoa = XLSX.utils.sheet_to_json<unknown[]>(firstSheet, { header: 1, defval: '' });

      if (aoa.length < 2) {
        toast.error('Excel文件为空或只有表头');
        return;
      }

      const headerRow = (aoa[0] as unknown[]).map(h => String(h).trim());

      // 建立列索引映射
      const colAliases: Record<string, string[]> = {
        full_name: ['姓名', 'name', 'full_name', '名称'],
        email: ['邮箱', 'email', '电子邮箱'],
        department: ['部门', 'department', '部门名称'],
        employee_id: ['工号', 'employee_id', '员工编号'],
        phone: ['电话', 'phone', '手机号', '联系电话'],
        role: ['角色', 'role'],
      };

      const fieldToCol: Record<string, number> = {};
      headerRow.forEach((col, idx) => {
        for (const [field, aliases] of Object.entries(colAliases)) {
          if (aliases.includes(col) && fieldToCol[field] === undefined) {
            fieldToCol[field] = idx;
          }
        }
      });

      if (fieldToCol['full_name'] === undefined || fieldToCol['email'] === undefined) {
        toast.error('Excel表头缺少必填列：姓名、邮箱。请下载模板查看格式。');
        return;
      }

      const getCol = (field: string) => {
        const idx = fieldToCol[field];
        return idx !== undefined ? String(aoa[0] !== undefined ? (aoa as unknown[][]).find((_, i) => i > 0)?.[idx] : '') : '';
      };

      const mappedUsers: UserRecord[] = [];
      for (let i = 1; i < aoa.length; i++) {
        const row = aoa[i] as unknown[];
        const name = String(row[fieldToCol['full_name']] ?? '').trim();
        const email = String(row[fieldToCol['email']] ?? '').trim();
        if (name && email) {
          mappedUsers.push({
            full_name: name,
            email: email,
            department: fieldToCol['department'] !== undefined ? String(row[fieldToCol['department']] ?? '').trim() : '',
            employee_id: fieldToCol['employee_id'] !== undefined ? String(row[fieldToCol['employee_id']] ?? '').trim() : '',
            phone: fieldToCol['phone'] !== undefined ? String(row[fieldToCol['phone']] ?? '').trim() : '',
            role: fieldToCol['role'] !== undefined ? String(row[fieldToCol['role']] ?? '').trim() || 'employee' : 'employee',
          });
        }
      }

      setUserList(mappedUsers);
      toast.success(`成功读取 ${mappedUsers.length} 条用户记录`);
    } catch (error) {
      console.error('Excel解析失败:', error);
      toast.error('Excel文件解析失败，请检查格式');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const processBatchRegister = async () => {
    if (userList.length === 0) {
      toast.error('请先上传用户列表');
      return;
    }

    setIsProcessing(true);
    setResults([]);
    const allResults: RegisterResult[] = [];

    for (const user of userList) {
      try {
        // 1. 使用 Admin API 创建认证用户（不影响当前管理员会话）
        const { data, error: signUpError } = await getAdminAuth().createUser({
          email: user.email,
          password: DEFAULT_PASSWORD,
          email_confirm: true, // 直接确认邮箱，无需用户点链接
          user_metadata: {
            full_name: user.full_name,
            role: user.role || 'employee',
          },
        });

        if (signUpError) {
          // 检查是否是邮箱已存在
          if (signUpError.message.includes('already') || signUpError.message.includes('registered')) {
            allResults.push({
              success: false,
              email: user.email,
              full_name: user.full_name,
              error: '该邮箱已被注册',
            });
            toast.error(`用户 ${user.full_name} 注册失败: 该邮箱已被注册`);
          } else {
            throw new Error(signUpError.message);
          }
          continue;
        }

        if (data.user) {
          // 2. 创建 profile 记录
          try {
            await insertProfileDirectly({
              id: data.user.id,
              email: user.email,
              username: user.email.split('@')[0],
              full_name: user.full_name,
              role: user.role || 'employee',
              department: user.department || null,
              employee_id: user.employee_id || null,
              phone: user.phone || null,
              is_first_login: true,
              created_at: new Date().toISOString(),
            });
          } catch (profileErr) {
            // profile 创建失败，删除 auth 用户
            console.error('创建profile失败:', profileErr);
            try {
              await getAdminAuth().deleteUser(data.user.id);
            } catch (delErr) {
              console.error('回滚删除auth用户也失败:', delErr);
            }
            throw new Error(`创建用户资料失败: ${(profileErr as Error).message}`);
          }

          allResults.push({
            success: true,
            email: user.email,
            full_name: user.full_name,
          });
          toast.success(`用户 ${user.full_name} 注册成功`);
        }
      } catch (error: any) {
        console.error(`用户 ${user.email} 注册失败:`, error);
        allResults.push({
          success: false,
          email: user.email,
          full_name: user.full_name,
          error: error.message,
        });
        toast.error(`用户 ${user.full_name} 注册失败: ${error.message}`);
      }
    }

    setResults(allResults);
    setIsProcessing(false);

    const successCount = allResults.filter(r => r.success).length;
    const failCount = allResults.filter(r => !r.success).length;

    if (failCount === 0) {
      toast.success(`🎉 批量注册完成：全部 ${successCount} 人注册成功！`);
    } else {
      toast.warning(`批量注册完成：成功 ${successCount} 人，失败 ${failCount} 人`);
    }
  };

  const cancelRegister = async (email: string) => {
    if (!confirm(`确定要删除用户 ${email} 吗？此操作不可恢复。`)) {
      return;
    }

    try {
      // 查找用户
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();

      if (userError || !userData) {
        throw new Error('用户不存在');
      }

      // 使用 Admin API 删除认证用户
      const { error: deleteError } = await getAdminAuth().deleteUser(userData.id);

      if (deleteError) {
        throw deleteError;
      }

      toast.success(`用户 ${email} 已删除`);

      // 从列表中移除
      setUserList(prev => prev.filter(u => u.email !== email));
    } catch (error: any) {
      console.error('删除用户失败:', error);
      toast.error(`删除失败: ${error.message}`);
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground tracking-tight">批量用户注册</h1>
          <p className="text-muted-foreground mt-1">从Excel表格批量导入用户账号，默认密码：jyyl123456</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/management')}>
          返回管理
        </Button>
      </div>

      {/* Upload Section */}
      <Card className="p-6 border-border">
        <div className="flex items-center gap-2 mb-4">
          <Upload className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">上传用户列表</h2>
        </div>

        {/* 模板下载 */}
        <div className="mb-4 p-4 rounded-xl bg-primary/5 border border-primary/15">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Download className="w-4.5 h-4.5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">首次使用？请先下载模板</p>
                <p className="text-xs text-muted-foreground mt-0.5">按模板格式填写用户信息，确保表头列名一致</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-primary/30 text-primary hover:bg-primary/10 gap-1.5"
              onClick={generateUserTemplate}
            >
              <Download className="w-3.5 h-3.5" />
              下载模板
            </Button>
          </div>
        </div>

        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileUpload}
            className="hidden"
          />

          {isUploading ? (
            <div className="flex items-center justify-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">正在解析文件...</span>
            </div>
          ) : (
            <div>
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="gap-2"
              >
                <Upload className="w-4 h-4" />
                选择Excel文件
              </Button>

              <p className="text-xs text-muted-foreground mt-3">
                支持的格式：.xlsx, .xls, .csv<br />
                必填列：姓名、邮箱；选填列：部门、工号、电话、角色
              </p>
            </div>
          )}
        </div>

        {userList.length > 0 && (
          <div className="mt-4 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
            <p className="text-sm text-emerald-700">
              <CheckCircle2 className="w-4 h-4 inline mr-1" />
              已加载 <span className="font-semibold">{userList.length}</span> 个用户
            </p>
          </div>
        )}
      </Card>

      {/* User List */}
      {userList.length > 0 && (
        <Card className="p-6 border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">待注册用户列表</h2>
            </div>
            <Button
              onClick={processBatchRegister}
              disabled={isProcessing}
              className="gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  正在注册...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  开始批量注册
                </>
              )}
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">姓名</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">邮箱</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">部门</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">工号</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">角色</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">操作</th>
                </tr>
              </thead>
              <tbody>
                {userList.map((user, index) => (
                  <tr key={index} className="border-b border-border hover:bg-muted/30">
                    <td className="py-3 px-4 text-sm font-medium text-foreground">{user.full_name}</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">{user.email}</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">{user.department || '-'}</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">{user.employee_id || '-'}</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="text-xs">
                        {user.role === 'admin' ? '管理员' : '普通员工'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                        onClick={() => cancelRegister(user.email)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Results */}
      {results.length > 0 && (
        <Card className="p-6 border-border">
          <h2 className="text-lg font-semibold text-foreground mb-4">注册结果</h2>

          <div className="space-y-2 max-h-80 overflow-y-auto">
            {results.map((result, index) => (
              <div
                key={index}
                className={`flex items-center gap-3 p-3 rounded-lg ${
                  result.success
                    ? 'bg-emerald-500/5 border border-emerald-500/20'
                    : 'bg-red-500/5 border border-red-500/20'
                }`}
              >
                {result.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {result.full_name} ({result.email})
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {result.success ? '注册成功' : `失败: ${result.error}`}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-muted/30 rounded-lg">
            <p className="text-sm text-muted-foreground text-center">
              总计: <span className="font-semibold text-emerald-600">{results.filter(r => r.success).length}</span> 成功,
              <span className="font-semibold text-red-600">{results.filter(r => !r.success).length}</span> 失败
            </p>
          </div>
        </Card>
      )}

      {/* Tips */}
      <Card className="p-4 border-border bg-muted/30">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-primary mt-0.5" />
          <div>
            <h3 className="font-medium text-foreground">注意事项</h3>
            <ul className="text-xs text-muted-foreground mt-1 space-y-1">
              <li>• 用户首次登录后需强制修改密码</li>
              <li>• 默认密码：jyyl123456</li>
              <li>• 重复邮箱会自动跳过注册</li>
              <li>• 角色可选：employee（普通员工）或 admin（管理员）</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
