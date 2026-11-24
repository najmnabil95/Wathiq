import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useStore } from '../store'
import { Icon } from '../components/Icons'
import {
  Avatar,
  Button,
  Card,
  Drawer,
  EmptyState,
  Field,
  Modal,
  Pill,
  Segmented,
  StatusPill,
} from '../components/ui'
import { money } from '../data/sample'

const statusOrder = ['paid', 'packed', 'shipped', 'delivered']
const columns = [
  { key: 'paid', label: 'مدفوع', hint: 'بانتظار التغليف' },
  { key: 'packed', label: 'مُغلّف', hint: 'جاهز للاستلام' },
  { key: 'shipped', label: 'تم الشحن', hint: 'في الطريق' },
  { key: 'delivered', label: 'تم التوصيل', hint: 'مكتمل' },
]

const statusLabels = { paid: 'مدفوع', packed: 'مُغلّف', shipped: 'تم الشحن', delivered: 'تم التوصيل', returned: 'مُرتجع', pending: 'قيد الانتظار' }

const csvEscape = (v) => `"${String(v).replaceAll('"', '""')}"`

const downloadCsv = (rows) => {
  const header = ['الطلب', 'العميل', 'المنتجات', 'القناة', 'الإجمالي', 'الحالة', 'الوقت']
  const lines = [
    header.join(','),
    ...rows.map((o) =>
      [o.id, o.customer, o.items.join(' · '), o.channel, o.total.toFixed(2), statusLabels[o.status] || o.status, o.time].map(csvEscape).join(','),
    ),
  ]
  const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'kiln-and-leaf-orders.csv'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function OrdersPage() {
  const { orders, setOrderStatus, addOrder, toast } = useStore()
  const [params, setParams] = useSearchParams()
  const [tab, setTab] = useState('all')
  const [view, setView] = useState(params.get('view') === 'board' ? 'board' : 'table')
  const [query, setQuery] = useState('')
  const [channel, setChannel] = useState('all')
  const [sort, setSort] = useState('newest')
  const [selected, setSelected] = useState([])
  const [detail, setDetail] = useState(null)
  const [createOpen, setCreateOpen] = useState(params.get('create') === '1')
  const [draft, setDraft] = useState({ customer: '', total: '', channel: 'المتجر الإلكتروني', items: '' })
  const [dragging, setDragging] = useState(null)

  useEffect(() => {
    if (params.get('create') === '1') setCreateOpen(true)
    if (params.get('view') === 'board') setView('board')
  }, [params])

  const closeCreate = () => {
    setCreateOpen(false)
    if (params.get('create')) {
      const next = new URLSearchParams(params)
      next.delete('create')
      setParams(next, { replace: true })
    }
  }

  const counts = useMemo(() => {
    const base = { all: orders.length, returns: orders.filter((o) => o.status === 'returned').length }
    statusOrder.forEach((s) => (base[s] = orders.filter((o) => o.status === s).length))
    base.pending = orders.filter((o) => o.status === 'pending').length
    return base
  }, [orders])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = orders.filter((o) => {
      if (tab === 'returns') return o.status === 'returned'
      if (tab !== 'all' && o.status !== tab) return false
      if (channel !== 'all' && o.channel !== channel) return false
      if (!q) return true
      return (
        o.id.toLowerCase().includes(q) ||
        o.customer.toLowerCase().includes(q) ||
        o.city.toLowerCase().includes(q) ||
        o.items.join(' ').toLowerCase().includes(q)
      )
    })
    if (sort === 'total') list = [...list].sort((a, b) => b.total - a.total)
    if (sort === 'name') list = [...list].sort((a, b) => a.customer.localeCompare(b.customer))
    return list
  }, [orders, tab, query, channel, sort])

  const allChecked = filtered.length > 0 && filtered.every((o) => selected.includes(o.id))
  const toggleAll = () => setSelected(allChecked ? [] : filtered.map((o) => o.id))
  const toggleOne = (id) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const bulkPack = () => {
    selected.forEach((id) => {
      const order = orders.find((o) => o.id === id)
      if (order && ['paid', 'pending'].includes(order.status)) setOrderStatus(id, 'packed')
    })
    toast(`نُقل ${selected.length} طلبات إلى التغليف`, 'good')
    setSelected([])
  }

  const createOrder = () => {
    if (!draft.customer.trim()) return toast('أضف اسم العميل', 'warn')
    addOrder({
      customer: draft.customer,
      total: draft.total || 0,
      channel: draft.channel,
      items: draft.items ? draft.items.split(',').map((s) => s.trim()) : ['طلب مخصص'],
    })
    setDraft({ customer: '', total: '', channel: 'المتجر الإلكتروني', items: '' })
    closeCreate()
  }

  const selectedOrder = detail ? orders.find((o) => o.id === detail) : null

  const tabs = [
    { key: 'all', label: 'الكل', count: counts.all },
    { key: 'paid', label: 'مدفوع', count: counts.paid },
    { key: 'packed', label: 'مُغلّف', count: counts.packed },
    { key: 'shipped', label: 'تم الشحن', count: counts.shipped },
    { key: 'delivered', label: 'تم التوصيل', count: counts.delivered },
    { key: 'returns', label: 'المرتجعات', count: counts.returns },
  ]

  return (
    <div className="page-stack">
      <div className="mini-stats">
        <div className="mini-stat glass">
          <span className="mini-stat-icon tone-bg-amber"><Icon name="box" size={16} /></span>
          <div><span>بانتظار التغليف</span><strong>{counts.paid}</strong></div>
        </div>
        <div className="mini-stat glass">
          <span className="mini-stat-icon tone-bg-blue"><Icon name="truck" size={16} /></span>
          <div><span>في الطريق</span><strong>{counts.shipped}</strong></div>
        </div>
        <div className="mini-stat glass">
          <span className="mini-stat-icon tone-bg-violet"><Icon name="return" size={16} /></span>
          <div><span>المرتجعات</span><strong>{counts.returns}</strong></div>
        </div>
        <div className="mini-stat glass">
          <span className="mini-stat-icon tone-bg-green"><Icon name="wallet" size={16} /></span>
          <div><span>مدفوع اليوم</span><strong>{money(244)}</strong></div>
        </div>
      </div>

      <Card className="page-card" padding={false}>
        <div className="page-toolbar">
          <div className="tabs" role="tablist">
            {tabs.map((t) => (
              <button
                key={t.key}
                role="tab"
                aria-selected={tab === t.key}
                className={`tab ${tab === t.key ? 'is-active' : ''}`}
                onClick={() => { setTab(t.key); setSelected([]); if (t.key === 'returns') setView('table') }}
              >
                {t.label}
                <span className="tab-count">{t.count}</span>
              </button>
            ))}
          </div>
          <div className="page-toolbar-actions">
            <Button variant="soft" size="sm" icon="download" onClick={() => { downloadCsv(filtered); toast('تم تصدير CSV', 'good') }}>
              تصدير
            </Button>
            <Button variant="primary" size="sm" icon="plus" onClick={() => setCreateOpen(true)}>
              طلب جديد
            </Button>
          </div>
        </div>

        <div className="filter-row">
          <div className="search-box">
            <Icon name="search" size={15} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث برقم الطلب أو الاسم أو المدينة أو المنتج…"
              aria-label="بحث في الطلبات"
            />
            {query ? (
              <button className="search-clear" onClick={() => setQuery('')} aria-label="مسح البحث">
                <Icon name="close" size={12} />
              </button>
            ) : null}
          </div>
          <select className="select select-sm" value={channel} onChange={(e) => setChannel(e.target.value)} aria-label="القناة">
            <option value="all">كل القنوات</option>
            <option>المتجر الإلكتروني</option>
            <option>إنستغرام</option>
            <option>السوق المحلي</option>
            <option>البيع بالجملة</option>
          </select>
          <select className="select select-sm" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="الترتيب">
            <option value="newest">الأحدث أولًا</option>
            <option value="total">الأعلى قيمة</option>
            <option value="name">اسم العميل أ–ي</option>
          </select>
          <div className="filter-spacer" />
          <Segmented
            size="sm"
            value={view}
            onChange={(v) => setView(v)}
            options={[
              { value: 'table', label: 'جدول' },
              { value: 'board', label: 'لوحة' },
            ]}
          />
        </div>

        {selected.length ? (
          <div className="bulk-bar">
            <strong>محدد: {selected.length}</strong>
            <button onClick={bulkPack}><Icon name="box" size={13} /> تم التغليف</button>
            <button onClick={() => { downloadCsv(orders.filter((o) => selected.includes(o.id))); toast('تم تصدير المحدد', 'good') }}>
              <Icon name="download" size={13} /> تصدير
            </button>
            <button onClick={() => setSelected([])}><Icon name="close" size={13} /> مسح</button>
          </div>
        ) : null}

        {view === 'board' ? (
          <div className="board-wrap">
            <div className="board">
              {columns.map((col) => {
                const list = filtered.filter((o) => o.status === col.key)
                return (
                  <div
                    key={col.key}
                    className={`board-col ${dragging ? 'is-dragging' : ''}`}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (dragging) {
                        setOrderStatus(dragging, col.key)
                        setDragging(null)
                      }
                    }}
                  >
                    <header className="board-head">
                      <span className={`board-dot dot-${col.key}`} />
                      <strong>{col.label}</strong>
                      <span className="board-count">{list.length}</span>
                      <span className="board-hint">{col.hint}</span>
                    </header>
                    <div className="board-list">
                      {list.map((o) => (
                        <article
                          key={o.id}
                          className="board-card"
                          draggable
                          onDragStart={() => setDragging(o.id)}
                          onDragEnd={() => setDragging(null)}
                          onClick={() => setDetail(o.id)}
                        >
                          <div className="board-card-top">
                            <span className="mono-id">{o.id}</span>
                            <span className="board-time">{o.time.split(/[،,]/)[0]}</span>
                          </div>
                          <div className="board-customer">
                            <Avatar initials={o.initials} color={o.color} size={27} />
                            <strong>{o.customer}</strong>
                            <span>{money(o.total)}</span>
                          </div>
                          <p className="board-items">{o.items.join(' · ')}</p>
                          <div className="board-card-foot">
                            <Pill tone="neutral">{o.channel}</Pill>
                            <span className="board-grab"><Icon name="more" size={14} /></span>
                          </div>
                        </article>
                      ))}
                      {!list.length ? <p className="board-empty">أفلت طلبًا هنا</p> : null}
                    </div>
                  </div>
                )
              })}
            </div>
            <p className="board-tip">اسحب البطاقة إلى العمود التالي لتحديث حالتها. يُحفظ التغيير فورًا.</p>
          </div>
        ) : filtered.length ? (
          <>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="check-cell">
                      <input type="checkbox" checked={allChecked} onChange={toggleAll} aria-label="تحديد كل الطلبات" />
                    </th>
                    <th>الطلب</th>
                    <th>العميل</th>
                    <th className="hide-md">المنتجات</th>
                    <th className="hide-sm">القناة</th>
                    <th>الإجمالي</th>
                    <th>الحالة</th>
                    <th className="hide-lg">التاريخ</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((o) => (
                    <tr key={o.id} className={selected.includes(o.id) ? 'is-selected' : ''} onClick={() => setDetail(o.id)}>
                      <td className="check-cell" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selected.includes(o.id)}
                          onChange={() => toggleOne(o.id)}
                          aria-label={`تحديد ${o.id}`}
                        />
                      </td>
                      <td><span className="mono-id">{o.id}</span></td>
                      <td>
                        <div className="table-person">
                          <Avatar initials={o.initials} color={o.color} size={28} />
                          <span>
                            <strong>{o.customer}</strong>
                            <em>{o.city}</em>
                          </span>
                        </div>
                      </td>
                      <td className="hide-md table-items">{o.items.join(' · ')}</td>
                      <td className="hide-sm"><Pill tone="neutral">{o.channel}</Pill></td>
                      <td className="table-strong">{money(o.total)}</td>
                      <td><StatusPill status={o.status} /></td>
                      <td className="hide-lg table-muted">{o.time}</td>
                      <td className="row-action"><Icon name="chevronRight" size={15} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="table-foot">
              <span>عرض {filtered.length} من {orders.length} طلبًا</span>
              <span className="table-foot-sum">
                القيمة الإجمالية <strong>{money(filtered.reduce((s, o) => s + o.total, 0))}</strong>
              </span>
            </div>
          </>
        ) : (
          <EmptyState
            icon="bag"
            title="لا توجد طلبات مطابقة"
            sub="جرّب مسح البحث أو اختيار قناة أخرى."
            action={<Button variant="soft" size="sm" onClick={() => { setQuery(''); setChannel('all'); setTab('all') }}>إعادة ضبط الفلاتر</Button>}
          />
        )}
      </Card>

      <Drawer
        open={!!selectedOrder}
        onClose={() => setDetail(null)}
        title={selectedOrder ? selectedOrder.id : 'الطلب'}
        sub={selectedOrder ? selectedOrder.time : ''}
        footer={
          selectedOrder ? (
            <>
              <Button variant="ghost" onClick={() => setDetail(null)}>إغلاق</Button>
              {selectedOrder.status !== 'delivered' ? (
                <Button
                  variant="primary"
                  onClick={() => {
                    const idx = statusOrder.indexOf(selectedOrder.status)
                    const next = statusOrder[Math.min(statusOrder.length - 1, idx + 1)] || 'packed'
                    setOrderStatus(selectedOrder.id, next)
                    setDetail(null)
                  }}
                >
                  انقل إلى {columns[Math.min(statusOrder.length - 1, statusOrder.indexOf(selectedOrder.status) + 1)]?.label || 'مُغلّف'}
                </Button>
              ) : null}
            </>
          ) : null
        }
      >
        {selectedOrder ? (
          <div className="detail-stack">
            <div className="detail-person">
              <Avatar initials={selectedOrder.initials} color={selectedOrder.color} size={46} />
              <div>
                <strong>{selectedOrder.customer}</strong>
                <span>{selectedOrder.email || 'عميل جملة'}</span>
              </div>
              <StatusPill status={selectedOrder.status} />
            </div>
            <dl className="detail-rows">
              <div><dt>المنتجات</dt><dd>{selectedOrder.items.join('، ')}</dd></div>
              <div><dt>إجمالي الطلب</dt><dd>{money(selectedOrder.total)}</dd></div>
              <div><dt>القناة</dt><dd>{selectedOrder.channel}</dd></div>
              <div><dt>الشحن إلى</dt><dd>{selectedOrder.city}</dd></div>
              <div><dt>تاريخ الطلب</dt><dd>{selectedOrder.time}</dd></div>
            </dl>
            <div className="detail-note">
              <Icon name="sparkle" size={15} />
              <p>بوليصة التغليف والملصق جاهزان. اسحب الطلب عبر اللوحة، أو استخدم الزر أدناه لنقله.</p>
            </div>
            <div className="detail-timeline">
              {statusOrder.map((s, i) => (
                <div key={s} className={`timeline-step ${statusOrder.indexOf(selectedOrder.status) >= i ? 'is-done' : ''}`}>
                  <span>{statusOrder.indexOf(selectedOrder.status) > i ? <Icon name="check" size={11} /> : i + 1}</span>
                  <p>{columns[i].label}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </Drawer>

      <Modal
        open={createOpen}
        onClose={closeCreate}
        title="طلب جديد"
        sub="تصل الطلبات اليدوية إلى طابور التغليف كمدفوعة"
        footer={
          <>
            <Button variant="ghost" onClick={closeCreate}>إلغاء</Button>
            <Button variant="primary" onClick={createOrder}>إنشاء الطلب</Button>
          </>
        }
      >
        <div className="form-stack">
          <Field label="العميل">
            <input className="input" value={draft.customer} onChange={(e) => setDraft({ ...draft, customer: e.target.value })} placeholder="مثال: صوفيا مورينو" autoFocus />
          </Field>
          <div className="form-grid">
            <Field label="الإجمالي (دولار)">
              <div className="input-prefix">
                <span>$</span>
                <input type="number" min="0" step="0.01" value={draft.total} onChange={(e) => setDraft({ ...draft, total: e.target.value })} placeholder="0.00" />
              </div>
            </Field>
            <Field label="القناة">
              <select className="select" value={draft.channel} onChange={(e) => setDraft({ ...draft, channel: e.target.value })}>
                <option>المتجر الإلكتروني</option>
                <option>إنستغرام</option>
                <option>السوق المحلي</option>
                <option>البيع بالجملة</option>
              </select>
            </Field>
          </div>
          <Field label="المنتجات" hint="افصل بين المنتجات بفاصلة">
            <input className="input" value={draft.items} onChange={(e) => setDraft({ ...draft, items: e.target.value })} placeholder="ماتشا احتفالية ×2، خفاقة ماتشا ×1" />
          </Field>
        </div>
      </Modal>
    </div>
  )
}
