import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ConfidentialityBadge } from '../common/Badge';
import { archiveApi } from '../../services/api';
import {
  X,
  FileText,
  Paperclip,
  GitBranch,
  History,
  Download,
  Eye,
  Upload,
  User,
  Building,
  Calendar,
  Tag,
  Lock,
  Archive,
  MapPin,
  ShieldCheck,
  FileCode,
  Layers,
  ZoomIn,
  ZoomOut,
  QrCode,
  Printer,
  Barcode
} from 'lucide-react';

export const DocumentDetailModal = () => {
  const {
    selectedDocument,
    setSelectedDocument,
    categories,
    departments,
    t,
    setPreviewAttachment,
    addAttachmentToDocument,
    currentRole,
    isBackendConnected
  } = useApp();

  const [activeTab, setActiveTab] = useState('preview'); // 'preview' | 'metadata' | 'versions' | 'access_log' | 'physical_label'
  const [zoom, setZoom] = useState(100);

  if (!selectedDocument) return null;

  const docCategory = categories.find(c => c.id === selectedDocument.category_id);
  const primaryAttachment = selectedDocument.attachments?.[0];

  const handleSimulatedFileUpload = () => {
    const fakeFileName = `Doc_Scan_${Date.now().toString().substring(8)}.pdf`;
    addAttachmentToDocument(selectedDocument.id, {
      name: fakeFileName,
      size: '2.5 MB',
      type: 'application/pdf'
    });
  };

  const handlePrintLabel = () => {
    window.print();
  };

  const tabs = [
    { id: 'preview', label: `معاينة الملف والمرفقات (${selectedDocument.attachments?.length || 0})`, icon: Eye },
    { id: 'metadata', label: 'البطاقة والبيانات الأرشيفية', icon: FileText },
    { id: 'physical_label', label: 'ملصق الحفظ الفعلي والباركود', icon: QrCode },
    { id: 'versions', label: `النسخ والتحديثات (${selectedDocument.versions?.length || 1})`, icon: GitBranch },
    { id: 'access_log', label: 'سجل حركات الوصول والمعاينة', icon: History },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 font-mono font-bold text-sm">
              {selectedDocument.document_number}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <ConfidentialityBadge level={selectedDocument.confidentiality} />
                <span className="text-xs px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                  {docCategory?.name_ar || 'تصنيف'}
                </span>
                {selectedDocument.physical_location && (
                  <span className="text-xs px-2.5 py-0.5 rounded-md bg-slate-800/80 text-slate-400 border border-slate-700/80 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-amber-400" />
                    <span>{selectedDocument.physical_location}</span>
                  </span>
                )}
              </div>
              <h2 className="text-base font-bold text-slate-100 max-w-2xl leading-tight">
                {selectedDocument.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedDocument(null)}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-6 border-b border-slate-800 bg-slate-950/60 overflow-x-auto gap-2">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
                  isActive
                    ? 'border-blue-500 text-blue-400 font-bold'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: FILE PREVIEW & ATTACHMENTS */}
          {activeTab === 'preview' && (
            <div className="space-y-6">
              {/* Files List Strip */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                <div>
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    الملفات المرفقة في الأرشيف
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    انقر لمعاينة أي ملف مباشرة داخل النظام أو تنزيله بأمان
                  </p>
                </div>
                {currentRole !== 'viewer' && (
                  <button
                    onClick={handleSimulatedFileUpload}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow transition"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>إرفاق ملف إضافي</span>
                  </button>
                )}
              </div>

              {/* Attachments Chips */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedDocument.attachments?.map(att => (
                  <div
                    key={att.id}
                    className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-blue-500/40 transition flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-200 block truncate max-w-xs">
                          {att.original_name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {att.file_size} • {att.created_at}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => setPreviewAttachment(att)}
                        className="px-2.5 py-1 rounded bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 text-xs font-semibold transition"
                      >
                        معاينة مكبرة
                      </button>
                      <button
                        onClick={() => {
                          if (isBackendConnected && att.id && Number(selectedDocument.id) < 1000000000) {
                            window.open(archiveApi.getAttachmentDownloadUrl(selectedDocument.id, att.id), '_blank');
                          } else {
                            setPreviewAttachment(att);
                          }
                        }}
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                        title="تحميل آمن للملف"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Embedded Document Viewer */}
              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 relative">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                    <ShieldCheck className="w-4 h-4" />
                    <span>معاينة فورية للمستند المؤرشف: {primaryAttachment?.original_name || 'وثيقة أرشيفية'}</span>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1 text-slate-400 text-xs">
                    <button onClick={() => setZoom(prev => Math.max(prev - 20, 60))} className="p-1 hover:text-white">
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-2 font-mono">{zoom}%</span>
                    <button onClick={() => setZoom(prev => Math.min(prev + 20, 160))} className="p-1 hover:text-white">
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Simulated Scanned / Digital Document */}
                <div
                  style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
                  className="w-full max-w-2xl mx-auto bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl p-8 transition-transform duration-200 text-slate-200 space-y-6"
                >
                  <div className="border-b border-slate-800 pb-4 flex justify-between items-start">
                    <div>
                      <h4 className="text-xs font-bold text-blue-400">المملكة العربية السعودية</h4>
                      <h5 className="text-xs font-semibold text-slate-300">أرشيف تقنية المعلومات والأنظمة</h5>
                      <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                        وثيقة رسمية مؤرشفة برقم: {selectedDocument.document_number}
                      </span>
                    </div>
                    <div className="text-end font-mono text-[11px] text-slate-400">
                      <div>التاريخ: {selectedDocument.document_date}</div>
                      <div className="text-emerald-400 font-bold">حالة الحفظ: مؤرشف ✓</div>
                    </div>
                  </div>

                  <div className="space-y-3 text-xs leading-relaxed">
                    <h3 className="text-sm font-bold text-slate-100 border-s-4 border-blue-500 ps-3">
                      {selectedDocument.title}
                    </h3>
                    <p className="text-slate-300">
                      {selectedDocument.description}
                    </p>

                    {selectedDocument.field_values && Object.keys(selectedDocument.field_values).length > 0 && (
                      <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2 mt-4">
                        <span className="text-[11px] font-bold text-slate-400 block">البيانات التفصيلية المسجلة:</span>
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          {Object.entries(selectedDocument.field_values).map(([k, v]) => (
                            <div key={k} className="p-2 rounded bg-slate-900 border border-slate-800">
                              <span className="text-slate-400 block text-[10px]">{k}:</span>
                              <span className="font-semibold text-slate-200">{String(v)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-400">
                    <span>جهة الإصدار: {selectedDocument.organization}</span>
                    <span className="font-mono">بصمة التخزين: SHA-256 Validated</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: METADATA & ARCHIVE CARD */}
          {activeTab === 'metadata' && (
            <div className="space-y-6">
              {/* Metadata Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                  <span className="text-[11px] text-slate-400 block mb-1 flex items-center gap-1">
                    <Archive className="w-3.5 h-3.5 text-blue-400" />
                    <span>{t('archiveNumber')}</span>
                  </span>
                  <span className="text-xs font-mono font-bold text-blue-400">{selectedDocument.document_number}</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                  <span className="text-[11px] text-slate-400 block mb-1 flex items-center gap-1">
                    <Building className="w-3.5 h-3.5 text-blue-400" />
                    <span>{t('department')}</span>
                  </span>
                  <span className="text-xs font-bold text-slate-200">{selectedDocument.organization}</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                  <span className="text-[11px] text-slate-400 block mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-blue-400" />
                    <span>{t('documentDate')}</span>
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-200">{selectedDocument.document_date}</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                  <span className="text-[11px] text-slate-400 block mb-1 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-blue-400" />
                    <span>{t('archivedBy')}</span>
                  </span>
                  <span className="text-xs font-bold text-slate-200">{selectedDocument.created_by}</span>
                </div>
              </div>

              {/* Physical Location */}
              {selectedDocument.physical_location && (
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">الموقع الفعلي للملف الورقي الأصلي:</span>
                    <span className="text-xs text-amber-400 font-semibold">{selectedDocument.physical_location}</span>
                  </div>
                </div>
              )}

              {/* Description & Summary */}
              <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {t('description')}
                </h4>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {selectedDocument.description || 'لا يوجد وصف ملخص مسجل.'}
                </p>

                {selectedDocument.notes && (
                  <div className="pt-3 border-t border-slate-800">
                    <h5 className="text-xs font-bold text-amber-400 mb-1 flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5" />
                      <span>{t('internalNotes')}</span>
                    </h5>
                    <p className="text-xs text-slate-300 bg-amber-500/5 p-3 rounded-xl border border-amber-500/20">
                      {selectedDocument.notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Keywords & Tags */}
              {selectedDocument.tags && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-blue-400" />
                    <span>الكلمات المفتاحية للأرشفة:</span>
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedDocument.tags.map((tag, idx) => {
                      const tagName = typeof tag === 'object' && tag !== null ? (tag.name || tag.slug) : String(tag);
                      return (
                        <span key={idx} className="px-2.5 py-0.5 rounded-lg bg-slate-800 text-slate-300 font-mono text-[11px]">
                          #{tagName}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: PHYSICAL ARCHIVE LABEL & BARCODE */}
          {activeTab === 'physical_label' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <Barcode className="w-4 h-4 text-blue-400" />
                    <span>ملصق وبطاقة الحفظ الفيزيائي (Physical Shelf Label)</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    بطاقة ملصقة تطبع وتوضع على غلاف الملف الورقي، أو كعب المصنف، أو رف الأرشيف لتسهيل الاسترجاع الفوري
                  </p>
                </div>
                <button
                  onClick={handlePrintLabel}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-500/25 transition"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة الملصق الآن</span>
                </button>
              </div>

              {/* Printable Archival Sticker Card */}
              <div className="max-w-xl mx-auto p-6 rounded-2xl bg-white text-slate-900 border-2 border-slate-300 shadow-2xl space-y-4 print:border-black print:shadow-none print:m-0 print:p-4">
                {/* Sticker Header */}
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
                  <div>
                    <h4 className="text-sm font-black text-slate-900 tracking-tight">
                      إدارة تقنية المعلومات والأنظمة
                    </h4>
                    <p className="text-[11px] font-bold text-slate-600">
                      قسم الأرشيف المركزي والوثائق الرقمية
                    </p>
                  </div>
                  <div className="text-end">
                    <span className="inline-block px-2.5 py-1 rounded bg-slate-900 text-white text-[10px] font-mono font-bold tracking-wider">
                      IT-EDMS VAULT
                    </span>
                  </div>
                </div>

                {/* Primary Archive Code & Barcode */}
                <div className="p-3 bg-slate-50 border border-slate-300 rounded-xl text-center space-y-2">
                  <div className="text-lg font-black font-mono tracking-widest text-slate-900">
                    {selectedDocument.document_number}
                  </div>

                  {/* SVG Barcode Representation */}
                  <div className="flex items-center justify-center gap-[3px] h-12 py-1 px-4 bg-white rounded border border-slate-200">
                    {[1,3,1,2,4,1,3,2,1,4,2,1,3,1,2,4,1,2,3,1,4,2,1,3,2,4,1,3,1,2].map((w, idx) => (
                      <div
                        key={idx}
                        className="h-full bg-slate-900"
                        style={{ width: `${w * 1.5}px` }}
                      />
                    ))}
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 tracking-wider">
                    *{selectedDocument.document_number}*
                  </div>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 block">عنوان الوثيقة:</span>
                    <span className="font-bold text-slate-900 line-clamp-2 leading-tight">
                      {selectedDocument.title}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-500 block">التصنيف الأرشيفي:</span>
                    <span className="font-bold text-slate-800">
                      {docCategory?.name_ar || 'تصنيف عام'} ({docCategory?.code || 'ARC'})
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-500 block">الرقم الصادر / الأساس:</span>
                    <span className="font-mono font-bold text-slate-800">
                      {selectedDocument.original_number || 'غير محدد'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-500 block">تاريخ الوثيقة:</span>
                    <span className="font-mono font-bold text-slate-800">
                      {selectedDocument.document_date || selectedDocument.archived_at}
                    </span>
                  </div>
                </div>

                {/* Physical Location Highlight Box */}
                <div className="p-3 rounded-xl bg-amber-50 border-2 border-amber-400 text-amber-950 flex items-start gap-2.5">
                  <MapPin className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 block">
                      الموقع الفيزيائي للملف الورقي (Shelf Location)
                    </span>
                    <span className="text-xs font-black">
                      {selectedDocument.physical_location || 'مستودع الأرشيف - دولاب رقم IT-01 - رف 3'}
                    </span>
                  </div>
                </div>

                {/* Footer security clearance */}
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500 font-medium">
                  <div className="flex items-center gap-1 font-bold text-slate-700">
                    <Lock className="w-3 h-3 text-slate-600" />
                    <span>درجة السرية: {selectedDocument.confidentiality}</span>
                  </div>
                  <div>
                    <span>تاريخ الإصدار: {new Date().toISOString().substring(0, 10)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: VERSIONS */}
          {activeTab === 'versions' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-100">سجل النسخ والإصدارات المؤرشفة</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  حفظ النسخ والتحديثات المتعاقبة على الوثيقة مع الحفاظ على النسخة الأصلية
                </p>
              </div>

              <div className="space-y-3">
                {selectedDocument.versions?.map((ver, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                          {ver.version_number}
                        </span>
                        <span className="text-xs font-bold text-slate-200">{ver.file_name}</span>
                      </div>
                      <p className="text-xs text-slate-400">{ver.change_summary}</p>
                    </div>
                    <span className="text-xs font-mono text-slate-400">{ver.created_at}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: ACCESS & AUDIT LOG */}
          {activeTab === 'access_log' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-100">سجل حركات الوصول للمستند الأرشيفي</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  تسجيل رقابي لكافة عمليات المعاينة والتنزيل والتعديل بالوقت وعنوان IP
                </p>
              </div>

              <div className="space-y-2">
                {selectedDocument.audit_logs?.map(log => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-200 me-2">{log.user}</span>
                      <span className="text-slate-400">{log.details}</span>
                    </div>
                    <div className="text-end font-mono text-[11px] text-slate-500">
                      <div>{log.date}</div>
                      <div className="text-[10px]">IP: {log.ip}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900 flex items-center justify-between text-xs text-slate-400">
          <span>رقم الأرشيف: {selectedDocument.document_number}</span>
          <button
            onClick={() => setSelectedDocument(null)}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition"
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
};
