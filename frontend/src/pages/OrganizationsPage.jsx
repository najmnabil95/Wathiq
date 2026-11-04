import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { organizationsAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import {
  Globe, Plus, Search, Edit3, Trash2, Mail, Phone, MapPin,
  UserCheck, Building2, RefreshCw, X, CheckCircle2, XCircle, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const TYPE_META = {
  internal:   { label: 'جهة داخلية',   color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
  external:   { label: 'جهة خارجية',   color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
  vendor:     { label: 'مورّد / شركة', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  government: { label: 'جهة حكومية',   color: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
};

const EMPTY_FORM = {
  name: '',
  name_ar: '',
  type: 'external',
  contact_person: '',
  phone: '',
  email: '',
  address: '',
  notes: '',
  is_active: true,
};

export default function OrganizationsPage() {
  const { user, hasPermission } = useAuthStore();
  const isSuperAdmin = user?.is_super_admin || user?.roles?.some(r => r.name === 'super_admin');
  const canView = isSuperAdmin || hasPermission('organizations.view');
  const canManage = isSuperAdmin || hasPermission('organizations.manage');

  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (canView) fetchOrganizations();
  }, [canView]);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      setPermissionDenied(false);
      const res = await organizationsAPI.list();
      const list = res.data?.data;
      setOrganizations(Array.isArray(list) ? list : (Array.isArray(res.data) ? res.data : []));
    } catch (err) {
      if (err.response?.status === 403) setPermissionDenied(true);
      else toast.error('تعذر جلب بيانات الجهات الخارجية');
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return organizations.filter(org => {
      const matchesSearch = !q
        || org.name?.toLowerCase().includes(q)
        || org.name_ar?.toLowerCase().includes(q)
        || org.contact_person?.toLowerCase().includes(q)
        || org.email?.toLowerCase().includes(q);
      const matchesType = typeFilter === 'all' || org.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [organizations, search, typeFilter]);

  const stats = useMemo(() => ({
    total: organizations.length,
    active: organizations.filter(o => o.is_active).length,
    external: organizations.filter(o => o.type !== 'internal').length,
    government: organizations.filter(o => o.type === 'government').length,
  }), [organizations]);

  const handleOpenCreate = () => {
    setEditingOrg(null);
    setFormData(EMPTY_FORM);
    setModalOpen(true);
  };

  const handleOpenEdit = (org) => {
    setEditingOrg(org);
    setFormData({
      name: org.name || '',
      name_ar: org.name_ar || '',
      type: org.type || 'external',
      contact_person: org.contact_person || '',
      phone: org.phone || '',
      email: org.email || '',
      address: org.address || '',
      notes: org.notes || '',
      is_active: org.is_active ?? true,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('يرجى إدخال اسم الجهة');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: formData.name.trim(),
        name_ar: formData.name_ar.trim() || null,
        type: formData.type,
        contact_person: formData.contact_person.trim() || null,
        phone: formData.phone.trim() || null,
        email: formData.email.trim() || null,
        address: formData.address.trim() || null,
        notes: formData.notes.trim() || null,
        is_active: formData.is_active,
      };

      if (editingOrg) {
        await organizationsAPI.update(editingOrg.id, payload);
        toast.success('تم تحديث بيانات الجهة بنجاح');
      } else {
        await organizationsAPI.create(payload);
        toast.success('تمت إضافة الجهة بنجاح');
      }

      setModalOpen(false);
      fetchOrganizations();
    } catch (err) {
      const validationErrors = err.response?.data?.errors;
      toast.error(validationErrors
        ? Object.values(validationErrors).flat()[0]
        : (err.response?.data?.message || 'فشل حفظ بيانات الجهة'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (org) => {
    if (!window.confirm(`هل أنت متأكد من حذف جهة "${org.name_ar || org.name}"؟`)) return;
    try {
      await organizationsAPI.delete(org.id);
      toast.success('تم حذف الجهة بنجاح');
      fetchOrganizations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل حذف الجهة');
    }
  };

  if (permissionDenied && !canView) {
    return (
      <div className="bg-slate-900/60 p-8 rounded-2xl border border-rose-500/30 text-center max-w-xl mx-auto my-12" style={{ direction: 'rtl' }}>
        <Globe className="w-10 h-10 mx-auto mb-3 text-rose-400" />
        <h2 className="text-base font-bold text-white mb-2">صلاحية الوصول غير متوفرة</h2>
        <p className="text-xs text-slate-400">حسابك لا يمتلك صلاحية استعراض الجهات الخارجية (organizations.view).</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-fade-in" style={{ direction: 'rtl' }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">الجهات الخارجية والشركاء</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              إدارة الجهات الحكومية والموردين والشركات المرتبطة بالصادر والوارد
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={fetchOrganizations}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
            title="تحديث البيانات"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-400' : ''}`} />
          </button>

          {canManage && (
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm transition shadow-lg shadow-purple-600/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              إضافة جهة جديدة
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'إجمالي الجهات', value: stats.total, icon: Globe, color: 'text-purple-400 bg-purple-500/15 border-purple-500/30' },
          { label: 'الجهات النشطة', value: stats.active, icon: CheckCircle2, color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30' },
          { label: 'جهات ومعاهد خارجية', value: stats.external, icon: Building2, color: 'text-blue-400 bg-blue-500/15 border-blue-500/30' },
          { label: 'جهات حكومية', value: stats.government, icon: AlertCircle, color: 'text-amber-400 bg-amber-500/15 border-amber-500/30' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass card-hover-lift p-4 flex items-center gap-3.5">
            <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">{label}</div>
              <div className="text-xl font-black text-white font-mono mt-0.5">{value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center bg-slate-900/40 p-3.5 rounded-2xl border border-slate-800/80">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute right-3.5 top-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="بحث بالاسم، جهة الاتصال أو البريد..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pr-10 pl-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-purple-500 sm:w-56"
        >
          <option value="all">جميع أنواع الجهات</option>
          {Object.entries(TYPE_META).map(([key, meta]) => (
            <option key={key} value={key}>{meta.label}</option>
          ))}
        </select>

        <div className="text-xs text-slate-400 flex items-center gap-1.5 self-end sm:self-center">
          <span>النتائج:</span>
          <strong className="text-purple-400 font-mono text-sm">{filtered.length}</strong>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden backdrop-blur-md">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-16 text-slate-400">
            <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs font-medium">جاري تحميل الجهات الخارجية...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center text-slate-500">
            <Globe className="w-12 h-12 mx-auto mb-3 opacity-30 text-purple-400" />
            <p className="text-sm font-semibold text-slate-300">لا توجد جهات مطابقة</p>
            <p className="text-xs text-slate-500 mt-1">جرّب تغيير البحث أو أضف جهة جديدة</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-950/70 border-b border-slate-800 text-xs font-semibold text-slate-400">
                <tr>
                  <th className="p-4">الجهة</th>
                  <th className="p-4">النوع</th>
                  <th className="p-4">جهة الاتصال</th>
                  <th className="p-4">بيانات التواصل</th>
                  <th className="p-4">الحالة</th>
                  {canManage && <th className="p-4 text-center">الإجراءات</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filtered.map((org) => {
                  const meta = TYPE_META[org.type] || TYPE_META.external;
                  return (
                    <tr key={org.id} className="hover:bg-slate-800/35 transition">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/25 text-purple-400 flex items-center justify-center shrink-0">
                            <Building2 className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-100 truncate">{org.name_ar || org.name}</div>
                            {org.name_ar && org.name !== org.name_ar && (
                              <div className="text-[11px] text-slate-500 font-mono truncate">{org.name}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`text-xs px-2.5 py-1 rounded-lg border font-medium inline-block ${meta.color}`}>
                          {meta.label}
                        </span>
                      </td>
                      <td className="p-4 text-slate-300">
                        <span className="flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                          {org.contact_person || '—'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1 text-xs text-slate-400">
                          {org.email && (
                            <span className="flex items-center gap-1.5 font-mono" style={{ direction: 'ltr' }}>
                              <Mail className="w-3.5 h-3.5 text-slate-500" />{org.email}
                            </span>
                          )}
                          {org.phone && (
                            <span className="flex items-center gap-1.5 font-mono" style={{ direction: 'ltr' }}>
                              <Phone className="w-3.5 h-3.5 text-slate-500" />{org.phone}
                            </span>
                          )}
                          {!org.email && !org.phone && <span>—</span>}
                        </div>
                      </td>
                      <td className="p-4">
                        {org.is_active ? (
                          <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                            <CheckCircle2 className="w-3.5 h-3.5" /> نشطة
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border bg-slate-700/30 text-slate-400 border-slate-600/50">
                            <XCircle className="w-3.5 h-3.5" /> غير نشطة
                          </span>
                        )}
                      </td>
                      {canManage && (
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleOpenEdit(org)}
                              className="p-2 rounded-xl bg-slate-800 hover:bg-purple-600/30 text-slate-300 hover:text-purple-300 border border-slate-700/60 transition cursor-pointer"
                              title="تعديل بيانات الجهة"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(org)}
                              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-600/30 text-slate-300 hover:text-rose-300 border border-slate-700/60 transition cursor-pointer"
                              title="حذف الجهة"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md"
          style={{ direction: 'rtl', top: 0, left: 0, right: 0, bottom: 0, margin: 0 }}
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-[#0c1427] border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden my-auto text-right"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                  <Globe className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-white">
                  {editingOrg ? 'تعديل بيانات الجهة' : 'إضافة جهة جديدة'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden m-0">
              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">اسم الجهة *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ministry of Finance"
                      className="w-full bg-[#070d1a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">الاسم بالعربية</label>
                    <input
                      type="text"
                      value={formData.name_ar}
                      onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                      placeholder="وزارة المالية"
                      className="w-full bg-[#070d1a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">نوع الجهة *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full bg-[#070d1a] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-purple-500"
                  >
                    {Object.entries(TYPE_META).map(([key, meta]) => (
                      <option key={key} value={key}>{meta.label}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">جهة الاتصال</label>
                    <input
                      type="text"
                      value={formData.contact_person}
                      onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                      placeholder="اسم مسؤول التواصل"
                      className="w-full bg-[#070d1a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">رقم الهاتف</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+967 ..."
                      className="w-full bg-[#070d1a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">البريد الإلكتروني</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contact@organization.gov"
                    className="w-full bg-[#070d1a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">العنوان</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 absolute right-3.5 top-3.5 text-slate-500" />
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="المدينة، الشارع، المبنى"
                      className="w-full bg-[#070d1a] border border-slate-800 rounded-xl pr-10 pl-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">ملاحظات</label>
                  <textarea
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="ملاحظات إضافية عن طبيعة التعامل..."
                    className="w-full bg-[#070d1a] border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none"
                  />
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <input
                    type="checkbox"
                    id="org-is-active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 rounded text-purple-600 bg-slate-950 border-slate-700 focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="org-is-active" className="text-xs text-slate-300 font-medium cursor-pointer">
                    جهة نشطة ومتاحة للربط بالوثائق
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold transition shadow-lg shadow-purple-600/20 disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'جاري الحفظ...' : editingOrg ? 'تحديث البيانات' : 'إضافة الجهة'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
