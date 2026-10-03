import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  BarChart3,
  Download,
  Calendar,
  Filter,
  FileSpreadsheet,
  FileText,
  TrendingUp,
  CheckCircle2,
  Clock,
  PieChart,
  Layers,
  ArrowUpRight
} from 'lucide-react';

export const ReportsView = () => {
  const { documents, categories, departments, t, showToast, addAuditLog } = useApp();
  const [dateRange, setDateRange] = useState('2026-Q1');

  const handleExport = (type) => {
    addAuditLog('download', `تقرير إحصائي (${type.toUpperCase()})`, `تصدير تقرير إحصائي شامل لفترة ${dateRange}`);
    showToast(`تم توليد وتجهيز تقرير ${type.toUpperCase()} بنجاح`, 'success');
  };

  const total = documents.length;
  const completedCount = documents.filter(d => d.status === 'completed').length;
  const pendingCount = documents.filter(d => d.status === 'pending_approval').length;
  const inProgressCount = documents.filter(d => d.status === 'in_progress').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            <span>{t('reportsHeading')}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            مؤشرات أداء إنجاز المعاملات، توزيع الوثائق، وتصدير التقارير التنفيذية
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('excel')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition shadow"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>{t('exportExcel')}</span>
          </button>
          <button
            onClick={() => handleExport('pdf')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-lg shadow-blue-500/25"
          >
            <Download className="w-4 h-4" />
            <span>{t('exportPdf')}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">معدل الإنجاز العام</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-400">
              {total > 0 ? Math.round((completedCount / total) * 100) : 0}%
            </span>
            <span className="text-xs text-slate-500">من الوثائق المكتملة</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-800 mt-3 overflow-hidden">
            <div
              style={{ width: `${total > 0 ? (completedCount / total) * 100 : 0}%` }}
              className="h-full bg-emerald-500 rounded-full"
            />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">متوسط زمن المعالجة (SLA)</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-blue-400">1.8</span>
            <span className="text-xs text-slate-400">أيام عمل</span>
          </div>
          <span className="text-[10px] text-emerald-400 block mt-2">ضمن النطاق المستهدف (-12%)</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">إجمالي طلبات الصلاحيات</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-purple-400">
              {documents.filter(d => d.category_id === 2).length}
            </span>
            <span className="text-xs text-slate-400">طلب رسمي</span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-2">ERP, SAP & Active Directory</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">نسبة التزام الأمان السيبراني</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-cyan-400">100%</span>
            <span className="text-xs text-slate-400">تدقيق وبصمة SHA-256</span>
          </div>
          <span className="text-[10px] text-cyan-400 block mt-2">صفر خروقات أو تعديل غير مصرح</span>
        </div>
      </div>

      {/* Reports Breakdown Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-blue-400" />
            <span>حالات الوثائق والمعاملات</span>
          </h3>

          <div className="space-y-3">
            {[
              { label: 'مكتملة ومؤرشفة', count: completedCount, color: 'bg-emerald-500', text: 'text-emerald-400' },
              { label: 'بانتظار الاعتماد', count: pendingCount, color: 'bg-purple-500', text: 'text-purple-400' },
              { label: 'قيد المعالجة الفنية', count: inProgressCount, color: 'bg-amber-500', text: 'text-amber-400' },
            ].map(item => (
              <div key={item.label} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="font-semibold text-slate-200">{item.label}</span>
                  <span className={`font-mono font-bold ${item.text}`}>{item.count} وثيقة</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    style={{ width: `${total > 0 ? (item.count / total) * 100 : 0}%` }}
                    className={`h-full rounded-full ${item.color}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Department Processing Performance */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-400" />
            <span>توزيع الوثائق حسب الإدارات المستفيدة</span>
          </h3>

          <div className="space-y-3">
            {departments.map(dept => {
              const count = documents.filter(d => d.department_id === dept.id).length;
              return (
                <div key={dept.id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-200 block">{dept.name_ar}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{dept.code}</span>
                  </div>
                  <span className="font-mono text-blue-400 font-bold bg-blue-500/10 px-2.5 py-1 rounded border border-blue-500/20">
                    {count} وثائق
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
