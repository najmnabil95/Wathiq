import React from 'react';
import { useApp } from '../../context/AppContext';
import { ConfidentialityBadge } from '../common/Badge';
import {
  Archive,
  FileText,
  Calendar,
  Layers,
  Paperclip,
  Eye,
  Plus,
  History,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  FolderTree
} from 'lucide-react';

export const DashboardView = () => {
  const {
    t,
    documents,
    categories,
    auditLogs,
    setSelectedDocument,
    setActiveTab,
    setIsCreateModalOpen,
    dir,
    currentRole
  } = useApp();

  const total = documents.length;
  const totalAttachments = documents.reduce((sum, d) => sum + (d.attachments?.length || 0), 0);

  const statCards = [
    {
      title: t('totalArchived'),
      value: total,
      subtext: 'وثيقة رسمية مفهرسة ومحفوظة',
      icon: Archive,
      color: 'from-blue-600 to-indigo-600',
      textColor: 'text-blue-400',
      borderColor: 'border-blue-500/20'
    },
    {
      title: t('totalAttachments'),
      value: totalAttachments,
      subtext: 'ملفات PDF وصور رقمية ممسوحة',
      icon: Paperclip,
      color: 'from-purple-600 to-pink-600',
      textColor: 'text-purple-400',
      borderColor: 'border-purple-500/20'
    },
    {
      title: t('archivedThisMonth'),
      value: total,
      subtext: 'معدل الحفظ لشهر مارس 2026',
      icon: Calendar,
      color: 'from-emerald-600 to-teal-600',
      textColor: 'text-emerald-400',
      borderColor: 'border-emerald-500/20'
    },
    {
      title: 'التصنيفات الأرشيفية النشطة',
      value: categories.length,
      subtext: 'أقسام الحفظ المنظمة لقسم IT',
      icon: FolderTree,
      color: 'from-amber-600 to-orange-600',
      textColor: 'text-amber-400',
      borderColor: 'border-amber-500/20'
    }
  ];

  const categoryStats = categories.slice(0, 6).map(cat => {
    const count = documents.filter(d => d.category_id === cat.id).length;
    const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
    return { ...cat, actualCount: count, percentage };
  });

  return (
    <div className="space-y-6">
      {/* Welcome & Quick Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-blue-900/40 via-slate-900 to-slate-900 border border-slate-800 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30">
              الأرشيف المركزي الموحد
            </span>
            <span className="text-xs text-slate-400">• قسم تكنولوجيا المعلومات والأنظمة</span>
          </div>
          <h2 className="text-2xl font-black text-white">مركز أرشفة واسترجاع الوثائق الإلكترونية</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            نظام مخصص لحفظ، فهرسة، وبحث وثائق ومراسلات وقرارات قسم IT والأنظمة واسترجاعها فورياً.
          </p>
        </div>

        {currentRole !== 'viewer' && (
          <div className="relative z-10">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition transform hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4" />
              <span>{t('navNewDocument')}</span>
            </button>
          </div>
        )}

        <div className="absolute -end-10 -bottom-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className={`p-4 rounded-2xl bg-slate-900 border ${card.borderColor} shadow-lg`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">{card.title}</span>
                <div className={`p-2 rounded-xl bg-gradient-to-tr ${card.color} text-white shadow`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className={`text-2xl font-black ${card.textColor}`}>{card.value}</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 truncate">{card.subtext}</p>
            </div>
          );
        })}
      </div>

      {/* Category Distribution & Live Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Breakdown */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-400" />
                <span>{t('documentsByCategory')}</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">توزيع الوثائق المسجلة حسب الأقسام الأرشيفية</p>
            </div>
            <button
              onClick={() => setActiveTab('categories')}
              className="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1"
            >
              <span>{t('viewAll')}</span>
              {dir === 'rtl' ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {categoryStats.map(cat => (
              <div key={cat.id} className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-bold text-slate-200">{cat.name_ar}</span>
                  <span className="font-mono text-blue-400 font-semibold">{cat.actualCount} وثيقة</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    style={{ width: `${Math.max(cat.percentage, 8)}%` }}
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Audit Activities */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-400" />
              <span>{t('recentActivity')}</span>
            </h3>
            <button
              onClick={() => setActiveTab('audit_logs')}
              className="text-xs text-blue-400 hover:text-blue-300 font-bold"
            >
              عرض السجل
            </button>
          </div>

          <div className="space-y-3">
            {auditLogs.slice(0, 5).map(log => (
              <div key={log.id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-200">{log.user}</span>
                  <span className="text-[10px] text-slate-500 font-mono">{log.date.substring(11, 16)}</span>
                </div>
                <p className="text-slate-400 text-[11px] line-clamp-1">{log.details}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Documents Table */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Archive className="w-4 h-4 text-blue-400" />
              <span>{t('recentArchived')}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">آخر الوثائق التي تم إيداعها وفهرستها في الأرشيف</p>
          </div>
          <button
            onClick={() => setActiveTab('documents')}
            className="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1"
          >
            <span>فتح الأرشيف كاملاً</span>
            {dir === 'rtl' ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-800 text-[11px]">
                <th className="pb-3 text-start font-semibold">{t('archiveNumber')}</th>
                <th className="pb-3 text-start font-semibold">{t('title')}</th>
                <th className="pb-3 text-start font-semibold">{t('department')}</th>
                <th className="pb-3 text-start font-semibold">{t('documentDate')}</th>
                <th className="pb-3 text-start font-semibold">{t('confidentiality')}</th>
                <th className="pb-3 text-end font-semibold">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {documents.slice(0, 5).map(doc => (
                <tr key={doc.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 font-mono font-bold text-blue-400">
                    {doc.document_number}
                  </td>
                  <td className="py-3 font-medium text-slate-200 max-w-sm truncate pe-4">
                    {doc.title}
                  </td>
                  <td className="py-3 text-slate-300">
                    {doc.organization}
                  </td>
                  <td className="py-3 font-mono text-slate-400">
                    {doc.document_date}
                  </td>
                  <td className="py-3">
                    <ConfidentialityBadge level={doc.confidentiality} />
                  </td>
                  <td className="py-3 text-end">
                    <button
                      onClick={() => setSelectedDocument(doc)}
                      className="px-2.5 py-1 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 font-semibold text-xs transition"
                    >
                      {t('viewDetails')}
                    </button>
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
