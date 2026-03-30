import { useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Upload, Users, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

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
      const jsonData = XLSX.utils.sheet_to_json(firstSheet) as any[];

      // 映射Excel列到用户对象
      const mappedUsers: UserRecord[] = jsonData.map(row => ({
        full_name: row['姓名'] || row['name'] || row['full_name'],
        department: row['部门'] || row['department'],
        email: row['邮箱'] || row['email'],
        employee_id: row['工号'] || row['employee_id'] || '',
        phone: row['电话'] || row['phone'] || '',
        role: row['角色'] || row['role'] || 'employee'
      })).filter(user => user.full_name && user.email);

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
    const successResults: RegisterResult[] = [];

    for (const user of userList) {
      try {
        // 1. 创建Supabase认证用户
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: user.email,
          password: DEFAULT_PASSWORD,
          options: {
            data: {
              full_name: user.full_name,
              role: user.role || 'employee'
            }
          }
        });

        if (signUpError) {
          throw new Error(signUpError.message);
        }

        if (authData.user) {
          // 2. 在profiles表中创建记录
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: authData.user.id,
              email: user.email,
              username: user.email.split('@')[0],
              full_name: user.full_name,
              role: user.role || 'employee',
              department: user.department,
              employee_id: user.employee_id,
              phone: user.phone,
              is_first_login: true, // 标记为首次登录
              created_at: new Date().toISOString()
            });

          if (profileError) {
            console.error('创建profile失败:', profileError);
            // 如果profile创建失败，删除auth用户
            await supabase.auth.admin.deleteUser(authData.user.id);
            throw new Error('创建用户资料失败');
          }

          successResults.push({
            success: true,
            email: user.email,
            full_name: user.full_name
          });
          
          toast.success(`用户 ${user.full_name} 注册成功`);
        }
      } catch (error: any) {
        console.error(`用户 ${user.email} 注册失败:`, error);
        successResults.push({
          success: false,
          email: user.email,
          full_name: user.full_name,
          error: error.message
        });
        toast.error(`用户 ${user.full_name} 注册失败: ${error.message}`);
      }
    }

    setResults(successResults);
    setIsProcessing(false);
    
    const successCount = successResults.filter(r => r.success).length;
    const failCount = successResults.filter(r => !r.success).length;
    
    toast.success(`批量注册完成：成功 ${successCount} 人，失败 ${failCount} 人`);
  };

  const cancelRegister = async (email: string) => {
    if (!confirm(`确定要取消注册 ${email} 吗？此操作将删除用户账号且不可恢复。`)) {
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

      // 删除认证用户（需要admin权限）
      const { error: deleteError } = await supabase.auth.admin.deleteUser(userData.id);
      
      if (deleteError) {
        throw deleteError;
      }

      toast.success(`用户 ${email} 已取消注册`);
      
      // 从列表中移除
      setUserList(prev => prev.filter(u => u.email !== email));
    } catch (error: any) {
      console.error('取消注册失败:', error);
      toast.error(`取消注册失败: ${error.message}`);
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
              <li>• 系统会发送邮件通知用户账号已创建</li>
              <li>• 重复邮箱会自动跳过注册</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}