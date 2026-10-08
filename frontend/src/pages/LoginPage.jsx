import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Eye, EyeOff, LogIn, Shield, Lock, Mail, AlertCircle, Fingerprint } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const navigate  = useNavigate();
  const login     = useAuthStore(s => s.login);
  const isLoading = useAuthStore(s => s.isLoading);

  const [form, setForm]               = useState({ email: '', password: '', remember_me: false });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors]           = useState({});

  useEffect(() => { document.title = 'تسجيل الدخول | وثيق IT-EDMS'; }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    if (!form.email.trim()) { setErrors({ email: 'البريد الإلكتروني أو اسم المستخدم مطلوب' }); return; }
    if (!form.password)     { setErrors({ password: 'كلمة المرور مطلوبة' }); return; }

    const result = await login(form.email, form.password, form.remember_me);
    if (result.success) {
      toast.success('مرحباً! تم تسجيل الدخول بنجاح');
      navigate('/', { replace: true });
    } else {
      if (result.errors) setErrors(result.errors);
      toast.error(result.message || 'فشل تسجيل الدخول');
    }
  };

  const demoUsers = [
    { label: 'مدير النظام',    email: 'admin@edms.local',   password: 'ChangeMe@123', color: '#60a5fa', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.25)' },
    { label: 'مدير تقنية المعلومات', email: 'manager@edms.local', password: 'Demo@123456', color: '#c4b5fd', bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.25)' },
    { label: 'موظف الأرشيف',  email: 'staff@edms.local',   password: 'Demo@123456', color: '#6ee7b7', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ direction: 'rtl' }}>

      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 right-1/4 w-80 h-80 rounded-full"
             style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 rounded-full"
             style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div className="absolute top-0 left-0 w-full h-px"
             style={{ background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.4), transparent)' }} />
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.018]"
             style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      {/* Login Card */}
      <div className="w-full max-w-[400px] animate-fade-in relative z-10">

        {/* Logo */}
        <div className="text-center mb-7">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 relative animate-float"
            style={{
              background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.2))',
              border: '1px solid rgba(59,130,246,0.3)',
              boxShadow: '0 0 40px rgba(59,130,246,0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
            }}
          >
            <Shield size={27} className="text-blue-400" />
          </div>
          <h1 className="text-[22px] font-black text-white mb-1 tracking-tight">وثيق IT-EDMS</h1>
          <p className="text-[13px]" style={{ color: '#45607a' }}>
            نظام إدارة وأرشفة الوثائق الإلكترونية
          </p>
        </div>

        {/* Card */}
        <div
          className="glass p-6 sm:p-8"
          style={{ boxShadow: '0 24px 80px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-2 mb-6">
            <Fingerprint size={18} className="text-blue-400" />
            <h2 className="text-base font-bold" style={{ color: '#d4e0f5' }}>تسجيل الدخول</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>

            {/* Email */}
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
                  style={{ paddingLeft: '40px' }}
                />
                <Mail size={15} className="absolute top-1/2 left-3 -translate-y-1/2 pointer-events-none" style={{ color: '#3d5070' }} />
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
                  style={{ paddingRight: '40px', paddingLeft: '40px' }}
                />
                <Lock size={15} className="absolute top-1/2 right-3 -translate-y-1/2 pointer-events-none" style={{ color: '#3d5070' }} />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute top-1/2 left-3 -translate-y-1/2 p-0.5 rounded transition-colors hover:text-blue-400"
                  style={{ color: '#526080', background: 'none', border: 'none', cursor: 'pointer' }}
                  tabIndex={-1}
                  title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && (
                <p className="form-error">
                  <AlertCircle size={12} /> {errors.password}
                </p>
              )}
            </div>

            {/* Remember Me */}
            <label className="flex items-center gap-3 cursor-pointer select-none pt-1">
              <div className="relative flex-shrink-0">
                <input
                  id="remember-me"
                  type="checkbox"
                  name="remember_me"
                  checked={form.remember_me}
                  onChange={handleChange}
                  className="sr-only"
                />
                <div
                  className="w-10 h-5 rounded-full transition-all duration-200"
                  style={{ background: form.remember_me ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' : 'rgba(255,255,255,0.08)', boxShadow: form.remember_me ? '0 0 12px rgba(59,130,246,0.3)' : 'none' }}
                >
                  <div
                    className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-200"
                    style={{ transform: form.remember_me ? 'translateX(-24px)' : 'translateX(-2px)', right: form.remember_me ? '-2px' : 'auto', left: form.remember_me ? 'auto' : '2px' }}
                  />
                </div>
              </div>
              <span className="text-sm" style={{ color: '#7a90a8' }}>تذكرني</span>
            </label>

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full btn-lg mt-2"
              style={{ height: '46px' }}
            >
              {isLoading ? (
                <>
                  <div className="spinner" style={{ width: '17px', height: '17px' }} />
                  جاري تسجيل الدخول...
                </>
              ) : (
                <>
                  <LogIn size={17} />
                  دخول إلى النظام
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Logins */}
          <div className="mt-5 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-[11px] text-center font-semibold mb-2.5" style={{ color: '#364a60' }}>
              — دخول تجريبي سريع —
            </p>
            <div className="grid grid-cols-3 gap-2">
              {demoUsers.map((u, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setForm({ email: u.email, password: u.password, remember_me: true })}
                  className="px-2 py-2 rounded-xl text-center transition-all press-effect"
                  style={{ background: u.bg, border: `1px solid ${u.border}`, color: u.color, fontSize: '11px', fontWeight: 700, lineHeight: 1.3 }}
                  title={`${u.email} / ${u.password}`}
                >
                  {u.label}
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-[11px] mt-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.04)', color: '#2d4060' }}>
            🔒 نظام آمن · جميع العمليات مسجلة ومراقبة
          </p>
        </div>

        {/* Version */}
        <p className="text-center text-[11px] mt-4" style={{ color: '#1e3050' }}>
          IT-EDMS v1.0 &mdash; قسم تقنية المعلومات والأنظمة
        </p>
      </div>
    </div>
  );
}
