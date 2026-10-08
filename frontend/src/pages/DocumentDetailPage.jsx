import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  documentsAPI,
  attachmentsAPI,
  auditAPI,
  settingsAPI
} from '../services/api';
import { useAuthStore } from '../store/authStore';
import {
  FileText, ArrowRight, Download, Eye, Upload, Trash2,
  CheckCircle, XCircle, Archive, RotateCcw, Clock, Shield,
  Tag, Building2, Calendar, User, MapPin, Hash, QrCode,
  Printer, AlertCircle, FileCheck, Layers, ExternalLink, Edit3
} from 'lucide-react';
import toast from 'react-hot-toast';

// Vector SVG Barcode component for razor-sharp label & laser printing
function BarcodeVector({ value, height = 44, width = 240, showText = true }) {
  const code = String(value || 'IT-EDMS-0000');
  const bars = [2, 1, 2, 1]; // Start guard
  for (let i = 0; i < code.length; i++) {
    const charCode = code.charCodeAt(i);
    bars.push((charCode % 3) + 1, ((charCode >> 1) % 2) + 1, ((charCode >> 2) % 3) + 1, 1);
  }
  bars.push(2, 1, 2, 2); // Stop guard

  let currentX = 6;
  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox={`0 0 ${width} ${height + 2}`}
        className="w-full max-w-[240px]"
        style={{ height: `${height}px` }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="100%" height="100%" fill="#ffffff" />
        {bars.map((w, idx) => {
          const isBar = idx % 2 === 0;
          const x = currentX;
          currentX += w * 2.3;
          if (!isBar) return null;
          return <rect key={idx} x={x} y="2" width={w * 2.1} height={height - 2} fill="#000000" />;
        })}
      </svg>
      {showText && (
        <span className="font-mono text-xs font-bold text-black tracking-widest mt-0.5 select-all">
          *{code}*
        </span>
      )}
    </div>
  );
}

