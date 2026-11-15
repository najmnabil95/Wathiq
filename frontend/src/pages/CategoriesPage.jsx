import { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { categoriesAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import {
  FolderTree, Folder, FolderOpen, Plus, Search, Edit3, Trash2, FileText,
  ChevronDown, Layers, X, AlertCircle, Loader2, Network,
  Server, Monitor, KeyRound, Printer, Database, Camera, Mail, Wrench,
  Package, HardDrive, Wifi, Archive, FileStack, ShieldAlert, Check, Ban,
  ListTree, ChevronsDownUp, ChevronsUpDown,
} from 'lucide-react';
import toast from 'react-hot-toast';

const ICON_MAP = {
  folder:    Folder,
  network:   Network,
  server:    Server,
  monitor:   Monitor,
  key:       KeyRound,
  printer:   Printer,
  database:  Database,
  camera:    Camera,
  mail:      Mail,
  wrench:    Wrench,
  package:   Package,
  harddrive: HardDrive,
  wifi:      Wifi,
  archive:   Archive,
  files:     FileStack,
  shield:    ShieldAlert,
};

const ICON_OPTIONS = [
  { key: 'folder',    label: 'مجلد' },
  { key: 'files',     label: 'ملفات' },
  { key: 'archive',   label: 'أرشيف' },
  { key: 'network',   label: 'شبكة' },
  { key: 'server',    label: 'خادم' },
  { key: 'monitor',   label: 'أنظمة' },
  { key: 'key',       label: 'صلاحيات' },
  { key: 'shield',    label: 'حماية' },
  { key: 'database',  label: 'قواعد بيانات' },
  { key: 'printer',   label: 'طابعات' },
  { key: 'harddrive', label: 'أجهزة' },
  { key: 'camera',    label: 'كاميرات' },
  { key: 'wifi',      label: 'اتصالات' },
  { key: 'mail',      label: 'مراسلات' },
  { key: 'wrench',    label: 'دعم فني' },
  { key: 'package',   label: 'توريدات' },
];

const COLOR_PRESETS = ['#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#14b8a6', '#06b6d4', '#64748b'];

const EMPTY_FORM = {
  name: '',
  code: '',
  description: '',
  parent_id: '',
  icon: 'folder',
  color: '#3b82f6',
  sort_order: '',
  is_active: true,
};

function CategoryIcon({ name, className }) {
  const Icon = ICON_MAP[name] || Folder;
  return <Icon className={className} />;
}

function buildTree(list) {
  const nodes = new Map(list.map((c) => [c.id, { ...c, children: [] }]));
  const roots = [];

  for (const node of nodes.values()) {
    const parent = node.parent_id ? nodes.get(node.parent_id) : null;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }

  const sortNodes = (arr) => {
    arr.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.id - b.id);
    arr.forEach((n) => sortNodes(n.children));
  };
  sortNodes(roots);

  return roots;
}

function flattenTree(nodes, depth = 0, out = []) {
  for (const node of nodes) {
    out.push({ id: node.id, name: node.name_ar || node.name, depth });
    flattenTree(node.children, depth + 1, out);
  }
  return out;
}

export default function CategoriesPage() {
  const navigate = useNavigate();
  const { user, hasPermission } = useAuthStore();
  const isSuperAdmin = user?.is_super_admin || user?.roles?.some(r => r.name === 'super_admin');
  const canManage = isSuperAdmin || hasPermission('categories.manage');

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expanded, setExpanded] = useState(new Set());

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const expandedInitialized = useRef(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (!modalOpen && !deleteTarget) return undefined;

    const onKeyDown = (e) => {
      if (e.key !== 'Escape') return;
      if (deleteTarget) setDeleteTarget(null);
      else setModalOpen(false);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [modalOpen, deleteTarget]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await categoriesAPI.list();
      const list = res.data?.data || res.data || [];
      setCategories(list);

      if (!expandedInitialized.current) {
        expandedInitialized.current = true;
        setExpanded(new Set(list.filter((c) => (c.children_count ?? 0) > 0).map((c) => c.id)));
      }
    } catch (err) {
      console.error(err);
      toast.error('فشل تحميل التصنيفات الأرشيفية');
    } finally {
      setLoading(false);
    }
  };

  const tree = useMemo(() => buildTree(categories), [categories]);

  const stats = useMemo(() => {
    const active = categories.filter((c) => c.is_active).length;
    const docs = categories.reduce((sum, c) => sum + (c.documents_count ?? 0), 0);
    const types = categories.reduce((sum, c) => sum + (c.document_types_count ?? 0), 0);
    return {
      total: categories.length,
      active,
      inactive: categories.length - active,
      docs,
      types,
    };
  }, [categories]);

  const q = searchQuery.trim().toLowerCase();
  const isFiltering = q !== '' || statusFilter !== 'all';

  const filteredTree = useMemo(() => {
    if (!isFiltering) return tree;

    const matches = (cat) => {
      const searchOk = !q || [cat.name, cat.name_ar, cat.code, cat.description]
        .some((v) => String(v || '').toLowerCase().includes(q));
      const statusOk = statusFilter === 'all'
        || (statusFilter === 'active' ? cat.is_active : !cat.is_active);
      return searchOk && statusOk;
    };

    const prune = (nodes) => nodes
      .map((node) => ({ ...node, children: prune(node.children) }))
      .filter((node) => node.children.length > 0 || matches(node));

    return prune(tree);
  }, [tree, isFiltering, q, statusFilter]);

  const visibleCount = useMemo(() => {
    const count = (nodes) => nodes.reduce((sum, n) => sum + 1 + count(n.children), 0);
    return count(filteredTree);
  }, [filteredTree]);

  const allIds = useMemo(() => {
    const ids = [];
    const walk = (nodes) => nodes.forEach((n) => { ids.push(n.id); walk(n.children); });
    walk(filteredTree);
    return ids;
  }, [filteredTree]);

  const isExpanded = (id) => (isFiltering ? true : expanded.has(id));

  const allExpanded = allIds.length > 0 && allIds.every((id) => expanded.has(id));

  const toggleExpanded = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setExpanded(allExpanded ? new Set() : new Set(allIds));
  };
  const descendantIds = useMemo(() => {
    if (!editingCategory) return new Set();
    const result = new Set();
    const walk = (parentId) => {
      categories.forEach((c) => {
        if (c.parent_id === parentId && !result.has(c.id)) {
          result.add(c.id);
          walk(c.id);
        }
      });
    };
    walk(editingCategory.id);
    return result;
  }, [categories, editingCategory]);

  const parentOptions = useMemo(() => flattenTree(tree), [tree]);

  const openCreate = (parent = null) => {
    setEditingCategory(null);
    setFormData({
      ...EMPTY_FORM,
      parent_id: parent ? String(parent.id) : '',
      color: parent?.color || EMPTY_FORM.color,
      icon: parent?.icon || EMPTY_FORM.icon,
    });
    setModalOpen(true);
  };

  const openEdit = (cat) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name_ar || cat.name || '',
      code: cat.code || '',
      description: cat.description || '',
      parent_id: cat.parent_id ? String(cat.parent_id) : '',
      icon: cat.icon || 'folder',
      color: cat.color || '#3b82f6',
      sort_order: cat.sort_order ?? '',
      is_active: cat.is_active !== false,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('يرجى إدخال اسم التصنيف');
      return;
    }

    const payload = {
      name: formData.name.trim(),
      name_ar: formData.name.trim(),
      description: formData.description.trim() || null,
      parent_id: formData.parent_id ? parseInt(formData.parent_id, 10) : null,
      icon: formData.icon,
      color: formData.color,
      is_active: formData.is_active,
    };

    if (!editingCategory) {
      payload.code = formData.code.trim() || `CAT-${Date.now().toString().slice(-4)}`;
    } else if (formData.code.trim()) {
      payload.code = formData.code.trim();
    }

    if (formData.sort_order !== '') {
      payload.sort_order = parseInt(formData.sort_order, 10);
    }

    try {
      setSaving(true);

      if (editingCategory) {
        await categoriesAPI.update(editingCategory.id, payload);
        toast.success('تم تحديث التصنيف بنجاح');
      } else {
        await categoriesAPI.create(payload);
        toast.success('تمت إضافة التصنيف بنجاح');
      }

      setModalOpen(false);
      fetchCategories();
    } catch (err) {
      const errors = err.response?.data?.errors;
      const firstError = errors && Object.values(errors)[0]?.[0];
      toast.error(firstError || err.response?.data?.message || 'حدث خطأ أثناء حفظ التصنيف');
    } finally {
      setSaving(false);
    }
  };

  const requestDelete = (cat) => {
    setDeleteError('');
    setDeleteTarget(cat);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      setDeleting(true);
      setDeleteError('');
      await categoriesAPI.delete(deleteTarget.id);
      toast.success('تم حذف التصنيف بنجاح');
      setDeleteTarget(null);
      fetchCategories();
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'تعذر حذف التصنيف.');
    } finally {
      setDeleting(false);
    }
  };

  const renderTree = (nodes, depth = 0) => nodes.map((cat) => {
    const hasChildren = cat.children.length > 0;
    const expandedNow = hasChildren && isExpanded(cat.id);
    const color = cat.color || '#3b82f6';

    return (
      <div key={cat.id}>
        <div
          className="group flex items-start gap-2.5 sm:gap-3 py-3 pe-3 sm:pe-5 transition hover:bg-slate-800/30"
          style={{ paddingInlineStart: `${12 + depth * 22}px` }}
        >
          <button
            type="button"
            onClick={() => (hasChildren ? toggleExpanded(cat.id) : openCreate(cat))}
            aria-expanded={hasChildren ? expandedNow : undefined}
            aria-label={hasChildren ? (expandedNow ? 'طي التصنيفات الفرعية' : 'توسيع التصنيفات الفرعية') : 'إضافة تصنيف فرعي'}
            title={hasChildren ? (expandedNow ? 'طي' : 'توسيع') : 'إضافة تصنيف فرعي'}
            className={`mt-0.5 w-7 h-7 shrink-0 rounded-lg flex items-center justify-center transition cursor-pointer ${
              hasChildren
                ? 'bg-slate-800/70 text-slate-300 hover:bg-slate-700'
                : 'bg-transparent text-slate-600 hover:bg-slate-800/60 hover:text-blue-400'
            }`}
          >
            {hasChildren
              ? <ChevronDown className={`w-4 h-4 transition-transform ${expandedNow ? '' : 'rotate-90'}`} />
              : <Plus className="w-3.5 h-3.5" />}
          </button>

          <div
            className="p-2.5 rounded-xl shrink-0 shadow-sm"
            style={{ backgroundColor: `${color}1a`, color, border: `1px solid ${color}33` }}
          >
            <CategoryIcon name={cat.icon} className="w-5 h-5" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h3 className="font-bold text-sm text-white truncate">{cat.name_ar || cat.name}</h3>
              {cat.code && (
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-white/5">
                  {cat.code}
                </span>
              )}
              <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border border-slate-700/60 bg-slate-800/50 text-slate-300">
                <span className={`w-1.5 h-1.5 rounded-full ${cat.is_active ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                {cat.is_active ? 'نشط' : 'معطّل'}
              </span>
            </div>

            {cat.description && (
              <p className="text-[11px] text-slate-400 leading-relaxed mt-1 line-clamp-1">
                {cat.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-slate-800/70 text-slate-300 border border-slate-700/50">
                <FileText className="w-3 h-3 text-slate-500" />
                الوثائق: <strong className="font-mono text-slate-200">{cat.documents_count ?? 0}</strong>
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-slate-800/70 text-slate-300 border border-slate-700/50">
                <Layers className="w-3 h-3 text-slate-500" />
                الأنواع: <strong className="font-mono text-slate-200">{cat.document_types_count ?? 0}</strong>
              </span>
              {hasChildren && (
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-slate-800/70 text-slate-300 border border-slate-700/50">
                  <FolderTree className="w-3 h-3 text-slate-500" />
                  فرعية: <strong className="font-mono text-slate-200">{cat.children.length}</strong>
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => navigate(`/documents?category_id=${cat.id}`)}
              className="p-1.5 sm:p-2 rounded-lg bg-slate-800/60 hover:bg-blue-600/20 text-slate-400 hover:text-blue-300 transition cursor-pointer"
              title="عرض وثائق التصنيف"
              aria-label={`عرض وثائق ${cat.name_ar || cat.name}`}
            >
              <FolderOpen className="w-4 h-4" />
            </button>
            {canManage && (
              <>
                <button
                  type="button"
                  onClick={() => openEdit(cat)}
                  className="p-1.5 sm:p-2 rounded-lg bg-slate-800/60 hover:bg-blue-600/20 text-slate-400 hover:text-blue-300 transition cursor-pointer"
                  title="تعديل التصنيف"
                  aria-label={`تعديل ${cat.name_ar || cat.name}`}
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => requestDelete(cat)}
                  className="p-1.5 sm:p-2 rounded-lg bg-slate-800/60 hover:bg-rose-600/20 text-slate-400 hover:text-rose-300 transition cursor-pointer"
                  title="حذف التصنيف"
                  aria-label={`حذف ${cat.name_ar || cat.name}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {expandedNow && (
          <div className="border-s border-slate-800/70 ms-4 sm:ms-5">
            {renderTree(cat.children, depth + 1)}
          </div>
        )}
      </div>
    );
  });

  const statCards = [
    { label: 'إجمالي التصنيفات', value: stats.total, Icon: FolderTree, tone: 'text-blue-400 bg-blue-500/10' },
    { label: 'تصنيفات نشطة', value: stats.active, Icon: Check, tone: 'text-emerald-400 bg-emerald-500/10' },
    { label: 'تصنيفات معطّلة', value: stats.inactive, Icon: Ban, tone: 'text-amber-400 bg-amber-500/10' },
    { label: 'الوثائق المرتبطة', value: stats.docs, Icon: FileText, tone: 'text-indigo-400 bg-indigo-500/10' },
  ];

  return (
    <div className="space-y-6 pb-12 animate-fade-in" style={{ direction: 'rtl' }}>
      {/* ── Page Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <FolderTree className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">التصنيفات وهيكل الأرشفة</h1>
          </div>
          <p className="text-xs text-slate-400">
            إدارة شجرة التصنيفات الأرشيفية وتصنيفاتها الفرعية، مع عدّادات الوثائق وأنواعها وحالة التفعيل
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => openCreate()}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition shadow-lg shadow-blue-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            إضافة تصنيف جديد
          </button>
        )}
      </div>

      {/* ── Stats ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map(({ label, value, Icon, tone }) => (
          <div key={label} className="glass rounded-2xl p-4 flex items-center gap-3">
            <div className={`p-2.5 rounded-xl shrink-0 ${tone}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-slate-400 truncate">{label}</p>
              <p className="text-xl font-bold text-white font-mono leading-tight">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Toolbar ────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
        <div className="relative w-full lg:w-96">
          <Search className="w-4 h-4 absolute start-3.5 top-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="بحث بالاسم، الرمز الكودي، أو الوصف..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/80 border border-slate-800 rounded-xl ps-10 pe-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900/80 border border-slate-800">
            {[
              { key: 'all', label: 'الكل', count: stats.total },
              { key: 'active', label: 'نشطة', count: stats.active },
              { key: 'inactive', label: 'معطّلة', count: stats.inactive },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  statusFilter === tab.key
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/70'
                }`}
              >
                {tab.label}
                <span className="ms-1.5 font-mono text-[10px] opacity-80">{tab.count}</span>
              </button>
            ))}
          </div>

          {!isFiltering && (
            <button
              type="button"
              onClick={toggleAll}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition cursor-pointer"
            >
              {allExpanded
                ? <><ChevronsDownUp className="w-3.5 h-3.5" /> طي الكل</>
                : <><ChevronsUpDown className="w-3.5 h-3.5" /> توسيع الكل</>}
            </button>
          )}
        </div>
      </div>

      {/* ── Tree ───────────────────────────────────────────────────── */}
      {loading ? (
        <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden divide-y divide-slate-800/70">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 p-4 animate-pulse">
              <div className="w-7 h-7 rounded-lg bg-slate-800" />
              <div className="w-10 h-10 rounded-xl bg-slate-800" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-1/3 rounded bg-slate-800" />
                <div className="h-2.5 w-1/2 rounded bg-slate-800/70" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredTree.length === 0 ? (
        <div className="bg-slate-900/40 rounded-2xl border border-slate-800 p-12 text-center text-slate-500">
          <Folder className="w-12 h-12 mx-auto mb-3 opacity-30 text-blue-400" />
          {isFiltering ? (
            <>
              <p className="text-sm">لا توجد تصنيفات مطابقة للبحث أو الفلتر الحالي</p>
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}
                className="mt-3 text-xs font-semibold text-blue-400 hover:text-blue-300 transition cursor-pointer"
              >
                مسح الفلاتر
              </button>
            </>
          ) : (
            <>
              <p className="text-sm">لم تُضف أي تصنيفات بعد</p>
              {canManage && (
                <button
                  type="button"
                  onClick={() => openCreate()}
                  className="mt-3 text-xs font-semibold text-blue-400 hover:text-blue-300 transition cursor-pointer"
                >
                  إضافة أول تصنيف
                </button>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden">
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-slate-800/70 bg-slate-900/40">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <ListTree className="w-4 h-4 text-slate-500" />
              <span>
                عرض <strong className="text-slate-200 font-mono">{visibleCount}</strong> تصنيفًا
                {isFiltering && <span className="text-slate-500"> من أصل {stats.total}</span>}
              </span>
            </div>
            <span className="text-[11px] text-slate-500">{stats.types} نوع وثيقة مرتبط</span>
          </div>
          <div className="divide-y divide-slate-800/70">
            {renderTree(filteredTree)}
          </div>
        </div>
      )}

      {/* ── CREATE / EDIT MODAL ────────────────────────────────────── */}
      {modalOpen && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md"
          style={{ direction: 'rtl', top: 0, left: 0, right: 0, bottom: 0, margin: 0 }}
          onClick={() => setModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={editingCategory ? 'تعديل التصنيف الأرشيفي' : 'إضافة تصنيف أرشيفي جديد'}
            className="bg-[#0c1427] border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden my-auto text-right"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 shrink-0 bg-[#0c1427]">
              <div className="flex items-center gap-3">
                <div
                  className="p-2.5 rounded-xl"
                  style={{
                    backgroundColor: `${formData.color}1a`,
                    color: formData.color,
                    border: `1px solid ${formData.color}33`,
                  }}
                >
                  <CategoryIcon name={formData.icon} className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingCategory ? 'تعديل التصنيف الأرشيفي' : 'إضافة تصنيف أرشيفي جديد'}
                  </h3>
                  {editingCategory && (
                    <p className="text-[11px] text-slate-500 font-mono">{editingCategory.code}</p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="إغلاق"
                className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden m-0">
              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">اسم التصنيف *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: تعديلات البرامج والأنظمة"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-[#070d1a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">الرمز الكودي</label>
                    <input
                      type="text"
                      placeholder={editingCategory ? editingCategory.code : 'تلقائي إن تُرك فارغًا'}
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      className="w-full bg-[#070d1a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">التصنيف الأب</label>
                    <select
                      value={formData.parent_id}
                      onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                      className="w-full bg-[#070d1a] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="">— بدون (تصنيف جذري)</option>
                      {parentOptions.map((opt) => (
                        <option
                          key={opt.id}
                          value={opt.id}
                          disabled={editingCategory && (opt.id === editingCategory.id || descendantIds.has(opt.id))}
                        >
                          {opt.depth > 0 ? `${'— '.repeat(opt.depth)}` : ''}{opt.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">الوصف والغرض الأرشيفي</label>
                  <textarea
                    rows={2}
                    placeholder="شرح موجز لنوعية الوثائق والملفات التي تتبع هذا التصنيف..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-[#070d1a] border border-slate-800 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">الأيقونة</label>
                  <div className="grid grid-cols-8 gap-1.5">
                    {ICON_OPTIONS.map(({ key, label }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setFormData({ ...formData, icon: key })}
                        title={label}
                        aria-label={label}
                        aria-pressed={formData.icon === key}
                        className={`aspect-square rounded-lg flex items-center justify-center transition cursor-pointer border ${
                          formData.icon === key
                            ? 'bg-blue-600/20 border-blue-500/60 text-blue-300'
                            : 'bg-[#070d1a] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                        }`}
                      >
                        <CategoryIcon name={key} className="w-4 h-4" />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">اللون التمييزي</label>
                  <div className="flex flex-wrap items-center gap-2">
                    {COLOR_PRESETS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({ ...formData, color })}
                        aria-label={`اختيار اللون ${color}`}
                        aria-pressed={formData.color === color}
                        className={`w-7 h-7 rounded-full transition cursor-pointer border-2 ${
                          formData.color === color
                            ? 'border-transparent outline outline-2 outline-blue-500 outline-offset-2 scale-110'
                            : 'border-transparent hover:scale-105'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                    <label className="ms-1 inline-flex items-center gap-2 text-[11px] text-slate-400 cursor-pointer">
                      <input
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="w-7 h-7 rounded-lg bg-transparent border border-slate-800 cursor-pointer"
                      />
                      مخصص
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">ترتيب العرض</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="تلقائي في النهاية"
                      value={formData.sort_order}
                      onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })}
                      className="w-full bg-[#070d1a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <span className="block text-xs font-semibold text-slate-300 mb-1.5">حالة التصنيف</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={formData.is_active}
                      onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                      className={`flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                        formData.is_active
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                          : 'bg-slate-800/60 border-slate-700 text-slate-400'
                      }`}
                    >
                      <span
                        className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${formData.is_active ? 'bg-emerald-500/70' : 'bg-slate-600'}`}
                      >
                        <span
                          className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                          style={{ insetInlineStart: formData.is_active ? 2 : 18 }}
                        />
                      </span>
                      <span className="text-start leading-snug">
                        {formData.is_active ? 'نشط' : 'معطّل'}
                        <span className="block text-[10px] font-normal opacity-70">
                          {formData.is_active ? 'يظهر في نماذج إنشاء الوثائق' : 'مخفي من نماذج إنشاء الوثائق'}
                        </span>
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-[#0c1427] shrink-0">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition shadow-lg shadow-blue-600/20 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {saving ? 'جاري الحفظ...' : editingCategory ? 'حفظ التعديلات' : 'إضافة الآن'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ── DELETE CONFIRMATION ────────────────────────────────────── */}
      {deleteTarget && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md"
          style={{ direction: 'rtl' }}
          onClick={() => (deleting ? null : setDeleteTarget(null))}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-label="تأكيد حذف التصنيف"
            className="bg-[#0c1427] border border-slate-800 rounded-3xl w-full max-w-sm shadow-2xl p-6 text-right"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">حذف التصنيف</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  هل أنت متأكد من حذف التصنيف «{deleteTarget.name_ar || deleteTarget.name}»؟
                  لا يمكن التراجع عن هذا الإجراء.
                </p>
              </div>
            </div>

            {deleteError && (
              <div className="mb-4 flex items-start gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-[11px] text-rose-300 leading-relaxed">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition disabled:opacity-50 cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold transition disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                {deleting ? 'جاري الحذف...' : 'تأكيد الحذف'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
