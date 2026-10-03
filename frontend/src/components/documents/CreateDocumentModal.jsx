import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Plus,
  FileText,
  Upload,
  Calendar,
  Building,
  User,
  Tag,
  Archive,
  MapPin,
  Lock,
  Paperclip,
  CheckCircle2
} from 'lucide-react';

export const CreateDocumentModal = () => {
  const {
    isCreateModalOpen,
    setIsCreateModalOpen,
    categories,
    departments,
    t,
    archiveNewDocument
  } = useApp();

  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('2');
  const [originalNumber, setOriginalNumber] = useState('');
  const [departmentId, setDepartmentId] = useState('1');
  const [organization, setOrganization] = useState('إدارة تقنية المعلومات والأنظمة');
  const [documentDate, setDocumentDate] = useState(new Date().toISOString().substring(0, 10));
  const [confidentiality, setConfidentiality] = useState('internal');
  const [physicalLocation, setPhysicalLocation] = useState('مستودع الأرشيف - دولاب IT-01 - رف 3');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState('أرشيف_إلكتروني, رسمي');
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isCreateModalOpen) return null;

  const selectedCategoryObj = categories.find(c => c.id === Number(categoryId));

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setSelectedFileName(file.name);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      setSelectedFileName(file.name);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await archiveNewDocument({
        title,
        category_id: categoryId,
        original_number: originalNumber,
        department_id: departmentId,
        organization,
        document_date: documentDate,
        confidentiality,
        physical_location: physicalLocation,
        description,
        notes,
        tags,
        file: selectedFile,
        uploadedFileName: selectedFileName || 'وثيقة_مؤرشفة.pdf',
        uploadedFileSize: selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB` : '1.5 MB'
      });
      setIsCreateModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">{t('navNewDocument')}</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                إدخال وثيقة جديدة للأرشيف المركزي وتوليد رقم حفظ أرشيفي تلقائي
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(false)}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Classification Banner */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                {t('category')} *
              </label>
              <select
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name_ar}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                رقم الأرشيف التلقائي المتوقع
              </label>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono font-bold text-blue-400 flex items-center justify-between">
                <span>{selectedCategoryObj?.code || 'ARC'}-2026-AUTO</span>
                <span className="text-[10px] text-emerald-400 font-semibold">توليد تسلسلي فريد ✓</span>
              </div>
            </div>
          </div>

          {/* Title & Original Number */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-200 block mb-1">
                {t('title')} *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="مثال: محضر فحص واستلام خوادم Dell PowerEdge لمركز البيانات"
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  رقم الوثيقة الأصلي / الصادر
                </label>
                <input
                  type="text"
                  value={originalNumber}
                  onChange={e => setOriginalNumber(e.target.value)}
                  placeholder="مثال: IT-REC-2026/042"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  {t('department')} / الجهة
                </label>
                <input
                  type="text"
                  value={organization}
                  onChange={e => setOrganization(e.target.value)}
                  placeholder="الإدارة المالية أو قسم الشبكات..."
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  {t('documentDate')} *
                </label>
                <input
                  type="date"
                  required
                  value={documentDate}
                  onChange={e => setDocumentDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
            </div>

            {/* Confidentiality & Physical Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  {t('confidentiality')} *
                </label>
                <select
                  value={confidentiality}
                  onChange={e => setConfidentiality(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="public">{t('confPublic')}</option>
                  <option value="internal">{t('confInternal')}</option>
                  <option value="confidential">{t('confConfidential')}</option>
                  <option value="highly_confidential">{t('confHighlyConfidential')}</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  <span>الموقع الفعلي للملف الورقي الأصلي</span>
                </label>
                <input
                  type="text"
                  value={physicalLocation}
                  onChange={e => setPhysicalLocation(e.target.value)}
                  placeholder="مثال: مستودع الأرشيف - دولاب IT-02 - رف 4"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                {t('description')}
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="ملخص محتوى الوثيقة والموضوع والأشخاص المعنيين..."
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-blue-400" />
                <span>الكلمات المفتاحية للبحث (مفصولة بفاصلة)</span>
              </label>
              <input
                type="text"
                value={tags}
                onChange={e => setTags(e.target.value)}
                placeholder="سيرفرات, صيانة, شبكات, 2026"
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* File Upload Zone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className={`p-6 rounded-2xl border-2 border-dashed transition-all text-center space-y-3 ${
              selectedFile
                ? 'bg-blue-950/20 border-blue-500/50'
                : 'bg-slate-950/70 border-slate-700/80 hover:border-blue-500/50'
            }`}
          >
            <div className="mx-auto w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              {selectedFile ? <FileText className="w-6 h-6 text-emerald-400" /> : <Upload className="w-6 h-6" />}
            </div>

            <div>
              <span className="text-xs font-bold text-slate-200 block">
                {selectedFile ? selectedFile.name : 'ملف الوثيقة الرقمي الممسوح ضوئياً (PDF / صور / مستندات)'}
              </span>
              <p className="text-[11px] text-slate-400 mt-1">
                {selectedFile
                  ? `الحجم: ${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB — جاهز للأرشفة وحساب البصمة الرقمية SHA-256`
                  : 'اسحب وأفلت الملف هنا أو تصفح من جهازك'}
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-1">
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition">
                <Paperclip className="w-3.5 h-3.5 text-blue-400" />
                <span>{selectedFile ? 'تغيير الملف' : 'اختيار ملف من الجهاز'}</span>
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx"
                  className="hidden"
                />
              </label>

              {selectedFile && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setSelectedFileName('');
                  }}
                  className="px-3 py-2 text-rose-400 hover:text-rose-300 text-xs font-medium transition"
                >
                  إلغاء التحديد
                </button>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition disabled:opacity-50"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-500/25 transition transform hover:-translate-y-0.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>جاري الأرشفة...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>{t('save')} وتوليد رقم الأرشيف</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
