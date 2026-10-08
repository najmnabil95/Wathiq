import { useState, useEffect, useRef, useCallback } from 'react';
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
  { label: 'لوحة التحكم',         icon: LayoutDashboard, to: '/',           exact: true, permission: null },
  { label: 'الوثائق',              icon: FileText,        to: '/documents',  permission: 'documents.view' },
  { label: 'التصنيفات',            icon: FolderTree,      to: '/categories', permission: 'categories.view' },
  { label: 'الأقسام والفروع',      icon: Building2,       to: '/departments',permission: null },
  { label: 'المستخدمون',           icon: Users,           to: '/users',      permission: 'users.view' },
  { label: 'الأدوار والصلاحيات',   icon: ShieldCheck,     to: '/roles',      permission: null },
  { label: 'سجل العمليات',         icon: Activity,        to: '/audit',      permission: 'audit.view' },
  { label: 'الإعدادات',            icon: Settings,        to: '/settings',   permission: 'settings.view' },
];

// Page title map
const PAGE_TITLES = {
  '/':                    'لوحة التحكم | وثيق IT-EDMS',
  '/documents':           'إدارة الوثائق | وثيق IT-EDMS',
  '/documents/create':    'إنشاء وثيقة جديدة | وثيق IT-EDMS',
  '/categories':          'تصنيفات الوثائق | وثيق IT-EDMS',
  '/departments':         'الأقسام والفروع | وثيق IT-EDMS',
  '/users':               'إدارة المستخدمين | وثيق IT-EDMS',
  '/roles':               'الأدوار والصلاحيات | وثيق IT-EDMS',
  '/audit':               'سجل العمليات والرقابة | وثيق IT-EDMS',
  '/settings':            'إعدادات النظام | وثيق IT-EDMS',
};

