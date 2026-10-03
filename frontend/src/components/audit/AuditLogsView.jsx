import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  History,
  Shield,
  Search,
  Lock,
  Archive,
  Download,
  Eye,
  FilePlus,
  Trash2
} from 'lucide-react';

export const AuditLogsView = () => {
  const { auditLogs, t } = useApp();
  const [filterAction, setFilterAction] = useState('');
  const [searchUser, setSearchUser] = useState('');

  const filteredLogs = auditLogs.filter(log => {
    if (filterAction && log.action !== filterAction) return false;
    if (searchUser && !log.user.toLowerCase().includes(searchUser.toLowerCase()) && !log.entity.toLowerCase().includes(searchUser.toLowerCase())) {
      return false;
    }
    return true;
  });

  const actionBadge = (action) => {
    const config = {
      create: { label: 'أرشفة (Archive)', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
      update: { label: 'تعديل (Update)', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
      delete: { label: 'حذف (Delete)', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
      view: { label: 'معاينة (View)', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
      download: { label: 'تحميل (Download)', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
      upload: { label: 'رفع مرفق (Upload)', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
    }[action] || { label: action, color: 'text-slate-400 bg-slate-800' };

    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${config.color}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-100 flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-500" />
            <span>{t('navAuditLogs')}</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 font-mono">
              {filteredLogs.length} حركة مسجلة
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            سجل رقابي مشفر يوثق عمليات الأرشفة والمعاينة وتنزيل الملفات مع تسجيل عنوان الـ IP والوقت
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-emerald-400 flex items-center gap-1.5 font-semibold">
            <Lock className="w-3.5 h-3.5" />
            <span>سجل أمان الأرشيف الرقمي</span>
          </div>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchUser}
              onChange={e => setSearchUser(e.target.value)}
              placeholder="بحث بالمستخدم أو الوثيقة..."
              className="ps-9 pe-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={filterAction}
            onChange={e => setFilterAction(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">جميع العمليات</option>
            <option value="create">أرشفة (Create)</option>
            <option value="download">تحميل ملف (Download)</option>
            <option value="view">معاينة (View)</option>
            <option value="update">تعديل (Update)</option>
          </select>
        </div>

        <span className="text-xs text-slate-500 font-mono">
          حماية السجل: Immutable Storage Logging
        </span>
      </div>

      {/* Logs Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead className="bg-slate-950/70 border-b border-slate-800 text-[11px] text-slate-400">
              <tr>
                <th className="py-3 px-4 text-start font-semibold">{t('auditDate')}</th>
                <th className="py-3 px-4 text-start font-semibold">{t('auditAction')}</th>
                <th className="py-3 px-4 text-start font-semibold">{t('auditUser')}</th>
                <th className="py-3 px-4 text-start font-semibold">{t('auditEntity')}</th>
                <th className="py-3 px-4 text-start font-semibold">{t('auditDetails')}</th>
                <th className="py-3 px-4 text-end font-semibold">{t('auditIp')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                    {log.date}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    {actionBadge(log.action)}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-200 whitespace-nowrap">
                    {log.user}
                  </td>
                  <td className="py-3 px-4 font-mono text-blue-400 text-xs whitespace-nowrap">
                    {log.entity}
                  </td>
                  <td className="py-3 px-4 text-slate-300 max-w-md">
                    {log.details}
                  </td>
                  <td className="py-3 px-4 text-end font-mono text-[11px] text-slate-400 whitespace-nowrap">
                    {log.ip}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
