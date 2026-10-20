import { useState, useEffect, useRef, useCallback } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { dashboardAPI, notificationsAPI } from '../../services/api';
import {
  LayoutDashboard, FolderOpen, FolderTree, Users, ShieldCheck,
  Settings, LogOut, Menu, X, Bell, Search, ChevronDown,
  ChevronRight, ChevronLeft, Archive, FileText, Activity, Shield, Building2,
  User, Sun, Moon, Camera, Plus, ScanLine, CheckCircle, XCircle, FileCheck,
  MessageSquare, GitBranch, CheckCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import DocumentScannerModal from '../common/DocumentScannerModal';

// ── Navigation Items ──────────────────────────────────────────
const navItems = [
  { label: 'لوحة التحكم',         icon: LayoutDashboard, to: '/',           exact: true, permission: null },
  { label: 'الوثائق',              icon: FileText,        to: '/documents',  permission: 'documents.view' },
  { label: 'التصنيفات',            icon: FolderTree,      to: '/categories', permission: 'categories.view' },
  { label: 'الأقسام والفروع',      icon: Building2,       to: '/departments',permission: 'departments.view' },
  { label: 'المستخدمون',           icon: Users,           to: '/users',      permission: 'users.view' },
  { label: 'الأدوار والصلاحيات',   icon: ShieldCheck,     to: '/roles',      permission: 'roles.view' },
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
  '/profile':             'الملف الشخصي | وثيق IT-EDMS',
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
  const [pendingCount, setPendingCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);
  const [theme, setTheme] = useState(() => localStorage.getItem('edms_theme') || 'dark');
  const [globalScannerOpen, setGlobalScannerOpen] = useState(false);

  // Sync theme with DOM and localStorage
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light-theme');
    } else {
      document.documentElement.classList.remove('light-theme');
    }
    localStorage.setItem('edms_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

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

  // Fetch notifications & pending approvals count
  const fetchNotifications = useCallback(() => {
    notificationsAPI.list()
      .then(res => {
        const data = res.data?.data || [];
        const count = res.data?.unread_count ?? data.filter(n => !n.is_read).length;
        setNotifications(data);
        setUnreadNotifsCount(count);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let active = true;
    dashboardAPI.stats()
      .then(res => {
        if (active && res.data?.data?.pending_approvals !== undefined) {
          setPendingCount(Number(res.data.data.pending_approvals) || 0);
        }
      })
      .catch(() => {});
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 25000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [fetchNotifications, location.pathname]);

  const handleNotifClick = (notif) => {
    if (!notif.is_read) {
      notificationsAPI.markAsRead(notif.id).catch(() => {});
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
      setUnreadNotifsCount(c => Math.max(0, c - 1));
    }
    setNotifOpen(false);
    const targetUrl = notif.data?.action_url || (notif.data?.document_id ? `/documents/${notif.data.document_id}` : null);
    if (targetUrl) {
      navigate(targetUrl);
    }
  };

  const handleMarkAllNotifsRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadNotifsCount(0);
      toast.success('تم تحديد جميع الإشعارات كمقروءة');
    } catch {
      toast.error('فشل تحديث الإشعارات');
    }
  };

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

  // Close overlays on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setUserMenuOpen(false);
        setNotifOpen(false);
        if (isMobile) setSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobile]);

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await logout();
    toast.success('تم تسجيل الخروج بنجاح');
    navigate('/login');
  };

  const canSeeItem = (item) => {
    if (!item.permission) return true;
    if (user?.is_super_admin) return true;
    if (item.permission === 'roles.view') {
      return hasPermission('roles.view') || hasPermission('roles.manage');
    }
    return hasPermission(item.permission);
  };

  const getPageTitle = () => {
    if (location.pathname.startsWith('/documents/create')) return 'وثيقة جديدة';
    if (location.pathname.match(/^\/documents\/\d+/)) return 'تفاصيل الوثيقة';
    if (location.pathname === '/profile') return 'الملف الشخصي والحساب';
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
        {/* Logo Header with Single Arrow Toggle */}
        <div
          className="flex items-center justify-between px-3 sm:px-4 shrink-0"
          style={{ height: '66px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          {sidebarOpen || isMobile ? (
            <>
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
                <div className="animate-fade-in overflow-hidden min-w-0">
                  <div className="font-black text-white text-sm leading-tight tracking-wider" style={{ letterSpacing: '0.08em' }}>
                    IT-EDMS
                  </div>
                  <div className="text-[10px] leading-tight font-medium" style={{ color: '#45607a' }}>
                    إدارة وأرشفة الوثائق
                  </div>
                </div>
              </div>

              {!isMobile && (
                <button
                  id="sidebar-toggle-btn"
                  onClick={() => setSidebarOpen(false)}
                  className="w-7 h-7 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 hover:border-blue-500/40 text-slate-400 hover:text-white flex items-center justify-center transition-all press-effect mr-auto"
                  title="طي القائمة الجانبية"
                >
                  <ChevronRight size={15} />
                </button>
              )}

              {isMobile && (
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all"
                  title="إغلاق القائمة"
                >
                  <X size={17} />
                </button>
              )}
            </>
          ) : (
            /* Collapsed State: Single arrow button to expand */
            <div className="w-full flex items-center justify-center">
              <button
                id="sidebar-toggle-btn"
                onClick={() => setSidebarOpen(true)}
                className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-blue-600/20 border border-white/10 hover:border-blue-500/50 text-slate-300 hover:text-blue-400 flex items-center justify-center transition-all press-effect group"
                title="توسيع القائمة الجانبية"
              >
                <ChevronLeft size={17} className="group-hover:-translate-x-0.5 transition-transform" />
              </button>
            </div>
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
            {/* Mobile Toggle Button */}
            {isMobile && (
              <button
                id="sidebar-toggle"
                onClick={() => setSidebarOpen(v => !v)}
                className="btn btn-secondary btn-icon flex-shrink-0"
                title="فتح القائمة الجانبية"
                style={{ transition: 'all 0.18s ease' }}
              >
                <Menu size={17} />
              </button>
            )}

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
            {/* Camera Scanner Button */}
            <button
              className="btn btn-secondary btn-icon text-emerald-400 hover:text-emerald-300"
              onClick={() => setGlobalScannerOpen(true)}
              title="الماسح الضوئي الذكي للمستندات"
            >
              <Camera size={16} />
            </button>

            {/* Theme Toggle (Dark / Light) */}
            <button
              className="btn btn-secondary btn-icon text-amber-400 hover:text-amber-300"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'التحويل إلى الوضع النهاري (Light Mode)' : 'التحويل إلى الوضع الليلي (Dark Mode)'}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>

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
                className={`btn btn-secondary btn-icon relative ${notifOpen ? 'border-cyan-500/40 bg-cyan-500/10' : ''}`}
                onClick={() => { setNotifOpen(v => !v); setUserMenuOpen(false); }}
                title="التنبيهات والإشعارات"
              >
                <Bell size={16} />
                {unreadNotifsCount > 0 ? (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-cyan-500 text-[10px] font-bold text-slate-950 flex items-center justify-center shadow-lg shadow-cyan-500/40 animate-pulse">
                    {unreadNotifsCount > 9 ? '9+' : unreadNotifsCount}
                  </span>
                ) : pendingCount > 0 ? (
                  <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-amber-500 text-[10px] font-bold text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/30">
                    {pendingCount > 9 ? '9+' : pendingCount}
                  </span>
                ) : (
                  <span
                    className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                    style={{ background: '#06b6d4', boxShadow: '0 0 6px rgba(6,182,212,0.8)', animation: 'pulse-glow 2s infinite' }}
                  />
                )}
              </button>

              {notifOpen && (
                <div
                  ref={notifRef}
                  className="fixed sm:absolute top-[70px] sm:top-auto sm:mt-2 left-3 sm:left-0 right-3 sm:right-auto w-auto sm:w-96 shadow-2xl p-4 z-50 animate-slide-down rounded-2xl border border-slate-700/80"
                  style={{
                    direction: 'rtl',
                    backgroundColor: '#0c1322',
                    boxShadow: '0 25px 60px -15px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.08)',
                  }}
                >
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                        <Bell size={13} />
                      </div>
                      <span className="font-bold text-sm text-slate-100">مركز الإشعارات والتنبيهات</span>
                      {unreadNotifsCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                          {unreadNotifsCount} غير مقروء
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {unreadNotifsCount > 0 && (
                        <button
                          onClick={handleMarkAllNotifsRead}
                          className="text-[11px] text-slate-400 hover:text-cyan-300 flex items-center gap-1 transition"
                          title="تحديد الكل كمقروء"
                        >
                          <CheckCheck size={12} />
                          <span>قراءة الكل</span>
                        </button>
                      )}
                      <button onClick={() => setNotifOpen(false)} className="p-1 rounded-lg hover:bg-white/10 transition text-slate-400 hover:text-white">
                        <X size={13} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-80 overflow-y-auto no-scrollbar">
                    {/* Dynamic notifications from backend */}
                    {notifications.length > 0 ? (
                      notifications.map((n) => {
                        const type = n.data?.type || 'info';
                        const isRead = n.is_read;

                        const iconMap = {
                          approval_request: { icon: FileCheck, color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/30' },
                          approved:         { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30' },
                          rejected:         { icon: XCircle, color: 'text-rose-400', bg: 'bg-rose-500/15', border: 'border-rose-500/30' },
                          comment:          { icon: MessageSquare, color: 'text-sky-400', bg: 'bg-sky-500/15', border: 'border-sky-500/30' },
                          version:          { icon: GitBranch, color: 'text-purple-400', bg: 'bg-purple-500/15', border: 'border-purple-500/30' },
                        };

                        const conf = iconMap[type] || { icon: Bell, color: 'text-cyan-400', bg: 'bg-cyan-500/15', border: 'border-cyan-500/30' };
                        const IconComponent = conf.icon;

                        const dateStr = n.created_at ? new Date(n.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }) : '';

                        return (
                          <div
                            key={n.id}
                            onClick={() => handleNotifClick(n)}
                            className={`p-3 rounded-xl transition-all text-right cursor-pointer border ${
                              isRead
                                ? 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-800/50 opacity-75 hover:opacity-100'
                                : 'bg-[#101b33] border-cyan-500/30 hover:bg-[#132140] shadow-sm'
                            }`}
                          >
                            <div className="flex items-start gap-2.5">
                              <div className={`w-7 h-7 rounded-lg ${conf.bg} ${conf.color} flex items-center justify-center shrink-0 mt-0.5 border ${conf.border}`}>
                                <IconComponent size={14} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="text-xs font-bold text-white truncate">
                                    {n.data?.title || 'إشعار جديد'}
                                  </div>
                                  <span className="text-[10px] text-slate-500 font-mono shrink-0">
                                    {dateStr}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-2 leading-relaxed">
                                  {n.data?.message}
                                </p>
                              </div>
                              {!isRead && (
                                <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0 mt-1.5 shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-8 text-center text-slate-400 space-y-2">
                        <Bell size={28} className="mx-auto text-slate-600 opacity-60" />
                        <p className="text-xs font-medium text-slate-400">لا توجد إشعارات جديدة</p>
                        <p className="text-[11px] text-slate-600">ستصلك هنا تنبيهات فورية عند تعيين مهام أو اعتماد وثائقك.</p>
                      </div>
                    )}

                    {/* Pending Approvals Quick Shortcut if any */}
                    {pendingCount > 0 && (
                      <div
                        onClick={() => { setNotifOpen(false); navigate('/documents?pending=true'); }}
                        className="p-3 rounded-xl transition-all text-right cursor-pointer bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/15 mt-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileCheck size={14} className="text-amber-400" />
                            <span className="text-xs font-bold text-amber-300">طلبات اعتماد بانتظارك ({pendingCount})</span>
                          </div>
                          <span className="text-[11px] text-amber-400 underline">عرض الكل</span>
                        </div>
                      </div>
                    )}
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
                  background: userMenuOpen ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${userMenuOpen ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.1)'}`,
                  transition: 'all 0.18s ease',
                }}
                onClick={() => { setUserMenuOpen(v => !v); setNotifOpen(false); }}
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-blue-300"
                  style={{ background: 'rgba(59,130,246,0.22)' }}
                >
                  {user?.name?.[0] || 'م'}
                </div>
                <span className="text-[13px] font-semibold hidden md:block max-w-[100px] truncate text-slate-200">
                  {user?.name}
                </span>
                <ChevronDown
                  size={13}
                  style={{ color: '#8b9cc8', transform: userMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.18s ease' }}
                />
              </button>

              {userMenuOpen && (
                <div
                  ref={userMenuRef}
                  className="absolute top-full left-0 mt-2 w-56 shadow-2xl py-1.5 animate-slide-down rounded-2xl border border-slate-700/80"
                  style={{
                    zIndex: 100,
                    backgroundColor: '#0c1322',
                    boxShadow: '0 25px 60px -15px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.08)',
                  }}
                >
                  <div className="px-4 py-3 bg-[#080d19]/90 rounded-t-xl border-b border-slate-800">
                    <div className="text-[13px] font-bold text-slate-100">{user?.name}</div>
                    <div className="text-[11px] truncate mt-0.5 text-slate-400 font-mono">{user?.email}</div>
                  </div>
                  <button
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-xs transition-colors hover:bg-white/10 text-slate-200"
                    style={{ fontFamily: 'Cairo, sans-serif', background: 'none', border: 'none', cursor: 'pointer', direction: 'rtl' }}
                    onClick={() => { setUserMenuOpen(false); navigate('/profile'); }}
                  >
                    <User size={14} className="text-blue-400" />
                    الملف الشخصي والحساب
                  </button>
                  <button
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-xs transition-colors hover:bg-rose-500/15 text-rose-400"
                    style={{ fontFamily: 'Cairo, sans-serif', background: 'none', border: 'none', cursor: 'pointer', direction: 'rtl', borderTop: '1px solid rgba(255,255,255,0.06)' }}
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
        <main className={`flex-1 p-3 sm:p-5 md:p-6 lg:p-7 overflow-auto ${isMobile ? 'pb-20' : ''}`}>
          <Outlet />
        </main>

        {/* ── Mobile Bottom Navigation Bar ── */}
        {isMobile && (
          <nav
            className="fixed bottom-0 left-0 right-0 z-40 bg-surface-900/95 backdrop-blur-xl border-t border-white/10 px-4 py-2 flex items-center justify-around no-print"
            style={{ boxShadow: '0 -4px 20px rgba(0,0,0,0.3)' }}
          >
            <NavLink to="/" end className={({ isActive }) => `flex flex-col items-center gap-1 text-[11px] ${isActive ? 'text-blue-400 font-bold' : 'text-slate-400'}`}>
              <LayoutDashboard size={18} />
              <span>الرئيسية</span>
            </NavLink>
            <NavLink to="/documents" className={({ isActive }) => `flex flex-col items-center gap-1 text-[11px] ${isActive ? 'text-blue-400 font-bold' : 'text-slate-400'}`}>
              <FileText size={18} />
              <span>الوثائق</span>
            </NavLink>
            <button
              type="button"
              onClick={() => setGlobalScannerOpen(true)}
              className="w-12 h-12 -mt-5 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 border-2 border-white/20 text-white flex items-center justify-center shadow-lg shadow-blue-500/40 active:scale-95 transition-transform"
              title="مسح ضوئي بالكاميرا"
            >
              <Camera size={20} />
            </button>
            <NavLink to="/documents/create" className={({ isActive }) => `flex flex-col items-center gap-1 text-[11px] ${isActive ? 'text-blue-400 font-bold' : 'text-slate-400'}`}>
              <Plus size={18} />
              <span>إنشاء</span>
            </NavLink>
            <NavLink to="/profile" className={({ isActive }) => `flex flex-col items-center gap-1 text-[11px] ${isActive ? 'text-blue-400 font-bold' : 'text-slate-400'}`}>
              <User size={18} />
              <span>حسابي</span>
            </NavLink>
          </nav>
        )}

        {/* ── Global Document Scanner Modal ── */}
        <DocumentScannerModal
          isOpen={globalScannerOpen}
          onClose={() => setGlobalScannerOpen(false)}
          onCapture={(file, data) => {
            navigate('/documents/create', { state: { scannedFile: file, scannedPreview: data.previewUrl } });
          }}
        />
      </div>
    </div>
  );
}
