import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

export function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setEmailSent(true);
      toast.success('重置密码邮件已发送，请查收');
    } catch (error: any) {
      console.error('发送重置邮件失败:', error);
      toast.error(`发送失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error('两次输入的密码不一致');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('密码至少需要8个字符');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast.success('密码重置成功！请使用新密码登录');
      setTimeout(() => navigate('/login'), 2000);
    } catch (error: any) {
      console.error('密码重置失败:', error);
      toast.error(`重置失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgb(99 102 241) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className="relative z-10 w-full max-w-md mx-4">
        <Card className="bg-white/80 backdrop-blur-2xl rounded-3xl shadow-xl border border-white/60 p-8">
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => navigate('/login')}
              className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-semibold text-foreground">重置密码</h1>
          </div>

          {step === 'email' ? (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                  <Mail className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-lg font-semibold text-foreground mb-2">忘记密码？</h2>
                <p className="text-sm text-muted-foreground">
                  请输入您的邮箱地址，我们将发送密码重置链接到您的邮箱
                </p>
              </div>

              {emailSent ? (
                <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-emerald-700 mb-1">邮件已发送</p>
                  <p className="text-xs text-emerald-600">
                    请查收您的邮箱 {email}，点击邮件中的链接重置密码
                  </p>
                  <Button
                    variant="link"
                    className="text-xs text-emerald-700 mt-2"
                    onClick={() => setEmailSent(false)}
                  >
                    重新发送
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSendResetEmail} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      邮箱地址
                    </label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="请输入注册邮箱"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading || !email}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        发送中...
                      </>
                    ) : (
                      '发送重置链接'
                    )}
                  </Button>
                </form>
              )}

              <div className="text-center text-xs text-muted-foreground">
                没有收到邮件？请检查垃圾邮件箱
              </div>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="text-center mb-6">
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                  <Lock className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-lg font-semibold text-foreground mb-2">设置新密码</h2>
                <p className="text-sm text-muted-foreground">
                  请输入您的新密码
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  新密码
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="请输入新密码"
                    required
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
                  密码至少8位，包含字母和数字
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
                    required
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

              <Button
                type="submit"
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    重置中...
                  </>
                ) : (
                  '确认重置'
                )}
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}