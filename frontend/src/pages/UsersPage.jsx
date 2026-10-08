import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { usersAPI, rolesAPI, departmentsAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import {
  Users, UserPlus, Search, Shield, Building2, Mail,
  CheckCircle2, XCircle, MoreVertical, Edit3, Trash2,
  Lock, KeyRound, ShieldCheck, UserCheck, AlertCircle, X
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function UsersPage() {
  const { user: currentUser } = useAuthStore();

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    department_id: '',
    role: 'it_staff',
    is_active: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, rolesRes, depsRes] = await Promise.all([
        usersAPI.list().catch(() => ({ data: [] })),
        rolesAPI.list().catch(() => ({ data: [] })),
        departmentsAPI.list().catch(() => ({ data: [] })),
      ]);

      setUsers(usersRes.data?.data || usersRes.data || []);
      setRoles(rolesRes.data?.data || rolesRes.data || []);
      setDepartments(depsRes.data?.data || depsRes.data || []);
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ أثناء تحميل بيانات المستخدمين');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      department_id: departments[0]?.id || '',
      role: 'it_staff',
      is_active: true,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (u) => {
    setEditingUser(u);
    setFormData({
      name: u.name || '',
      email: u.email || '',
      password: '',
      department_id: u.department_id || '',
      role: u.roles?.[0]?.name === 'admin' ? 'it_manager' : (u.roles?.[0]?.name || 'it_staff'),
      is_active: u.status === 'active' || u.is_active !== false,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error('يرجى ملء الحقول الإلزامية');
      return;
    }

    if (!editingUser && !formData.password) {
      toast.error('يرجى تعيين كلمة مرور للمستخدم الجديد');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: formData.name,
        email: formData.email,
        department_id: formData.department_id ? parseInt(formData.department_id) : null,
        roles: [formData.role],
        is_active: formData.is_active,
      };

      if (formData.password) {
        payload.password = formData.password;
        payload.password_confirmation = formData.password;
      }

      if (editingUser) {
        await usersAPI.update(editingUser.id, payload);
        toast.success('تم تحديث بيانات المستخدم بنجاح');
      } else {
        await usersAPI.create(payload);
        toast.success('تم إنشاء حساب المستخدم بنجاح');
      }

      setModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل حفظ بيانات المستخدم');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (id === currentUser?.id) {
      toast.error('لا يمكنك حذف حسابك الشخصي الحالي');
      return;
    }
    if (!window.confirm(`هل أنت متأكد من حذف المستخدم "${name}" نهائياً؟`)) return;

    try {
      await usersAPI.delete(id);
      toast.success('تم حذف المستخدم بنجاح');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل حذف المستخدم');
    }
  };

  const roleLabels = {
    super_admin: 'مدير عام النظام (Super Admin)',
    it_manager: 'مدير إدارة IT (IT Manager)',
    admin: 'مدير إدارة IT (IT Manager)',
    it_staff: 'مسؤول أرشفة ودعم (Archivist/IT)',
    viewer: 'مشاهد ومستطلع (Viewer)',
  };

  const roleColors = {
    super_admin: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    it_manager: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    admin: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    it_staff: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    auditor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    viewer: 'bg-slate-700/40 text-slate-300 border-slate-600',
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q);
    const matchesRole = !roleFilter || u.roles?.some((r) => r.name === roleFilter);
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6 pb-12 animate-fade-in" style={{ direction: 'rtl' }}>
      {/* ── Page Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Users className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">إدارة المستخدمين والصلاحيات (RBAC)</h1>
          </div>
          <p className="text-xs text-slate-400">
            التحكم في حسابات موظفي قسم IT، تحديد الأدوار الإدارية، وسياسات الوصول للأرشيف
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <Link
            to="/roles"
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs sm:text-sm transition"
          >
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            شجرة الصلاحيات
          </Link>

          <button
            onClick={handleOpenCreate}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm transition shadow-lg shadow-blue-600/20"
          >
            <UserPlus className="w-4 h-4" />
            إضافة مستخدم
          </button>
        </div>
      </div>

      {/* ── Filters Bar ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto flex-1">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute right-3.5 top-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="بحث بالاسم أو البريد الإلكتروني..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pr-10 pl-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full sm:w-auto bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="">جميع الأدوار والصلاحيات</option>
            <option value="super_admin">مدير عام النظام (Super Admin)</option>
            <option value="it_manager">مدير إدارة IT (IT Manager)</option>
            <option value="it_staff">مسؤول أرشفة ودعم (Archivist)</option>
            <option value="viewer">مشاهد ومستطلع (Viewer)</option>
          </select>
        </div>

        <div className="text-xs text-slate-400">
          إجمالي المستخدمين: <strong className="text-slate-200 font-mono text-sm">{filteredUsers.length}</strong>
        </div>
      </div>

      {/* ── Users Table ────────────────────────────────────────────── */}
      <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden backdrop-blur-md">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-16 text-slate-400">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs font-medium">جاري تحميل سجل المستخدمين...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-16 text-center text-slate-500">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30 text-blue-400" />
            <p className="text-sm">لم يتم العثور على أي مستخدمين مطابقين</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-xs font-semibold text-slate-400">
                <tr>
                  <th className="p-4">المستخدم</th>
                  <th className="p-4">القسم / الإدارة</th>
                  <th className="p-4">الدور والصلاحية (Role)</th>
                  <th className="p-4">حالة الحساب</th>
                  <th className="p-4">تاريخ الانضمام</th>
                  <th className="p-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredUsers.map((u) => {
                  const roleName = u.roles?.[0]?.name || 'viewer';
                  const initials = u.name
                    ?.split(' ')
                    .map((n) => n[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase() || 'U';

                  return (
                    <tr key={u.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-md shadow-blue-500/20">
                            {initials}
                          </div>
                          <div>
                            <div className="font-bold text-slate-100 flex items-center gap-1.5">
                              {u.name}
                              {u.id === currentUser?.id && (
                                <span className="text-[10px] px-2 py-0.2 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                  أنت
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400 font-mono mt-0.5">{u.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-500" />
                          <span>{u.department?.name || 'قسم تقنية المعلومات'}</span>
                        </div>
                      </td>

                      <td className="p-4">
                        <span className={`text-xs px-2.5 py-1 rounded-lg border font-medium inline-block ${roleColors[roleName] || roleColors.viewer}`}>
                          {roleLabels[roleName] || roleName}
                        </span>
                      </td>

                      <td className="p-4">
                        {u.is_active !== false ? (
                          <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                            <CheckCircle2 className="w-4 h-4" />
                            نشط ومفعل
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-xs text-slate-500">
                            <XCircle className="w-4 h-4" />
                            معطل مؤقتاً
                          </span>
                        )}
                      </td>

                      <td className="p-4 font-mono text-xs text-slate-300" style={{ direction: 'ltr', textAlign: 'right' }}>
                        {u.created_at ? new Date(u.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' }) : '—'}
                      </td>

                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="p-2 rounded-xl bg-slate-800 hover:bg-blue-600/30 text-slate-300 hover:text-blue-300 transition"
                            title="تعديل المستخدم"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          {u.id !== currentUser?.id && (
                            <button
                              onClick={() => handleDelete(u.id, u.name)}
                              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-600/30 text-slate-300 hover:text-rose-300 transition"
                              title="حذف المستخدم"
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
        )}
      </div>

      {/* ── CREATE / EDIT MODAL ────────────────────────────────────── */}
      {modalOpen && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md"
          style={{ direction: 'rtl', top: 0, left: 0, right: 0, bottom: 0, margin: 0 }}
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[88vh] overflow-hidden my-auto text-right"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 shrink-0 bg-slate-900/95">
              <h3 className="text-base font-bold text-white">
                {editingUser ? 'تعديل بيانات المستخدم' : 'إضافة مستخدم جديد'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden m-0">
              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">الاسم الثلاثي أو الكامل *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: م. نجم الدين اليافوز"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">البريد الإلكتروني المهني *</label>
                  <input
                    type="email"
                    required
                    placeholder="name@organization.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    {editingUser ? 'تغيير كلمة المرور (اتركها فارغة للإبقاء على الحالية)' : 'كلمة المرور *'}
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">الدور والصلاحية (Role)</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                    >
                      <option value="super_admin">مدير عام النظام (Super Admin)</option>
                      <option value="it_manager">مدير إدارة IT (IT Manager)</option>
                      <option value="it_staff">مسؤول أرشفة ودعم (Archivist)</option>
                      <option value="viewer">مشاهد ومستطلع (Viewer)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">القسم أو الفرع التابع</label>
                    <select
                      value={formData.department_id}
                      onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                      className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                    >
                      <option value="">اختر القسم أو الفرع...</option>
                      {departments.filter(d => !d.parent_id).map(root => {
                        const branches = departments.filter(d => d.parent_id === root.id);
                        return (
                          <optgroup key={root.id} label={`🏛️ ${root.name_ar || root.name} (${root.code})`}>
                            <option value={root.id}>
                              {root.name_ar || root.name} (الإدارة المركزية)
                            </option>
                            {branches.map(b => (
                              <option key={b.id} value={b.id}>
                                &nbsp;&nbsp;&nbsp;&nbsp;↳ {b.name_ar || b.name} ({b.code})
                              </option>
                            ))}
                          </optgroup>
                        );
                      })}
                    </select>
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="user-status-toggle"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="user-status-toggle" className="text-xs font-medium text-slate-300 cursor-pointer">
                    حساب نشط ومصرح له بالدخول للنظام
                  </label>
                </div>
              </div>

              {/* Fixed Footer */}
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-slate-900/95 shrink-0">
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
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition shadow-lg shadow-blue-600/20 disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'جاري الحفظ...' : editingUser ? 'تحديث البيانات' : 'إنشاء الحساب'}
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
