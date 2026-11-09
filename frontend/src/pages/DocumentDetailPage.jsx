import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import {
  documentsAPI,
  attachmentsAPI,
  versionsAPI,
  approvalsAPI,
  usersAPI,
  workflowsAPI,
  auditAPI,
  settingsAPI
} from '../services/api';

import { useAuthStore } from '../store/authStore';
import {
  FileText, ArrowRight, Download, Eye, Upload, Trash2,
  CheckCircle, XCircle, Archive, RotateCcw, Clock, Shield,
  Tag, Building2, Calendar, User, MapPin, Hash, QrCode,
  Printer, AlertCircle, FileCheck, Layers, ExternalLink, Edit3,
  ZoomIn, ZoomOut, RotateCw, X, MessageSquare, GitBranch, Share2, Copy, Send, Check,
  Sparkles, RefreshCw, Search, Stamp, Camera, ShieldCheck, Waves,
  CalendarClock, ArchiveX,
  Plus
} from 'lucide-react';
import toast from 'react-hot-toast';
import DocumentScannerModal from '../components/common/DocumentScannerModal';
import DigitalSignatureModal from '../components/common/DigitalSignatureModal';
import WatermarkOverlay from '../components/common/WatermarkOverlay';

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

const DOCUMENT_TABS = ['overview', 'attachments', 'versions', 'approvals', 'comments', 'label', 'report', 'audit'];

