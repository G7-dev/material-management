import { useState } from 'react';
import { X, Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

interface FirstLoginPasswordModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function FirstLoginPasswordModal({ onClose, onSuccess }: FirstLoginPasswordModalProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const validatePassword = (pwd: string) => {
    if (pwd.length < 8) return '密码至少需要8个字符';
    if (!/(?=.*[a-z])/.test(pwd)) return '密码需要包含小写字母';
    if (!/(?=.*[A-Z])/.test(pwd)) return '密码需要包含大写字母';
    if (!/(?=.*\d)/.test(pwd)) return '密码需要包含数字';
    return null;
  };

  const handleUpdatePassword = async () => {
    if (password !== confirmPassword) {
      toast.error('两次输入的密码不一致');
      return;
    }

    const validationError = validatePassword(password);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setLoading(true);

    try {
      // 更新用户密码
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) throw updateError;

      // 更新profile表，标记为已修改密码
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          is_first_login: false,
          password_updated_at: new Date().toISOString()
        })
        .eq('id', (await supabase.auth.getUser()).data.user?.id);

      if (profileError) throw profileError;

      toast.success('密码修改成功！');
      onSuccess();
    } catch (error: any) {
      console.error('密码更新失败:', error);
      toast.error(`密码更新失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <Card className="w-full max-w-md border-border shadow-2xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Lock className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">首次登录 - 修改密码</h2>
                <p className="text-xs text-muted-foreground">为了您的账号安全，请修改默认密码</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                新密码
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入新密码"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                密码要求：至少8位，包含大小写字母和数字
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                确认新密码
              </label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="请再次输入新密码"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleUpdatePassword}
                disabled={loading || !password || !confirmPassword}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    修改中...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    确认修改
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}