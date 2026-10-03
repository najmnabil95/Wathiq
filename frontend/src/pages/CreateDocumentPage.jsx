import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { documentsAPI, categoriesAPI, documentTypesAPI, settingsAPI, organizationsAPI, departmentsAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { ArrowRight, Save, Plus, X, Upload, FileText, AlertCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

// ── Dynamic Field Renderer ─────────────────────────────────────
function DynamicField({ field, value, onChange }) {
  const handleChange = (val) => onChange(field.id, val);

  if (['text', 'email', 'phone'].includes(field.field_type)) {
    return (
      <input
        type={field.field_type === 'email' ? 'email' : 'text'}
        className="form-input"
        placeholder={field.placeholder_ar || field.placeholder || ''}
        value={value || ''}
        onChange={e => handleChange(e.target.value)}
      />
    );
  }
  if (field.field_type === 'textarea') {
    return (
      <textarea
        className="form-input"
        rows={3}
        placeholder={field.placeholder_ar || ''}
        value={value || ''}
        onChange={e => handleChange(e.target.value)}
      />
    );
  }
  if (field.field_type === 'number') {
    return (
      <input type="number" className="form-input"
             value={value || ''} onChange={e => handleChange(e.target.value)} />
    );
  }
  if (['date', 'datetime', 'time'].includes(field.field_type)) {
    return (
      <input type={field.field_type} className="form-input"
             value={value || ''} onChange={e => handleChange(e.target.value)} />
    );
  }
  if (field.field_type === 'select') {
    return (
      <select className="form-input form-select" value={value || ''} onChange={e => handleChange(e.target.value)}>
        <option value="">اختر...</option>
        {(field.options || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    );
  }
  if (field.field_type === 'checkbox' || field.field_type === 'multiselect') {
    const selected = Array.isArray(value) ? value : (value ? JSON.parse(value) : []);
    return (
      <div className="flex flex-wrap gap-3">
        {(field.options || []).map(opt => (
          <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm" style={{ color: '#8b9cc8' }}>
            <input
              type="checkbox"
              checked={selected.includes(opt)}
              onChange={e => {
                const next = e.target.checked
                  ? [...selected, opt]
                  : selected.filter(s => s !== opt);
                handleChange(next);
              }}
              className="w-4 h-4 accent-blue-500"
            />
            {opt}
          </label>
        ))}
      </div>
    );
  }
  if (field.field_type === 'radio') {
    return (
      <div className="flex flex-wrap gap-4">
        {(field.options || []).map(opt => (
          <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm" style={{ color: '#8b9cc8' }}>
            <input type="radio" name={`field_${field.id}`} value={opt}
                   checked={value === opt} onChange={() => handleChange(opt)}
                   className="accent-blue-500" />
            {opt}
          </label>
        ))}
      </div>
    );
  }
  return <input type="text" className="form-input" value={value || ''} onChange={e => handleChange(e.target.value)} />;
}

export default function CreateDocumentPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [categories, setCategories]       = useState([]);
  const [docTypes, setDocTypes]           = useState([]);
  const [departments, setDepartments]     = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [users, setUsers]                 = useState([]);
  const [confLevels, setConfLevels]       = useState([]);
  const [dynamicFields, setDynamicFields] = useState([]);

  const [form, setForm] = useState({
    title:                    '',
    document_type_id:         '',
    category_id:              '',
    department_id:            user?.department?.id || '',
    organization_id:          '',
    assigned_to:              '',
    confidentiality_level_id: '',
    document_date:            new Date().toISOString().split('T')[0],
    received_at:              '',
    original_number:          '',
    description:              '',
    notes:                    '',
    physical_location:        '',
    tags:                     '',
  });
  const [fieldValues, setFieldValues] = useState({});
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Load reference data
  useEffect(() => {
    Promise.all([
      categoriesAPI.list({ active_only: true }),
      departmentsAPI.list(),
      organizationsAPI.list(),
      settingsAPI.confidentialityLevels(),
    ]).then(([cats, depts, orgs, levels]) => {
      setCategories(cats.data.data);
      setDepartments(depts.data.data);
      setOrganizations(orgs.data.data);
      setConfLevels(levels.data.data);
      // Default confidentiality to "internal"
      const internal = levels.data.data.find(l => l.name === 'internal');
      if (internal) setForm(f => ({ ...f, confidentiality_level_id: internal.id }));
    }).catch(() => {});
  }, []);

  // Load doc types when category changes
  useEffect(() => {
    if (!form.category_id) { setDocTypes([]); setDynamicFields([]); return; }
    documentTypesAPI.list({ category_id: form.category_id, active_only: true }).then(res => {
      setDocTypes(res.data.data);
    });
    setForm(f => ({ ...f, document_type_id: '' }));
    setDynamicFields([]);
  }, [form.category_id]);

  // Load dynamic fields when type changes
  useEffect(() => {
    if (!form.document_type_id) { setDynamicFields([]); return; }
    documentTypesAPI.fields(form.document_type_id).then(res => {
      setDynamicFields(res.data.data);
      setFieldValues({});
    });
  }, [form.document_type_id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (errors[name]) setErrors(e => ({ ...e, [name]: null }));
  };

  const handleFieldValue = (fieldId, value) => {
    setFieldValues(v => ({ ...v, [fieldId]: value }));
  };

  const handleFiles = (e) => {
    const newFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const validate = () => {
    const errs = {};
    if (!form.title.trim())                    errs.title = 'العنوان مطلوب';
    if (!form.category_id)                     errs.category_id = 'التصنيف مطلوب';
    if (!form.document_type_id)                errs.document_type_id = 'نوع الوثيقة مطلوب';
    if (!form.department_id)                   errs.department_id = 'القسم مطلوب';
    if (!form.confidentiality_level_id)        errs.confidentiality_level_id = 'مستوى السرية مطلوب';
    if (!form.document_date)                   errs.document_date = 'تاريخ الوثيقة مطلوب';

    // Required dynamic fields
    for (const field of dynamicFields) {
      if (field.is_required && !fieldValues[field.id]) {
        errs[`field_${field.id}`] = `${field.label_ar} مطلوب`;
      }
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      toast.error('يرجى تصحيح الأخطاء أولاً');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        fields: fieldValues,
      };
      const res = await documentsAPI.create(payload);
      const docId = res.data.data.id;

      // Upload files if any
      if (files.length > 0) {
        const formData = new FormData();
        files.forEach(f => formData.append('files[]', f));
        try {
          const { attachmentsAPI } = await import('../services/api');
          await attachmentsAPI.upload(docId, formData);
        } catch (e2) {
          toast.error('تم إنشاء الوثيقة لكن فشل رفع بعض الملفات');
        }
      }

      toast.success(res.data.message || 'تم إنشاء الوثيقة بنجاح');
      navigate(`/documents/${docId}`);
    } catch (err) {
      const errs = err.response?.data?.errors;
      if (errs) setErrors(errs);
      toast.error(err.response?.data?.message || 'فشل إنشاء الوثيقة');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in max-w-5xl mx-auto">

      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <button type="button" className="btn btn-secondary btn-icon" onClick={() => navigate(-1)}>
            <ArrowRight size={16} />
          </button>
          <div>
            <h1 className="page-title">وثيقة جديدة</h1>
            <p className="page-subtitle">إنشاء وثيقة جديدة في النظام</p>
          </div>
        </div>
        <button type="submit" disabled={saving} className="btn btn-primary">
          {saving ? <><Loader2 size={15} className="animate-spin-slow" /> جاري الحفظ...</> : <><Save size={15} /> حفظ الوثيقة</>}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left: Main Form ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Basic Info */}
          <div className="glass p-6 space-y-4">
            <h2 className="font-bold text-sm uppercase tracking-wide" style={{ color: '#526080' }}>المعلومات الأساسية</h2>

            {/* Title */}
            <div>
              <label className="form-label">عنوان الوثيقة <span className="required">*</span></label>
              <input id="doc-title" type="text" name="title" value={form.title}
                     onChange={handleChange} className={`form-input ${errors.title ? 'border-red-500/50' : ''}`}
                     placeholder="أدخل عنوان واضحاً للوثيقة..." />
              {errors.title && <p className="form-error"><AlertCircle size={12}/>{errors.title}</p>}
            </div>

            {/* Category + Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">التصنيف <span className="required">*</span></label>
                <select id="doc-category" name="category_id" value={form.category_id}
                        onChange={handleChange}
                        className={`form-input form-select ${errors.category_id ? 'border-red-500/50' : ''}`}>
                  <option value="">اختر التصنيف...</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name_ar}</option>)}
                </select>
                {errors.category_id && <p className="form-error"><AlertCircle size={12}/>{errors.category_id}</p>}
              </div>
              <div>
                <label className="form-label">نوع الوثيقة <span className="required">*</span></label>
                <select id="doc-type" name="document_type_id" value={form.document_type_id}
                        onChange={handleChange} disabled={!form.category_id}
                        className={`form-input form-select ${errors.document_type_id ? 'border-red-500/50' : ''}`}>
                  <option value="">اختر نوع الوثيقة...</option>
                  {docTypes.map(t => <option key={t.id} value={t.id}>{t.name_ar}</option>)}
                </select>
                {errors.document_type_id && <p className="form-error"><AlertCircle size={12}/>{errors.document_type_id}</p>}
              </div>
            </div>

            {/* Original Number */}
            <div>
              <label className="form-label">الرقم الأصلي للوثيقة (الورقية)</label>
              <input type="text" name="original_number" value={form.original_number}
                     onChange={handleChange} className="form-input"
                     placeholder="رقم الوثيقة الورقية إن وجد..." dir="ltr" />
            </div>

            {/* Description */}
            <div>
              <label className="form-label">الوصف</label>
              <textarea name="description" value={form.description} onChange={handleChange}
                        className="form-input" rows={3}
                        placeholder="وصف مختصر للوثيقة..." />
            </div>

            {/* Notes */}
            <div>
              <label className="form-label">ملاحظات</label>
              <textarea name="notes" value={form.notes} onChange={handleChange}
                        className="form-input" rows={2}
                        placeholder="ملاحظات إضافية..." />
            </div>
          </div>

          {/* ── Dynamic Fields ── */}
          {dynamicFields.length > 0 && (
            <div className="glass p-6 space-y-4">
              <h2 className="font-bold text-sm uppercase tracking-wide" style={{ color: '#526080' }}>
                حقول إضافية — {docTypes.find(t => t.id == form.document_type_id)?.name_ar}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {dynamicFields.map(field => (
                  <div key={field.id} className={field.field_type === 'textarea' ? 'sm:col-span-2' : ''}>
                    <label className="form-label">
                      {field.label_ar}
                      {field.is_required && <span className="required"> *</span>}
                    </label>
                    <DynamicField
                      field={field}
                      value={fieldValues[field.id]}
                      onChange={handleFieldValue}
                    />
                    {field.hint_ar && <p className="text-xs mt-1" style={{ color: '#526080' }}>{field.hint_ar}</p>}
                    {errors[`field_${field.id}`] && (
                      <p className="form-error"><AlertCircle size={12}/>{errors[`field_${field.id}`]}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Attachments ── */}
          <div className="glass p-6 space-y-4">
            <h2 className="font-bold text-sm uppercase tracking-wide" style={{ color: '#526080' }}>المرفقات</h2>
            <label
              htmlFor="file-upload"
              className="flex flex-col items-center justify-center gap-3 p-8 rounded-xl cursor-pointer transition-all"
              style={{ border: '2px dashed rgba(59,130,246,0.3)', background: 'rgba(59,130,246,0.03)' }}
              onDragOver={e => { e.preventDefault(); }}
              onDrop={e => { e.preventDefault(); setFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]); }}
            >
              <Upload size={28} style={{ color: '#3b82f6', opacity: 0.7 }} />
              <div className="text-center">
                <p className="text-sm font-semibold" style={{ color: '#8b9cc8' }}>اسحب الملفات هنا أو انقر للاختيار</p>
                <p className="text-xs mt-1" style={{ color: '#526080' }}>PDF, صور, Word, Excel — حد أقصى 20MB لكل ملف</p>
              </div>
              <input id="file-upload" type="file" multiple className="hidden"
                     accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.xls,.xlsx,.txt"
                     onChange={handleFiles} />
            </label>

            {files.length > 0 && (
              <div className="space-y-2">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 glass-sm p-3">
                    <FileText size={16} style={{ color: '#60a5fa' }} />
                    <span className="flex-1 text-sm truncate" style={{ color: '#cbd5e1' }}>{f.name}</span>
                    <span className="text-xs" style={{ color: '#526080' }}>
                      {(f.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                    <button type="button" onClick={() => removeFile(i)}
                            className="btn btn-secondary btn-icon btn-sm">
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Meta Sidebar ── */}
        <div className="space-y-5">

          {/* Dates */}
          <div className="glass p-5 space-y-4">
            <h3 className="font-bold text-sm uppercase tracking-wide" style={{ color: '#526080' }}>التواريخ</h3>
            <div>
              <label className="form-label">تاريخ الوثيقة <span className="required">*</span></label>
              <input type="date" name="document_date" value={form.document_date}
                     onChange={handleChange}
                     className={`form-input ${errors.document_date ? 'border-red-500/50' : ''}`} />
              {errors.document_date && <p className="form-error"><AlertCircle size={12}/>{errors.document_date}</p>}
            </div>
            <div>
              <label className="form-label">تاريخ الاستلام</label>
              <input type="datetime-local" name="received_at" value={form.received_at}
                     onChange={handleChange} className="form-input" />
            </div>
          </div>

          {/* Department + Org */}
          <div className="glass p-5 space-y-4">
            <h3 className="font-bold text-sm uppercase tracking-wide" style={{ color: '#526080' }}>التصنيف الإداري والفروع</h3>
            <div>
              <label className="form-label">القسم أو الفرع التابع <span className="required">*</span></label>
              <select
                name="department_id"
                value={form.department_id}
                onChange={handleChange}
                className={`form-input form-select ${errors.department_id ? 'border-red-500/50' : ''}`}
              >
                <option value="">اختر القسم أو الفرع التابع...</option>
                {departments.filter(d => !d.parent_id).map(root => {
                  const branches = departments.filter(d => d.parent_id === root.id);
                  return (
                    <optgroup key={root.id} label={`🏛️ ${root.name_ar} (${root.code})`}>
                      <option value={root.id}>
                        {root.name_ar} (المركز الرئيسي / الإدارة العامة)
                      </option>
                      {branches.map(b => (
                        <option key={b.id} value={b.id}>
                          &nbsp;&nbsp;&nbsp;&nbsp;↳ {b.name_ar} ({b.code})
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
              </select>

              {form.department_id && (() => {
                const selected = departments.find(d => d.id == form.department_id);
                if (selected?.parent_id) {
                  const parent = departments.find(d => d.id == selected.parent_id);
                  return (
                    <div className="mt-2 p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 flex items-center gap-1.5 animate-fade-in">
                      <span className="text-slate-400">المسار الإداري:</span>
                      <span className="font-semibold text-slate-200">{parent?.name_ar}</span>
                      <span>⬅️</span>
                      <span className="font-bold text-emerald-400">{selected.name_ar}</span>
                    </div>
                  );
                }
                return null;
              })()}

              {errors.department_id && <p className="form-error"><AlertCircle size={12}/>{errors.department_id}</p>}
            </div>
            <div>
              <label className="form-label">الجهة / المؤسسة</label>
              <select name="organization_id" value={form.organization_id} onChange={handleChange}
                      className="form-input form-select">
                <option value="">اختر المؤسسة / الجهة...</option>
                {organizations.map(o => <option key={o.id} value={o.id}>{o.name_ar || o.name}</option>)}
              </select>
            </div>
          </div>

          {/* Confidentiality */}
          <div className="glass p-5 space-y-3">
            <h3 className="font-bold text-sm uppercase tracking-wide" style={{ color: '#526080' }}>مستوى السرية</h3>
            <div className="space-y-2">
              {confLevels.map(level => {
                const colorMap = { green: '16,185,129', blue: '59,130,246', orange: '249,115,22', red: '239,68,68' };
                const rgb = colorMap[level.color] || '59,130,246';
                const selected = form.confidentiality_level_id == level.id;
                return (
                  <label key={level.id} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all"
                         style={{ background: selected ? `rgba(${rgb},0.12)` : 'rgba(255,255,255,0.03)',
                                  border: `1px solid ${selected ? `rgba(${rgb},0.35)` : 'rgba(255,255,255,0.06)'}` }}>
                    <input type="radio" name="confidentiality_level_id" value={level.id}
                           checked={selected} onChange={handleChange} className="sr-only" />
                    <div className="w-3 h-3 rounded-full flex-shrink-0"
                         style={{ background: `rgb(${rgb})`, boxShadow: selected ? `0 0 8px rgba(${rgb},0.6)` : 'none' }} />
                    <div>
                      <div className="text-sm font-semibold" style={{ color: selected ? `rgb(${rgb})` : '#8b9cc8' }}>
                        {level.label_ar}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
            {errors.confidentiality_level_id && (
              <p className="form-error"><AlertCircle size={12}/>{errors.confidentiality_level_id}</p>
            )}
          </div>

          {/* Tags + Location */}
          <div className="glass p-5 space-y-4">
            <h3 className="font-bold text-sm uppercase tracking-wide" style={{ color: '#526080' }}>معلومات إضافية</h3>
            <div>
              <label className="form-label">الوسوم (Tags)</label>
              <input type="text" name="tags" value={form.tags} onChange={handleChange}
                     className="form-input" placeholder="وسم1, وسم2, وسم3..." />
              <p className="text-xs mt-1" style={{ color: '#526080' }}>افصل الوسوم بفاصلة</p>
            </div>
            <div>
              <label className="form-label">الموقع الورقي</label>
              <input type="text" name="physical_location" value={form.physical_location}
                     onChange={handleChange} className="form-input"
                     placeholder="رف 3، مجلد 12..." />
            </div>
          </div>

          {/* Submit mobile */}
          <button type="submit" disabled={saving} className="btn btn-primary w-full btn-lg lg:hidden">
            {saving ? <><Loader2 size={16} className="animate-spin-slow" /> جاري الحفظ...</> : <><Save size={16} /> حفظ الوثيقة</>}
          </button>
        </div>
      </div>
    </form>
  );
}
