import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Eye, EyeOff, LogIn, Shield, Lock, Mail, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore(s => s.login);
  const isLoading = useAuthStore(s => s.isLoading);

  const [form, setForm] = useState({ email: '', password: '', remember_me: false });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors(e => ({ ...e, [name]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    if (!form.email.trim()) {
      setErrors({ email: 'البريد الإلكتروني أو اسم المستخدم مطلوب' });
      return;
    }
    if (!form.password) {
      setErrors({ password: 'كلمة المرور مطلوبة' });
      return;
    }

    const result = await login(form.email, form.password, form.remember_me);

    if (result.success) {
      toast.success('مرحباً! تم تسجيل الدخول بنجاح');
      navigate('/', { replace: true });
    } else {
      if (result.errors) setErrors(result.errors);
      toast.error(result.message || 'فشل تسجيل الدخول');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">

      {/* ── Background decorations ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-violet-500/5 rounded-full blur-3xl" />
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
      </div>

      {/* ── Login Card ── */}
      <div className="w-full max-w-md animate-fade-in relative z-10">

        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 relative"
               style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.2))', border: '1px solid rgba(59,130,246,0.3)' }}>
            <Shield size={28} className="text-blue-400" />
            <div className="absolute inset-0 rounded-2xl animate-pulse-glow" />
          </div>
          <h1 className="text-2xl font-black text-white mb-1">
            IT-EDMS
          </h1>
          <p className="text-sm" style={{ color: '#526080' }}>
            نظام إدارة وأرشفة وثائق تقنية المعلومات
          </p>
        </div>

        {/* Card */}
        <div className="glass p-8 shadow-2xl">
          <h2 className="text-lg font-bold mb-6" style={{ color: '#e2e8f0' }}>
            تسجيل الدخول
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>

            {/* Email / Username */}
            <div>
              <label className="form-label">
                البريد الإلكتروني أو اسم المستخدم
                <span className="required">*</span>
              </label>
              <div className="relative">
                <input
                  id="login-email"
                  type="text"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className={`form-input ${errors.email ? 'border-red-500/50' : ''}`}
                  placeholder="admin@edms.local"
                  autoComplete="username"
                  dir="ltr"
                />
                <Mail size={16} className="absolute top-1/2 left-3 -translate-y-1/2" style={{ color: '#526080' }} />
              </div>
              {errors.email && (
                <p className="form-error">
                  <AlertCircle size={12} /> {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="form-label">
                كلمة المرور <span className="required">*</span>
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  className={`form-input ${errors.password ? 'border-red-500/50' : ''}`}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  dir="ltr"
                />
                <Lock size={16} className="absolute top-1/2 right-3 -translate-y-1/2" style={{ color: '#526080' }} />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute top-1/2 left-3 -translate-y-1/2"
                  style={{ color: '#526080', background: 'none', border: 'none', cursor: 'pointer' }}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="form-error">
                  <AlertCircle size={12} /> {errors.password}
                </p>
              )}
            </div>

            {/* Remember Me */}
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <div className="relative">
                <input
                  id="remember-me"
                  type="checkbox"
                  name="remember_me"
                  checked={form.remember_me}
                  onChange={handleChange}
                  className="sr-only"
                />
                <div className={`w-10 h-5 rounded-full transition-colors duration-200 ${form.remember_me ? 'bg-blue-500' : 'bg-white/10'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${form.remember_me ? 'right-0.5' : 'left-0.5'}`} />
                </div>
              </div>
              <span className="text-sm" style={{ color: '#8b9cc8' }}>تذكرني</span>
            </label>

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full btn-lg mt-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin-slow" />
                  جاري تسجيل الدخول...
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  تسجيل الدخول
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Logins */}
          <div className="mt-6 pt-4 border-t border-slate-800 space-y-2">
            <p className="text-xs text-slate-400 text-center font-medium">دخول تجريبي سريع ومباشر:</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setForm({ email: 'admin@edms.local', password: 'ChangeMe@123', remember_me: true })}
                className="px-2 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-semibold transition text-center"
              >
                Super Admin
              </button>
              <button
                type="button"
                onClick={() => setForm({ email: 'manager@edms.local', password: 'Demo@123456', remember_me: true })}
                className="px-2 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-semibold transition text-center"
              >
                IT Manager
              </button>
              <button
                type="button"
                onClick={() => setForm({ email: 'staff@edms.local', password: 'Demo@123456', remember_me: true })}
                className="px-2 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition text-center"
              >
                Archivist
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="divider" />
          <p className="text-center text-xs" style={{ color: '#526080' }}>
            نظام آمن ومحمي · جميع العمليات مسجلة ومُراقبة
          </p>
        </div>

        {/* Version */}
        <p className="text-center text-xs mt-4" style={{ color: '#2a3850' }}>
          IT-EDMS v1.0 &mdash; قسم تقنية المعلومات والأنظمة
        </p>
      </div>
    </div>
  );
}
