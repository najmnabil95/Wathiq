import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  FileText,
  LayoutDashboard,
  FolderTree,
  History,
  Archive,
  PlusCircle,
  ShieldCheck,
  Search
} from 'lucide-react';

export const Sidebar = () => {
  const { t, activeTab, setActiveTab, documents, setIsCreateModalOpen, currentRole } = useApp();

  const totalCount = documents.length;

  const navItems = [
    {
      id: 'documents',
      label: t('navDocuments'),
      icon: FileText,
      badge: totalCount,
      badgeColor: 'bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold'
    },
    {
      id: 'dashboard',
      label: t('navDashboard'),
      icon: LayoutDashboard,
    },
    {
      id: 'categories',
      label: t('navCategories'),
      icon: FolderTree,
    },
    {
      id: 'audit_logs',
      label: t('navAuditLogs'),
      icon: History,
    }
  ];

  return (
    <aside className="w-64 h-screen sticky top-0 shrink-0 bg-slate-900 border-e border-slate-800 flex flex-col justify-between select-none">
      <div>
        {/* Brand Header */}
        <div className="h-16 px-5 border-b border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
            <Archive className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-black text-slate-100 leading-tight">
              {t('appName')}
            </h1>
            <p className="text-[10px] text-blue-400 font-semibold tracking-wider uppercase mt-0.5">
              IT Document Archive
            </p>
          </div>
        </div>

        {/* Quick Archive Button */}
        {currentRole !== 'viewer' && (
          <div className="p-3">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition transform hover:-translate-y-0.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{t('navNewDocument')}</span>
            </button>
          </div>
        )}

        {/* Navigation list */}
        <nav className="p-3 space-y-1 overflow-y-auto">
          <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            أقسام الأرشيف
          </div>

          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-bold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Vault Security Footer */}
      <div className="p-4 border-t border-slate-800/80">
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="text-start">
            <span className="text-[11px] font-bold text-slate-200 block">مستودع الأرشيف الرقمي</span>
            <span className="text-[10px] text-slate-500 font-mono">سعة وتخزين آمن • SHA-256</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
