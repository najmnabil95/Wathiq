import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Download, ShieldCheck, ZoomIn, ZoomOut, FileText, Image as ImageIcon, CheckCircle, ExternalLink } from 'lucide-react';

export const FilePreviewModal = () => {
  const { previewAttachment, setPreviewAttachment, t, addAuditLog, showToast, selectedDocument } = useApp();
  const [zoom, setZoom] = useState(100);

  if (!previewAttachment) return null;

  const handleDownload = () => {
    addAuditLog('download', `مرفق: ${previewAttachment.original_name}`, `تحميل آمن للملف من Private Storage عبر واجهة النظام`);
    showToast(`جاري تحميل الملف الآمن: ${previewAttachment.original_name}`, 'success');
  };

  const isImage = previewAttachment.preview_type === 'image' || previewAttachment.mime_type?.startsWith('image/');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              {isImage ? <ImageIcon className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-100">{previewAttachment.original_name}</h3>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  {previewAttachment.file_size}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                <span>{previewAttachment.uploaded_by}</span>
                <span>•</span>
                <span>{previewAttachment.created_at}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Zoom controls */}
            <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700 text-slate-300">
              <button
                onClick={() => setZoom(prev => Math.max(prev - 20, 60))}
                className="p-1.5 hover:bg-slate-700 rounded transition"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="px-2 text-xs font-mono">{zoom}%</span>
              <button
                onClick={() => setZoom(prev => Math.min(prev + 20, 180))}
                className="p-1.5 hover:bg-slate-700 rounded transition"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            {/* Secure Download */}
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow transition"
            >
              <Download className="w-4 h-4" />
              <span>{t('downloadSecure')}</span>
            </button>

            {/* Close */}
            <button
              onClick={() => setPreviewAttachment(null)}
              className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Security & Checksum strip */}
        <div className="px-6 py-2 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span className="font-medium">Private Storage Verified — Authorized Access Only</span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
            <span className="text-slate-500">SHA-256:</span>
            <span className="truncate max-w-[280px] bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700/60">
              {previewAttachment.checksum}
            </span>
          </div>
        </div>

        {/* Viewer Area */}
        <div className="flex-1 overflow-auto p-6 bg-slate-950 flex items-center justify-center min-h-[480px]">
          {isImage ? (
            <div
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center' }}
              className="transition-transform duration-200"
            >
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl relative">
                {/* Security watermark */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10 select-none">
                  <span className="text-5xl font-black text-white rotate-[-30deg] uppercase tracking-widest">
                    IT-EDMS CONFIDENTIAL
                  </span>
                </div>
                <div className="w-[600px] h-[360px] bg-slate-800/80 rounded-lg flex flex-col items-center justify-center p-6 text-center border border-slate-700">
                  <ImageIcon className="w-16 h-16 text-blue-400 mb-3 opacity-80" />
                  <p className="text-sm font-semibold text-slate-200">{previewAttachment.original_name}</p>
                  <p className="text-xs text-slate-400 mt-1">لقطة أمنية موثقة من نظام كاميرات المراقبة التابع لمركز البيانات</p>
                  <div className="mt-4 flex gap-2">
                    <span className="text-xs px-2.5 py-1 rounded bg-slate-700/60 text-slate-300">Resolution: 1920x1080</span>
                    <span className="text-xs px-2.5 py-1 rounded bg-slate-700/60 text-slate-300">Format: PNG</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Document / PDF Simulation View */
            <div
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
              className="w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-10 relative transition-transform duration-200 text-slate-200"
            >
              {/* Security watermark */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5 select-none">
                <span className="text-6xl font-black text-white rotate-[-30deg] uppercase tracking-widest">
                  OFFICIAL IT ARCHIVE
                </span>
              </div>

              {/* Simulated Document Header */}
              <div className="border-b-2 border-blue-500/40 pb-6 mb-8 flex justify-between items-start">
                <div>
                  <h1 className="text-lg font-bold text-blue-400">المملكة العربية السعودية — شركة التقنية المتقدمة</h1>
                  <h2 className="text-sm font-semibold text-slate-300">الإدارة العامة لتقنية المعلومات والأنظمة</h2>
                  <p className="text-xs text-slate-400 mt-1">وثيقة إلكترونية رسمية مسجلة في الأرشيف المركزي</p>
                </div>
                <div className="text-start font-mono text-xs bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                  <div className="text-blue-400 font-bold">{selectedDocument?.document_number || 'IT-DOC-2026'}</div>
                  <div className="text-slate-400">Date: {previewAttachment.created_at}</div>
                  <div className="text-emerald-400">Status: Verified & Signed</div>
                </div>
              </div>

              {/* Document Body */}
              <div className="space-y-4 text-sm leading-relaxed">
                <h3 className="text-base font-bold text-slate-100 border-s-4 border-blue-500 ps-3">
                  {selectedDocument?.title || previewAttachment.original_name}
                </h3>
                <p className="text-slate-300">
                  {selectedDocument?.description || 'تم استخراج وحفظ هذه الوثيقة وفق اشتراطات الحفظ الرقمي والتحقق من التوقيعات الإلكترونية المعتمدة.'}
                </p>

                {selectedDocument?.field_values && Object.keys(selectedDocument.field_values).length > 0 && (
                  <div className="my-6 p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                      بيانات النموذج والاعتماد الفني:
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      {Object.entries(selectedDocument.field_values).map(([k, v]) => (
                        <div key={k} className="p-2 rounded bg-slate-900 border border-slate-800">
                          <span className="text-slate-400 block">{k}:</span>
                          <span className="font-semibold text-slate-200">{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-6 border-t border-slate-800/80 grid grid-cols-3 gap-4 text-center text-xs">
                  <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                    <span className="text-slate-400 block mb-1">المنشئ</span>
                    <span className="font-bold text-slate-200">{previewAttachment.uploaded_by}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                    <span className="text-slate-400 block mb-1">حالة التوقيع الرقمي</span>
                    <span className="font-bold text-emerald-400">معتمد وموثق رقمياً ✓</span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                    <span className="text-slate-400 block mb-1">بصمة التخزين</span>
                    <span className="font-mono text-[10px] text-slate-400 truncate block">
                      {previewAttachment.checksum.substring(0, 16)}...
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between text-xs text-slate-400">
          <span>{t('privateStorageNotice')}</span>
          <button
            onClick={() => setPreviewAttachment(null)}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition"
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
};
