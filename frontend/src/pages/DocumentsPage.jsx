import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { documentsAPI, categoriesAPI, departmentsAPI, settingsAPI } from '../services/api';
import {
  Plus, Search, Eye, Archive, Trash2,
  FileText, ChevronRight, ChevronLeft, Download, RefreshCw,
  SlidersHorizontal, X, CheckCircle2, Clock, XCircle,
  ArrowUpDown, ArrowUp, ArrowDown, Printer, FileSpreadsheet,
  Building2, ShieldAlert, ChevronDown, Check, Layers
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
  public:             { label: 'عام',          class: 'badge-green'  },
  internal:           { label: 'داخلي',        class: 'badge-blue'   },
  confidential:       { label: 'سري',          class: 'badge-orange' },
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
  const [departments, setDepartments] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [confLevels, setConfLevels] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  // Export & Print State
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const exportRef = useRef(null);

  const [filters, setFilters] = useState({
    q:                       searchParams.get('q') || '',
    category_id:             searchParams.get('category_id') || '',
    category_code:           searchParams.get('category_code') || '',
    department_id:           searchParams.get('department_id') || '',
    status:                  searchParams.get('status') || '',
    pending:                 searchParams.get('pending') === 'true',
    status_id:               searchParams.get('status_id') || '',
    confidentiality_level_id:searchParams.get('confidentiality_level_id') || '',
    date_from:               searchParams.get('date_from') || '',
    date_to:                 searchParams.get('date_to') || '',
    archived:                searchParams.get('archived') === 'true',
    page:                    parseInt(searchParams.get('page') || '1'),
    per_page:                parseInt(searchParams.get('per_page') || '15'),
    sort:                    searchParams.get('sort') || 'created_at',
    dir:                     searchParams.get('dir') || 'desc',
  });

  // Sync state if search params change in URL
  useEffect(() => {
    setFilters(f => ({
      ...f,
      q:                       searchParams.get('q') || '',
      category_id:             searchParams.get('category_id') || '',
      category_code:           searchParams.get('category_code') || '',
      department_id:           searchParams.get('department_id') || '',
      status:                  searchParams.get('status') || '',
      pending:                 searchParams.get('pending') === 'true',
      status_id:               searchParams.get('status_id') || '',
      confidentiality_level_id:searchParams.get('confidentiality_level_id') || '',
      date_from:               searchParams.get('date_from') || '',
      date_to:                 searchParams.get('date_to') || '',
      archived:                searchParams.get('archived') === 'true',
      page:                    parseInt(searchParams.get('page') || '1'),
      per_page:                parseInt(searchParams.get('per_page') || '15'),
      sort:                    searchParams.get('sort') || 'created_at',
      dir:                     searchParams.get('dir') || 'desc',
    }));
  }, [searchParams]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (exportRef.current && !exportRef.current.contains(e.target)) {
        setExportDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load lookup options (categories, departments, statuses, confidentiality levels)
  useEffect(() => {
    Promise.all([
      categoriesAPI.list({ active_only: true }),
      departmentsAPI.list(),
      settingsAPI.statuses(),
      settingsAPI.confidentialityLevels(),
    ]).then(([cats, depts, stats, confs]) => {
      setCategories(cats.data?.data || cats.data || []);
      setDepartments(depts.data?.data || depts.data || []);
      setStatuses(stats.data?.data || stats.data || []);
      setConfLevels(confs.data?.data || confs.data || []);
    }).catch((err) => {
      console.error('Failed to load filter lookups:', err);
    });
  }, []);

  // Fetch documents with current filters & sorting
  const loadDocs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { ...filters };
      if (!params.q) delete params.q;
      if (!params.category_id) delete params.category_id;
      if (!params.category_code) delete params.category_code;
      if (!params.department_id) delete params.department_id;
      if (!params.status) delete params.status;
      if (!params.pending) delete params.pending;
      if (!params.status_id) delete params.status_id;
      if (!params.confidentiality_level_id) delete params.confidentiality_level_id;
      if (!params.date_from) delete params.date_from;
      if (!params.date_to) delete params.date_to;

      const res = await documentsAPI.list(params);
      setDocs(res.data?.data?.data || []);
      setMeta(res.data?.data);
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

  const handleSort = (field) => {
    setFilters(f => {
      if (f.sort === field) {
        return { ...f, dir: f.dir === 'asc' ? 'desc' : 'asc', page: 1 };
      }
      return { ...f, sort: field, dir: 'desc', page: 1 };
    });
  };

  const clearFilters = () => {
    setSearchParams({});
    setFilters(f => ({
      ...f,
      q: '',
      category_id: '',
      category_code: '',
      department_id: '',
      status: '',
      pending: false,
      status_id: '',
      confidentiality_level_id: '',
      date_from: '',
      date_to: '',
      archived: false,
      page: 1,
    }));
  };

  const hasActiveFilters = Boolean(
    filters.q ||
    filters.category_id ||
    filters.category_code ||
    filters.department_id ||
    filters.status ||
    filters.pending ||
    filters.status_id ||
    filters.confidentiality_level_id ||
    filters.date_from ||
    filters.date_to ||
    filters.archived
  );

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

  // ── CSV Export Helper ──
  const generateCSV = (dataList, filenameSuffix = '') => {
    if (!dataList || dataList.length === 0) {
      toast.error('لا توجد وثائق متاحة للتصدير');
      return;
    }
    const headers = [
      '#',
      'رقم الوثيقة',
      'العنوان',
      'التصنيف',
      'القسم / الإدارة',
      'الحالة',
      'مستوى السرية',
      'تاريخ الوثيقة',
      'تاريخ الإنشاء',
      'المُنشئ',
      'الموقع الفيزيائي للأرشيف',
    ];

    const escapeCSV = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = dataList.map((d, idx) => [
      idx + 1,
      escapeCSV(d.document_number),
      escapeCSV(d.title),
      escapeCSV(d.category?.name_ar || d.category?.name || '—'),
      escapeCSV(d.department?.name_ar || d.department?.name || '—'),
      escapeCSV(d.status?.label_ar || d.status?.name || '—'),
      escapeCSV(d.confidentiality_level?.label_ar || d.confidentiality_level?.name || '—'),
      escapeCSV(d.document_date || '—'),
      escapeCSV(d.created_at ? d.created_at.slice(0, 10) : '—'),
      escapeCSV(d.creator?.name || '—'),
      escapeCSV(d.physical_location || d.physical_shelf || '—'),
    ]);

    // UTF-8 BOM for Microsoft Excel Arabic support
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `edms_documents_${filenameSuffix || new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast.success(`تم تصدير ${dataList.length} وثيقة بنجاح`);
  };

  const handleExportCurrentPage = () => {
    setExportDropdownOpen(false);
    generateCSV(docs, `page_${meta?.current_page || 1}`);
  };

  const handleExportAll = async () => {
    setExportDropdownOpen(false);
    setIsExporting(true);
    const toastId = toast.loading('جاري تجهيز وتصدير كافة الوثائق المطابقة...');
    try {
      const params = { ...filters, page: 1, per_page: 500 };
      if (!params.q) delete params.q;
      if (!params.category_id) delete params.category_id;
      if (!params.category_code) delete params.category_code;
      if (!params.department_id) delete params.department_id;
      if (!params.status) delete params.status;
      if (!params.pending) delete params.pending;
      if (!params.status_id) delete params.status_id;
      if (!params.confidentiality_level_id) delete params.confidentiality_level_id;
      if (!params.date_from) delete params.date_from;
      if (!params.date_to) delete params.date_to;

      const res = await documentsAPI.list(params);
      const allDocs = res.data?.data?.data || [];
      if (allDocs.length === 0) {
        toast.dismiss(toastId);
        toast.error('لا توجد وثائق مطابقة للتصدير');
        return;
      }
      toast.dismiss(toastId);
      generateCSV(allDocs, `all_filtered_${new Date().toISOString().slice(0, 10)}`);
    } catch (err) {
      toast.dismiss(toastId);
      toast.error('فشل تصدير الوثائق');
    } finally {
      setIsExporting(false);
    }
  };

  const renderSortIcon = (field) => {
    if (filters.sort !== field) {
      return <ArrowUpDown size={13} className="text-slate-500 opacity-60 group-hover:opacity-100 transition-opacity" />;
    }
    return filters.dir === 'asc' ? (
      <ArrowUp size={13} className="text-blue-400" />
    ) : (
      <ArrowDown size={13} className="text-blue-400" />
    );
  };

  // Quick Filter Pills Config
  const isAllActive = !filters.status && !filters.pending && !filters.archived && !filters.status_id;
  const isPendingActive = Boolean(filters.pending || filters.status === 'pending_approval');
  const isApprovedActive = filters.status === 'approved';
  const isInProgressActive = filters.status === 'in_progress';
  const isNewActive = filters.status === 'new';
  const isArchivedActive = filters.archived;

  const handleQuickFilter = (type) => {
    if (type === 'all') {
      setFilters(f => ({ ...f, status: '', pending: false, archived: false, status_id: '', page: 1 }));
    } else if (type === 'pending') {
      setFilters(f => ({ ...f, pending: true, status: 'pending_approval', archived: false, status_id: '', page: 1 }));
    } else if (type === 'approved') {
      setFilters(f => ({ ...f, status: 'approved', pending: false, archived: false, status_id: '', page: 1 }));
    } else if (type === 'in_progress') {
      setFilters(f => ({ ...f, status: 'in_progress', pending: false, archived: false, status_id: '', page: 1 }));
    } else if (type === 'new') {
      setFilters(f => ({ ...f, status: 'new', pending: false, archived: false, status_id: '', page: 1 }));
    } else if (type === 'archived') {
      setFilters(f => ({ ...f, archived: !f.archived, status: '', pending: false, status_id: '', page: 1 }));
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">

      {/* ── Page Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2.5">
            <Layers className="text-blue-400" size={24} />
            إدارة الوثائق والأرشيف
          </h1>
          <p className="page-subtitle">
            {meta ? `${meta.total} وثيقة إجمالاً — عرض ${meta.from || 0} إلى ${meta.to || 0}` : 'جاري التحميل...'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Export Dropdown */}
          <div className="relative" ref={exportRef}>
            <button
              type="button"
              onClick={() => setExportDropdownOpen(v => !v)}
              disabled={isExporting}
              className="btn btn-secondary flex items-center gap-1.5"
              title="خيارات التصدير والطباعة"
            >
              <Download size={15} />
              <span>تصدير</span>
              <ChevronDown size={14} className={`transition-transform duration-200 ${exportDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {exportDropdownOpen && (
              <div
                className="absolute left-0 sm:right-auto sm:left-0 top-full mt-2 w-64 glass-card p-1.5 rounded-xl shadow-2xl z-30 animate-scale-in"
                style={{ background: '#0d1527', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <div className="px-3 py-2 border-b border-white/5 mb-1">
                  <p className="text-xs font-bold text-slate-200">خيارات تصدير الوثائق</p>
                  <p className="text-[11px] text-slate-400">تنزيل بصيغ متعددة أو طباعة تقرير</p>
                </div>

                <button
                  onClick={handleExportCurrentPage}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-right rounded-lg hover:bg-blue-500/10 hover:text-blue-400 text-xs text-slate-200 transition"
                >
                  <FileSpreadsheet size={15} className="text-emerald-400" />
                  <div>
                    <div className="font-semibold">تصدير الصفحة الحالية (Excel/CSV)</div>
                    <div className="text-[10px] text-slate-400">{docs.length} وثيقة معروضة</div>
                  </div>
                </button>

                <button
                  onClick={handleExportAll}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-right rounded-lg hover:bg-blue-500/10 hover:text-blue-400 text-xs text-slate-200 transition"
                >
                  <Download size={15} className="text-blue-400" />
                  <div>
                    <div className="font-semibold">تصدير كافة النتائج المطابقة (حتى 500)</div>
                    <div className="text-[10px] text-slate-400">ملف شامل لكافة الفلاتر المحددة</div>
                  </div>
                </button>

                <div className="border-t border-white/5 my-1" />

                <button
                  onClick={() => { setExportDropdownOpen(false); setPrintModalOpen(true); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-right rounded-lg hover:bg-indigo-500/10 hover:text-indigo-400 text-xs text-slate-200 transition"
                >
                  <Printer size={15} className="text-indigo-400" />
                  <div>
                    <div className="font-semibold">معاينة وطباعة تقرير إداري (PDF)</div>
                    <div className="text-[10px] text-slate-400">كشف رسمي مجهز للطباعة والتوقيع</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {(user?.is_super_admin || hasPermission('documents.create')) && (
            <button id="create-document-btn" className="btn btn-primary" onClick={() => navigate('/documents/create')}>
              <Plus size={16} /> وثيقة جديدة
            </button>
          )}
        </div>
      </div>

      {/* ── Quick Filter Chips (Pills) ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none select-none">
        <button
          type="button"
          onClick={() => handleQuickFilter('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
            isAllActive
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
              : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-white/5'
          }`}
        >
          الكل
          {meta && <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/25">{meta.total}</span>}
        </button>

        <button
          type="button"
          onClick={() => handleQuickFilter('pending')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
            isPendingActive
              ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20'
              : 'bg-slate-800/80 hover:bg-slate-800 text-amber-300/80 border border-amber-500/20'
          }`}
        >
          <Clock size={13} />
          بانتظار الاعتماد
        </button>

        <button
          type="button"
          onClick={() => handleQuickFilter('approved')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
            isApprovedActive
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
              : 'bg-slate-800/80 hover:bg-slate-800 text-emerald-300/80 border border-emerald-500/20'
          }`}
        >
          <CheckCircle2 size={13} />
          معتمد
        </button>

        <button
          type="button"
          onClick={() => handleQuickFilter('in_progress')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
            isInProgressActive
              ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
              : 'bg-slate-800/80 hover:bg-slate-800 text-blue-300/80 border border-blue-500/20'
          }`}
        >
          <RefreshCw size={13} />
          قيد التنفيذ
        </button>

        <button
          type="button"
          onClick={() => handleQuickFilter('new')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
            isNewActive
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
              : 'bg-slate-800/80 hover:bg-slate-800 text-indigo-300/80 border border-indigo-500/20'
          }`}
        >
          جديد
        </button>

        <button
          type="button"
          onClick={() => handleQuickFilter('archived')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
            isArchivedActive
              ? 'bg-slate-700 text-white shadow-lg'
              : 'bg-slate-800/80 hover:bg-slate-800 text-slate-400 border border-slate-700/50'
          }`}
        >
          <Archive size={13} />
          المؤرشفة
        </button>
      </div>

      {/* ── Search & Filter Controls ── */}
      <div className="glass p-3 sm:p-4 space-y-3">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
          <div className="search-bar w-full sm:flex-1">
            <Search size={16} className="search-icon" />
            <input
              id="documents-search"
              type="text"
              className="form-input"
              placeholder="ابحث بالرقم، العنوان، الوصف، أو الكلمات المفتاحية..."
              value={filters.q}
              onChange={e => handleFilterChange('q', e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Quick Sort Dropdown */}
            <div className="flex items-center gap-1.5">
              <select
                className="form-input form-select text-xs py-1.5 px-2.5 h-10 w-auto"
                value={`${filters.sort}-${filters.dir}`}
                onChange={e => {
                  const [sort, dir] = e.target.value.split('-');
                  setFilters(f => ({ ...f, sort, dir, page: 1 }));
                }}
                title="ترتيب النتائج"
              >
                <option value="created_at-desc">الأحدث إضافة أولاً</option>
                <option value="created_at-asc">الأقدم إضافة أولاً</option>
                <option value="document_date-desc">تاريخ الوثيقة (الأحدث)</option>
                <option value="document_date-asc">تاريخ الوثيقة (الأقدم)</option>
                <option value="document_number-asc">رقم الوثيقة (تصاعدي)</option>
                <option value="document_number-desc">رقم الوثيقة (تنازلي)</option>
                <option value="title-asc">العنوان (أ - ي)</option>
                <option value="title-desc">العنوان (ي - أ)</option>
              </select>

              {/* Per Page */}
              <select
                className="form-input form-select text-xs py-1.5 px-2.5 h-10 w-auto"
                value={filters.per_page}
                onChange={e => handleFilterChange('per_page', parseInt(e.target.value))}
                title="عدد النتائج بالصفحة"
              >
                <option value={10}>10 بالصفحة</option>
                <option value={15}>15 بالصفحة</option>
                <option value={25}>25 بالصفحة</option>
                <option value={50}>50 بالصفحة</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary h-10">
              <Search size={15} /> بحث
            </button>

            <button
              type="button"
              id="toggle-filters-btn"
              className={`btn btn-secondary h-10 ${showFilters ? 'border-blue-500/40 bg-blue-500/10 text-blue-300' : ''}`}
              onClick={() => setShowFilters(v => !v)}
            >
              <SlidersHorizontal size={15} />
              <span>فلاتر تفصيلية</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
              )}
            </button>

            {hasActiveFilters && (
              <button
                type="button"
                className="btn btn-secondary text-rose-400 hover:text-rose-300 h-10"
                onClick={clearFilters}
                title="مسح كافة الفلاتر"
              >
                <X size={14} /> مسح
              </button>
            )}
          </div>
        </form>

        {/* ── Active Filters Tag Row ── */}
        {hasActiveFilters && (
          <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-white/5 text-xs">
            <span className="text-slate-400 text-[11px] font-semibold ml-1">الفلاتر المطبقة:</span>

            {filters.q && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-500/15 text-blue-300 border border-blue-500/30">
                بحث: «{filters.q}»
                <button type="button" onClick={() => handleFilterChange('q', '')} className="hover:text-white">
                  <X size={11} />
                </button>
              </span>
            )}

            {filters.category_id && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                التصنيف: {categories.find(c => String(c.id) === String(filters.category_id))?.name_ar || filters.category_id}
                <button type="button" onClick={() => handleFilterChange('category_id', '')} className="hover:text-white">
                  <X size={11} />
                </button>
              </span>
            )}

            {filters.department_id && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-violet-500/15 text-violet-300 border border-violet-500/30">
                القسم: {departments.find(d => String(d.id) === String(filters.department_id))?.name_ar || filters.department_id}
                <button type="button" onClick={() => handleFilterChange('department_id', '')} className="hover:text-white">
                  <X size={11} />
                </button>
              </span>
            )}

            {filters.status_id && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30">
                الحالة: {statuses.find(s => String(s.id) === String(filters.status_id))?.label_ar || filters.status_id}
                <button type="button" onClick={() => handleFilterChange('status_id', '')} className="hover:text-white">
                  <X size={11} />
                </button>
              </span>
            )}

            {filters.confidentiality_level_id && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-300 border border-rose-500/30">
                السرية: {confLevels.find(c => String(c.id) === String(filters.confidentiality_level_id))?.label_ar || filters.confidentiality_level_id}
                <button type="button" onClick={() => handleFilterChange('confidentiality_level_id', '')} className="hover:text-white">
                  <X size={11} />
                </button>
              </span>
            )}

            {filters.date_from && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-white/10">
                من: {filters.date_from}
                <button type="button" onClick={() => handleFilterChange('date_from', '')} className="hover:text-white">
                  <X size={11} />
                </button>
              </span>
            )}

            {filters.date_to && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-white/10">
                إلى: {filters.date_to}
                <button type="button" onClick={() => handleFilterChange('date_to', '')} className="hover:text-white">
                  <X size={11} />
                </button>
              </span>
            )}

            {filters.archived && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-700 text-slate-200 border border-slate-600">
                المؤرشفة فقط
                <button type="button" onClick={() => handleFilterChange('archived', false)} className="hover:text-white">
                  <X size={11} />
                </button>
              </span>
            )}

            <button
              type="button"
              onClick={clearFilters}
              className="text-[11px] text-rose-400 hover:underline mr-auto"
            >
              إعادة ضبط الكل
            </button>
          </div>
        )}

        {/* ── Expanded Filters Panel ── */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div>
              <label className="form-label text-xs">التصنيف الموضوعي</label>
              <select
                className="form-input form-select text-xs"
                value={filters.category_id}
                onChange={e => handleFilterChange('category_id', e.target.value)}
              >
                <option value="">كافة التصنيفات</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name_ar}</option>)}
              </select>
            </div>

            <div>
              <label className="form-label text-xs">القسم / الإدارة</label>
              <select
                className="form-input form-select text-xs"
                value={filters.department_id}
                onChange={e => handleFilterChange('department_id', e.target.value)}
              >
                <option value="">كافة الأقسام</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.parent ? `↳ ${d.name_ar}` : d.name_ar}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label text-xs">حالة الاعتماد</label>
              <select
                className="form-input form-select text-xs"
                value={filters.status_id}
                onChange={e => handleFilterChange('status_id', e.target.value)}
              >
                <option value="">كافة الحالات</option>
                {statuses.map(s => <option key={s.id} value={s.id}>{s.label_ar}</option>)}
              </select>
            </div>

            <div>
              <label className="form-label text-xs">درجة السرية</label>
              <select
                className="form-input form-select text-xs"
                value={filters.confidentiality_level_id}
                onChange={e => handleFilterChange('confidentiality_level_id', e.target.value)}
              >
                <option value="">كافة المستويات</option>
                {confLevels.map(c => <option key={c.id} value={c.id}>{c.label_ar}</option>)}
              </select>
            </div>

            <div>
              <label className="form-label text-xs">من تاريخ</label>
              <input
                type="date"
                className="form-input text-xs"
                value={filters.date_from}
                onChange={e => handleFilterChange('date_from', e.target.value)}
              />
            </div>

            <div>
              <label className="form-label text-xs">إلى تاريخ</label>
              <input
                type="date"
                className="form-input text-xs"
                value={filters.date_to}
                onChange={e => handleFilterChange('date_to', e.target.value)}
              />
            </div>
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
          <div className="empty-state py-12">
            <FileText size={48} className="mx-auto text-slate-500 mb-3" />
            <h3 className="text-base font-bold text-white mb-1">لا توجد وثائق مطابقة</h3>
            <p className="text-xs text-slate-400 mb-4">لم يتم العثور على نتائج تطابق معايير البحث والفرز المحددة</p>
            {hasActiveFilters && (
              <button className="btn btn-secondary btn-sm" onClick={clearFilters}>
                مسح الفلاتر وإظهار الكل
              </button>
            )}
          </div>
        ) : (
          <>
            {/* ── Mobile View: Sleek Document Cards (screens < 768px) ── */}
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
                        <p className="text-xs text-slate-400 mt-0.5 truncate flex items-center gap-1">
                          <Building2 size={12} className="text-slate-500" />
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

            {/* ── Desktop & Tablet View: Full Table with Interactive Sortable Headers ── */}
            <div className="hidden md:block table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('document_number')} className="cursor-pointer select-none group">
                      <div className="flex items-center gap-1.5">
                        <span>رقم الوثيقة</span>
                        {renderSortIcon('document_number')}
                      </div>
                    </th>
                    <th onClick={() => handleSort('title')} className="cursor-pointer select-none group">
                      <div className="flex items-center gap-1.5">
                        <span>العنوان</span>
                        {renderSortIcon('title')}
                      </div>
                    </th>
                    <th>التصنيف</th>
                    <th>القسم / الإدارة</th>
                    <th>الحالة</th>
                    <th>السرية</th>
                    <th onClick={() => handleSort('document_date')} className="cursor-pointer select-none group" style={{ textAlign: 'right' }}>
                      <div className="flex items-center justify-end gap-1.5">
                        <span>تاريخ الوثيقة</span>
                        {renderSortIcon('document_date')}
                      </div>
                    </th>
                    <th>المُنشئ</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {docs.map(doc => {
                    const status = STATUS_CONFIG[doc.status?.name] || {};
                    const conf   = CONF_CONFIG[doc.confidentiality_level?.name] || {};
                    return (
                      <tr key={doc.id} className="cursor-pointer group" onClick={() => navigate(`/documents/${doc.id}`)}>
                        <td>
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/25">
                            {doc.document_number}
                          </span>
                        </td>
                        <td>
                          <div className="font-semibold text-sm max-w-xs truncate text-slate-100 group-hover:text-blue-400 transition-colors">
                            {doc.title}
                          </div>
                          {doc.physical_location && (
                            <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                              موقع الحفظ: {doc.physical_location}
                            </div>
                          )}
                        </td>
                        <td>
                          <span className="text-sm text-slate-300">
                            {doc.category?.name_ar || '—'}
                          </span>
                        </td>
                        <td>
                          <div className="text-xs text-slate-300 font-medium">
                            {doc.department?.name_ar || '—'}
                          </div>
                          {doc.department?.parent && (
                            <div className="text-[10px] text-slate-500">
                              {doc.department.parent.name_ar}
                            </div>
                          )}
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
                          <span className="text-sm text-slate-400">
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

        {/* ── Pagination ── */}
        {meta && meta.last_page > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-5 py-3 sm:py-4 border-t border-white/5">
            <span className="text-xs sm:text-sm text-slate-400">
              عرض {meta.from}–{meta.to} من إجمالي {meta.total} وثيقة
            </span>
            <div className="flex items-center gap-2">
              <button
                className="btn btn-secondary btn-sm"
                disabled={meta.current_page <= 1}
                onClick={() => handleFilterChange('page', meta.current_page - 1)}
              >
                <ChevronRight size={14} /> السابق
              </button>
              <span className="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
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

      {/* ── Printable Report Modal ── */}
      {printModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-950/60 no-print">
              <div className="flex items-center gap-2.5">
                <Printer className="text-blue-400" size={20} />
                <div>
                  <h3 className="font-bold text-white text-base">معاينة تقرير كشف الوثائق</h3>
                  <p className="text-xs text-slate-400">جاهز للطباعة المباشرة أو التصدير كملف PDF</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="btn btn-primary btn-sm flex items-center gap-1.5 shadow-lg shadow-blue-500/25"
                >
                  <Printer size={15} />
                  <span>طباعة الآن / حفظ PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrintModalOpen(false)}
                  className="btn btn-secondary btn-sm"
                >
                  <X size={15} /> إغلاق
                </button>
              </div>
            </div>

            {/* Modal Printable Content */}
            <div className="p-6 sm:p-8 overflow-y-auto flex-1 bg-white text-slate-900 edms-print-area" id="edms-printable-report" dir="rtl">
              {/* Report Header */}
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4 mb-6">
                <div>
                  <h2 className="text-xl font-black text-slate-900">نظام إدارة وأرشفة وثائق تقنية المعلومات (IT-EDMS)</h2>
                  <p className="text-sm text-slate-600 mt-0.5">تقرير كشف الوثائق والمستندات الرسمية</p>
                </div>
                <div className="text-left text-xs font-mono text-slate-600 space-y-1" dir="ltr">
                  <div>Date: {new Date().toLocaleDateString('en-GB')}</div>
                  <div>Time: {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
                  <div>User: {user?.name || 'Administrator'}</div>
                </div>
              </div>

              {/* Report Meta Info */}
              <div className="grid grid-cols-3 gap-4 p-3 bg-slate-100 rounded-lg text-xs mb-6 text-slate-700">
                <div><strong>إجمالي الوثائق بالتقرير:</strong> {docs.length} وثيقة</div>
                <div><strong>الصفحة:</strong> {meta?.current_page || 1} من {meta?.last_page || 1}</div>
                <div><strong>الترتيب:</strong> {filters.sort} ({filters.dir === 'asc' ? 'تصاعدي' : 'تنازلي'})</div>
              </div>

              {/* Table */}
              <table className="w-full text-xs border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-200 text-slate-800 font-bold border-b border-slate-400">
                    <th className="p-2 border border-slate-300 text-right">#</th>
                    <th className="p-2 border border-slate-300 text-right">رقم الوثيقة</th>
                    <th className="p-2 border border-slate-300 text-right">العنوان</th>
                    <th className="p-2 border border-slate-300 text-right">التصنيف</th>
                    <th className="p-2 border border-slate-300 text-right">القسم</th>
                    <th className="p-2 border border-slate-300 text-center">الحالة</th>
                    <th className="p-2 border border-slate-300 text-center">السرية</th>
                    <th className="p-2 border border-slate-300 text-right">التاريخ</th>
                    <th className="p-2 border border-slate-300 text-right">المُنشئ</th>
                  </tr>
                </thead>
                <tbody>
                  {docs.map((d, i) => (
                    <tr key={d.id} className="border-b border-slate-200 even:bg-slate-50">
                      <td className="p-2 border border-slate-300 font-mono">{i + 1}</td>
                      <td className="p-2 border border-slate-300 font-mono font-bold">{d.document_number}</td>
                      <td className="p-2 border border-slate-300 font-semibold">{d.title}</td>
                      <td className="p-2 border border-slate-300">{d.category?.name_ar || '—'}</td>
                      <td className="p-2 border border-slate-300">{d.department?.name_ar || '—'}</td>
                      <td className="p-2 border border-slate-300 text-center">{d.status?.label_ar || d.status?.name || '—'}</td>
                      <td className="p-2 border border-slate-300 text-center">{d.confidentiality_level?.label_ar || d.confidentiality_level?.name || '—'}</td>
                      <td className="p-2 border border-slate-300 font-mono" dir="ltr">{d.document_date || '—'}</td>
                      <td className="p-2 border border-slate-300">{d.creator?.name || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 mt-12 pt-6 border-t border-slate-300 text-xs text-slate-700">
                <div className="text-center space-y-8">
                  <p className="font-bold">مسؤول الأرشيف والتوثيق</p>
                  <p className="text-slate-400">التوقيع والختم: .......................................</p>
                </div>
                <div className="text-center space-y-8">
                  <p className="font-bold">مدير إدارة تقنية المعلومات</p>
                  <p className="text-slate-400">الاعتماد: .......................................</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Print Styles for Perfect PDF Output */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #edms-printable-report, #edms-printable-report * {
            visibility: visible !important;
          }
          #edms-printable-report {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            background: #ffffff !important;
            color: #000000 !important;
            padding: 20mm !important;
            box-shadow: none !important;
            z-index: 999999 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
