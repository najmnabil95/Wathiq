import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { documentsAPI, categoriesAPI, settingsAPI } from '../services/api';
import {
  Plus, Search, Filter, Eye, Archive, Trash2, RotateCcw,
  FileText, ChevronRight, ChevronLeft, Download, RefreshCw,
  SlidersHorizontal, X, CheckCircle2, Clock, XCircle, Ban
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

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

const CONF_CONFIG = {
  public:            { label: 'عام',          class: 'badge-green'  },
  internal:          { label: 'داخلي',        class: 'badge-blue'   },
  confidential:      { label: 'سري',          class: 'badge-orange' },
  highly_confidential:{ label: 'سري للغاية', class: 'badge-red'    },
};

export default function DocumentsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { hasPermission, user } = useAuthStore();

  const [docs, setDocs] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    q:             searchParams.get('q') || '',
    category_id:   searchParams.get('category_id') || '',
    category_code: searchParams.get('category_code') || '',
    status:        searchParams.get('status') || '',
    pending:       searchParams.get('pending') === 'true',
    status_id:     searchParams.get('status_id') || '',
    date_from:     searchParams.get('date_from') || '',
    date_to:       searchParams.get('date_to') || '',
    archived:      searchParams.get('archived') === 'true',
    page:          parseInt(searchParams.get('page') || '1'),
    per_page:      15,
    sort:          'created_at',
    dir:           'desc',
  });

  // Sync state if search params change in URL
  useEffect(() => {
    setFilters(f => ({
      ...f,
      q:             searchParams.get('q') || '',
      category_id:   searchParams.get('category_id') || '',
      category_code: searchParams.get('category_code') || '',
      status:        searchParams.get('status') || '',
      pending:       searchParams.get('pending') === 'true',
      status_id:     searchParams.get('status_id') || '',
      date_from:     searchParams.get('date_from') || '',
      date_to:       searchParams.get('date_to') || '',
      archived:      searchParams.get('archived') === 'true',
      page:          parseInt(searchParams.get('page') || '1'),
    }));
  }, [searchParams]);

  // Load categories + statuses once
  useEffect(() => {
    Promise.all([
      categoriesAPI.list({ active_only: true }),
      settingsAPI.statuses(),
    ]).then(([cats, stats]) => {
      setCategories(cats.data.data || []);
      setStatuses(stats.data.data || []);
    }).catch(() => {});
  }, []);

  const loadDocs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { ...filters };
      if (!params.q) delete params.q;
      if (!params.category_id) delete params.category_id;
      if (!params.category_code) delete params.category_code;
      if (!params.status) delete params.status;
      if (!params.pending) delete params.pending;
      if (!params.status_id) delete params.status_id;
      if (!params.date_from) delete params.date_from;
      if (!params.date_to) delete params.date_to;

      const res = await documentsAPI.list(params);
      setDocs(res.data.data.data || []);
      setMeta(res.data.data);
    } catch (e) {
      toast.error('فشل تحميل الوثائق');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { loadDocs(); }, [loadDocs]);

  const handleSearch = (e) => {
    e.preventDefault();
    setFilters(f => ({ ...f, page: 1 }));
  };

  const handleFilterChange = (key, value) => {
    setFilters(f => ({ ...f, [key]: value, page: 1 }));
  };

  const clearFilters = () => {
    setSearchParams({});
    setFilters(f => ({
      ...f, q: '', category_id: '', category_code: '', status: '', pending: false, status_id: '',
      date_from: '', date_to: '', archived: false, page: 1,
    }));
  };

  const hasActiveFilters = filters.q || filters.category_id || filters.category_code || filters.status || filters.pending || filters.status_id ||
    filters.date_from || filters.date_to || filters.archived;

  const handleArchive = async (id, e) => {
    e.stopPropagation();
    if (!confirm('هل تريد أرشفة هذه الوثيقة؟')) return;
    try {
      await documentsAPI.archive(id);
      toast.success('تم أرشفة الوثيقة');
      loadDocs();
    } catch { toast.error('فشلت عملية الأرشفة'); }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm('هل تريد حذف هذه الوثيقة نهائياً؟')) return;
    try {
      await documentsAPI.delete(id);
      toast.success('تم حذف الوثيقة');
      loadDocs();
    } catch { toast.error('فشل الحذف'); }
  };

  const exportCSV = () => {
    if (!docs || docs.length === 0) {
      toast.error('لا توجد وثائق متاحة للتصدير');
      return;
    }
    const headers = ['رقم الوثيقة', 'العنوان', 'التصنيف', 'القسم', 'الحالة', 'السرية', 'تاريخ الوثيقة', 'المُنشئ'];
    const rows = docs.map((d) => [
      d.document_number || '',
      `"${(d.title || '').replace(/"/g, '""')}"`,
      `"${(d.category?.name_ar || d.category?.name || '').replace(/"/g, '""')}"`,
      `"${(d.department?.name_ar || d.department?.name || '').replace(/"/g, '""')}"`,
      d.status?.label_ar || d.status?.name || '',
      d.confidentiality_level?.label_ar || d.confidentiality_level?.name || '',
      d.document_date || '',
      `"${(d.creator?.name || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `edms_documents_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast.success('تم تصدير قائمة الوثائق إلى ملف CSV بنجاح');
  };

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">الوثائق</h1>
          <p className="page-subtitle">
            {meta ? `${meta.total} وثيقة إجمالاً` : 'جاري التحميل...'}
          </p>
        </div>
        {(user?.is_super_admin || hasPermission('documents.create')) && (
          <button id="create-document-btn" className="btn btn-primary" onClick={() => navigate('/documents/create')}>
            <Plus size={16} /> وثيقة جديدة
          </button>
        )}
      </div>

      {/* ── Search & Filter Bar ── */}
      <div className="glass p-3 sm:p-4 space-y-3">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
          <div className="search-bar w-full sm:flex-1">
            <Search size={16} className="search-icon" />
            <input
              id="documents-search"
              type="text"
              className="form-input"
              placeholder="ابحث بالرقم، العنوان، الوصف..."
              value={filters.q}
              onChange={e => handleFilterChange('q', e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button type="submit" className="btn btn-primary flex-1 sm:flex-initial">
              <Search size={15} /> بحث
            </button>
            <button
              type="button"
              id="toggle-filters-btn"
              className={`btn btn-secondary flex-1 sm:flex-initial ${showFilters ? 'border-blue-500/40' : ''}`}
              onClick={() => setShowFilters(v => !v)}
            >
              <SlidersHorizontal size={15} />
              فلاتر
              {hasActiveFilters && <span className="w-2 h-2 bg-blue-400 rounded-full" />}
            </button>
            <button
              type="button"
              onClick={exportCSV}
              className="btn btn-secondary"
              title="تصدير الوثائق الحالية إلى CSV"
            >
              <Download size={15} /> <span className="hidden sm:inline">تصدير</span>
            </button>
            {hasActiveFilters && (
              <button type="button" className="btn btn-secondary text-red-400" onClick={clearFilters}>
                <X size={14} /> مسح
              </button>
            )}
          </div>
        </form>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div>
              <label className="form-label">التصنيف</label>
              <select className="form-input form-select"
                      value={filters.category_id}
                      onChange={e => handleFilterChange('category_id', e.target.value)}>
                <option value="">الكل</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name_ar}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">الحالة</label>
              <select className="form-input form-select"
                      value={filters.status_id}
                      onChange={e => handleFilterChange('status_id', e.target.value)}>
                <option value="">الكل</option>
                {statuses.map(s => <option key={s.id} value={s.id}>{s.label_ar}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">من تاريخ</label>
              <input type="date" className="form-input" value={filters.date_from}
                     onChange={e => handleFilterChange('date_from', e.target.value)} />
            </div>
            <div>
              <label className="form-label">إلى تاريخ</label>
              <input type="date" className="form-input" value={filters.date_to}
                     onChange={e => handleFilterChange('date_to', e.target.value)} />
            </div>
            <label className="flex items-center gap-2 cursor-pointer col-span-1 sm:col-span-2 md:col-span-4 pt-1">
              <input type="checkbox" checked={filters.archived}
                     onChange={e => handleFilterChange('archived', e.target.checked)}
                     className="w-4 h-4 accent-blue-500" />
              <span className="text-sm" style={{ color: '#8b9cc8' }}>عرض المؤرشفة فقط</span>
            </label>
          </div>
        )}
      </div>

      {/* ── Table & Cards Container ── */}
      <div className="glass overflow-hidden">
        {loading ? (
          <div className="space-y-3 p-4">
            {[1,2,3,4,5].map(i => <div key={i} className="skeleton h-14 rounded-xl" />)}
          </div>
        ) : docs.length === 0 ? (
          <div className="empty-state">
            <FileText size={48} />
            <h3>لا توجد وثائق</h3>
            <p>لم يتم العثور على وثائق تطابق معايير البحث</p>
            {hasActiveFilters && (
              <button className="btn btn-secondary btn-sm mt-2" onClick={clearFilters}>
                مسح الفلاتر
              </button>
            )}
          </div>
        ) : (
          <>
            {/* ── Mobile View: Sleek Document Cards (shown on screens < 768px) ── */}
            <div className="block md:hidden divide-y divide-white/5">
              {docs.map(doc => {
                const status = STATUS_CONFIG[doc.status?.name] || {};
                const conf   = CONF_CONFIG[doc.confidentiality_level?.name] || {};
                return (
                  <div
                    key={doc.id}
                    onClick={() => navigate(`/documents/${doc.id}`)}
                    className="p-4 space-y-2.5 active:bg-white/5 transition cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/25">
                        {doc.document_number}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className={`badge ${status.class || 'badge-gray'}`}>
                          {status.label || doc.status?.label_ar || '—'}
                        </span>
                        <span className={`badge ${conf.class || 'badge-gray'}`}>
                          {conf.label || doc.confidentiality_level?.label_ar || '—'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-bold text-sm text-slate-100 line-clamp-2">{doc.title}</h3>
                      {doc.department && (
                        <p className="text-xs text-slate-400 mt-0.5 truncate">
                          {doc.department.parent
                            ? `${doc.department.parent.name_ar} ↳ ${doc.department.name_ar}`
                            : doc.department.name_ar}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-white/5 text-xs text-slate-400">
                      <div className="flex items-center gap-3">
                        <span>{doc.creator?.name || '—'}</span>
                        <span className="font-mono">
                          {doc.document_date ? new Date(doc.document_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' }) : '—'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        <button
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                          onClick={() => navigate(`/documents/${doc.id}`)}
                          title="عرض"
                        >
                          <Eye size={14} />
                        </button>
                        {!doc.is_archived && hasPermission('documents.archive') && (
                          <button
                            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-amber-400"
                            onClick={e => handleArchive(doc.id, e)}
                            title="أرشفة"
                          >
                            <Archive size={14} />
                          </button>
                        )}
                        {hasPermission('documents.delete') && (
                          <button
                            className="p-1.5 rounded-lg bg-rose-500/15 text-rose-400 hover:bg-rose-500/25"
                            onClick={e => handleDelete(doc.id, e)}
                            title="حذف"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Tablet & Laptop View: Full Table (shown on screens >= 768px) ── */}
            <div className="hidden md:block table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>رقم الوثيقة</th>
                    <th>العنوان</th>
                    <th>التصنيف</th>
                    <th>الحالة</th>
                    <th>السرية</th>
                    <th>التاريخ</th>
                    <th>المُنشئ</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {docs.map(doc => {
                    const status = STATUS_CONFIG[doc.status?.name] || {};
                    const conf   = CONF_CONFIG[doc.confidentiality_level?.name] || {};
                    return (
                      <tr key={doc.id} className="cursor-pointer" onClick={() => navigate(`/documents/${doc.id}`)}>
                        <td>
                          <span className="font-mono text-xs font-bold" style={{ color: '#60a5fa' }}>
                            {doc.document_number}
                          </span>
                        </td>
                        <td>
                          <div className="font-semibold text-sm max-w-xs truncate" style={{ color: '#e2e8f0' }}>
                            {doc.title}
                          </div>
                          {doc.department && (
                            <div className="text-[11px] truncate mt-0.5 font-medium" style={{ color: '#64748b' }}>
                              {doc.department.parent
                                ? `${doc.department.parent.name_ar} ↳ ${doc.department.name_ar}`
                                : doc.department.name_ar}
                            </div>
                          )}
                        </td>
                        <td>
                          <span className="text-sm" style={{ color: '#8b9cc8' }}>
                            {doc.category?.name_ar || '—'}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${status.class || 'badge-gray'}`}>
                            {status.label || doc.status?.label_ar || '—'}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${conf.class || 'badge-gray'}`}>
                            {conf.label || doc.confidentiality_level?.label_ar || '—'}
                          </span>
                        </td>
                        <td style={{ direction: 'ltr', textAlign: 'right' }}>
                          <span className="text-xs font-mono text-slate-300">
                            {doc.document_date ? new Date(doc.document_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' }) : '—'}
                          </span>
                        </td>
                        <td>
                          <span className="text-sm" style={{ color: '#8b9cc8' }}>
                            {doc.creator?.name || '—'}
                          </span>
                        </td>
                        <td onClick={e => e.stopPropagation()}>
                          <div className="flex items-center gap-1">
                            <button className="btn btn-secondary btn-icon btn-sm"
                                    onClick={() => navigate(`/documents/${doc.id}`)}
                                    title="عرض">
                              <Eye size={13} />
                            </button>
                            {!doc.is_archived && hasPermission('documents.archive') && (
                              <button className="btn btn-secondary btn-icon btn-sm"
                                      onClick={e => handleArchive(doc.id, e)}
                                      title="أرشفة">
                                <Archive size={13} />
                              </button>
                            )}
                            {hasPermission('documents.delete') && (
                              <button className="btn btn-danger btn-icon btn-sm"
                                      onClick={e => handleDelete(doc.id, e)}
                                      title="حذف">
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Pagination */}
        {meta && meta.last_page > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-5 py-3 sm:py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <span className="text-xs sm:text-sm" style={{ color: '#526080' }}>
              {meta.from}–{meta.to} من {meta.total}
            </span>
            <div className="flex gap-2">
              <button
                className="btn btn-secondary btn-sm"
                disabled={meta.current_page <= 1}
                onClick={() => handleFilterChange('page', meta.current_page - 1)}
              >
                <ChevronRight size={14} /> السابق
              </button>
              <span className="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold"
                    style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa' }}>
                {meta.current_page} / {meta.last_page}
              </span>
              <button
                className="btn btn-secondary btn-sm"
                disabled={meta.current_page >= meta.last_page}
                onClick={() => handleFilterChange('page', meta.current_page + 1)}
              >
                التالي <ChevronLeft size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
