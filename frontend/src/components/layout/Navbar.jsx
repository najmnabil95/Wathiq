import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Search,
  Sun,
  Moon,
  Globe,
  PlusCircle,
  Archive,
  UserCheck
} from 'lucide-react';

export const Navbar = () => {
  const {
    t,
    lang,
    toggleLanguage,
    darkMode,
    toggleTheme,
    currentRole,
    setCurrentRole,
    setIsCreateModalOpen,
    globalSearch,
    setGlobalSearch,
    setActiveTab
  } = useApp();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setActiveTab('documents');
  };

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-slate-800 bg-slate-900/95 backdrop-blur-md px-6 flex items-center justify-between transition-colors">
      {/* Search Bar - Instant Archival Search */}
      <form onSubmit={handleSearchSubmit} className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={globalSearch}
            onChange={(e) => {
              setGlobalSearch(e.target.value);
              setActiveTab('documents');
            }}
            placeholder={t('searchPlaceholder')}
            className="w-full ps-10 pe-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs sm:text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition"
          />
          {globalSearch && (
            <button
              type="button"
              onClick={() => setGlobalSearch('')}
              className="absolute end-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-200"
            >
              ✕
            </button>
          )}
        </div>
      </form>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Quick Archive Button */}
        {currentRole !== 'viewer' && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition transform hover:-translate-y-0.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t('navNewDocument')}</span>
          </button>
        )}

        {/* Role toggle */}
        <select
          value={currentRole}
          onChange={(e) => setCurrentRole(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          title="تبديل صفة المستخدم"
        >
          <option value="superAdmin">{t('superAdmin')}</option>
          <option value="itStaff">{t('itStaff')}</option>
          <option value="viewer">{t('viewer')}</option>
        </select>

        {/* Language Switch */}
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 hover:border-slate-600 text-xs font-semibold text-slate-200 transition"
          title={t('language')}
        >
          <Globe className="w-3.5 h-3.5 text-slate-400" />
          <span>{lang === 'ar' ? 'English' : 'عربي'}</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-slate-800 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white transition"
          title={darkMode ? t('lightMode') : t('darkMode')}
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-400" />}
        </button>

        {/* User Badge */}
        <div className="flex items-center gap-2 ps-2 border-s border-slate-800">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow">
            IT
          </div>
          <div className="hidden lg:block text-start leading-tight">
            <span className="text-xs font-bold text-slate-200 block">أخصائي الأرشفة الرقمية</span>
            <span className="text-[10px] text-slate-400 block">قسم تكنولوجيا المعلومات</span>
          </div>
        </div>
      </div>
    </header>
  );
};
