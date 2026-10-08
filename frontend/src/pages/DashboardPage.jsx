import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import {
  FileText, FolderOpen, Clock, CheckCircle2, Archive,
  TrendingUp, Users, AlertCircle, Plus, Eye,
  KeyRound, Video, GitPullRequest, RefreshCw, XCircle, Ban, Activity,
  ArrowLeft
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

// ── Stat Card ────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color, delay = 0 }) {
  return (
    <div className={`glass stat-card p-4 sm:p-5 animate-fade-in stagger-${delay} press-effect group`}
         style={{ cursor: 'default', transition: 'all 0.22s cubic-bezier(0.4,0,0.2,1)' }}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] sm:text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: '#45607a' }}>
            {label}
          </p>
          <p className="text-2xl sm:text-3xl font-black" style={{ color: '#f0f4ff', lineHeight: 1 }}>
            {value ?? <span className="skeleton inline-block w-12 h-7 rounded" />}
          </p>
          {sub && <p className="text-[11px] mt-2" style={{ color: '#45607a' }}>{sub}</p>}
        </div>
        <div
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: `rgba(${color},0.14)`,
            border: `1px solid rgba(${color},0.22)`,
            boxShadow: `0 0 20px rgba(${color},0.08)`,
            transition: 'all 0.22s ease',
          }}
        >
          <Icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: `rgb(${color})` }} />
        </div>
      </div>
    </div>
  );
}

// ── Recent Document Row ──────────────────────────────────────
function DocumentRow({ doc }) {
  const navigate = useNavigate();
  const status = STATUS_CONFIG[doc.status?.name] || STATUS_CONFIG.new;
  return (
    <tr className="cursor-pointer group" onClick={() => navigate(`/documents/${doc.id}`)}>
      <td>
        <span className="font-mono text-xs font-bold" style={{ color: '#60a5fa' }}>
          {doc.document_number}
        </span>
      </td>
      <td>
        <div className="font-semibold text-sm truncate" style={{ color: '#e2e8f0', maxWidth: '220px' }}>
          {doc.title}
        </div>
        {doc.category?.name_ar && (
          <div className="text-[11px] mt-0.5" style={{ color: '#45607a' }}>{doc.category.name_ar}</div>
        )}
      </td>
      <td>
        <span className={`badge ${status.class}`}>{status.label}</span>
      </td>
      <td>
        <span className="text-sm" style={{ color: '#7a90a8' }}>{doc.creator?.name || '—'}</span>
      </td>
      <td style={{ direction: 'ltr', textAlign: 'right' }}>
        <span className="text-xs font-mono" style={{ color: '#526080' }}>
          {doc.document_date
            ? new Date(doc.document_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' })
            : '—'}
        </span>
      </td>
    </tr>
  );
}

// ── Quick Category Tile ──────────────────────────────────────
function QuickTile({ label, value, icon: Icon, color, to }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(to)}
      className="glass press-effect text-right p-3 sm:p-4 rounded-xl sm:rounded-2xl w-full group"
      style={{
        border: 'none',
        outline: 'none',
        transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
        cursor: 'pointer',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = `rgba(${color},0.06)`;
        e.currentTarget.style.boxShadow = `0 0 24px rgba(${color},0.08)`;
        e.currentTarget.style.borderColor = `rgba(${color},0.18)`;
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = '';
        e.currentTarget.style.boxShadow = '';
        e.currentTarget.style.borderColor = '';
        e.currentTarget.style.transform = '';
      }}
    >
      <div
        className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center mb-2.5"
        style={{ background: `rgba(${color},0.13)`, border: `1px solid rgba(${color},0.2)` }}
      >
        <Icon size={15} style={{ color: `rgb(${color})` }} />
      </div>
      <div className="text-xl sm:text-2xl font-black mb-1" style={{ color: '#f0f4ff' }}>
        {value ?? 0}
      </div>
      <div className="text-[11px] sm:text-xs leading-tight" style={{ color: '#45607a' }}>{label}</div>
    </button>
  );
}

