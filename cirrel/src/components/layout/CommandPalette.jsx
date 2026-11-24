import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../store'
import { Icon } from '../Icons'
import { allPages } from './nav'

export function CommandPalette({ open, onClose }) {
  const navigate = useNavigate()
  const { orders, products, customers, toggleTheme, toast } = useStore()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef(null)
  const listRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    setQuery('')
    setActive(0)
    const t = setTimeout(() => inputRef.current?.focus(), 40)
    document.body.classList.add('overlay-open')
    return () => {
      clearTimeout(t)
      document.removeEventListener('keydown', onKey)
      document.body.classList.remove('overlay-open')
    }
  }, [open, onClose])

  const statusLabels = {
    paid: 'مدفوع', packed: 'مُغلّف', shipped: 'تم الشحن', delivered: 'تم التوصيل',
    returned: 'مُرتجع', pending: 'قيد الانتظار', active: 'نشط', expired: 'منتهي',
    scheduled: 'مجدول', due: 'مستحق', overdue: 'متأخر', draft: 'مسودة',
  }
  const q = query.trim().toLowerCase()

  const results = useMemo(() => {
    const match = (text) => text.toLowerCase().includes(q)
    const pages = allPages
      .filter((p) => !q || match(p.label) || match(p.hint))
      .slice(0, q ? 7 : 13)
      .map((p) => ({ kind: 'page', id: p.to, label: p.label, hint: p.hint, icon: p.icon, to: p.to }))
    const orderHits = q
      ? orders
          .filter((o) => match(o.id) || match(o.customer) || match(o.status) || match(statusLabels[o.status] || '') || match(o.city))
          .slice(0, 5)
          .map((o) => ({
            kind: 'order',
            id: o.id,
            label: `${o.id} · ${o.customer}`,
            hint: `${statusLabels[o.status] || o.status} · ${o.channel} · ${o.time}`,
            icon: 'bag',
            to: '/orders',
          }))
      : []
    const productHits = q
      ? products
          .filter((p) => match(p.name) || match(p.collection))
          .slice(0, 5)
          .map((p) => ({
            kind: 'product',
            id: p.id,
            label: p.name,
            hint: `${p.collection} · ${p.stock} في المخزون`,
            icon: 'box',
            to: '/products',
          }))
      : []
    const customerHits = q
      ? customers
          .filter((c) => match(c.name) || match(c.email) || match(c.segment))
          .slice(0, 4)
          .map((c) => ({
            kind: 'customer',
            id: c.id,
            label: c.name,
            hint: `${c.segment} · ${c.orders} طلب`,
            icon: 'user',
            to: '/customers',
          }))
      : []
    return { pages, orderHits, productHits, customerHits }
  }, [q, orders, products, customers])

  const flat = [...results.pages, ...results.orderHits, ...results.productHits, ...results.customerHits]

  useEffect(() => {
    listRef.current?.querySelector('.palette-item.is-active')?.scrollIntoView({ block: 'nearest' })
  }, [active])

  if (!open) return null

  const go = (item) => {
    if (!item) return
    navigate(item.to)
    onClose()
  }

  const onKeyDown = (e) => {
    if (e.key === 'Escape') return onClose()
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(flat.length - 1, a + 1))
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(0, a - 1))
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      go(flat[active])
    }
  }

  let cursor = -1
  const renderGroup = (title, items) =>
    items.length ? (
      <div className="palette-group" key={title}>
        <p className="palette-group-label">{title}</p>
        {items.map((item) => {
          cursor += 1
          const index = cursor
          return (
            <button
              key={`${item.kind}-${item.id}`}
              className={`palette-item ${active === index ? 'is-active' : ''}`}
              onMouseEnter={() => setActive(index)}
              onClick={() => go(item)}
            >
              <span className="palette-icon">
                <Icon name={item.icon} size={16} />
              </span>
              <span className="palette-copy">
                <strong>{item.label}</strong>
                <span>{item.hint}</span>
              </span>
              <Icon name="arrowUpRight" size={15} className="palette-go" />
            </button>
          )
        })}
      </div>
    ) : null

  return (
    <div className="overlay palette-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="palette glass" role="dialog" aria-modal="true" aria-label="ابحث في كل شيء">
        <div className="palette-search">
          <Icon name="search" size={19} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setActive(0)
            }}
            onKeyDown={onKeyDown}
            placeholder="ابحث في الطلبات والمنتجات والعملاء والصفحات…"
            aria-label="بحث"
          />
          <kbd className="kbd">Esc</kbd>
        </div>
        <div className="palette-results" ref={listRef}>
          {flat.length ? (
            <>
              {renderGroup(q ? 'الصفحات' : 'انتقل إلى', results.pages)}
              {renderGroup('الطلبات', results.orderHits)}
              {renderGroup('المنتجات', results.productHits)}
              {renderGroup('العملاء', results.customerHits)}
            </>
          ) : (
            <div className="palette-empty">
              <span className="empty-icon">
                <Icon name="search" size={20} />
              </span>
              <p>لا نتائج لـ «{query}»</p>
              <span>جرّب رقم طلب أو اسم شاي أو اسم عميل.</span>
            </div>
          )}
        </div>
        <div className="palette-quick">
          <button
            className="palette-quick-item"
            onClick={() => {
              toggleTheme()
              toast('تم تبديل المظهر')
            }}
          >
            <Icon name="moon" size={15} /> تبديل المظهر
          </button>
          <button
            className="palette-quick-item"
            onClick={() => {
              navigate('/discounts?create=1')
              onClose()
            }}
          >
            <Icon name="tag" size={15} /> كود خصم جديد
          </button>
          <span className="palette-keys">
            <kbd className="kbd">↑</kbd>
            <kbd className="kbd">↓</kbd> للتنقل <kbd className="kbd">↵</kbd> للفتح
          </span>
        </div>
      </div>
    </div>
  )
}
