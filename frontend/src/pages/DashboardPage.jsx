import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import {
  FileText, FolderOpen, Clock, CheckCircle2, Archive,
  TrendingUp, Users, AlertCircle, Plus, Eye, MoreHorizontal,
  KeyRound, Video, GitPullRequest, RefreshCw, XCircle, Ban, Activity
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

// ── Helpers ─────────────────────────────────────────────────────
const STATUS_CONFIG = {
  new:              { label: 'جديد',           class: 'badge-blue',    icon: FileText },
  in_progress:      { label: 'قيد التنفيذ',    class: 'badge-amber',   icon: RefreshCw },
  pending_approval: { label: 'بانتظار الاعتماد', class: 'badge-amber',  icon: Clock },
  approved:         { label: 'معتمد',          class: 'badge-green',   icon: CheckCircle2 },
  completed:        { label: 'مكتمل',          class: 'badge-emerald', icon: CheckCircle2 },
  rejected:         { label: 'مرفوض',          class: 'badge-red',     icon: XCircle },
  cancelled:        { label: 'ملغي',           class: 'badge-gray',    icon: Ban },
  archived:         { label: 'مؤرشف',          class: 'badge-slate',   icon: Archive },
};

const CATEGORY_ICONS = {
  ACCESS: KeyRound, CCTV: Video, CHANGE_REQ: GitPullRequest,
  SYS_MOD: FileText, USER_MGMT: Users, default: FolderOpen,
};

const CONFIDENTIALITY_COLORS = {
  public: 'badge-green', internal: 'badge-blue',
  confidential: 'badge-orange', highly_confidential: 'badge-red',
};

function StatCard({ icon: Icon, label, value, sub, color, delay = 0 }) {
  return (
    <div className={`glass glass-hover stat-card p-5 animate-fade-in stagger-${delay}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold mb-1" style={{ color: '#526080' }}>{label}</p>
          <p className="text-3xl font-black" style={{ color: '#f0f4ff' }}>{value ?? '—'}</p>
          {sub && <p className="text-xs mt-1" style={{ color: '#526080' }}>{sub}</p>}
        </div>
        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
             style={{ background: `rgba(${color},0.15)`, border: `1px solid rgba(${color},0.25)` }}>
          <Icon size={20} style={{ color: `rgb(${color})` }} />
        </div>
      </div>
    </div>
  );
}

function DocumentRow({ doc }) {
  const navigate = useNavigate();
  const status = STATUS_CONFIG[doc.status?.name] || STATUS_CONFIG.new;

  return (
    <tr className="cursor-pointer" onClick={() => navigate(`/documents/${doc.id}`)}>
      <td>
        <div className="font-mono text-xs font-semibold" style={{ color: '#60a5fa' }}>
          {doc.document_number}
        </div>
      </td>
      <td>
        <div className="font-semibold text-sm" style={{ color: '#e2e8f0', maxWidth: '240px' }}>
          {doc.title}
        </div>
        <div className="text-xs mt-0.5" style={{ color: '#526080' }}>
          {doc.category?.name_ar}
        </div>
      </td>
      <td>
        <span className={`badge ${status.class}`}>
          {status.label}
        </span>
      </td>
      <td>
        <div className="text-sm" style={{ color: '#8b9cc8' }}>
          {doc.creator?.name}
        </div>
      </td>
      <td style={{ direction: 'ltr', textAlign: 'right' }}>
        <div className="text-xs font-mono text-slate-400">
          {doc.document_date ? new Date(doc.document_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' }) : '—'}
        </div>
      </td>
    </tr>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [recentDocs, setRecentDocs] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [statsRes, docsRes, appRes, actRes] = await Promise.all([
          dashboardAPI.stats(),
          dashboardAPI.recentDocuments(),
          dashboardAPI.pendingApprovals(),
          dashboardAPI.activity(),
        ]);
        setStats(statsRes.data.data);
        setRecentDocs(docsRes.data.data);
        setPendingApprovals(appRes.data.data);
        setActivity(actRes.data.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="skeleton h-28 rounded-2xl" />)}
        </div>
        <div className="skeleton h-64 rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="skeleton h-64 rounded-2xl" />
          <div className="skeleton h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  const s = stats?.overview || stats?.stats || stats || {};

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Welcome */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-black" style={{ color: '#f0f4ff' }}>
            مرحباً، {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-sm" style={{ color: '#526080' }}>
            إليك نظرة عامة على نظام الأرشيف الإلكتروني
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

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FileText}    label="إجمالي الوثائق"      value={s.total_documents}       color="59,130,246"   delay={1} />
        <StatCard icon={Clock}       label="بانتظار الاعتماد"    value={s.pending_approval}       color="245,158,11"   delay={2} />
        <StatCard icon={CheckCircle2} label="المكتملة"           value={s.completed_documents}    color="16,185,129"   delay={3} />
        <StatCard icon={Archive}     label="المؤرشفة"            value={s.archived_documents}     color="100,116,139"  delay={4} />
      </div>

      {/* ── Second Row: Category Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'طلبات الصلاحيات', value: s.access_requests,  icon: KeyRound,   color: '16,185,129',  to: '/documents?category_code=ACCESS' },
          { label: 'إدارة المستخدمين',value: s.user_requests,    icon: Users,      color: '139,92,246',  to: '/documents?category_code=USER_MGMT' },
          { label: 'مراجعة الكاميرات',value: s.cctv_reviews,     icon: Video,      color: '244,63,94',   to: '/documents?category_code=CCTV' },
          { label: 'هذا الشهر',        value: s.this_month_documents, icon: TrendingUp, color: '59,130,246', to: '/documents' },
          { label: 'قيد التنفيذ',      value: s.in_progress_documents, icon: RefreshCw, color: '245,158,11', to: '/documents?status=in_progress' },
          { label: 'طلبات اعتمادي',   value: s.my_pending_approvals,  icon: AlertCircle, color: '249,115,22', to: '/documents?pending=true' },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <button
              key={i}
              onClick={() => navigate(item.to)}
              className="glass glass-hover p-4 text-right cursor-pointer w-full"
              style={{ border: 'none', outline: 'none' }}
            >
              <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
                   style={{ background: `rgba(${item.color},0.15)` }}>
                <Icon size={16} style={{ color: `rgb(${item.color})` }} />
              </div>
              <div className="text-2xl font-black mb-1" style={{ color: '#f0f4ff' }}>
                {item.value ?? 0}
              </div>
              <div className="text-xs" style={{ color: '#526080' }}>{item.label}</div>
            </button>
          );
        })}
      </div>

      {/* ── Recent Docs + Pending Approvals ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Recent Documents Table */}
        <div className="glass p-5 xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold" style={{ color: '#e2e8f0' }}>آخر الوثائق</h2>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => navigate('/documents')}
            >
              <Eye size={13} /> عرض الكل
            </button>
          </div>
          {recentDocs.length === 0 ? (
            <div className="empty-state">
              <FolderOpen size={40} />
              <h3>لا توجد وثائق بعد</h3>
              <p>أنشئ وثيقتك الأولى للبدء</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-2">
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

        {/* Sidebar: Pending + Activity */}
        <div className="space-y-5">

          {/* Pending Approvals */}
          <div className="glass p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
              <h2 className="font-bold" style={{ color: '#e2e8f0' }}>
                طلبات اعتمادي ({pendingApprovals.length})
              </h2>
            </div>
            {pendingApprovals.length === 0 ? (
              <div className="empty-state" style={{ padding: '24px' }}>
                <CheckCircle2 size={28} />
                <p>لا توجد طلبات معلّقة</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pendingApprovals.slice(0, 4).map(ap => (
                  <button
                    key={ap.id}
                    onClick={() => navigate(`/documents/${ap.document_id}`)}
                    className="w-full glass-sm glass-hover p-3 text-right"
                    style={{ border: 'none', cursor: 'pointer' }}
                  >
                    <div className="text-xs font-mono font-semibold" style={{ color: '#60a5fa' }}>
                      {ap.document?.document_number}
                    </div>
                    <div className="text-sm truncate mt-0.5" style={{ color: '#cbd5e1' }}>
                      {ap.document?.title}
                    </div>
                    <div className="text-xs mt-1" style={{ color: '#526080' }}>
                      {ap.workflow_step?.name_ar}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Activity Feed */}
          <div className="glass p-5">
            <h2 className="font-bold mb-4" style={{ color: '#e2e8f0' }}>النشاط الأخير</h2>
            {activity.length === 0 ? (
              <div className="empty-state" style={{ padding: '20px' }}>
                <Activity size={24} />
                <p>لا يوجد نشاط بعد</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activity.slice(0, 6).map(log => (
                  <div key={log.id} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-bold"
                         style={{ background: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.2)' }}>
                      {log.user?.name?.[0] || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs leading-relaxed" style={{ color: '#8b9cc8' }}>
                        <span style={{ color: '#cbd5e1', fontWeight: 600 }}>{log.user?.name}</span>
                        {' '}{log.description}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: '#526080' }}>
                        {log.created_at ? formatDistanceToNow(new Date(log.created_at), { locale: ar, addSuffix: true }) : ''}
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
        <div className="glass p-5">
          <h2 className="font-bold mb-4" style={{ color: '#e2e8f0' }}>الوثائق حسب التصنيف</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {stats.by_category.map((cat, i) => (
              <div key={i} className="glass-sm p-3">
                <div className="text-xl font-black mb-1" style={{ color: '#f0f4ff' }}>{cat.total}</div>
                <div className="text-xs truncate" style={{ color: '#8b9cc8' }}>{cat.name_ar}</div>
                <div className="mt-2 h-1 rounded-full" style={{ background: `rgba(59,130,246,0.1)` }}>
                  <div className="h-1 rounded-full" style={{
                    background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                    width: `${Math.min(100, (cat.total / (s.total_documents || 1)) * 100 * 2)}%`
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
