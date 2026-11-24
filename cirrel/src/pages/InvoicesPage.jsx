import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useStore } from '../store'
import { Icon } from '../components/Icons'
import { Avatar, Button, Card, Drawer, EmptyState, Field, Modal, StatusPill } from '../components/ui'
import { money } from '../data/sample'

const tabs = ['all', 'due', 'overdue', 'paid', 'draft']
const tabLabels = { all: 'كل الفواتير', due: 'مستحقة', overdue: 'متأخرة', paid: 'مدفوعة', draft: 'مسودة' }

export function InvoicesPage() {
  const { invoices, markInvoicePaid, addInvoice, toast } = useStore()
  const [params, setParams] = useSearchParams()
  const [tab, setTab] = useState('all')
  const [query, setQuery] = useState('')
  const [detail, setDetail] = useState(null)
  const [createOpen, setCreateOpen] = useState(params.get('create') === '1')
  const [draft, setDraft] = useState({ customer: '', total: '' })

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

  const outstanding = invoices.filter((i) => ['due', 'overdue'].includes(i.status)).reduce((s, i) => s + i.total, 0)
  const overdue = invoices.filter((i) => i.status === 'overdue')
  const paidTotal = invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + i.total, 0)
  const drafts = invoices.filter((i) => i.status === 'draft')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return invoices.filter((i) => {
      if (tab !== 'all' && i.status !== tab) return false
      if (!q) return true
      return `${i.id} ${i.customer}`.toLowerCase().includes(q)
    })
  }, [invoices, tab, query])

  const createInvoice = () => {
    if (!draft.customer.trim()) return toast('أضف اسم العميل', 'warn')
    if (!draft.total) return toast('أضف المبلغ', 'warn')
    addInvoice(draft)
    setDraft({ customer: '', total: '' })
    closeCreate()
  }

  const selected = detail ? invoices.find((i) => i.id === detail) : null

  return (
    <div className="page-stack">
      <div className="mini-stats">
        <div className="mini-stat glass">
          <span className="mini-stat-icon tone-bg-blue"><Icon name="file" size={16} /></span>
          <div><span>المستحقة</span><strong>{money(outstanding, true)}</strong></div>
        </div>
        <div className="mini-stat glass">
          <span className="mini-stat-icon tone-bg-pink"><Icon name="clock" size={16} /></span>
          <div><span>متأخرة</span><strong>{overdue.length}</strong></div>
        </div>
        <div className="mini-stat glass">
          <span className="mini-stat-icon tone-bg-green"><Icon name="check" size={16} /></span>
          <div><span>مدفوعة هذا الشهر</span><strong>{money(paidTotal, true)}</strong></div>
        </div>
        <div className="mini-stat glass">
          <span className="mini-stat-icon tone-bg-amber"><Icon name="edit" size={16} /></span>
          <div><span>المسودات</span><strong>{drafts.length}</strong></div>
        </div>
      </div>

      <Card className="page-card" padding={false}>
        <div className="page-toolbar">
          <div className="tabs">
            {tabs.map((t) => (
              <button key={t} className={`tab ${tab === t ? 'is-active' : ''}`} onClick={() => setTab(t)}>
                {tabLabels[t]}
                <span className="tab-count">
                  {t === 'all' ? invoices.length : invoices.filter((i) => i.status === t).length}
                </span>
              </button>
            ))}
          </div>
          <div className="page-toolbar-actions">
            <Button variant="soft" size="sm" icon="download" onClick={() => toast('تم تصدير الفواتير', 'good')}>تصدير</Button>
            <Button variant="primary" size="sm" icon="plus" onClick={() => setCreateOpen(true)}>فاتورة جديدة</Button>
          </div>
        </div>

        <div className="filter-row">
          <div className="search-box">
            <Icon name="search" size={15} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ابحث برقم الفاتورة أو العميل…" aria-label="بحث في الفواتير" />
            {query ? <button className="search-clear" onClick={() => setQuery('')} aria-label="مسح البحث"><Icon name="close" size={12} /></button> : null}
          </div>
          <div className="filter-spacer" />
          <span className="muted-note">الشروط · صافي 14 يومًا</span>
        </div>

        {filtered.length ? (
          <>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>الفاتورة</th>
                    <th>العميل</th>
                    <th className="hide-sm">تاريخ الإصدار</th>
                    <th className="hide-md">الاستحقاق</th>
                    <th>الإجمالي</th>
                    <th>الحالة</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((i) => (
                    <tr key={i.id} onClick={() => setDetail(i.id)}>
                      <td className="mono-id">{i.id}</td>
                      <td>
                        <div className="table-person">
                          <Avatar initials={i.initials} color={i.color} size={28} />
                          <span><strong>{i.customer}</strong><em>بالجملة</em></span>
                        </div>
                      </td>
                      <td className="hide-sm table-muted">{i.issued}</td>
                      <td className="hide-md table-muted">{i.due}</td>
                      <td className="table-strong">{money(i.total)}</td>
                      <td><StatusPill status={i.status} /></td>
                      <td className="row-action"><Icon name="chevronRight" size={15} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="table-foot">
              <span>عرض {filtered.length} من {invoices.length} فاتورة</span>
              <span className="table-foot-sum">إجمالي المعروض <strong>{money(filtered.reduce((s, i) => s + i.total, 0))}</strong></span>
            </div>
          </>
        ) : (
          <EmptyState icon="file" title="لا توجد فواتير هنا" sub="جرّب حالة أخرى أو امسح البحث." />
        )}
      </Card>

      <Drawer
        open={!!selected}
        onClose={() => setDetail(null)}
        title={selected ? selected.id : 'الفاتورة'}
        sub={selected ? `${selected.customer} · الاستحقاق ${selected.due}` : ''}
        footer={
          selected ? (
            <>
              <Button variant="ghost" onClick={() => toast(`أُرسل تذكير إلى ${selected.customer}`, 'good')}>إرسال تذكير</Button>
              {selected.status !== 'paid' ? (
                <Button variant="primary" onClick={() => { markInvoicePaid(selected.id); setDetail(null) }}>تعليم كمدفوعة</Button>
              ) : null}
            </>
          ) : null
        }
      >
        {selected ? (
          <div className="detail-stack">
            <div className="invoice-hero">
              <div>
                <span>المبلغ المستحق</span>
                <strong>{money(selected.total)}</strong>
                <small>صادرة {selected.issued} · تستحق {selected.due}</small>
              </div>
              <StatusPill status={selected.status} />
            </div>
            <dl className="detail-rows">
              <div><dt>الفاتورة إلى</dt><dd>{selected.customer}</dd></div>
              <div><dt>الفاتورة</dt><dd>{selected.id}</dd></div>
              <div><dt>شروط الدفع</dt><dd>صافي 14 يومًا</dd></div>
              <div><dt>المرجع</dt><dd>جملة كِلن آند ليف</dd></div>
            </dl>
            <div className="invoice-lines">
              <div className="invoice-line-head"><span>البند</span><span>المبلغ</span></div>
              <div><span>شاي وخزف بالجملة</span><span>{money(selected.total * 0.9)}</span></div>
              <div><span>الشحن</span><span>{money(selected.total * 0.1)}</span></div>
              <div className="invoice-line-total"><span>الإجمالي</span><span>{money(selected.total)}</span></div>
            </div>
            <div className="detail-note">
              <Icon name="sparkle" size={15} />
              <p>{selected.status === 'overdue' ? 'تجاوزت هذه الفاتورة موعد استحقاقها. التذكير الودود عادةً يُحسم في اليوم نفسه.' : 'نسخة PDF مرفقة، والدفع عبر تحويل بنكي أو بطاقة.'}</p>
            </div>
          </div>
        ) : null}
      </Drawer>

      <Modal
        open={createOpen}
        onClose={closeCreate}
        title="فاتورة جديدة"
        sub="تبدأ كمسودة كي تراجع البنود أولًا"
        footer={
          <>
            <Button variant="ghost" onClick={closeCreate}>إلغاء</Button>
            <Button variant="primary" onClick={createInvoice}>حفظ كمسودة</Button>
          </>
        }
      >
        <div className="form-stack">
          <Field label="العميل">
            <input className="input" value={draft.customer} onChange={(e) => setDraft({ ...draft, customer: e.target.value })} placeholder="مثال: مقهى أستر" autoFocus />
          </Field>
          <Field label="المبلغ (دولار)">
            <div className="input-prefix"><span>$</span><input type="number" min="0" step="0.01" value={draft.total} onChange={(e) => setDraft({ ...draft, total: e.target.value })} placeholder="0.00" /></div>
          </Field>
        </div>
      </Modal>
    </div>
  )
}
