import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useStore } from '../../store'
import { CommandPalette } from './CommandPalette'
import { CreateModal } from './CreateModal'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { Toasts } from './Toasts'
import { pageMeta } from './nav'

export function AppLayout() {
  const { sidebarCollapsed } = useStore()
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [transitionsReady, setTransitionsReady] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const t = setTimeout(() => setTransitionsReady(true), 900)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    window.scrollTo(0, 0)
    const meta = pageMeta[location.pathname]
    document.title = meta ? `${meta.title} — سيريل` : 'سيريل — كِلن آند ليف'
  }, [location.pathname])

  return (
    <div className={`app-shell ${sidebarCollapsed ? 'is-collapsed' : ''} ${transitionsReady ? 'is-ready' : ''}`}>
      <div className="aurora" aria-hidden="true">
        <span className="orb orb-blue" />
        <span className="orb orb-amber" />
        <span className="orb orb-teal" />
        <span className="orb orb-violet" />
        <span className="orb orb-pink" />
      </div>

      <Sidebar onOpenPalette={() => setPaletteOpen(true)} />

      <div className="main-wrap">
        <Topbar onOpenPalette={() => setPaletteOpen(true)} onCreate={() => setCreateOpen(true)} />
        <main className="main" key={location.pathname}>
          <Outlet />
        </main>
        <footer className="app-footer">
          <span>سيريل لمتجر كِلن آند ليف</span>
          <span className="foot-dot" />
          <span>بيانات تجريبية محفوظة في هذا المتصفح</span>
          <span className="foot-grow" />
          <button onClick={() => setPaletteOpen(true)}>
            <kbd className="kbd">⌘K</kbd> ابحث في كل شيء
          </button>
        </footer>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <CreateModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <Toasts />
    </div>
  )
}
