import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { usersAPI, rolesAPI, departmentsAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import {
  Users, UserPlus, Search, Shield, Building2, Mail,
  CheckCircle2, XCircle, Edit3, Trash2,
  Lock, KeyRound, ShieldCheck, UserCheck, AlertCircle, X,
  UserX, RefreshCw, Power, ChevronDown, ChevronRight, ShieldAlert
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function UsersPage() {
  const { user: currentUser, hasPermission } = useAuthStore();

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'inactive'

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    password_confirmation: '',
    department_id: '',
    role: 'it_staff',
    is_active: true,
  });
  const [saving, setSaving] = useState(false);

  // Password reset modal
  const [resetUser, setResetUser] = useState(null);
  const [resetForm, setResetForm] = useState({ password: '', password_confirmation: '' });
  const [resetting, setResetting] = useState(false);

  // Per-user permission overrides modal
  const [permUser, setPermUser] = useState(null);
  const [permData, setPermData] = useState(null);
  const [permLoading, setPermLoading] = useState(false);
  const [permSaving, setPermSaving] = useState(false);
  const [permOverrides, setPermOverrides] = useState({});
  const [permSearch, setPermSearch] = useState('');
  const [permOnlyOverrides, setPermOnlyOverrides] = useState(false);
  const [permCollapsed, setPermCollapsed] = useState({});

  const isSuperAdmin = currentUser?.is_super_admin || currentUser?.roles?.some(r => r.name === 'super_admin');
  const canView = isSuperAdmin || hasPermission('users.view');
  const canCreate = isSuperAdmin || hasPermission('users.create');
  const canUpdate = isSuperAdmin || hasPermission('users.update');
  const canDelete = isSuperAdmin || hasPermission('users.delete');
  const canChangeStatus = isSuperAdmin || hasPermission('users.change_status');
  const canResetPassword = isSuperAdmin || hasPermission('users.reset_password');
  const canAssignPermissions = isSuperAdmin || hasPermission('roles.assign') || hasPermission('roles.manage');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setPermissionDenied(false);

      const [usersRes, rolesRes, depsRes] = await Promise.all([
        usersAPI.list({ per_page: 100 }).catch((err) => {
          if (err.response?.status === 403) setPermissionDenied(true);
          return { data: { data: [] } };
        }),
        rolesAPI.list().catch(() => ({ data: [] })),
        departmentsAPI.list().catch(() => ({ data: [] })),
      ]);

      // Normalize Users list (handles Laravel paginated object { data: [...] } and flat array)
      const rawUsers = usersRes.data?.data;
      let userList = [];
      if (Array.isArray(rawUsers)) {
        userList = rawUsers;
      } else if (Array.isArray(rawUsers?.data)) {
        userList = rawUsers.data;
      } else if (Array.isArray(usersRes.data)) {
        userList = usersRes.data;
      }
      setUsers(userList);

      // Normalize Roles list
      const rawRoles = rolesRes.data?.data;
      const roleList = Array.isArray(rawRoles) ? rawRoles : (Array.isArray(rolesRes.data) ? rolesRes.data : []);
      setRoles(roleList);

      // Normalize Departments list
      const rawDeps = depsRes.data?.data;
      const depList = Array.isArray(rawDeps) ? rawDeps : (Array.isArray(depsRes.data) ? depsRes.data : []);
      setDepartments(depList);
    } catch (err) {
      console.error('Failed to load users data:', err);
      toast.error('حدث خطأ أثناء تحميل بيانات المستخدمين');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      username: '',
      email: '',
      password: '',
      password_confirmation: '',
      department_id: currentUser?.department?.id || currentUser?.department_id || departments[0]?.id || '',
      role: 'it_staff',
      is_active: true,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (u) => {
    setEditingUser(u);
    const primaryRole = u.roles?.[0]?.name;
    const mappedRole = primaryRole === 'admin' ? 'it_manager' : (primaryRole || 'it_staff');
    setFormData({
      name: u.name || '',
      username: u.username || '',
      email: u.email || '',
      password: '',
      password_confirmation: '',
      department_id: u.department_id || '',
      role: mappedRole,
      is_active: u.status === 'active' || u.is_active !== false,
    });
    setModalOpen(true);
  };

  const handleToggleStatus = async (user) => {
    if (user.id === currentUser?.id) {
      toast.error('لا يمكنك تعطيل حسابك الشخصي الحالي');
      return;
    }
    const isCurrentlyActive = user.status === 'active' || user.is_active !== false;
    const nextStatus = isCurrentlyActive ? 'inactive' : 'active';
    try {
      await usersAPI.changeStatus(user.id, { status: nextStatus });
      toast.success(nextStatus === 'active' ? 'تم تنشيط الحساب بنجاح' : 'تم تعطيل الحساب وإنهاء جلساته');
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.message || 'فشل تحديث حالة الحساب';
      toast.error(msg);
    }
  };

  const handleOpenReset = (user) => {
    setResetUser(user);
    setResetForm({ password: '', password_confirmation: '' });
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetForm.password || resetForm.password.length < 8) {
      toast.error('كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل');
      return;
    }
    if (resetForm.password !== resetForm.password_confirmation) {
      toast.error('كلمتا المرور غير متطابقتين');
      return;
    }
    try {
      setResetting(true);
      await usersAPI.resetPassword(resetUser.id, resetForm);
      toast.success('تم إعادة تعيين كلمة المرور وإنهاء جلسات المستخدم');
      setResetUser(null);
    } catch (err) {
      const validationErrors = err.response?.data?.errors;
      toast.error(validationErrors ? Object.values(validationErrors).flat()[0] : (err.response?.data?.message || 'فشل إعادة تعيين كلمة المرور'));
    } finally {
      setResetting(false);
    }
  };

  const handleOpenPermissions = async (user) => {
    setPermUser(user);
    setPermData(null);
    setPermOverrides({});
    setPermSearch('');
    setPermOnlyOverrides(false);
    setPermCollapsed({});
    setPermLoading(true);
    try {
      const res = await usersAPI.permissions(user.id);
      const data = res.data?.data || null;
      const map = {};
      (data?.modules || []).forEach((m) => m.permissions.forEach((p) => {
        if (p.override === 'grant' || p.override === 'deny') map[p.id] = p.override;
      }));
      setPermData(data);
      setPermOverrides(map);
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل تحميل شجرة الصلاحيات');
      setPermUser(null);
    } finally {
      setPermLoading(false);
    }
  };

  const setOverride = (permissionId, effect) => {
    setPermOverrides((prev) => {
      const next = { ...prev };
      if (!effect) delete next[permissionId];
      else next[permissionId] = effect;
      return next;
    });
  };

  const handleSavePermissions = async () => {
    if (!permUser) return;
    try {
      setPermSaving(true);
      const overrides = Object.entries(permOverrides).map(([id, effect]) => ({
        permission_id: Number(id),
        effect,
      }));
      await usersAPI.updatePermissions(permUser.id, overrides);
      toast.success('تم تحديث الصلاحيات الفردية بنجاح');
      setPermUser(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل حفظ الصلاحيات الفردية');
    } finally {
      setPermSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error('يرجى ملء الحقول الإلزامية');
      return;
    }

    if (!formData.department_id) {
      toast.error('يجب تحديد القسم أو الفرع التابع للمستخدم');
      return;
    }

    if (!editingUser) {
      if (!formData.password) {
        toast.error('يرجى تعيين كلمة مرور للمستخدم الجديد');
        return;
      }
      if (formData.password.length < 8) {
        toast.error('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
        return;
      }
    } else {
      if (formData.password && formData.password.length < 8) {
        toast.error('كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل');
        return;
      }
    }

    try {
      setSaving(true);
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        department_id: formData.department_id ? parseInt(formData.department_id) : null,
        roles: [formData.role],
        is_active: formData.is_active,
        status: formData.is_active ? 'active' : 'inactive',
      };

      if (formData.username.trim()) {
        payload.username = formData.username.trim();
      }

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
      const validationErrors = err.response?.data?.errors;
      if (validationErrors) {
        const firstErr = Object.values(validationErrors).flat()[0];
        toast.error(firstErr);
      } else {
        toast.error(err.response?.data?.message || 'فشل حفظ بيانات المستخدم');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (id === currentUser?.id) {
      toast.error('لا يمكنك حذف حسابك الشخصي الحالي');
      return;
    }
    if (!window.confirm(`هل أنت متأكد من حذف حساب المستخدم "${name}" نهائياً من النظام؟`)) return;

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

  // Safe Filtering
  const safeUsers = Array.isArray(users) ? users : [];
  const filteredUsers = safeUsers.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.username?.toLowerCase().includes(q);

    const matchesRole = !roleFilter || u.roles?.some((r) => r.name === roleFilter);

    const isActive = u.status === 'active' || u.is_active !== false;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && isActive) ||
      (statusFilter === 'inactive' && !isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Calculate statistics
  const totalUsersCount = safeUsers.length;
  const activeUsersCount = safeUsers.filter((u) => u.status === 'active' || u.is_active !== false).length;
  const adminManagersCount = safeUsers.filter((u) =>
    u.roles?.some((r) => ['super_admin', 'it_manager', 'admin'].includes(r.name))
  ).length;
  const staffCount = safeUsers.filter((u) =>
    u.roles?.some((r) => r.name === 'it_staff')
  ).length;

  // Filtered permission modules for the per-user overrides modal
  const permModules = useMemo(() => {
    if (!permData?.modules) return [];
    const q = permSearch.trim().toLowerCase();
    return permData.modules
      .map((m) => {
        const filteredPermissions = m.permissions.filter((p) => {
          const matchesSearch =
            !q ||
            (p.display_name_ar || '').toLowerCase().includes(q) ||
            (p.name || '').toLowerCase().includes(q);
          const matchesOverride = !permOnlyOverrides || !!permOverrides[p.id];
          return matchesSearch && matchesOverride;
        });
        return { ...m, filteredPermissions };
      })
      .filter((m) => m.filteredPermissions.length > 0);
  }, [permData, permSearch, permOnlyOverrides, permOverrides]);

  const togglePermModule = (key) =>
    setPermCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));

  if (permissionDenied && !canView) {
    return (
      <div className="space-y-6 pb-12 animate-fade-in" style={{ direction: 'rtl' }}>
        <div className="bg-slate-900/60 p-8 rounded-2xl border border-rose-500/30 text-center max-w-xl mx-auto my-12">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-white mb-2">صلاحية الوصول غير متوفرة</h2>
          <p className="text-xs text-slate-400 leading-relaxed mb-6">
            عذراً، حسابك الحالي لا يمتلك صلاحية استعراض وإدارة المستخدمين (<code className="text-rose-300 font-mono">users.view</code>).
            يرجى مراجعة مدير النظام للحصول على الصلاحيات المطلوبة.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition"
          >
            العودة للوحة التحكم
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-fade-in" style={{ direction: 'rtl' }}>
      {/* ── Page Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">إدارة المستخدمين وحسابات النظام</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                التحكم بحسابات موظفي ومسؤولي الأرشيف الإلكتروني، توزيع الصلاحيات والتحكم بالأدوار
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
            title="تحديث البيانات"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-400' : ''}`} />
          </button>

          <Link
            to="/roles"
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs sm:text-sm transition"
          >
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            مصفوفة الصلاحيات
          </Link>

          {canCreate && (
            <button
              onClick={handleOpenCreate}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 sm:py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm transition shadow-lg shadow-blue-600/20 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              إضافة مستخدم جديد
            </button>
          )}
        </div>
      </div>

      {/* ── KPI Stat Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="glass card-hover-lift glow-on-hover p-4 flex items-center gap-3.5 group">
          <div className="w-11 h-11 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 shadow-lg">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium group-hover:text-blue-300 transition-colors">إجمالي المستخدمين</div>
            <div className="text-xl font-black text-white font-mono mt-0.5">{totalUsersCount}</div>
          </div>
        </div>

        <div className="glass card-hover-lift glow-on-hover p-4 flex items-center gap-3.5 group">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 shadow-lg">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium group-hover:text-emerald-300 transition-colors">الحسابات النشطة</div>
            <div className="text-xl font-black text-emerald-400 font-mono mt-0.5">{activeUsersCount}</div>
          </div>
        </div>

        <div className="glass card-hover-lift glow-on-hover p-4 flex items-center gap-3.5 group">
          <div className="w-11 h-11 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 shadow-lg">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium group-hover:text-purple-300 transition-colors">الإدارة والتحكم</div>
            <div className="text-xl font-black text-purple-400 font-mono mt-0.5">{adminManagersCount}</div>
          </div>
        </div>

        <div className="glass card-hover-lift glow-on-hover p-4 flex items-center gap-3.5 group">
          <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 shadow-lg">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium group-hover:text-amber-300 transition-colors">مسؤولو الأرشفة والدعم</div>
            <div className="text-xl font-black text-amber-400 font-mono mt-0.5">{staffCount}</div>
          </div>
        </div>
      </div>

      {/* ── Filters & Search Bar ───────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-3.5 items-stretch lg:items-center justify-between bg-slate-900/40 p-3.5 rounded-2xl border border-slate-800/80">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute right-3.5 top-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="بحث بالاسم، المعرّف أو البريد..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pr-10 pl-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800 shrink-0">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                statusFilter === 'all'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              الكل ({totalUsersCount})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                statusFilter === 'active'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              نشط ({activeUsersCount})
            </button>
            <button
              onClick={() => setStatusFilter('inactive')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                statusFilter === 'inactive'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              معطل ({totalUsersCount - activeUsersCount})
            </button>
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full sm:w-auto bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500 shrink-0"
          >
            <option value="">جميع الأدوار والصلاحيات</option>
            {roles.length > 0 ? (
              roles.map((r) => (
                <option key={r.id} value={r.name}>
                  {r.display_name_ar || r.display_name || roleLabels[r.name] || r.name}
                </option>
              ))
            ) : (
              <>
                <option value="super_admin">مدير عام النظام (Super Admin)</option>
                <option value="it_manager">مدير إدارة IT (IT Manager)</option>
                <option value="it_staff">مسؤول أرشفة ودعم (Archivist)</option>
                <option value="viewer">مشاهد ومستطلع (Viewer)</option>
              </>
            )}
          </select>
        </div>

        <div className="text-xs text-slate-400 flex items-center gap-1.5 self-end lg:self-center">
          <span>النتائج المعروضة:</span>
          <strong className="text-blue-400 font-mono text-sm">{filteredUsers.length}</strong>
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
            <p className="text-sm font-semibold text-slate-300">لم يتم العثور على أي مستخدمين مطابقين</p>
            <p className="text-xs text-slate-500 mt-1">جرّب تغيير كلمات البحث أو إعادة ضبط خيارات الفرز والتصفية</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-950/70 border-b border-slate-800 text-xs font-semibold text-slate-400">
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
                  const roleObj = u.roles?.[0];
                  const roleName = roleObj?.name || 'viewer';
                  const roleLabel = roleObj?.display_name_ar || roleLabels[roleName] || roleName;
                  const isActive = u.status === 'active' || u.is_active !== false;
                  const isSuspended = u.status === 'suspended';

                  const initials = (u.name || 'م')
                    .trim()
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((n) => n[0] || '')
                    .join('')
                    .toUpperCase() || 'U';

                  return (
                    <tr key={u.id} className="hover:bg-slate-800/35 transition">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-md shadow-blue-500/20 shrink-0">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-100 flex items-center gap-1.5 truncate">
                              <span>{u.name}</span>
                              {u.id === currentUser?.id && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                  أنت
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                              <span>{u.email}</span>
                              {u.username && (
                                <span className="text-slate-500 text-[11px]">(@{u.username})</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="truncate">{u.department?.name_ar || u.department?.name || 'قسم تقنية المعلومات'}</span>
                        </div>
                      </td>

                      <td className="p-4">
                        <span className={`text-xs px-2.5 py-1 rounded-lg border font-medium inline-block ${roleColors[roleName] || roleColors.viewer}`}>
                          {roleLabel}
                        </span>
                        {u.permission_overrides_count > 0 && (
                          <div className="mt-1.5">
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                              {u.permission_overrides_count} استثناء فردي
                            </span>
                          </div>
                        )}
                      </td>

                      <td className="p-4">
                        <button
                          onClick={() => canChangeStatus && handleToggleStatus(u)}
                          disabled={!canChangeStatus || u.id === currentUser?.id}
                          className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border transition ${
                            isActive
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                              : isSuspended
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20'
                          } ${!canChangeStatus || u.id === currentUser?.id ? 'cursor-default opacity-85' : 'cursor-pointer'}`}
                          title={canChangeStatus && u.id !== currentUser?.id ? 'انقر لتغيير حالة الحساب' : undefined}
                        >
                          {isActive ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>نشط ومفعل</span>
                            </>
                          ) : isSuspended ? (
                            <>
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span>موقوف إدارياً</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5" />
                              <span>معطل مؤقتاً</span>
                            </>
                          )}
                        </button>
                      </td>

                      <td className="p-4 font-mono text-xs text-slate-400" style={{ direction: 'ltr', textAlign: 'right' }}>
                        {u.created_at ? new Date(u.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' }) : '—'}
                      </td>

                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {canAssignPermissions && u.id !== currentUser?.id && !u.roles?.some((r) => r.name === 'super_admin') && (
                            <button
                              onClick={() => handleOpenPermissions(u)}
                              className="p-2 rounded-xl bg-slate-800 hover:bg-indigo-600/30 text-slate-300 hover:text-indigo-300 border border-slate-700/60 transition cursor-pointer"
                              title="الصلاحيات الفردية (منح / سحب)"
                            >
                              <ShieldCheck className="w-4 h-4" />
                            </button>
                          )}
                          {canUpdate && (
                            <button
                              onClick={() => handleOpenEdit(u)}
                              className="p-2 rounded-xl bg-slate-800 hover:bg-blue-600/30 text-slate-300 hover:text-blue-300 border border-slate-700/60 transition cursor-pointer"
                              title="تعديل بيانات المستخدم"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          )}
                          {canResetPassword && u.id !== currentUser?.id && (
                            <button
                              onClick={() => handleOpenReset(u)}
                              className="p-2 rounded-xl bg-slate-800 hover:bg-amber-600/30 text-slate-300 hover:text-amber-300 border border-slate-700/60 transition cursor-pointer"
                              title="إعادة تعيين كلمة المرور"
                            >
                              <KeyRound className="w-4 h-4" />
                            </button>
                          )}
                          {canDelete && u.id !== currentUser?.id && (
                            <button
                              onClick={() => handleDelete(u.id, u.name)}
                              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-600/30 text-slate-300 hover:text-rose-300 border border-slate-700/60 transition cursor-pointer"
                              title="حذف المستخدم نهائياً"
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
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md"
          style={{ direction: 'rtl', top: 0, left: 0, right: 0, bottom: 0, margin: 0 }}
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-[#0c1427] border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden my-auto text-right"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 shrink-0 bg-[#0c1427]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-white">
                  {editingUser ? 'تعديل بيانات المستخدم' : 'إضافة مستخدم جديد'}
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
                    className="w-full bg-[#070d1a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">البريد الإلكتروني المهني *</label>
                    <input
                      type="email"
                      required
                      placeholder="name@organization.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-[#070d1a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">اسم المستخدم (Username)</label>
                    <input
                      type="text"
                      placeholder="اختياري (يتم توليده تلقائياً)"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="w-full bg-[#070d1a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    {editingUser ? 'تغيير كلمة المرور (اتركها فارغة للإبقاء على الحالية)' : 'كلمة المرور * (8 أحرف كحد أدنى)'}
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-[#070d1a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">الدور والصلاحية (Role)</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full bg-[#070d1a] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                    >
                      {roles.length > 0 ? (
                        roles.map((r) => (
                          <option key={r.id} value={r.name}>
                            {r.display_name_ar || r.display_name || roleLabels[r.name] || r.name}
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="super_admin">مدير عام النظام (Super Admin)</option>
                          <option value="it_manager">مدير إدارة IT (IT Manager)</option>
                          <option value="it_staff">مسؤول أرشفة ودعم (Archivist)</option>
                          <option value="viewer">مشاهد ومستطلع (Viewer)</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">القسم أو الفرع التابع <span className="text-rose-400">*</span></label>
                    <select
                      value={formData.department_id}
                      onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                      className="w-full bg-[#070d1a] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                    >
                      <option value="">اختر القسم أو الفرع...</option>
                      {departments.filter(d => !d.parent_id).map(root => {
                        const branches = departments.filter(d => d.parent_id === root.id);
                        return (
                          <optgroup key={root.id} label={`🏛️ ${root.name_ar || root.name} (${root.code || ''})`}>
                            <option value={root.id}>
                              {root.name_ar || root.name} (الإدارة المركزية)
                            </option>
                            {branches.map(b => (
                              <option key={b.id} value={b.id}>
                                &nbsp;&nbsp;&nbsp;&nbsp;↳ {b.name_ar || b.name} ({b.code || ''})
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
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-[#0c1427] shrink-0">
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

      {/* ── RESET PASSWORD MODAL ───────────────────────────────────── */}
      {resetUser && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md"
          style={{ direction: 'rtl', top: 0, left: 0, right: 0, bottom: 0, margin: 0 }}
          onClick={() => setResetUser(null)}
        >
          <div
            className="bg-[#0c1427] border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden my-auto text-right"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">إعادة تعيين كلمة المرور</h3>
                  <p className="text-xs text-slate-400">{resetUser.name} — {resetUser.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setResetUser(null)}
                className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="p-6 space-y-4">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 leading-relaxed">
                سيتم إنهاء جميع جلسات المستخدم النشطة فوراً، وسيلزمه تسجيل الدخول بكلمة المرور الجديدة.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">كلمة المرور الجديدة *</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={resetForm.password}
                  onChange={(e) => setResetForm({ ...resetForm, password: e.target.value })}
                  placeholder="8 أحرف كحد أدنى"
                  className="w-full bg-[#070d1a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">تأكيد كلمة المرور *</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={resetForm.password_confirmation}
                  onChange={(e) => setResetForm({ ...resetForm, password_confirmation: e.target.value })}
                  placeholder="أعد إدخال كلمة المرور"
                  className="w-full bg-[#070d1a] border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setResetUser(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={resetting}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold transition shadow-lg shadow-amber-600/20 disabled:opacity-50 cursor-pointer"
                >
                  {resetting ? 'جاري التعيين...' : 'تعيين كلمة المرور'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ── PER-USER PERMISSION OVERRIDES MODAL ────────────────────── */}
      {permUser && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md"
          style={{ direction: 'rtl', top: 0, left: 0, right: 0, bottom: 0, margin: 0 }}
          onClick={() => !permSaving && setPermUser(null)}
        >
          <div
            className="bg-[#0c1427] border border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto text-right"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 shrink-0 bg-[#0c1427]">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-white truncate">الصلاحيات الفردية — {permUser.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">
                    استثناءات خاصة فوق صلاحيات الأدوار (منح / سحب صريح)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !permSaving && setPermUser(null)}
                className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition flex items-center justify-center cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {permLoading ? (
              <div className="flex flex-col items-center justify-center p-16 text-slate-400">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-xs font-medium">جاري تحميل شجرة الصلاحيات...</p>
              </div>
            ) : !permData ? (
              <div className="p-12 text-center text-slate-400 text-sm">تعذر تحميل بيانات الصلاحيات.</div>
            ) : (
              <>
                {/* Summary */}
                <div className="px-6 py-4 border-b border-slate-800/80 space-y-3 shrink-0 bg-slate-950/20">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] text-slate-400">الأدوار:</span>
                    {permData.user?.roles?.length ? permData.user.roles.map((r) => (
                      <span key={r.id} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        {r.display_name_ar || r.name}
                      </span>
                    )) : (
                      <span className="text-[10px] text-rose-400">بدون دور — الصلاحيات الفردية فقط</span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-[11px]">
                    <span className="text-emerald-400 font-mono">{permData.effective_count}/{permData.total_permissions}</span>
                    <span className="text-slate-500">صلاحية مفعّلة</span>
                    <span className="text-indigo-300 font-mono">{Object.keys(permOverrides).length}</span>
                    <span className="text-slate-500">استثناء فردي</span>
                  </div>
                  <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-amber-200/90 leading-relaxed">
                      السحب الصريح يتغلب على صلاحية الدور. "موروثة" تعني إزالة الاستثناء والرجوع لصلاحيات الأدوار.
                      تعديل الصلاحيات الفردية يُسجَّل في سجل التدقيق.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={permSearch}
                        onChange={(e) => setPermSearch(e.target.value)}
                        placeholder="ابحث باسم الصلاحية أو رمزها..."
                        className="w-full bg-[#070d1a] border border-slate-800 rounded-xl pr-9 pl-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setPermOnlyOverrides((v) => !v)}
                      className={`px-3 py-2 rounded-xl text-[11px] font-semibold border transition cursor-pointer shrink-0 ${
                        permOnlyOverrides
                          ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      الاستثناءات فقط
                    </button>
                  </div>
                </div>

                {/* Modules */}
                <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-3">
                  {permModules.length === 0 ? (
                    <div className="p-10 text-center text-slate-500 text-sm">لا توجد صلاحيات مطابقة.</div>
                  ) : permModules.map((module) => {
                    const isCollapsed = Boolean(permCollapsed[module.key]);
                    const moduleOverrides = module.permissions.filter((p) => permOverrides[p.id]).length;

                    return (
                      <div key={module.key} className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => togglePermModule(module.key)}
                          className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-slate-950/50 hover:bg-slate-900/70 transition cursor-pointer"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {isCollapsed ? (
                              <ChevronRight className="w-4 h-4 text-slate-400 rotate-180 shrink-0" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                            )}
                            <span className="text-sm font-bold text-slate-100 truncate">{module.label_ar}</span>
                            <span className="text-[10px] text-slate-500 shrink-0">
                              {module.filteredPermissions.length}/{module.total_count}
                            </span>
                            {moduleOverrides > 0 && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 shrink-0">
                                {moduleOverrides} استثناء
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500 shrink-0">
                            مفعّل {module.effective_count}/{module.total_count}
                          </span>
                        </button>

                        {!isCollapsed && (
                          <div className="p-3 space-y-2">
                            {module.filteredPermissions.map((perm) => {
                              const override = permOverrides[perm.id] || null;
                              const effectiveNow = permData.is_super_admin
                                || (override ? override === 'grant' : perm.inherited);

                              return (
                                <div
                                  key={perm.id}
                                  className="p-3 rounded-xl border border-slate-800 bg-slate-950/40 flex flex-col sm:flex-row sm:items-center gap-3"
                                >
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className={`w-2 h-2 rounded-full shrink-0 ${effectiveNow ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                                      <span className="text-xs font-bold text-slate-100">
                                        {perm.display_name_ar || perm.display_name}
                                      </span>
                                      <RiskPill level={perm.risk_level} />
                                      {override === 'deny' ? (
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/30">مسحوب</span>
                                      ) : override === 'grant' ? (
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">منح خاص</span>
                                      ) : perm.inherited ? (
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">من الدور</span>
                                      ) : (
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-600 border border-slate-800">غير ممنوحة</span>
                                      )}
                                    </div>
                                    <div className="font-mono text-[10px] text-slate-500 truncate mt-1" dir="ltr">
                                      {perm.name}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-0.5 bg-slate-950 border border-slate-800 rounded-lg p-0.5 shrink-0 self-start sm:self-auto">
                                    {[
                                      { value: null, label: 'موروثة' },
                                      { value: 'grant', label: 'منح' },
                                      { value: 'deny', label: 'سحب' },
                                    ].map((option) => {
                                      const active = override === option.value;
                                      const activeClass = option.value === 'deny'
                                        ? 'bg-rose-600 text-white'
                                        : option.value === 'grant'
                                          ? 'bg-indigo-600 text-white'
                                          : 'bg-slate-700 text-white';

                                      return (
                                        <button
                                          key={option.label}
                                          type="button"
                                          onClick={() => setOverride(perm.id, option.value)}
                                          className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                                            active ? activeClass : 'text-slate-400 hover:text-slate-200'
                                          }`}
                                        >
                                          {option.label}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Footer */}
                <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-slate-800 shrink-0 bg-[#0c1427]">
                  <span className="text-[11px] text-slate-500">
                    {Object.keys(permOverrides).length} استثناء سيُحفظ
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPermOverrides({})}
                      disabled={permSaving}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer disabled:opacity-50"
                    >
                      مسح الاستثناءات
                    </button>
                    <button
                      type="button"
                      onClick={() => setPermUser(null)}
                      disabled={permSaving}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer disabled:opacity-50"
                    >
                      إلغاء
                    </button>
                    <button
                      type="button"
                      onClick={handleSavePermissions}
                      disabled={permSaving}
                      className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/20 disabled:opacity-50 cursor-pointer"
                    >
                      {permSaving ? 'جاري الحفظ...' : 'حفظ الصلاحيات'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

const RISK_STYLES = {
  normal: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
  warning: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  critical: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
};

const RISK_LABELS = { normal: 'عادي', warning: 'حساس', critical: 'حرج' };

function RiskPill({ level }) {
  const key = RISK_STYLES[level] ? level : 'normal';
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold shrink-0 ${RISK_STYLES[key]}`}>
      {RISK_LABELS[key]}
    </span>
  );
}
