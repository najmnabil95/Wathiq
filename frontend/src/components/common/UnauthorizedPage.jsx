import { ShieldAlert, ArrowRight, LayoutDashboard, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export default function UnauthorizedPage({ requiredPermission, message }) {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const currentRole = user?.roles?.[0]?.display_name_ar || user?.roles?.[0]?.name || 'مستخدم عادي';

  return (
    <div
      className="min-h-[60vh] flex items-center justify-center p-4 sm:p-6 animate-fade-in select-none"
      style={{ direction: 'rtl' }}
    >
      <div className="relative max-w-lg w-full bg-slate-900/80 border border-amber-500/30 rounded-3xl p-6 sm:p-8 text-center shadow-2xl backdrop-blur-xl overflow-hidden">
        {/* Glow ambient circle */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Shield Icon */}
        <div className="relative mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-amber-500/20 to-rose-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-5 shadow-lg shadow-amber-500/10">
          <ShieldAlert className="w-8 h-8 sm:w-10 sm:h-10" />
          <div className="absolute -bottom-1.5 -right-1.5 p-1 rounded-full bg-slate-950 border border-amber-500/40 text-amber-300">
            <Lock className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Status Code & Title */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono font-bold mb-3">
          <span>HTTP 403</span>
          <span>•</span>
          <span>غير مصرح بالوصول</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-white mb-2 tracking-tight">
          عذراً، ليس لديك صلاحية لعرض هذه الصفحة
        </h2>

        <p className="text-xs sm:text-sm text-slate-400 mb-5 leading-relaxed">
          {message || 'حسابك الحالي لا يمتلك الإذن الكافي لفتح هذه الصفحة أو استعراض بياناتها ضمن مصفوفة الصلاحيات المعتمدة.'}
        </p>

        {/* Role & Permission Metadata Box */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5 mb-6 text-xs text-right space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span>دورك الوظيفي الحالي:</span>
            <span className="font-semibold text-slate-200 px-2 py-0.5 rounded bg-slate-800/80 border border-white/5">
              {currentRole}
            </span>
          </div>
          {requiredPermission && (
            <div className="flex items-center justify-between text-slate-400 pt-1.5 border-t border-slate-800/80">
              <span>الصلاحية المطلوبة:</span>
              <span className="font-mono text-amber-400 font-semibold dir-ltr text-[11px] px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                {requiredPermission}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition border border-white/5 cursor-pointer"
          >
            <ArrowRight className="w-4 h-4" />
            <span>الرجوع للخلف</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition shadow-lg shadow-blue-600/20 cursor-pointer"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>لوحة التحكم الرئيسية</span>
          </button>
        </div>
      </div>
    </div>
  );
}
