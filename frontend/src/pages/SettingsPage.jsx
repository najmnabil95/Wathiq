import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import {
  Settings, Shield, Lock, Database, HardDrive,
  FileCode, CheckCircle, RefreshCw, Server, AlertCircle,
  KeyRound, ShieldCheck, DownloadCloud, Terminal
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user } = useAuthStore();

  const [saving, setSaving] = useState(false);
  const [numberingPattern, setNumberingPattern] = useState('{CAT}-{YEAR}-{SEQ:4}');
  const [retentionYears, setRetentionYears] = useState('7');
  const [requireMFA, setRequireMFA] = useState(true);
  const [shaCheckEnabled, setShaCheckEnabled] = useState(true);

  const handleSave = (e) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success('تم حفظ إعدادات النظام وسياسات الأرشفة بنجاح');
    }, 600);
  };

  const handleBackup = () => {
    toast.loading('جاري توليد نسخة احتياطية مشفرة لقاعدة البيانات...', { id: 'backup' });
    setTimeout(() => {
      toast.success('تم إنشاء نسخة النسخ الاحتياطي وتخزينها في مسار الحفظ الآمن', { id: 'backup' });
    }, 1500);
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in" style={{ direction: 'rtl' }}>
      {/* ── Page Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Settings className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">إعدادات النظام وسياسات الأرشفة</h1>
          </div>
          <p className="text-xs text-slate-400">
            تخصيص قواعد الترميز التلقائي، فترات الاستبقاء، معايير التشفير، والنسخ الاحتياطي
          </p>
        </div>

        <button
          onClick={handleBackup}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-sm font-semibold transition"
        >
          <DownloadCloud className="w-4 h-4 text-emerald-400" />
          نسخ احتياطي فوري (Backup)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Settings Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSave} className="bg-slate-900/60 rounded-2xl border border-slate-800 p-4 sm:p-6 backdrop-blur-md space-y-6">
            <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <FileCode className="w-5 h-5 text-blue-400" />
              سياسة الترقيم والترميز التلقائي (Automatic Numbering Schema)
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  نمط تسلسل الترقيم (Pattern Format)
                </label>
                <input
                  type="text"
                  value={numberingPattern}
                  onChange={(e) => setNumberingPattern(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-mono text-blue-400 focus:outline-none focus:border-blue-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  المتغيرات المدعومة: <code className="text-slate-400">{'{CAT}'}</code> = رمز التصنيف،{' '}
                  <code className="text-slate-400">{'{YEAR}'}</code> = السنة الحالية،{' '}
                  <code className="text-slate-400">{'{SEQ:4}'}</code> = الرقم التسلسلي بطول 4 خانات.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400">معاينة الرمز التلقائي للوثيقة القادمة:</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">
                  SYS-MOD-2026-0042
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    فترة الاستبقاء الافتراضية (Retention Period)
                  </label>
                  <select
                    value={retentionYears}
                    onChange={(e) => setRetentionYears(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="3">3 سنوات (وثائق دورية وعادية)</option>
                    <option value="5">5 سنوات (مراسلات وطلبات تشغيلية)</option>
                    <option value="7">7 سنوات (عقود، تراخيص وتعديلات جوهرية)</option>
                    <option value="10">10 سنوات (سياسات ومخططات البنية التحتية)</option>
                    <option value="99">حفظ دائم وأبدي (Permanent Archive)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    الحد الأقصى لحجم الملف المرفق
                  </label>
                  <input
                    type="text"
                    disabled
                    value="50 MB لكل ملف"
                    className="w-full bg-slate-950/40 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-400 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pt-4 pb-3">
              <Shield className="w-5 h-5 text-emerald-400" />
              سياسات الأمان والنزاهة الرقمية (Cybersecurity & Integrity)
            </h2>

            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/40 border border-slate-800 cursor-pointer hover:border-slate-700 transition">
                <input
                  type="checkbox"
                  checked={shaCheckEnabled}
                  onChange={(e) => setShaCheckEnabled(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-0"
                />
                <div>
                  <span className="text-xs font-bold text-slate-200 block">فحص البصمة الرقمية التلقائي (SHA-256 Integrity Verification)</span>
                  <span className="text-[11px] text-slate-400">حساب وتخزين الهاش فور الرفع والتحقق الدوري لمنع التلاعب في الملفات المخزنة.</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/40 border border-slate-800 cursor-pointer hover:border-slate-700 transition">
                <input
                  type="checkbox"
                  checked={requireMFA}
                  onChange={(e) => setRequireMFA(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-0"
                />
                <div>
                  <span className="text-xs font-bold text-slate-200 block">فرض التحقق الثنائي (MFA) للوثائق السرية للغاية</span>
                  <span className="text-[11px] text-slate-400">إلزام المستخدم بتأكيد هويته قبل تنزيل أو طباعة الملفات ذات التصنيف الأعلى.</span>
                </div>
              </label>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-800">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition shadow-lg shadow-blue-600/20 disabled:opacity-50"
              >
                {saving ? 'جاري الحفظ...' : 'حفظ كافة الإعدادات'}
              </button>
            </div>
          </form>
        </div>

        {/* System & Architecture Info Sidebar */}
        <div className="space-y-6">
          {/* System Health */}
          <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-6 backdrop-blur-md space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Server className="w-5 h-5 text-purple-400" />
              حالة الخادم والبنية التحتية
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">إصدار النظام:</span>
                <span className="font-mono text-slate-200 font-bold">IT-EDMS v2.4 Enterprise</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">محرك الخلفية (Backend):</span>
                <span className="font-mono text-emerald-400 font-bold">Laravel 11.x (PHP 8.2)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">قاعدة البيانات:</span>
                <span className="font-mono text-blue-400 font-bold">MySQL 8.0 Engine</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">واجهة المستخدم (Frontend):</span>
                <span className="font-mono text-cyan-400 font-bold">React 19 + Vite + Tailwind</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">وحدة التخزين المنعزلة:</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Private Local Storage
                </span>
              </div>
            </div>
          </div>

          {/* Confidentiality Levels Reference */}
          <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-6 backdrop-blur-md space-y-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Lock className="w-5 h-5 text-amber-400" />
              درجات ومستويات السرية
            </h3>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <div className="flex justify-between font-bold text-emerald-400 mb-1">
                  <span>عام (Public)</span>
                  <span className="font-mono text-[10px] text-slate-500">L1</span>
                </div>
                <p className="text-[11px] text-slate-400">وثائق عمومية كالأدلة الإرشادية والسياسات العامة المعلنة.</p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <div className="flex justify-between font-bold text-blue-400 mb-1">
                  <span>داخلي (Internal)</span>
                  <span className="font-mono text-[10px] text-slate-500">L2</span>
                </div>
                <p className="text-[11px] text-slate-400">وثائق العمل اليومية والطلبات الروتينية لمنسوبي المؤسسة.</p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <div className="flex justify-between font-bold text-amber-400 mb-1">
                  <span>سري (Confidential)</span>
                  <span className="font-mono text-[10px] text-slate-500">L3</span>
                </div>
                <p className="text-[11px] text-slate-400">تعديلات الأنظمة، عقود الشركاء، وتقارير الأعطال الحساسة.</p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <div className="flex justify-between font-bold text-rose-400 mb-1">
                  <span>سري للغاية (Top Secret)</span>
                  <span className="font-mono text-[10px] text-slate-500">L4</span>
                </div>
                <p className="text-[11px] text-slate-400">كلمات المرور الجذرية، مفاتيح التشفير، ومخططات الشبكة الأمنية.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
