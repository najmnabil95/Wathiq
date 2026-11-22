import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  Shield, FileText, Lock, Search, GitBranch, Layers, CheckCircle2,
  ArrowRight, ArrowLeft, ExternalLink, Sparkles, Database, FileCheck,
  Printer, HardDrive, Users, Activity, QrCode, Cpu, ChevronDown,
  Fingerprint, Clock, AlertTriangle, ShieldCheck, Download, Copy,
  Check, Eye, LogIn, ChevronLeft, Building2, BarChart3, HelpCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, token, login, isLoading } = useAuthStore();
  const isAuthenticated = Boolean(token && user && user.id);

  const [activeTab, setActiveTab] = useState(0);
  const [activeLifecycle, setActiveLifecycle] = useState(0);
  const [openFaq, setOpenFaq] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [loggingRole, setLoggingRole] = useState(null);

  useEffect(() => {
    document.title = 'وثيق IT-EDMS | المنظومة المؤسسية لإدارة وأرشفة الوثائق الرقمية';
  }, []);

  // One-click demo login handler
  const handleQuickLogin = async (email, password, roleKey) => {
    setLoggingRole(roleKey);
    try {
      const res = await login(email, password, false);
      if (res.success) {
        toast.success(`تم الدخول بنجاح بصلاحية: ${roleKey}`);
        navigate('/', { replace: true });
      } else {
        toast.error(res.message || 'فشل تسجيل الدخول التجريبي');
      }
    } catch {
      toast.error('حدث خطأ أثناء محاولة تسجيل الدخول');
    } finally {
      setLoggingRole(null);
    }
  };

  const copyToClipboard = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    toast.success('تم نسخ البيانات للحافظة');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Simulated Document Showcase Data
  const sampleDocs = [
    {
      title: 'خطة التحول الرقمي الاستراتيجية 2026-2030',
      docNum: 'IT-DOC-2026-0018',
      origNum: 'ADM/TRN/2026/902',
      category: 'الخطط الاستراتيجية والسياسات',
      dept: 'الإدارة العامة لتقنية المعلومات',
      status: 'معتمد',
      statusColor: 'emerald',
      confidentiality: 'سري للغاية',
      confColor: 'rose',
      checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      date: '2026-11-15',
      pages: 48,
      size: '4.2 MB',
      verifiedChain: true,
      tags: ['استراتيجية', 'تحول رقمي', 'حوكمة تقنية']
    },
    {
      title: 'عقد توريد وصيانة البنية التحتية السحابية',
      docNum: 'IT-DOC-2026-0042',
      origNum: 'CNT-IT-8841-A',
      category: 'العقود والاتفاقيات والمشتريات',
      dept: 'قسم الشبكات والأنظمة السحابية',
      status: 'قيد المراجعة والاعتماد',
      statusColor: 'amber',
      confidentiality: 'داخلي',
      confColor: 'blue',
      checksum: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
      date: '2026-11-18',
      pages: 16,
      size: '1.8 MB',
      verifiedChain: true,
      tags: ['عقود', 'بنية تحتية', 'سحابة']
    },
    {
      title: 'محضر اجتماع لجنة التوجيه الأمني للأنظمة',
      docNum: 'IT-DOC-2026-0077',
      origNum: 'MIN-SEC-2026-12',
      category: 'المحاضر والقرارات الإدارية',
      dept: 'وحدة الأمن السيبراني والمخاطر',
      status: 'مؤرشف نهائياً',
      statusColor: 'violet',
      confidentiality: 'سري',
      confColor: 'amber',
      checksum: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
      date: '2026-11-20',
      pages: 6,
      size: '850 KB',
      verifiedChain: true,
      tags: ['أمن سيبراني', 'محضر', 'اعتماد نهائي']
    }
  ];

  // System Lifecycle Stages
  const lifecycleSteps = [
    {
      step: '01',
      title: 'الإنشاء والترميز الرقمي الآلي',
      short: 'الترميز الذكي',
      icon: FileText,
      color: 'blue',
      desc: 'توليد الرقم المرجعي الموحد فورياً بصيغة IT-DOC-{YEAR}-{SEQ} مع ربطه بالتصنيف الشجري، الفرع التنظيمي، ومستوى السرية المحدد.',
      points: ['ترقيم تسلسلي لا يتكرر ومقاوم للاختراق', 'إسناد تلقائي لمستوى السرية والتصنيف', 'توليد باركود و QR متجهي عالي الدقة']
    },
    {
      step: '02',
      title: 'الفحص المتقدم وحساب البصمة الرقمية',
      short: 'الفحص و OCR',
      icon: Cpu,
      color: 'cyan',
      desc: 'حساب تجزئة SHA-256 للمرفقات للتحقق من النزاهة، واستخراج النصوص العربية والإنجليزية فورياً عبر محرك OCR لدعم البحث الكامل.',
      points: ['بصمة تشفير SHA-256 فريدة لكل ملف', 'استخراج فوري للنصوص OCR مع معالجة اللغة العربية', 'التحقق التلقائي من نوع وصيغة الملفات']
    },
    {
      step: '03',
      title: 'مسارات الاعتماد والموافقات الإدارية',
      short: 'سير العمل المتعدد',
      icon: GitBranch,
      color: 'amber',
      desc: 'إحالة المعاملات عبر مسارات عمل مرنة بحسب الهيكل الوظيفي، مع إمكانية القبول أو الرفض أو طلب التعديل وتدوين الملاحظات الرسمية.',
      points: ['إشعارات فورية للمعتمدين والمخولين', 'سجل مراجعات وملاحظات زمنية متسلسلة', 'توقيع إلكتروني وتوثيق معتمد للمعاملة']
    },
    {
      step: '04',
      title: 'الأرشفة وتطبيق سياسات الاستبقاء',
      short: 'الأرشفة والحفظ',
      icon: HardDrive,
      color: 'emerald',
      desc: 'حفظ المستند في المستودع الرقمي المشفر وتحديد مدة الاستبقاء وسنوات الصلاحية وتاريخ الاستحقاق وفق المعايير المؤسسية.',
      points: ['تحديد موقع الحفظ المادي والرقمي', 'تطبيق الحجز القانوني (Legal Hold) عند الحاجة', 'منع أي تعديل لاحق على المستند المؤرشف']
    },
    {
      step: '05',
      title: 'سلاسل التدقيق والتصرف النهائي (Disposition)',
      short: 'الحوكمة والنزاهة',
      icon: ShieldCheck,
      color: 'violet',
      desc: 'توثيق كل حركة داخل سلسلة تجزئة التدقيق (Hash Chain) غير القابلة للتلاعب، مع إدارة إجراءات الإتلاف أو التمديد الآمنة.',
      points: ['سلسلة كتل تدقيق مشفرة (Tamper-Proof Audit)', 'محضر إتلاف رسمي معتمد برقم توثيقي', 'تصدير شامل لتقارير النزاهة والمطابقة']
    }
  ];

  // Core Pillars
  const features = [
    {
      icon: Shield,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10 border-blue-500/20',
      badge: 'الأمان والنزاهة',
      title: 'سلاسل التدقيق المشفرة (Audit Hash Chain)',
      desc: 'تسجيل غير قابل للتراجع أو التعديل لكل حركة في النظام مع ربطها بتجزئة تجعل أي محاولة عبث في قاعدة البيانات مكشوفة وفورية.'
    },
    {
      icon: Search,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10 border-cyan-500/20',
      badge: 'البحث الذكي',
      title: 'محرك OCR وفهرسة المحتوى الكاملة',
      desc: 'استخراج تلقائي لنصوص الوثائق الممسوحة ضوئياً وملفات PDF والصور والوورد، والبحث الفوري في محتوى الوثائق باللغتين العربية والإنجليزية.'
    },
    {
      icon: GitBranch,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20',
      badge: 'سير العمل',
      title: 'محرك الاعتمادات والموافقات متعدد المراحل',
      desc: 'إدارة متكاملة لدورة موافقة المستندات بين الإدارات والأقسام، مع إشعارات فورية وملاحظات توثيقية وتتبع لحالة كل توقيع.'
    },
    {
      icon: Building2,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
      badge: 'الهيكل المؤسسي',
      title: 'تصنيف شجري وإدارة الفروع والصلاحيات',
      desc: 'هيكل تنظيمي مرن يشمل المؤسسات، الإدارات العامة، الأقسام، والفروع الميدانية، مع نظام صلاحيات RBAC دقيق يحمي سرية الوثائق.'
    },
    {
      icon: Printer,
      color: 'text-violet-400',
      bg: 'bg-violet-500/10 border-violet-500/20',
      badge: 'الأرشفة الميدانية',
      title: 'استمارات رسمية وملصقات باركود حرارية',
      desc: 'طباعة استمارات توثيق A4 معتمدة مطابقة للمواصفات الحكومية، وملصقات استيكر باركود مخصصة لطابعات الرفوف وخزائن الحفظ المادي.'
    },
    {
      icon: Lock,
      color: 'text-rose-400',
      bg: 'bg-rose-500/10 border-rose-500/20',
      badge: 'الحوكمة القانونية',
      title: 'الحجز القانوني وسياسات الاستبقاء والإتلاف',
      desc: 'تطبيق الحجز القانوني (Legal Hold) الفوري لمنع الإتلاف، وجدول زمني مؤتمت لمدد الاستبقاء متوافق مع لوائح الأرشفة الوطنية.'
    }
  ];

  // Demo Accounts
  const demoAccounts = [
    {
      role: 'مدير عام النظام',
      roleEn: 'Super Admin',
      email: 'admin@edms.local',
      pass: 'ChangeMe@123',
      color: 'text-blue-400',
      bg: 'from-blue-500/10 to-indigo-500/5',
      border: 'border-blue-500/30',
      badge: 'صلاحيات كاملة وغير محدودة',
      desc: 'إدارة شاملة للمستخدمين، الصلاحيات، الإعدادات، التدقيق، وفحص النزاهة.'
    },
    {
      role: 'مدير تقنية المعلومات',
      roleEn: 'IT Manager',
      email: 'manager@edms.local',
      pass: 'Demo@123456',
      color: 'text-violet-400',
      bg: 'from-violet-500/10 to-purple-500/5',
      border: 'border-violet-500/30',
      badge: 'إشراف واعتمادات وإحصاءات',
      desc: 'اعتماد المعاملات، متابعة سير العمل، إدارة التصنيفات، واستعراض التقارير.'
    },
    {
      role: 'موظف الأرشفة والتوثيق',
      roleEn: 'Archivist / IT Staff',
      email: 'staff@edms.local',
      pass: 'Demo@123456',
      color: 'text-emerald-400',
      bg: 'from-emerald-500/10 to-teal-500/5',
      border: 'border-emerald-500/30',
      badge: 'إنشاء وأرشفة واستعلام',
      desc: 'إنشاء المستندات، رفع المرفقات، استخراج الباركود، والبحث والفلترة السريعة.'
    }
  ];

  // FAQ
  const faqs = [
    {
      q: 'كيف يضمن النظام عدم التلاعب بسجلات التدقيق أو حذف الوثائق؟',
      a: 'يستخدم النظام تقنية سلاسل التجزئة المشفرة (Audit Hash Chain) المبنية على معيار SHA-256؛ حيث يرتبط كل حدث في سجل التدقيق بالحدث الذي يسبقه برمز تجزئة رياضي. أي تعديل يدوي مباشر في قاعدة البيانات يؤدي فوراً إلى كسر السلسلة وظهور تنبيه فوري لمسؤولي النزاهة والمطابقة.'
    },
    {
      q: 'هل يدعم محرك البحث استخراج النصوص العربية من الصور والمستندات الورقية الممسوحة ضوئياً؟',
      a: 'نعم، المنظومة مزودة بمحرك استخراج نصوص متقدم (OCR) يدعم اللغة العربية بكفاءة عالية، مع تطبيع الحروف (Normalisation) لضمان العثور على الوثيقة حتى مع اختلاف الهمزات والتاء المربوطة والألف المقصورة.'
    },
    {
      q: 'ما هي معايير مستويات السرية وكيف يتم عزل الصلاحيات بين الإدارات؟',
      a: 'يوفر النظام 4 مستويات سرية معتمدة (عام، داخلي، سري، سري للغاية). يعتمد النظام على معمارية RBAC دقيقة؛ فلا يمكن لأي موظف الاطلاع على وثيقة تتجاوز تصريحه الأمني، كما يتم حجب وثائق الأقسام الأخرى تلقائياً ما لم يُمنح المستخدم تصريح عرض شامل للإدارات.'
    },
    {
      q: 'هل يمكن تشغيل النظام على خادم داخلي (On-Premise) دون الحاجة لاتصال بالإنترنت؟',
      a: 'بكل تأكيد؛ تم تصميم IT-EDMS ليعمل كـ Single-Artifact Monolith مستقل على خوادم المؤسسة المحلية (Local Network / Intranet) بكامل وظائفه وقواعد بياناته ومحركات استخراج النصوص والتخزين بأعلى درجات الخصوصية والأمان السيبراني.'
    },
    {
      q: 'كيف تتم طباعة الباركود والاستمارات الرسمية للأرشيف المادي؟',
      a: 'يقدم النظام خيارين متقدمين: استمارة توثيق قياسية بصيغة A4 تحتوي على ملخص الوثيقة وأختام الاعتماد وتوقيعات الاستلام مع باركود متجهي دقيق، بالإضافة إلى ملصقات باركود حرارية صغيرة قابلة للطباعة المباشرة على طابعات الاستيكرات لتثبيتها على الملفات ورفوف الأرشيف الميداني.'
    }
  ];

  return (
    <div className="min-h-screen text-slate-100 selection:bg-blue-500/30 selection:text-blue-200 relative overflow-hidden" style={{ direction: 'rtl', fontFamily: 'var(--font-sans)' }}>
      
      {/* ── Background Gradients & Noise ───────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-1/4 w-[650px] h-[650px] rounded-full bg-blue-600/[0.07] blur-[140px]" />
        <div className="absolute top-[35%] left-1/5 w-[550px] h-[550px] rounded-full bg-purple-600/[0.05] blur-[150px]" />
        <div className="absolute bottom-10 right-1/3 w-[600px] h-[600px] rounded-full bg-emerald-600/[0.04] blur-[160px]" />
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.022]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)',
            backgroundSize: '48px 48px'
          }}
        />
        {/* Accent top gradient line */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
      </div>

      {/* ── Navigation Header ────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-white/[0.07] bg-[#070b16]/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3.5 group">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center relative transition-transform duration-300 group-hover:scale-105"
                 style={{
                   background: 'linear-gradient(135deg, rgba(59,130,246,0.25), rgba(139,92,246,0.2))',
                   border: '1px solid rgba(59,130,246,0.35)',
                   boxShadow: '0 0 25px rgba(59,130,246,0.25), inset 0 1px 0 rgba(255,255,255,0.15)'
                 }}>
              <Shield size={24} className="text-blue-400 group-hover:rotate-6 transition-transform" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-white">وثيق IT-EDMS</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/25">
                  مؤسسي v2.0
                </span>
              </div>
              <p className="text-xs text-slate-400">نظام إدارة وأرشفة الوثائق الإلكترونية</p>
            </div>
          </Link>

          {/* Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-blue-400 transition-colors">المميزات</a>
            <a href="#showcase" className="hover:text-blue-400 transition-colors">نموذج حي</a>
            <a href="#lifecycle" className="hover:text-blue-400 transition-colors">دورة حياة الوثيقة</a>
            <a href="#demo" className="hover:text-blue-400 transition-colors">الحسابات التجريبية</a>
            <a href="#faq" className="hover:text-blue-400 transition-colors">الأسئلة الشائعة</a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                to="/"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-500/20 border border-blue-400/30 transition-all hover:scale-[1.02]"
              >
                <span>لوحة التحكم ({user?.name?.split(' ')[0] || 'حسابي'})</span>
                <ArrowLeft size={16} />
              </Link>
            ) : (
              <>
                <a
                  href="#demo"
                  className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-all"
                >
                  <Sparkles size={14} className="text-amber-400" />
                  <span>حسابات تجريبية</span>
                </a>
                <Link
                  to="/login"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold text-sm shadow-lg shadow-blue-500/25 border border-blue-400/30 transition-all hover:scale-[1.02]"
                >
                  <LogIn size={16} />
                  <span>تسجيل الدخول</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero Section ────────────────────────────────────────────── */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto z-10">
        <div className="text-center max-w-4xl mx-auto">
          
          {/* Top Pill Announcement */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-300 text-xs font-semibold mb-6 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>المنظومة المؤسسية المعتمدة لحفظ وإدارة وتوثيق المعاملات</span>
            <span className="text-white/40">|</span>
            <span className="text-slate-300">توافق كامل مع ISO 15489</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.25] tracking-tight mb-6">
            التحول الرقمي الكامل لأرشيف مؤسستك{' '}
            <span className="bg-gradient-to-l from-blue-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
              بأعلى معايير الأمان والنزاهة
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg lg:text-xl text-slate-300/90 leading-relaxed font-normal mb-10 max-w-3xl mx-auto">
            منظومة وثيق <strong className="text-white font-bold">IT-EDMS</strong> تجمع بين سهولة الأرشفة وسرعة محرك البحث المتقدم OCR،
            مع سلاسل تدقيق مشفرة <span className="font-mono text-blue-300 text-sm">SHA-256 Hash Chain</span>، ومسارات اعتماد إدارية ذكية تضمن النزاهة المؤسسية الكاملة.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-14">
            <Link
              to={isAuthenticated ? "/" : "/login"}
              className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-base shadow-xl shadow-blue-500/30 border border-blue-300/30 transition-all hover:scale-[1.03]"
            >
              <LogIn size={20} />
              <span>{isAuthenticated ? 'الانتقال للوحة التحكم' : 'الدخول إلى المنظومة'}</span>
              <ArrowLeft size={18} />
            </Link>

            <a
              href="#showcase"
              className="flex items-center gap-2.5 px-7 py-4 rounded-2xl bg-white/[0.05] hover:bg-white/[0.09] text-slate-200 hover:text-white font-bold text-base border border-white/10 transition-all"
            >
              <Eye size={18} className="text-blue-400" />
              <span>استعراض نموذج حي للوثائق</span>
            </a>

            <a
              href="#demo"
              className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-bold text-sm border border-amber-500/25 transition-all"
            >
              <Sparkles size={16} />
              <span>تجربة فورية بالحسابات</span>
            </a>
          </div>

          {/* Trust Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 rounded-2xl bg-white/[0.02] border border-white/[0.07] backdrop-blur-md max-w-3xl mx-auto text-right sm:text-center">
            <div className="p-3">
              <div className="text-2xl font-black text-blue-400 font-mono">100%</div>
              <div className="text-xs text-slate-400 font-medium mt-1">نزاهة سلاسل التدقيق المشفرة</div>
            </div>
            <div className="p-3 border-r border-white/[0.06]">
              <div className="text-2xl font-black text-emerald-400 font-mono">SHA-256</div>
              <div className="text-xs text-slate-400 font-medium mt-1">فحص البصمة الرقمية للمرفقات</div>
            </div>
            <div className="p-3 border-r border-white/[0.06]">
              <div className="text-2xl font-black text-violet-400 font-mono">OCR + AI</div>
              <div className="text-xs text-slate-400 font-medium mt-1">استخراج وبحث النصوص العربية</div>
            </div>
            <div className="p-3 border-r border-white/[0.06]">
              <div className="text-2xl font-black text-amber-400 font-mono">RBAC</div>
              <div className="text-xs text-slate-400 font-medium mt-1">4 مستويات سرية وعزل صلاحيات</div>
            </div>
          </div>

        </div>

        {/* ── Interactive Live Document Showcase ─────────────────────── */}
        <div id="showcase" className="mt-16 sm:mt-24 max-w-5xl mx-auto relative scroll-mt-28">
          
          {/* Subtle Outer Glow */}
          <div className="absolute -inset-1.5 rounded-3xl bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-emerald-500/20 blur-xl opacity-75 pointer-events-none" />

          {/* Showcase Container Window */}
          <div className="relative rounded-3xl bg-[#090e1d]/90 border border-white/[0.12] shadow-2xl overflow-hidden backdrop-blur-xl">
            
            {/* Window Header */}
            <div className="px-6 py-4 border-b border-white/[0.08] bg-white/[0.02] flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>
                <div className="h-4 w-px bg-white/10 mx-1" />
                <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                  <Activity size={13} className="text-emerald-400" />
                  it-edms.secure.vault/v2/preview
                </span>
              </div>

              {/* Document Tabs */}
              <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/[0.06]">
                {sampleDocs.map((doc, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveTab(idx)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      activeTab === idx
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]'
                    }`}
                  >
                    نموذج #{idx + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Document Content Details */}
            <div className="p-6 sm:p-8">
              {(() => {
                const doc = sampleDocs[activeTab];
                return (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* Left/Main Column: Document Card */}
                    <div className="lg:col-span-8 space-y-6">
                      
                      {/* Top Badges */}
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="font-mono text-xs font-bold px-3 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/25">
                          {doc.docNum}
                        </span>
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md ${
                          doc.statusColor === 'emerald' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' :
                          doc.statusColor === 'amber' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25' :
                          'bg-violet-500/10 text-violet-400 border border-violet-500/25'
                        }`}>
                          ● {doc.status}
                        </span>
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md ${
                          doc.confColor === 'rose' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/25' :
                          doc.confColor === 'amber' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25' :
                          'bg-blue-500/10 text-blue-400 border border-blue-500/25'
                        }`}>
                          مستوى السرية: {doc.confidentiality}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="text-xl sm:text-2xl font-black text-white leading-snug">
                        {doc.title}
                      </h3>

                      {/* Meta Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                        <div>
                          <span className="text-[11px] text-slate-400 block mb-0.5">الرقم المرجعي الإداري</span>
                          <span className="font-mono text-xs font-semibold text-slate-200">{doc.origNum}</span>
                        </div>
                        <div>
                          <span className="text-[11px] text-slate-400 block mb-0.5">التصنيف الموضوعي</span>
                          <span className="text-xs font-semibold text-slate-200">{doc.category}</span>
                        </div>
                        <div>
                          <span className="text-[11px] text-slate-400 block mb-0.5">الإدارة المالكة للوثيقة</span>
                          <span className="text-xs font-semibold text-slate-200">{doc.dept}</span>
                        </div>
                        <div>
                          <span className="text-[11px] text-slate-400 block mb-0.5">تاريخ التوثيق الرقمي</span>
                          <span className="font-mono text-xs font-semibold text-slate-200">{doc.date}</span>
                        </div>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-slate-400">الكلمات المفتاحية:</span>
                        {doc.tags.map((t, i) => (
                          <span key={i} className="text-xs px-2.5 py-0.5 rounded-md bg-white/[0.05] text-slate-300 border border-white/[0.08]">
                            #{t}
                          </span>
                        ))}
                      </div>

                      {/* Cryptographic Proof Banner */}
                      <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-500/20 text-xs">
                        <div className="flex items-center gap-2 mb-1.5 text-blue-300 font-bold">
                          <ShieldCheck size={16} className="text-emerald-400" />
                          <span>سلسلة التدقيق الرقمية (SHA-256 Checksum Verified)</span>
                        </div>
                        <div className="font-mono text-[11px] text-slate-400 break-all bg-black/40 p-2 rounded-lg border border-white/[0.05]">
                          {doc.checksum}
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Physical & Thermal Barcode Sticker Preview */}
                    <div className="lg:col-span-4 p-5 rounded-2xl bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/[0.08] space-y-4">
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                          <QrCode size={16} className="text-blue-400" />
                          ملصق الباركود الميداني
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-slate-300">
                          A4 / Thermal
                        </span>
                      </div>

                      {/* Realistic Thermal Barcode Card */}
                      <div className="bg-slate-100 text-slate-900 p-4 rounded-xl shadow-lg border border-slate-300 space-y-2.5 text-center font-sans">
                        <div className="text-[10px] font-bold text-slate-600 border-b border-slate-300 pb-1">
                          المملكة — الأرشيف الإلكتروني IT-EDMS
                        </div>
                        <div className="text-sm font-black text-slate-900 tracking-tight">
                          {doc.docNum}
                        </div>
                        {/* Simulated Barcode */}
                        <div className="py-2 px-3 bg-white rounded border border-slate-200 flex flex-col items-center">
                          <div className="h-10 w-full flex items-center justify-center gap-0.5">
                            {[4,2,6,1,3,5,2,4,1,7,3,2,6,4,2,5,1,3,4,6,2,3,5,1,4,2,6].map((w, i) => (
                              <div
                                key={i}
                                className="bg-black h-full"
                                style={{ width: `${w}px` }}
                              />
                            ))}
                          </div>
                          <span className="font-mono text-[10px] text-slate-600 mt-1 tracking-widest">{doc.docNum}</span>
                        </div>
                        <div className="text-[9px] text-slate-500 flex justify-between px-1">
                          <span>السرية: {doc.confidentiality}</span>
                          <span>الحجم: {doc.size}</span>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-400 leading-relaxed text-right">
                        💡 يتيح النظام توليد ملصقات الباركود وطباعة استمارات الحفظ الرسمية A4 مباشرة مع رمز QR لربط الأرشيف الورقي والمادي بالنظام الرقمي.
                      </div>

                      <Link
                        to={isAuthenticated ? "/" : "/login"}
                        className="w-full py-2.5 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 text-xs font-bold border border-blue-500/30 flex items-center justify-center gap-2 transition-all"
                      >
                        <span>فتح الوثيقة في لوحة التحكم</span>
                        <ExternalLink size={13} />
                      </Link>
                    </div>

                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </section>

      {/* ── Key Features Grid ────────────────────────────────────────── */}
      <section id="features" className="py-20 md:py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto z-10 relative scroll-mt-20">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold px-3.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/25">
            القدرات والمعمارية التقنية
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-white mt-4 mb-4">
            مميزات هندسية تلبي أرقى معايير إدارة الوثائق الحكومية
          </h2>
          <p className="text-sm sm:text-base text-slate-400">
            تم بناء المنظومة لتعمل بتوافق فائق مع اللوائح الإدارية والتنظيمية الصارمة، موفرةً درعاً أمنياً متيناً لكافة أصول المنشأة المعرفية.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="group relative rounded-2xl p-6 sm:p-7 bg-white/[0.025] hover:bg-white/[0.045] border border-white/[0.08] hover:border-white/[0.16] backdrop-blur-md transition-all duration-300 hover:-translate-y-1"
              >
                {/* Accent glow on hover */}
                <div className="absolute top-0 right-0 w-24 h-24 rounded-bl-full bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors pointer-events-none" />

                <div className="flex items-center justify-between mb-5">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${feat.bg}`}>
                    <Icon size={24} className={feat.color} />
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white/[0.04] text-slate-300 border border-white/[0.06]">
                    {feat.badge}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white mb-2.5 group-hover:text-blue-300 transition-colors">
                  {feat.title}
                </h3>

                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  {feat.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Interactive Document Lifecycle ──────────────────────────── */}
      <section id="lifecycle" className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto z-10 relative scroll-mt-20">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold px-3.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
            دورة حياة الوثيقة الرقمية
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-white mt-4 mb-4">
            من لحظة الإنشاء وحتى الأرشفة أو الاستبعاد النظامي
          </h2>
          <p className="text-sm sm:text-base text-slate-400">
            مسار إجرائي محكم يضمن سلامة المعاملة الإدارية وتوثيق كل مرحلة زمنياً ورقمياً بصورة غير قابلة للإنكار.
          </p>
        </div>

        {/* Stepper Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-10">
          {lifecycleSteps.map((step, idx) => (
            <button
              key={idx}
              onClick={() => setActiveLifecycle(idx)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeLifecycle === idx
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25 border border-blue-400/40 scale-105'
                  : 'bg-white/[0.03] text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] border border-white/[0.06]'
              }`}
            >
              <span className="font-mono text-xs opacity-75">{step.step}.</span>
              <span>{step.short}</span>
            </button>
          ))}
        </div>

        {/* Active Stage Card */}
        {(() => {
          const cur = lifecycleSteps[activeLifecycle];
          const Icon = cur.icon;
          return (
            <div className="max-w-4xl mx-auto p-8 rounded-3xl bg-gradient-to-b from-white/[0.04] to-white/[0.015] border border-white/[0.1] backdrop-blur-xl relative overflow-hidden shadow-2xl">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-white/[0.08]">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400">
                    <Icon size={28} />
                  </div>
                  <div>
                    <span className="text-xs font-mono font-bold text-blue-400">المرحلة {cur.step} من 05</span>
                    <h3 className="text-xl sm:text-2xl font-black text-white mt-0.5">{cur.title}</h3>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    disabled={activeLifecycle === 0}
                    onClick={() => setActiveLifecycle(p => p - 1)}
                    className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] disabled:opacity-30 disabled:cursor-not-allowed text-slate-300"
                  >
                    <ArrowRight size={18} />
                  </button>
                  <button
                    disabled={activeLifecycle === lifecycleSteps.length - 1}
                    onClick={() => setActiveLifecycle(p => p + 1)}
                    className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] disabled:opacity-30 disabled:cursor-not-allowed text-slate-300"
                  >
                    <ArrowLeft size={18} />
                  </button>
                </div>
              </div>

              <div className="py-6 space-y-4">
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                  {cur.desc}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  {cur.points.map((pt, i) => (
                    <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                      <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                      <span className="text-xs text-slate-300 font-medium">{pt}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400">
                <span>تطبيق تلقائي لمعايير الحوكمة والتحكم بالوصول</span>
                <Link to="/login" className="text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1">
                  <span>تجربة المرحلة في النظام</span>
                  <ChevronLeft size={14} />
                </Link>
              </div>
            </div>
          );
        })()}
      </section>

      {/* ── Demo Accounts Section ───────────────────────────────────── */}
      <section id="demo" className="py-20 md:py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto z-10 relative scroll-mt-20">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/25 text-xs font-bold mb-4">
            <Sparkles size={14} />
            <span>بيئة تجريبية تفاعلية متاحة الآن</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-white mb-4">
            سجّل دخولك فوراً وجرّب المنظومة بمختلف الأدوار
          </h2>
          <p className="text-sm sm:text-base text-slate-400">
            يمكنك الدخول بنقرة واحدة باستخدام أي من الحسابات التجريبية المعدّة مسبقاً لاستكشاف الصلاحيات والواجهات.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {demoAccounts.map((acc, idx) => (
            <div
              key={idx}
              className={`rounded-2xl p-6 sm:p-7 bg-gradient-to-b ${acc.bg} border ${acc.border} backdrop-blur-xl relative overflow-hidden flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-base font-black ${acc.color}`}>
                    {acc.role}
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white/10 text-slate-300">
                    {acc.roleEn}
                  </span>
                </div>

                <div className="text-xs font-semibold px-2.5 py-1 rounded-md bg-white/[0.04] text-slate-200 border border-white/[0.08] inline-block mb-3">
                  {acc.badge}
                </div>

                <p className="text-xs text-slate-400 leading-relaxed mb-6">
                  {acc.desc}
                </p>

                {/* Credentials Display */}
                <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.06] space-y-2 mb-6 font-mono text-xs">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-[11px] text-slate-400 font-sans">البريد:</span>
                    <span className="text-blue-300 font-semibold">{acc.email}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-[11px] text-slate-400 font-sans">المرور:</span>
                    <span className="text-slate-300">{acc.pass}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  disabled={isLoading && loggingRole === acc.role}
                  onClick={() => handleQuickLogin(acc.email, acc.pass, acc.role)}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/20 border border-blue-400/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                >
                  <LogIn size={15} />
                  <span>
                    {isLoading && loggingRole === acc.role ? 'جاري الدخول...' : `دخول فوري كـ ${acc.role}`}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => copyToClipboard(`البريد: ${acc.email}\nكلمة المرور: ${acc.pass}`, idx)}
                  className="w-full py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-slate-200 text-xs font-semibold border border-white/[0.06] flex items-center justify-center gap-1.5 transition-all"
                >
                  {copiedIndex === idx ? (
                    <>
                      <Check size={14} className="text-emerald-400" />
                      <span className="text-emerald-400">تم النسخ بنجاح</span>
                    </>
                  ) : (
                    <>
                      <Copy size={13} />
                      <span>نسخ بيانات الدخول</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ Section ─────────────────────────────────────────────── */}
      <section id="faq" className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto z-10 relative scroll-mt-20">
        
        <div className="text-center mb-14">
          <span className="text-xs font-bold px-3.5 py-1 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/25">
            الأسئلة الشائعة
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-white mt-4 mb-4">
            إجابات وافية حول أمان ومعمارية المنظومة
          </h2>
          <p className="text-sm text-slate-400">
            كل ما تود معرفته عن الامتثال والخصوصية والتكامل التقني لمنظومة IT-EDMS.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="rounded-2xl bg-white/[0.025] border border-white/[0.08] backdrop-blur-md overflow-hidden transition-all"
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full p-5 sm:p-6 text-right flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-white hover:text-blue-300 transition-colors"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  size={18}
                  className={`text-slate-400 transition-transform duration-300 shrink-0 ${
                    openFaq === idx ? 'rotate-180 text-blue-400' : ''
                  }`}
                />
              </button>

              {openFaq === idx && (
                <div className="px-5 pb-6 sm:px-6 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-white/[0.05] pt-4 animate-fade-in">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ──────────────────────────────────────────────── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto z-10 relative">
        <div className="rounded-3xl p-8 sm:p-12 bg-gradient-to-r from-blue-600/30 via-indigo-600/30 to-purple-600/30 border border-blue-500/30 backdrop-blur-2xl text-center relative overflow-hidden shadow-2xl">
          
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

          <h2 className="text-2xl sm:text-4xl font-black text-white mb-4 relative z-10">
            جاهز لإرساء أعلى معايير الحوكمة الرقمية لأرشيفك؟
          </h2>
          <p className="text-sm sm:text-base text-slate-200 max-w-2xl mx-auto mb-8 relative z-10">
            انضم إلى منظومة وثيق اليوم واستمتع بتجربة أرشفة موثوقة وسريعة ومتوافقة مع أعلى معايير أمان البيانات الوطنية.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 relative z-10">
            <Link
              to={isAuthenticated ? "/" : "/login"}
              className="flex items-center gap-2.5 px-8 py-3.5 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-black text-sm sm:text-base shadow-xl transition-all hover:scale-105"
            >
              <LogIn size={18} className="text-blue-600" />
              <span>{isAuthenticated ? 'لوحة التحكم الرئيسية' : 'تسجيل الدخول للنظام'}</span>
              <ArrowLeft size={16} />
            </Link>

            <a
              href="#showcase"
              className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/20 transition-all"
            >
              استعراض النماذج الحية
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.08] bg-[#050810]/95 py-12 px-4 sm:px-6 lg:px-8 text-xs text-slate-400 z-10 relative">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400 font-bold">
              <Shield size={18} />
            </div>
            <div>
              <div className="font-bold text-white text-sm">نظام وثيق IT-EDMS</div>
              <div className="text-[11px] text-slate-400">قسم تقنية المعلومات والأنظمة المؤسسية</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">المميزات</a>
            <a href="#showcase" className="hover:text-white transition-colors">النماذج</a>
            <a href="#lifecycle" className="hover:text-white transition-colors">مسار العمل</a>
            <a href="#demo" className="hover:text-white transition-colors">الحسابات التجريبية</a>
            <a href="#faq" className="hover:text-white transition-colors">الأسئلة الشائعة</a>
            <Link to="/login" className="text-blue-400 hover:text-blue-300 font-bold">تسجيل الدخول</Link>
          </div>

          <div className="text-center md:text-left text-[11px] text-slate-400">
            جميع الحقوق محفوظة &copy; {new Date().getFullYear()} منظومة وثيق للأرشفة الرقمية
          </div>

        </div>
      </footer>

    </div>
  );
}