export default function DocumentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, hasPermission } = useAuthStore();

  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const requestedTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(DOCUMENT_TABS.includes(requestedTab) ? requestedTab : 'overview');
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

  // Advanced Scanner, Digital Signature & Watermark states
  const [scannerModalOpen, setScannerModalOpen] = useState(false);
  const [digitalSignatureModalOpen, setDigitalSignatureModalOpen] = useState(false);
  const [watermarkActive, setWatermarkActive] = useState(true);

  // Multi-level Approvals & Workflow states
  const [requestApprovalModalOpen, setRequestApprovalModalOpen] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedApproverId, setSelectedApproverId] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');
  const [availableWorkflows, setAvailableWorkflows] = useState([]);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState('');
  const [selectedWorkflowStepId, setSelectedWorkflowStepId] = useState('');
  const [submittingApprovalRequest, setSubmittingApprovalRequest] = useState(false);
  const [approvalTarget, setApprovalTarget] = useState(null);
  const [approvalTargetLoading, setApprovalTargetLoading] = useState(false);
  const [manualApprovalOverride, setManualApprovalOverride] = useState(false);
  const [stepDecisionModal, setStepDecisionModal] = useState({ open: false, approval: null, decision: 'approved', comments: '' });
  const [submittingStepDecision, setSubmittingStepDecision] = useState(false);

  const handleOpenRequestApprovalModal = async () => {
    setRequestApprovalModalOpen(true);
    setManualApprovalOverride(false);
    setSelectedApproverId('');

    try {
      setApprovalTargetLoading(true);
      const res = await approvalsAPI.target(id);
      const target = res.data?.data || null;
      setApprovalTarget(target);
      if (!target?.manager) {
        setManualApprovalOverride(true);
      }
    } catch (err) {
      console.error(err);
      setApprovalTarget(null);
      setManualApprovalOverride(true);
    } finally {
      setApprovalTargetLoading(false);
    }

    try {
      const params = { active_only: true };
      if (document?.document_type_id) params.document_type_id = document.document_type_id;
      const res = await workflowsAPI.list(params);
      setAvailableWorkflows(res.data?.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadApprovalCandidates = async () => {
    if (availableUsers.length > 0) return;
    try {
      const res = await usersAPI.list({ per_page: 100 });
      const list = res.data?.data?.data || res.data?.data || [];
      setAvailableUsers(list);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleManualApproval = (checked) => {
    setManualApprovalOverride(checked);
    if (!checked) {
      setSelectedApproverId('');
    } else {
      loadApprovalCandidates();
    }
  };

  const handleSubmitApprovalRequest = async (e) => {
    e.preventDefault();
    if (manualApprovalOverride && !selectedApproverId) {
      toast.error('يرجى اختيار المعتمد المطلوب إحالة الوثيقة إليه');
      return;
    }
    try {
      setSubmittingApprovalRequest(true);
      const res = await approvalsAPI.request(id, {
        approver_id: manualApprovalOverride ? selectedApproverId : null,
        workflow_step_id: selectedWorkflowStepId ? parseInt(selectedWorkflowStepId) : null,
        comments: approvalNotes || null,
      });
      toast.success(res.data?.message || 'تمت إحالة الوثيقة وإشعار المعتمد بنجاح!');
      setRequestApprovalModalOpen(false);
      setSelectedApproverId('');
      setApprovalNotes('');
      setSelectedWorkflowId('');
      setSelectedWorkflowStepId('');
      setManualApprovalOverride(false);
      fetchDocument();
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل إرسال طلب الاعتماد');
    } finally {
      setSubmittingApprovalRequest(false);
    }
  };

  const selectedWorkflow = availableWorkflows.find(w => String(w.id) === String(selectedWorkflowId));
  const selectedWorkflowStep = selectedWorkflow?.steps?.find(s => String(s.id) === String(selectedWorkflowStepId));

  const handleOpenStepDecision = (approval, decision) => {
    setStepDecisionModal({
      open: true,
      approval,
      decision,
      comments: decision === 'approved' ? 'معتمد وفق الأصول' : '',
    });
  };

  const handleSubmitStepDecision = async (e) => {
    e.preventDefault();
    if (!stepDecisionModal.approval) return;
    try {
      setSubmittingStepDecision(true);
      await approvalsAPI.decide(id, stepDecisionModal.approval.id, {
        decision: stepDecisionModal.decision,
        comments: stepDecisionModal.comments,
      });
      toast.success(stepDecisionModal.decision === 'approved' ? 'تم اعتماد هذه المرحلة بنجاح' : 'تم تسجيل قرار الرفض');
      setStepDecisionModal({ open: false, approval: null, decision: 'approved', comments: '' });
      fetchDocument();
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل تنفيذ القرار');
    } finally {
      setSubmittingStepDecision(false);
    }
  };

  const handleScanAndUploadAttachment = async (file, scanData) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('description', 'مستند ممسوح ضوئياً عبر الماسح الذكي للكاميرا');

    try {
      setIsUploading(true);
      const res = await attachmentsAPI.upload(id, formData);
      toast.success('تم مسح وإيداع المستند كمرفق رسمي بنجاح');
      
      const newAttId = res.data?.data?.id;
      if (newAttId && scanData?.ocrText) {
        await attachmentsAPI.processOcr(id, newAttId, { ocr_text: scanData.ocrText });
      } else if (newAttId) {
        attachmentsAPI.processOcr(id, newAttId).catch(() => {});
      }
      fetchDocument();
    } catch (err) {
      toast.error('فشل إيداع المستند الممسوح');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDigitalSignatureConfirm = async (sigData) => {
    try {
      setIsProcessing(true);
      const commentText = `اعتماد إلكتروني رقمي موثق [رمز التحقق: ${sigData.verificationCode} | المعتمد: ${sigData.signerName} - ${sigData.jobTitle}]`;
      await documentsAPI.approve(id, {
        comment: commentText,
        signature: sigData.signatureDataUrl,
      });
      toast.success('تم اعتماد وتوثيق الوثيقة بالختم الرقمي والتوقيع الإلكتروني بنجاح!');
      fetchDocument();
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل الاعتماد بالتوقيع الرقمي');
    } finally {
      setIsProcessing(false);
    }
  };

  // OCR modal state
  const [ocrModal, setOcrModal] = useState({
    open: false,
    attachment: null,
    text: '',
    loading: false,
    processing: false,
    search: '',
  });

  const handleOpenOcrModal = async (att) => {
    setOcrModal({
      open: true,
      attachment: att,
      text: att.ocr_text || '',
      loading: !att.ocr_text,
      processing: false,
      search: '',
    });

    try {
      const res = await attachmentsAPI.getOcr(document.id, att.id);
      const data = res.data?.data;
      setOcrModal(prev => ({
        ...prev,
        text: data?.ocr_text || '',
        loading: false,
      }));
    } catch (err) {
      console.error(err);
      setOcrModal(prev => ({ ...prev, loading: false }));
    }
  };

  const handleTriggerOcr = async (attId) => {
    if (!attId) return;
    setOcrModal(prev => ({ ...prev, processing: true }));
    try {
      const res = await attachmentsAPI.processOcr(document.id, attId);
      const data = res.data?.data;
      toast.success('تمت معالجة واستخراج النص وفهرسته بنجاح');
      setOcrModal(prev => ({
        ...prev,
        text: data?.ocr_text || '',
        processing: false,
      }));
      if (typeof fetchDocument === 'function') {
        fetchDocument();
      }
    } catch (err) {
      console.error(err);
      toast.error('تعذر استخراج النص من هذا الملف');
      setOcrModal(prev => ({ ...prev, processing: false }));
    }
  };

  // Comments and quick tools
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Document / Attachment Preview Modal State
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [activePreviewAttachment, setActivePreviewAttachment] = useState(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(null);
  const [previewZoom, setPreviewZoom] = useState(1);
  const [previewRotation, setPreviewRotation] = useState(0);

  // Legal Hold Modal State
  const [legalHoldModalOpen, setLegalHoldModalOpen] = useState(false);
  const [legalHoldReason, setLegalHoldReason] = useState('');
  const [legalHoldSubmitting, setLegalHoldSubmitting] = useState(false);

  // Version Modal State
  const [versionModalOpen, setVersionModalOpen] = useState(false);
  const [versionNumber, setVersionNumber] = useState('');
  const [versionSummary, setVersionSummary] = useState('');
  const [versionFile, setVersionFile] = useState(null);
  const [versionSubmitting, setVersionSubmitting] = useState(false);


  useEffect(() => {
    setAuditLogs([]);
    fetchDocument();
  }, [id]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (DOCUMENT_TABS.includes(tab)) setActiveTab(tab);
  }, [searchParams]);

  useEffect(() => {
    if (activeTab === 'audit') {
      fetchAuditLogs();
    }
  }, [activeTab, id]);

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

  const handleOpenPrimaryPreview = () => {
    if (document?.attachments && document.attachments.length > 0) {
      // Find first previewable attachment (preferring PDF or images), or fallback to first
      const previewable = document.attachments.find(a => {
        const name = (a.file_name || a.original_name || '').toLowerCase();
        return /\.(pdf|png|jpe?g|webp|gif|svg|txt|csv|json)$/i.test(name) ||
          (a.mime_type && (a.mime_type.includes('pdf') || a.mime_type.startsWith('image/') || a.mime_type.startsWith('text/')));
      }) || document.attachments[0];
      handlePreviewAttachment(previewable);
    } else {
      setActivePreviewAttachment(null);
      setPreviewBlobUrl(null);
      setPreviewError(null);
      setPreviewModalOpen(true);
    }
  };

  const handlePreviewAttachment = async (att) => {
    if (!att) return;
    setPreviewModalOpen(true);
    setActivePreviewAttachment(att);
    setPreviewZoom(1);
    setPreviewRotation(0);
    setPreviewError(null);

    if (previewBlobUrl) {
      window.URL.revokeObjectURL(previewBlobUrl);
      setPreviewBlobUrl(null);
    }

    // Check if file is an Office / non-streamable document
    const fileName = (att.file_name || att.original_name || '').toLowerCase();
    const isOffice = /\.(docx?|xlsx?|pptx?|zip|rar)$/i.test(fileName) ||
      (att.mime_type && (
        att.mime_type.includes('wordprocessingml') ||
        att.mime_type.includes('msword') ||
        att.mime_type.includes('spreadsheetml') ||
        att.mime_type.includes('excel') ||
        att.mime_type.includes('presentationml')
      ));

    if (isOffice) {
      setPreviewLoading(false);
      return;
    }

    try {
      setPreviewLoading(true);
      const res = await attachmentsAPI.preview(id, att.id);
      const mime = att.mime_type || res.headers?.['content-type'] || 'application/pdf';
      const blob = new Blob([res.data], { type: mime });
      const url = window.URL.createObjectURL(blob);
      setPreviewBlobUrl(url);
    } catch (err) {
      console.error('Failed to preview file:', err);
      let errMsg = 'تعذر فتح المعاينة المباشرة لهذا الملف. يمكنك تنزيل الملف والاطلاع عليه محلياً.';
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const json = JSON.parse(text);
          if (json.message) errMsg = json.message;
        } catch (_) {}
      } else if (err.response?.data?.message) {
        errMsg = err.response.data.message;
      }
      setPreviewError(errMsg);
    } finally {
      setPreviewLoading(false);
    }
  };


  const handleClosePreview = () => {
    setPreviewModalOpen(false);
    if (previewBlobUrl) {
      window.URL.revokeObjectURL(previewBlobUrl);
      setPreviewBlobUrl(null);
    }
    setActivePreviewAttachment(null);
    setPreviewZoom(1);
    setPreviewRotation(0);
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

  const handleLegalHoldSubmit = async (e) => {
    e.preventDefault();
    const isHolding = !document.legal_hold;

    if (isHolding && !legalHoldReason.trim()) {
      toast.error('يرجى إدخال سبب فرض الحجز القانوني');
      return;
    }

    try {
      setLegalHoldSubmitting(true);
      const res = await documentsAPI.setLegalHold(id, {
        legal_hold: isHolding,
        reason: legalHoldReason.trim() || undefined,
      });
      toast.success(res.data?.message || (isHolding ? 'تم فرض الحجز القانوني' : 'تم رفع الحجز القانوني'));
      setLegalHoldModalOpen(false);
      setLegalHoldReason('');
      fetchDocument();
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل تحديث حالة الحجز القانوني');
    } finally {
      setLegalHoldSubmitting(false);
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
      const link = window.document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName || 'attachment');
      window.document.body.appendChild(link);
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

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      setSubmittingComment(true);
      await documentsAPI.addComment(id, { comment: newComment.trim() });
      toast.success('تمت إضافة الملاحظة الإدارية بنجاح');
      setNewComment('');
      fetchDocument();
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل إضافة الملاحظة');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الملاحظة؟')) return;
    try {
      await documentsAPI.deleteComment(id, commentId);
      toast.success('تم حذف الملاحظة بنجاح');
      fetchDocument();
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل حذف الملاحظة');
    }
  };

  const handleRevertVersion = async (ver) => {
    if (!window.confirm(`هل تريد استرجاع الإصدار ${ver.version_number} كإصدار جديد؟ سيتم توثيق العملية في سجل الإصدارات.`)) return;
    try {
      const res = await versionsAPI.revert(id, ver.id);
      toast.success(res.data?.message || 'تم استرجاع الإصدار بنجاح');
      fetchDocument();
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل استرجاع الإصدار');
    }
  };

  const handleCopyShareLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      toast.success('تم نسخ رابط الوثيقة إلى الحافظة');
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleDownloadAllAttachments = async () => {
    if (!document?.attachments || document.attachments.length === 0) return;
    toast.success(`جاري تنزيل ${document.attachments.length} ملفات...`);
    for (const att of document.attachments) {
      await handleDownloadAttachment(att.id, att.original_name || att.file_name);
      await new Promise(r => setTimeout(r, 350));
    }
  };

  const handleOpenNewVersionModal = () => {
    const nextVer = `v1.${((document?.versions?.length || 0) + 1)}`;
    setVersionNumber(nextVer);
    setVersionSummary('');
    setVersionFile(null);
    setVersionModalOpen(true);
  };

  const handleCreateVersion = async (e) => {
    e.preventDefault();
    if (!versionNumber.trim()) {
      toast.error('يرجى تحديد رقم الإصدار');
      return;
    }
    if (!versionSummary.trim()) {
      toast.error('يرجى كتابة ملخص التعديلات والتغييرات');
      return;
    }

    const formData = new FormData();
    formData.append('version_number', versionNumber.trim());
    formData.append('change_summary', versionSummary.trim());
    if (versionFile) {
      formData.append('file', versionFile);
    }

    setVersionSubmitting(true);
    try {
      const res = await versionsAPI.create(id, formData);
      toast.success(res.data?.message || 'تم تسجيل الإصدار الجديد بنجاح');
      setVersionModalOpen(false);
      fetchDocument();
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل تسجيل الإصدار الجديد');
    } finally {
      setVersionSubmitting(false);
    }
  };

  const handleDownloadVersion = async (ver) => {
    if (!ver.file_path) {
      toast.error('هذا الإصدار لا يحتوي على ملف مرفق (تعديل بيانات فقط)');
      return;
    }
    try {
      const res = await versionsAPI.download(id, ver.id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = window.document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${document.document_number}_${ver.version_number}_${ver.original_name || ver.file_name || 'document.pdf'}`);
      window.document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error('فشل تحميل ملف الإصدار');
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

  // Multi-level chain awareness: only the designated approver (or a super admin)
  // may act once approval steps exist, to avoid bypassing the workflow.
  const pendingApprovalSteps = (document.approvals || []).filter(a => a.status === 'pending');
  const hasPendingApprovalChain = pendingApprovalSteps.length > 0;
  const isMyPendingApproval = pendingApprovalSteps.some(a => a.approver_id === user?.id);
  const canDecideApproval = Boolean(user?.is_super_admin || !hasPendingApprovalChain || isMyPendingApproval);

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
            {/* Primary Document Preview Button */}
            <button
              id="document-preview-btn"
              onClick={handleOpenPrimaryPreview}
              className="flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-blue-500/25 transition cursor-pointer"
              title="معاينة واستعراض محتوى الوثيقة والمرفقات"
            >
              <Eye className="w-4 h-4" />
              <span>استعراض الوثيقة</span>
            </button>
            {statusName === 'pending_approval' && (
              <>
                {canDecideApproval && (user?.is_super_admin || hasPermission('documents.approve')) && (
                  <>
                    <button
                      onClick={() => setApprovalModal({ open: true, type: 'approve' })}
                      className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-emerald-600/20 transition cursor-pointer"
                    >
                      <CheckCircle className="w-4 h-4" />
                      اعتماد
                    </button>
                    <button
                      onClick={() => setDigitalSignatureModalOpen(true)}
                      className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-blue-600/20 transition cursor-pointer"
                      title="اعتماد وتوثيق الوثيقة بختم أو توقيع إلكتروني رسمي"
                    >
                      <Stamp className="w-4 h-4" />
                      اعتماد بختم / توقيع رقمي
                    </button>
                  </>
                )}
                {canDecideApproval && (user?.is_super_admin || hasPermission('documents.reject')) && (
                  <button
                    onClick={() => setApprovalModal({ open: true, type: 'reject' })}
                    className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 text-xs sm:text-sm font-semibold transition cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" />
                    رفض
                  </button>
                )}
              </>
            )}

            {statusName !== 'archived' ? (
              (user?.is_super_admin || hasPermission('documents.archive')) && (
                <button
                  onClick={handleArchive}
                  className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs sm:text-sm font-medium transition cursor-pointer"
                >
                  <Archive className="w-4 h-4 text-amber-400" />
                  أرشفة
                </button>
              )
            ) : (
              (user?.is_super_admin || hasPermission('documents.restore')) && (
                <button
                  onClick={handleRestore}
                  className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs sm:text-sm font-medium transition cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 text-emerald-400" />
                  استعادة
                </button>
              )
            )}

            {(user?.is_super_admin || hasPermission('records.legal_hold')) && (
              <button
                onClick={() => {
                  setLegalHoldReason('');
                  setLegalHoldModalOpen(true);
                }}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 rounded-xl border text-xs sm:text-sm font-medium transition cursor-pointer ${
                  document.legal_hold
                    ? 'bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border-rose-500/30'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
                title={document.legal_hold ? 'رفع الحجز القانوني عن الوثيقة' : 'فرض حجز قانوني يمنع الحذف'}
              >
                <Shield className={`w-4 h-4 ${document.legal_hold ? 'text-rose-400' : 'text-amber-400'}`} />
                {document.legal_hold ? 'رفع الحجز' : 'حجز قانوني'}
              </button>
            )}

            {(user?.is_super_admin || hasPermission('documents.update')) && (
              <button
                onClick={() => {
                  setEditForm({
                    title: document.title || '',
                    description: document.description || '',
                    notes: document.notes || '',
                  });
                  setEditModalOpen(true);
                }}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs sm:text-sm font-medium transition cursor-pointer"
                title="تعديل بيانات الوثيقة"
              >
                <Edit3 className="w-4 h-4 text-blue-400" />
                تعديل
              </button>
            )}

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

            <button
              onClick={handleCopyShareLink}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs sm:text-sm font-medium transition cursor-pointer"
              title="نسخ ومشاركة رابط الوثيقة"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 text-blue-400" />}
              <span className="hidden sm:inline">مشاركة</span>
            </button>
          </div>
        </div>

        {document.legal_hold && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-rose-500/40 bg-rose-950/30 backdrop-blur-md">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30 shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-rose-300">وثيقة خاضعة للحجز القانوني (Legal Hold)</h3>
                <p className="text-xs text-rose-200/80 mt-0.5 leading-relaxed">
                  {document.legal_hold_reason || 'تم فرض حجز قانوني على هذه الوثيقة.'}
                </p>
                <p className="text-[11px] text-rose-300/60 mt-1 font-mono" style={{ direction: 'ltr' }}>
                  {document.legal_hold_by?.name ? `By: ${document.legal_hold_by.name} — ` : ''}
                  {document.legal_hold_at ? new Date(document.legal_hold_at).toLocaleString('en-US') : ''}
                </p>
              </div>
            </div>
            {(user?.is_super_admin || hasPermission('records.legal_hold')) && (
              <button
                type="button"
                onClick={() => {
                  setLegalHoldReason('');
                  setLegalHoldModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition shrink-0 cursor-pointer"
              >
                رفع الحجز القانوني
              </button>
            )}
          </div>
        )}

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
            onClick={() => setActiveTab('versions')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition shrink-0 whitespace-nowrap ${
              activeTab === 'versions'
                ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <GitBranch className="w-4 h-4 text-cyan-400" />
            سجل الإصدارات ({document.versions?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('approvals')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition shrink-0 whitespace-nowrap ${
              activeTab === 'approvals'
                ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCheck className="w-4 h-4 text-emerald-400" />
            مسار الاعتماد ({document.approvals?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('comments')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition shrink-0 whitespace-nowrap ${
              activeTab === 'comments'
                ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-amber-400" />
            الملاحظات والتعليقات ({document.comments?.length || 0})
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
            {/* ── Workflow Lifecycle Stepper ── */}
            <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-5 sm:p-6 backdrop-blur-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <GitBranch className="w-5 h-5 text-blue-400" />
                  مسار دورة حياة الوثيقة والاعتماد
                </h3>
                <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${statusColors[statusName] || statusColors.draft}`}>
                  {statusLabel}
                </span>
              </div>

              {/* Visual Stepper */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                {[
                  {
                    key: 'draft',
                    label: 'إنشاء الوثيقة',
                    sub: 'تسجيل مسودة مبدئية',
                    done: true,
                    active: statusName === 'draft',
                  },
                  {
                    key: 'pending',
                    label: 'المراجعة والتدقيق',
                    sub: 'تحت تدقيق المسؤول',
                    done: ['pending_approval', 'approved', 'archived'].includes(statusName),
                    active: statusName === 'pending_approval',
                  },
                  {
                    key: 'approval',
                    label: statusName === 'rejected' ? 'مرفوضة إدارياً' : 'الاعتماد النهائي',
                    sub: statusName === 'rejected' ? 'تم رفض الاعتماد' : 'إجازة وتوقيع رسمي',
                    done: ['approved', 'archived', 'rejected'].includes(statusName),
                    active: ['approved', 'rejected'].includes(statusName),
                    rejected: statusName === 'rejected',
                  },
                  {
                    key: 'archived',
                    label: 'الحفظ والأرشفة',
                    sub: 'أرشفة دائمة مشفرة',
                    done: statusName === 'archived',
                    active: statusName === 'archived',
                  },
                ].map((step, idx) => (
                  <div
                    key={step.key}
                    className={`p-3 rounded-xl border text-center transition ${
                      step.rejected
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                        : step.active
                        ? 'bg-blue-500/15 border-blue-500/40 text-blue-300 shadow-sm'
                        : step.done
                        ? 'bg-slate-950/40 border-emerald-500/30 text-emerald-400'
                        : 'bg-slate-950/20 border-slate-800/60 text-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      <span className="w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center font-mono bg-white/10">
                        {step.done ? '✓' : idx + 1}
                      </span>
                      <span className="text-xs font-bold">{step.label}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block truncate">{step.sub}</span>
                  </div>
                ))}
              </div>

              {/* Approvals History if any */}
              {document.approvals && document.approvals.length > 0 && (
                <div className="mt-5 pt-4 border-t border-slate-800">
                  <h4 className="text-xs font-bold text-slate-300 mb-2">سجل قرارات وملاحظات الاعتماد:</h4>
                  <div className="divide-y divide-slate-800/80 rounded-xl border border-slate-800 overflow-hidden text-xs">
                    {document.approvals.map((app) => (
                      <div key={app.id} className="p-3 bg-slate-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                            app.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                            app.status === 'rejected' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                            'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}>
                            {app.status === 'approved' ? 'معتمد' : app.status === 'rejected' ? 'مرفوض' : 'قيد النظر'}
                          </span>
                          <span className="font-semibold text-white">{app.approver?.name || 'المعتمد'}</span>
                          {app.workflow_step && <span className="text-slate-400 font-mono">({app.workflow_step.name})</span>}
                        </div>
                        <div className="flex items-center gap-3 text-slate-400">
                          {app.comments && <span className="text-slate-300 italic">"{app.comments}"</span>}
                          <span className="font-mono text-[11px]" style={{ direction: 'ltr' }}>
                            {app.approved_at ? new Date(app.approved_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : ''}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-6 backdrop-blur-md">
              <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-blue-400" />
                تفاصيل المحتوى والموضوع
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line bg-slate-950/40 p-4 rounded-xl border border-slate-800/80 min-h-[100px]">
                {document.description || 'لا يوجد وصف تفصيلي مسجل لهذه الوثيقة.'}
              </p>

              {/* Dynamic Metadata Fields if any */}
              {document.metadata_values && typeof document.metadata_values === 'object' && !Array.isArray(document.metadata_values) && Object.keys(document.metadata_values).length > 0 && (
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

              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400 flex items-center gap-2">
                  <CalendarClock className="w-4 h-4 text-amber-400" />
                  انتهاء الاحتفاظ
                </span>
                <span className="font-mono text-slate-200" style={{ direction: 'ltr' }}>
                  {document.retention_until
                    ? document.retention_until
                    : document.retention_years === 99 ? 'احتفاظ دائم' : '—'}
                </span>
              </div>

              {document.disposition_status === 'disposed' && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400 flex items-center gap-2">
                    <ArchiveX className="w-4 h-4 text-rose-400" />
                    حالة الاستبعاد
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-300 border border-rose-500/25">
                    مستبعدة
                  </span>
                </div>
              )}

              {document.original_number && (
                <div className="flex items-center justify-between text-sm pt-3 border-t border-slate-800">
                  <span className="text-slate-400 flex items-center gap-2">
                    <Hash className="w-4 h-4 text-blue-400" />
                    رقم القيد الأصلي
                  </span>
                  <span className="font-mono font-bold text-slate-200">{document.original_number}</span>
                </div>
              )}

              {/* Tags & Keywords */}
              {document.tags && document.tags.length > 0 && (
                <div className="pt-3 border-t border-slate-800">
                  <span className="text-xs text-slate-400 block mb-2 font-medium">الوسوم والكلمات الدلالية:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {document.tags.map((tag) => (
                      <span key={tag.id} className="text-[11px] px-2.5 py-0.5 rounded-lg bg-blue-500/10 text-blue-300 border border-blue-500/20">
                        #{tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
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
          {(user?.is_super_admin || hasPermission('attachments.upload')) && (
            <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-6 backdrop-blur-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Upload className="w-5 h-5 text-blue-400" />
                  إرفاق ملف جديد للوثيقة
                </h3>
                <button
                  type="button"
                  onClick={() => setScannerModalOpen(true)}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 text-xs font-bold transition shadow-sm cursor-pointer"
                  title="التقاط المستند مباشرة عبر كاميرا الهاتف أو الجهاز"
                >
                  <Camera className="w-4 h-4" />
                  مسح ضوئي بالكاميرا
                </button>
              </div>
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
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition shadow-lg shadow-blue-600/20 disabled:opacity-50 shrink-0 cursor-pointer"
                >
                  {isUploading ? 'جاري الرفع...' : 'رفع المرفق'}
                </button>
              </form>
            </div>
          )}

          {/* List of Attachments */}
          <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden backdrop-blur-md">
            <div className="p-4 border-b border-slate-800 font-bold text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span>المرفقات الحالية</span>
                <span className="text-xs font-mono text-slate-400">الإجمالي: {document.attachments?.length || 0}</span>
              </div>
              {document.attachments && document.attachments.length > 1 && (
                <button
                  type="button"
                  onClick={handleDownloadAllAttachments}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 text-xs font-semibold transition cursor-pointer"
                  title="تحميل جميع الملفات المرفقة دفعة واحدة"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تحميل كافة المرفقات</span>
                </button>
              )}
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
                        <p className="text-sm font-semibold text-slate-200">{att.original_name || att.file_name || 'ملف مرفق'}</p>
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
                        onClick={() => handlePreviewAttachment(att)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/15 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 text-xs font-semibold transition cursor-pointer"
                        title="معاينة واستعراض الملف"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>استعراض</span>
                      </button>

                      <button
                        onClick={() => handleOpenOcrModal(att)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 border border-emerald-500/25 text-xs font-semibold transition cursor-pointer"
                        title="استعراض النص المفهرس وفحص OCR"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>نص OCR</span>
                      </button>

                      {(user?.is_super_admin || hasPermission('attachments.download')) && (
                        <button
                          onClick={() => handleDownloadAttachment(att.id, att.original_name || att.file_name)}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                          title="تحميل الملف"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      )}
                      {(user?.is_super_admin || hasPermission('attachments.delete')) && (
                        <button
                          onClick={() => handleDeleteAttachment(att.id)}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white transition cursor-pointer"
                          title="حذف الملف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: MULTI-LEVEL APPROVAL WORKFLOW ───────────────────────── */}
      {activeTab === 'approvals' && (
        <div className="space-y-6">
          <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-5 sm:p-6 backdrop-blur-md">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-emerald-400" />
                  سلسلة ومسار الاعتماد متعدد المستويات (Multi-level Approval Workflow)
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  إدارة مراحل المراجعة والاعتماد الرسمية، تتبع قرارات المسؤولين، وتوثيق التوقيعات الرقمية وفق السياسات التنظيمية.
                </p>
              </div>

              {(user?.is_super_admin || hasPermission('workflows.submit')) && (
                <button
                  type="button"
                  onClick={handleOpenRequestApprovalModal}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 transition shadow-lg shadow-emerald-600/20 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  إحالة إلى مدير القسم
                </button>
              )}
            </div>

            {/* Workflow Quick Metrics */}
            {document.approvals && document.approvals.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 text-right">
                  <span className="text-[11px] text-slate-400 font-medium">إجمالي المراحل</span>
                  <div className="text-lg font-bold text-white mt-1">{document.approvals.length}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 text-right">
                  <span className="text-[11px] text-emerald-400 font-medium">المراحل المعتمدة</span>
                  <div className="text-lg font-bold text-emerald-400 mt-1">
                    {document.approvals.filter(a => a.status === 'approved').length}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 text-right">
                  <span className="text-[11px] text-amber-400 font-medium">قيد المراجعة</span>
                  <div className="text-lg font-bold text-amber-400 mt-1">
                    {document.approvals.filter(a => a.status === 'pending').length}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 text-right">
                  <span className="text-[11px] text-rose-400 font-medium">المرفوضة</span>
                  <div className="text-lg font-bold text-rose-400 mt-1">
                    {document.approvals.filter(a => a.status === 'rejected').length}
                  </div>
                </div>
              </div>
            )}

            {/* Approvals Stepper / Timeline */}
            {document.approvals && document.approvals.length > 0 ? (
              <div className="relative pr-6 border-r-2 border-slate-800 space-y-6 mr-3">
                {document.approvals.map((approval, idx) => {
                  const isPending = approval.status === 'pending';
                  const isApproved = approval.status === 'approved';
                  const isRejected = approval.status === 'rejected';

                  const canApproveStep = isPending && (
                    user?.is_super_admin ||
                    (user?.id === approval.approver_id && hasPermission('workflows.approve'))
                  );
                  const canRejectStep = isPending && (
                    user?.is_super_admin ||
                    (user?.id === approval.approver_id && hasPermission('workflows.reject'))
                  );
                  const canDecide = canApproveStep || canRejectStep;

                  return (
                    <div key={approval.id} className="relative">
                      {/* Timeline Dot */}
                      <span
                        className={`absolute -right-[31px] top-3 w-4 h-4 rounded-full ring-4 ring-slate-900 ${
                          isApproved ? 'bg-emerald-400 shadow-md shadow-emerald-400/50' :
                          isRejected ? 'bg-rose-400 shadow-md shadow-rose-400/50' :
                          'bg-amber-400 shadow-md shadow-amber-400/50 animate-pulse'
                        }`}
                      />

                      <div className={`rounded-2xl border p-5 transition-all ${
                        isPending
                          ? 'bg-slate-950/70 border-amber-500/30 shadow-lg shadow-amber-500/5'
                          : isApproved
                          ? 'bg-slate-950/50 border-emerald-500/30 shadow-sm'
                          : 'bg-slate-950/50 border-rose-500/30'
                      }`}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
                              المرحلة {idx + 1}
                            </span>

                            {isApproved && (
                              <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                                <CheckCircle className="w-3.5 h-3.5" />
                                تم الاعتماد رسمياً
                              </span>
                            )}

                            {isPending && (
                              <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" />
                                بانتظار المراجعة والقرار
                              </span>
                            )}

                            {isRejected && (
                              <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1.5">
                                <XCircle className="w-3.5 h-3.5" />
                                تم رفض الوثيقة
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-slate-400 font-mono" style={{ direction: 'ltr' }}>
                            {approval.approved_at
                              ? new Date(approval.approved_at).toLocaleString('ar-SA', { dateStyle: 'medium', timeStyle: 'short' })
                              : approval.created_at
                              ? `طلب في: ${new Date(approval.created_at).toLocaleString('ar-SA', { dateStyle: 'medium', timeStyle: 'short' })}`
                              : '—'}
                          </div>
                        </div>

                        {/* Approver Details */}
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 mb-3">
                          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center shrink-0 border border-emerald-500/30 text-sm">
                            {approval.approver?.name?.[0] || 'م'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-bold text-white truncate">
                                {approval.approver?.name || 'مسؤول الاعتماد'}
                              </h4>
                              {approval.approver?.employee_number && (
                                <span className="text-[11px] font-mono text-slate-400">
                                  #{approval.approver.employee_number}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 truncate mt-0.5">
                              {approval.approver?.email}
                            </p>
                          </div>
                        </div>

                        {/* Approval Comments or Instructions */}
                        {approval.comments && (
                          <div className="p-3 rounded-xl bg-slate-900/40 border border-white/5 text-xs text-slate-300 leading-relaxed mb-3">
                            <span className="text-slate-400 block mb-1 font-semibold text-[11px]">
                              {isApproved ? 'بيان وملاحظات الاعتماد:' : isRejected ? 'سبب الرفض:' : 'تعليمات الإحالة:'}
                            </span>
                            {approval.comments}
                          </div>
                        )}

                        {/* Approver Action Buttons */}
                        {canDecide && (
                          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800/80">
                            {canRejectStep && (
                              <button
                                type="button"
                                onClick={() => handleOpenStepDecision(approval, 'rejected')}
                                className="px-3.5 py-1.5 rounded-xl bg-rose-600/15 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                رفض المرحلة
                              </button>
                            )}

                            {canApproveStep && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDigitalSignatureModalOpen(true);
                                  }}
                                  className="px-3.5 py-1.5 rounded-xl bg-cyan-600/15 hover:bg-cyan-600 text-cyan-300 hover:text-white border border-cyan-500/30 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
                                  title="اعتماد رسمي بالختم والتوقيع الإلكتروني"
                                >
                                  <Stamp className="w-3.5 h-3.5" />
                                  ختم وتوقيع إلكتروني
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleOpenStepDecision(approval, 'approved')}
                                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 transition cursor-pointer flex items-center gap-1.5"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  اعتماد هذه المرحلة
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400 space-y-3">
                <FileCheck className="w-12 h-12 text-slate-600 mx-auto" />
                <h4 className="text-sm font-bold text-slate-300">لم يتم تحديد مسار اعتماد مخصص بعد</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  عند الإحالة تُوجَّه الوثيقة تلقائياً إلى مدير القسم لاعتمادها، مع إمكانية اختيار معتمد آخر يدوياً عند الحاجة.
                </p>
                {(user?.is_super_admin || hasPermission('workflows.submit')) && (
                  <button
                    type="button"
                    onClick={handleOpenRequestApprovalModal}
                    className="btn btn-secondary btn-sm mt-2"
                  >
                    + إحالة الوثيقة للاعتماد
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: VERSIONS MANAGEMENT & RELEASE TIMELINE ───────────── */}
      {activeTab === 'versions' && (
        <div className="space-y-6">
          <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-5 sm:p-6 backdrop-blur-md">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <GitBranch className="w-5 h-5 text-cyan-400" />
                  سجل الإصدارات والتعديلات التوثيقية (Document Versioning)
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  تتبع دورة تحديث الوثيقة، الفروقات، مراجعة النسخ السابقة، وتحميل المستندات المؤرشفة تاريخياً.
                </p>
              </div>

              {(user?.is_super_admin || hasPermission('versions.create')) && (
                <button
                  type="button"
                  onClick={handleOpenNewVersionModal}
                  className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-2 transition shadow-lg shadow-cyan-600/20 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  تسجيل إصدار جديد (New Release)
                </button>
              )}
            </div>

            {/* Versions Timeline List */}
            {document.versions && document.versions.length > 0 ? (
              <div className="relative pr-6 border-r-2 border-slate-800 space-y-6 mr-3">
                {document.versions.map((ver, idx) => {
                  const isLatest = idx === 0;
                  return (
                    <div key={ver.id} className="relative">
                      {/* Timeline Dot */}
                      <span
                        className={`absolute -right-[31px] top-1.5 w-4 h-4 rounded-full ring-4 ring-slate-900 ${
                          isLatest ? 'bg-cyan-400 shadow-md shadow-cyan-400/50' : 'bg-slate-600'
                        }`}
                      />

                      <div className={`rounded-2xl border p-5 transition-all ${
                        isLatest
                          ? 'bg-slate-950/70 border-cyan-500/30 shadow-lg shadow-cyan-500/5'
                          : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700'
                      }`}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                              {ver.version_number}
                            </span>
                            {isLatest && (
                              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                                الإصدار الأحدث المعمول به
                              </span>
                            )}
                            <span className="text-sm font-bold text-white">
                              {ver.original_name || ver.file_name || 'تحديث بيانات إدارية'}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                            <span style={{ direction: 'ltr' }}>
                              {ver.created_at ? new Date(ver.created_at).toLocaleString('ar-SA', { dateStyle: 'medium', timeStyle: 'short' }) : '—'}
                            </span>
                          </div>
                        </div>

                        {/* Change Notes */}
                        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-white/5 text-xs text-slate-300 leading-relaxed mb-4">
                          <span className="text-slate-400 block mb-1 font-semibold text-[11px]">بيان التغييرات (Release Notes):</span>
                          {ver.change_summary}
                        </div>

                        {/* Meta and Download Action */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-white/5 text-xs text-slate-400">
                          <div className="flex items-center gap-4 flex-wrap text-[11px]">
                            <span>المُوثِّق: <strong className="text-slate-200">{ver.uploader?.name || 'النظام'}</strong></span>
                            {ver.file_size && (
                              <span>الحجم: <strong className="font-mono text-slate-300">{(ver.file_size / 1024).toFixed(1)} KB</strong></span>
                            )}
                            {ver.checksum && (
                              <span className="hidden md:inline font-mono text-[10px] bg-slate-900 px-2 py-0.5 rounded text-slate-400 border border-white/5" title={`SHA-256: ${ver.checksum}`}>
                                HASH: {ver.checksum.slice(0, 12)}...
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {!isLatest && (user?.is_super_admin || hasPermission('versions.revert')) && (
                              <button
                                type="button"
                                onClick={() => handleRevertVersion(ver)}
                                className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                استرجاع هذا الإصدار
                              </button>
                            )}
                            {ver.file_path && (
                              <button
                                type="button"
                                onClick={() => handleDownloadVersion(ver)}
                                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                              >
                                <Download className="w-3.5 h-3.5" />
                                تحميل هذا الإصدار
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400 space-y-3">
                <GitBranch className="w-12 h-12 text-slate-600 mx-auto" />
                <h4 className="text-sm font-bold text-slate-300">لا توجد إصدارات مسجلة بعد</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  هذه الوثيقة ما زالت تعمل بإصدارها الأصلي المعتمد الأول. يمكنك إنشاء إصدار جديد لتوثيق أي تحديثات أو مراجعات لاحقة.
                </p>
                {(user?.is_super_admin || hasPermission('versions.create')) && (
                  <button
                    type="button"
                    onClick={handleOpenNewVersionModal}
                    className="btn btn-secondary btn-sm mt-2"
                  >
                    + إنشاء أول إصدار مرقم
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: COMMENTS & ADMINISTRATIVE NOTES ──────────────────── */}
      {activeTab === 'comments' && (

        <div className="space-y-6">
          {/* Add Comment Box */}
          {(user?.is_super_admin || hasPermission('comments.create')) && (
            <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-6 backdrop-blur-md">
              <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-amber-400" />
                إضافة توجيه أو ملاحظة إدارية
              </h3>
              <form onSubmit={handleAddComment} className="space-y-3">
                <textarea
                  rows={3}
                  placeholder="اكتب توجيهاتك أو ملاحظاتك الإدارية حول هذه الوثيقة..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 resize-none transition"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submittingComment || !newComment.trim()}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition shadow-lg shadow-blue-600/20 disabled:opacity-50 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {submittingComment ? 'جاري الإرسال...' : 'إرسال الملاحظة'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Comments List */}
          <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden backdrop-blur-md">
            <div className="p-4 border-b border-slate-800 font-bold text-white flex items-center justify-between">
              <span>الملاحظات والتعليقات المسجلة</span>
              <span className="text-xs font-mono text-slate-400">الإجمالي: {document.comments?.length || 0}</span>
            </div>

            {(!document.comments || document.comments.length === 0) ? (
              <div className="p-12 text-center text-slate-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>لا توجد ملاحظات أو توجيهات إدارية مسجلة لهذه الوثيقة حتى الآن.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/80">
                {document.comments.map((comm) => (
                  <div key={comm.id} className="p-5 flex items-start gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      {comm.user?.name ? comm.user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">{comm.user?.name || 'مستخدم النظام'}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">ملاحظة داخلية</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400 font-mono" style={{ direction: 'ltr' }}>
                            {comm.created_at ? new Date(comm.created_at).toLocaleString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : ''}
                          </span>
                          {(user?.is_super_admin || hasPermission('comments.delete')) && (
                            <button
                              type="button"
                              onClick={() => handleDeleteComment(comm.id)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600/30 text-slate-400 hover:text-rose-300 border border-slate-700/60 transition cursor-pointer"
                              title="حذف الملاحظة"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
                        {comm.comment}
                      </p>
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
      {approvalModal.open && typeof window !== 'undefined' && window.document?.body && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md"
          style={{ direction: 'rtl', top: 0, left: 0, right: 0, bottom: 0, margin: 0 }}
          onClick={() => setApprovalModal({ open: false, type: 'approve' })}
        >
          <div
            className="bg-[#0c1427] border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl flex flex-col max-h-[88vh] overflow-hidden my-auto text-right"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 shrink-0 bg-[#0c1427]">
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
                className="w-full bg-[#070d1a] border border-slate-800 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-[#0c1427] shrink-0">
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
        window.document.body
      )}

      {/* ── EDIT DOCUMENT MODAL ──────────────────────────────────────── */}
      {editModalOpen && typeof window !== 'undefined' && window.document?.body && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md"
          style={{ direction: 'rtl', top: 0, left: 0, right: 0, bottom: 0, margin: 0 }}
          onClick={() => setEditModalOpen(false)}
        >
          <div
            className="bg-[#0c1427] border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[88vh] overflow-hidden my-auto text-right"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 shrink-0 bg-[#0c1427]">
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
                    className="w-full bg-[#070d1a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">الوصف والبيان</label>
                  <textarea
                    rows={3}
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full bg-[#070d1a] border border-slate-800 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">ملاحظات إضافية</label>
                  <input
                    type="text"
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    className="w-full bg-[#070d1a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-[#0c1427] shrink-0">
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
        window.document.body
      )}

      {/* ── CREATE NEW VERSION MODAL ─────────────────────────────────── */}
      {versionModalOpen && typeof window !== 'undefined' && window.document?.body && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md"
          style={{ direction: 'rtl' }}
          onClick={() => setVersionModalOpen(false)}
        >
          <div
            className="bg-[#0c1427] border border-cyan-500/30 rounded-3xl w-full max-w-lg shadow-2xl shadow-cyan-500/10 flex flex-col overflow-hidden text-right"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-[#080d19]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <GitBranch className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">تسجيل إصدار جديد للوثيقة</h3>
                  <p className="text-[11px] text-slate-400 font-mono">{document.document_number}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setVersionModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateVersion} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  رقم الإصدار الجديد *
                </label>
                <input
                  type="text"
                  required
                  value={versionNumber}
                  onChange={(e) => setVersionNumber(e.target.value)}
                  placeholder="مثال: v1.1 أو v2.0"
                  className="w-full bg-[#070d1a] border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                />
                <p className="text-[11px] text-slate-500 mt-1">يُوصى باستخدام صيغ الإصدارات المعيارية مثل v1.1 أو v2.0</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  بيان وملخص التغييرات والتحديثات *
                </label>
                <textarea
                  required
                  rows={3}
                  value={versionSummary}
                  onChange={(e) => setVersionSummary(e.target.value)}
                  placeholder="اكتب تفاصيل التحديث، سبب الإصدار، وأبرز ما تم تعديله..."
                  className="w-full bg-[#070d1a] border border-slate-800 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  ملف الوثيقة المحدث (اختياري / يُستحسن إرفاقه)
                </label>
                <div className="border border-dashed border-slate-700 hover:border-cyan-500/50 rounded-xl p-4 text-center bg-slate-900/40 transition">
                  <input
                    type="file"
                    id="version-file-input"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) setVersionFile(e.target.files[0]);
                    }}
                  />
                  {versionFile ? (
                    <div className="flex items-center justify-between gap-2 p-2 bg-slate-800/80 rounded-lg text-xs">
                      <span className="text-white truncate font-medium">{versionFile.name}</span>
                      <button
                        type="button"
                        onClick={() => setVersionFile(null)}
                        className="text-rose-400 hover:text-rose-300 text-xs shrink-0"
                      >
                        إزالة
                      </button>
                    </div>
                  ) : (
                    <label htmlFor="version-file-input" className="cursor-pointer block space-y-1">
                      <Upload className="w-6 h-6 text-cyan-400 mx-auto" />
                      <p className="text-xs text-slate-300 font-medium">اضغط لاختيار الملف الجديد لهذا الإصدار</p>
                      <p className="text-[10px] text-slate-500">يدعم PDF, Word, Excel, Images حتى 20MB</p>
                    </label>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setVersionModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={versionSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-600/20 disabled:opacity-50 cursor-pointer"
                >
                  {versionSubmitting ? 'جاري التوثيق...' : 'اعتماد وتسجيل الإصدار'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        window.document.body
      )}

      {/* ── REQUEST APPROVAL MODAL ───────────────────────────────────── */}
      {requestApprovalModalOpen && typeof window !== 'undefined' && window.document?.body && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md"
          style={{ direction: 'rtl' }}
          onClick={() => setRequestApprovalModalOpen(false)}
        >
          <div
            className="bg-[#0c1427] border border-emerald-500/30 rounded-3xl w-full max-w-lg shadow-2xl shadow-emerald-500/10 flex flex-col overflow-hidden text-right"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-[#080d19]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <FileCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">إحالة الوثيقة لمسار الاعتماد</h3>
                  <p className="text-[11px] text-slate-400 font-mono">{document.document_number}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRequestApprovalModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitApprovalRequest} className="p-6 space-y-4">
              <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    التوجيه التلقائي إلى مدير القسم
                  </span>
                  {approvalTarget?.document_department?.name_ar && (
                    <span className="text-[10px] text-slate-400">
                      قسم: {approvalTarget.document_department.name_ar}
                    </span>
                  )}
                </div>

                {approvalTargetLoading ? (
                  <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
                    <span className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    جاري تحديد مدير القسم...
                  </div>
                ) : approvalTarget?.manager ? (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/50 border border-slate-800">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center shrink-0 border border-emerald-500/30 text-sm">
                      {approvalTarget.manager.name?.[0] || 'م'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">
                        {approvalTarget.manager.name}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {approvalTarget.manager.department?.name_ar || 'مدير القسم'}
                        {approvalTarget.manager.email ? ` — ${approvalTarget.manager.email}` : ''}
                      </p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 shrink-0">
                      مدير القسم
                    </span>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 text-xs text-amber-300 leading-relaxed">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      لا يوجد مدير معيّن لهذا القسم أو لأي قسم أعلى منه. عيّنه من صفحة الأقسام، أو اختر المعتمد يدوياً أدناه.
                    </span>
                  </div>
                )}

                <label className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-400">
                  <input
                    type="checkbox"
                    checked={manualApprovalOverride}
                    onChange={(e) => handleToggleManualApproval(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-emerald-600 bg-slate-950 border-slate-700 focus:ring-0"
                  />
                  اختيار معتمد آخر يدوياً
                </label>
              </div>

              {manualApprovalOverride && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    المسؤول أو المدير المطلوب اعتماده *
                  </label>
                  <select
                    required
                    value={selectedApproverId}
                    onChange={(e) => setSelectedApproverId(e.target.value)}
                    className="w-full bg-[#070d1a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">-- اختر المستخدم / المعتمد --</option>
                    {availableUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} {u.department?.name ? `(${u.department.name})` : ''} - {u.email}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-500 mt-1">سيتم إرسال إشعار فوري وتنبيه للمستخدم المختار للمراجعة واتخاذ القرار.</p>
                </div>
              )}

              {!manualApprovalOverride && approvalTarget?.manager && (
                <p className="text-[11px] text-slate-500">
                  سيتم إشعار مدير القسم فوراً وستظهر الوثيقة في قائمة الاعتمادات المعلقة لديه.
                </p>
              )}

              {availableWorkflows.length > 0 && (
                <div className="space-y-3 p-3.5 rounded-xl bg-violet-500/5 border border-violet-500/20">
                  <div className="flex items-center gap-2">
                    <GitBranch className="w-3.5 h-3.5 text-violet-400" />
                    <span className="text-xs font-semibold text-slate-300">ربط الطلب بقالب سير عمل (اختياري)</span>
                  </div>

                  <select
                    value={selectedWorkflowId}
                    onChange={(e) => {
                      setSelectedWorkflowId(e.target.value);
                      setSelectedWorkflowStepId('');
                    }}
                    className="w-full bg-[#070d1a] border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-violet-500"
                  >
                    <option value="">بدون قالب (اعتماد مباشر)</option>
                    {availableWorkflows.map((w) => (
                      <option key={w.id} value={w.id}>{w.name_ar || w.name}</option>
                    ))}
                  </select>

                  {selectedWorkflow && (
                    <select
                      value={selectedWorkflowStepId}
                      onChange={(e) => setSelectedWorkflowStepId(e.target.value)}
                      className="w-full bg-[#070d1a] border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-violet-500"
                    >
                      <option value="">-- اختر المرحلة من القالب --</option>
                      {(selectedWorkflow.steps || []).map((step) => (
                        <option key={step.id} value={step.id}>
                          {step.step_order}. {step.name_ar || step.name}
                          {step.role?.display_name_ar ? ` — ${step.role.display_name_ar}` : ''}
                        </option>
                      ))}
                    </select>
                  )}

                  {selectedWorkflowStep && (
                    <div className="text-[11px] text-slate-400 space-y-1 leading-relaxed">
                      <p>
                        نوع الإجراء:{' '}
                        <strong className="text-violet-300">
                          {selectedWorkflowStep.action_type === 'review'
                            ? 'مراجعة'
                            : selectedWorkflowStep.action_type === 'acknowledge'
                              ? 'إطلاع'
                              : 'اعتماد'}
                        </strong>
                        {selectedWorkflowStep.role?.display_name_ar && (
                          <> — الدور المسؤول: <strong className="text-violet-300">{selectedWorkflowStep.role.display_name_ar}</strong></>
                        )}
                      </p>
                      {selectedWorkflowStep.instructions && (
                        <p className="text-slate-500">تعليمات المرحلة: {selectedWorkflowStep.instructions}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  ملاحظات أو توجيهات الإحالة (اختياري)
                </label>
                <textarea
                  rows={3}
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder="مثال: يرجى مراجعة بنود العقد والتوقيع للاعتماد النهائي..."
                  className="w-full bg-[#070d1a] border border-slate-800 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setRequestApprovalModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submittingApprovalRequest}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
                >
                  {submittingApprovalRequest ? 'جاري الإحالة...' : 'تأكيد وإرسال طلب الاعتماد'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        window.document.body
      )}

      {/* ── STEP DECISION MODAL (APPROVE / REJECT) ────────────────────── */}
      {stepDecisionModal.open && typeof window !== 'undefined' && window.document?.body && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md"
          style={{ direction: 'rtl' }}
          onClick={() => setStepDecisionModal(prev => ({ ...prev, open: false }))}
        >
          <div
            className={`bg-[#0c1427] border rounded-3xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden text-right ${
              stepDecisionModal.decision === 'approved'
                ? 'border-emerald-500/30 shadow-emerald-500/10'
                : 'border-rose-500/30 shadow-rose-500/10'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-[#080d19]">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  stepDecisionModal.decision === 'approved'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-rose-500/20 text-rose-400'
                }`}>
                  {stepDecisionModal.decision === 'approved' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {stepDecisionModal.decision === 'approved' ? 'تأكيد اعتماد هذه المرحلة' : 'تأكيد رفض المرحلة'}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">{document.document_number}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStepDecisionModal(prev => ({ ...prev, open: false }))}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitStepDecision} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {stepDecisionModal.decision === 'approved' ? 'ملاحظات الاعتماد (اختياري)' : 'سبب الرفض والملاحظات *'}
                </label>
                <textarea
                  required={stepDecisionModal.decision === 'rejected'}
                  rows={3}
                  value={stepDecisionModal.comments}
                  onChange={(e) => setStepDecisionModal(prev => ({ ...prev, comments: e.target.value }))}
                  placeholder={stepDecisionModal.decision === 'approved' ? 'معتمد وفق الأصول...' : 'يرجى ذكر سبب الرفض بالتفصيل...'}
                  className="w-full bg-[#070d1a] border border-slate-800 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setStepDecisionModal(prev => ({ ...prev, open: false }))}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submittingStepDecision}
                  className={`px-5 py-2.5 rounded-xl text-white text-xs font-semibold shadow-lg disabled:opacity-50 cursor-pointer ${
                    stepDecisionModal.decision === 'approved'
                      ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
                      : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
                  }`}
                >
                  {submittingStepDecision ? 'جاري الحفظ...' : stepDecisionModal.decision === 'approved' ? 'اعتماد رسمي' : 'تأكيد الرفض'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        window.document.body
      )}

      {/* ── INTERACTIVE DOCUMENT VIEWER MODAL ───────────────────────── */}

      {(() => {
        const isOfficeAttachment = activePreviewAttachment && (
          /\.(docx?|xlsx?|pptx?|zip|rar)$/i.test(activePreviewAttachment.file_name || activePreviewAttachment.original_name || '') ||
          (activePreviewAttachment.mime_type && (
            activePreviewAttachment.mime_type.includes('wordprocessingml') ||
            activePreviewAttachment.mime_type.includes('msword') ||
            activePreviewAttachment.mime_type.includes('spreadsheetml') ||
            activePreviewAttachment.mime_type.includes('excel') ||
            activePreviewAttachment.mime_type.includes('presentationml')
          ))
        );

        return previewModalOpen && typeof window !== 'undefined' && window.document?.body && createPortal(

        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-5 bg-slate-950/90 backdrop-blur-md animate-fade-in text-right"
          style={{ direction: 'rtl' }}
          onClick={handleClosePreview}
        >
          <div
            className="bg-[#0c1427] border border-slate-800 rounded-3xl w-full max-w-6xl h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Viewer Top Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-800 bg-[#080d19] shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                  <Eye className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      {document?.document_number}
                    </span>
                    <h3 className="font-bold text-white text-sm sm:text-base truncate">
                      {activePreviewAttachment ? (activePreviewAttachment.original_name || activePreviewAttachment.file_name) : document?.title}
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    {activePreviewAttachment
                      ? `حجم الملف: ${activePreviewAttachment.file_size ? `${(activePreviewAttachment.file_size / 1024).toFixed(1)} KB` : 'غير محدد'}`
                      : 'معاينة البطاقة الرقمية والبيانات الأرشيفية للوثيقة'}
                  </p>
                </div>
              </div>

              {/* Action Controls */}
              <div className="flex items-center gap-2">
                {/* Multi-attachment selector if more than 1 attachment */}
                {document?.attachments && document.attachments.length > 1 && (
                  <select
                    value={activePreviewAttachment?.id || ''}
                    onChange={(e) => {
                      const selected = document.attachments.find(a => String(a.id) === e.target.value);
                      if (selected) handlePreviewAttachment(selected);
                    }}
                    className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-blue-500"
                  >
                    {document.attachments.map((att, idx) => (
                      <option key={att.id} value={att.id}>
                        ملف {idx + 1}: {att.original_name || att.file_name}
                      </option>
                    ))}
                  </select>
                )}

                {/* Zoom / Rotate Controls (for images) */}
                {activePreviewAttachment && (activePreviewAttachment.mime_type?.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg)$/i.test(activePreviewAttachment.file_name || activePreviewAttachment.original_name || '')) && (
                  <div className="hidden sm:flex items-center bg-slate-800/80 border border-slate-700 rounded-xl p-0.5">
                    <button
                      type="button"
                      onClick={() => setPreviewZoom(z => Math.max(0.4, z - 0.2))}
                      className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition"
                      title="تصغير"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <span className="text-[11px] font-mono px-2 text-slate-300 font-semibold">
                      {Math.round(previewZoom * 100)}%
                    </span>
                    <button
                      type="button"
                      onClick={() => setPreviewZoom(z => Math.min(3, z + 0.2))}
                      className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition"
                      title="تكبير"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewRotation(r => (r + 90) % 360)}
                      className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition border-r border-slate-700/80"
                      title="تدوير 90 درجة"
                    >
                      <RotateCw className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Watermark Toggle */}
                <button
                  type="button"
                  onClick={() => setWatermarkActive(v => !v)}
                  className={`p-2 rounded-xl transition flex items-center gap-1.5 text-xs font-semibold ${
                    watermarkActive
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-sm'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700'
                  }`}
                  title="تفعيل / إخفاء العلامة المائية الأمنية لمنع التسريب"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span className="hidden sm:inline">علامة مائية أمنية</span>
                </button>

                {/* Direct Download of active attachment */}
                {activePreviewAttachment && (
                  <button
                    type="button"
                    onClick={() => handleDownloadAttachment(activePreviewAttachment.id, activePreviewAttachment.original_name || activePreviewAttachment.file_name)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
                    title="تحميل الملف"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                )}

                {/* Open in New Window if blob exists */}
                {previewBlobUrl && (
                  <button
                    type="button"
                    onClick={() => window.open(previewBlobUrl, '_blank')}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
                    title="فتح في نافذة مستقلة"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                )}

                {/* Close Button */}
                <button
                  type="button"
                  onClick={handleClosePreview}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition flex items-center justify-center cursor-pointer mr-1"
                  title="إغلاق المعاينة"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Viewer Stage / Canvas */}
            <div className="flex-1 overflow-hidden relative flex items-center justify-center bg-[#060a14] p-3 sm:p-5">
              {/* Security Watermark Overlay */}
              <WatermarkOverlay
                userName={user?.name}
                documentNumber={document?.document_number}
                confidentialityLevel={confLabel}
                isActive={watermarkActive}
              />
              {previewLoading ? (
                <div className="flex flex-col items-center justify-center p-12 text-slate-400">
                  <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
                  <p className="text-sm font-semibold text-white">جاري تحميل وتجهيز الملف للاستعراض...</p>
                  <p className="text-xs text-slate-500 mt-1 font-mono">Streaming file content securely...</p>
                </div>
              ) : previewError ? (
                <div className="bg-slate-900 border border-rose-500/30 p-8 rounded-2xl max-w-md text-center">
                  <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto mb-3">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-white mb-2">تنبيه المعاينة المباشرة</h4>
                  <p className="text-xs text-slate-300 mb-5 leading-relaxed">{previewError}</p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                    {activePreviewAttachment && (
                      <button
                        type="button"
                        onClick={() => handleDownloadAttachment(activePreviewAttachment.id, activePreviewAttachment.original_name || activePreviewAttachment.file_name)}
                        className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold inline-flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        تحميل الملف للاطلاع عليه محلياً
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => { setActivePreviewAttachment(null); setPreviewError(null); }}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 cursor-pointer"
                    >
                      عرض البطاقة الرقمية
                    </button>
                  </div>
                </div>
              ) : isOfficeAttachment ? (
                /* Word / Excel / Archive files */
                <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-lg text-center shadow-2xl">
                  <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8" />
                  </div>
                  <h4 className="text-base font-bold text-white mb-1.5">{activePreviewAttachment.original_name || activePreviewAttachment.file_name}</h4>
                  <p className="text-xs text-slate-400 mb-6">
                    هذا الملف من نوع المستندات المكتبية. يمكنك تحميله وتشغيله مباشرة عبر التطبيقات المكتبية المعتمدة (Microsoft Office / LibreOffice).
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDownloadAttachment(activePreviewAttachment.id, activePreviewAttachment.file_name || activePreviewAttachment.original_name)}
                      className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold inline-flex items-center gap-2 shadow-lg shadow-blue-600/25 cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      تنزيل وفتح الملف
                    </button>
                    <button
                      type="button"
                      onClick={() => { setActivePreviewAttachment(null); setPreviewError(null); }}
                      className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 cursor-pointer"
                    >
                      عرض البطاقة الرقمية
                    </button>
                  </div>
                </div>
              ) : activePreviewAttachment && previewBlobUrl ? (
                /* PDF File */
                (activePreviewAttachment.mime_type?.includes('pdf') || (activePreviewAttachment.file_name || activePreviewAttachment.original_name || '').toLowerCase().endsWith('.pdf')) ? (
                  <iframe
                    src={previewBlobUrl}
                    className="w-full h-full rounded-2xl border border-slate-800 bg-white shadow-2xl"
                    title="معاينة ملف PDF"
                  />
                ) : /* Image File */
                (activePreviewAttachment.mime_type?.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg)$/i.test(activePreviewAttachment.file_name || activePreviewAttachment.original_name || '')) ? (
                  <div className="w-full h-full flex items-center justify-center overflow-auto p-4">
                    <img
                      src={previewBlobUrl}
                      alt={activePreviewAttachment.file_name || activePreviewAttachment.original_name || 'preview'}
                      style={{
                        transform: `scale(${previewZoom}) rotate(${previewRotation}deg)`,
                        transition: 'transform 0.15s ease-out',
                      }}
                      className="max-h-[75vh] max-w-full object-contain shadow-2xl rounded-xl border border-white/10"
                    />
                  </div>
                ) : (
                  /* Text / Code / CSV */
                  <iframe
                    src={previewBlobUrl}
                    className="w-full h-full rounded-2xl border border-slate-800 bg-slate-900 text-slate-100 p-4 font-mono text-xs shadow-2xl"
                    title="معاينة النص"
                  />
                )
              ) : (
                /* Document Digital Card View (When no attachments) */
                <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 overflow-y-auto max-h-[80vh] shadow-2xl text-right">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
                    <div>
                      <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        {document?.document_number}
                      </span>
                      <h3 className="text-lg font-bold text-white mt-2">{document?.title}</h3>
                    </div>
                    <div className="text-left">
                      <span className="text-xs text-slate-400 block font-mono">{document?.document_date || '—'}</span>
                      <span className="text-xs font-semibold text-emerald-400 block mt-1">{statusLabel}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-950/60 border border-slate-800 mb-6 text-xs">
                    <div>
                      <span className="text-slate-400 block mb-1">التصنيف:</span>
                      <span className="text-white font-semibold">{categoryName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-1">القسم / الإدارة:</span>
                      <span className="text-white font-semibold">{deptName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-1">مستوى السرية:</span>
                      <span className="text-rose-400 font-semibold">{confLabel}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-1">المُنشئ:</span>
                      <span className="text-white font-semibold">{document?.creator?.name || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-1">موقع الحفظ الميداني:</span>
                      <span className="text-white font-semibold">{document?.physical_location || 'المستودع الرئيسي'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-1">المرفقات المسجلة:</span>
                      <span className="text-slate-400">{document?.attachments?.length || 0} مرفق</span>
                    </div>
                  </div>

                  <div className="mb-6">
                    <span className="text-xs font-semibold text-slate-300 block mb-2">بيان الموضوع والوصف:</span>
                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-4 rounded-xl border border-slate-800/80 whitespace-pre-line">
                      {document?.description || 'لا يوجد وصف تفصيلي مسجل.'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs">
                    <div className="text-slate-400 flex items-center gap-2">
                      <QrCode className="w-5 h-5 text-blue-400" />
                      <span>فحص رقمي معتمد لنظام IT-EDMS</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => { handleClosePreview(); setActiveTab('attachments'); }}
                      className="px-4 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 transition font-medium"
                    >
                      إرفاق ملفات لهذه الوثيقة
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>,
        window.document.body
      );
    })()}

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

      {/* ── OCR EXTRACTED TEXT MODAL ─────────────────────────────────── */}
      {ocrModal.open && typeof window !== 'undefined' && window.document?.body && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-fade-in text-right"
          style={{ direction: 'rtl' }}
          onClick={() => setOcrModal({ ...ocrModal, open: false })}
        >
          <div
            className="bg-[#0c1427] border border-slate-800 rounded-3xl w-full max-w-3xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#080d19] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    النص المفهرس والتعرف الضوئي (OCR / Full-Text)
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5 truncate max-w-md">
                    {ocrModal.attachment?.original_name || ocrModal.attachment?.file_name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOcrModal({ ...ocrModal, open: false })}
                className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Search within OCR text toolbar */}
            <div className="p-4 border-b border-slate-800/80 bg-slate-900/40 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="بحث سريع داخل النص المستخرج..."
                  value={ocrModal.search}
                  onChange={(e) => setOcrModal({ ...ocrModal, search: e.target.value })}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pr-9 pl-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                <span>الكلمات: <strong className="text-slate-200">{ocrModal.text ? ocrModal.text.trim().split(/\s+/).length : 0}</strong></span>
                <span>•</span>
                <span>الحروف: <strong className="text-slate-200">{ocrModal.text ? ocrModal.text.length : 0}</strong></span>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {ocrModal.loading ? (
                <div className="flex flex-col items-center justify-center py-16 space-y-3">
                  <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
                  <p className="text-xs text-slate-400">جاري فحص وقراءة النص المفهرس...</p>
                </div>
              ) : !ocrModal.text ? (
                <div className="p-12 text-center text-slate-500 bg-slate-950/40 rounded-2xl border border-dashed border-slate-800 space-y-3">
                  <Sparkles className="w-10 h-10 mx-auto text-slate-600" />
                  <p className="text-sm font-semibold text-slate-400">لم يتم استخراج نص بعد من هذا المرفق</p>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    إذا كان هذا الملف عبارة عن مستند مسح ضوئي أو صورة أو ملف PDF، يمكنك الضغط على زر "إعادة الاستخراج وفحص OCR" أدناه.
                  </p>
                </div>
              ) : (
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 overflow-x-auto text-xs font-mono text-slate-200 whitespace-pre-wrap leading-relaxed max-h-[50vh] select-text">
                  {ocrModal.text}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-[#080d19] shrink-0">
              <button
                type="button"
                onClick={() => handleTriggerOcr(ocrModal.attachment?.id)}
                disabled={ocrModal.processing}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition border border-slate-700 disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${ocrModal.processing ? 'animate-spin text-emerald-400' : ''}`} />
                <span>{ocrModal.processing ? 'جاري الفحص...' : 'إعادة الاستخراج / فحص OCR'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!ocrModal.text}
                  onClick={() => {
                    navigator.clipboard.writeText(ocrModal.text);
                    toast.success('تم نسخ النص المستخرج إلى الحافظة');
                  }}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition shadow-lg shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>نسخ النص الكامل</span>
                </button>
              </div>
            </div>
          </div>
        </div>,
        window.document.body
      )}
      {/* ── Legal Hold Modal ── */}
      {legalHoldModalOpen && typeof window !== 'undefined' && window.document?.body && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md"
          style={{ direction: 'rtl', top: 0, left: 0, right: 0, bottom: 0, margin: 0 }}
          onClick={() => !legalHoldSubmitting && setLegalHoldModalOpen(false)}
        >
          <div
            className="bg-[#0c1427] border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden my-auto text-right"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl ${document.legal_hold ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'}`}>
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {document.legal_hold ? 'رفع الحجز القانوني' : 'فرض حجز قانوني'}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">{document.document_number}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLegalHoldModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleLegalHoldSubmit} className="p-6 space-y-4">
              <div className={`p-3 rounded-xl border text-[11px] leading-relaxed ${
                document.legal_hold
                  ? 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
              }`}>
                {document.legal_hold
                  ? 'رفع الحجز يعيد إمكانية حذف الوثيقة وفق سياسات الاستبقاء المعتمدة.'
                  : 'الحجز القانوني يمنع حذف الوثيقة (المبدئي والنهائي) حتى يتم رفعه رسمياً.'}
              </div>

              {!document.legal_hold && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    سبب الحجز القانوني <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={legalHoldReason}
                    onChange={(e) => setLegalHoldReason(e.target.value)}
                    placeholder="مثال: قضية مرجعية رقم ...، تحقيق داخلي، طلب من الجهة القانونية..."
                    className="w-full bg-[#070d1a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500 resize-none"
                  />
                </div>
              )}

              {document.legal_hold && (
                <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 text-xs text-slate-300">
                  <div className="text-slate-400 mb-1">سبب الحجز الحالي:</div>
                  {document.legal_hold_reason || '—'}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setLegalHoldModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={legalHoldSubmitting}
                  className={`px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition shadow-lg disabled:opacity-50 cursor-pointer ${
                    document.legal_hold
                      ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
                      : 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/20'
                  }`}
                >
                  {legalHoldSubmitting ? 'جاري التنفيذ...' : document.legal_hold ? 'تأكيد رفع الحجز' : 'فرض الحجز'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        window.document.body
      )}

      {/* ── Document Camera Scanner Modal ── */}
      <DocumentScannerModal
        isOpen={scannerModalOpen}
        onClose={() => setScannerModalOpen(false)}
        documentTitle={document?.title}
        onCapture={(file, data) => handleScanAndUploadAttachment(file, data)}
      />

      {/* ── Digital Signature & Official Stamp Modal ── */}
      <DigitalSignatureModal
        isOpen={digitalSignatureModalOpen}
        onClose={() => setDigitalSignatureModalOpen(false)}
        defaultSignerName={user?.name}
        documentNumber={document?.document_number}
        onConfirm={handleDigitalSignatureConfirm}
      />
    </div>
  );
}
