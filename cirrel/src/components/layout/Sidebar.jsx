import { NavLink } from 'react-router-dom'
import { useStore } from '../../store'
import { Icon } from '../Icons'
import { Avatar } from '../ui'
import { LogoMark } from './Logo'
import { navGroups, utilItems } from './nav'

export function Sidebar({ onOpenPalette }) {
  const {
    sidebarCollapsed,
    setSidebarCollapsed,
    mobileOpen,
    setMobileOpen,
    theme,
    toggleTheme,
    orders,
    products,
    unreadChats,
    unreadEmails,
  } = useStore()

  const badges = {
    orders: orders.filter((o) => o.status === 'paid').length,
    stock: products.filter((p) => p.stock <= p.reorder).length,
    chats: unreadChats,
    email: unreadEmails,
  }

  const closeMobile = () => setMobileOpen(false)

  const NavItem = ({ item }) => (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={closeMobile}
      className={({ isActive }) => `nav-item ${isActive ? 'is-active' : ''}`}
      title={sidebarCollapsed ? item.label : undefined}
    >
      <span className="nav-icon">
        <Icon name={item.icon} size={18.5} />
      </span>
      <span className="nav-label">{item.label}</span>
      {item.badge && badges[item.badge] > 0 ? <span className="nav-badge">{badges[item.badge]}</span> : null}
    </NavLink>
  )

  return (
    <>
      <div className={`sidebar-scrim ${mobileOpen ? 'is-visible' : ''}`} onClick={closeMobile} />
      <aside className={`sidebar glass ${sidebarCollapsed ? 'is-collapsed' : ''} ${mobileOpen ? 'is-mobile-open' : ''}`}>
        <div className="sidebar-brand">
          <NavLink to="/" className="brand-link" onClick={closeMobile} aria-label="لوحة تحكم سيريل">
            <LogoMark size={36} />
            <span className="brand-copy">
              <span className="brand-name">سيريل</span>
              <span className="brand-store">كِلن آند ليف</span>
            </span>
          </NavLink>
          <button
            className="collapse-btn"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            aria-label={sidebarCollapsed ? 'توسيع القائمة' : 'طي القائمة'}
            title={sidebarCollapsed ? 'توسيع القائمة' : 'طي القائمة'}
          >
            <Icon name="panel" size={17} />
          </button>
        </div>

        <button className="side-search" onClick={onOpenPalette} title="بحث (⌘K)">
          <Icon name="search" size={16} />
          <span className="side-search-label">بحث…</span>
          <kbd className="kbd">⌘K</kbd>
        </button>

        <nav className="side-nav">
          {navGroups.map((group) => (
            <div className="nav-group" key={group.label}>
              <p className="nav-group-label">{group.label}</p>
              {group.items.map((item) => (
                <NavItem key={item.to} item={item} />
              ))}
            </div>
          ))}
        </nav>

        <div className="side-bottom">
          <div className="nav-group nav-group-util">
            {utilItems.map((item) => (
              <NavItem key={item.to} item={item} />
            ))}
          </div>

          <button className="theme-row" onClick={toggleTheme} title="تبديل الوضع الفاتح والداكن">
            <span className="theme-label">
              <Icon name={theme === 'dark' ? 'moon' : 'sun'} size={17} />
              <span>{theme === 'dark' ? 'الوضع الداكن' : 'الوضع الفاتح'}</span>
            </span>
            <span className={`theme-switch ${theme === 'dark' ? 'is-on' : ''}`}>
              <span className="theme-knob" />
            </span>
          </button>

          <NavLink to="/settings" className="side-user" onClick={closeMobile} title="إعدادات الحساب">
            <Avatar initials="نح" color="#2f7bff" size={34} />
            <span className="side-user-copy">
              <strong>نور حداد</strong>
              <span>noor@kilnandleaf.co</span>
            </span>
            <Icon name="logout" size={16} className="side-user-out" />
          </NavLink>
        </div>
      </aside>
    </>
  )
}
