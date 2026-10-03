import { useState, useEffect, useMemo } from 'react';
import {
  departmentsAPI
} from '../services/api';
import { useAuthStore } from '../store/authStore';
import {
  Building2, GitFork, Plus, Search, Edit3, Trash2,
  ChevronDown, ChevronRight, FileText, Users, CheckCircle2,
  AlertCircle, Shield, FolderTree, ArrowLeft, RefreshCw,
  Layers, CornerDownLeft
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function DepartmentsPage() {
  const { user } = useAuthStore();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedParentFilter, setSelectedParentFilter] = useState('all');
  const [expandedDepts, setExpandedDepts] = useState({});

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [isBranch, setIsBranch] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    name_ar: '',
    description: '',
    parent_id: '',
    is_active: true,
  });

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await departmentsAPI.list();
      const list = res.data?.data || res.data || [];
      setDepartments(list);

      // Expand all root departments by default
      const initialExpanded = {};
      list.filter(d => !d.parent_id).forEach(d => {
        initialExpanded[d.id] = true;
      });
      setExpandedDepts(initialExpanded);
    } catch (err) {
      console.error(err);
      toast.error('تعذر جلب بيانات الأقسام والفروع');
    } finally {
      setLoading(false);
    }
  };

  // Separate roots and branches
  const rootDepartments = useMemo(() => {
    return departments.filter(d => !d.parent_id);
  }, [departments]);

  const branchesMap = useMemo(() => {
    const map = {};
    rootDepartments.forEach(r => {
      map[r.id] = departments.filter(d => d.parent_id === r.id);
    });
    return map;
  }, [departments, rootDepartments]);

  const totalBranchesCount = useMemo(() => {
    return departments.filter(d => d.parent_id !== null).length;
  }, [departments]);

  const totalDocsCount = useMemo(() => {
    return departments.reduce((acc, d) => acc + (d.documents_count || 0), 0);
  }, [departments]);

  const totalUsersCount = useMemo(() => {
    return departments.reduce((acc, d) => acc + (d.users_count || 0), 0);
  }, [departments]);

  // Filtering
  const filteredRoots = useMemo(() => {
    let result = rootDepartments;

    if (selectedParentFilter !== 'all') {
      result = result.filter(r => r.id === parseInt(selectedParentFilter));
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(r => {
        const rootMatch = (
          r.name_ar?.toLowerCase().includes(q) ||
          r.name?.toLowerCase().includes(q) ||
          r.code?.toLowerCase().includes(q)
        );
        const childMatch = (branchesMap[r.id] || []).some(b =>
          b.name_ar?.toLowerCase().includes(q) ||
          b.name?.toLowerCase().includes(q) ||
          b.code?.toLowerCase().includes(q)
        );
        return rootMatch || childMatch;
      });
    }

    return result;
  }, [rootDepartments, branchesMap, selectedParentFilter, search]);

  const toggleExpand = (id) => {
    setExpandedDepts(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    const all = {};
    rootDepartments.forEach(r => { all[r.id] = true; });
    setExpandedDepts(all);
  };

  const collapseAll = () => {
    setExpandedDepts({});
  };

  // Open Modal to create
  const handleOpenCreate = (parentId = null) => {
    setModalMode('create');
    setEditingId(null);
    setIsBranch(parentId !== null);
    setFormData({
      code: parentId ? `${rootDepartments.find(r => r.id === parentId)?.code || 'DEPT'}-` : '',
      name: '',
      name_ar: '',
      description: '',
      parent_id: parentId ? String(parentId) : '',
      is_active: true,
    });
    setModalOpen(true);
  };

  // Open Modal to edit
  const handleOpenEdit = (dept) => {
    setModalMode('edit');
    setEditingId(dept.id);
    setIsBranch(dept.parent_id !== null);
    setFormData({
      code: dept.code || '',
      name: dept.name || '',
      name_ar: dept.name_ar || '',
      description: dept.description || '',
      parent_id: dept.parent_id ? String(dept.parent_id) : '',
      is_active: dept.is_active ?? true,
    });
    setModalOpen(true);
  };

  const handleParentChange = (parentId) => {
    const parent = rootDepartments.find(r => r.id === parseInt(parentId));
    setFormData(prev => ({
      ...prev,
      parent_id: parentId,
      code: prev.code && !prev.code.startsWith(parent?.code || '') && modalMode === 'create'
        ? `${parent?.code || 'DEPT'}-${prev.code.replace(/^[A-Z]+-/, '')}`
        : prev.code || `${parent?.code || 'DEPT'}-`
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name_ar.trim()) {
      toast.error('يرجى إدخال اسم القسم أو الفرع بالعربية');
      return;
    }
    if (!formData.code.trim()) {
      toast.error('يرجى تحديد الرمز الأرشيفي للقسم أو الفرع');
      return;
    }
    if (isBranch && !formData.parent_id) {
      toast.error('يرجى تحديد القسم الرئيسي التابع له هذا الفرع');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        code: formData.code.trim().toUpperCase(),
        name_ar: formData.name_ar.trim(),
        name: formData.name.trim() || formData.name_ar.trim(),
        description: formData.description.trim() || null,
        parent_id: isBranch && formData.parent_id ? parseInt(formData.parent_id) : null,
        is_active: formData.is_active,
      };

      if (modalMode === 'create') {
        await departmentsAPI.create(payload);
        toast.success(isBranch ? 'تمت إضافة الفرع بنجاح' : 'تم إنشاء القسم الرئيسي بنجاح');
      } else {
        await departmentsAPI.update(editingId, payload);
        toast.success('تم تحديث البيانات بنجاح');
      }

      setModalOpen(false);
      fetchDepartments();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'حدث خطأ أثناء حفظ البيانات');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (dept) => {
    const isParent = !dept.parent_id;
    const branches = branchesMap[dept.id] || [];

    if (isParent && branches.length > 0) {
      toast.error(`لا يمكن حذف هذا القسم لأنه يحتوي على ${branches.length} فروع تابعة. يرجى نقلها أو حذفها أولاً.`);
      return;
    }

    if (!window.confirm(`هل أنت متأكد من حذف ${dept.name_ar}؟`)) return;

    try {
      await departmentsAPI.delete(dept.id);
      toast.success('تم حذف السجل بنجاح');
      fetchDepartments();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'فشل حذف السجل (قد يكون مرتبطاً بوثائق أو مستخدمين)');
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in" style={{ direction: 'rtl' }}>
      {/* ── Page Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">الهيكل التنظيمي — الأقسام والفروع</h1>
              <p className="text-xs text-slate-400">
                إدارة الإدارات العامة، الأقسام المركزية، وتوزيع الفروع والشعب والوحدات التابعة
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenCreate(null)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-sm font-semibold transition"
          >
            <Plus className="w-4 h-4 text-blue-400" />
            إضافة قسم رئيسي
          </button>
          <button
            onClick={() => handleOpenCreate(rootDepartments[0]?.id || null)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/25 transition"
          >
            <GitFork className="w-4 h-4" />
            إضافة فرع داخل قسم
          </button>
        </div>
      </div>

      {/* ── Top Stats Cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>الإدارات والأقسام الرئيسية</span>
            <Building2 className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white">{rootDepartments.length}</div>
          <span className="text-[11px] text-blue-400/80 font-medium">مستوى قيادي مركزي</span>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>الفروع والوحدات التابعة</span>
            <GitFork className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">{totalBranchesCount}</div>
          <span className="text-[11px] text-emerald-400/80 font-medium">موزعة على الأقسام</span>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>الوثائق المرتبطة</span>
            <FileText className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400">{totalDocsCount}</div>
          <span className="text-[11px] text-amber-400/80 font-medium">وثيقة مؤرشفة</span>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>الكوادر والموظفون</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-indigo-400">{totalUsersCount}</div>
          <span className="text-[11px] text-indigo-400/80 font-medium">مستخدم ومسؤول</span>
        </div>
      </div>

      {/* ── Filters & Search ───────────────────────────────────────── */}
      <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 backdrop-blur-md flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالاسم أو الرمز الأرشيفي للقسم أو الفرع..."
            className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pr-10 pl-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedParentFilter}
            onChange={(e) => setSelectedParentFilter(e.target.value)}
            className="bg-slate-950/60 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="all">جميع الإدارات الرئيسية</option>
            {rootDepartments.map(r => (
              <option key={r.id} value={r.id}>{r.name_ar} ({r.code})</option>
            ))}
          </select>

          <button
            onClick={expandAll}
            className="px-3 py-2 text-xs rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition shrink-0"
            title="توسيع كافة الفروع"
          >
            توسيع الكل
          </button>
          <button
            onClick={collapseAll}
            className="px-3 py-2 text-xs rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition shrink-0"
            title="طي كافة الفروع"
          >
            طي الكل
          </button>
        </div>
      </div>

      {/* ── Departments & Branches Tree View ───────────────────────── */}
      {loading ? (
        <div className="p-16 flex flex-col items-center justify-center text-slate-400">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-medium">جاري تحميل الهيكل الإداري والأقسام والفروع...</p>
        </div>
      ) : filteredRoots.length === 0 ? (
        <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-12 text-center text-slate-400">
          <FolderTree className="w-12 h-12 mx-auto mb-3 text-slate-600" />
          <h3 className="text-base font-bold text-white mb-1">لا توجد أقسام مطابقة للبحث</h3>
          <p className="text-xs text-slate-500 mb-4">جرّب تغيير عبارة البحث أو إضافة فرع جديد</p>
          <button
            onClick={() => handleOpenCreate(null)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
          >
            <Plus className="w-4 h-4" />
            إضافة قسم رئيسي الآن
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRoots.map(root => {
            const branches = branchesMap[root.id] || [];
            const isExpanded = !!expandedDepts[root.id];

            return (
              <div
                key={root.id}
                className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden backdrop-blur-md transition-all hover:border-slate-700/80 shadow-lg shadow-black/20"
              >
                {/* ── Root Department Row ── */}
                <div className="p-4 sm:p-5 flex items-center justify-between gap-4 bg-slate-950/40 border-b border-slate-800/80">
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    <button
                      onClick={() => toggleExpand(root.id)}
                      className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                      title={isExpanded ? 'طي الفروع' : 'عرض الفروع التابعة'}
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-blue-400" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-slate-400" />
                      )}
                    </button>

                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center font-mono font-bold text-sm text-blue-400 shrink-0">
                      {root.code}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h2 className="text-base font-bold text-white tracking-tight truncate">
                          {root.name_ar}
                        </h2>
                        {root.name && root.name !== root.name_ar && (
                          <span className="text-xs text-slate-500 font-mono hidden md:inline">
                            ({root.name})
                          </span>
                        )}
                        <span className="text-[11px] px-2.5 py-0.5 rounded-md font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          {branches.length} فروع تابعة
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {root.description || 'إدارة مركزية رئيسية'}
                      </p>
                    </div>
                  </div>

                  {/* Actions & Counts */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="hidden sm:flex items-center gap-3 text-xs text-slate-400 border-l border-slate-800 pl-3 ml-2">
                      <span className="flex items-center gap-1 font-mono">
                        <FileText className="w-3.5 h-3.5 text-amber-400" />
                        {root.documents_count || 0}
                      </span>
                      <span className="flex items-center gap-1 font-mono">
                        <Users className="w-3.5 h-3.5 text-indigo-400" />
                        {root.users_count || 0}
                      </span>
                    </div>

                    <button
                      onClick={() => handleOpenCreate(root.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition"
                      title="إضافة فرع أو وحدة تتبع هذا القسم"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">فرع تابع</span>
                    </button>

                    <button
                      onClick={() => handleOpenEdit(root)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                      title="تعديل بيانات القسم"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDelete(root)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 transition"
                      title="حذف القسم"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* ── Sub-Branches List ── */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 pt-3 bg-slate-950/20 space-y-2.5">
                    {branches.length === 0 ? (
                      <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-500">
                        لا توجد فروع تابعة لهذا القسم حالياً.{' '}
                        <button
                          onClick={() => handleOpenCreate(root.id)}
                          className="text-blue-400 hover:underline font-semibold"
                        >
                          اضغط هنا لإضافة أول فرع
                        </button>
                      </div>
                    ) : (
                      branches.map(branch => (
                        <div
                          key={branch.id}
                          className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 transition mr-6 sm:mr-8 relative"
                        >
                          {/* Visual connector line indicator */}
                          <div className="absolute -right-5 top-1/2 -translate-y-1/2 w-4 h-0.5 bg-slate-700/80" />
                          <div className="absolute -right-5 top-0 bottom-1/2 w-0.5 bg-slate-700/80" />

                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-mono text-xs font-bold text-emerald-400 shrink-0">
                              <GitFork className="w-4 h-4" />
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-sm text-slate-200">
                                  {branch.name_ar}
                                </span>
                                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                                  {branch.code}
                                </span>
                                {branch.is_active ? (
                                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.2 rounded border border-emerald-500/20">
                                    نشط
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-rose-400 bg-rose-500/10 px-2 py-0.2 rounded border border-rose-500/20">
                                    معطل
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-400 truncate mt-0.5">
                                {branch.description || 'فرع متخصص تابع للقسم'}
                              </p>
                            </div>
                          </div>

                          {/* Branch Actions */}
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[11px] font-mono text-slate-400 bg-slate-950/60 px-2.5 py-1 rounded-lg border border-slate-800 hidden sm:inline-block">
                              {branch.documents_count || 0} وثيقة
                            </span>

                            <button
                              onClick={() => handleOpenEdit(branch)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                              title="تعديل بيانات الفرع"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleDelete(branch)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 transition"
                              title="حذف الفرع"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── CREATE / EDIT MODAL ────────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-lg space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                  {isBranch ? <GitFork className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {modalMode === 'create'
                      ? (isBranch ? 'إضافة فرع / وحدة جديدة داخل قسم' : 'إنشاء قسم رئيسي جديد')
                      : (isBranch ? 'تعديل بيانات الفرع' : 'تعديل بيانات القسم الرئيسي')}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {isBranch
                      ? 'ربط فرع تخصصي أو جغرافي تابع لإحدى الإدارات الرئيسية'
                      : 'إضافة قسم إداري رئيسي في الهيكل الهرمي'}
                  </p>
                </div>
              </div>
            </div>

            {/* Type Switcher (only in create mode) */}
            {modalMode === 'create' && (
              <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsBranch(false);
                    setFormData(prev => ({ ...prev, parent_id: '', code: '' }));
                  }}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
                    !isBranch
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  قسم رئيسي
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsBranch(true);
                    const defaultParent = rootDepartments[0];
                    setFormData(prev => ({
                      ...prev,
                      parent_id: defaultParent ? String(defaultParent.id) : '',
                      code: defaultParent ? `${defaultParent.code}-` : '',
                    }));
                  }}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
                    isBranch
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <GitFork className="w-4 h-4" />
                  فرع تابع لقسم
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Parent Department Selection (if branch) */}
              {isBranch && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    القسم الرئيسي التابع له هذا الفرع <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={formData.parent_id}
                    onChange={(e) => handleParentChange(e.target.value)}
                    required
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">اختر القسم الرئيسي...</option>
                    {rootDepartments.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.name_ar} ({r.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Name Arabic */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  اسم {isBranch ? 'الفرع أو الوحدة' : 'القسم الرئيسي'} (بالعربية) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name_ar}
                  onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                  placeholder={isBranch ? 'مثال: فرع الشبكات والاتصالات، فرع الدعم الفني...' : 'مثال: إدارة تقنية المعلومات، الإدارة المالية...'}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Code & English Name Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    الرمز الأرشيفي والكود (Code) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder={isBranch ? 'IT-NET' : 'IT'}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-mono text-blue-400 placeholder-slate-600 uppercase focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    الاسم بالإنجليزية (اختياري)
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Networks & Telecom Branch"
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  الوصف والمهام الأرشيفية
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="وصف مختصر لطبيعة المعاملات والوثائق الخاصة بهذا الفرع..."
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-3 pt-1">
                <input
                  type="checkbox"
                  id="dept-is-active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 bg-slate-950 border-slate-700 focus:ring-0"
                />
                <label htmlFor="dept-is-active" className="text-xs text-slate-300 font-medium cursor-pointer">
                  حالة النشاط (متاح للاختيار في المعاملات والوثائق)
                </label>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/25 transition disabled:opacity-50"
                >
                  {saving ? 'جاري الحفظ...' : (modalMode === 'create' ? 'إنشاء وحفظ' : 'تحديث البيانات')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
