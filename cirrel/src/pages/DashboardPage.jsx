import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { Icon } from '../components/Icons'
import { Avatar, Button, Card, CardHead, Field, Modal, Pill, Progress, Segmented } from '../components/ui'
import { AreaChart, MiniBars, RadialProgress } from '../components/charts'
import {
  money,
  number,
  revenueSeries,
  salesSources,
  stockAlerts,
  visitorsToday,
} from '../data/sample'

const tones = { matcha: '#6fbf8b', bergamot: '#ffab5e', oolong: '#9b7bff', garden: '#8fd0a8', hojicha: '#d98d5a', sencha: '#5fcf9b', clay: '#c99278', cedar: '#b8875f', linen: '#d6c5a5', bamboo: '#9fc77a', glass: '#63c8d8', gift: '#ef7ad8' }

export function DashboardPage() {
  const navigate = useNavigate()
  const { orders, products, goal, setGoal, setOrderStatus, restock } = useStore()
  const [range, setRange] = useState('12M')
  const [goalOpen, setGoalOpen] = useState(false)
  const [draftTarget, setDraftTarget] = useState(goal.target)

  const series = revenueSeries[range]
  const total = useMemo(() => series.current.reduce((a, b) => a + b, 0), [series])
  const queue = orders.filter((o) => o.status === 'paid').slice(0, 3)
  const low = products.filter((p) => p.stock <= p.reorder).slice(0, 4)
  const sourceTotal = salesSources.reduce((a, b) => a + b.value, 0)

  const now = new Date()
  const monthName = new Intl.DateTimeFormat('ar', { month: 'long', numberingSystem: 'latn' }).format(now)
  const daysLeft = Math.max(1, new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate() + 1)
  const goalPct = Math.round((goal.booked / goal.target) * 100)

  const stats = [
    { label: 'اليوم حتى الآن', value: money(244), delta: '+13%', foot: 'مقارنة بالأحد الماضي' },
    { label: 'آخر 7 أيام', value: money(6409), delta: '+5.5%', foot: 'مقارنة بالأسبوع الماضي' },
    { label: 'طلبات اليوم', value: '6', delta: '+200%', foot: 'مقارنة بالأحد الماضي' },
  ]

  return (
    <div className="dash-grid">
      <Card className="dash-stats" padding={false}>
        <div className="stats-row">
          {stats.map((s) => (
            <div className="stat-cell" key={s.label}>
              <p className="stat-label">{s.label}</p>
              <p className="stat-value">{s.value}</p>
              <p className="stat-foot">
                <span className="delta-up">
                  <Icon name="trendUp" size={12} /> {s.delta}
                </span>
                <span>{s.foot}</span>
              </p>
            </div>
          ))}
          <div className="stat-spark">
            <MiniBars data={[4, 9, 6, 12, 8, 14, 6]} height={44} />
          </div>
        </div>
      </Card>

      <Card className="goal-card">
        <CardHead
          title={`هدف ${monthName}`}
          sub={`${daysLeft} يومًا متبقيًا`}
          action={
            <button className="ghost-icon" aria-label="تعديل الهدف" onClick={() => { setDraftTarget(goal.target); setGoalOpen(true) }}>
              <Icon name="edit" size={15} />
            </button>
          }
        />
        <div className="goal-body">
          <RadialProgress value={goalPct} size={112} stroke={9} accent="#3d86ff">
            <strong className="goal-pct">{goalPct}%</strong>
            <span className="goal-of">من {money(goal.target, true)}</span>
          </RadialProgress>
          <dl className="goal-rows">
            <div><dt>المبيعات المحجوزة</dt><dd>{money(goal.booked, true)}</dd></div>
            <div><dt>الوتيرة اليومية المطلوبة</dt><dd>{money(goal.pace, true)}</dd></div>
            <div><dt>إغلاق الشهر الماضي</dt><dd>{money(goal.finished, true)}</dd></div>
          </dl>
        </div>
      </Card>

      <Card className="sales-card">
        <CardHead
          title="استوديو المبيعات"
          sub={`${money(total, true)} في هذه الفترة · +28% مقارنة بالفترة المماثلة`}
          action={
            <div className="sales-actions">
              <span className="compare-pill"><span className="dash-key" /> العام الماضي</span>
              <Segmented
                size="sm"
                value={range}
                onChange={setRange}
                options={[
                  { value: '12M', label: 'سنة' },
                  { value: '6M', label: '6 أشهر' },
                  { value: '30D', label: 'شهر' },
                  { value: '7D', label: 'أسبوع' },
                ]}
              />
            </div>
          }
        />
        <AreaChart labels={series.labels} data={series.current} compare={series.previous} height={268} yTicks={5} />
      </Card>

      <Card className="live-card">
        <CardHead
          title="المتجر المباشر"
          sub={<span className="live-label"><span className="live-dot" /> زائر الآن</span>}
          action={<span className="tiny-link">الزوار</span>}
        />
        <div className="live-count">
          <strong>38</strong>
          <span>على الموقع</span>
        </div>
        <MiniBars data={visitorsToday} height={74} color="#4f8cff" />
        <dl className="mini-rows">
          <div><dt>السلال المفتوحة</dt><dd>8</dd></div>
          <div><dt>التحويل، 30 يومًا</dt><dd>2.5%</dd></div>
          <div><dt>الصفحة الأكثر زيارة</dt><dd>ماتشا احتفالية</dd></div>
        </dl>
        <div className="live-foot">
          <span className="live-health"><span className="live-dot" /> الدفع سليم</span>
          <span className="tiny-link">14ms</span>
        </div>
      </Card>

      <Card className="queue-card">
        <CardHead
          title="طابور التغليف"
          sub={`${queue.length} ${queue.length === 1 ? 'طلب' : 'طلبات'} مدفوعة بانتظار التغليف`}
          action={<Link to="/orders?view=board" className="tiny-link with-icon">اللوحة <Icon name="arrowUpRight" size={13} /></Link>}
        />
        <div className="queue-list">
          {queue.map((o) => (
            <div className="queue-row" key={o.id}>
              <Avatar initials={o.initials} color={o.color} size={32} />
              <div className="queue-copy">
                <strong>{o.customer}</strong>
                <span>{o.id} · {o.items.length} قطع</span>
              </div>
              <span className="queue-total">{money(o.total)}</span>
              <button
                className="ghost-action"
                onClick={() => {
                  setOrderStatus(o.id, 'packed')
                }}
              >
                <Icon name="box" size={14} /> تم التغليف
              </button>
            </div>
          ))}
          {!queue.length ? <p className="queue-empty">كل شيء جاهز — اللوحة فارغة.</p> : null}
        </div>
      </Card>

      <Card className="low-card">
        <CardHead
          title="مخزون منخفض"
          sub="عند حد إعادة الطلب أو أقل"
          action={<Link to="/products" className="tiny-link">المخزون</Link>}
        />
        <div className="low-list">
          {low.map((p) => (
            <div className="low-row" key={p.id}>
              <span className="product-dot" style={{ background: `linear-gradient(145deg, ${tones[p.tone]}, ${tones[p.tone]}55)` }} />
              <div className="low-copy">
                <strong>{p.name}</strong>
                <span>{p.stock} متبقٍ · حد إعادة الطلب {p.reorder}</span>
                <Progress value={(p.stock / p.reorder) * 100} tone={p.stock === 0 ? 'danger' : p.stock < p.reorder / 2 ? 'warn' : 'accent'} height={4} />
              </div>
              <button className="ghost-action" onClick={() => restock(p.id, Math.max(10, p.reorder))}>
                إعادة تخزين
              </button>
            </div>
          ))}
        </div>
      </Card>

      <Card className="sources-card">
        <CardHead
          title="من أين جاءت المبيعات"
          sub={`آخر 30 يومًا · ${money(sourceTotal, true)}`}
          action={<span className="tiny-link">القنوات</span>}
        />
        <div className="source-bar" role="img" aria-label="المبيعات حسب القناة">
          {salesSources.map((s) => (
            <span key={s.label} style={{ width: `${s.share}%`, background: s.color }} />
          ))}
        </div>
        <ul className="source-list">
          {salesSources.map((s) => (
            <li key={s.label}>
              <span className="source-dot" style={{ background: s.color }} />
              <span className="source-name">{s.label}</span>
              <span className="source-share">{s.share}%</span>
              <span className="source-value">{money(s.value, true)}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Modal
        open={goalOpen}
        onClose={() => setGoalOpen(false)}
        title="حدّد هدف الشهر"
        sub="تتحدث الحلقة والوتيرة اليومية فورًا"
        footer={
          <>
            <Button variant="ghost" onClick={() => setGoalOpen(false)}>إلغاء</Button>
            <Button
              variant="primary"
              onClick={() => {
                const target = Math.max(1, Number(draftTarget) || goal.target)
                setGoal({ ...goal, target, pace: Math.round((target - goal.booked) / daysLeft) })
                setGoalOpen(false)
              }}
            >
              حفظ الهدف
            </Button>
          </>
        }
      >
        <Field label="هدف هذا الشهر" hint="تُحتسب المبيعات المحجوزة ضمن هذا الرقم">
          <div className="input-prefix">
            <span>$</span>
            <input
              type="number"
              min="1"
              value={draftTarget}
              onChange={(e) => setDraftTarget(e.target.value)}
              autoFocus
            />
          </div>
        </Field>
        <div className="goal-suggest">
          {[24000, 30000, 36000].map((v) => (
            <button key={v} className="suggest-chip" onClick={() => setDraftTarget(v)}>
              {money(v, true)}
            </button>
          ))}
        </div>
      </Modal>
    </div>
  )
}