// ── Main Page ────────────────────────────────────────────────
export default function DashboardPage() {
  const navigate = useNavigate();
  const { user }  = useAuthStore();

  const [stats,            setStats]            = useState(null);
  const [recentDocs,       setRecentDocs]       = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [activity,         setActivity]         = useState([]);
  const [loading,          setLoading]          = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [s, d, a, ac] = await Promise.all([
          dashboardAPI.stats(),
          dashboardAPI.recentDocuments(),
          dashboardAPI.pendingApprovals(),
          dashboardAPI.activity(),
        ]);
        setStats(s.data.data);
        setRecentDocs(d.data.data);
        setPendingApprovals(a.data.data);
        setActivity(ac.data.data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[1,2,3,4].map(i => <div key={i} className="skeleton h-28 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
          {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton h-24 rounded-xl" />)}
        </div>
        <div className="skeleton h-64 rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="skeleton h-56 rounded-2xl" />
          <div className="skeleton h-56 rounded-2xl" />
        </div>
      </div>
    );
  }

  const s = stats?.overview || stats?.stats || stats || {};

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Welcome Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-black" style={{ color: '#f0f4ff', letterSpacing: '-0.01em' }}>
            مرحباً، {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-[13px] mt-0.5" style={{ color: '#45607a' }}>
            نظرة عامة على نظام إدارة الوثائق
          </p>
        </div>
        <button
          id="dashboard-create-btn"
          className="btn btn-primary"
          onClick={() => navigate('/documents/create')}
        >
          <Plus size={16} />
          وثيقة جديدة
        </button>
      </div>

      {/* ── Primary Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={FileText}     label="إجمالي الوثائق"  value={s.total_documents}       color="59,130,246"  delay={1} />
        <StatCard icon={Clock}        label="بانتظار الاعتماد" value={s.pending_approval}       color="245,158,11"  delay={2} />
        <StatCard icon={CheckCircle2} label="المكتملة"        value={s.completed_documents}    color="16,185,129"  delay={3} />
        <StatCard icon={Archive}      label="المؤرشفة"         value={s.archived_documents}     color="100,116,139" delay={4} />
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

      {/* ── Main Content Grid ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* Recent Documents */}
        <div className="glass xl:col-span-2 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-blue-400" />
              <h2 className="font-bold text-sm" style={{ color: '#d4e0f5' }}>آخر الوثائق</h2>
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
            <div className="empty-state">
              <FolderOpen size={40} />
              <h3>لا توجد وثائق بعد</h3>
              <p>أنشئ وثيقتك الأولى للبدء</p>
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
                  {recentDocs.slice(0, 8).map(doc => (
                    <DocumentRow key={doc.id} doc={doc} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4">

          {/* Pending Approvals */}
          <div className="glass overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                <h2 className="font-bold text-sm" style={{ color: '#d4e0f5' }}>
                  طلبات اعتمادي
                </h2>
                {pendingApprovals.length > 0 && (
                  <span className="badge badge-amber text-[10px] px-2 py-0.5">{pendingApprovals.length}</span>
                )}
              </div>
            </div>

            {pendingApprovals.length === 0 ? (
              <div className="empty-state" style={{ padding: '28px 20px' }}>
                <CheckCircle2 size={28} />
                <p>لا توجد طلبات معلّقة</p>
              </div>
            ) : (
              <div className="p-3 space-y-2">
                {pendingApprovals.slice(0, 4).map(ap => (
                  <button
                    key={ap.id}
                    onClick={() => navigate(`/documents/${ap.document_id}`)}
                    className="w-full glass-sm press-effect p-3 text-right group"
                    style={{ border: 'none', cursor: 'pointer', transition: 'all 0.18s ease' }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = 'rgba(59,130,246,0.2)';
                      e.currentTarget.style.background = 'rgba(59,130,246,0.05)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = '';
                      e.currentTarget.style.background = '';
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-[11px] font-bold" style={{ color: '#60a5fa' }}>
                        {ap.document?.document_number}
                      </span>
                      <ArrowLeft size={11} style={{ color: '#45607a' }} />
                    </div>
                    <div className="text-[13px] truncate font-medium" style={{ color: '#c8d8f0' }}>
                      {ap.document?.title}
                    </div>
                    {ap.workflow_step?.name_ar && (
                      <div className="text-[11px] mt-1" style={{ color: '#45607a' }}>{ap.workflow_step.name_ar}</div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Activity Feed */}
          <div className="glass overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <Activity size={15} className="text-blue-400" />
              <h2 className="font-bold text-sm" style={{ color: '#d4e0f5' }}>النشاط الأخير</h2>
            </div>

            {activity.length === 0 ? (
              <div className="empty-state" style={{ padding: '28px 20px' }}>
                <Activity size={24} />
                <p>لا يوجد نشاط بعد</p>
              </div>
            ) : (
              <div className="p-4 space-y-3.5">
                {activity.slice(0, 6).map(log => (
                  <div key={log.id} className="flex items-start gap-3">
                    <div
                      className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center text-[11px] font-bold"
                      style={{ background: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.18)' }}
                    >
                      {log.user?.name?.[0] || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] leading-relaxed" style={{ color: '#7a90a8' }}>
                        <span style={{ color: '#c8d8f0', fontWeight: 600 }}>{log.user?.name}</span>
                        {' '}{log.description}
                      </p>
                      <p className="text-[11px] mt-0.5" style={{ color: '#364a60' }}>
                        {log.created_at
                          ? formatDistanceToNow(new Date(log.created_at), { locale: ar, addSuffix: true })
                          : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Categories Breakdown ── */}
      {stats?.by_category?.length > 0 && (
        <div className="glass overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <FolderOpen size={15} className="text-blue-400" />
            <h2 className="font-bold text-sm" style={{ color: '#d4e0f5' }}>الوثائق حسب التصنيف</h2>
          </div>
          <div className="p-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {stats.by_category.map((cat, i) => (
              <div key={i} className="glass-sm p-3 press-effect" style={{ cursor: 'pointer' }}>
                <div className="text-xl font-black mb-1" style={{ color: '#f0f4ff' }}>{cat.total}</div>
                <div className="text-[11px] truncate mb-2" style={{ color: '#7a90a8' }}>{cat.name_ar}</div>
                <div className="h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <div
                    className="h-1 rounded-full"
                    style={{
                      background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                      width: `${Math.min(100, (cat.total / (s.total_documents || 1)) * 200)}%`,
                      transition: 'width 0.6s ease',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