// ── Hook: Close on outside click ────────────────────────────
function useClickOutside(refs, handler) {
  useEffect(() => {
    const listener = (e) => {
      const clickedOutside = refs.every(ref => !ref.current || !ref.current.contains(e.target));
      if (clickedOutside) handler();
    };
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [refs, handler]);
}

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, hasPermission } = useAuthStore();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [device, setDevice] = useState('desktop');

  const isMobile = device === 'mobile';

  const userMenuRef  = useRef(null);
  const userBtnRef   = useRef(null);
  const notifRef     = useRef(null);
  const notifBtnRef  = useRef(null);

  // Close user menu on outside click
  useClickOutside([userMenuRef, userBtnRef], useCallback(() => setUserMenuOpen(false), []));
  useClickOutside([notifRef, notifBtnRef],  useCallback(() => setNotifOpen(false), []));

  // Responsive breakpoint detection
  useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      if (w < 768)  { setDevice('mobile');  setSidebarOpen(false); }
      else if (w < 1024) { setDevice('tablet');  setSidebarOpen(false); }
      else           { setDevice('desktop'); setSidebarOpen(true); }
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Dynamic page title
  useEffect(() => {
    if (location.pathname.startsWith('/documents/') && location.pathname !== '/documents/create') {
      document.title = 'تفاصيل الوثيقة | وثيق IT-EDMS';
    } else {
      document.title = PAGE_TITLES[location.pathname] || 'وثيق | نظام إدارة الوثائق IT-EDMS';
    }
  }, [location.pathname]);

  // Close overlays on route change
  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
    setUserMenuOpen(false);
    setNotifOpen(false);
  }, [location.pathname, isMobile]);

  const handleLogout = async () => {
    setUserMenuOpen(false);
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
    if (location.pathname.startsWith('/documents/create')) return 'وثيقة جديدة';
    if (location.pathname.match(/^\/documents\/\d+/)) return 'تفاصيل الوثيقة';
    const item = navItems.find(n => {
      if (n.exact) return location.pathname === n.to;
      return location.pathname.startsWith(n.to) && n.to !== '/';
    });
    return item?.label || 'IT-EDMS';
  };

  const firstRole = user?.roles?.[0];
  const getMarginRight = () => isMobile ? '0px' : (sidebarOpen ? '260px' : '72px');

  return (
    <div className="flex min-h-screen relative" style={{ direction: 'rtl' }}>

      {/* ── Mobile Backdrop ── */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 z-40 transition-opacity"
          style={{ background: 'rgba(5,8,16,0.75)', backdropFilter: 'blur(4px)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        id="app-sidebar"
        className="fixed top-0 right-0 h-screen z-50 flex flex-col no-print"
        style={{
          width: isMobile ? '272px' : (sidebarOpen ? '260px' : '72px'),
          transform: isMobile ? (sidebarOpen ? 'translateX(0)' : 'translateX(100%)') : 'translateX(0)',
          transition: 'width 0.28s cubic-bezier(0.4,0,0.2,1), transform 0.28s cubic-bezier(0.4,0,0.2,1)',
          overflow: 'hidden',
          background: 'linear-gradient(180deg, rgba(8,13,28,0.98) 0%, rgba(5,8,18,0.99) 100%)',
          backdropFilter: 'blur(24px)',
          borderLeft: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 0 60px rgba(0,0,0,0.4)',
        }}
      >
        {/* Logo Header */}
        <div
          className="flex items-center justify-between px-4 shrink-0"
          style={{ height: '66px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(59,130,246,0.25), rgba(139,92,246,0.25))',
                border: '1px solid rgba(59,130,246,0.35)',
                boxShadow: '0 0 20px rgba(59,130,246,0.15)',
              }}
            >
              <Shield size={17} className="text-blue-400" />
            </div>
            {(sidebarOpen || isMobile) && (
              <div className="animate-fade-in overflow-hidden min-w-0">
                <div className="font-black text-white text-sm leading-tight tracking-wider" style={{ letterSpacing: '0.08em' }}>
                  IT-EDMS
                </div>
                <div className="text-[10px] leading-tight font-medium" style={{ color: '#45607a' }}>
                  إدارة وأرشفة الوثائق
                </div>
              </div>
            )}
          </div>
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all"
              title="إغلاق القائمة"
            >
              <X size={17} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-0.5 no-scrollbar">
          {navItems.map(item => {
            if (!canSeeItem(item)) return null;
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.exact}
                onClick={() => { if (isMobile) setSidebarOpen(false); }}
                className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                title={!sidebarOpen && !isMobile ? item.label : undefined}
              >
                <Icon size={17} className="flex-shrink-0 sidebar-icon" />
                {(sidebarOpen || isMobile) && (
                  <span className="animate-fade-in whitespace-nowrap font-medium">{item.label}</span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User Card */}
        <div className="px-2.5 py-3 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div
            className="flex items-center gap-2.5 p-2.5 rounded-xl cursor-pointer press-effect"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              transition: 'all 0.18s ease',
            }}
            onClick={handleLogout}
            title="تسجيل الخروج"
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(239,68,68,0.06)';
              e.currentTarget.style.borderColor = 'rgba(239,68,68,0.15)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
            }}
          >
            <div
              className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-blue-300"
              style={{ background: 'rgba(59,130,246,0.18)', border: '1px solid rgba(59,130,246,0.25)' }}
            >
              {user?.name?.[0] || 'م'}
            </div>
            {(sidebarOpen || isMobile) && (
              <div className="flex-1 overflow-hidden animate-fade-in">
                <div className="text-[13px] font-semibold truncate" style={{ color: '#d4e0f5' }}>
                  {user?.name}
                </div>
                <div className="text-[11px] truncate" style={{ color: '#45607a' }}>
                  {firstRole?.display_name_ar || firstRole?.display_name || 'مستخدم'}
                </div>
              </div>
            )}
            {(sidebarOpen || isMobile) && (
              <LogOut size={13} className="flex-shrink-0" style={{ color: '#f87171', opacity: 0.7 }} />
            )}
          </div>
        </div>
      </aside>

      {/* ── Main Area ── */}
      <div
        id="app-main-area"
        className="flex-1 flex flex-col min-w-0"
        style={{
          marginRight: getMarginRight(),
          transition: 'margin-right 0.28s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        {/* ── Top Header ── */}
        <header
          className="sticky top-0 z-30 flex items-center justify-between px-3 sm:px-5 no-print"
          style={{
            height: '64px',
            background: 'rgba(5,8,18,0.92)',
            backdropFilter: 'blur(24px)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            boxShadow: '0 1px 30px rgba(0,0,0,0.2)',
          }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Toggle Button */}
            <button
              id="sidebar-toggle"
              onClick={() => setSidebarOpen(v => !v)}
              className="btn btn-secondary btn-icon flex-shrink-0"
              title={sidebarOpen ? 'تصغير القائمة' : 'توسيع القائمة'}
              style={{ transition: 'all 0.18s ease' }}
            >
              <Menu size={17} />
            </button>

            {/* Page Title */}
            <div className="min-w-0">
              <h1
                className="font-bold text-sm sm:text-[15px] truncate"
                style={{ color: '#e8f0ff', margin: 0, letterSpacing: '-0.01em', maxWidth: '240px' }}
              >
                {getPageTitle()}
              </h1>
              <p className="text-[11px] hidden sm:block truncate mt-0.5" style={{ color: '#364a60', margin: 0 }}>
                {new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {/* Quick Search */}
            <button
              className="btn btn-secondary btn-icon"
              onClick={() => navigate('/documents?q=')}
              title="بحث في الوثائق"
            >
              <Search size={16} />
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                ref={notifBtnRef}
                id="notif-bell-btn"
                className={`btn btn-secondary btn-icon relative ${notifOpen ? 'border-blue-500/40 bg-blue-500/08' : ''}`}
                onClick={() => { setNotifOpen(v => !v); setUserMenuOpen(false); }}
                title="التنبيهات والإشعارات"
              >
                <Bell size={16} />
                <span
                  className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                  style={{ background: '#3b82f6', boxShadow: '0 0 6px rgba(59,130,246,0.8)', animation: 'pulse-glow 2s infinite' }}
                />
              </button>

              {notifOpen && (
                <div
                  ref={notifRef}
                  className="fixed sm:absolute top-[70px] sm:top-auto sm:mt-2 left-3 sm:left-0 right-3 sm:right-auto w-auto sm:w-80 glass-sm shadow-2xl p-4 z-50 animate-slide-down"
                  style={{ direction: 'rtl', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <div className="flex items-center justify-between pb-3 mb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex items-center gap-2">
                      <Bell size={14} className="text-blue-400" />
                      <span className="font-bold text-sm" style={{ color: '#e2e8f0' }}>مركز التنبيهات</span>
                    </div>
                    <button onClick={() => setNotifOpen(false)} className="p-1 rounded-lg hover:bg-white/5 transition">
                      <X size={13} style={{ color: '#526080' }} />
                    </button>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto no-scrollbar">
                    {[
                      { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.18)', title: 'طلبات اعتماد بانتظارك', desc: 'يوجد وثائق بحاجة للمراجعة واتخاذ قرار.', color: '#fcd34d', to: '/documents?pending=true' },
                      { bg: 'rgba(30,40,60,0.6)',   border: 'rgba(255,255,255,0.06)', title: 'سجل النشاط والتدقيق',    desc: 'تم توثيق آخر حركات الدخول والتعديلات.', color: '#cbd5e1', to: '/audit' },
                      { bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.18)', title: 'حالة النظام سليمة',       desc: 'قاعدة البيانات متصلة والنسخ الاحتياطي يعمل.', color: '#93c5fd', to: null },
                    ].map((n, i) => (
                      <div
                        key={i}
                        onClick={() => { if (n.to) { setNotifOpen(false); navigate(n.to); } }}
                        className="p-3 rounded-xl transition-all text-right"
                        style={{
                          background: n.bg,
                          border: `1px solid ${n.border}`,
                          cursor: n.to ? 'pointer' : 'default',
                        }}
                        onMouseEnter={e => { if (n.to) e.currentTarget.style.opacity = '0.8'; }}
                        onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                      >
                        <div className="text-xs font-bold" style={{ color: n.color }}>{n.title}</div>
                        <div className="text-[11px] mt-0.5" style={{ color: '#7a90a8' }}>{n.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                ref={userBtnRef}
                id="user-menu-btn"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-all"
                style={{
                  background: userMenuOpen ? 'rgba(59,130,246,0.08)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${userMenuOpen ? 'rgba(59,130,246,0.25)' : 'rgba(255,255,255,0.08)'}`,
                  transition: 'all 0.18s ease',
                }}
                onClick={() => { setUserMenuOpen(v => !v); setNotifOpen(false); }}
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-blue-300"
                  style={{ background: 'rgba(59,130,246,0.18)' }}
                >
                  {user?.name?.[0] || 'م'}
                </div>
                <span className="text-[13px] font-semibold hidden md:block max-w-[100px] truncate" style={{ color: '#c8d8f0' }}>
                  {user?.name}
                </span>
                <ChevronDown
                  size={13}
                  style={{ color: '#526080', transform: userMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.18s ease' }}
                />
              </button>

              {userMenuOpen && (
                <div
                  ref={userMenuRef}
                  className="absolute top-full left-0 mt-2 w-52 glass-sm shadow-2xl py-1 animate-slide-down"
                  style={{ zIndex: 100, border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="text-[13px] font-bold" style={{ color: '#e2e8f0' }}>{user?.name}</div>
                    <div className="text-[11px] truncate mt-0.5" style={{ color: '#45607a' }}>{user?.email}</div>
                  </div>
                  <button
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-red-500/08"
                    style={{ color: '#f87171', fontFamily: 'Cairo, sans-serif', background: 'none', border: 'none', cursor: 'pointer', direction: 'rtl' }}
                    onClick={handleLogout}
                  >
                    <LogOut size={14} />
                    تسجيل الخروج
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── Page Content ── */}
        <main className="flex-1 p-3 sm:p-5 md:p-6 lg:p-7 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
