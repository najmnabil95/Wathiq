import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ConfidentialityBadge } from '../common/Badge';
import { archiveApi } from '../../services/api';
import {
  FileText,
  Search,
  Plus,
  Paperclip,
  Eye,
  Trash2,
  Calendar,
  Building,
  Tag,
  FolderTree,
  Archive,
  RotateCcw,
  MapPin,
  Download,
  RefreshCw,
  Printer
} from 'lucide-react';

export const DocumentsListView = () => {
  const {
    t,
    documents,
    categories,
    departments,
    setSelectedDocument,
    setIsCreateModalOpen,
    deleteDocument,
    globalSearch,
    setGlobalSearch,
    currentRole,
    setPreviewAttachment,
    refreshAllData,
    isBackendConnected
  } = useApp();

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshAllData();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExport = () => {
    const params = {};
    if (globalSearch) params.search = globalSearch;
    if (selectedCategory) params.category_id = selectedCategory;
    if (selectedConfidentiality) params.confidentiality = selectedConfidentiality;
    const url = archiveApi.getExportUrl(params);
    window.open(url, '_blank');
  };

  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedConfidentiality, setSelectedConfidentiality] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedTag, setSelectedTag] = useState('');

  // Collect all unique tags
  const allTags = useMemo(() => {
    const set = new Set();
    documents.forEach(d => {
      d.tags?.forEach(tag => {
        const tagName = typeof tag === 'object' && tag !== null ? (tag.name || tag.slug) : String(tag);
        if (tagName) set.add(tagName);
      });
    });
    return Array.from(set);
  }, [documents]);

  // Filtered documents
  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      if (globalSearch.trim()) {
        const query = globalSearch.toLowerCase();
        const matchNumber = doc.document_number?.toLowerCase().includes(query);
        const matchOriginal = doc.original_number?.toLowerCase().includes(query);
        const matchTitle = doc.title?.toLowerCase().includes(query);
        const matchDesc = doc.description?.toLowerCase().includes(query);
        const matchOrg = doc.organization?.toLowerCase().includes(query);
        const matchLoc = doc.physical_location?.toLowerCase().includes(query);
        const matchTags = doc.tags?.some(tag => {
          const tStr = typeof tag === 'object' && tag !== null ? (tag.name || tag.slug) : String(tag);
          return tStr?.toLowerCase().includes(query);
        });
        if (!matchNumber && !matchOriginal && !matchTitle && !matchDesc && !matchOrg && !matchLoc && !matchTags) {
          return false;
        }
      }

      if (selectedCategory && doc.category_id !== Number(selectedCategory)) {
        return false;
      }

      if (selectedConfidentiality && doc.confidentiality !== selectedConfidentiality) {
        return false;
      }

      if (selectedDepartment && doc.department_id !== Number(selectedDepartment)) {
        return false;
      }

      if (selectedTag && !doc.tags?.some(tag => {
        const tStr = typeof tag === 'object' && tag !== null ? (tag.name || tag.slug) : String(tag);
        return tStr === selectedTag;
      })) {
        return false;
      }

      return true;
    });
  }, [
    documents,
    globalSearch,
    selectedCategory,
    selectedConfidentiality,
    selectedDepartment,
    selectedTag
  ]);

  const handleResetFilters = () => {
    setGlobalSearch('');
    setSelectedCategory('');
    setSelectedConfidentiality('');
    setSelectedDepartment('');
    setSelectedTag('');
  };

  const hasActiveFilters = globalSearch || selectedCategory || selectedConfidentiality || selectedDepartment || selectedTag;

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-100 flex items-center gap-2">
            <Archive className="w-5 h-5 text-blue-500" />
            <span>{t('navDocuments')}</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono font-bold">
              {filteredDocuments.length} وثيقة مؤكدة
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            البحث والاسترجاع الفوري لكافة وثائق ومراسلات وتقارير قسم IT المؤرشفة إلكترونياً
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh Data */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="تحديث ومزامنة البيانات مع قاعدة البيانات"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
            <span className="hidden sm:inline">تحديث</span>
          </button>

          {/* Export to CSV */}
          <button
            onClick={handleExport}
            title="تصدير كشف الأرشيف إلى ملف Excel / CSV"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 text-xs font-bold border border-emerald-500/30 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>تصدير كشف الأرشيف</span>
          </button>

          {/* New Document Button */}
          {currentRole !== 'viewer' && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-500/20 transition transform hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4" />
              <span>{t('navNewDocument')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Instant Search Input */}
          <div className="relative sm:col-span-2">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={globalSearch}
              onChange={e => setGlobalSearch(e.target.value)}
              placeholder="ابحث برقم الأرشيف، العنوان، الجهة، الكلمات المفتاحية..."
              className="w-full ps-9 pe-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700/80 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          {/* Category Select */}
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700/80 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="">{t('allCategories')}</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>
                {c.name_ar}
              </option>
            ))}
          </select>

          {/* Confidentiality Select */}
          <select
            value={selectedConfidentiality}
            onChange={e => setSelectedConfidentiality(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700/80 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="">{t('allConfidentialities')}</option>
            <option value="public">{t('confPublic')}</option>
            <option value="internal">{t('confInternal')}</option>
            <option value="confidential">{t('confConfidential')}</option>
            <option value="highly_confidential">{t('confHighlyConfidential')}</option>
          </select>
        </div>

        {/* Tags bar & Reset */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-400 flex items-center gap-1 text-[11px] font-semibold me-1">
              <Tag className="w-3.5 h-3.5 text-blue-400" />
              <span>الكلمات الدلالية الشائعة:</span>
            </span>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? '' : tag)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                  selectedTag === tag
                    ? 'bg-blue-600 text-white font-bold shadow'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>

          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300 font-bold transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t('reset')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Empty State */}
      {filteredDocuments.length === 0 && (
        <div className="p-12 rounded-2xl bg-slate-900 border border-slate-800 text-center">
          <Archive className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-300">{t('noResults')}</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            تأكد من كتابة مصطلح البحث بشكل صحيح أو اضغط إعادة ضبط لعرض كافة الوثائق المؤرشفة.
          </p>
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="mt-4 px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700 transition"
            >
              إعادة ضبط الفلاتر
            </button>
          )}
        </div>
      )}

      {/* Main Archival Data Table */}
      {filteredDocuments.length > 0 && (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead className="bg-slate-950/70 border-b border-slate-800 text-[11px] text-slate-400">
                <tr>
                  <th className="py-3 px-4 text-start font-semibold">{t('archiveNumber')}</th>
                  <th className="py-3 px-4 text-start font-semibold">{t('title')}</th>
                  <th className="py-3 px-4 text-start font-semibold">{t('category')}</th>
                  <th className="py-3 px-4 text-start font-semibold">{t('department')}</th>
                  <th className="py-3 px-4 text-start font-semibold">{t('documentDate')}</th>
                  <th className="py-3 px-4 text-center font-semibold">{t('attachmentsCount')}</th>
                  <th className="py-3 px-4 text-start font-semibold">{t('confidentiality')}</th>
                  <th className="py-3 px-4 text-end font-semibold">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredDocuments.map(doc => {
                  const categoryObj = categories.find(c => c.id === doc.category_id);

                  return (
                    <tr
                      key={doc.id}
                      className="hover:bg-slate-800/50 transition group cursor-pointer"
                      onClick={() => setSelectedDocument(doc)}
                    >
                      {/* Archive Number */}
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-400 group-hover:text-blue-300">
                        {doc.document_number}
                      </td>

                      {/* Title & Description */}
                      <td className="py-3.5 px-4 font-semibold text-slate-200 max-w-md">
                        <div className="line-clamp-1 group-hover:text-white">{doc.title}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                          {doc.description}
                        </div>
                      </td>

                      {/* Archive Category */}
                      <td className="py-3.5 px-4 text-slate-300 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-[11px] font-medium border border-slate-700/60">
                          {categoryObj?.name_ar || 'تصنيف'}
                        </span>
                      </td>

                      {/* Department / Org */}
                      <td className="py-3.5 px-4 text-slate-300 whitespace-nowrap">
                        <span className="text-xs text-slate-200 block">{doc.organization}</span>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                        {doc.document_date}
                      </td>

                      {/* Attachments */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 font-mono text-xs border border-blue-500/20">
                          <Paperclip className="w-3 h-3" />
                          <span>{doc.attachments?.length || 0}</span>
                        </span>
                      </td>

                      {/* Confidentiality */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <ConfidentialityBadge level={doc.confidentiality} />
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-end whitespace-nowrap" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedDocument(doc)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 font-semibold text-xs transition"
                            title={t('viewDetails')}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>معاينة</span>
                          </button>

                          {currentRole === 'superAdmin' && (
                            <button
                              onClick={() => deleteDocument(doc.id)}
                              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
                              title={t('deleteDocument')}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
