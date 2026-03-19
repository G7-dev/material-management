import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { Package, Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { FirstLoginPasswordModal } from '../components/FirstLoginPasswordModal';

export function LoginPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showFirstLoginModal, setShowFirstLoginModal] = useState(false);

  // Check if user needs to reset password on first login
  useEffect(() => {
    const checkFirstLogin = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('is_first_login')
            .eq('id', user.id)
            .single();

          if (profile?.is_first_login) {
            setShowFirstLoginModal(true);
          }
        }
      } catch (error) {
        console.error('检查首次登录状态失败:', error);
      }
    };

    checkFirstLogin();
  }, []);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 检查输入是用户名还是邮箱
      const isEmail = email.includes('@');
      let loginEmail = email;

      // 如果是用户名，从数据库查找对应的邮箱
      if (!isEmail) {
        const { data: emailData, error } = await supabase
          .rpc('get_email_by_username', { username_input: email });
        
        if (error || !emailData) {
          toast.error('用户名不存在');
          setLoading(false);
          return;
        }
        
        loginEmail = emailData;
      }

      // 使用邮箱登录
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: password,
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success('登录成功！');
        
        // 检查是否需要首次登录修改密码
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('is_first_login')
            .eq('id', user.id)
            .single();

          if (profile?.is_first_login) {
            setShowFirstLoginModal(true);
          } else {
            navigate('/');
          }
        }
      }
    } catch (error) {
      toast.error('登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 检查用户名是否已存在
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .single();

      if (existingUser) {
        toast.error('用户名已存在');
        setLoading(false);
        return;
      }

      // 注册新用户
      const { error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            username: username,
            full_name: fullName,
            role: 'employee'
          }
        }
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success('注册成功！请登录');
        setActiveTab('login');
        // 清空表单
        setEmail('');
        setPassword('');
        setUsername('');
        setFullName('');
      }
    } catch (error) {
      toast.error('注册失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgb(99 102 241) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      {/* Gradient Orbs */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl" />

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-white/80 backdrop-blur-2xl rounded-3xl shadow-xl border border-white/60 p-10">
          {/* Logo */}
          <div className="flex flex-col items-center mb-10">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 mb-5">
              <Package className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">物资领用系统</h1>
            <p className="text-sm text-muted-foreground mt-2">智能化物资管理与审批平台</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 bg-muted rounded-lg p-1">
            <button
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                activeTab === 'login'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              登录
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                activeTab === 'register'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              注册
            </button>
          </div>

          {/* Form */}
          <form onSubmit={activeTab === 'login' ? handleLogin : handleRegister} className="space-y-4">
            {activeTab === 'register' && (
              <>
                {/* Username Field for Register */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    用户名
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="请输入用户名"
                      className="pl-10 h-11 bg-muted/50 border-border focus:border-primary"
                      required
                    />
                  </div>
                </div>

                {/* Full Name Field for Register */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    姓名
                  </label>
                  <Input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="请输入姓名"
                    className="h-11 bg-muted/50 border-border focus:border-primary"
                    required
                  />
                </div>
              </>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {activeTab === 'login' ? '邮箱/用户名' : '邮箱'}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={activeTab === 'login' ? '请输入邮箱或用户名' : '请输入邮箱'}
                  className="pl-10 h-11 bg-muted/50 border-border focus:border-primary"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                密码
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  className="pl-10 pr-10 h-11 bg-muted/50 border-border focus:border-primary"
                  autoComplete="current-password"
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
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-gradient-to-r from-primary to-secondary hover:shadow-lg hover:shadow-primary/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {activeTab === 'login' ? '登录中...' : '注册中...'}
                </div>
              ) : (
                activeTab === 'login' ? '登录' : '注册'
              )}
            </Button>

            {activeTab === 'login' && (
              <div className="mt-4 text-center">
                <Link 
                  to="/forgot-password"
                  className="text-xs text-primary hover:underline"
                >
                  忘记密码？
                </Link>
              </div>
            )}
          </form>

          {/* First Login Password Modal */}
          {showFirstLoginModal && (
            <FirstLoginPasswordModal
              onClose={() => {
                setShowFirstLoginModal(false);
                supabase.auth.signOut();
              }}
              onSuccess={() => {
                setShowFirstLoginModal(false);
                navigate('/');
              }}
            />
          )}

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-xs text-muted-foreground">
              © 2024 物资领用系统 | 企业内部使用
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}