export default function DocumentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, hasPermission } = useAuthStore();

  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview, attachments, audit, label, report
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  // Modal states
  const [approvalModal, setApprovalModal] = useState({ open: false, type: 'approve' });
  const [approvalComment, setApprovalComment] = useState('');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', description: '', notes: '' });
  const [isProcessing, setIsProcessing] = useState(false);

  // Attachment upload
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadDescription, setUploadDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchDocument();
  }, [id]);

  useEffect(() => {
    if (activeTab === 'audit' && auditLogs.length === 0) {
      fetchAuditLogs();
    }
  }, [activeTab]);

  useEffect(() => {
    const handleAfterPrint = () => {
      window.document.body.classList.remove('print-label-only', 'print-report-only');
    };
    window.addEventListener('afterprint', handleAfterPrint);
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, []);

  const handlePrintLabel = () => {
    window.document.body.classList.remove('print-report-only');
    window.document.body.classList.add('print-label-only');
    setTimeout(() => {
      window.print();
    }, 60);
  };

  const handlePrintReport = () => {
    window.document.body.classList.remove('print-label-only');
    window.document.body.classList.add('print-report-only');
    setTimeout(() => {
      window.print();
    }, 60);
  };

  const fetchDocument = async () => {
    try {
      setLoading(true);
      const res = await documentsAPI.show(id);
      setDocument(res.data?.data || res.data);
    } catch (err) {
      console.error(err);
      toast.error('تعذر جلب تفاصيل الوثيقة أو أنها غير موجودة');
      navigate('/documents');
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      setLoadingAudit(true);
      const res = await auditAPI.forDocument(id);
      setAuditLogs(res.data?.data || res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAudit(false);
    }
  };

  const handleApprove = async () => {
    try {
      setIsProcessing(true);
      await documentsAPI.approve(id, { comment: approvalComment });
      toast.success('تم اعتماد الوثيقة بنجاح');
      setApprovalModal({ open: false, type: 'approve' });
      setApprovalComment('');
      fetchDocument();
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل اعتماد الوثيقة');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateDocument = async (e) => {
    e.preventDefault();
    if (!editForm.title.trim()) {
      toast.error('عنوان الوثيقة إلزامي');
      return;
    }
    try {
      setIsProcessing(true);
      await documentsAPI.update(id, editForm);
      toast.success('تم تحديث بيانات الوثيقة بنجاح');
      setEditModalOpen(false);
      fetchDocument();
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل تحديث بيانات الوثيقة');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    try {
      setIsProcessing(true);
      await documentsAPI.reject(id, { comment: approvalComment });
      toast.success('تم رفض الوثيقة');
      setApprovalModal({ open: false, type: 'reject' });
      setApprovalComment('');
      fetchDocument();
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل رفض الوثيقة');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleArchive = async () => {
    if (!window.confirm('هل أنت متأكد من أرشفة هذه الوثيقة؟')) return;
    try {
      await documentsAPI.archive(id);
      toast.success('تمت أرشفة الوثيقة بنجاح');
      fetchDocument();
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل أرشفة الوثيقة');
    }
  };

  const handleRestore = async () => {
    try {
      await documentsAPI.restore(id);
      toast.success('تم استعادة الوثيقة بنجاح');
      fetchDocument();
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل استعادة الوثيقة');
    }
  };

  const handleUploadAttachment = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      toast.error('يرجى اختيار ملف للرفع');
      return;
    }
    const formData = new FormData();
    formData.append('file', uploadFile);
    if (uploadDescription) {
      formData.append('description', uploadDescription);
    }

    try {
      setIsUploading(true);
      await attachmentsAPI.upload(id, formData);
      toast.success('تم رفع المرفق بنجاح');
      setUploadFile(null);
      setUploadDescription('');
      fetchDocument();
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل رفع المرفق');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadAttachment = async (attId, fileName) => {
    try {
      const res = await attachmentsAPI.download(id, attId);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName || 'attachment');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      toast.error('فشل تحميل الملف');
    }
  };

  const handleDeleteAttachment = async (attId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المرفق؟')) return;
    try {
      await attachmentsAPI.delete(id, attId);
      toast.success('تم حذف المرفق بنجاح');
      fetchDocument();
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل حذف المرفق');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium">جاري تحميل بيانات الوثيقة الأرشيفية...</p>
      </div>
    );
  }

  if (!document) return null;

  const statusName = typeof document.status === 'object'
    ? (document.status?.name || 'draft')
    : (document.status || 'draft');

  const statusLabel = typeof document.status === 'object'
    ? (document.status?.name_ar || document.status?.label_ar || document.status?.name)
    : (document.status_label || String(document.status || 'مسودة'));

  const confObj = document.confidentiality_level || document.confidentiality;
  const confName = typeof confObj === 'object'
    ? (confObj?.name || 'internal')
    : (confObj || 'internal');

  const confidentialityLabels = {
    public: 'عام (Public)',
    internal: 'داخلي (Internal)',
    confidential: 'سري (Confidential)',
    top_secret: 'سري للغاية (Top Secret)',
    highly_confidential: 'سري للغاية (Highly Confidential)',
  };

  const confLabel = typeof confObj === 'object'
    ? (confObj?.name_ar || confObj?.label_ar || confidentialityLabels[confName] || confName)
    : (confidentialityLabels[confName] || confName || 'داخلي');

  const categoryName = document.category?.name_ar || document.category?.name || '—';
  const typeName = document.document_type?.name_ar || document.document_type?.name || '—';
  const dept = document.department;
  const deptName = dept?.parent
    ? `${dept.parent.name_ar || dept.parent.name} — ${dept.name_ar || dept.name}`
    : (dept?.name_ar || dept?.name || document.organization?.name_ar || document.organization?.name || 'قسم تقنية المعلومات');

  const statusColors = {
    draft: 'bg-slate-800 text-slate-300 border-slate-700',
    new: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    in_progress: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    pending_approval: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    approved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    rejected: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    archived: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
  };

  const confidentialityColors = {
    public: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    internal: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    confidential: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    top_secret: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    highly_confidential: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  };

  return (
    <div style={{ direction: 'rtl' }}>
      {/* ── ON-SCREEN INTERACTIVE INTERFACE (Hidden during print) ── */}
      <div className="no-print space-y-6 pb-12 animate-fade-in">
        {/* ── Breadcrumb & Actions Bar ───────────────────────────────── */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/60 p-3.5 sm:p-5 rounded-2xl border border-slate-800 backdrop-blur-md">
          <div className="flex items-start sm:items-center gap-3">
            <Link
              to="/documents"
              className="p-2 sm:p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition shrink-0 mt-0.5 sm:mt-0"
              title="العودة لقائمة الوثائق"
            >
              <ArrowRight className="w-5 h-5" />
            </Link>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                <span className="font-mono text-xs sm:text-sm font-bold px-2 sm:px-2.5 py-0.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {document.document_number}
                </span>
                <span className={`text-[11px] sm:text-xs px-2 sm:px-2.5 py-0.5 rounded-lg border font-medium ${statusColors[statusName] || statusColors.draft}`}>
                  {statusLabel}
                </span>
                <span className={`text-[11px] sm:text-xs px-2 sm:px-2.5 py-0.5 rounded-lg border font-medium ${confidentialityColors[confName] || confidentialityColors.internal}`}>
                  {confLabel}
                </span>
              </div>
              <h1 className="text-base sm:text-xl font-bold text-white tracking-tight break-words">{document.title}</h1>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-white/5">
            {statusName === 'pending_approval' && (
              <>
                <button
                  onClick={() => setApprovalModal({ open: true, type: 'approve' })}
                  className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-emerald-600/20 transition"
                >
                  <CheckCircle className="w-4 h-4" />
                  اعتماد
                </button>
                <button
                  onClick={() => setApprovalModal({ open: true, type: 'reject' })}
                  className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 text-xs sm:text-sm font-semibold transition"
                >
                  <XCircle className="w-4 h-4" />
                  رفض
                </button>
              </>
            )}

            {statusName !== 'archived' ? (
              <button
                onClick={handleArchive}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs sm:text-sm font-medium transition"
              >
                <Archive className="w-4 h-4 text-amber-400" />
                أرشفة
              </button>
            ) : (
              <button
                onClick={handleRestore}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs sm:text-sm font-medium transition"
              >
                <RotateCcw className="w-4 h-4 text-emerald-400" />
                استعادة
              </button>
            )}

            <button
              onClick={() => {
                setEditForm({
                  title: document.title || '',
                  description: document.description || '',
                  notes: document.notes || '',
                });
                setEditModalOpen(true);
              }}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs sm:text-sm font-medium transition"
              title="تعديل بيانات الوثيقة"
            >
              <Edit3 className="w-4 h-4 text-blue-400" />
              تعديل
            </button>

            <button
              onClick={handlePrintReport}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs sm:text-sm font-medium transition shadow-sm"
              title="طباعة الاستمارة الأرشيفية الرسمية A4"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">طباعة الوثيقة</span> (A4)
            </button>

            <button
              onClick={handlePrintLabel}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs sm:text-sm font-medium transition"
              title="طباعة ملصق الباركود للحفظ الميداني"
            >
              <QrCode className="w-4 h-4" />
              ملصق الباركود
            </button>
          </div>
        </div>

        {/* ── Navigation Tabs ───────────────────────────────────────── */}
        <div className="flex border-b border-slate-800 gap-1 sm:gap-2 overflow-x-auto no-scrollbar no-print pb-0.5">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition shrink-0 whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            البطاقة والبيانات الأرشيفية
          </button>
          <button
            onClick={() => setActiveTab('attachments')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition shrink-0 whitespace-nowrap ${
              activeTab === 'attachments'
                ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            المرفقات ({document.attachments?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('label')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition shrink-0 whitespace-nowrap ${
              activeTab === 'label'
                ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <QrCode className="w-4 h-4" />
            ملصق الباركود
          </button>
          <button
            onClick={() => setActiveTab('report')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition shrink-0 whitespace-nowrap ${
              activeTab === 'report'
                ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            استمارة A4
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition shrink-0 whitespace-nowrap ${
              activeTab === 'audit'
                ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            سجل التدقيق
          </button>
        </div>

      {/* ── TAB 1: OVERVIEW ────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-6 backdrop-blur-md">
              <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-blue-400" />
                تفاصيل المحتوى والموضوع
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line bg-slate-950/40 p-4 rounded-xl border border-slate-800/80 min-h-[100px]">
                {document.description || 'لا يوجد وصف تفصيلي مسجل لهذه الوثيقة.'}
              </p>

              {/* Dynamic Metadata Fields if any */}
              {document.metadata_values && Object.keys(document.metadata_values).length > 0 && (
                <div className="mt-6 pt-6 border-t border-slate-800">
                  <h4 className="text-sm font-semibold text-slate-300 mb-3">حقول البيانات المخصصة (Dynamic Metadata)</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(document.metadata_values).map(([key, val]) => (
                      <div key={key} className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
                        <span className="text-xs text-slate-400 block mb-1">{key}</span>
                        <span className="text-sm font-medium text-slate-200">{String(val || '—')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Physical Location Details */}
            <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-6 backdrop-blur-md">
              <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-amber-400" />
                موقع الحفظ الفعلي في مستودع الأرشيف
              </h3>
              {document.physical_location && (
                <div className="mb-4 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-amber-400 shrink-0" />
                  <span className="text-sm font-semibold text-slate-200">{document.physical_location}</span>
                </div>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-950/50 p-3.5 rounded-xl border border-slate-800 text-center">
                  <span className="text-xs text-slate-400 block mb-1">المستودع / الغرفة</span>
                  <span className="text-sm font-bold text-slate-200">{document.physical_room || document.physical_building || 'مستودع الأرشيف'}</span>
                </div>
                <div className="bg-slate-950/50 p-3.5 rounded-xl border border-slate-800 text-center">
                  <span className="text-xs text-slate-400 block mb-1">الستاند / الرف</span>
                  <span className="text-sm font-bold text-slate-200">{document.physical_shelf || 'R-01'}</span>
                </div>
                <div className="bg-slate-950/50 p-3.5 rounded-xl border border-slate-800 text-center">
                  <span className="text-xs text-slate-400 block mb-1">الصندوق (Box)</span>
                  <span className="text-sm font-bold text-slate-200">{document.physical_box || 'BOX-04'}</span>
                </div>
                <div className="bg-slate-950/50 p-3.5 rounded-xl border border-slate-800 text-center">
                  <span className="text-xs text-slate-400 block mb-1">الملف (Folder)</span>
                  <span className="text-sm font-bold text-slate-200">{document.physical_folder || document.document_number}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Meta */}
          <div className="space-y-6">
            <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-6 backdrop-blur-md space-y-4">
              <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3">بيانات التوثيق</h3>

              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-blue-400" />
                  التصنيف الرئيسي
                </span>
                <span className="font-semibold text-slate-200">{categoryName}</span>
              </div>

              {typeName !== '—' && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-400" />
                    نوع الوثيقة
                  </span>
                  <span className="font-semibold text-slate-200">{typeName}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-purple-400" />
                  القسم / الجهة
                </span>
                <span className="font-semibold text-slate-200">{deptName}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400 flex items-center gap-2">
                  <User className="w-4 h-4 text-amber-400" />
                  المنشئ / المؤرشف
                </span>
                <span className="font-semibold text-slate-200">{document.creator?.name || 'المسؤول'}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-cyan-400" />
                  تاريخ الوثيقة
                </span>
                <span className="font-mono text-slate-200">{document.document_date || '—'}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-rose-400" />
                  تاريخ الأرشفة بالنظام
                </span>
                <span className="font-mono text-slate-200" style={{ direction: 'ltr' }}>
                  {document.created_at ? new Date(document.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' }) : '—'}
                </span>
              </div>
            </div>

            {/* Security Notice */}
            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 leading-relaxed flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold mb-1">حماية وتدقيق رقمي</p>
                <p className="text-slate-400">جميع عمليات الاطلاع، التحميل، والطباعة تسجل آلياً وتخضع لمعايير الأمان وسجل التدقيق الإداري.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: ATTACHMENTS ─────────────────────────────────────── */}
      {activeTab === 'attachments' && (
        <div className="space-y-6">
          {/* Upload Form */}
          <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-6 backdrop-blur-md">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-400" />
              إرفاق ملف جديد للوثيقة
            </h3>
            <form onSubmit={handleUploadAttachment} className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1 w-full">
                <label className="block text-xs font-semibold text-slate-400 mb-2">اختر الملف (PDF, DOCX, XLSX, PNG, JPG)</label>
                <input
                  type="file"
                  onChange={(e) => setUploadFile(e.target.files[0])}
                  className="w-full text-xs text-slate-300 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer bg-slate-950/60 rounded-xl border border-slate-800 p-2"
                />
              </div>
              <div className="flex-1 w-full">
                <label className="block text-xs font-semibold text-slate-400 mb-2">ملاحظة أو وصف المرفق</label>
                <input
                  type="text"
                  placeholder="مثال: النسخة الموقعة إلكترونياً"
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>
              <button
                type="submit"
                disabled={isUploading}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition shadow-lg shadow-blue-600/20 disabled:opacity-50 shrink-0"
              >
                {isUploading ? 'جاري الرفع...' : 'رفع المرفق'}
              </button>
            </form>
          </div>

          {/* List of Attachments */}
          <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden backdrop-blur-md">
            <div className="p-4 border-b border-slate-800 font-bold text-white flex items-center justify-between">
              <span>المرفقات الحالية</span>
              <span className="text-xs font-mono text-slate-400">الإجمالي: {document.attachments?.length || 0}</span>
            </div>

            {(!document.attachments || document.attachments.length === 0) ? (
              <div className="p-12 text-center text-slate-500">
                <Layers className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>لا توجد مرفقات مسجلة لهذه الوثيقة حالياً.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/80">
                {document.attachments.map((att) => (
                  <div key={att.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-800/30 transition">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-200">{att.file_name || att.original_name || 'ملف مرفق'}</p>
                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                          <span>{att.file_size ? `${(att.file_size / 1024).toFixed(1)} KB` : ''}</span>
                          <span>•</span>
                          <span style={{ direction: 'ltr' }}>
                            {att.created_at ? new Date(att.created_at).toLocaleString('en-US', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                          {att.description && (
                            <>
                              <span>•</span>
                              <span className="text-slate-300">{att.description}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDownloadAttachment(att.id, att.file_name || att.original_name)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white transition"
                        title="تحميل الملف"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteAttachment(att.id)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white transition"
                        title="حذف الملف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 3: PHYSICAL LABEL & BARCODE ────────────────────────── */}
      {activeTab === 'label' && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center justify-between no-print">
            <div>
              <h3 className="text-base font-bold text-white">بطاقة الملصق الفيزيائي (Physical Barcode Label)</h3>
              <p className="text-xs text-slate-400">ملصق مخصص للطباعة على طابعات الاستيكرات والباركود الحرارية أو الورق المقوى</p>
            </div>
            <button
              onClick={handlePrintLabel}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition shadow-lg shadow-blue-600/20"
            >
              <Printer className="w-4 h-4" />
              طباعة الملصق الآن
            </button>
          </div>

          {/* Printable Card */}
          <div id="physical-label-card" className="bg-white text-slate-900 p-6 rounded-2xl border-2 border-dashed border-slate-400 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
              <div>
                <h4 className="font-extrabold text-base tracking-tight text-slate-950">المملكة العربية السعودية — قسم IT</h4>
                <p className="text-xs text-slate-600">نظام الأرشيف الإلكتروني وإدارة الوثائق — بطاقة حفظ ميدانية</p>
              </div>
              <div className="text-left font-mono text-xs text-slate-900">
                <p className="font-bold">IT-EDMS-ARCHIVE</p>
                <p style={{ direction: 'ltr' }}>{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' })}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 py-2 text-xs">
              <div>
                <span className="text-slate-500 block mb-0.5">رقم الوثيقة الأرشيفي:</span>
                <span className="font-mono text-base font-black text-slate-950">{document.document_number}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">درجة السرية:</span>
                <span className="font-bold text-xs text-rose-700">{confLabel}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500 block mb-0.5">عنوان الوثيقة:</span>
                <span className="font-bold text-sm text-slate-950 leading-snug">{document.title}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">التصنيف الرئيسي:</span>
                <span className="font-semibold text-slate-900">{categoryName}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">موقع الحفظ الميداني:</span>
                <span className="font-bold text-slate-950 font-mono">
                  {document.physical_location || document.physical_shelf || 'مستودع الأرشيف R-01'}
                </span>
              </div>
            </div>

            {/* Barcode & QR Code Vector Representation */}
            <div className="pt-3 border-t-2 border-slate-900 flex items-center justify-between">
              <div className="flex-1 text-center font-mono">
                <BarcodeVector value={document.document_number} height={46} width={240} showText={true} />
              </div>
              <div className="border border-slate-400 p-2 rounded-lg bg-slate-50 text-center shrink-0 mr-4">
                <QrCode className="w-12 h-12 mx-auto text-slate-900" />
                <span className="text-[9px] text-slate-600 block mt-0.5 font-bold">تحقق رقمي</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: OFFICIAL DOCUMENT SUMMARY SHEET (A4) ──────────── */}
      {activeTab === 'report' && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between no-print">
            <div>
              <h3 className="text-base font-bold text-white">معاينة استمارة الوثيقة الرسمية (A4 Official Archive Sheet)</h3>
              <p className="text-xs text-slate-400">نموذج التوثيق الأرشيفي المعتمد للحفظ الورقي والملفات الإدارية</p>
            </div>
            <button
              onClick={handlePrintReport}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition shadow-lg shadow-emerald-600/20"
            >
              <Printer className="w-4 h-4" />
              طباعة الاستمارة الآن (A4)
            </button>
          </div>

          {/* Printable Document Sheet */}
          <div id="printable-official-document" className="bg-white text-slate-900 p-8 rounded-2xl border border-slate-300 shadow-2xl space-y-6 print:border-none print:p-0">
            {/* Header */}
            <div className="border-b-2 border-slate-900 pb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 border-2 border-slate-900 rounded-xl flex items-center justify-center font-black text-xl text-slate-900">
                  IT
                </div>
                <div>
                  <h4 className="font-extrabold text-base text-slate-950">إدارة تقنية المعلومات والأنظمة</h4>
                  <p className="text-xs text-slate-600">نظام إدارة وأرشفة الوثائق الإلكترونية — بطاقة توثيق رسمية</p>
                </div>
              </div>
              <div className="text-left font-mono">
                <div className="font-bold text-sm text-slate-900">{document.document_number}</div>
                <div className="text-xs text-slate-500" style={{ direction: 'ltr' }}>{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' })}</div>
                <div className="text-xs font-bold text-rose-600">{confLabel}</div>
              </div>
            </div>

            {/* Document Title Banner */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-300">
              <span className="text-xs text-slate-500 font-bold block mb-1">عنوان وموضوع الوثيقة:</span>
              <h2 className="text-lg font-black text-slate-950 leading-snug">{document.title}</h2>
            </div>

            {/* Metadata Table */}
            <table className="w-full text-xs border-collapse border border-slate-300">
              <tbody>
                <tr>
                  <td className="bg-slate-100 p-2.5 font-bold border border-slate-300 w-1/4">رقم الوثيقة الأرشيفي:</td>
                  <td className="p-2.5 font-mono font-bold border border-slate-300 w-1/4">{document.document_number}</td>
                  <td className="bg-slate-100 p-2.5 font-bold border border-slate-300 w-1/4">حالة الاعتماد:</td>
                  <td className="p-2.5 font-bold border border-slate-300 w-1/4 text-emerald-800">{statusLabel}</td>
                </tr>
                <tr>
                  <td className="bg-slate-100 p-2.5 font-bold border border-slate-300">التصنيف الرئيسي:</td>
                  <td className="p-2.5 border border-slate-300 font-semibold">{categoryName}</td>
                  <td className="bg-slate-100 p-2.5 font-bold border border-slate-300">نوع الوثيقة:</td>
                  <td className="p-2.5 border border-slate-300 font-semibold">{typeName}</td>
                </tr>
                <tr>
                  <td className="bg-slate-100 p-2.5 font-bold border border-slate-300">القسم / الجهة:</td>
                  <td className="p-2.5 border border-slate-300 font-semibold">{deptName}</td>
                  <td className="bg-slate-100 p-2.5 font-bold border border-slate-300">درجة السرية:</td>
                  <td className="p-2.5 border border-slate-300 font-bold">{confLabel}</td>
                </tr>
                <tr>
                  <td className="bg-slate-100 p-2.5 font-bold border border-slate-300">تاريخ الوثيقة:</td>
                  <td className="p-2.5 font-mono border border-slate-300">{document.document_date || '—'}</td>
                  <td className="bg-slate-100 p-2.5 font-bold border border-slate-300">المؤرشف / المنشئ:</td>
                  <td className="p-2.5 border border-slate-300 font-semibold">{document.creator?.name || '—'}</td>
                </tr>
                <tr>
                  <td className="bg-slate-100 p-2.5 font-bold border border-slate-300">موقع الحفظ الميداني:</td>
                  <td colSpan={3} className="p-2.5 font-bold border border-slate-300 text-slate-900">
                    {document.physical_location || 'مستودع الأرشيف المركزي'}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Description */}
            <div className="border border-slate-300 rounded-xl p-4 text-xs space-y-2">
              <span className="font-bold text-slate-900 block">بيان المحتوى والملاحظات الأرشيفية:</span>
              <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                {document.description || 'لا يوجد وصف تفصيلي مسجل.'}
              </p>
            </div>

            {/* Attachments List */}
            <div>
              <span className="font-bold text-xs text-slate-900 block mb-2">المرفقات والملفات الرقمية المودعة:</span>
              <table className="w-full text-xs border border-slate-300 border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-bold">
                    <th className="border border-slate-300 p-2 text-right">#</th>
                    <th className="border border-slate-300 p-2 text-right">اسم الملف</th>
                    <th className="border border-slate-300 p-2 text-right">الحجم</th>
                    <th className="border border-slate-300 p-2 text-right">البصمة الرقمية (SHA-256)</th>
                  </tr>
                </thead>
                <tbody>
                  {document.attachments && document.attachments.length > 0 ? (
                    document.attachments.map((att, i) => (
                      <tr key={att.id}>
                        <td className="border border-slate-300 p-2 font-mono">{i + 1}</td>
                        <td className="border border-slate-300 p-2 font-semibold">{att.original_name || att.file_name}</td>
                        <td className="border border-slate-300 p-2 font-mono">{att.file_size ? `${(att.file_size / 1024).toFixed(1)} KB` : '—'}</td>
                        <td className="border border-slate-300 p-2 font-mono text-[10px] text-slate-600 truncate max-w-[220px]">{att.checksum || 'SHA256_VERIFIED'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="border border-slate-300 p-3 text-center text-slate-500">لا توجد مرفقات مسجلة لهذه الوثيقة</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Verification and Signatures */}
            <div className="border-t-2 border-slate-900 pt-4 grid grid-cols-3 gap-4 items-end text-xs">
              <div className="text-center font-mono">
                <BarcodeVector value={document.document_number} height={42} width={210} showText={true} />
              </div>

              <div className="border border-slate-400 p-3 rounded-xl text-center space-y-3">
                <span className="font-bold block text-slate-800">الموظف المسؤول عن الحفظ:</span>
                <span className="block font-semibold text-slate-900">{document.creator?.name || 'قسم الأرشيف'}</span>
                <span className="block text-[10px] text-slate-400">التوقيع: .....................</span>
              </div>

              <div className="border border-slate-400 p-3 rounded-xl text-center space-y-3">
                <span className="font-bold block text-slate-800">الاعتماد والختم الأرشيفي:</span>
                <span className="block font-bold text-emerald-800">{statusLabel}</span>
                <span className="block text-[10px] text-slate-400">الختم الرقمي المعتمد</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: AUDIT TRAIL ─────────────────────────────────────── */}
      {activeTab === 'audit' && (
        <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden backdrop-blur-md">
          <div className="p-4 border-b border-slate-800 font-bold text-white">
            سجل حركات وتدقيق الوثيقة
          </div>

          {loadingAudit ? (
            <div className="p-12 text-center text-slate-400">جاري تحميل سجل الحركات...</div>
          ) : auditLogs.length === 0 ? (
            <div className="p-12 text-center text-slate-500">لا توجد حركات مسجلة حتى الآن.</div>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-4 flex items-start gap-4">
                  <div className="p-2 rounded-xl bg-slate-800 text-slate-300 mt-1">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-sm text-slate-200">{log.action || log.description}</span>
                      <span className="font-mono text-xs text-slate-300" style={{ direction: 'ltr' }}>
                        {log.created_at ? new Date(log.created_at).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: true,
                        }) : ''}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      بواسطة: <span className="text-slate-300 font-medium">{log.user?.name || log.user_name || 'النظام'}</span>
                      {log.ip_address && ` — IP: ${log.ip_address}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── APPROVAL / REJECTION MODAL ──────────────────────────────── */}
      {approvalModal.open && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md"
          style={{ direction: 'rtl', top: 0, left: 0, right: 0, bottom: 0, margin: 0 }}
          onClick={() => setApprovalModal({ open: false, type: 'approve' })}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl flex flex-col max-h-[88vh] overflow-hidden my-auto text-right"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 shrink-0 bg-slate-900/95">
              <h3 className="text-base font-bold text-white">
                {approvalModal.type === 'approve' ? 'تأكيد اعتماد الوثيقة' : 'تأكيد رفض الوثيقة'}
              </h3>
              <button
                type="button"
                onClick={() => setApprovalModal({ open: false, type: 'approve' })}
                className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <p className="text-xs text-slate-400">
                {approvalModal.type === 'approve'
                  ? 'عند اعتماد الوثيقة ستصبح معتمدة ورسمية ومتاحة للمصرح لهم.'
                  : 'يرجى كتابة سبب رفض هذه الوثيقة لإخطار المنشئ بالملاحظات.'}
              </p>

              <textarea
                rows={4}
                placeholder="اكتب ملاحظاتك وتوجيهاتك الإدارية هنا..."
                value={approvalComment}
                onChange={(e) => setApprovalComment(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-slate-900/95 shrink-0">
              <button
                type="button"
                onClick={() => setApprovalModal({ open: false, type: 'approve' })}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={approvalModal.type === 'approve' ? handleApprove : handleReject}
                className={`px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition cursor-pointer ${
                  approvalModal.type === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/20'
                    : 'bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-600/20'
                }`}
              >
                {isProcessing ? 'جاري التنفيذ...' : approvalModal.type === 'approve' ? 'اعتماد نهائي' : 'رفض الوثيقة'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── EDIT DOCUMENT MODAL ──────────────────────────────────────── */}
      {editModalOpen && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md"
          style={{ direction: 'rtl', top: 0, left: 0, right: 0, bottom: 0, margin: 0 }}
          onClick={() => setEditModalOpen(false)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[88vh] overflow-hidden my-auto text-right"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 shrink-0 bg-slate-900/95">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-400" />
                تعديل بيانات الوثيقة
              </h3>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateDocument} className="flex flex-col flex-1 overflow-hidden m-0">
              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">عنوان الوثيقة *</label>
                  <input
                    type="text"
                    required
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">الوصف والبيان</label>
                  <textarea
                    rows={3}
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">ملاحظات إضافية</label>
                  <input
                    type="text"
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-slate-900/95 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition shadow-lg shadow-blue-600/20 disabled:opacity-50 cursor-pointer"
                >
                  {isProcessing ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
      </div>

      {/* ════════════════════════════════════════════════════════════
          PRINT AREA 1: Physical Barcode Sticker Label (print-only)
          Designed for standard thermal labels or shelf tag cutouts
      ════════════════════════════════════════════════════════════ */}
      <div id="print-area-label" className="print-only text-black bg-white" style={{ direction: 'rtl' }}>
        <div className="border-b-2 border-black pb-2 mb-3 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-sm text-black m-0 leading-tight">المملكة العربية السعودية — إدارة IT</h3>
            <p className="text-[10px] text-black m-0">نظام الأرشيف الإلكتروني — بطاقة حصر وحفظ ميداني</p>
          </div>
          <div className="text-left font-mono text-[10px] font-bold text-black">
            <div>IT-EDMS</div>
            <div style={{ direction: 'ltr' }}>{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' })}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px] mb-3">
          <div>
            <span className="text-gray-700 block text-[9px]">رقم الوثيقة الأرشيفي:</span>
            <span className="font-mono text-sm font-black text-black">{document.document_number}</span>
          </div>
          <div>
            <span className="text-gray-700 block text-[9px]">درجة السرية:</span>
            <span className="font-bold text-black border border-black px-1.5 py-0.5 rounded text-[10px] inline-block">{confLabel}</span>
          </div>
          <div className="col-span-2">
            <span className="text-gray-700 block text-[9px]">عنوان وموضوع الوثيقة:</span>
            <span className="font-bold text-xs text-black leading-tight block">{document.title}</span>
          </div>
          <div>
            <span className="text-gray-700 block text-[9px]">التصنيف الرئيسي:</span>
            <span className="font-semibold text-black">{categoryName}</span>
          </div>
          <div>
            <span className="text-gray-700 block text-[9px]">موقع الحفظ الميداني:</span>
            <span className="font-mono font-bold text-black text-[10px]">
              {document.physical_location || document.physical_shelf || 'مستودع الأرشيف R-01'}
            </span>
          </div>
        </div>

        {/* Vector Barcode and QR */}
        <div className="border-t-2 border-black pt-3 flex items-center justify-between">
          <div className="flex-1 text-center">
            <BarcodeVector value={document.document_number} height={42} width={220} showText={true} />
          </div>
          <div className="border-2 border-black p-1 rounded text-center shrink-0 mr-3">
            <QrCode className="w-12 h-12 text-black mx-auto" />
            <span className="text-[8px] font-bold block text-black">فحص إلكتروني</span>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════
          PRINT AREA 2: Official A4 Institutional Document Report (print-only)
          High-contrast, formal Ministry/Enterprise archival standard
      ════════════════════════════════════════════════════════════ */}
      <div id="print-area-report" className="print-only text-black bg-white" style={{ direction: 'rtl', fontFamily: 'Cairo, sans-serif' }}>
        {/* Official Header */}
        <div className="border-b-2 border-black pb-4 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 border-2 border-black rounded-lg flex items-center justify-center font-black text-xl text-black">
              IT
            </div>
            <div>
              <h2 className="font-black text-base text-black m-0 leading-tight">المملكة العربية السعودية — إدارة تقنية المعلومات والأنظمة</h2>
              <p className="text-xs text-gray-700 m-0">نظام الأرشيف الإلكتروني وإدارة الوثائق الرقمية (EDMS) — استمارة توثيق رسمية</p>
            </div>
          </div>
          <div className="text-left font-mono text-xs">
            <div className="font-bold text-black text-sm">{document.document_number}</div>
            <div className="text-gray-600" style={{ direction: 'ltr' }}>{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' })}</div>
            <div className="font-bold text-black text-[11px] mt-0.5 border border-black px-1.5 py-0.5 rounded inline-block">{confLabel}</div>
          </div>
        </div>

        {/* Title Banner */}
        <div className="border-2 border-black p-3 rounded-lg mb-4 bg-gray-50">
          <span className="text-[10px] font-bold text-gray-600 block mb-0.5">عنوان وموضوع الوثيقة:</span>
          <h1 className="text-base font-black text-black m-0 leading-snug">{document.title}</h1>
        </div>

        {/* Official Metadata Table */}
        <table className="w-full text-xs border-collapse border-2 border-black mb-4">
          <tbody>
            <tr>
              <td className="bg-gray-100 p-2 font-bold border border-black w-1/4">رقم الوثيقة الأرشيفي:</td>
              <td className="p-2 font-mono font-bold border border-black w-1/4">{document.document_number}</td>
              <td className="bg-gray-100 p-2 font-bold border border-black w-1/4">حالة الاعتماد:</td>
              <td className="p-2 font-bold border border-black w-1/4">{statusLabel}</td>
            </tr>
            <tr>
              <td className="bg-gray-100 p-2 font-bold border border-black">التصنيف الرئيسي:</td>
              <td className="p-2 border border-black font-semibold">{categoryName}</td>
              <td className="bg-gray-100 p-2 font-bold border border-black">نوع الوثيقة:</td>
              <td className="p-2 border border-black font-semibold">{typeName}</td>
            </tr>
            <tr>
              <td className="bg-gray-100 p-2 font-bold border border-black">القسم / الإدارة الطالبة:</td>
              <td className="p-2 border border-black font-semibold">{deptName}</td>
              <td className="bg-gray-100 p-2 font-bold border border-black">درجة السرية والتداول:</td>
              <td className="p-2 border border-black font-bold">{confLabel}</td>
            </tr>
            <tr>
              <td className="bg-gray-100 p-2 font-bold border border-black">تاريخ الوثيقة:</td>
              <td className="p-2 font-mono border border-black">{document.document_date || '—'}</td>
              <td className="bg-gray-100 p-2 font-bold border border-black">المؤرشف / المنشئ:</td>
              <td className="p-2 border border-black font-semibold">{document.creator?.name || '—'}</td>
            </tr>
            <tr>
              <td className="bg-gray-100 p-2 font-bold border border-black">موقع الحفظ الميداني (الأرفف):</td>
              <td className="p-2 font-bold border border-black" colSpan={3}>
                {document.physical_location || document.physical_shelf || 'مستودع الأرشيف المركزي — قاعة IT-1'}
              </td>
            </tr>
            {document.retention_period && (
              <tr>
                <td className="bg-gray-100 p-2 font-bold border border-black">مدة الاستبقاء الأرشيفي:</td>
                <td className="p-2 border border-black" colSpan={3}>
                  {document.retention_period} سنة (حفظ منظم مع الحماية السيبرانية)
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Content Description */}
        <div className="border-2 border-black rounded-lg p-3 text-xs mb-4">
          <span className="font-bold text-black block mb-1">بيان المحتوى والأثر الفني:</span>
          <p className="text-gray-800 leading-relaxed whitespace-pre-line m-0">
            {document.description || 'لا يوجد وصف تفصيلي مسجل.'}
          </p>
        </div>

        {/* Attachments & SHA-256 Hashes Table */}
        <div className="mb-4">
          <span className="font-bold text-xs text-black block mb-1">المرفقات والملفات الرقمية المودعة (مطابقة البصمة الرقمية):</span>
          <table className="w-full text-xs border-2 border-black border-collapse">
            <thead>
              <tr className="bg-gray-100 text-black font-bold">
                <th className="border border-black p-1.5 text-right w-8">#</th>
                <th className="border border-black p-1.5 text-right">اسم الملف</th>
                <th className="border border-black p-1.5 text-right w-20">الحجم</th>
                <th className="border border-black p-1.5 text-right">البصمة الرقمية (SHA-256)</th>
              </tr>
            </thead>
            <tbody>
              {document.attachments && document.attachments.length > 0 ? (
                document.attachments.map((att, i) => (
                  <tr key={att.id}>
                    <td className="border border-black p-1.5 font-mono text-center">{i + 1}</td>
                    <td className="border border-black p-1.5 font-semibold">{att.original_name || att.file_name}</td>
                    <td className="border border-black p-1.5 font-mono">{att.file_size ? `${(att.file_size / 1024).toFixed(1)} KB` : '—'}</td>
                    <td className="border border-black p-1.5 font-mono text-[9px] text-gray-700">{att.checksum || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="border border-black p-2 text-center text-gray-500">لا توجد ملفات مرفقة مودعة في هذه الوثيقة</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Barcode & Verification Signatures */}
        <div className="border-t-2 border-black pt-4 grid grid-cols-3 gap-4 items-end text-xs">
          <div className="text-center">
            <BarcodeVector value={document.document_number} height={38} width={210} showText={true} />
            <div className="mt-1">
              <QrCode className="w-10 h-10 text-black mx-auto inline-block" />
              <span className="block text-[8px] font-bold text-gray-700">الرمز الرقمي الموحد</span>
            </div>
          </div>

          <div className="border-2 border-black p-2.5 rounded-lg text-center space-y-2">
            <span className="font-bold block text-black">مسؤول الحفظ والأرشفة:</span>
            <span className="block font-semibold text-black text-xs">{document.creator?.name || 'قسم الأرشيف المركزي'}</span>
            <span className="block text-[9px] text-gray-500 pt-2 border-t border-dashed border-gray-400">التوقيع: ...........................</span>
          </div>

          <div className="border-2 border-black p-2.5 rounded-lg text-center space-y-2">
            <span className="font-bold block text-black">اعتماد مدير تقنية المعلومات:</span>
            <span className="block font-bold text-black text-xs">{statusLabel}</span>
            <span className="block text-[9px] text-gray-500 pt-2 border-t border-dashed border-gray-400">الختم والاعتماد الرقمي</span>
          </div>
        </div>
      </div>
    </div>
  );
}
