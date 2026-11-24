import { useMemo, useState } from 'react'
import { useStore } from '../store'
import { Icon } from '../components/Icons'
import { Button, Card, CardHead, Pill, Progress, Segmented } from '../components/ui'
import { AreaChart, Donut, Sparkline } from '../components/charts'
import { analytics, money, number, revenueSeries } from '../data/sample'

const topPages = [
  { path: '/matcha', title: 'ماتشا احتفالية', views: 8420, conv: '4.8%' },
  { path: '/gift-sets', title: 'طقم هدايا رقم 3', views: 4180, conv: '3.9%' },
  { path: '/journal/whisking', title: 'المجلة — الخفق في المنزل', views: 3960, conv: '1.2%' },
  { path: '/ceramics/cup', title: 'كوب حجري', views: 2740, conv: '5.1%' },
  { path: '/wholesale', title: 'استفسار جملة', views: 1820, conv: '6.4%' },
]

const devices = analytics.devices

const sources = [
  { label: 'إنستغرام', value: 42, color: '#ef7ad8' },
  { label: 'بحث Google', value: 31, color: '#3d86ff' },
  { label: 'مباشر', value: 17, color: '#44d19d' },
  { label: 'النشرة البريدية', value: 10, color: '#ffab5e' },
]

export function AnalyticsPage() {
  const { toast } = useStore()
  const [range, setRange] = useState('12M')
  const series = revenueSeries[range]
  const total = useMemo(() => series.current.reduce((a, b) => a + b, 0), [series])
  const visitors = useMemo(() => series.current.map((v) => Math.round(v / 8)), [series])

  const kpis = [
    { label: 'الإيرادات', value: money(total, true), delta: '+28.4%', up: true, spark: series.current, color: '#3d86ff' },
    { label: 'الطلبات', value: number(range === '7D' ? 182 : range === '30D' ? 758 : 4326), delta: '+14.2%', up: true, spark: series.current.map((v) => v * 0.8), color: '#44d19d' },
    { label: 'التحويل', value: '2.50%', delta: '+0.3 نقطة', up: true, spark: analytics.visitors.slice(0, 10), color: '#9b7bff' },
    { label: 'متوسط الطلب', value: money(total / (range === '7D' ? 182 : range === '30D' ? 758 : 4326)), delta: '−1.8%', up: false, spark: series.current.map((v) => v * 0.55), color: '#ffab5e' },
  ]

  return (
    <div className="page-stack">
      <div className="analytics-kpis">
        {kpis.map((k) => (
          <Card className="kpi-card" key={k.label}>
            <div className="kpi-top">
              <span>{k.label}</span>
              <span className={`kpi-delta ${k.up ? 'is-up' : 'is-down'}`}>
                <Icon name={k.up ? 'trendUp' : 'arrowDown'} size={11} /> {k.delta}
              </span>
            </div>
            <strong className="kpi-value">{k.value}</strong>
            <div className="kpi-spark">
              <Sparkline data={k.spark} color={k.color} width={150} height={30} />
            </div>
          </Card>
        ))}
      </div>

      <div className="analytics-grid">
        <Card className="analytics-revenue">
          <CardHead
            title="الإيرادات والطلبات"
            sub={`${money(total, true)} خلال الفترة المحددة`}
            action={
              <div className="sales-actions">
                <Pill tone="good" dot>مباشر</Pill>
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
          <div className="chart-legend">
            <span><i style={{ background: '#3d86ff' }} /> الإيرادات</span>
            <span><i className="dashed" /> الفترة المماثلة من العام الماضي</span>
          </div>
          <AreaChart labels={series.labels} data={series.current} compare={series.previous} height={280} yTicks={5} />
        </Card>

        <Card className="analytics-collections">
          <CardHead title="المبيعات حسب التصنيف" sub="حصة الإيرادات هذا الشهر" action={<span className="tiny-link">تقرير</span>} />
          <div className="donut-block">
            <Donut
              segments={analytics.collections}
              size={132}
              stroke={15}
              center={<><strong>{money(25300, true)}</strong><span>الإجمالي</span></>}
            />
            <ul className="donut-legend">
              {analytics.collections.map((c) => (
                <li key={c.label}>
                  <span className="source-dot" style={{ background: c.color }} />
                  <span>{c.label}</span>
                  <strong>{money(c.value, true)}</strong>
                </li>
              ))}
            </ul>
          </div>
        </Card>

        <Card className="analytics-funnel">
          <CardHead
            title="قمع الدفع"
            sub="آخر 30 يومًا · 1,208 عمليات شراء"
            action={<Pill tone="good" dot>تحويل 2.5%</Pill>}
          />
          <div className="funnel">
            {analytics.funnel.map((step, i) => {
              const prev = analytics.funnel[i - 1]
              const rate = prev ? (step.value / prev.value) * 100 : 100
              return (
                <div className="funnel-row" key={step.label}>
                  <div className="funnel-meta">
                    <span>{step.label}</span>
                    <span className="funnel-value">{number(step.value)}</span>
                    <span className="funnel-rate">{i === 0 ? '—' : `${rate.toFixed(1)}%`}</span>
                  </div>
                  <span className="funnel-bar">
                    <span style={{ width: `${(step.value / analytics.funnel[0].value) * 100}%`, background: step.color }} />
                  </span>
                </div>
              )
            })}
          </div>
        </Card>

        <Card className="analytics-devices">
          <CardHead title="الأجهزة" sub="من أين يتصفح الناس" />
          <div className="device-block">
            <Donut segments={devices} size={116} stroke={13} center={<><strong>62%</strong><span>الجوال</span></>} />
            <ul className="donut-legend">
              {devices.map((d) => (
                <li key={d.label}>
                  <span className="source-dot" style={{ background: d.color }} />
                  <span>{d.label}</span>
                  <strong>{d.value}%</strong>
                </li>
              ))}
            </ul>
          </div>
          <div className="source-mini">
            <p className="source-mini-title">أفضل المصادر</p>
            {sources.map((s) => (
              <div key={s.label} className="source-mini-row">
                <span>{s.label}</span>
                <Progress value={s.value} tone="accent" height={4} />
                <strong>{s.value}%</strong>
              </div>
            ))}
          </div>
        </Card>

        <Card className="analytics-pages">
          <CardHead
            title="الصفحات الأكثر زيارة"
            sub="أكثر صفحات واجهة المتجر زيارة"
            action={<Button variant="soft" size="sm" icon="download" onClick={() => toast('تم تصدير تقرير التحليلات', 'good')}>تصدير</Button>}
          />
          <div className="table-wrap">
            <table className="data-table compact">
              <thead>
                <tr>
                  <th>الصفحة</th>
                  <th>المشاهدات</th>
                  <th className="hide-sm">التحويل</th>
                  <th>الاتجاه</th>
                </tr>
              </thead>
              <tbody>
                {topPages.map((p, i) => (
                  <tr key={p.path}>
                    <td>
                      <div className="page-cell">
                        <span className="rank">{i + 1}</span>
                        <span><strong>{p.title}</strong><em>{p.path}</em></span>
                      </div>
                    </td>
                    <td className="table-strong">{number(p.views)}</td>
                    <td className="hide-sm"><Pill tone={parseFloat(p.conv) > 4 ? 'good' : 'neutral'}>{p.conv}</Pill></td>
                    <td className="trend-cell"><Sparkline data={visitors.slice(-7)} width={64} height={22} fill={false} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}
