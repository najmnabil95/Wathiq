import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Settings,
  Shield,
  Lock,
  Database,
  Key,
  HardDrive,
  Users,
  CheckCircle2
} from 'lucide-react';

export const SettingsView = () => {
  const { t, currentRole, showToast } = useApp();

  const handleSave = (e) => {
    e.preventDefault();
    showToast('تم حفظ إعدادات النظام والأمان بنجاح', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-100 flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-500" />
            <span>{t('navSettings')}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            سياسات الأمان والتخزين المشفر، درجات السرية، ومصفوفة الصلاحيات (RBAC)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Confidentiality Matrix */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-400" />
            <span>مستويات السرية وأذونات الوصول (Confidentiality Levels)</span>
          </h3>

          <div className="space-y-3">
            {[
              { level: 'عام (Public)', rank: 'Rank 1', color: 'border-emerald-500/30 text-emerald-400', desc: 'متاح لكافة موظفي المؤسسة والزوار' },
              { level: 'داخلي (Internal)', rank: 'Rank 2', color: 'border-blue-500/30 text-blue-400', desc: 'متاح لمنسوبي الشركة فقط بعد تسجيل الدخول' },
              { level: 'سري (Confidential)', rank: 'Rank 3', color: 'border-amber-500/30 text-amber-400', desc: 'متاح لفريق تكنولوجيا المعلومات والإدارات المعنية' },
              { level: 'سري للغاية (Highly Confidential)', rank: 'Rank 4', color: 'border-rose-500/30 text-rose-400', desc: 'متاح لمدير IT ومسؤولي الأمن السيبراني بمصادقة MFA' }
            ].map(item => (
              <div key={item.level} className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className={`font-bold ${item.color.split(' ')[1]}`}>{item.level}</span>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                    {item.rank}
                  </span>
                </div>
                <p className="text-xs text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Private Storage & Architecture Rules */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-cyan-400" />
            <span>معايير التخزين والحفظ الرقمي (Storage Specs)</span>
          </h3>

          <div className="space-y-3 text-xs text-slate-300">
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
              <span className="font-bold text-slate-200 block">التخزين الخاص المنعزل (Private Storage):</span>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                الملفات المرفوعة مخزنة خارج المجلد العام تماماً ولا يمكن الوصول إليها إلا عبر توكن موثق ومسجل في سجل التدقيق.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
              <span className="font-bold text-slate-200 block">حساب البصمة الرقمية التلقائي:</span>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                يتم احتساب بصمة SHA-256 رقمية لكل ملف لمنع التلاعب (Tampering) والتحقق من النزاهة قبل التنزيل.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
              <span className="font-bold text-slate-200 block">دعم التوسع المستقبلي لـ OCR:</span>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                البنية التحتية مهيأة لربط محرك استخراج النصوص Tesseract OCR في المرحلة الثانية دون تعديل هيكل الوثيقة.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
