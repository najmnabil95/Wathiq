import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import {
  FileText, FolderOpen, Clock, CheckCircle2, Archive,
  TrendingUp, Users, AlertCircle, Plus, Eye,
  KeyRound, Video, RefreshCw, Activity, ArrowLeft,
  BarChart3, PieChart, Shield, Building2, Check,
  ChevronLeft, Sparkles, Layers, ShieldCheck
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

// ── Status config ────────────────────────────────────────────
const STATUS_CONFIG = {
  new:              { label: 'جديد',              class: 'badge-blue'    },
  in_progress:      { label: 'قيد التنفيذ',       class: 'badge-amber'   },
  pending_approval: { label: 'بانتظار الاعتماد',  class: 'badge-amber'   },
  approved:         { label: 'معتمد',             class: 'badge-green'   },
  completed:        { label: 'مكتمل',             class: 'badge-emerald' },
  rejected:         { label: 'مرفوض',             class: 'badge-red'     },
  cancelled:        { label: 'ملغي',              class: 'badge-gray'    },
  archived:         { label: 'مؤرشف',             class: 'badge-slate'   },
};

const PALETTE = [
  '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b',
  '#ec4899', '#06b6d4', '#f97316', '#64748b'
];

const formatMonthName = (monthStr) => {
  if (!monthStr) return '';
  const [year, month] = monthStr.split('-');
  const monthNames = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];
  const idx = parseInt(month, 10) - 1;
  return `${monthNames[idx] || month} ${year}`;
};

// ── Stat Card ────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color, delay = 0, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`glass stat-card card-hover-lift glow-on-hover p-4 sm:p-5 animate-fade-in stagger-${delay} press-effect group ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <div className="flex items-start justify-between gap-3 relative z-10">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] sm:text-xs font-semibold mb-1.5 uppercase tracking-wider text-slate-400 group-hover:text-blue-300 transition-colors">
            {label}
          </p>
          <p className="text-2xl sm:text-3xl font-black text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-blue-200 transition-all" style={{ lineHeight: 1 }}>
            {value ?? <span className="skeleton inline-block w-12 h-7 rounded" />}
          </p>
          {sub && <p className="text-[11px] mt-2 text-slate-400 group-hover:text-slate-300 transition-colors">{sub}</p>}
        </div>
        <div
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-lg"
          style={{
            background: `rgba(${color},0.16)`,
            border: `1px solid rgba(${color},0.3)`,
            boxShadow: `0 0 20px rgba(${color},0.12)`,
          }}
        >
          <Icon className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 group-hover:scale-110" style={{ color: `rgb(${color})` }} />
        </div>
      </div>
    </div>
  );
}

