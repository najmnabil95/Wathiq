import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { workflowsAPI, documentTypesAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import {
  GitBranch, Plus, Search, Edit3, Trash2, X, ShieldAlert,
  ChevronLeft, Layers, Eye, Info, FileText, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';

const ACTION_TYPES = [
  { value: 'approve',     label: 'اعتماد' },
  { value: 'review',      label: 'مراجعة' },
  { value: 'acknowledge', label: 'إطلاع' },
];

const ACTION_STYLES = {
  approve:     { label: 'اعتماد',  cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  review:      { label: 'مراجعة',  cls: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  acknowledge: { label: 'إطلاع',   cls: 'bg-sky-500/15 text-sky-300 border-sky-500/30' },
};

const emptyTemplateForm = {
  document_type_id: '',
  name: '',
  name_ar: '',
  description: '',
  is_active: true,
  steps: [],
};

const emptyStepForm = {
  name: '',
  name_ar: '',
  role_id: '',
  action_type: 'approve',
  is_required: true,
  instructions: '',
};

export default function WorkflowsPage() {
  const { user, hasPermission } = useAuthStore();
  const isSuperAdmin = user?.is_super_admin || user?.roles?.some(r => r.name === 'super_admin');
  const canManage = isSuperAdmin || hasPermission('workflows.manage');

  const [workflows, setWorkflows] = useState([]);
  const [roles, setRoles] = useState([]);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  // Template modal
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [templateForm, setTemplateForm] = useState(emptyTemplateForm);
  const [savingTemplate, setSavingTemplate] = useState(false);

  // Step modal
  const [stepModalOpen, setStepModalOpen] = useState(false);
  const [stepParent, setStepParent] = useState(null);
  const [editingStep, setEditingStep] = useState(null);
  const [stepForm, setStepForm] = useState(emptyStepForm);
  const [savingStep, setSavingStep] = useState(false);

  const fetchWorkflows = useCallback(async () => {
    try {
      setLoading(true);
      const res = await workflowsAPI.list();
      setWorkflows(res.data?.data || []);
    } catch (err) {
      console.error(err);
      toast.error('فشل تحميل قوالب سير العمل');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkflows();
    Promise.all([workflowsAPI.roles(), documentTypesAPI.list()])
      .then(([rolesRes, typesRes]) => {
        setRoles(rolesRes.data?.data || []);
        setDocumentTypes(typesRes.data?.data || []);
      })
      .catch(() => toast.error('تعذر تحميل الأدوار وأنواع الوثائق'));
  }, [fetchWorkflows]);

  // ── Template handlers ─────────────────────────────────────────
  const handleOpenCreateTemplate = () => {
    setEditingTemplate(null);
    setTemplateForm(emptyTemplateForm);
    setTemplateModalOpen(true);
  };

  const handleOpenEditTemplate = (wf) => {
    setEditingTemplate(wf);
    setTemplateForm({
      document_type_id: wf.document_type_id || '',
      name: wf.name || '',
      name_ar: wf.name_ar || '',
      description: wf.description || '',
      is_active: Boolean(wf.is_active),
      steps: wf.steps || [],
    });
    setTemplateModalOpen(true);
  };

  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    if (!templateForm.name_ar.trim() || !templateForm.name.trim()) {
      toast.error('يرجى إدخال اسم القالب بالعربية والإنجليزية');
      return;
    }
    if (!templateForm.document_type_id) {
      toast.error('يرجى اختيار نوع الوثيقة');
      return;
    }

    const payload = {
      document_type_id: parseInt(templateForm.document_type_id),
      name: templateForm.name.trim(),
      name_ar: templateForm.name_ar.trim(),
      description: templateForm.description.trim() || null,
      is_active: Boolean(templateForm.is_active),
    };

    try {
      setSavingTemplate(true);
      if (editingTemplate) {
        await workflowsAPI.update(editingTemplate.id, payload);
        toast.success('تم تحديث القالب بنجاح');
      } else {
        await workflowsAPI.create({ ...payload, steps: templateForm.steps || [] });
        toast.success('تم إنشاء القالب بنجاح');
      }
      setTemplateModalOpen(false);
      fetchWorkflows();
    } catch (err) {
      toast.error(err.response?.data?.message || 'حدث خطأ أثناء حفظ القالب');
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleDeleteTemplate = async (wf) => {
    if (!window.confirm(`هل أنت متأكد من حذف قالب "${wf.name_ar || wf.name}"؟`)) return;
    try {
      await workflowsAPI.delete(wf.id);
      toast.success('تم حذف القالب بنجاح');
      fetchWorkflows();
    } catch (err) {
      toast.error(err.response?.data?.message || 'تعذر حذف القالب');
    }
  };

  const handleToggleActive = async (wf) => {
    try {
      await workflowsAPI.update(wf.id, { is_active: !wf.is_active });
      setWorkflows(prev => prev.map(w => w.id === wf.id ? { ...w, is_active: !w.is_active } : w));
      toast.success(!wf.is_active ? 'تم تفعيل القالب' : 'تم تعطيل القالب');
    } catch (err) {
      toast.error(err.response?.data?.message || 'تعذر تحديث حالة القالب');
    }
  };

  // ── Step handlers ─────────────────────────────────────────────
  const handleOpenAddStep = (wf) => {
    setStepParent(wf);
    setEditingStep(null);
    setStepForm(emptyStepForm);
    setStepModalOpen(true);
  };

  const handleOpenEditStep = (wf, step) => {
    setStepParent(wf);
    setEditingStep(step);
    setStepForm({
      name: step.name || '',
      name_ar: step.name_ar || '',
      role_id: step.role_id || '',
      action_type: step.action_type || 'approve',
      is_required: Boolean(step.is_required),
      instructions: step.instructions || '',
    });
    setStepModalOpen(true);
  };

  const handleSaveStep = async (e) => {
    e.preventDefault();
    if (!stepForm.name_ar.trim() || !stepForm.name.trim()) {
      toast.error('يرجى إدخال اسم المرحلة بالعربية والإنجليزية');
      return;
    }

    const payload = {
      name: stepForm.name.trim(),
      name_ar: stepForm.name_ar.trim(),
      role_id: stepForm.role_id ? parseInt(stepForm.role_id) : null,
      action_type: stepForm.action_type,
      is_required: Boolean(stepForm.is_required),
      instructions: stepForm.instructions.trim() || null,
    };

    try {
      setSavingStep(true);
      if (editingStep) {
        await workflowsAPI.updateStep(stepParent.id, editingStep.id, payload);
        toast.success('تم تحديث المرحلة');
      } else {
        await workflowsAPI.addStep(stepParent.id, payload);
        toast.success('تمت إضافة المرحلة');
      }
      setStepModalOpen(false);
      fetchWorkflows();
    } catch (err) {
      toast.error(err.response?.data?.message || 'تعذر حفظ المرحلة');
    } finally {
      setSavingStep(false);
    }
  };

  const handleDeleteStep = async (wf, step) => {
    if (!window.confirm(`هل أنت متأكد من حذف مرحلة "${step.name_ar || step.name}"؟`)) return;
    try {
      await workflowsAPI.deleteStep(wf.id, step.id);
      toast.success('تم حذف المرحلة');
      fetchWorkflows();
    } catch (err) {
      toast.error(err.response?.data?.message || 'تعذر حذف المرحلة');
    }
  };

  const filtered = workflows.filter(wf => {
    const q = searchQuery.toLowerCase();
    return (
      wf.name?.toLowerCase().includes(q) ||
      wf.name_ar?.toLowerCase().includes(q) ||
      wf.description?.toLowerCase().includes(q) ||
      wf.document_type?.name_ar?.toLowerCase().includes(q) ||
      wf.document_type?.name?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 pb-12 animate-fade-in" style={{ direction: 'rtl' }}>
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400">
              <GitBranch className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">قوالب سير العمل والاعتماد</h1>
          </div>
          <p className="text-xs text-slate-400">
            تعريف مسارات الاعتماد متعددة المراحل لكل نوع وثيقة، مع الأدوار المسؤولة وترتيب المراحل
          </p>
        </div>

        {canManage && (
          <button
            onClick={handleOpenCreateTemplate}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition shadow-lg shadow-violet-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            إضافة قالب جديد
          </button>
        )}
      </div>

      {/* ── Search & Count ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute right-3.5 top-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="بحث باسم القالب أو نوع الوثيقة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pr-10 pl-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500"
          />
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span>إجمالي القوالب: <strong className="text-slate-200 font-mono text-sm">{workflows.length}</strong></span>
          <span className="text-slate-700">|</span>
          <span>النشطة: <strong className="text-emerald-400 font-mono text-sm">{workflows.filter(w => w.is_active).length}</strong></span>
        </div>
      </div>

      {/* ── Workflow List ──────────────────────────────────────── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-slate-400">
          <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs font-medium">جاري تحميل قوالب سير العمل...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-slate-900/40 rounded-2xl border border-slate-800 p-12 text-center text-slate-500">
          <GitBranch className="w-12 h-12 mx-auto mb-3 opacity-30 text-violet-400" />
          <p className="text-sm">لا توجد قوالب سير عمل مطابقة</p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filtered.map((wf) => {
            const isExpanded = expandedId === wf.id;
            const steps = wf.steps || [];
            return (
              <div
                key={wf.id}
                className="glass rounded-2xl overflow-hidden animate-fade-in"
                style={{ border: '1px solid var(--app-user-chip-border)' }}
              >
                {/* Template header row */}
                <div className="p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20 shrink-0">
                        <GitBranch className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-white text-base">{wf.name_ar || wf.name}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            wf.is_active
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              : 'bg-slate-700/50 text-slate-400 border-slate-600/50'
                          }`}>
                            {wf.is_active ? 'نشط' : 'معطل'}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-[11px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5 text-slate-500" />
                            {wf.document_type?.name_ar || wf.document_type?.name || 'نوع غير محدد'}
                            {wf.document_type?.code && (
                              <code className="font-mono text-[10px] text-slate-500">({wf.document_type.code})</code>
                            )}
                          </span>
                          <span className="flex items-center gap-1">
                            <Layers className="w-3.5 h-3.5 text-slate-500" />
                            {steps.length} مرحلة
                          </span>
                          <span className="text-slate-500 font-mono text-[10px]">{wf.name}</span>
                        </div>
                        {wf.description && (
                          <p className="text-xs text-slate-400 mt-2 leading-relaxed">{wf.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-start">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : wf.id)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition cursor-pointer"
                        title="عرض المراحل"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        {isExpanded ? 'إخفاء المراحل' : 'عرض المراحل'}
                        <ChevronLeft className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                      </button>
                      {canManage && (
                        <>
                          <button
                            onClick={() => handleToggleActive(wf)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-amber-600/25 text-slate-400 hover:text-amber-300 text-[11px] font-medium transition cursor-pointer"
                            title={wf.is_active ? 'تعطيل القالب' : 'تفعيل القالب'}
                          >
                            {wf.is_active ? 'تعطيل' : 'تفعيل'}
                          </button>
                          <button
                            onClick={() => handleOpenEditTemplate(wf)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-violet-600/30 text-slate-400 hover:text-violet-300 transition cursor-pointer"
                            title="تعديل القالب"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTemplate(wf)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600/30 text-slate-400 hover:text-rose-300 transition cursor-pointer"
                            title="حذف القالب"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Steps timeline */}
                {isExpanded && (
                  <div className="border-t border-slate-800/80 bg-[#080e1c]/50 p-4 sm:p-5">
                    {steps.length === 0 ? (
                      <div className="text-center py-6 text-slate-500">
                        <Info className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p className="text-xs">لا توجد مراحل معرّفة لهذا القالب بعد.</p>
                        {canManage && (
                          <button
                            onClick={() => handleOpenAddStep(wf)}
                            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-300 text-xs font-semibold transition cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            إضافة أول مرحلة
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {[...steps].sort((a, b) => a.step_order - b.step_order).map((step, idx) => {
                          const action = ACTION_STYLES[step.action_type] || ACTION_STYLES.approve;
                          return (
                            <div key={step.id} className="relative flex items-start gap-3">
                              {/* Connector */}
                              {idx < steps.length - 1 && (
                                <span className="absolute right-[15px] top-9 w-px h-[calc(100%-8px)] bg-slate-700/50" />
                              )}
                              <div className="w-8 h-8 rounded-full bg-slate-800 border border-violet-500/30 text-violet-300 flex items-center justify-center text-xs font-bold font-mono shrink-0 z-10">
                                {step.step_order}
                              </div>
                              <div className="flex-1 min-w-0 bg-slate-900/60 rounded-xl border border-slate-800 p-3">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="flex flex-wrap items-center gap-2 min-w-0">
                                    <span className="text-sm font-semibold text-slate-100">{step.name_ar || step.name}</span>
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${action.cls}`}>
                                      {action.label}
                                    </span>
                                    {!step.is_required && (
                                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-700/50 text-slate-400 border border-slate-600/50">
                                        اختياري
                                      </span>
                                    )}
                                  </div>
                                  {canManage && (
                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={() => handleOpenEditStep(wf, step)}
                                        className="p-1 rounded bg-slate-800 hover:bg-violet-600/30 text-slate-400 hover:text-violet-300 transition cursor-pointer"
                                        title="تعديل المرحلة"
                                      >
                                        <Edit3 className="w-3 h-3" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteStep(wf, step)}
                                        className="p-1 rounded bg-slate-800 hover:bg-rose-600/30 text-slate-400 hover:text-rose-300 transition cursor-pointer"
                                        title="حذف المرحلة"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-[11px] text-slate-400">
                                  {step.role && (
                                    <span className="flex items-center gap-1">
                                      <ShieldAlert className="w-3.5 h-3.5 text-violet-400" />
                                      {step.role.display_name_ar || step.role.display_name || step.role.name}
                                    </span>
                                  )}
                                  {step.instructions && (
                                    <span className="flex items-center gap-1 text-slate-500">
                                      <Info className="w-3.5 h-3.5" />
                                      {step.instructions}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {canManage && (
                          <button
                            onClick={() => handleOpenAddStep(wf)}
                            className="mr-11 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-violet-600/20 border border-slate-700 hover:border-violet-500/30 text-slate-300 hover:text-violet-300 text-xs font-medium transition cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            إضافة مرحلة
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── TEMPLATE MODAL ─────────────────────────────────────── */}
      {templateModalOpen && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md"
          style={{ direction: 'rtl', top: 0, left: 0, right: 0, bottom: 0, margin: 0 }}
          onClick={() => setTemplateModalOpen(false)}
        >
          <div
            className="bg-[#0c1427] border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[88vh] overflow-hidden my-auto text-right"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 shrink-0 bg-[#0c1427]">
              <h3 className="text-base font-bold text-white">
                {editingTemplate ? 'تعديل قالب سير العمل' : 'إنشاء قالب سير عمل جديد'}
              </h3>
              <button
                type="button"
                onClick={() => setTemplateModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTemplate} className="flex flex-col flex-1 overflow-hidden m-0">
              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">نوع الوثيقة *</label>
                  <select
                    required
                    value={templateForm.document_type_id}
                    onChange={(e) => setTemplateForm({ ...templateForm, document_type_id: e.target.value })}
                    className="w-full bg-[#070d1a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-violet-500"
                  >
                    <option value="">اختر نوع الوثيقة...</option>
                    {documentTypes.map((dt) => (
                      <option key={dt.id} value={dt.id}>
                        {dt.name_ar || dt.name} {dt.code ? `(${dt.code})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">الاسم بالعربية *</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: مسار اعتماد طلبات الصلاحيات"
                      value={templateForm.name_ar}
                      onChange={(e) => setTemplateForm({ ...templateForm, name_ar: e.target.value })}
                      className="w-full bg-[#070d1a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">الاسم بالإنجليزية *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Access Request Approval"
                      value={templateForm.name}
                      onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                      className="w-full bg-[#070d1a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">الوصف</label>
                  <textarea
                    rows={3}
                    placeholder="شرح موجز لغرض القالب ومتى يُستخدم..."
                    value={templateForm.description}
                    onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                    className="w-full bg-[#070d1a] border border-slate-800 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 resize-none"
                  />
                </div>

                <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={templateForm.is_active}
                    onChange={(e) => setTemplateForm({ ...templateForm, is_active: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-700 bg-[#070d1a] accent-violet-600 cursor-pointer"
                  />
                  تفعيل القالب واستخدامه في طلبات الاعتماد
                </label>

                {editingTemplate && (
                  <p className="text-[11px] text-slate-500 leading-relaxed bg-slate-900/60 border border-slate-800 rounded-xl p-3">
                    تُدار المراحل من قائمة القالب مباشرةً بعد الحفظ (إضافة / تعديل / حذف المراحل وترتيبها).
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-[#0c1427] shrink-0">
                <button
                  type="button"
                  onClick={() => setTemplateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={savingTemplate}
                  className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition shadow-lg shadow-violet-600/20 disabled:opacity-50 cursor-pointer flex items-center gap-2"
                >
                  {savingTemplate && <Loader2 className="w-4 h-4 animate-spin" />}
                  {savingTemplate ? 'جاري الحفظ...' : editingTemplate ? 'حفظ التعديلات' : 'إنشاء القالب'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ── STEP MODAL ─────────────────────────────────────────── */}
      {stepModalOpen && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md"
          style={{ direction: 'rtl', top: 0, left: 0, right: 0, bottom: 0, margin: 0 }}
          onClick={() => setStepModalOpen(false)}
        >
          <div
            className="bg-[#0c1427] border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl flex flex-col max-h-[88vh] overflow-hidden my-auto text-right"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 shrink-0 bg-[#0c1427]">
              <div className="min-w-0">
                <h3 className="text-base font-bold text-white">
                  {editingStep ? 'تعديل المرحلة' : 'إضافة مرحلة جديدة'}
                </h3>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">{stepParent?.name_ar || stepParent?.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setStepModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStep} className="flex flex-col flex-1 overflow-hidden m-0">
              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">اسم المرحلة بالعربية *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: مراجعة مدير قسم تقنية المعلومات"
                    value={stepForm.name_ar}
                    onChange={(e) => setStepForm({ ...stepForm, name_ar: e.target.value })}
                    className="w-full bg-[#070d1a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">اسم المرحلة بالإنجليزية *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. IT Manager Review"
                    value={stepForm.name}
                    onChange={(e) => setStepForm({ ...stepForm, name: e.target.value })}
                    className="w-full bg-[#070d1a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">الدور المسؤول</label>
                    <select
                      value={stepForm.role_id}
                      onChange={(e) => setStepForm({ ...stepForm, role_id: e.target.value })}
                      className="w-full bg-[#070d1a] border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-violet-500"
                    >
                      <option value="">بدون دور محدد</option>
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.display_name_ar || r.display_name || r.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">نوع الإجراء</label>
                    <select
                      value={stepForm.action_type}
                      onChange={(e) => setStepForm({ ...stepForm, action_type: e.target.value })}
                      className="w-full bg-[#070d1a] border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-violet-500"
                    >
                      {ACTION_TYPES.map((a) => (
                        <option key={a.value} value={a.value}>{a.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">تعليمات المرحلة</label>
                  <textarea
                    rows={3}
                    placeholder="تعليمات إرشادية للمسؤول عن هذه المرحلة..."
                    value={stepForm.instructions}
                    onChange={(e) => setStepForm({ ...stepForm, instructions: e.target.value })}
                    className="w-full bg-[#070d1a] border border-slate-800 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 resize-none"
                  />
                </div>

                <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={stepForm.is_required}
                    onChange={(e) => setStepForm({ ...stepForm, is_required: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-700 bg-[#070d1a] accent-violet-600 cursor-pointer"
                  />
                  مرحلة إلزامية لإتمام الاعتماد
                </label>
              </div>

              <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-[#0c1427] shrink-0">
                <button
                  type="button"
                  onClick={() => setStepModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={savingStep}
                  className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition shadow-lg shadow-violet-600/20 disabled:opacity-50 cursor-pointer flex items-center gap-2"
                >
                  {savingStep && <Loader2 className="w-4 h-4 animate-spin" />}
                  {savingStep ? 'جاري الحفظ...' : editingStep ? 'حفظ التعديلات' : 'إضافة المرحلة'}
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
