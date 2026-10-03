import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import {
  LayoutDashboard, FolderOpen, FolderTree, Users, ShieldCheck,
  Settings, LogOut, Menu, X, Bell, Search, ChevronDown,
  Archive, FileText, Activity, Shield, Building2
} from 'lucide-react';
import toast from 'react-hot-toast';

// ── Navigation Items ──────────────────────────────────────────
const navItems = [
  {
    label: 'لوحة التحكم',
    icon: LayoutDashboard,
    to: '/',
    exact: true,
    permission: null,
  },
  {
    label: 'الوثائق',
    icon: FileText,
    to: '/documents',
    permission: 'documents.view',
  },
  {
    label: 'التصنيفات',
    icon: FolderTree,
    to: '/categories',
    permission: 'categories.view',
  },
  {
    label: 'الأقسام والفروع',
    icon: Building2,
    to: '/departments',
    permission: null,
  },
  {
    label: 'المستخدمون',
    icon: Users,
    to: '/users',
    permission: 'users.view',
  },
  {
    label: 'سجل العمليات',
    icon: Activity,
    to: '/audit',
    permission: 'audit.view',
  },
  {
    label: 'الإعدادات',
    icon: Settings,
    to: '/settings',
    permission: 'settings.view',
  },
];

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, hasPermission, hasRole } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
      else setSidebarOpen(true);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Dynamic page title
  useEffect(() => {
    const titles = {
      '/': 'لوحة التحكم | وثيق IT-EDMS',
      '/documents': 'إدارة الوثائق | وثيق IT-EDMS',
      '/documents/create': 'إنشاء وثيقة جديدة | وثيق IT-EDMS',
      '/categories': 'تصنيفات الوثائق | وثيق IT-EDMS',
      '/departments': 'الأقسام والفروع | وثيق IT-EDMS',
      '/users': 'إدارة المستخدمين | وثيق IT-EDMS',
      '/audit': 'سجل العمليات والرقابة | وثيق IT-EDMS',
      '/settings': 'إعدادات النظام | وثيق IT-EDMS',
    };
    if (location.pathname.startsWith('/documents/') && location.pathname !== '/documents/create') {
      document.title = 'تفاصيل الوثيقة | وثيق IT-EDMS';
    } else {
      document.title = titles[location.pathname] || 'وثيق | نظام إدارة الوثائق IT-EDMS';
    }
  }, [location.pathname]);

  // Close sidebar on mobile navigation
  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    toast.success('تم تسجيل الخروج بنجاح');
    navigate('/login');
  };

  const canSeeItem = (item) => {
    if (!item.permission) return true;
    if (user?.is_super_admin) return true;
    return hasPermission(item.permission);
  };

  const getPageTitle = () => {
    const item = navItems.find(n => {
      if (n.exact) return location.pathname === n.to;
      return location.pathname.startsWith(n.to) && n.to !== '/';
    });
    if (location.pathname.startsWith('/documents/create')) return 'وثيقة جديدة';
    if (location.pathname.match(/^\/documents\/\d+/)) return 'تفاصيل الوثيقة';
    return item?.label || 'IT-EDMS';
  };

  const firstRole = user?.roles?.[0];

  return (
    <div className="flex min-h-screen" style={{ direction: 'rtl' }}>

      {/* ── Sidebar ─────────────────────────────────────────── */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className="fixed top-0 right-0 h-screen z-50 flex flex-col transition-all duration-300 ease-in-out no-print"
        style={{
          width: sidebarOpen ? '260px' : (isMobile ? '0' : '72px'),
          overflow: 'hidden',
          background: 'rgba(10, 15, 30, 0.95)',
          backdropFilter: 'blur(24px)',
          borderLeft: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5" style={{ minHeight: '68px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.3), rgba(139,92,246,0.3))', border: '1px solid rgba(59,130,246,0.4)' }}>
            <Shield size={18} className="text-blue-400" />
          </div>
          {sidebarOpen && (
            <div className="animate-fade-in overflow-hidden">
              <div className="font-black text-white text-sm leading-tight">IT-EDMS</div>
              <div className="text-xs leading-tight" style={{ color: '#526080' }}>إدارة وأرشفة الوثائق</div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map(item => {
            if (!canSeeItem(item)) return null;
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.exact}
                className={({ isActive }) =>
                  `sidebar-item ${isActive ? 'active' : ''}`
                }
                title={!sidebarOpen ? item.label : undefined}
              >
                <Icon size={18} className="flex-shrink-0 sidebar-icon" />
                {sidebarOpen && (
                  <span className="animate-fade-in whitespace-nowrap">{item.label}</span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User Card */}
        <div className="p-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div
            className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all"
            style={{ background: 'rgba(255,255,255,0.03)' }}
            onClick={handleLogout}
            title="تسجيل الخروج"
          >
            {/* Avatar */}
            <div className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold text-blue-300"
                 style={{ background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.3)' }}>
              {user?.name?.[0] || 'م'}
            </div>
            {sidebarOpen && (
              <div className="flex-1 overflow-hidden animate-fade-in">
                <div className="text-sm font-semibold truncate" style={{ color: '#e2e8f0' }}>
                  {user?.name}
                </div>
                <div className="text-xs truncate" style={{ color: '#526080' }}>
                  {firstRole?.display_name_ar || firstRole?.display_name || 'مستخدم'}
                </div>
              </div>
            )}
            {sidebarOpen && <LogOut size={14} style={{ color: '#526080', flexShrink: 0 }} />}
          </div>
        </div>
      </aside>

      {/* ── Main Area ───────────────────────────────────────── */}
      <div
        id="app-main-area"
        className="flex-1 flex flex-col transition-all duration-300"
        style={{ marginRight: sidebarOpen ? (isMobile ? '0' : '260px') : '72px' }}
      >
        {/* ── Top Header ── */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-6 h-[68px] no-print"
                style={{ background: 'rgba(5,8,16,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>

          <div className="flex items-center gap-4">
            {/* Toggle Sidebar */}
            <button
              id="sidebar-toggle"
              onClick={() => setSidebarOpen(v => !v)}
              className="btn btn-secondary btn-icon"
            >
              {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
            </button>

            {/* Page Title */}
            <div>
              <h1 className="font-bold text-base" style={{ color: '#f0f4ff', margin: 0 }}>
                {getPageTitle()}
              </h1>
              <p className="text-xs" style={{ color: '#526080', margin: 0 }}>
                {new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Search */}
            <button
              className="btn btn-secondary btn-icon hidden md:flex"
              onClick={() => navigate('/documents?q=')}
              title="بحث سريع"
            >
              <Search size={17} />
            </button>

            {/* Notifications Menu */}
            <div className="relative">
              <button
                id="notif-bell-btn"
                className={`btn btn-secondary btn-icon relative ${notifOpen ? 'border-blue-500/50 bg-blue-500/10' : ''}`}
                onClick={() => setNotifOpen(v => !v)}
                title="التنبيهات والإشعارات"
              >
                <Bell size={17} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              </button>

              {notifOpen && (
                <div
                  className="absolute top-full left-0 mt-2 w-80 glass-sm shadow-2xl p-4 animate-fade-in z-50 rounded-2xl border border-slate-700"
                  style={{ direction: 'rtl' }}
                >
                  <div className="flex items-center justify-between border-b border-slate-700/60 pb-2 mb-3">
                    <div className="flex items-center gap-2">
                      <Bell size={15} className="text-blue-400" />
                      <span className="font-bold text-sm text-white">مركز التنبيهات</span>
                    </div>
                    <button
                      onClick={() => setNotifOpen(false)}
                      className="text-xs text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  <div className="space-y-2.5 max-h-72 overflow-y-auto">
                    <div
                      onClick={() => { setNotifOpen(false); navigate('/documents?pending=true'); }}
                      className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 cursor-pointer transition text-right"
                    >
                      <div className="text-xs font-bold text-amber-300">طلبات اعتماد بانتظارك</div>
                      <div className="text-[11px] text-slate-300 mt-0.5">يوجد وثائق بحاجة للمراجعة واتخاذ قرار الاعتماد.</div>
                    </div>

                    <div
                      onClick={() => { setNotifOpen(false); navigate('/audit'); }}
                      className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:bg-slate-800 cursor-pointer transition text-right"
                    >
                      <div className="text-xs font-bold text-slate-200">سجل النشاط والتدقيق</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">تم توثيق آخر حركات الدخول والتعديلات بنجاح.</div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-right">
                      <div className="text-xs font-bold text-blue-300">حالة النظام والأمان</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">قاعدة البيانات متصلة، والنسخ الاحتياطي يعمل بشكل طبيعي.</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                id="user-menu-btn"
                className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all cursor-pointer"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                onClick={() => setUserMenuOpen(v => !v)}
              >
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-blue-300"
                     style={{ background: 'rgba(59,130,246,0.2)' }}>
                  {user?.name?.[0] || 'م'}
                </div>
                <span className="text-sm font-semibold hidden md:block" style={{ color: '#e2e8f0', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.name}
                </span>
                <ChevronDown size={14} style={{ color: '#526080' }} />
              </button>

              {/* Dropdown */}
              {userMenuOpen && (
                <div
                  className="absolute top-full left-0 mt-2 w-52 glass-sm shadow-2xl py-2 animate-fade-in"
                  style={{ zIndex: 100 }}
                  onBlur={() => setUserMenuOpen(false)}
                >
                  <div className="px-4 py-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                    <div className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>{user?.name}</div>
                    <div className="text-xs" style={{ color: '#526080' }}>{user?.email}</div>
                  </div>
                  <button
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-left transition-colors hover:bg-white/5"
                    style={{ color: '#f87171', fontFamily: 'Cairo, sans-serif', background: 'none', border: 'none', cursor: 'pointer', direction: 'rtl' }}
                    onClick={handleLogout}
                  >
                    <LogOut size={15} />
                    تسجيل الخروج
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── Page Content ── */}
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
