import { useMemo, useState } from 'react'
import { useStore } from '../store'
import { Icon } from '../components/Icons'
import { Button, Card, CardHead, Field, Modal, Pill, Progress, Segmented, StatusPill } from '../components/ui'
import { AreaChart, Donut } from '../components/charts'
import { money, revenueSeries } from '../data/sample'

const categories = ['المخزون', 'الشحن', 'التشغيل', 'البرمجيات', 'التغليف', 'التسويق']

export function FinancesPage() {
  const { expenses, payouts, addExpense, markPayoutPaid, toast } = useStore()
  const [tab, setTab] = useState('overview')
  const [range, setRange] = useState('6M')
  const [expenseOpen, setExpenseOpen] = useState(false)
  const [draft, setDraft] = useState({ vendor: '', category: 'المخزون', amount: '' })

  const revenue = 25300
  const cogs = 7100
  const fees = 640
  const expenseTotal = expenses.reduce((s, e) => s + e.amount, 0)
  const costs = cogs + expenseTotal + fees
  const profit = revenue - costs
  const margin = Math.round((profit / revenue) * 100)

  const expenseByCategory = useMemo(() => {
    const colors = {
      'المخزون': '#3d86ff',
      'الشحن': '#44d19d',
      'التشغيل': '#9b7bff',
      'البرمجيات': '#38c7d8',
      'التغليف': '#ffab5e',
      'التسويق': '#ef7ad8',
    }
    return categories
      .map((c) => ({
        label: c,
        value: expenses.filter((e) => e.category === c).reduce((s, e) => s + e.amount, 0),
        color: colors[c],
      }))
      .filter((c) => c.value > 0)
  }, [expenses])

  const series = revenueSeries[range]
  const costSeries = series.current.map((v) => Math.round(v * 0.52))
  const totalSeries = series.current.reduce((a, b) => a + b, 0)

  const saveExpense = () => {
    if (!draft.vendor.trim()) return toast('أضف المورد', 'warn')
    if (!draft.amount) return toast('أضف المبلغ', 'warn')
    addExpense(draft)
    setDraft({ vendor: '', category: 'المخزون', amount: '' })
    setExpenseOpen(false)
  }

  const tabs = [
    { key: 'overview', label: 'نظرة عامة' },
    { key: 'payouts', label: 'المدفوعات' },
    { key: 'expenses', label: 'المصروفات' },
  ]

  return (
    <div className="page-stack">
      <div className="page-toolbar glass toolbar-card">
        <div className="tabs">
          {tabs.map((t) => (
            <button key={t.key} className={`tab ${tab === t.key ? 'is-active' : ''}`} onClick={() => setTab(t.key)}>
              {t.label}
              {t.key === 'expenses' ? <span className="tab-count">{expenses.length}</span> : null}
              {t.key === 'payouts' ? <span className="tab-count">{payouts.filter((p) => p.status === 'scheduled').length}</span> : null}
            </button>
          ))}
        </div>
        <div className="page-toolbar-actions">
          <Button variant="soft" size="sm" icon="download" onClick={() => toast('تم تصدير التقرير المالي', 'good')}>تصدير</Button>
          <Button variant="primary" size="sm" icon="plus" onClick={() => setExpenseOpen(true)}>إضافة مصروف</Button>
        </div>
      </div>

      {tab === 'overview' ? (
        <>
          <div className="mini-stats">
            <div className="mini-stat glass">
              <span className="mini-stat-icon tone-bg-blue"><Icon name="wallet" size={16} /></span>
              <div><span>الإيرادات، 30 يومًا</span><strong>{money(revenue, true)}</strong></div>
            </div>
            <div className="mini-stat glass">
              <span className="mini-stat-icon tone-bg-amber"><Icon name="card" size={16} /></span>
              <div><span>إجمالي التكاليف</span><strong>{money(costs, true)}</strong></div>
            </div>
            <div className="mini-stat glass">
              <span className="mini-stat-icon tone-bg-green"><Icon name="trendUp" size={16} /></span>
              <div><span>صافي الربح</span><strong>{money(profit, true)}</strong></div>
            </div>
            <div className="mini-stat glass">
              <span className="mini-stat-icon tone-bg-violet"><Icon name="activity" size={16} /></span>
              <div><span>الهامش</span><strong>{margin}%</strong></div>
            </div>
          </div>

          <div className="finance-grid">
            <Card className="finance-chart">
              <CardHead
                title="الإيرادات مقابل التكاليف"
                sub={`${money(totalSeries, true)} في هذه الفترة · هامش ${margin}%`}
                action={
                  <Segmented size="sm" value={range} onChange={setRange} options={[
                    { value: '12M', label: 'سنة' },
                    { value: '6M', label: '6 أشهر' },
                    { value: '30D', label: 'شهر' },
                    { value: '7D', label: 'أسبوع' },
                  ]} />
                }
              />
              <div className="chart-legend">
                <span><i style={{ background: '#3d86ff' }} /> الإيرادات</span>
                <span><i style={{ background: '#ffab5e' }} /> التكاليف</span>
              </div>
              <AreaChart labels={series.labels} data={series.current} compare={costSeries} height={258} yTicks={5} />
            </Card>

            <Card className="pnl-card">
              <CardHead title="الأرباح والخسائر" sub="نوفمبر، على أساس نقدي" action={<Pill tone="good" dot>على المسار</Pill>} />
              <div className="pnl-rows">
                <div><span>الإيرادات</span><strong>{money(revenue)}</strong></div>
                <div><span>تكلفة البضاعة</span><strong className="neg">−{money(cogs)}</strong></div>
                <div><span>تكاليف التشغيل</span><strong className="neg">−{money(expenseTotal)}</strong></div>
                <div><span>رسوم الدفع</span><strong className="neg">−{money(fees)}</strong></div>
                <div className="pnl-total"><span>صافي الربح</span><strong>{money(profit)}</strong></div>
              </div>
              <div className="margin-block">
                <div className="detail-line-head"><span>هامش الربح</span><span>{margin}%</span></div>
                <Progress value={margin} tone="good" height={7} />
                <p>ارتفع 4.2 نقطة عن أكتوبر. الشاي يحمل الشهر.</p>
              </div>
            </Card>

            <Card className="payout-card">
              <CardHead title="أحدث المدفوعات" sub="سترايب · تُدفع كل اثنين" action={<button className="tiny-link" onClick={() => setTab('payouts')}>كل المدفوعات</button>} />
              <div className="payout-list">
                {payouts.slice(0, 4).map((p) => (
                  <div className="payout-row" key={p.id}>
                    <span className={`payout-icon ${p.status === 'scheduled' ? 'is-scheduled' : ''}`}>
                      <Icon name={p.status === 'scheduled' ? 'clock' : 'check'} size={14} />
                    </span>
                    <div>
                      <strong>{p.id}</strong>
                      <span>{p.date} · {p.method}</span>
                    </div>
                    <span className="payout-amount">{money(p.amount)}</span>
                    <StatusPill status={p.status === 'scheduled' ? 'due' : 'paid'} />
                  </div>
                ))}
              </div>
            </Card>

            <Card className="expense-breakdown">
              <CardHead title="أين ذهبت الأموال" sub={`${money(expenseTotal, true)} ضمن ${expenseByCategory.length} فئات`} />
              <div className="donut-block">
                <Donut
                  segments={expenseByCategory}
                  size={128}
                  stroke={14}
                  center={<><strong>{money(expenseTotal, true)}</strong><span>مصروف</span></>}
                />
                <ul className="donut-legend">
                  {expenseByCategory.map((c) => (
                    <li key={c.label}>
                      <span className="source-dot" style={{ background: c.color }} />
                      <span>{c.label}</span>
                      <strong>{money(c.value, true)}</strong>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          </div>
        </>
      ) : null}

      {tab === 'payouts' ? (
        <Card className="page-card" padding={false}>
          <CardHead title="المدفوعات" sub="كل دفعة، مسوّاة وفي طريقها" action={<Button variant="soft" size="sm" icon="download" onClick={() => toast('تم تصدير المدفوعات', 'good')}>تصدير</Button>} />
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>الدفعة</th><th>التاريخ</th><th className="hide-sm">الطريقة</th><th>المبلغ</th><th>الحالة</th><th /></tr>
              </thead>
              <tbody>
                {payouts.map((p) => (
                  <tr key={p.id}>
                    <td className="mono-id">{p.id}</td>
                    <td>{p.date}</td>
                    <td className="hide-sm table-muted">{p.method}</td>
                    <td className="table-strong">{money(p.amount)}</td>
                    <td><StatusPill status={p.status === 'scheduled' ? 'due' : 'paid'} /></td>
                    <td className="row-action">
                      {p.status === 'scheduled' ? (
                        <button className="ghost-action" onClick={() => markPayoutPaid(p.id)}>تعليم كمدفوعة</button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="table-foot">
            <span>الدفعة القادمة تصل الاثنين</span>
            <span className="table-foot-sum">مجدولة <strong>{money(payouts.filter((p) => p.status === 'scheduled').reduce((s, p) => s + p.amount, 0))}</strong></span>
          </div>
        </Card>
      ) : null}

      {tab === 'expenses' ? (
        <Card className="page-card" padding={false}>
          <CardHead title="المصروفات" sub={`${money(expenseTotal)} مسجلة هذا الشهر`} action={<Button variant="primary" size="sm" icon="plus" onClick={() => setExpenseOpen(true)}>إضافة مصروف</Button>} />
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>المورد</th><th className="hide-sm">الفئة</th><th>التاريخ</th><th>المبلغ</th><th>الحالة</th></tr>
              </thead>
              <tbody>
                {expenses.map((e) => (
                  <tr key={e.id}>
                    <td className="table-strong">{e.vendor}</td>
                    <td className="hide-sm"><Pill tone="neutral">{e.category}</Pill></td>
                    <td className="table-muted">{e.date}</td>
                    <td className="table-strong">{money(e.amount)}</td>
                    <td><StatusPill status={e.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="table-foot">
            <span>{expenses.length} مصروفات هذا الشهر</span>
            <span className="table-foot-sum">الإجمالي <strong>{money(expenseTotal)}</strong></span>
          </div>
        </Card>
      ) : null}

      <Modal
        open={expenseOpen}
        onClose={() => setExpenseOpen(false)}
        title="إضافة مصروف"
        sub="يُسجل ضمن أرباح وخسائر هذا الشهر"
        footer={
          <>
            <Button variant="ghost" onClick={() => setExpenseOpen(false)}>إلغاء</Button>
            <Button variant="primary" onClick={saveExpense}>تسجيل المصروف</Button>
          </>
        }
      >
        <div className="form-stack">
          <Field label="المورد">
            <input className="input" value={draft.vendor} onChange={(e) => setDraft({ ...draft, vendor: e.target.value })} placeholder="مثال: شركة التغليف" autoFocus />
          </Field>
          <div className="form-grid">
            <Field label="الفئة">
              <select className="select" value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}>
                {categories.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="المبلغ (دولار)">
              <div className="input-prefix"><span>$</span><input type="number" min="0" step="0.01" value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: e.target.value })} placeholder="0.00" /></div>
            </Field>
          </div>
        </div>
      </Modal>
    </div>
  )
}
