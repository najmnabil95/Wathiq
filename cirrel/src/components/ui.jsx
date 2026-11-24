import { useEffect } from 'react'
import { Icon } from './Icons'

export function Card({ children, className = '', padding = true, ...rest }) {
  return (
    <section className={`glass card ${padding ? 'card-pad' : ''} ${className}`} {...rest}>
      {children}
    </section>
  )
}

export function CardHead({ title, sub, action, className = '' }) {
  return (
    <header className={`card-head ${className}`}>
      <div className="card-head-copy">
        <h2 className="card-title">{title}</h2>
        {sub ? <p className="card-sub">{sub}</p> : null}
      </div>
      {action ? <div className="card-head-action">{action}</div> : null}
    </header>
  )
}

export function Button({ children, variant = 'soft', size = 'md', icon, iconRight, className = '', ...rest }) {
  return (
    <button className={`btn btn-${variant} btn-${size} ${className}`} {...rest}>
      {icon ? <Icon name={icon} size={size === 'sm' ? 15 : 17} /> : null}
      {children ? <span>{children}</span> : null}
      {iconRight ? <Icon name={iconRight} size={size === 'sm' ? 15 : 17} /> : null}
    </button>
  )
}

export function IconButton({ icon, label, className = '', size = 18, badge, ...rest }) {
  return (
    <button className={`icon-btn ${className}`} aria-label={label} title={label} {...rest}>
      <Icon name={icon} size={size} />
      {badge ? <span className="icon-badge">{badge}</span> : null}
    </button>
  )
}

export function Avatar({ initials, color = '#3d86ff', size = 34, online = false, className = '' }) {
  return (
    <span
      className={`avatar ${className}`}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(145deg, ${color}, ${shade(color, -28)})`,
        fontSize: Math.max(10, size * 0.34),
      }}
    >
      {initials}
      {online ? <span className="avatar-online" /> : null}
    </span>
  )
}

function shade(hex, amt) {
  try {
    const n = parseInt(hex.slice(1), 16)
    const r = Math.max(0, Math.min(255, (n >> 16) + amt))
    const g = Math.max(0, Math.min(255, ((n >> 8) & 0xff) + amt))
    const b = Math.max(0, Math.min(255, (n & 0xff) + amt))
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
  } catch {
    return hex
  }
}

export function Pill({ children, tone = 'neutral', dot = false, className = '' }) {
  return (
    <span className={`pill pill-${tone} ${className}`}>
      {dot ? <span className="pill-dot" /> : null}
      {children}
    </span>
  )
}

export function StatusPill({ status }) {
  const map = {
    paid: ['good', 'مدفوع'],
    packed: ['info', 'مُغلّف'],
    shipped: ['violet', 'تم الشحن'],
    delivered: ['good', 'تم التوصيل'],
    returned: ['warn', 'مُرتجع'],
    pending: ['neutral', 'قيد الانتظار'],
    active: ['good', 'نشط'],
    expired: ['neutral', 'منتهي'],
    scheduled: ['info', 'مجدول'],
    due: ['warn', 'مستحق'],
    overdue: ['danger', 'متأخر'],
    draft: ['neutral', 'مسودة'],
  }
  const [tone, label] = map[status] || ['neutral', status]
  return (
    <Pill tone={tone} dot>
      {label}
    </Pill>
  )
}

export function Segmented({ options, value, onChange, size = 'md', className = '' }) {
  return (
    <div className={`segmented segmented-${size} ${className}`} role="tablist">
      {options.map((opt) => {
        const v = typeof opt === 'string' ? opt : opt.value
        const label = typeof opt === 'string' ? opt : opt.label
        return (
          <button
            key={v}
            role="tab"
            aria-selected={value === v}
            className={`segment ${value === v ? 'is-active' : ''}`}
            onClick={() => onChange(v)}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

export function Toggle({ checked, onChange, label }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`toggle ${checked ? 'is-on' : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span className="toggle-knob" />
    </button>
  )
}

export function Field({ label, hint, children, className = '' }) {
  return (
    <label className={`field ${className}`}>
      {label ? <span className="field-label">{label}</span> : null}
      {children}
      {hint ? <span className="field-hint">{hint}</span> : null}
    </label>
  )
}

export function Modal({ open, onClose, title, sub, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.classList.add('overlay-open')
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.classList.remove('overlay-open')
    }
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal glass modal-${size}`} role="dialog" aria-modal="true" aria-label={title}>
        <header className="modal-head">
          <div>
            <h2 className="card-title">{title}</h2>
            {sub ? <p className="card-sub">{sub}</p> : null}
          </div>
          <IconButton icon="close" label="إغلاق" onClick={onClose} />
        </header>
        <div className="modal-body">{children}</div>
        {footer ? <footer className="modal-foot">{footer}</footer> : null}
      </div>
    </div>
  )
}

export function Drawer({ open, onClose, title, sub, children, footer }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.classList.add('overlay-open')
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.classList.remove('overlay-open')
    }
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="overlay drawer-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside className="drawer glass" aria-label={title}>
        <header className="modal-head">
          <div>
            <h2 className="card-title">{title}</h2>
            {sub ? <p className="card-sub">{sub}</p> : null}
          </div>
          <IconButton icon="close" label="إغلاق" onClick={onClose} />
        </header>
        <div className="drawer-body">{children}</div>
        {footer ? <footer className="modal-foot">{footer}</footer> : null}
      </aside>
    </div>
  )
}

export function EmptyState({ icon = 'search', title, sub, action }) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <Icon name={icon} size={22} />
      </span>
      <p className="empty-title">{title}</p>
      {sub ? <p className="empty-sub">{sub}</p> : null}
      {action}
    </div>
  )
}

export function Progress({ value, tone = 'accent', height = 6 }) {
  return (
    <span className="progress" style={{ height }}>
      <span className={`progress-fill progress-${tone}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </span>
  )
}
