import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useStore } from '../store'
import { Icon, Stars } from '../components/Icons'
import { Avatar, Button, Card, CardHead, Drawer, EmptyState, Field, Modal, Pill } from '../components/ui'
import { money, reviews } from '../data/sample'

const segments = ['الكل', 'VIP', 'منتظم', 'جديد', 'معرّض للفقد', 'بالجملة']

const segmentTone = { VIP: 'violet', 'منتظم': 'info', 'جديد': 'good', 'معرّض للفقد': 'warn', 'بالجملة': 'neutral' }

export function CustomersPage() {
  const { customers, addCustomer, addActivity, toast } = useStore()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [segment, setSegment] = useState('الكل')
  const [sort, setSort] = useState('spend')
  const [detail, setDetail] = useState(null)
  const [createOpen, setCreateOpen] = useState(params.get('create') === '1')
  const [draft, setDraft] = useState({ name: '', email: '', city: '', segment: 'جديد' })

  useEffect(() => {
    if (params.get('create') === '1') setCreateOpen(true)
  }, [params])

  const closeCreate = () => {
    setCreateOpen(false)
    if (params.get('create')) {
      const next = new URLSearchParams(params)
      next.delete('create')
      setParams(next, { replace: true })
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = customers.filter((c) => {
      if (segment !== 'الكل' && c.segment !== segment) return false
      if (!q) return true
      return `${c.name} ${c.email} ${c.city} ${c.segment}`.toLowerCase().includes(q)
    })
    if (sort === 'spend') list = [...list].sort((a, b) => b.spend - a.spend)
    if (sort === 'orders') list = [...list].sort((a, b) => b.orders - a.orders)
    if (sort === 'name') list = [...list].sort((a, b) => a.name.localeCompare(b.name, 'ar'))
    return list
  }, [customers, query, segment, sort])

  const totalSpend = customers.reduce((s, c) => s + c.spend, 0)
  const repeat = customers.filter((c) => c.orders > 1).length
  const vips = customers.filter((c) => c.segment === 'VIP').length
  const avgSpend = totalSpend / Math.max(1, customers.length)

  const createCustomer = () => {
    if (!draft.name.trim()) return toast('أضف اسم العميل', 'warn')
    if (!draft.email.trim()) return toast('أضف بريدًا إلكترونيًا', 'warn')
    addCustomer(draft)
    addActivity('نور', `أضاف العميل ${draft.name}`)
    setDraft({ name: '', email: '', city: '', segment: 'جديد' })
    closeCreate()
  }

  const selected = detail ? customers.find((c) => c.id === detail) : null
  const selectedReviews = selected ? reviews.filter((r) => r.customer === selected.name) : []

  return (
    <div className="page-stack">
      <div className="mini-stats">
        <div className="mini-stat glass">
          <span className="mini-stat-icon tone-bg-blue"><Icon name="users" size={16} /></span>
          <div><span>العملاء</span><strong>{customers.length}</strong></div>
        </div>
        <div className="mini-stat glass">
          <span className="mini-stat-icon tone-bg-green"><Icon name="return" size={16} /></span>
          <div><span>المشترون المتكررون</span><strong>{Math.round((repeat / customers.length) * 100)}%</strong></div>
        </div>
        <div className="mini-stat glass">
          <span className="mini-stat-icon tone-bg-amber"><Icon name="wallet" size={16} /></span>
          <div><span>إجمالي الإنفاق</span><strong>{money(totalSpend, true)}</strong></div>
        </div>
        <div className="mini-stat glass">
          <span className="mini-stat-icon tone-bg-violet"><Icon name="sparkle" size={16} /></span>
          <div><span>عملاء VIP</span><strong>{vips}</strong></div>
        </div>
      </div>

      <Card className="page-card" padding={false}>
        <div className="page-toolbar">
          <div className="page-toolbar-title">
            <h2 className="card-title">دفتر العملاء</h2>
            <p className="card-sub">متوسط الإنفاق مدى الحياة {money(avgSpend)}</p>
          </div>
          <div className="page-toolbar-actions">
            <Button variant="soft" size="sm" icon="download" onClick={() => toast('تم تصدير ملف العملاء', 'good')}>تصدير</Button>
            <Button variant="primary" size="sm" icon="plus" onClick={() => setCreateOpen(true)}>إضافة عميل</Button>
          </div>
        </div>

        <div className="filter-row">
          <div className="search-box">
            <Icon name="search" size={15} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ابحث بالاسم أو البريد أو المدينة أو الشريحة…" aria-label="بحث في العملاء" />
            {query ? <button className="search-clear" onClick={() => setQuery('')} aria-label="مسح البحث"><Icon name="close" size={12} /></button> : null}
          </div>
          <select className="select select-sm" value={segment} onChange={(e) => setSegment(e.target.value)} aria-label="الشريحة">
            {segments.map((s) => <option key={s} value={s}>{s === 'الكل' ? 'كل الشرائح' : s}</option>)}
          </select>
          <select className="select select-sm" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="الترتيب">
            <option value="spend">الأعلى إنفاقًا</option>
            <option value="orders">الأكثر طلبًا</option>
            <option value="name">الاسم أ–ي</option>
          </select>
          <div className="filter-spacer" />
          <Pill tone="neutral">ظاهر: {filtered.length}</Pill>
        </div>

        {filtered.length ? (
          <>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>العميل</th>
                    <th className="hide-md">المدينة</th>
                    <th>الشريحة</th>
                    <th>الطلبات</th>
                    <th>الإنفاق</th>
                    <th className="hide-sm">آخر طلب</th>
                    <th className="hide-lg">التقييمات</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => {
                    const customerReviews = reviews.filter((r) => r.customer === c.name)
                    return (
                      <tr key={c.id} onClick={() => setDetail(c.id)}>
                        <td>
                          <div className="table-person">
                            <Avatar initials={c.initials} color={c.color} size={30} />
                            <span><strong>{c.name}</strong><em>{c.email}</em></span>
                          </div>
                        </td>
                        <td className="hide-md table-muted">{c.city}</td>
                        <td><Pill tone={segmentTone[c.segment]} dot>{c.segment}</Pill></td>
                        <td className="table-strong">{c.orders}</td>
                        <td className="table-strong">{money(c.spend)}</td>
                        <td className="hide-sm table-muted">{c.lastOrder}</td>
                        <td className="hide-lg">
                          {customerReviews.length ? (
                            <span className="review-count"><Stars rating={customerReviews[0].rating} size={11} /> {customerReviews[0].rating}.0</span>
                          ) : <span className="table-muted">—</span>}
                        </td>
                        <td className="row-action"><Icon name="chevronRight" size={15} /></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="table-foot">
              <span>عرض {filtered.length} من {customers.length} عميلًا</span>
              <span className="table-foot-sum">القيمة مدى الحياة <strong>{money(filtered.reduce((s, c) => s + c.spend, 0))}</strong></span>
            </div>
          </>
        ) : (
          <EmptyState icon="users" title="لا يوجد عملاء مطابقون" sub="جرّب شريحة أخرى أو امسح البحث." />
        )}
      </Card>

      <Card className="reviews-card">
        <CardHead
          title="أحدث التقييمات"
          sub={`${reviews.length} تقييمات · متوسط 4.7`}
          action={<span className="tiny-link">كل التقييمات</span>}
        />
        <div className="review-grid">
          {reviews.slice(0, 3).map((r) => (
            <article className="review-card" key={r.id}>
              <div className="review-head">
                <Avatar initials={r.initials} color={r.color} size={30} />
                <div>
                  <strong>{r.customer}</strong>
                  <span>{r.product} · {r.date}</span>
                </div>
                <Stars rating={r.rating} size={12} />
              </div>
              <p>{r.text}</p>
            </article>
          ))}
        </div>
      </Card>

      <Drawer
        open={!!selected}
        onClose={() => setDetail(null)}
        title={selected ? selected.name : 'العميل'}
        sub={selected ? `${selected.segment} · انضم في ${selected.joined}` : ''}
        footer={
          selected ? (
            <>
              <Button variant="ghost" onClick={() => setDetail(null)}>إغلاق</Button>
              <Button variant="primary" icon="mail" onClick={() => { setDetail(null); navigate('/email') }}>إرسال بريد</Button>
            </>
          ) : null
        }
      >
        {selected ? (
          <div className="detail-stack">
            <div className="customer-hero">
              <Avatar initials={selected.initials} color={selected.color} size={54} />
              <div>
                <strong>{selected.name}</strong>
                <span>{selected.email}</span>
                <span>{selected.city}</span>
              </div>
              <Pill tone={segmentTone[selected.segment]} dot>{selected.segment}</Pill>
            </div>
            <div className="detail-kpis">
              <div><span>الطلبات</span><strong>{selected.orders}</strong></div>
              <div><span>إجمالي الإنفاق</span><strong>{money(selected.spend)}</strong></div>
              <div><span>متوسط الطلب</span><strong>{money(selected.spend / Math.max(1, selected.orders))}</strong></div>
            </div>
            <dl className="detail-rows">
              <div><dt>آخر طلب</dt><dd>{selected.lastOrder}</dd></div>
              <div><dt>عميل منذ</dt><dd>{selected.joined}</dd></div>
              <div><dt>القناة المفضلة</dt><dd>المتجر الإلكتروني</dd></div>
            </dl>
            <div>
              <div className="detail-line-head"><span>التقييمات</span><span>{selectedReviews.length || 'لا يوجد بعد'}</span></div>
              {selectedReviews.length ? (
                <div className="drawer-reviews">
                  {selectedReviews.map((r) => (
                    <article key={r.id}>
                      <Stars rating={r.rating} size={12} />
                      <p>{r.text}</p>
                      <span>{r.product} · {r.date}</span>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="muted-note">لا يوجد تقييم من هذا العميل بعد.</p>
              )}
            </div>
            <div className="detail-note">
              <Icon name="sparkle" size={15} />
              <p>{selected.segment === 'VIP' ? 'عميل VIP — الوصول المبكر لحصاد الربيع والشحن المجاني مناسب هنا.' : 'رسالة شكر ودودة مع الطلب القادم تصنع فرقًا كبيرًا.'}</p>
            </div>
          </div>
        ) : null}
      </Drawer>

      <Modal
        open={createOpen}
        onClose={closeCreate}
        title="إضافة عميل"
        sub="تجمع الملفات الطلبات والتقييمات معًا"
        footer={
          <>
            <Button variant="ghost" onClick={closeCreate}>إلغاء</Button>
            <Button variant="primary" onClick={createCustomer}>إضافة عميل</Button>
          </>
        }
      >
        <div className="form-stack">
          <Field label="الاسم الكامل">
            <input className="input" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="مثال: صوفيا مورينو" autoFocus />
          </Field>
          <Field label="البريد الإلكتروني">
            <input className="input" type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} placeholder="name@example.com" />
          </Field>
          <div className="form-grid">
            <Field label="المدينة">
              <input className="input" value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} placeholder="لشبونة" />
            </Field>
            <Field label="الشريحة">
              <select className="select" value={draft.segment} onChange={(e) => setDraft({ ...draft, segment: e.target.value })}>
                {segments.slice(1).map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
          </div>
        </div>
      </Modal>
    </div>
  )
}
