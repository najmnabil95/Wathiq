import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { auditAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import {
  Activity, Shield, Search, Filter, Calendar, User,
  FileText, Clock, Download, CheckCircle, AlertTriangle,
  Eye, RefreshCw, X, ArrowUpDown, ShieldCheck
} from 'lucide-react';
import toast from 'react-hot-toast';

const formatEnglishDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
};

export default function AuditPage() {
  const { hasPermission, user } = useAuthStore();
  const canExportAudit = user?.is_super_admin || hasPermission('audit.export');
  const canVerifyAudit = user?.is_super_admin || hasPermission('audit.verify_integrity');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [integrity, setIntegrity] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = {};
      if (actionFilter) params.action = actionFilter;
      const res = await auditAPI.list(params);
      const raw = res.data?.data?.data || res.data?.data || res.data || [];
      setLogs(Array.isArray(raw) ? raw : []);
    } catch (err) {
      console.error(err);
      toast.error('فشل تحميل سجل العمليات والتدقيق الأمني');
    } finally {
      setLoading(false);
    }
  };

  const actionLabels = {
    create: 'إنشاء سجل جديد',
    update: 'تعديل بيانات',
    update_status: 'تغيير حالة',
    delete: 'حذف سجل',
    archive: 'أرشفة',
    restore: 'استعادة',
    approve: 'اعتماد',
    reject: 'رفض',
    view: 'معاينة / اطلاع',
    comment: 'إضافة ملاحظة',
    upload: 'رفع مرفق جديد',
    download: 'تحميل ملف',
    'version.create': 'تسجيل إصدار جديد',
    approval_requested: 'طلب اعتماد',
    'ocr.process': 'معالجة واستخراج النص',
    'workflow.create': 'إنشاء مسار عمل',
    'workflow.update': 'تعديل مسار عمل',
    'workflow.delete': 'حذف مسار عمل',
    'workflow_step.create': 'إضافة مرحلة للمسار',
    'workflow_step.update': 'تعديل مرحلة في المسار',
    'workflow_step.delete': 'حذف مرحلة من المسار',
    'reports.export': 'تصدير تقرير',
    'audit.export': 'تصدير سجل التدقيق',
    login: 'تسجيل دخول',
    logout: 'تسجيل خروج',
  };

  const actionColors = {
    create: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    update: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    update_status: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    delete: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    archive: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    restore: 'bg-teal-500/10 text-teal-400 border-teal-500/30',
    approve: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    reject: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    view: 'bg-slate-700/40 text-slate-300 border-slate-600',
    comment: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    upload: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    download: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    'version.create': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    approval_requested: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    'ocr.process': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    'workflow.create': 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    'workflow.update': 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    'workflow.delete': 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    'workflow_step.create': 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    'workflow_step.update': 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    'workflow_step.delete': 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    'reports.export': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    'audit.export': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    login: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    logout: 'bg-slate-700/40 text-slate-300 border-slate-600',
  };

  const logList = Array.isArray(logs) ? logs : [];
  const filteredLogs = logList.filter((log) => {
    const q = searchQuery.toLowerCase();
    return (
      log.description?.toLowerCase().includes(q) ||
      log.user?.name?.toLowerCase().includes(q) ||
      log.ip_address?.toLowerCase().includes(q) ||
      log.auditable?.title?.toLowerCase().includes(q) ||
      log.auditable?.document_number?.toLowerCase().includes(q)
    );
  });

  const exportCSV = async () => {
    try {
      setExporting(true);
      const params = {};
      if (actionFilter) params.action = actionFilter;
      const res = await auditAPI.export(params);
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `edms_audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      const count = res.headers?.['x-exported-count'];
      toast.success(count ? `تم تصدير ${count} سجل تدقيق بنجاح` : 'تم تصدير سجل التدقيق بنجاح');
    } catch (err) {
      console.error(err);
      toast.error('فشل تصدير سجل التدقيق');
    } finally {
      setExporting(false);
    }
  };

  const verifyIntegrity = async () => {
    try {
      setVerifying(true);
      const res = await auditAPI.verifyIntegrity();
      const result = res.data?.data || null;
      setIntegrity(result);
      if (result?.valid) {
        toast.success('سلسلة سجل التدقيق سليمة ولم يتم اكتشاف أي تلاعب');
      } else {
        toast.error('تم اكتشاف خلل في نزاهة سجل التدقيق');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل التحقق من نزاهة السجل');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in" style={{ direction: 'rtl' }}>
      {/* ── Page Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Activity className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">سجل العمليات والتدقيق الأمني (Audit Trail)</h1>
          </div>
          <p className="text-xs text-slate-400">
            تتبع غير قابل للتعديل لجميع أنشطة الإدخال، الاطلاع، التحميل، والاعتماد لضمان النزاهة المؤسسية
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchLogs}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            title="تحديث السجل"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {canVerifyAudit && (
            <button
              onClick={verifyIntegrity}
              disabled={verifying}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
              title="إعادة احتساب سلسلة التجزئة SHA-256 والتحقق من عدم التلاعب بالسجلات"
            >
              <ShieldCheck className={`w-4 h-4 ${verifying ? 'animate-pulse' : ''}`} />
              {verifying ? 'جاري التحقق...' : 'التحقق من النزاهة'}
            </button>
          )}
          {canExportAudit && (
            <button
              onClick={exportCSV}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className={`w-4 h-4 ${exporting ? 'animate-pulse' : ''}`} />
              {exporting ? 'جاري التصدير...' : 'تصدير CSV'}
            </button>
          )}
        </div>
      </div>

      {integrity && (
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border backdrop-blur-md ${
          integrity.valid
            ? 'bg-emerald-950/30 border-emerald-500/40'
            : 'bg-rose-950/30 border-rose-500/40'
        }`}>
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-xl border shrink-0 ${
              integrity.valid
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
            }`}>
              {integrity.valid ? <ShieldCheck className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            </div>
            <div>
              <h3 className={`text-sm font-bold ${integrity.valid ? 'text-emerald-300' : 'text-rose-300'}`}>
                {integrity.valid
                  ? 'سلسلة سجل التدقيق سليمة (SHA-256 Hash Chain Verified)'
                  : `تم اكتشاف خلل في نزاهة السجل عند القيد #${integrity.broken_at}`}
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                {integrity.reason || `تم التحقق من ${integrity.verified_entries} قيداً موقّعاً رقمياً من أصل ${integrity.scanned_entries} قيداً مفحوصاً.`}
              </p>
              {integrity.legacy_entries > 0 && (
                <p className="text-[11px] text-slate-500 mt-0.5">
                  قيود سابقة للتفعيل (بدون بصمة): {integrity.legacy_entries}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIntegrity(null)}
            className="self-start sm:self-center p-1.5 rounded-lg bg-slate-800/70 hover:bg-slate-700 text-slate-400 hover:text-white transition shrink-0"
            title="إغلاق النتيجة"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Filters Bar ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto flex-1">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute right-3.5 top-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="بحث بالوصف، المستخدم، الوثيقة، أو الـ IP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pr-10 pl-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full sm:w-auto bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="">جميع أنواع العمليات</option>
            <option value="create">إنشاء سجل</option>
            <option value="update">تعديل بيانات</option>
            <option value="update_status">تغيير حالة</option>
            <option value="approve">اعتماد</option>
            <option value="reject">رفض</option>
            <option value="archive">أرشفة</option>
            <option value="restore">استعادة</option>
            <option value="delete">حذف</option>
            <option value="upload">رفع مرفق</option>
            <option value="download">تحميل ملف</option>
            <option value="version.create">تسجيل إصدار</option>
            <option value="approval_requested">طلب اعتماد</option>
            <option value="login">تسجيل الدخول</option>
            <option value="logout">تسجيل الخروج</option>
          </select>
        </div>

        <div className="text-xs text-slate-400">
          إجمالي السجلات: <strong className="text-slate-200 font-mono text-sm">{filteredLogs.length}</strong>
        </div>
      </div>

      {/* ── Audit Logs Table ───────────────────────────────────────── */}
      <div className="glass overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-16 text-slate-400">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs font-medium">جاري تحميل سجل التدقيق الأمني...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-16 text-center text-slate-500">
            <Shield className="w-12 h-12 mx-auto mb-3 opacity-30 text-purple-400" />
            <p className="text-sm">لا توجد حركات مسجلة مطابقة للبحث</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table w-full text-right text-sm min-w-[720px]">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-xs font-semibold text-slate-400">
                <tr>
                  <th className="p-4">نوع العملية</th>
                  <th className="p-4">التفاصيل والوصف</th>
                  <th className="p-4">المستخدم الفاعل</th>
                  <th className="p-4">الوثيقة المرتبطة</th>
                  <th className="p-4">عنوان IP</th>
                  <th className="p-4">الوقت والتاريخ</th>
                  <th className="p-4 text-center">التفاصيل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredLogs.map((log) => {
                  const actionBadge = log.action || 'system_event';
                  return (
                    <tr key={log.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-4">
                        <span className={`text-xs px-2.5 py-1 rounded-lg border font-medium inline-block ${actionColors[actionBadge] || 'bg-slate-800 text-slate-300 border-slate-700'}`}>
                          {actionLabels[actionBadge] || actionBadge}
                        </span>
                      </td>

                      <td className="p-4 text-slate-200 font-medium max-w-xs truncate">
                        {log.description || '—'}
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-slate-500" />
                          <span className="font-semibold text-slate-300 text-xs">
                            {log.user?.name || log.user_name || 'النظام التلقائي'}
                          </span>
                        </div>
                      </td>

                      <td className="p-4 text-xs font-mono text-slate-400">
                        {log.auditable?.document_number ? (
                          <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-blue-400">
                            {log.auditable.document_number}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>

                      <td className="p-4 font-mono text-xs text-slate-400">
                        {log.ip_address || '127.0.0.1'}
                      </td>

                      <td className="p-4 font-mono text-xs text-slate-300" style={{ direction: 'ltr', textAlign: 'right' }}>
                        {formatEnglishDate(log.created_at)}
                      </td>

                      <td className="p-4 text-center">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                          title="عرض البيانات التقنية الكاملة"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── LOG DETAIL MODAL ───────────────────────────────────────── */}
      {selectedLog && typeof document !== 'undefined' && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-fade-in"
        >
          <div className="bg-[#0c1427] border border-slate-800 rounded-3xl w-full max-w-xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0c1427]">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-400" />
                تفاصيل السجل التقني #{selectedLog.id}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="bg-[#070d1a] p-3.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 block mb-1">البيان والحدث:</span>
                <span className="font-semibold text-slate-100 text-sm">{selectedLog.description}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#070d1a] p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block mb-1">نوع العملية:</span>
                  <span className="font-mono text-slate-200">{selectedLog.action}</span>
                </div>
                <div className="bg-[#070d1a] p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block mb-1">المستخدم الفاعل:</span>
                  <span className="font-bold text-slate-100">{selectedLog.user?.name || selectedLog.user_name || 'النظام'}</span>
                </div>
                <div className="bg-[#070d1a] p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block mb-1">عنوان IP:</span>
                  <span className="font-mono text-slate-200">{selectedLog.ip_address || '—'}</span>
                </div>
                <div className="bg-[#070d1a] p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block mb-1">التوقيت الدقيق:</span>
                  <span className="font-mono text-slate-200" style={{ direction: 'ltr', display: 'inline-block' }}>{formatEnglishDate(selectedLog.created_at)}</span>
                </div>
              </div>

              {selectedLog.old_values && (
                <div>
                  <span className="text-slate-400 block mb-1 font-medium">البيانات السابقة (Old Values):</span>
                  <pre className="bg-[#070d1a] p-3.5 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-40">
                    {JSON.stringify(selectedLog.old_values, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.new_values && (
                <div>
                  <span className="text-slate-400 block mb-1 font-medium">البيانات الجديدة (New Values):</span>
                  <pre className="bg-[#070d1a] p-3.5 rounded-xl border border-slate-800 font-mono text-[11px] text-emerald-300 overflow-x-auto max-h-40">
                    {JSON.stringify(selectedLog.new_values, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end px-6 py-3.5 border-t border-slate-800 bg-[#0c1427]">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
