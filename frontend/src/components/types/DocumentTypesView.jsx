import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Sliders,
  Plus,
  Layers,
  FileText,
  CheckCircle2,
  Trash2,
  Edit2,
  HelpCircle,
  Eye,
  Type,
  List,
  Calendar,
  Hash,
  Mail,
  Phone,
  Clock
} from 'lucide-react';

export const DocumentTypesView = () => {
  const { documentTypes, categories, addCustomFieldToType, t, currentRole } = useApp();

  const [selectedType, setSelectedType] = useState(documentTypes[0]);
  const [showAddFieldModal, setShowAddFieldModal] = useState(false);

  // New Field State
  const [labelAr, setLabelAr] = useState('');
  const [labelEn, setLabelEn] = useState('');
  const [fieldType, setFieldType] = useState('text');
  const [isRequired, setIsRequired] = useState(false);
  const [optionsStr, setOptionsStr] = useState('');

  const handleAddField = (e) => {
    e.preventDefault();
    if (!labelAr.trim()) return;

    const newField = {
      id: `field_${Date.now()}`,
      label_ar: labelAr,
      label_en: labelEn || labelAr,
      type: fieldType,
      required: isRequired,
      options: optionsStr ? optionsStr.split(',').map(s => s.trim()) : []
    };

    addCustomFieldToType(selectedType.id, newField);

    // Update locally
    setSelectedType(prev => ({
      ...prev,
      fields: [...prev.fields, newField]
    }));

    setLabelAr('');
    setLabelEn('');
    setFieldType('text');
    setIsRequired(false);
    setOptionsStr('');
    setShowAddFieldModal(false);
  };

  const fieldTypesList = [
    { value: 'text', label: 'نص قصير (Text)', icon: Type },
    { value: 'textarea', label: 'نص متعدد الأسطر (Textarea)', icon: FileText },
    { value: 'number', label: 'رقمي (Number)', icon: Hash },
    { value: 'date', label: 'تاريخ (Date)', icon: Calendar },
    { value: 'time', label: 'وقت (Time)', icon: Clock },
    { value: 'select', label: 'قائمة اختيار مفردة (Select Dropdown)', icon: List },
    { value: 'email', label: 'بريد إلكتروني (Email)', icon: Mail },
    { value: 'phone', label: 'رقم هاتف (Phone)', icon: Phone },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-100 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-blue-500" />
            <span>{t('navDocumentTypes')}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            إدارة نماذج الوثائق وتخصيص الحقول الديناميكية (Dynamic Fields Builder) لكل نوع وثيقة
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Document Types List */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            أنواع الوثائق المعرفة في النظام
          </h3>

          <div className="space-y-2">
            {documentTypes.map(dt => {
              const isSelected = selectedType?.id === dt.id;
              const catObj = categories.find(c => c.id === dt.categoryId);

              return (
                <div
                  key={dt.id}
                  onClick={() => setSelectedType(dt)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition ${
                    isSelected
                      ? 'bg-blue-600/10 border-blue-500 text-blue-300 font-bold shadow'
                      : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-mono text-[11px] text-blue-400">Prefix: {dt.codePrefix}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                      {catObj?.name_ar}
                    </span>
                  </div>
                  <h4 className="text-xs leading-snug">{dt.name_ar}</h4>
                  <span className="text-[10px] text-slate-500 block mt-1">
                    {dt.fields.length} حقول مخصصة
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dynamic Fields Inspector & Builder (2 Cols) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between space-y-6">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                  {selectedType?.codePrefix}-YYYY-XXXXX
                </span>
                <h3 className="text-base font-bold text-slate-100 mt-1">{selectedType?.name_ar}</h3>
                <p className="text-xs text-slate-400">{selectedType?.name_en}</p>
              </div>

              {currentRole !== 'viewer' && (
                <button
                  onClick={() => setShowAddFieldModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t('addField')}</span>
                </button>
              )}
            </div>

            {/* Fields List */}
            <div className="mt-5 space-y-3">
              <h4 className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400" />
                <span>الحقول المخصصة لهذا النموذج (Schema):</span>
              </h4>

              <div className="space-y-2">
                {selectedType?.fields.map((field, idx) => (
                  <div
                    key={field.id}
                    className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-slate-500 text-xs w-5">{idx + 1}.</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-200">{field.label_ar}</span>
                          {field.required && (
                            <span className="text-[10px] text-rose-400 font-bold bg-rose-500/10 px-1.5 py-0.2 rounded border border-rose-500/20">
                              مطلوب
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          ID: {field.id} • Type: {field.type}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] px-2.5 py-1 rounded bg-slate-800 text-slate-300 font-mono">
                        {field.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dynamic Form Live Preview */}
            <div className="mt-6 p-4 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300 mb-3">
                <Eye className="w-4 h-4 text-emerald-400" />
                <span>{t('previewForm')} (Live Visual Preview)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {selectedType?.fields.map(f => (
                  <div key={f.id} className={f.type === 'textarea' ? 'sm:col-span-2' : ''}>
                    <label className="text-[11px] text-slate-400 block mb-1">
                      {f.label_ar} {f.required && <span className="text-rose-400">*</span>}
                    </label>
                    <input
                      disabled
                      placeholder={`نموذج إدخال: ${f.label_ar}`}
                      className="w-full p-2 rounded-lg bg-slate-900 border border-slate-700/60 text-xs text-slate-500 cursor-not-allowed"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Custom Field Modal */}
      {showAddFieldModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <form onSubmit={handleAddField} className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-blue-400" />
              <span>إضافة حقل مخصص لـ ({selectedType?.name_ar})</span>
            </h3>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                {t('fieldLabelAr')} *
              </label>
              <input
                type="text"
                required
                value={labelAr}
                onChange={e => setLabelAr(e.target.value)}
                placeholder="مثال: رقم السيريال للجهاز"
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                {t('fieldLabelEn')}
              </label>
              <input
                type="text"
                value={labelEn}
                onChange={e => setLabelEn(e.target.value)}
                placeholder="e.g. Device Serial Number"
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                {t('fieldType')} *
              </label>
              <select
                value={fieldType}
                onChange={e => setFieldType(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {fieldTypesList.map(ft => (
                  <option key={ft.value} value={ft.value}>
                    {ft.label}
                  </option>
                ))}
              </select>
            </div>

            {fieldType === 'select' && (
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  {t('optionsList')}
                </label>
                <input
                  type="text"
                  value={optionsStr}
                  onChange={e => setOptionsStr(e.target.value)}
                  placeholder="خيار 1, خيار 2, خيار 3"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <div className="pt-1">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isRequired}
                  onChange={e => setIsRequired(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-blue-500"
                />
                <span>{t('isRequired')}</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddFieldModal(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow"
              >
                إضافة الحقل
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
