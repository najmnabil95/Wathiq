import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StatusBadge, ConfidentialityBadge } from '../common/Badge';
import {
  CheckSquare,
  Check,
  Ban,
  Clock,
  User,
  Building,
  Calendar,
  Eye,
  AlertCircle,
  Shield,
  FileCheck
} from 'lucide-react';

export const PendingApprovalsView = () => {
  const {
    documents,
    setSelectedDocument,
    approveWorkflowStep,
    rejectWorkflowStep,
    t,
    currentRole
  } = useApp();

  const [selectedDocForAction, setSelectedDocForAction] = useState(null);
  const [actionType, setActionType] = useState('approve');
  const [comment, setComment] = useState('');

  const pendingDocs = documents.filter(d => d.status === 'pending_approval');

  const handleOpenAction = (doc, type) => {
    setSelectedDocForAction(doc);
    setActionType(type);
    setComment('');
  };

  const handleConfirmAction = () => {
    if (!selectedDocForAction) return;
    const currentStep = selectedDocForAction.workflow.current_step;

    if (actionType === 'approve') {
      approveWorkflowStep(selectedDocForAction.id, currentStep, comment);
    } else {
      rejectWorkflowStep(selectedDocForAction.id, currentStep, comment);
    }

    setSelectedDocForAction(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-100 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-purple-400" />
            <span>{t('navPendingApprovals')}</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold font-mono">
              {pendingDocs.length} معلقة
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            صندوق الوثائق والطلبات المعلقة التي تتطلب مراجعة واعتماداً إدارياً أو تقنياً وفق مسارات العمل
          </p>
        </div>
      </div>

      {pendingDocs.length === 0 ? (
        <div className="p-12 rounded-2xl bg-slate-900 border border-slate-800 text-center">
          <FileCheck className="w-12 h-12 text-emerald-500/60 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-200">لا توجد طلبات معلقة حالياً</h3>
          <p className="text-xs text-slate-400 mt-1">
            لقد تم إنجاز واعتماد كافة الطلبات والوثائق الموكلة إليك بنجاح.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingDocs.map(doc => {
            const currentStepObj = doc.workflow.steps.find(s => s.step_order === doc.workflow.current_step);

            return (
              <div
                key={doc.id}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-purple-500/40 transition shadow-xl"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-sm text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-lg border border-blue-500/20">
                        {doc.document_number}
                      </span>
                      <StatusBadge status={doc.status} />
                      <ConfidentialityBadge level={doc.confidentiality} />
                    </div>
                    <h3 className="text-base font-bold text-slate-100">{doc.title}</h3>
                    <p className="text-xs text-slate-400 line-clamp-1">{doc.description}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setSelectedDocument(doc)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
                    >
                      <Eye className="w-4 h-4" />
                      <span>{t('viewDetails')}</span>
                    </button>

                    {currentRole !== 'viewer' && (
                      <>
                        <button
                          onClick={() => handleOpenAction(doc, 'approve')}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition"
                        >
                          <Check className="w-4 h-4" />
                          <span>{t('approveAction')}</span>
                        </button>
                        <button
                          onClick={() => handleOpenAction(doc, 'reject')}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/20 transition"
                        >
                          <Ban className="w-4 h-4" />
                          <span>{t('rejectAction')}</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Step Info Strip */}
                <div className="mt-4 pt-1 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="text-purple-400 font-bold flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>الخطوة الحالية: {currentStepObj?.name || 'مراجعة'}</span>
                    </span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-300">
                      الدور المطلوب: <strong>{currentStepObj?.role}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-slate-400 text-[11px]">
                    <span>مقدم الطلب: <strong className="text-slate-300">{doc.created_by}</strong></span>
                    <span>التاريخ: <strong className="text-slate-300 font-mono">{doc.document_date}</strong></span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Decision Modal */}
      {selectedDocForAction && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              {actionType === 'approve' ? (
                <>
                  <Check className="w-5 h-5 text-emerald-400" />
                  <span>اعتماد الطلب: {selectedDocForAction.document_number}</span>
                </>
              ) : (
                <>
                  <Ban className="w-5 h-5 text-rose-400" />
                  <span>رفض الطلب: {selectedDocForAction.document_number}</span>
                </>
              )}
            </h3>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">
                {t('approvalComment')} {actionType === 'reject' && <span className="text-rose-400">*</span>}
              </label>
              <textarea
                rows={3}
                required={actionType === 'reject'}
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="أدخل الملاحظات الفنية أو مبررات القرار..."
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedDocForAction(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                className={`px-4 py-1.5 rounded-lg text-white text-xs font-bold shadow ${
                  actionType === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                تأكيد القرار
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