// ── Monthly Growth Interactive Bar Chart ─────────────────────
function MonthlyTrendChart({ data = [] }) {
  const [hoveredBar, setHoveredBar] = useState(null);
  const navigate = useNavigate();

  // Real timeline of last 6 months with actual database counts (0 for months without documents)
  const chartData = (() => {
    if (data && data.length >= 6) return data.slice(-6);
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const found = Array.isArray(data) ? data.find(item => item.month === mStr) : null;
      months.push({
        month: mStr,
        total: found ? (Number(found.total) || 0) : 0,
      });
    }
    return months;
  })();

  const maxVal = Math.max(...chartData.map(d => d.total), 1);

  return (
    <div className="glass p-5 rounded-2xl flex flex-col justify-between h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/25 flex items-center justify-center text-blue-400">
            <TrendingUp size={16} />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-100">نمو وتدفق الوثائق شهرياً</h3>
            <p className="text-[11px] text-slate-400">حركة إدخال وأرشفة الوثائق على مدار الأشهر</p>
          </div>
        </div>

        {hoveredBar !== null && (
          <div className="text-left animate-fade-in" dir="ltr">
            <span className="text-xs font-mono font-bold text-blue-400">{chartData[hoveredBar]?.total} docs</span>
            <span className="text-[10px] text-slate-400 block">{chartData[hoveredBar]?.month}</span>
          </div>
        )}
      </div>

      {/* SVG / Bar Columns Container */}
      <div className="relative pt-6 pb-2">
        {/* Background Grid Lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-10">
          <div className="border-b border-white" />
          <div className="border-b border-white" />
          <div className="border-b border-white" />
        </div>

        {/* Bars */}
        <div className="grid grid-cols-6 gap-2 sm:gap-4 items-end h-40 relative z-10 px-2">
          {chartData.slice(-6).map((item, idx) => {
            const heightPct = Math.max(Math.round((item.total / maxVal) * 100), 12);
            const isHovered = hoveredBar === idx;

            return (
              <div
                key={idx}
                className="flex flex-col items-center gap-2 h-full justify-end group cursor-pointer"
                onMouseEnter={() => setHoveredBar(idx)}
                onMouseLeave={() => setHoveredBar(null)}
                onClick={() => navigate('/documents')}
              >
                {/* Tooltip on bar */}
                <div
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded transition-all duration-200 ${
                    isHovered
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-110 -translate-y-1'
                      : 'text-slate-400 opacity-80'
                  }`}
                >
                  {item.total}
                </div>

                {/* Animated Bar Column */}
                <div className="w-full max-w-[36px] bg-slate-800/60 rounded-t-lg overflow-hidden flex items-end h-full">
                  <div
                    className="w-full rounded-t-lg transition-all duration-500 ease-out"
                    style={{
                      height: `${heightPct}%`,
                      background: isHovered
                        ? 'linear-gradient(180deg, #60a5fa 0%, #2563eb 100%)'
                        : 'linear-gradient(180deg, rgba(59,130,246,0.85) 0%, rgba(37,99,235,0.4) 100%)',
                      boxShadow: isHovered ? '0 0 20px rgba(59,130,246,0.5)' : 'none',
                    }}
                  />
                </div>

                {/* Month Label */}
                <span className="text-[10px] font-mono text-slate-400 group-hover:text-blue-400 transition-colors truncate max-w-full">
                  {formatMonthName(item.month).split(' ')[0]}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Category Distribution Interactive Donut Chart ───────────
function CategoryDonutChart({ data = [], total = 0 }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const navigate = useNavigate();

  const categories = data.length > 0 ? data : [
    { name_ar: 'تعديلات الأنظمة', total: 3, color: 'blue' },
    { name_ar: 'التوجيهات والتعليمات', total: 2, color: 'amber' },
    { name_ar: 'طلبات الصلاحيات', total: 2, color: 'emerald' },
    { name_ar: 'مراجعة الكاميرات', total: 1, color: 'rose' },
    { name_ar: 'إدارة المستخدمين', total: 1, color: 'violet' },
  ];

  const totalSum = categories.reduce((s, c) => s + (c.total || 0), 0) || total || 1;

  // Compute angles for Donut slices
  let cumulativeAngle = 0;
  const radius = 55;
  const circumference = 2 * Math.PI * radius;

  const slices = categories.map((cat, idx) => {
    const fraction = (cat.total || 0) / totalSum;
    const strokeDasharray = `${fraction * circumference} ${circumference}`;
    const strokeDashoffset = -cumulativeAngle * circumference;
    cumulativeAngle += fraction;

    return {
      ...cat,
      fraction,
      strokeDasharray,
      strokeDashoffset,
      color: PALETTE[idx % PALETTE.length],
    };
  });

  const activeSlice = hoveredIdx !== null ? slices[hoveredIdx] : null;

  return (
    <div className="glass p-5 rounded-2xl flex flex-col justify-between h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
            <PieChart size={16} />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-100">توزيع الوثائق حسب التصنيف</h3>
            <p className="text-[11px] text-slate-400">النسب المئوية للأقسام الموضوعية</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/categories')}
          className="text-xs text-blue-400 hover:text-blue-300 font-semibold transition"
        >
          إدارة التصنيفات
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
        {/* SVG Donut */}
        <div className="relative flex items-center justify-center">
          <svg className="w-44 h-44 -rotate-90 transform" viewBox="0 0 160 160">
            {/* Background Track */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              className="stroke-slate-800"
              strokeWidth="20"
              fill="transparent"
            />
            {/* Slices */}
            {slices.map((slice, idx) => (
              <circle
                key={idx}
                cx="80"
                cy="80"
                r={radius}
                stroke={slice.color}
                strokeWidth={hoveredIdx === idx ? 24 : 20}
                strokeDasharray={slice.strokeDasharray}
                strokeDashoffset={slice.strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-300 cursor-pointer"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                onClick={() => navigate(slice.id ? `/documents?category_id=${slice.id}` : '/documents')}
              />
            ))}
          </svg>

          {/* Center Hub */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
            {activeSlice ? (
              <div className="animate-scale-in">
                <span className="text-xl font-black text-white block" style={{ color: activeSlice.color }}>
                  {activeSlice.total}
                </span>
                <span className="text-[10px] text-slate-400 block max-w-[90px] truncate">
                  {Math.round(activeSlice.fraction * 100)}%
                </span>
              </div>
            ) : (
              <div>
                <span className="text-2xl font-black text-white block">{totalSum}</span>
                <span className="text-[10px] text-slate-400 block">وثيقة</span>
              </div>
            )}
          </div>
        </div>

        {/* Legend List */}
        <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-none pr-1">
          {slices.map((slice, idx) => (
            <div
              key={idx}
              onClick={() => navigate(slice.id ? `/documents?category_id=${slice.id}` : '/documents')}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className={`flex items-center justify-between p-1.5 rounded-lg text-xs cursor-pointer transition ${
                hoveredIdx === idx ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2 truncate min-w-0">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: slice.color }} />
                <span className="truncate text-[11px] font-medium">{slice.name_ar}</span>
              </div>
              <div className="flex items-center gap-2 font-mono text-[11px] flex-shrink-0 text-slate-400 mr-2">
                <span>{slice.total}</span>
                <span className="text-[10px] text-slate-500">({Math.round(slice.fraction * 100)}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Workflow Pipeline & Status Breakdown ─────────────────────
function StatusPipelineMeter({ byStatus = [], stats = {} }) {
  const navigate = useNavigate();
  const total = stats.total_documents || 1;

  const statusColors = {
    new:              '#3b82f6',
    in_progress:      '#06b6d4',
    pending_approval: '#f59e0b',
    approved:         '#10b981',
    completed:        '#059669',
    rejected:         '#ef4444',
    archived:         '#64748b',
  };

  return (
    <div className="glass p-5 rounded-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-amber-400">
            <Layers size={16} />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-100">مسار وحالة الوثائق (Workflow Pipeline)</h3>
            <p className="text-[11px] text-slate-400">توزيع الوثائق عبر مراحل الدورة المستندية</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/documents')}
          className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
        >
          عرض جدول الوثائق
        </button>
      </div>

      {/* Multi-segmented Progress Bar */}
      <div className="w-full h-3 rounded-full bg-slate-800 flex overflow-hidden p-0.5 gap-0.5">
        {byStatus.map((st, idx) => {
          const pct = Math.max(Math.round(((st.total || 0) / total) * 100), 2);
          const col = statusColors[st.name] || '#64748b';
          return (
            <div
              key={idx}
              style={{ width: `${pct}%`, background: col }}
              className="h-full rounded-sm hover:opacity-80 transition cursor-pointer"
              title={`${st.label_ar}: ${st.total} (${pct}%)`}
              onClick={() => navigate(`/documents?status=${st.name}`)}
            />
          );
        })}
      </div>

      {/* Status Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
        {byStatus.slice(0, 4).map((st, idx) => {
          const col = statusColors[st.name] || '#3b82f6';
          return (
            <div
              key={idx}
              onClick={() => navigate(`/documents?status=${st.name}`)}
              className="p-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800/80 border border-white/5 hover:border-white/10 transition cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-medium text-slate-300">{st.label_ar}</span>
                <span className="w-2 h-2 rounded-full" style={{ background: col }} />
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-base font-black text-white">{st.total}</span>
                <span className="text-[10px] font-mono text-slate-400">
                  {Math.round(((st.total || 0) / total) * 100)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Department Document Activity Bars ────────────────────────
function DepartmentActivityChart({ data = [] }) {
  const navigate = useNavigate();
  const maxTotal = Math.max(...data.map(d => d.total), 1);

  return (
    <div className="glass p-5 rounded-2xl flex flex-col justify-between h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-violet-500/15 border border-violet-500/25 flex items-center justify-center text-violet-400">
            <Building2 size={16} />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-100">نشاط الأقسام والفروع</h3>
            <p className="text-[11px] text-slate-400">حجم الوثائق والأرشفة لكل إدارة</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/departments')}
          className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
        >
          الهيكل الإداري
        </button>
      </div>

      <div className="space-y-3">
        {data.slice(0, 5).map((dept, idx) => {
          const pct = Math.max(Math.round(((dept.total || 0) / maxTotal) * 100), 10);
          return (
            <div
              key={idx}
              onClick={() => navigate(`/documents?department_id=${dept.id}`)}
              className="space-y-1 cursor-pointer group"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium group-hover:text-violet-400 transition truncate max-w-[220px]">
                  {dept.name_ar}
                </span>
                <span className="font-mono text-slate-400 text-[11px] flex items-center gap-1">
                  <span className="text-white font-bold">{dept.total}</span> وثيقة
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${pct}%`,
                    background: 'linear-gradient(90deg, #8b5cf6 0%, #6366f1 100%)',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Confidentiality Security Breakdown ───────────────────────
function ConfidentialityMeter({ byConf = [] }) {
  const navigate = useNavigate();

  const confColors = {
    public:              '#10b981',
    internal:            '#3b82f6',
    confidential:        '#f97316',
    highly_confidential: '#ef4444',
  };

  return (
    <div className="glass p-5 rounded-2xl flex flex-col justify-between h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-rose-500/15 border border-rose-500/25 flex items-center justify-center text-rose-400">
            <ShieldCheck size={16} />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-100">درجات السرية والأمان</h3>
            <p className="text-[11px] text-slate-400">تصنيف الوثائق حسب حساسية البيانات</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {byConf.map((c, idx) => {
          const col = confColors[c.name] || '#3b82f6';
          return (
            <div
              key={idx}
              onClick={() => navigate(`/documents?confidentiality_level_id=${c.id}`)}
              className="p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-white/5 transition cursor-pointer"
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: col }} />
                <span className="text-xs font-semibold text-slate-200">{c.label_ar}</span>
              </div>
              <div className="text-xl font-black text-white">{c.total}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Quick Category Tile ──────────────────────────────────────
function QuickTile({ label, value, icon: Icon, color, to }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(to)}
      className="glass card-hover-lift glow-on-hover press-effect text-right p-3 sm:p-4 rounded-xl sm:rounded-2xl w-full group relative overflow-hidden"
      style={{
        border: '1px solid rgba(255,255,255,0.07)',
        outline: 'none',
        cursor: 'pointer',
      }}
    >
      <div
        className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center mb-2.5 transition-transform duration-300 group-hover:scale-115 group-hover:-rotate-3"
        style={{
          background: `rgba(${color},0.15)`,
          border: `1px solid rgba(${color},0.28)`,
          boxShadow: `0 0 15px rgba(${color},0.1)`,
        }}
      >
        <Icon size={16} style={{ color: `rgb(${color})` }} />
      </div>
      <div className="text-xl sm:text-2xl font-black mb-1 text-white group-hover:text-blue-300 transition-colors">
        {value ?? 0}
      </div>
      <div className="text-[11px] sm:text-xs leading-tight text-slate-400 group-hover:text-slate-200 transition-colors font-medium">
        {label}
      </div>
    </button>
  );
}

// ── Main Page ────────────────────────────────────────────────
export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, hasPermission } = useAuthStore();

  const [statsData,        setStatsData]        = useState(null);
  const [recentDocs,       setRecentDocs]       = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [activity,         setActivity]         = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [refreshing,       setRefreshing]       = useState(false);

  const loadData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const [s, d, a, ac] = await Promise.all([
        dashboardAPI.stats(),
        dashboardAPI.recentDocuments(),
        dashboardAPI.pendingApprovals(),
        dashboardAPI.activity(),
      ]);
      setStatsData(s.data.data);
      setRecentDocs(d.data.data);
      setPendingApprovals(a.data.data);
      setActivity(ac.data.data);
    } catch (e) {
      console.error('Failed to load dashboard data:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[1,2,3,4].map(i => <div key={i} className="skeleton h-28 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="skeleton h-72 rounded-2xl" />
          <div className="skeleton h-72 rounded-2xl" />
        </div>
        <div className="skeleton h-48 rounded-2xl" />
      </div>
    );
  }

  const s = statsData?.stats || {};
  const byCategory = statsData?.by_category || [];
  const byMonth = statsData?.by_month || [];
  const byStatus = statsData?.by_status || [];
  const byDepartment = statsData?.by_department || [];
  const byConfidentiality = statsData?.by_confidentiality || [];

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Welcome Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-black text-white" style={{ letterSpacing: '-0.01em' }}>
            مرحباً، {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-[13px] mt-0.5 text-slate-400">
            لوحة المؤشرات والتحليلات البيانية لنظام إدارة وأرشفة الوثائق
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="btn btn-secondary"
            title="تحديث البيانات"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin text-blue-400' : ''} />
            <span className="hidden sm:inline">تحديث</span>
          </button>
          <button
            onClick={() => navigate('/documents')}
            className="btn btn-secondary"
          >
            <FolderOpen size={15} />
            استعراض الأرشيف
          </button>
          {(user?.is_super_admin || hasPermission('documents.create')) && (
            <button
              id="dashboard-create-btn"
              className="btn btn-primary"
              onClick={() => navigate('/documents/create')}
            >
              <Plus size={16} />
              وثيقة جديدة
            </button>
          )}
        </div>
      </div>

      {/* ── Primary Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          icon={FileText}
          label="إجمالي الوثائق"
          value={s.total_documents}
          sub="كافة الوثائق المسجلة"
          color="59,130,246"
          delay={1}
          onClick={() => navigate('/documents')}
        />
        <StatCard
          icon={Clock}
          label="بانتظار الاعتماد"
          value={s.pending_approval}
          sub="تتطلب مراجعة واعتماد"
          color="245,158,11"
          delay={2}
          onClick={() => navigate('/documents?pending=true')}
        />
        <StatCard
          icon={CheckCircle2}
          label="الوثائق المكتملة"
          value={s.completed_documents}
          sub="معتمدة وموثقة بالكامل"
          color="16,185,129"
          delay={3}
          onClick={() => navigate('/documents?status=completed')}
        />
        <StatCard
          icon={Archive}
          label="المؤرشفة"
          value={s.archived_documents}
          sub="في مستودع الحفظ الدائم"
          color="100,116,139"
          delay={4}
          onClick={() => navigate('/documents?archived=true')}
        />
      </div>

      {/* ── Interactive Charts Section: Row 1 (Monthly Influx & Category Donut) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MonthlyTrendChart data={byMonth} />
        <CategoryDonutChart data={byCategory} total={s.total_documents} />
      </div>

      {/* ── Interactive Charts Section: Row 2 (Workflow Pipeline & Department / Security) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <StatusPipelineMeter byStatus={byStatus} stats={s} />
        </div>
        <div>
          <ConfidentialityMeter byConf={byConfidentiality} />
        </div>
      </div>

      {/* ── Quick Category Tiles ── */}
      <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        <QuickTile label="طلبات الصلاحيات"   value={s.access_requests}       icon={KeyRound}     color="16,185,129"  to="/documents?category_code=ACCESS" />
        <QuickTile label="إدارة المستخدمين"  value={s.user_requests}         icon={Users}        color="139,92,246"  to="/documents?category_code=USER_MGMT" />
        <QuickTile label="مراجعة الكاميرات" value={s.cctv_reviews}          icon={Video}        color="244,63,94"   to="/documents?category_code=CCTV" />
        <QuickTile label="هذا الشهر"         value={s.this_month_documents}  icon={TrendingUp}   color="59,130,246"  to="/documents" />
        <QuickTile label="قيد التنفيذ"       value={s.in_progress_documents} icon={RefreshCw}    color="245,158,11"  to="/documents?status=in_progress" />
        <QuickTile label="طلبات اعتمادي"    value={s.my_pending_approvals}  icon={AlertCircle}  color="249,115,22"  to="/documents?pending=true" />
      </div>

      {/* ── Department Activity & Approvals / Recent Documents ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* Recent Documents Table */}
        <div className="glass xl:col-span-2 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-blue-400" />
              <h2 className="font-bold text-sm text-slate-100">آخر الوثائق المضافة</h2>
            </div>
            <button
              className="btn btn-secondary btn-sm gap-1.5"
              onClick={() => navigate('/documents')}
            >
              <Eye size={13} />
              عرض الكل
            </button>
          </div>

          {recentDocs.length === 0 ? (
            <div className="empty-state py-8">
              <FolderOpen size={40} className="mx-auto text-slate-500 mb-2" />
              <h3 className="text-sm font-bold text-white">لا توجد وثائق بعد</h3>
              <p className="text-xs text-slate-400">أنشئ وثيقتك الأولى للبدء</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>رقم الوثيقة</th>
                    <th>العنوان</th>
                    <th>الحالة</th>
                    <th>المُنشئ</th>
                    <th>التاريخ</th>
                  </tr>
                </thead>
                <tbody>
                  {recentDocs.map(doc => {
                    const status = STATUS_CONFIG[doc.status?.name] || STATUS_CONFIG.new;
                    return (
                      <tr key={doc.id} className="cursor-pointer group" onClick={() => navigate(`/documents/${doc.id}`)}>
                        <td>
                          <span className="font-mono text-xs font-bold text-blue-400">
                            {doc.document_number}
                          </span>
                        </td>
                        <td>
                          <div className="font-semibold text-sm truncate max-w-xs text-slate-100 group-hover:text-blue-400 transition-colors">
                            {doc.title}
                          </div>
                          {doc.category?.name_ar && (
                            <div className="text-[11px] text-slate-400 mt-0.5">{doc.category.name_ar}</div>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${status.class}`}>{status.label}</span>
                        </td>
                        <td>
                          <span className="text-sm text-slate-400">{doc.creator?.name || '—'}</span>
                        </td>
                        <td style={{ direction: 'ltr', textAlign: 'right' }}>
                          <span className="text-xs font-mono text-slate-400">
                            {doc.document_date
                              ? new Date(doc.document_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' })
                              : '—'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Department Activity & Recent Feed */}
        <div className="space-y-4">
          <DepartmentActivityChart data={byDepartment} />

          {/* Pending Approvals Quick List */}
          {pendingApprovals.length > 0 && (
            <div className="glass p-5 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-amber-400" />
                  <h3 className="font-bold text-sm text-slate-100">بانتظار الاعتماد</h3>
                </div>
                <span className="badge badge-amber">{pendingApprovals.length}</span>
              </div>
              <div className="space-y-2">
                {pendingApprovals.slice(0, 3).map((ap, idx) => (
                  <div
                    key={idx}
                    onClick={() => navigate(`/documents/${ap.document_id}`)}
                    className="p-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800/80 border border-white/5 transition cursor-pointer flex items-center justify-between"
                  >
                    <div className="min-w-0 flex-1 ml-2">
                      <p className="text-xs font-bold text-slate-200 truncate">{ap.document?.title || `وثيقة #${ap.document_id}`}</p>
                      <p className="text-[10px] text-amber-400 mt-0.5">{ap.workflow_step?.step_name || 'اعتماد إداري'}</p>
                    </div>
                    <ChevronLeft size={14} className="text-slate-400" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
