import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { categoriesAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import {
  FolderTree, Plus, Search, Folder, FolderOpen, Edit3,
  Trash2, FileText, ChevronLeft, Layers, ShieldAlert,
  Check, X, Sparkles, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function CategoriesPage() {
  const navigate = useNavigate();
  const { user, hasPermission } = useAuthStore();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    parent_id: '',
    color: '#3b82f6',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await categoriesAPI.list();
      setCategories(res.data?.data || res.data || []);
    } catch (err) {
      console.error(err);
      toast.error('فشل تحميل التصنيفات الأرشيفية');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      code: '',
      description: '',
      parent_id: '',
      color: '#3b82f6',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (cat) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name || '',
      code: cat.code || '',
      description: cat.description || '',
      parent_id: cat.parent_id || '',
      color: cat.color || '#3b82f6',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('يرجى إدخال اسم التصنيف');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        code: formData.code.trim() || `CAT-${Date.now().toString().slice(-4)}`,
        name: formData.name.trim(),
        name_ar: formData.name.trim(),
        description: formData.description.trim() || null,
        color: formData.color,
        parent_id: formData.parent_id ? parseInt(formData.parent_id) : null,
      };

      if (editingCategory) {
        await categoriesAPI.update(editingCategory.id, payload);
        toast.success('تم تحديث التصنيف بنجاح');
      } else {
        await categoriesAPI.create(payload);
        toast.success('تمت إضافة التصنيف بنجاح');
      }

      setModalOpen(false);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'حدث خطأ أثناء حفظ التصنيف');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`هل أنت متأكد من حذف التصنيف "${name}"؟`)) return;

    try {
      await categoriesAPI.delete(id);
      toast.success('تم حذف التصنيف بنجاح');
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'تعذر حذف التصنيف لوجود وثائق مرتبطة به');
    }
  };

  const filteredCategories = categories.filter((cat) => {
    const q = searchQuery.toLowerCase();
    return (
      cat.name?.toLowerCase().includes(q) ||
      cat.name_ar?.toLowerCase().includes(q) ||
      cat.code?.toLowerCase().includes(q) ||
      cat.description?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 pb-12 animate-fade-in" style={{ direction: 'rtl' }}>
      {/* ── Page Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <FolderTree className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">التصنيفات وهيكل الأرشفة</h1>
          </div>
          <p className="text-xs text-slate-400">
            إدارة شجرة التصنيفات الأرشيفية للأنظمة، الطلبات، تراخيص البرامج، والاتفاقيات
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition shadow-lg shadow-blue-600/20"
        >
          <Plus className="w-4 h-4" />
          إضافة تصنيف جديد
        </button>
      </div>

      {/* ── Search Bar & Stats ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute right-3.5 top-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="بحث بالاسم، الرمز الكودي، أو الوصف..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pr-10 pl-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span>إجمالي التصنيفات: <strong className="text-slate-200 font-mono text-sm">{categories.length}</strong></span>
        </div>
      </div>

      {/* ── Categories Grid ────────────────────────────────────────── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-slate-400">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs font-medium">جاري تحميل شجرة التصنيفات...</p>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="bg-slate-900/40 rounded-2xl border border-slate-800 p-12 text-center text-slate-500">
          <Folder className="w-12 h-12 mx-auto mb-3 opacity-30 text-blue-400" />
          <p className="text-sm">لم يتم العثور على أي تصنيفات مطابقة للبحث</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCategories.map((cat) => (
            <div
              key={cat.id}
              className="bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 transition flex flex-col justify-between group backdrop-blur-md"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="p-3 rounded-xl flex items-center justify-center text-white"
                      style={{ backgroundColor: `${cat.color || '#3b82f6'}20`, color: cat.color || '#3b82f6' }}
                    >
                      <Folder className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base group-hover:text-blue-400 transition">
                        {cat.name_ar || cat.name}
                      </h3>
                      {cat.code && (
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          {cat.code}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                    <button
                      onClick={() => handleOpenEdit(cat)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-blue-600/30 text-slate-400 hover:text-blue-300 transition"
                      title="تعديل التصنيف"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id, cat.name)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600/30 text-slate-400 hover:text-rose-300 transition"
                      title="حذف التصنيف"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 min-h-[32px] mb-4">
                  {cat.description || 'لا يوجد وصف مضاف لهذا التصنيف.'}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <FileText className="w-4 h-4 text-slate-500" />
                  <span>الوثائق: <strong className="text-slate-200 font-mono">{cat.documents_count ?? 0}</strong></span>
                </div>

                <button
                  onClick={() => navigate(`/documents?category_id=${cat.id}`)}
                  className="flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300 transition"
                >
                  استعراض الوثائق
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── CREATE / EDIT MODAL ────────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">
                {editingCategory ? 'تعديل التصنيف الأرشيفي' : 'إضافة تصنيف أرشيفي جديد'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">اسم التصنيف *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: تعديلات البرامج والأنظمة"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">الرمز الكودي (Code)</label>
                  <input
                    type="text"
                    placeholder="مثال: SYS-MOD"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">اللون التمييزي</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-10 h-10 rounded-xl bg-transparent border border-slate-800 cursor-pointer"
                    />
                    <span className="text-xs font-mono text-slate-400">{formData.color}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">الوصف والغرض الأرشيفي</label>
                <textarea
                  rows={3}
                  placeholder="شرح موجز لنوعية الوثائق والملفات التي تتبع هذا التصنيف..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition shadow-lg shadow-blue-600/20 disabled:opacity-50"
                >
                  {saving ? 'جاري الحفظ...' : editingCategory ? 'حفظ التعديلات' : 'إضافة الآن'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
