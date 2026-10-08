import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { rolesAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import {
  ShieldCheck, Shield, ShieldAlert, KeyRound, CheckSquare, Square,
  MinusSquare, ChevronDown, ChevronRight, Search, Plus, Trash2,
  Edit3, Save, RotateCcw, FileText, Paperclip, History,
  MessageSquare, GitMerge, FolderTree, Layers, Building2,
  Globe, Users, BarChart3, Activity, Settings, AlertTriangle,
  CheckCircle2, Info, Lock, Sparkles, Filter, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

// Icon mapping helper
const MODULE_ICONS = {
  FileText,
  Paperclip,
  History,
  MessageSquare,
  GitMerge,
  FolderTree,
  Layers,
  Building2,
  Globe,
  Users,
  ShieldCheck,
  BarChart3,
  Activity,
  Settings,
};

export default function RolesPage() {
  const { user: currentUser } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [treeData, setTreeData] = useState({ modules: [], total_permissions: 0 });
  const [selectedPermissions, setSelectedPermissions] = useState(new Set());
  const [initialPermissions, setInitialPermissions] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState('all'); // all, normal, warning, critical
  const [collapsedModules, setCollapsedModules] = useState({});
  const [mobileTab, setMobileTab] = useState('permissions'); // 'roles' | 'permissions'

  // New role modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [newRoleData, setNewRoleData] = useState({
    name: '',
    display_name: '',
    display_name_ar: '',
    description: '',
    clone_from_id: '',
  });
  const [creatingRole, setCreatingRole] = useState(false);

  // Edit role modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editRoleData, setEditRoleData] = useState({
    id: null,
    display_name_ar: '',
    display_name: '',
    description: '',
  });
  const [updatingRole, setUpdatingRole] = useState(false);

  // Load roles & permissions tree
  const loadData = async () => {
    setLoading(true);
    try {
      const [rolesRes, treeRes] = await Promise.all([
        rolesAPI.list(),
        rolesAPI.permissionsTree(),
      ]);

      const rolesList = rolesRes.data?.data || rolesRes.data || [];
      const tree = treeRes.data?.data || { modules: [], total_permissions: 0 };

      setRoles(rolesList);
      setTreeData(tree);

      if (rolesList.length > 0) {
        // default select it_manager or the first editable role if available, or first
        const defaultRole = rolesList.find((r) => r.name === 'it_manager') || rolesList[0];
        selectRole(defaultRole);
      }
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ أثناء تحميل بيانات شجرة الصلاحيات والأدوار');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectRole = (role) => {
    setSelectedRole(role);
    setMobileTab('permissions');
    const permNames = new Set((role.permissions || []).map((p) => (typeof p === 'string' ? p : p.name)));
    setSelectedPermissions(new Set(permNames));
    setInitialPermissions(new Set(permNames));
  };

  // Check if there are unsaved changes
  const hasChanges = useMemo(() => {
    if (!selectedRole || selectedRole.name === 'super_admin') return false;
    if (selectedPermissions.size !== initialPermissions.size) return true;
    for (const p of selectedPermissions) {
      if (!initialPermissions.has(p)) return true;
    }
    return false;
  }, [selectedPermissions, initialPermissions, selectedRole]);

  // Toggle single permission
  const togglePermission = (permName) => {
    if (selectedRole?.name === 'super_admin') return;

    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      if (next.has(permName)) {
        next.delete(permName);
      } else {
        next.add(permName);
      }
      return next;
    });
  };

  // Toggle all permissions within a module
  const toggleModuleAll = (modulePerms) => {
    if (selectedRole?.name === 'super_admin') return;

    const modulePermNames = modulePerms.map((p) => p.name);
    const allSelected = modulePermNames.every((name) => selectedPermissions.has(name));

    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        modulePermNames.forEach((name) => next.delete(name));
      } else {
        modulePermNames.forEach((name) => next.add(name));
      }
      return next;
    });
  };

  // Global Select All / Clear All
  const handleSelectAll = () => {
    if (selectedRole?.name === 'super_admin') return;
    const all = new Set();
    treeData.modules.forEach((mod) => {
      mod.permissions.forEach((p) => all.add(p.name));
    });
    setSelectedPermissions(all);
  };

  const handleDeselectAll = () => {
    if (selectedRole?.name === 'super_admin') return;
    setSelectedPermissions(new Set());
  };

  // Expand / Collapse all
  const toggleCollapseAll = (collapse) => {
    const newState = {};
    treeData.modules.forEach((mod) => {
      newState[mod.key] = collapse;
    });
    setCollapsedModules(newState);
  };

  // Toggle single module collapse
  const toggleModuleCollapse = (moduleKey) => {
    setCollapsedModules((prev) => ({
      ...prev,
      [moduleKey]: !prev[moduleKey],
    }));
  };

  // Save changes
  const handleSavePermissions = async () => {
    if (!selectedRole) return;
    setSaving(true);
    try {
      const res = await rolesAPI.update(selectedRole.id, {
        permissions: Array.from(selectedPermissions),
      });

      toast.success(`تم حفظ شجرة الصلاحيات بنجاح للدور: ${selectedRole.display_name_ar}`);
      setInitialPermissions(new Set(selectedPermissions));

      // Update in local roles list
      const updatedRole = res.data?.data;
      if (updatedRole) {
        setRoles((prev) => prev.map((r) => (r.id === updatedRole.id ? updatedRole : r)));
        setSelectedRole(updatedRole);
      }
    } catch (err) {
      console.error(err);
      toast.error('حدث خطأ أثناء حفظ الصلاحيات. يرجى المحاولة ثانية.');
    } finally {
      setSaving(false);
    }
  };

  // Create new custom role
  const handleCreateRole = async (e) => {
    e.preventDefault();
    const titleAr = newRoleData.display_name_ar?.trim();
    if (!titleAr) {
      toast.error('يرجى كتابة مسمى الدور الوظيفي بالعربية');
      return;
    }

    setCreatingRole(true);
    try {
      const payload = {
        display_name_ar: titleAr,
        display_name: newRoleData.display_name?.trim() || titleAr,
        name: newRoleData.name?.trim() || undefined,
        description: newRoleData.description?.trim() || null,
        clone_from_id: newRoleData.clone_from_id ? Number(newRoleData.clone_from_id) : undefined,
        permissions: [],
      };

      const res = await rolesAPI.create(payload);
      const created = res.data?.data;
      toast.success(`تم إنشاء الدور "${titleAr}" بنجاح`);

      if (created) {
        setRoles((prev) => [...prev, created]);
        selectRole(created);
      }
      setIsModalOpen(false);
      setShowAdvanced(false);
      setNewRoleData({
        name: '',
        display_name: '',
        display_name_ar: '',
        description: '',
        clone_from_id: '',
      });
    } catch (err) {
      console.error(err);
      const errors = err.response?.data?.errors;
      if (errors && typeof errors === 'object') {
        const firstErr = Object.values(errors).flat()[0];
        toast.error(firstErr || 'تعذر إنشاء الدور');
      } else {
        const msg = err.response?.data?.message || 'فشل إنشاء الدور';
        toast.error(msg);
      }
    } finally {
      setCreatingRole(false);
    }
  };

  // Open edit modal
  const openEditModal = (role) => {
    setEditRoleData({
      id: role.id,
      display_name_ar: role.display_name_ar || '',
      display_name: role.display_name || '',
      description: role.description || '',
    });
    setIsEditModalOpen(true);
  };

  // Save role info updates
  const handleUpdateRoleInfo = async (e) => {
    e.preventDefault();
    const titleAr = editRoleData.display_name_ar?.trim();
    if (!titleAr) {
      toast.error('يرجى كتابة مسمى الدور الوظيفي بالعربية');
      return;
    }

    setUpdatingRole(true);
    try {
      const res = await rolesAPI.update(editRoleData.id, {
        display_name_ar: titleAr,
        display_name: editRoleData.display_name?.trim() || titleAr,
        description: editRoleData.description?.trim() || null,
      });

      toast.success('تم تحديث بيانات الدور الوظيفي بنجاح');
      const updated = res.data?.data;
      if (updated) {
        setRoles((prev) => prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)));
        if (selectedRole?.id === updated.id) {
          setSelectedRole((prev) => ({ ...prev, ...updated }));
        }
      }
      setIsEditModalOpen(false);
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'فشل تحديث بيانات الدور';
      toast.error(msg);
    } finally {
      setUpdatingRole(false);
    }
  };

  // Delete custom role
  const handleDeleteRole = async (role) => {
    if (role.is_system) {
      toast.error('لا يمكن حذف الأدوار الأساسية للنظام');
      return;
    }

    if (!window.confirm(`هل أنت متأكد من حذف الدور: ${role.display_name_ar}؟`)) return;

    try {
      await rolesAPI.delete(role.id);
      toast.success('تم حذف الدور الوظيفي بنجاح');
      const remaining = roles.filter((r) => r.id !== role.id);
      setRoles(remaining);
      if (selectedRole?.id === role.id && remaining.length > 0) {
        selectRole(remaining[0]);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'فشل حذف الدور';
      toast.error(msg);
    }
  };

  // Filtered modules and permissions based on search and risk level
  const filteredModules = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return treeData.modules
      .map((mod) => {
        const matchingPerms = mod.permissions.filter((p) => {
          const matchesQuery =
            !q ||
            p.name.toLowerCase().includes(q) ||
            p.display_name_ar.toLowerCase().includes(q) ||
            p.display_name.toLowerCase().includes(q) ||
            (p.description_ar && p.description_ar.toLowerCase().includes(q));

          const matchesRisk =
            riskFilter === 'all' || p.risk_level === riskFilter;

          return matchesQuery && matchesRisk;
        });

        return {
          ...mod,
          filteredPermissions: matchingPerms,
        };
      })
      .filter((mod) => mod.filteredPermissions.length > 0);
  }, [treeData.modules, searchQuery, riskFilter]);

  // Risk Badge Component
  const RiskBadge = ({ level }) => {
    if (level === 'critical') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
          <ShieldAlert className="w-3 h-3" />
          حرج / عالي الخطورة
        </span>
      );
    }
    if (level === 'warning') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <AlertTriangle className="w-3 h-3" />
          متوسط الحساسية
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-800/80 text-slate-400 border border-slate-700/50">
        عادي
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <RefreshCw className="w-10 h-10 text-blue-500 animate-spin" />
        <p className="text-sm text-slate-400 font-medium">جاري تحميل شجرة الصلاحيات ومصفوفة الأدوار...</p>
      </div>
    );
  }

  const isSuperAdminRole = selectedRole?.name === 'super_admin';
  const totalTreePerms = treeData.total_permissions || 56;
  const currentSelectedCount = isSuperAdminRole ? totalTreePerms : selectedPermissions.size;
  const percentage = Math.round((currentSelectedCount / totalTreePerms) * 100);

  return (
    <div className="space-y-6 pb-20 animate-fade-in" style={{ direction: 'rtl' }}>
      {/* ── Page Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              شجرة الصلاحيات ومصفوفة الأدوار (RBAC Matrix)
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            تخصيص الصلاحيات الهرمية الدقيقة لكافة وحدات وعمليات النظام، وإدارة وتعيين الأدوار الوظيفية
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            إنشاء دور وظيفي جديد
          </button>
        </div>
      </div>

      {/* Mobile / Tablet Segmented Switcher (< 1024px) */}
      <div className="flex lg:hidden bg-slate-900/80 p-1.5 rounded-xl border border-slate-800 gap-1">
        <button
          type="button"
          onClick={() => setMobileTab('roles')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
            mobileTab === 'roles' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          الأدوار الوظيفية ({roles.length})
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('permissions')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
            mobileTab === 'permissions' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          شجرة الصلاحيات {selectedRole ? `(${selectedRole.display_name_ar || selectedRole.display_name})` : ''}
        </button>
      </div>

      {/* ── Main Layout: Roles Column + Permissions Tree Column ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Roles List Sidebar (4 Cols) */}
        <div className={`lg:col-span-4 space-y-4 ${mobileTab === 'roles' ? 'block' : 'hidden lg:block'}`}>
          <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-4 backdrop-blur-md space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-blue-400" />
                الأدوار الوظيفية ({roles.length})
              </h2>
              <span className="text-[11px] text-slate-400">اختر دوراً لتخصيص شجرته</span>
            </div>

            <div className="space-y-2">
              {roles.map((role) => {
                const isSelected = selectedRole?.id === role.id;
                const isSystem = role.is_system;

                return (
                  <div
                    key={role.id}
                    onClick={() => selectRole(role)}
                    className={`group relative p-3.5 rounded-xl border transition cursor-pointer flex flex-col gap-2 ${isSelected
                        ? 'bg-blue-600/10 border-blue-500/50 shadow-md shadow-blue-500/5'
                        : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-800/40 hover:border-slate-700'
                      }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`p-2 rounded-lg ${isSelected
                              ? 'bg-blue-500/20 text-blue-400'
                              : 'bg-slate-800/80 text-slate-400 group-hover:text-slate-200'
                            }`}
                        >
                          {role.name === 'super_admin' ? (
                            <ShieldAlert className="w-4 h-4 text-rose-400" />
                          ) : (
                            <Shield className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-100">{role.display_name_ar}</span>
                            {isSystem ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                                نظامي
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                مخصص
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-mono text-slate-500">{role.name}</span>
                        </div>
                      </div>

                      {!isSystem && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(role);
                            }}
                            title="تعديل بيانات الدور"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteRole(role);
                            }}
                            title="حذف الدور"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2">
                      {role.description || 'لا يوجد وصف مدخل لهذا الدور'}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-800/60 pt-2 mt-1">
                      <span>
                        المستخدمين: <strong className="text-slate-300">{role.users_count ?? 0}</strong>
                      </span>
                      <span>
                        الصلاحيات: <strong className="text-blue-400 font-mono">{role.permissions_count ?? (role.permissions?.length || 0)}</strong>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Permissions Tree Area (8 Cols) */}
        <div className={`lg:col-span-8 space-y-4 ${mobileTab === 'permissions' ? 'block' : 'hidden lg:block'}`}>
          {/* Active Role Control & Progress Header */}
          <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-5 backdrop-blur-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    شجرة صلاحيات: <span className="text-blue-400">{selectedRole?.display_name_ar}</span>
                  </h2>
                  {isSuperAdminRole && (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      كامل الصلاحيات ثابته
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {isSuperAdminRole
                    ? 'هذا هو الدور الأساسي الأعلى، ويمتلك كافة الصلاحيات بدون أي قيود.'
                    : 'يمكنك تفعيل أو إلغاء أي فرع أو صلاحية مفردة، ثم الضغط على زر الحفظ.'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {!isSuperAdminRole && (
                  <button
                    onClick={handleSavePermissions}
                    disabled={!hasChanges || saving}
                    className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition shadow-lg ${hasChanges
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20 cursor-pointer animate-pulse'
                        : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                      }`}
                  >
                    {saving ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {hasChanges ? 'حفظ التعديلات' : 'تم الحفظ'}
                  </button>
                )}
              </div>
            </div>

            {/* Coverage Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  نسبة التغطية والتفعيل:
                </span>
                <span className="font-mono font-bold text-slate-200">
                  {currentSelectedCount} من أصل {totalTreePerms} ({percentage}%)
                </span>
              </div>
              <div className="w-full bg-slate-950/80 rounded-full h-2 overflow-hidden border border-slate-800">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${percentage === 100
                      ? 'bg-rose-500'
                      : percentage > 50
                        ? 'bg-blue-500'
                        : 'bg-amber-500'
                    }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              {/* Search & Risk Filter */}
              <div className="flex items-center gap-2 flex-1 min-w-[280px]">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="بحث سريع في الصلاحيات والمسميات..."
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pr-9 pl-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <select
                  value={riskFilter}
                  onChange={(e) => setRiskFilter(e.target.value)}
                  className="bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="all">كافة المستويات</option>
                  <option value="normal">عادي</option>
                  <option value="warning">متوسط الحساسية</option>
                  <option value="critical">حرج وعالي الخطورة</option>
                </select>
              </div>

              {/* Tree tools */}
              <div className="flex items-center gap-2">
                {!isSuperAdminRole && (
                  <>
                    <button
                      onClick={handleSelectAll}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer"
                    >
                      تحديد الكل
                    </button>
                    <button
                      onClick={handleDeselectAll}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer"
                    >
                      إلغاء التحديد
                    </button>
                  </>
                )}
                <button
                  onClick={() => toggleCollapseAll(false)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer"
                >
                  توسيع
                </button>
                <button
                  onClick={() => toggleCollapseAll(true)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer"
                >
                  طي
                </button>
              </div>
            </div>
          </div>

          {/* Tree Modules List */}
          <div className="space-y-3">
            {filteredModules.length === 0 ? (
              <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-12 text-center text-slate-400 space-y-2">
                <Search className="w-8 h-8 mx-auto text-slate-600" />
                <p className="text-sm font-semibold">لا توجد صلاحيات مطابقة لفلتر البحث المحدد</p>
                <p className="text-xs text-slate-500">جرب البحث بكلمة أخرى أو إعادة ضبط مستوى الخطورة</p>
              </div>
            ) : (
              filteredModules.map((module) => {
                const IconComponent = MODULE_ICONS[module.icon] || FolderTree;
                const isCollapsed = collapsedModules[module.key];

                const modulePermNames = module.permissions.map((p) => p.name);
                const selectedInModule = isSuperAdminRole
                  ? modulePermNames.length
                  : modulePermNames.filter((name) => selectedPermissions.has(name)).length;

                const allInModuleSelected = selectedInModule === modulePermNames.length;
                const someInModuleSelected = selectedInModule > 0 && !allInModuleSelected;

                return (
                  <div
                    key={module.key}
                    className="bg-slate-900/60 rounded-2xl border border-slate-800/90 overflow-hidden backdrop-blur-md transition"
                  >
                    {/* Module Header Bar */}
                    <div className="p-4 flex items-center justify-between gap-3 bg-slate-950/40 border-b border-slate-800/60">
                      <div
                        className="flex items-center gap-3 flex-1 cursor-pointer select-none"
                        onClick={() => toggleModuleCollapse(module.key)}
                      >
                        <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                          <IconComponent className="w-5 h-5" />
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-white">{module.label_ar}</h3>
                            <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
                              ({module.key})
                            </span>
                          </div>
                          {module.description_ar && (
                            <p className="text-xs text-slate-400 mt-0.5">{module.description_ar}</p>
                          )}
                        </div>
                      </div>

                      {/* Module Checkbox & Status */}
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono font-semibold text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60">
                          {selectedInModule} / {module.permissions.length}
                        </span>

                        {!isSuperAdminRole && (
                          <button
                            type="button"
                            onClick={() => toggleModuleAll(module.permissions)}
                            className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                            title={allInModuleSelected ? 'إلغاء تحديد الوحدة' : 'تحديد كامل الوحدة'}
                          >
                            {allInModuleSelected ? (
                              <CheckSquare className="w-5 h-5 text-blue-400" />
                            ) : someInModuleSelected ? (
                              <MinusSquare className="w-5 h-5 text-blue-400" />
                            ) : (
                              <Square className="w-5 h-5 text-slate-500" />
                            )}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => toggleModuleCollapse(module.key)}
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-200 transition cursor-pointer"
                        >
                          {isCollapsed ? (
                            <ChevronDown className="w-5 h-5" />
                          ) : (
                            <ChevronRight className="w-5 h-5 rotate-90" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Permissions Grid within Module */}
                    {!isCollapsed && (
                      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-950/20">
                        {module.filteredPermissions.map((perm) => {
                          const isChecked = isSuperAdminRole || selectedPermissions.has(perm.name);

                          return (
                            <div
                              key={perm.id}
                              onClick={() => togglePermission(perm.name)}
                              className={`p-3 rounded-xl border transition flex items-start gap-3 select-none ${isSuperAdminRole
                                  ? 'bg-slate-900/40 border-slate-800/60 opacity-90'
                                  : isChecked
                                    ? 'bg-blue-600/10 border-blue-500/40 hover:bg-blue-600/15 cursor-pointer'
                                    : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-800/40 hover:border-slate-700 cursor-pointer'
                                }`}
                            >
                              <div className="mt-0.5">
                                {isSuperAdminRole ? (
                                  <Lock className="w-4 h-4 text-rose-400" />
                                ) : isChecked ? (
                                  <CheckSquare className="w-4 h-4 text-blue-400" />
                                ) : (
                                  <Square className="w-4 h-4 text-slate-500" />
                                )}
                              </div>

                              <div className="flex-1 min-w-0 space-y-1">
                                <div className="flex items-center justify-between gap-2">
                                  <span
                                    className={`text-xs font-bold leading-snug ${isChecked ? 'text-slate-100' : 'text-slate-400'
                                      }`}
                                  >
                                    {perm.display_name_ar}
                                  </span>
                                  <RiskBadge level={perm.risk_level} />
                                </div>

                                <div className="font-mono text-[10px] text-slate-500 truncate" dir="ltr">
                                  {perm.name}
                                </div>

                                {perm.description_ar && (
                                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                                    {perm.description_ar}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ── Modal: Create New Role ─────────────────────────────────── */}
      {isModalOpen && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md"
          style={{ direction: 'rtl', top: 0, left: 0, right: 0, bottom: 0, margin: 0 }}
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl flex flex-col max-h-[88vh] overflow-hidden my-auto text-right"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 shrink-0 bg-slate-900/95">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    إنشاء دور وظيفي جديد
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    تعريف دور وظيفي وتخصيص شجرة الصلاحيات الخاصة به
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleCreateRole} className="flex flex-col flex-1 overflow-hidden m-0">
              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                <div>
                  <label className="block text-slate-200 text-xs font-bold mb-1.5">
                    مسمى الدور الوظيفي (بالعربية) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="مثال: مسؤول العقود والمشتريات"
                    value={newRoleData.display_name_ar}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewRoleData((prev) => ({
                        ...prev,
                        display_name_ar: val,
                        display_name: prev.display_name === prev.display_name_ar ? val : prev.display_name,
                      }));
                    }}
                    className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                  />
                </div>

                {/* Template / Clone Permissions */}
                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                    قالب الصلاحيات المبدئية (استنساخ)
                  </label>
                  <select
                    value={newRoleData.clone_from_id}
                    onChange={(e) => setNewRoleData({ ...newRoleData, clone_from_id: e.target.value })}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition cursor-pointer"
                  >
                    <option value="">بدء بصلاحيات فارغة (تحديد يدوي لاحقاً)</option>
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        نسخ صلاحيات: {r.display_name_ar} ({r.permissions_count ?? r.permissions?.length ?? 0} صلاحية)
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-500 mt-1">
                    يمكنك استنساخ صلاحيات دور مشابه لتسريع الإعداد والتعديل عليها لاحقاً
                  </p>
                </div>

                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-1.5">
                    الوصف والمهام الوظيفية
                  </label>
                  <textarea
                    rows={2}
                    placeholder="نبذة موجزة عن اختصاصات هذا الدور ومسؤولياته في النظام..."
                    value={newRoleData.description}
                    onChange={(e) =>
                      setNewRoleData({ ...newRoleData, description: e.target.value })
                    }
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition resize-none"
                  />
                </div>

                {/* Advanced Settings Accordion */}
                <div className="border border-slate-800/80 rounded-2xl bg-slate-950/40 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-semibold text-slate-400 hover:text-slate-200 transition cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <Settings className="w-3.5 h-3.5 text-blue-400" />
                      إعدادات متقدمة (الاسم بالإنجليزية والرمز البرمجي)
                    </span>
                    {showAdvanced ? (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    )}
                  </button>

                  {showAdvanced && (
                    <div className="p-4 pt-2 border-t border-slate-800/60 space-y-3 bg-slate-950/60">
                      <div>
                        <label className="block text-slate-400 text-[11px] font-medium mb-1">
                          الاسم بالإنجليزية (English Title) - اختياري
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Procurement Specialist"
                          value={newRoleData.display_name}
                          onChange={(e) =>
                            setNewRoleData({ ...newRoleData, display_name: e.target.value })
                          }
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 text-[11px] font-medium mb-1">
                          الرمز البرمجي للنظام (Machine Key) - يُولّد آلياً إذا ترك فارغاً
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. procurement_specialist"
                          value={newRoleData.name}
                          onChange={(e) =>
                            setNewRoleData({
                              ...newRoleData,
                              name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
                            })
                          }
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 font-mono text-xs text-blue-400 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Fixed Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-slate-900/95 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition text-xs font-semibold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={creatingRole}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-600/25 disabled:opacity-50"
                >
                  {creatingRole ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  إنشاء وتخصيص الصلاحيات
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ── Modal: Edit Existing Role ───────────────────────────────── */}
      {isEditModalOpen && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md"
          style={{ direction: 'rtl', top: 0, left: 0, right: 0, bottom: 0, margin: 0 }}
          onClick={() => setIsEditModalOpen(false)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl flex flex-col max-h-[88vh] overflow-hidden my-auto text-right"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 shrink-0 bg-slate-900/95">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Edit3 className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">
                  تعديل بيانات الدور الوظيفي
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleUpdateRoleInfo} className="flex flex-col flex-1 overflow-hidden m-0">
              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                <div>
                  <label className="block text-slate-200 text-xs font-bold mb-1.5">
                    مسمى الدور الوظيفي (بالعربية) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editRoleData.display_name_ar}
                    onChange={(e) => setEditRoleData({ ...editRoleData, display_name_ar: e.target.value })}
                    className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-1.5">
                    الاسم بالإنجليزية
                  </label>
                  <input
                    type="text"
                    value={editRoleData.display_name}
                    onChange={(e) => setEditRoleData({ ...editRoleData, display_name: e.target.value })}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 text-xs font-semibold mb-1.5">
                    الوصف والمهام الوظيفية
                  </label>
                  <textarea
                    rows={3}
                    value={editRoleData.description}
                    onChange={(e) => setEditRoleData({ ...editRoleData, description: e.target.value })}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500 transition resize-none"
                  />
                </div>
              </div>

              {/* Fixed Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-slate-900/95 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition text-xs font-semibold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={updatingRole}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-600/25 disabled:opacity-50"
                >
                  {updatingRole ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  حفظ التعديلات
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
