import { Link } from 'react-router-dom';
import {
  FilePlus2, PenLine, Clock, CheckCircle2, Archive, Trash2,
  XCircle, ArrowLeft, GitBranch, Bell, UserCheck, Lock,
} from 'lucide-react';

const TONES = {
  blue:    'bg-blue-500/10 text-blue-400 border-blue-500/20',
  cyan:    'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  amber:   'bg-amber-500/10 text-amber-400 border-amber-500/20',
  emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  violet:  'bg-violet-500/10 text-violet-400 border-violet-500/20',
  slate:   'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

const STEPS = [
  {
    title: 'الإنشاء',
    status: 'جديد',
    icon: FilePlus2,
    tone: 'blue',
    description: 'تسجيل الوثيقة وتوليد الرقم المرجعي.',
  },
  {
    title: 'التجهيز',
    status: 'قيد التنفيذ',
    icon: PenLine,
    tone: 'cyan',
    description: 'استكمال البيانات والمرفقات.',
  },
  {
    title: 'الاعتماد',
    status: 'بانتظار الاعتماد',
    icon: Clock,
    tone: 'amber',
    description: 'إحالة عبر المسار حتى القرار.',
  },
  {
    title: 'الإغلاق',
    status: 'مكتمل',
    icon: CheckCircle2,
    tone: 'blue',
    description: 'إغلاق المعاملة بعد اكتمال المراحل.',
  },
  {
    title: 'الأرشفة',
    status: 'مؤرشف',
    icon: Archive,
    tone: 'violet',
    description: 'حفظ دائم وتثبيت موقع الاستبقاء.',
  },
  {
    title: 'الاستبعاد',
    status: 'إتلاف / تمديد',
    icon: Trash2,
    tone: 'slate',
    description: 'معالجة عند انتهاء مدة الاحتفاظ.',
  },
];

const APPROVAL = [
  { icon: GitBranch, label: 'إحالة للاعتماد' },
  { icon: Bell, label: 'إشعار المعتمد' },
  { icon: UserCheck, label: 'اعتماد المرحلة' },
  { icon: CheckCircle2, label: 'اعتماد نهائي' },
];

function FlowNode({ step, index }) {
  const Icon = step.icon;
  return (
    <div className="relative flex items-start gap-3 xl:flex-col xl:items-center xl:text-center flex-1">
      {index < STEPS.length - 1 && (
        <>
          <span className="hidden xl:block absolute top-[22px] right-1/2 w-full h-px bg-slate-700/70" />
          <span className="xl:hidden absolute top-11 right-[22px] bottom-[-20px] w-px bg-slate-700/70" />
        </>
      )}
      <div className="relative z-10 shrink-0">
        <span className={`w-11 h-11 rounded-2xl border flex items-center justify-center ${TONES[step.tone]}`}>
          <Icon className="w-5 h-5" />
        </span>
        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-slate-800 border border-slate-700 text-[10px] font-mono text-slate-300 flex items-center justify-center">
          {index + 1}
        </span>
      </div>
      <div className="min-w-0 xl:mt-2.5">
        <h2 className="text-[15px] sm:text-sm font-bold text-white">{step.title}</h2>
        <p className="text-[11px] sm:text-[10px] text-slate-500">{step.status}</p>
        <p className="text-[13px] sm:text-xs text-slate-400 leading-relaxed mt-1 sm:mt-0.5 xl:max-w-[150px]">{step.description}</p>
      </div>
    </div>
  );
}

export default function SystemFlowPage() {
  return (
    <div className="space-y-5 pb-12 animate-fade-in" style={{ direction: 'rtl' }}>
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-5 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <GitBranch className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">مخطط سير العمل</h1>
          </div>
          <p className="text-[13px] sm:text-xs text-slate-400">
            دورة الوثيقة من الإنشاء إلى الإتلاف — باختصار.
          </p>
        </div>
        <span className="badge badge-indigo self-start sm:self-auto">ISO 15489</span>
      </div>

      {/* ── Flow Diagram ── */}
      <section className="glass p-5 sm:p-6">
        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-start xl:gap-0">
          {STEPS.map((step, index) => (
            <FlowNode key={step.title} step={step} index={index} />
          ))}
        </div>

        <div className="grid sm:grid-cols-2 gap-2.5 mt-5 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-2 text-xs sm:text-[11px] text-rose-400">
            <XCircle className="w-4 h-4 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
            الرفض يعيد الوثيقة إلى مرحلة التجهيز مع الأسباب
          </div>
          <div className="flex items-center gap-2 text-xs sm:text-[11px] text-amber-400">
            <Lock className="w-4 h-4 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
            الحجز القانوني يمنع الاستبعاد ويوقف الإجراء
          </div>
        </div>
      </section>

      {/* ── Approval Path ── */}
      <section className="glass p-5">
        <h2 className="text-[15px] sm:text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-indigo-400" />
          مسار الاعتماد
        </h2>
        <div className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
          {APPROVAL.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.label} className="flex flex-col items-center gap-1 sm:flex-row sm:gap-2">
                <span className="w-full sm:w-auto flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-slate-800 bg-slate-900/50 text-[13px] sm:text-xs font-semibold text-slate-200">
                  <Icon className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-indigo-400" />
                  {step.label}
                </span>
                {index < APPROVAL.length - 1 && <ArrowLeft className="w-4 h-4 text-slate-500 -rotate-90 sm:rotate-0" />}
              </div>
            );
          })}
        </div>
        <p className="text-xs sm:text-[11px] text-slate-500 mt-3">
          المسار قد يتضمن عدة مستويات حسب قالب سير العمل، مع إمكانية التفويض أو الرفض مع الأسباب.
        </p>
      </section>

      {/* ── Links ── */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] sm:text-xs font-semibold">
        <Link to="/documents" className="text-blue-400 hover:text-blue-300 transition">الوثائق</Link>
        <Link to="/workflows" className="text-indigo-400 hover:text-indigo-300 transition">قوالب سير العمل</Link>
        <Link to="/disposition" className="text-amber-400 hover:text-amber-300 transition">الاستبعاد والاستبقاء</Link>
      </div>
    </div>
  );
}
