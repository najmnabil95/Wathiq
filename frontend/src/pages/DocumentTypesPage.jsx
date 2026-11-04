import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { documentTypesAPI, categoriesAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import {
  FileType2, Plus, Search, Edit3, Trash2, X, Check,
  Layers, ListTree, ChevronDown, ChevronUp, Power, Link2, FileText,
  ShieldCheck, GripVertical, Settings2
} from 'lucide-react';
import toast from 'react-hot-toast';

const FIELD_TYPES = [
  { value: 'text',        label: 'نص قصير' },
  { value: 'textarea',    label: 'نص طويل' },
  { value: 'number',      label: 'رقم' },
  { value: 'date',        label: 'تاريخ' },
  { value: 'datetime',    label: 'تاريخ ووقت' },
  { value: 'time',        label: 'وقت' },
  { value: 'select',      label: 'قائمة منسدلة' },
  { value: 'multiselect', label: 'اختيار متعدد' },
  { value: 'checkbox',    label: 'مربعات اختيار' },
  { value: 'radio',       label: 'أزرار اختيار' },
  { value: 'email',       label: 'بريد إلكتروني' },
  { value: 'phone',       label: 'رقم هاتف' },
];

const OPTION_FIELD_TYPES = ['select', 'multiselect', 'checkbox', 'radio'];

const EMPTY_TYPE_FORM = {
  category_id: '',
  name: '',
  name_ar: '',
  code: '',
  prefix: '',
  description: '',
  requires_approval: false,
  is_active: true,
};

const EMPTY_FIELD_FORM = {
  name: '',
  label: '',
  label_ar: '',
  field_type: 'text',
  is_required: false,
  default_value: '',
  options: '',
  placeholder_ar: '',
  sort_order: '',
  is_active: true,
};

const fieldTypeLabel = (value) => FIELD_TYPES.find(t => t.value === value)?.label || value;

export default function DocumentTypesPage() {
  const navigate = useNavigate();
  const { user, hasPermission } = useAuthStore();
  const isSuperAdmin = user?.is_super_admin || user?.roles?.some(r => r.name === 'super_admin');
  const canManage = isSuperAdmin || hasPermission('document-types.manage');

  const [types, setTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Type modal
  const [typeModalOpen, setTypeModalOpen] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [typeForm, setTypeForm] = useState(EMPTY_TYPE_FORM);
  const [savingType, setSavingType] = useState(false);

  // Fields panel
  const [fieldsType, setFieldsType] = useState(null);
  const [fields, setFields] = useState([]);
  const [fieldsLoading, setFieldsLoading] = useState(false);

  // Field modal
  const [fieldModalOpen, setFieldModalOpen] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [fieldForm, setFieldForm] = useState(EMPTY_FIELD_FORM);
  const [savingField, setSavingField] = useState(false);

  const fetchTypes = useCallback(async () => {
    try {
      setLoading(true);
      const res = await documentTypesAPI.list();
      setTypes(res.data?.data || []);
    } catch {
      toast.error('فشل تحميل أنواع الوثائق');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTypes();
    categoriesAPI.list()
      .then(res => setCategories(res.data?.data || []))
      .catch(() => toast.error('فشل تحميل التصنيفات'));
  }, [fetchTypes]);

  const openCreateType = () => {
    setEditingType(null);
    setTypeForm({ ...EMPTY_TYPE_FORM, category_id: categoryFilter || '' });
    setTypeModalOpen(true);
  };

  const openEditType = (type) => {
    setEditingType(type);
    setTypeForm({
      category_id: type.category_id || '',
      name: type.name || '',
      name_ar: type.name_ar || '',
      code: type.code || '',
      prefix: type.prefix || '',
      description: type.description || '',
      requires_approval: Boolean(type.requires_approval),
      is_active: Boolean(type.is_active),
    });
    setTypeModalOpen(true);
  };

  const handleTypeSubmit = async (e) => {
    e.preventDefault();

    if (!typeForm.category_id) return toast.error('يرجى اختيار التصنيف');
    if (!typeForm.name_ar.trim()) return toast.error('يرجى إدخال الاسم العربي');
    if (!typeForm.name.trim()) return toast.error('يرجى إدخال الاسم بالإنجليزية');
    if (!typeForm.code.trim()) return toast.error('يرجى إدخال الرمز الكودي');
    if (!typeForm.prefix.trim()) return toast.error('يرجى إدخال بادئة الترقيم');

    const payload = {
      category_id: parseInt(typeForm.category_id),
      name: typeForm.name.trim(),
      name_ar: typeForm.name_ar.trim(),
      code: typeForm.code.trim().toUpperCase(),
      prefix: typeForm.prefix.trim().toUpperCase(),
      description: typeForm.description.trim() || null,
      requires_approval: Boolean(typeForm.requires_approval),
      is_active: Boolean(typeForm.is_active),
    };

    try {
      setSavingType(true);
      if (editingType) {
        await documentTypesAPI.update(editingType.id, payload);
        toast.success('تم تحديث نوع الوثيقة بنجاح');
      } else {
        await documentTypesAPI.create(payload);
        toast.success('تمت إضافة نوع الوثيقة بنجاح');
      }
      setTypeModalOpen(false);
      fetchTypes();
    } catch (err) {
      const errors = err.response?.data?.errors;
      const firstError = errors ? Object.values(errors)[0]?.[0] : null;
      toast.error(firstError || err.response?.data?.message || 'تعذر حفظ نوع الوثيقة');
    } finally {
      setSavingType(false);
    }
  };

  const handleDeleteType = async (type) => {
    if (!window.confirm(`هل أنت متأكد من حذف نوع الوثيقة "${type.name_ar || type.name}"؟`)) return;

    try {
      await documentTypesAPI.delete(type.id);
      toast.success('تم حذف نوع الوثيقة');
      if (fieldsType?.id === type.id) setFieldsType(null);
      fetchTypes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'تعذر حذف نوع الوثيقة');
    }
  };

  const handleToggleTypeActive = async (type) => {
    try {
      await documentTypesAPI.update(type.id, { is_active: !type.is_active });
      setTypes(prev => prev.map(t => t.id === type.id ? { ...t, is_active: !t.is_active } : t));
      toast.success(type.is_active ? 'تم تعطيل نوع الوثيقة' : 'تم تفعيل نوع الوثيقة');
    } catch (err) {
      toast.error(err.response?.data?.message || 'تعذر تحديث حالة نوع الوثيقة');
    }
  };

  const openFieldsPanel = async (type) => {
    if (fieldsType?.id === type.id) {
      setFieldsType(null);
      return;
    }

    setFieldsType(type);
    setFields([]);
    setFieldsLoading(true);
    try {
      const res = await documentTypesAPI.fields(type.id, { all: 1 });
      setFields(res.data?.data || []);
    } catch {
      toast.error('تعذر تحميل الحقول الديناميكية');
    } finally {
      setFieldsLoading(false);
    }
  };

  const refreshFields = async (typeId) => {
    try {
      const res = await documentTypesAPI.fields(typeId, { all: 1 });
      setFields(res.data?.data || []);
    } catch {
      toast.error('تعذر تحديث قائمة الحقول');
    }
  };

  const openCreateField = () => {
    setEditingField(null);
    setFieldForm({ ...EMPTY_FIELD_FORM, sort_order: String(fields.length + 1) });
    setFieldModalOpen(true);
  };

  const openEditField = (field) => {
    setEditingField(field);
    setFieldForm({
      name: field.name || '',
      label: field.label || '',
      label_ar: field.label_ar || '',
      field_type: field.field_type || 'text',
      is_required: Boolean(field.is_required),
      default_value: field.default_value || '',
      options: Array.isArray(field.options) ? field.options.join(', ') : '',
      placeholder_ar: field.placeholder_ar || '',
      sort_order: field.sort_order ?? '',
      is_active: Boolean(field.is_active),
    });
    setFieldModalOpen(true);
  };

  const handleFieldSubmit = async (e) => {
    e.preventDefault();

    if (!fieldsType) return;
    if (!fieldForm.label_ar.trim()) return toast.error('يرجى إدخال اسم الحقل بالعربية');
    if (!fieldForm.label.trim()) return toast.error('يرجى إدخال اسم الحقل بالإنجليزية');
    if (!editingField && !fieldForm.name.trim()) return toast.error('يرجى إدخال المعرف البرمجي للحقل');

    const options = OPTION_FIELD_TYPES.includes(fieldForm.field_type)
      ? fieldForm.options.split(',').map(o => o.trim()).filter(Boolean)
      : [];

    if (OPTION_FIELD_TYPES.includes(fieldForm.field_type) && options.length === 0) {
      return toast.error('يرجى إضافة خيار واحد على الأقل مفصولاً بفاصلة');
    }

    const payload = {
      label: fieldForm.label.trim(),
      label_ar: fieldForm.label_ar.trim(),
      field_type: fieldForm.field_type,
      is_required: Boolean(fieldForm.is_required),
      default_value: fieldForm.default_value.trim() || null,
      options: options.length ? options : null,
      placeholder_ar: fieldForm.placeholder_ar.trim() || null,
      sort_order: fieldForm.sort_order === '' ? null : parseInt(fieldForm.sort_order),
      is_active: Boolean(fieldForm.is_active),
    };

    try {
      setSavingField(true);
      if (editingField) {
        await documentTypesAPI.updateField(editingField.id, payload);
        toast.success('تم تحديث الحقل بنجاح');
      } else {
        await documentTypesAPI.addField(fieldsType.id, {
          ...payload,
          name: fieldForm.name.trim(),
        });
        toast.success('تمت إضافة الحقل بنجاح');
      }
      setFieldModalOpen(false);
      refreshFields(fieldsType.id);
      fetchTypes();
    } catch (err) {
      const errors = err.response?.data?.errors;
      const firstError = errors ? Object.values(errors)[0]?.[0] : null;
      toast.error(firstError || err.response?.data?.message || 'تعذر حفظ الحقل');
    } finally {
      setSavingField(false);
    }
  };

  const handleDeleteField = async (field) => {
    if (!window.confirm(`هل أنت متأكد من حذف الحقل "${field.label_ar}"؟`)) return;

    try {
      const res = await documentTypesAPI.deleteField(field.id);
      toast.success(res.data?.message || 'تم حذف الحقل');
      refreshFields(fieldsType.id);
      fetchTypes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'تعذر حذف الحقل');
    }
  };

  const handleToggleFieldActive = async (field) => {
    try {
      await documentTypesAPI.updateField(field.id, { is_active: !field.is_active });
      setFields(prev => prev.map(f => f.id === field.id ? { ...f, is_active: !f.is_active } : f));
      toast.success(field.is_active ? 'تم تعطيل الحقل' : 'تم تفعيل الحقل');
    } catch (err) {
      toast.error(err.response?.data?.message || 'تعذر تحديث حالة الحقل');
    }
  };

  const filteredTypes = types.filter(type => {
    if (categoryFilter && String(type.category_id) !== String(categoryFilter)) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      type.name?.toLowerCase().includes(q) ||
      type.name_ar?.toLowerCase().includes(q) ||
      type.code?.toLowerCase().includes(q) ||
      type.prefix?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 pb-12 animate-fade-in" style={{ direction: 'rtl' }}>
      {/* ── Page Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <FileType2 className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">أنواع الوثائق والحقول الديناميكية</h1>
          </div>
          <p className="text-xs text-slate-400">
            تعريف أنواع الوثائق، بادئات الترقيم التلقائي، ومخطط الحقول الوصفية المخصصة لكل نوع
          </p>
        </div>

        {canManage && (
          <button
            onClick={openCreateType}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition shadow-lg shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" />
            إضافة نوع وثيقة
          </button>
        )}
      </div>

      {/* ── Filters ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute right-3.5 top-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="بحث بالاسم أو الرمز..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pr-10 pl-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="">كل التصنيفات</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name_ar || c.name}</option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-400">
          إجمالي الأنواع: <strong className="text-slate-200 font-mono text-sm">{types.length}</strong>
        </div>
      </div>

      {/* ── Types List ─────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-slate-400">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs font-medium">جاري تحميل أنواع الوثائق...</p>
        </div>
      ) : filteredTypes.length === 0 ? (
        <div className="bg-slate-900/40 rounded-2xl border border-slate-800 p-12 text-center text-slate-500">
          <FileType2 className="w-12 h-12 mx-auto mb-3 opacity-30 text-indigo-400" />
          <p className="text-sm">لا توجد أنواع وثائق مطابقة</p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredTypes.map((type) => {
            const isOpen = fieldsType?.id === type.id;
            return (
              <div key={type.id} className="bg-slate-900/60 rounded-2xl border border-slate-800 backdrop-blur-md overflow-hidden">
                <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
                      <FileType2 className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-white text-sm sm:text-base">{type.name_ar || type.name}</h3>
                        <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-white/5">
                          {type.code}
                        </span>
                        {type.is_active ? (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">مفعّل</span>
                        ) : (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-700/40 text-slate-400 border border-slate-600/40">معطّل</span>
                        )}
                        {type.requires_approval && (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            يتطلب اعتماد
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-[11px] text-slate-400">
                        <span>{type.category?.name_ar || type.category?.name || 'بدون تصنيف'}</span>
                        <span className="font-mono">بادئة الترقيم: <strong className="text-slate-300">{type.prefix}</strong></span>
                        <span className="flex items-center gap-1"><Layers className="w-3 h-3" /> حقول: <strong className="text-slate-300">{type.fields_count ?? 0}</strong></span>
                        <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> وثائق: <strong className="text-slate-300">{type.documents_count ?? 0}</strong></span>
                      </div>
                      {type.description && (
                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{type.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => openFieldsPanel(type)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                        isOpen
                          ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40'
                          : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:border-indigo-500/40 hover:text-indigo-300'
                      }`}
                    >
                      <ListTree className="w-3.5 h-3.5" />
                      الحقول الديناميكية
                      {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      onClick={() => navigate(`/documents?document_type_id=${type.id}`)}
                      className="p-2 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-400 hover:text-sky-300 hover:border-sky-500/40 transition"
                      title="استعراض وثائق هذا النوع"
                    >
                      <Link2 className="w-4 h-4" />
                    </button>

                    {canManage && (
                      <>
                        <button
                          onClick={() => handleToggleTypeActive(type)}
                          className={`p-2 rounded-xl bg-slate-800/80 border transition ${
                            type.is_active
                              ? 'border-slate-700 text-emerald-400 hover:border-emerald-500/40'
                              : 'border-slate-700 text-slate-500 hover:border-emerald-500/40'
                          }`}
                          title={type.is_active ? 'تعطيل النوع' : 'تفعيل النوع'}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditType(type)}
                          className="p-2 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-400 hover:text-indigo-300 hover:border-indigo-500/40 transition"
                          title="تعديل نوع الوثيقة"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteType(type)}
                          className="p-2 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-400 hover:text-rose-300 hover:border-rose-500/40 transition"
                          title="حذف نوع الوثيقة"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* ── Dynamic Fields Panel ─────────────────────────── */}
                {isOpen && (
                  <div className="border-t border-slate-800 bg-slate-950/40 p-4 sm:p-5 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                        <Settings2 className="w-4 h-4 text-indigo-400" />
                        مخطط الحقول الوصفية المخصصة
                        <span className="text-[11px] font-normal text-slate-500">({fields.length} حقل)</span>
                      </h4>
                      {canManage && (
                        <button
                          onClick={openCreateField}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          إضافة حقل
                        </button>
                      )}
                    </div>

                    {fieldsLoading ? (
                      <div className="py-6 text-center text-xs text-slate-500">جاري تحميل الحقول...</div>
                    ) : fields.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-500">
                        لا توجد حقول مخصصة لهذا النوع بعد — أضف حقلاً لتبدأ بتوسيع البيانات الوصفية.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-slate-500 border-b border-slate-800">
                              <th className="text-right font-medium py-2 px-2">الحقل</th>
                              <th className="text-right font-medium py-2 px-2">النوع</th>
                              <th className="text-right font-medium py-2 px-2">إلزامي</th>
                              <th className="text-right font-medium py-2 px-2">الترتيب</th>
                              <th className="text-right font-medium py-2 px-2">الحالة</th>
                              {canManage && <th className="text-left font-medium py-2 px-2">إجراءات</th>}
                            </tr>
                          </thead>
                          <tbody>
                            {fields.map(field => (
                              <tr key={field.id} className="border-b border-slate-800/60 last:border-0">
                                <td className="py-2.5 px-2">
                                  <div className="font-semibold text-slate-200">{field.label_ar}</div>
                                  <div className="font-mono text-[10px] text-slate-500 flex items-center gap-1">
                                    <GripVertical className="w-3 h-3" />
                                    {field.name}
                                  </div>
                                </td>
                                <td className="py-2.5 px-2">
                                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                    {fieldTypeLabel(field.field_type)}
                                  </span>
                                </td>
                                <td className="py-2.5 px-2">
                                  {field.is_required ? (
                                    <span className="inline-flex items-center gap-1 text-emerald-400"><Check className="w-3.5 h-3.5" /> نعم</span>
                                  ) : (
                                    <span className="text-slate-500">اختياري</span>
                                  )}
                                </td>
                                <td className="py-2.5 px-2 font-mono text-slate-400">{field.sort_order ?? '—'}</td>
                                <td className="py-2.5 px-2">
                                  {field.is_active ? (
                                    <span className="text-emerald-400">مفعّل</span>
                                  ) : (
                                    <span className="text-slate-500">معطّل</span>
                                  )}
                                </td>
                                {canManage && (
                                  <td className="py-2.5 px-2">
                                    <div className="flex items-center justify-end gap-1">
                                      <button
                                        onClick={() => handleToggleFieldActive(field)}
                                        className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-emerald-300 transition"
                                        title={field.is_active ? 'تعطيل الحقل' : 'تفعيل الحقل'}
                                      >
                                        <Power className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => openEditField(field)}
                                        className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-indigo-300 transition"
                                        title="تعديل الحقل"
                                      >
                                        <Edit3 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteField(field)}
                                        className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-rose-300 transition"
                                        title="حذف الحقل"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── TYPE CREATE / EDIT MODAL ─────────────────────────────── */}
      {typeModalOpen && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md"
          style={{ direction: 'rtl' }}
          onClick={() => setTypeModalOpen(false)}
        >
          <div
            className="bg-[#0c1427] border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[88vh] overflow-hidden my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 shrink-0">
              <h3 className="text-base font-bold text-white">
                {editingType ? 'تعديل نوع الوثيقة' : 'إضافة نوع وثيقة جديد'}
              </h3>
              <button
                type="button"
                onClick={() => setTypeModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleTypeSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">التصنيف الأرشيفي *</label>
                  <select
                    value={typeForm.category_id}
                    onChange={(e) => setTypeForm({ ...typeForm, category_id: e.target.value })}
                    className="w-full bg-[#070d1a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">اختر التصنيف...</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name_ar || c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">الاسم بالعربية *</label>
                    <input
                      type="text"
                      value={typeForm.name_ar}
                      onChange={(e) => setTypeForm({ ...typeForm, name_ar: e.target.value })}
                      placeholder="مثال: تعديل نظام"
                      className="w-full bg-[#070d1a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">الاسم بالإنجليزية *</label>
                    <input
                      type="text"
                      value={typeForm.name}
                      onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })}
                      placeholder="System Modification"
                      className="w-full bg-[#070d1a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">الرمز الكودي *</label>
                    <input
                      type="text"
                      value={typeForm.code}
                      onChange={(e) => setTypeForm({ ...typeForm, code: e.target.value.toUpperCase() })}
                      placeholder="SYS-MOD"
                      className="w-full bg-[#070d1a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">بادئة الترقيم *</label>
                    <input
                      type="text"
                      value={typeForm.prefix}
                      onChange={(e) => setTypeForm({ ...typeForm, prefix: e.target.value.toUpperCase() })}
                      placeholder="MOD"
                      className="w-full bg-[#070d1a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      تُستخدم في رقم الوثيقة التلقائي: {typeForm.prefix || 'MOD'}-2026-0001
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">الوصف</label>
                  <textarea
                    rows={3}
                    value={typeForm.description}
                    onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })}
                    placeholder="شرح موجز لنوع الوثيقة وطبيعة محتواها..."
                    className="w-full bg-[#070d1a] border border-slate-800 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 rounded-xl bg-[#070d1a] border border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={typeForm.requires_approval}
                      onChange={(e) => setTypeForm({ ...typeForm, requires_approval: e.target.checked })}
                      className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-0"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-200 block">يتطلب سير اعتماد</span>
                      <span className="text-[11px] text-slate-500">يُفعّل إسناد قالب سير عمل ومراحل اعتماد عند إنشاء وثيقة من هذا النوع.</span>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 rounded-xl bg-[#070d1a] border border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={typeForm.is_active}
                      onChange={(e) => setTypeForm({ ...typeForm, is_active: e.target.checked })}
                      className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-0"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-200 block">نوع مفعّل</span>
                      <span className="text-[11px] text-slate-500">يظهر في نموذج إنشاء وثيقة جديدة.</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setTypeModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={savingType}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                >
                  {savingType ? 'جاري الحفظ...' : editingType ? 'حفظ التعديلات' : 'إضافة النوع'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ── FIELD CREATE / EDIT MODAL ────────────────────────────── */}
      {fieldModalOpen && fieldsType && createPortal(
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md"
          style={{ direction: 'rtl' }}
          onClick={() => setFieldModalOpen(false)}
        >
          <div
            className="bg-[#0c1427] border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[88vh] overflow-hidden my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 shrink-0">
              <div>
                <h3 className="text-base font-bold text-white">
                  {editingField ? 'تعديل الحقل الديناميكي' : 'إضافة حقل ديناميكي'}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">{fieldsType.name_ar || fieldsType.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setFieldModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFieldSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">اسم الحقل بالعربية *</label>
                    <input
                      type="text"
                      value={fieldForm.label_ar}
                      onChange={(e) => setFieldForm({ ...fieldForm, label_ar: e.target.value })}
                      placeholder="مثال: رقم الرخصة"
                      className="w-full bg-[#070d1a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">اسم الحقل بالإنجليزية *</label>
                    <input
                      type="text"
                      value={fieldForm.label}
                      onChange={(e) => setFieldForm({ ...fieldForm, label: e.target.value })}
                      placeholder="License Number"
                      className="w-full bg-[#070d1a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">المعرف البرمجي (Name) *</label>
                  <input
                    type="text"
                    value={fieldForm.name}
                    onChange={(e) => setFieldForm({ ...fieldForm, name: e.target.value.replace(/\s+/g, '_').toLowerCase() })}
                    disabled={Boolean(editingField)}
                    placeholder="license_number"
                    className="w-full bg-[#070d1a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">حروف إنجليزية وأرقام وشرطات سفلية فقط، ويُستخدم للربط التقني.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">نوع الحقل *</label>
                    <select
                      value={fieldForm.field_type}
                      onChange={(e) => setFieldForm({ ...fieldForm, field_type: e.target.value })}
                      className="w-full bg-[#070d1a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                    >
                      {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">الترتيب</label>
                    <input
                      type="number"
                      min="0"
                      value={fieldForm.sort_order}
                      onChange={(e) => setFieldForm({ ...fieldForm, sort_order: e.target.value })}
                      className="w-full bg-[#070d1a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {OPTION_FIELD_TYPES.includes(fieldForm.field_type) && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">خيارات الحقل *</label>
                    <input
                      type="text"
                      value={fieldForm.options}
                      onChange={(e) => setFieldForm({ ...fieldForm, options: e.target.value })}
                      placeholder="خيار أول، خيار ثاني، خيار ثالث"
                      className="w-full bg-[#070d1a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">افصل بين الخيارات بفاصلة (,)</p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">القيمة الافتراضية</label>
                    <input
                      type="text"
                      value={fieldForm.default_value}
                      onChange={(e) => setFieldForm({ ...fieldForm, default_value: e.target.value })}
                      className="w-full bg-[#070d1a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">نص إرشادي (Placeholder)</label>
                    <input
                      type="text"
                      value={fieldForm.placeholder_ar}
                      onChange={(e) => setFieldForm({ ...fieldForm, placeholder_ar: e.target.value })}
                      className="w-full bg-[#070d1a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 rounded-xl bg-[#070d1a] border border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={fieldForm.is_required}
                      onChange={(e) => setFieldForm({ ...fieldForm, is_required: e.target.checked })}
                      className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-0"
                    />
                    <span className="text-xs font-semibold text-slate-200">حقل إلزامي عند إنشاء الوثيقة</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 rounded-xl bg-[#070d1a] border border-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={fieldForm.is_active}
                      onChange={(e) => setFieldForm({ ...fieldForm, is_active: e.target.checked })}
                      className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-0"
                    />
                    <span className="text-xs font-semibold text-slate-200">حقل مفعّل ويظهر في النموذج</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setFieldModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={savingField}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                >
                  {savingField ? 'جاري الحفظ...' : editingField ? 'حفظ التعديلات' : 'إضافة الحقل'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
