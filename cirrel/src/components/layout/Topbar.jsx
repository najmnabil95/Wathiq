import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useStore } from '../../store'
import { Icon } from '../Icons'
import { Avatar, Button, IconButton } from '../ui'
import { dateLabel, timeGreeting } from '../../data/sample'
import { pageMeta } from './nav'

export function Topbar({ onOpenPalette, onCreate }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { setMobileOpen, notifications, notificationsRead, markNotificationsRead } = useStore()
  const [bellOpen, setBellOpen] = useState(false)
  const bellRef = useRef(null)

  const path = location.pathname
  const meta = pageMeta[path] || { title: 'لوحة التحكم', crumb: 'لوحة التحكم' }
  const isDashboard = path === '/'

  useEffect(() => {
    const onDown = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  return (
    <header className="topbar">
      <button className="mobile-menu" onClick={() => setMobileOpen(true)} aria-label="فتح القائمة">
        <Icon name="menu" size={20} />
      </button>

      <div className="topbar-heading">
        {isDashboard ? (
          <>
            <h1 className="page-greeting">{timeGreeting()}</h1>
            <p className="page-sub">
              <span className="live-dot" />
              {dateLabel()} <span className="crumb-sep">/</span> لوحة التحكم
            </p>
          </>
        ) : (
          <>
            <h1 className="page-greeting">{meta.title}</h1>
            <p className="page-sub">
              <span className="live-dot" />
              {dateLabel()} <span className="crumb-sep">/</span> كِلن آند ليف
              <span className="crumb-sep">/</span> {meta.crumb}
            </p>
          </>
        )}
      </div>

      <div className="topbar-actions">
        <IconButton icon="search" label="بحث (⌘K)" className="desktop-search" onClick={onOpenPalette} />
        <div className="bell-wrap" ref={bellRef}>
          <IconButton
            icon="bell"
            label="الإشعارات"
            className="bell-btn"
            onClick={() => setBellOpen((v) => !v)}
            badge={notificationsRead ? null : '4'}
          />
          {bellOpen ? (
            <div className="bell-pop glass">
              <div className="bell-head">
                <div>
                  <h3 className="card-title">الإشعارات</h3>
                  <p className="card-sub">أسبوع هادئ، وأخباره جيدة غالبًا</p>
                </div>
                <button className="link-btn" onClick={markNotificationsRead}>
                  تعليم الكل كمقروء
                </button>
              </div>
              <ul className="bell-list">
                {notifications.map((n) => (
                  <li key={n.id} className={`bell-item bell-${n.tone}`}>
                    <span className="bell-dot" />
                    <div className="bell-copy">
                      <strong>{n.title}</strong>
                      <span>{n.detail}</span>
                    </div>
                    <span className="bell-time">{n.time}</span>
                  </li>
                ))}
              </ul>
              <button className="bell-foot" onClick={() => { setBellOpen(false); navigate('/orders') }}>
                افتح طابور اليوم <Icon name="arrowLeft" size={15} />
              </button>
            </div>
          ) : null}
        </div>
        <Button variant="primary" icon="plus" className="create-btn" onClick={onCreate}>
          إنشاء
        </Button>
        <button className="topbar-avatar" onClick={() => navigate('/settings')} aria-label="الحساب">
          <Avatar initials="نح" color="#2f7bff" size={34} />
        </button>
      </div>
    </header>
  )
}
