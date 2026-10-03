import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  FolderTree,
  Plus,
  FileText,
  Archive,
  Layers,
  Search,
  Code,
  KeyRound,
  UserCheck,
  Video,
  BookOpenCheck,
  LifeBuoy,
  Network,
  Cpu,
  Mail,
  GitPullRequest,
  FileSpreadsheet
} from 'lucide-react';

const iconMap = {
  Code,
  KeyRound,
  UserCheck,
  Video,
  BookOpenCheck,
  LifeBuoy,
  Network,
  Cpu,
  Mail,
  GitPullRequest,
  FileSpreadsheet,
  Archive
};

export const CategoriesView = () => {
  const { categories, addCategory, documents, t, currentRole, setSelectedDocument, setActiveTab } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [code, setCode] = useState('');

  const handleAddCategory = (e) => {
    e.preventDefault();
    if (!nameAr.trim() || !code.trim()) return;
    addCategory({
      code,
      name_ar: nameAr,
      name_en: nameEn || nameAr,
      icon: 'Archive',
      color: 'blue'
    });
    setNameAr('');
    setNameEn('');
    setCode('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-100 flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-blue-500" />
            <span>{t('navCategories')}</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 font-mono">
              {categories.length} تصنيف أرشيفي
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            الهيكل التنظيمي لحفظ وتصنيف وثائق وملفات تكنولوجيا المعلومات في الأرشيف
          </p>
        </div>

        {currentRole === 'superAdmin' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-500/20 transition transform hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة تصنيف أرشيفي</span>
          </button>
        )}
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {categories.map(cat => {
          const Icon = iconMap[cat.icon] || Archive;
          const docsCount = documents.filter(d => d.category_id === cat.id).length;

          return (
            <div
              key={cat.id}
              onClick={() => setActiveTab('documents')}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 cursor-pointer transition shadow-xl group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 group-hover:scale-110 transition">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    {cat.code}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-100 group-hover:text-blue-400 transition">
                  {cat.name_ar}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">{cat.name_en}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-mono flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-400" />
                  <strong className="text-slate-200">{docsCount}</strong>
                  <span>وثيقة مؤرشفة</span>
                </span>
                <span className="text-[10px] text-blue-400 font-semibold group-hover:underline">
                  فتح الأرشيف ➜
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Category Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <form onSubmit={handleAddCategory} className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <FolderTree className="w-5 h-5 text-blue-400" />
              <span>إضافة تصنيف أرشيفي جديد</span>
            </h3>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                اسم التصنيف (بالعربية) *
              </label>
              <input
                type="text"
                required
                value={nameAr}
                onChange={e => setNameAr(e.target.value)}
                placeholder="مثال: عقود الصيانة والضمانات"
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                اسم التصنيف (بالإنجليزية)
              </label>
              <input
                type="text"
                value={nameEn}
                onChange={e => setNameEn(e.target.value)}
                placeholder="e.g. Maintenance & Warranties"
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                رمز التصنيف (Code) *
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="e.g. MAINT_CONTRACTS"
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono uppercase"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow"
              >
                حفظ التصنيف
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
