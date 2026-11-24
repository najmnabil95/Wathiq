import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useStore } from '../store'
import { Icon } from '../components/Icons'
import { Button, Card, Drawer, EmptyState, Field, Modal, Pill, Progress, Segmented } from '../components/ui'
import { money } from '../data/sample'

const collections = ['الكل', 'الشاي', 'الخزف', 'الأطقم', 'الأدوات', 'مستلزمات']

const stockState = (p) => {
  if (p.stock === 0) return { label: 'نفد المخزون', tone: 'danger' }
  if (p.stock <= p.reorder) return { label: 'مخزون منخفض', tone: 'warn' }
  return { label: 'متوفر', tone: 'good' }
}

export function ProductsPage() {
  const { products, restock, addProduct, toast } = useStore()
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [collection, setCollection] = useState('الكل')
  const [stock, setStock] = useState('all')
  const [view, setView] = useState('grid')
  const [sort, setSort] = useState('best')
  const [detail, setDetail] = useState(null)
  const [createOpen, setCreateOpen] = useState(params.get('create') === '1')
  const [draft, setDraft] = useState({ name: '', collection: 'الشاي', price: '', stock: '', reorder: '20', note: '' })

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
    let list = products.filter((p) => {
      if (collection !== 'الكل' && p.collection !== collection) return false
      if (stock === 'out' && p.stock !== 0) return false
      if (stock === 'low' && !(p.stock > 0 && p.stock <= p.reorder)) return false
      if (stock === 'in' && (p.stock === 0 || p.stock <= p.reorder)) return false
      if (q && !(`${p.name} ${p.note} ${p.collection}`.toLowerCase().includes(q))) return false
      return true
    })
    if (sort === 'price') list = [...list].sort((a, b) => b.price - a.price)
    if (sort === 'stock') list = [...list].sort((a, b) => a.stock - b.stock)
    if (sort === 'name') list = [...list].sort((a, b) => a.name.localeCompare(b.name, 'ar'))
    return list
  }, [products, query, collection, stock, sort])

  const inventoryValue = products.reduce((s, p) => s + p.price * p.stock, 0)
  const lowCount = products.filter((p) => p.stock > 0 && p.stock <= p.reorder).length
  const outCount = products.filter((p) => p.stock === 0).length
  const active = products.length

  const createProduct = () => {
    if (!draft.name.trim()) return toast('أعطِ المنتج اسمًا', 'warn')
    addProduct(draft)
    setDraft({ name: '', collection: 'الشاي', price: '', stock: '', reorder: '20', note: '' })
    closeCreate()
  }

  const selected = detail ? products.find((p) => p.id === detail) : null

  return (
    <div className="page-stack">
      <div className="mini-stats">
        <div className="mini-stat glass">
          <span className="mini-stat-icon tone-bg-blue"><Icon name="box" size={16} /></span>
          <div><span>المنتجات النشطة</span><strong>{active}</strong></div>
        </div>
        <div className="mini-stat glass">
          <span className="mini-stat-icon tone-bg-green"><Icon name="wallet" size={16} /></span>
          <div><span>قيمة المخزون</span><strong>{money(inventoryValue, true)}</strong></div>
        </div>
        <div className="mini-stat glass">
          <span className="mini-stat-icon tone-bg-amber"><Icon name="activity" size={16} /></span>
          <div><span>مخزون منخفض</span><strong>{lowCount}</strong></div>
        </div>
        <div className="mini-stat glass">
          <span className="mini-stat-icon tone-bg-pink"><Icon name="close" size={16} /></span>
          <div><span>نفد المخزون</span><strong>{outCount}</strong></div>
        </div>
      </div>

      <Card className="page-card" padding={false}>
        <div className="page-toolbar">
          <div className="page-toolbar-title">
            <h2 className="card-title">الكتالوج</h2>
            <p className="card-sub">{products.length} منتجًا ضمن {collections.length - 1} تصنيفات</p>
          </div>
          <div className="page-toolbar-actions">
            <Button variant="soft" size="sm" icon="download" onClick={() => toast('تم تجهيز تصدير الكتالوج', 'good')}>تصدير</Button>
            <Button variant="primary" size="sm" icon="plus" onClick={() => setCreateOpen(true)}>منتج جديد</Button>
          </div>
        </div>

        <div className="filter-row">
          <div className="search-box">
            <Icon name="search" size={15} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ابحث في الكتالوج…" aria-label="بحث في المنتجات" />
            {query ? <button className="search-clear" onClick={() => setQuery('')} aria-label="مسح البحث"><Icon name="close" size={12} /></button> : null}
          </div>
          <select className="select select-sm" value={stock} onChange={(e) => setStock(e.target.value)} aria-label="حالة المخزون">
            <option value="all">كل المخزون</option>
            <option value="in">متوفر</option>
            <option value="low">مخزون منخفض</option>
            <option value="out">نفد المخزون</option>
          </select>
          <select className="select select-sm" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="الترتيب">
            <option value="best">الأكثر مبيعًا</option>
            <option value="price">الأعلى سعرًا</option>
            <option value="stock">الأقل مخزونًا</option>
            <option value="name">الاسم أ–ي</option>
          </select>
          <div className="filter-spacer" />
          <Segmented size="sm" value={view} onChange={setView} options={[{ value: 'grid', label: 'شبكة' }, { value: 'table', label: 'جدول' }]} />
        </div>

        <div className="chip-row">
          {collections.map((c) => (
            <button key={c} className={`chip ${collection === c ? 'is-active' : ''}`} onClick={() => setCollection(c)}>
              {c}
              <span>{c === 'الكل' ? products.length : products.filter((p) => p.collection === c).length}</span>
            </button>
          ))}
        </div>

        {filtered.length ? view === 'grid' ? (
          <div className="product-grid">
            {filtered.map((p) => {
              const state = stockState(p)
              return (
                <article key={p.id} className="product-card" onClick={() => setDetail(p.id)}>
                  <div className={`product-visual tone-${p.tone}`}>
                    <span className="product-emoji">{p.emoji}</span>
                    <span className="product-collection">{p.collection}</span>
                    <span className={`product-stock stock-${state.tone}`}>{state.label}</span>
                  </div>
                  <div className="product-body">
                    <div className="product-title-row">
                      <div>
                        <h3>{p.name}</h3>
                        <p>{p.note}</p>
                      </div>
                      <strong className="product-price">{money(p.price)}</strong>
                    </div>
                    <div className="product-meta">
                      <span><strong>{p.stock}</strong> في المخزون</span>
                      <span><strong>{p.sold}</strong> مبيع</span>
                      <button
                        className="ghost-action"
                        onClick={(e) => { e.stopPropagation(); restock(p.id, Math.max(10, p.reorder)) }}
                      >
                        إعادة تخزين
                      </button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>المنتج</th>
                    <th className="hide-sm">التصنيف</th>
                    <th>السعر</th>
                    <th>المخزون</th>
                    <th className="hide-md">المبيعات</th>
                    <th>الحالة</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => {
                    const state = stockState(p)
                    return (
                      <tr key={p.id} onClick={() => setDetail(p.id)}>
                        <td>
                          <div className="table-person">
                            <span className={`product-thumb tone-${p.tone}`}>{p.emoji}</span>
                            <span><strong>{p.name}</strong><em>{p.note}</em></span>
                          </div>
                        </td>
                        <td className="hide-sm"><Pill tone="neutral">{p.collection}</Pill></td>
                        <td className="table-strong">{money(p.price)}</td>
                        <td>
                          <div className="stock-cell">
                            <strong>{p.stock}</strong>
                            <span className="stock-track"><span style={{ width: `${Math.min(100, (p.stock / (p.reorder * 2)) * 100)}%` }} className={`stock-fill stock-${state.tone}`} /></span>
                          </div>
                        </td>
                        <td className="hide-md table-muted">{p.sold}</td>
                        <td><Pill tone={state.tone} dot>{state.label}</Pill></td>
                        <td className="row-action"><Icon name="chevronRight" size={15} /></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="table-foot">
              <span>عرض {filtered.length} من {products.length} منتجًا</span>
              <span className="table-foot-sum">قيمة المخزون <strong>{money(inventoryValue)}</strong></span>
            </div>
          </>
        ) : (
          <EmptyState
            icon="box"
            title="لا توجد منتجات هنا"
            sub="عدّل التصنيف أو فلتر المخزون أو البحث."
            action={<Button variant="soft" size="sm" onClick={() => { setQuery(''); setCollection('الكل'); setStock('all') }}>إعادة ضبط الفلاتر</Button>}
          />
        )}
      </Card>

      <Drawer
        open={!!selected}
        onClose={() => setDetail(null)}
        title={selected ? selected.name : 'المنتج'}
        sub={selected ? `${selected.collection} · ${selected.id}` : ''}
        footer={
          selected ? (
            <>
              <Button variant="ghost" onClick={() => setDetail(null)}>إغلاق</Button>
              <Button variant="primary" icon="plus" onClick={() => restock(selected.id, Math.max(10, selected.reorder))}>إعادة تخزين {Math.max(10, selected.reorder)}</Button>
            </>
          ) : null
        }
      >
        {selected ? (
          <div className="detail-stack">
            <div className={`product-hero tone-${selected.tone}`}>
              <span>{selected.emoji}</span>
              <div>
                <p className="product-collection">{selected.collection}</p>
                <strong>{money(selected.price)}</strong>
                <small>{selected.note}</small>
              </div>
            </div>
            <div className="detail-kpis">
              <div><span>المتوفر</span><strong>{selected.stock}</strong></div>
              <div><span>إجمالي المبيعات</span><strong>{selected.sold}</strong></div>
              <div><span>حد إعادة الطلب</span><strong>{selected.reorder}</strong></div>
            </div>
            <div>
              <div className="detail-line-head"><span>صحة المخزون</span><span>{stockState(selected).label}</span></div>
              <Progress
                value={(selected.stock / Math.max(selected.reorder * 2, 1)) * 100}
                tone={stockState(selected).tone}
                height={7}
              />
            </div>
            <div>
              <div className="detail-line-head"><span>إعادة تخزين سريعة</span><span>يُضاف إلى المخزون</span></div>
              <div className="quick-actions">
                {[10, 25, 50].map((n) => (
                  <button key={n} className="ghost-action" onClick={() => restock(selected.id, n)}>+{n}</button>
                ))}
              </div>
            </div>
            <div className="detail-note">
              <Icon name="sparkle" size={15} />
              <p>هذا المنتج معروض في واجهة المتجر. تحدّث عمليات إعادة التخزين مؤشر المخزون المنخفض ولوحة التحكم تلقائيًا.</p>
            </div>
          </div>
        ) : null}
      </Drawer>

      <Modal
        open={createOpen}
        onClose={closeCreate}
        title="منتج جديد"
        sub="يظهر في الكتالوج وواجهة المتجر فورًا"
        footer={
          <>
            <Button variant="ghost" onClick={closeCreate}>إلغاء</Button>
            <Button variant="primary" onClick={createProduct}>إضافة المنتج</Button>
          </>
        }
      >
        <div className="form-stack">
          <Field label="اسم المنتج">
            <input className="input" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="مثال: جينمايتشا" autoFocus />
          </Field>
          <div className="form-grid">
            <Field label="التصنيف">
              <select className="select" value={draft.collection} onChange={(e) => setDraft({ ...draft, collection: e.target.value })}>
                {collections.slice(1).map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="السعر (دولار)">
              <div className="input-prefix"><span>$</span><input type="number" min="0" step="0.01" value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} placeholder="0.00" /></div>
            </Field>
            <Field label="الكمية المتوفرة">
              <input className="input" type="number" min="0" value={draft.stock} onChange={(e) => setDraft({ ...draft, stock: e.target.value })} placeholder="0" />
            </Field>
            <Field label="حد إعادة الطلب">
              <input className="input" type="number" min="0" value={draft.reorder} onChange={(e) => setDraft({ ...draft, reorder: e.target.value })} />
            </Field>
          </div>
          <Field label="ملاحظة قصيرة" hint="المنشأ أو الوزن أو المادة — تظهر أسفل الاسم">
            <input className="input" value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} placeholder="أوجي، اليابان · 30غ" />
          </Field>
        </div>
      </Modal>
    </div>
  )
}
