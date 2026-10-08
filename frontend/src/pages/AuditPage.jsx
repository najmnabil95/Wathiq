import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { auditAPI } from '../services/api';
import {
  Activity, Shield, Search, Filter, Calendar, User,
  FileText, Clock, Download, CheckCircle, AlertTriangle,
  Eye, RefreshCw, X, ArrowUpDown
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
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
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
    document_created: 'إنشاء وثيقة جديدة',
    document_updated: 'تعديل بيانات وثيقة',
    document_deleted: 'حذف وثيقة',
    document_approved: 'اعتماد وثيقة',
    document_rejected: 'رفض وثيقة',
    document_archived: 'أرشفة وثيقة',
    document_restored: 'استعادة وثيقة',
    document_viewed: 'معاينة / اطلاع',
    attachment_uploaded: 'رفع مرفق جديد',
    attachment_downloaded: 'تحميل ملف مرفق',
    attachment_deleted: 'حذف ملف مرفق',
    login_success: 'تسجيل دخول ناجح',
    login_failed: 'محاولة دخول فاشلة',
  };

  const actionColors = {
    document_created: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    document_updated: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    document_deleted: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    document_approved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    document_rejected: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    document_archived: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    document_restored: 'bg-teal-500/10 text-teal-400 border-teal-500/30',
    document_viewed: 'bg-slate-700/40 text-slate-300 border-slate-600',
    attachment_uploaded: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    attachment_downloaded: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    attachment_deleted: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    login_success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    login_failed: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  };

  const logList = Array.isArray(logs) ? logs : [];
  const filteredLogs = logList.filter((log) => {
    const q = searchQuery.toLowerCase();
    return (
      log.description?.toLowerCase().includes(q) ||
      log.user?.name?.toLowerCase().includes(q) ||
      log.ip_address?.toLowerCase().includes(q) ||
      log.document?.title?.toLowerCase().includes(q) ||
      log.document?.document_number?.toLowerCase().includes(q)
    );
  });

  const exportCSV = () => {
    if (filteredLogs.length === 0) {
      toast.error('لا توجد بيانات لتصديرها');
      return;
    }
    const headers = ['التاريخ', 'المستخدم', 'نوع العملية', 'الوصف', 'عنوان الوثيقة', 'IP'];
    const rows = filteredLogs.map((l) => [
      l.created_at || '',
      l.user?.name || l.user_name || 'النظام',
      l.action || '',
      `"${(l.description || '').replace(/"/g, '""')}"`,
      `"${(l.document?.title || '').replace(/"/g, '""')}"`,
      l.ip_address || '',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `edms_audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast.success('تم تصدير سجل التدقيق إلى ملف CSV بنجاح');
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
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-sm font-semibold transition"
          >
            <Download className="w-4 h-4" />
            تصدير CSV
          </button>
        </div>
      </div>

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
            <option value="document_created">إنشاء وثيقة</option>
            <option value="document_updated">تعديل وثيقة</option>
            <option value="document_approved">اعتماد وثيقة</option>
            <option value="document_rejected">رفض وثيقة</option>
            <option value="document_archived">أرشفة وثيقة</option>
            <option value="attachment_uploaded">رفع مرفق</option>
            <option value="attachment_downloaded">تحميل مرفق</option>
            <option value="login_success">تسجيل الدخول</option>
          </select>
        </div>

        <div className="text-xs text-slate-400">
          إجمالي السجلات: <strong className="text-slate-200 font-mono text-sm">{filteredLogs.length}</strong>
        </div>
      </div>

      {/* ── Audit Logs Table ───────────────────────────────────────── */}
      <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden backdrop-blur-md">
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
            <table className="w-full text-right text-sm min-w-[720px]">
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
                        {log.document ? (
                          <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-blue-400">
                            {log.document.document_number}
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
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fade-in"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-400" />
                تفاصيل السجل التقني #{selectedLog.id}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                <span className="text-slate-500 block mb-1">البيان والحدث:</span>
                <span className="font-semibold text-slate-200 text-sm">{selectedLog.description}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block mb-1">نوع العملية:</span>
                  <span className="font-mono text-slate-300">{selectedLog.action}</span>
                </div>
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block mb-1">المستخدم الفاعل:</span>
                  <span className="font-bold text-slate-200">{selectedLog.user?.name || selectedLog.user_name || 'النظام'}</span>
                </div>
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block mb-1">عنوان IP:</span>
                  <span className="font-mono text-slate-300">{selectedLog.ip_address || '—'}</span>
                </div>
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block mb-1">التوقيت الدقيق:</span>
                  <span className="font-mono text-slate-300" style={{ direction: 'ltr', display: 'inline-block' }}>{formatEnglishDate(selectedLog.created_at)}</span>
                </div>
              </div>

              {selectedLog.old_values && (
                <div>
                  <span className="text-slate-400 block mb-1 font-medium">البيانات السابقة (Old Values):</span>
                  <pre className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-40">
                    {JSON.stringify(selectedLog.old_values, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.new_values && (
                <div>
                  <span className="text-slate-400 block mb-1 font-medium">البيانات الجديدة (New Values):</span>
                  <pre className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 font-mono text-[11px] text-emerald-300 overflow-x-auto max-h-40">
                    {JSON.stringify(selectedLog.new_values, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end px-6 py-3.5 border-t border-slate-800 bg-slate-900/90 backdrop-blur-md">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition"
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
