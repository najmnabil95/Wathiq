import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { dispositionAPI } from '../services/api';
import {
  ArchiveX, CalendarClock, Search, Loader2, X, ShieldAlert, RefreshCcw, ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';

const RETENTION_OPTIONS = [1, 3, 5, 7, 10, 15, 25, 99];

function daysOverdue(dateStr) {
  if (!dateStr) return 0;
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.max(0, Math.floor(diff / 86400000));
}

export default function DispositionPage() {
  const [documents, setDocuments] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  const [extendTarget, setExtendTarget] = useState(null);
  const [extendForm, setExtendForm] = useState({ retention_years: 7, reason: '' });
  const [disposeTarget, setDisposeTarget] = useState(null);
  const [disposeReason, setDisposeReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchEligible = useCallback(async (q = query) => {
    setLoading(true);
    try {
      const res = await dispositionAPI.eligible({ q: q || undefined, per_page: 50 });
      const payload = res.data?.data;
      setDocuments(payload?.data || []);
      setMeta(payload || null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل تحميل الوثائق المستحقة للاستبعاد');
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    fetchEligible('');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleExtend = async (e) => {
    e.preventDefault();
    if (!extendForm.reason.trim()) {
      toast.error('يرجى إدخال سبب تمديد فترة الاحتفاظ');
      return;
    }
    setSubmitting(true);
    try {
      const res = await dispositionAPI.updateRetention(extendTarget.id, {
        retention_years: Number(extendForm.retention_years),
        reason: extendForm.reason,
      });
      toast.success(res.data?.message || 'تم تمديد فترة الاحتفاظ');
      setExtendTarget(null);
      setExtendForm({ retention_years: 7, reason: '' });
      fetchEligible();
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل تمديد فترة الاحتفاظ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDispose = async (e) => {
    e.preventDefault();
    if (!disposeReason.trim()) {
      toast.error('يرجى إدخال سبب الاستبعاد');
      return;
    }
    setSubmitting(true);
    try {
      const res = await dispositionAPI.dispose(disposeTarget.id, { reason: disposeReason });
      toast.success(res.data?.message || 'تم استبعاد الوثيقة');
      setDisposeTarget(null);
      setDisposeReason('');
      fetchEligible();
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل استبعاد الوثيقة');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <ArchiveX size={22} className="text-amber-400" />
            الاستبعاد وجداول الاستبقاء
          </h1>
          <p className="page-subtitle">
            مراجعة الوثائق المنتهية مدة احتفاظها واتخاذ إجراء التمديد أو الاستبعاد وفق ISO 15489.
          </p>
        </div>
        <button type="button" onClick={() => fetchEligible()} className="btn btn-secondary gap-2">
          <RefreshCcw size={15} />
          تحديث
        </button>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); fetchEligible(query); }}
        className="glass p-4 flex flex-col sm:flex-row gap-3"
      >
        <div className="relative flex-1">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="بحث برقم الوثيقة أو العنوان..."
            className="form-input pr-9"
          />
        </div>
        <button type="submit" className="btn btn-primary">بحث</button>
      </form>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <Loader2 size={22} className="animate-spin-slow ml-2" />
          جاري تحميل الوثائق المستحقة...
        </div>
      ) : documents.length === 0 ? (
        <div className="glass p-12 text-center">
          <ShieldAlert size={36} className="mx-auto mb-3 text-emerald-400/60" />
          <h3 className="text-white font-bold mb-1">لا توجد وثائق مستحقة للاستبعاد</h3>
          <p className="text-sm text-slate-400">
            جميع الوثائق ما زالت ضمن مدة الاحتفاظ المعتمدة أو خاضعة لحجز قانوني.
          </p>
        </div>
      ) : (
        <div className="glass overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>إجمالي الوثائق المستحقة: <strong className="text-amber-300">{meta?.total ?? documents.length}</strong></span>
            <span>مرتبة حسب أقرب تاريخ انتهاء احتفاظ</span>
          </div>
          <div className="divide-y divide-slate-800/80">
            {documents.map((doc) => (
              <div key={doc.id} className="p-4 flex flex-col lg:flex-row lg:items-center gap-4 hover:bg-slate-800/20 transition">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link to={`/documents/${doc.id}`} className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/25">
                      {doc.document_number}
                    </Link>
                    <h3 className="font-semibold text-sm text-slate-100 truncate">{doc.title}</h3>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1.5">
                    <span>{doc.category?.name_ar || '—'}</span>
                    <span>•</span>
                    <span>{doc.department?.name_ar || '—'}</span>
                    <span>•</span>
                    <span style={{ direction: 'ltr' }}>{doc.document_date || '—'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <div className="text-center">
                    <p className="text-slate-500 mb-0.5">انتهاء الاحتفاظ</p>
                    <p className="font-mono text-amber-300" style={{ direction: 'ltr' }}>{doc.retention_until || '—'}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-slate-500 mb-0.5">منذ</p>
                    <p className="font-mono text-rose-300">{daysOverdue(doc.retention_until)} يوم</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 lg:justify-end">
                  <Link
                    to={`/documents/${doc.id}`}
                    className="btn btn-secondary btn-icon"
                    title="عرض الوثيقة"
                  >
                    <ExternalLink size={14} />
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setExtendTarget(doc);
                      setExtendForm({ retention_years: 7, reason: '' });
                    }}
                    className="btn btn-secondary text-xs gap-1.5 text-cyan-300"
                  >
                    <CalendarClock size={14} />
                    تمديد
                  </button>
                  <button
                    type="button"
                    onClick={() => { setDisposeTarget(doc); setDisposeReason(''); }}
                    className="btn btn-secondary text-xs gap-1.5 text-rose-300"
                  >
                    <ArchiveX size={14} />
                    استبعاد
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Extend retention modal */}
      {extendTarget && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => !submitting && setExtendTarget(null)}>
          <form onSubmit={handleExtend} className="glass w-full max-w-md p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white">تمديد فترة الاحتفاظ</h3>
              <button type="button" onClick={() => setExtendTarget(null)} className="btn btn-secondary btn-icon">
                <X size={14} />
              </button>
            </div>
            <p className="text-xs text-slate-400">
              الوثيقة: <span className="font-mono text-blue-300">{extendTarget.document_number}</span> — انتهاء الاحتفاظ الحالي: <span className="font-mono text-amber-300">{extendTarget.retention_until}</span>
            </p>
            <div>
              <label className="form-label">مدة الاحتفاظ الجديدة (سنوات)</label>
              <select
                className="form-input form-select bg-[#0d1527] text-slate-100"
                value={extendForm.retention_years}
                onChange={(e) => setExtendForm(f => ({ ...f, retention_years: e.target.value }))}
              >
                {RETENTION_OPTIONS.map(y => (
                  <option key={y} value={y} className="bg-[#0d1527]">
                    {y === 99 ? 'احتفاظ دائم' : `${y} سنوات`}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">سبب التمديد <span className="required">*</span></label>
              <textarea
                className="form-input"
                rows={3}
                value={extendForm.reason}
                onChange={(e) => setExtendForm(f => ({ ...f, reason: e.target.value }))}
                placeholder="مثال: قرار لجنة الحفظ بالتمديد لاستكمال التدقيق..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setExtendTarget(null)} className="btn btn-secondary">إلغاء</button>
              <button type="submit" disabled={submitting} className="btn btn-primary">
                {submitting ? 'جاري الحفظ...' : 'تأكيد التمديد'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Dispose modal */}
      {disposeTarget && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => !submitting && setDisposeTarget(null)}>
          <form onSubmit={handleDispose} className="glass w-full max-w-md p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white flex items-center gap-2">
                <ShieldAlert size={18} className="text-rose-400" />
                تأكيد استبعاد الوثيقة
              </h3>
              <button type="button" onClick={() => setDisposeTarget(null)} className="btn btn-secondary btn-icon">
                <X size={14} />
              </button>
            </div>
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs text-rose-200 leading-relaxed">
              سيتم وسم الوثيقة <span className="font-mono">{disposeTarget.document_number}</span> كمستبعدة نهائياً وفق جدول الاستبقاء،
              مع الاحتفاظ ببياناتها الوصفية وسجل التدقيق لأغراض الرقابة. لا يمكن التراجع إلا عبر مسؤول الاستبعاد.
            </div>
            <div>
              <label className="form-label">سبب الاستبعاد <span className="required">*</span></label>
              <textarea
                className="form-input"
                rows={3}
                value={disposeReason}
                onChange={(e) => setDisposeReason(e.target.value)}
                placeholder="مثال: انتهاء مدة الاحتفاظ القانونية دون وجود حجز..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setDisposeTarget(null)} className="btn btn-secondary">إلغاء</button>
              <button type="submit" disabled={submitting} className="btn btn-primary bg-rose-600 hover:bg-rose-500">
                {submitting ? 'جاري التنفيذ...' : 'تأكيد الاستبعاد'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
