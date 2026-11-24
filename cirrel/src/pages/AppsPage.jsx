import { useState } from 'react'
import { useStore } from '../store'
import { Icon } from '../components/Icons'
import { Button, Card, CardHead, Pill, Toggle } from '../components/ui'

const categories = ['الكل', 'المبيعات', 'المدفوعات', 'التسويق', 'الشحن', 'المالية', 'التحليلات', 'الفريق']

export function AppsPage() {
  const { apps, toggleApp, toast } = useStore()
  const [category, setCategory] = useState('الكل')
  const [query, setQuery] = useState('')

  const filtered = apps.filter((a) => {
    if (category !== 'الكل' && a.category !== category) return false
    const q = query.trim().toLowerCase()
    if (!q) return true
    return `${a.name} ${a.description} ${a.category}`.toLowerCase().includes(q)
  })

  const connected = apps.filter((a) => a.connected).length

  return (
    <div className="page-stack">
      <div className="apps-hero glass">
        <div className="apps-hero-copy">
          <span className="hero-kicker"><Icon name="grid" size={13} /> الورشة</span>
          <h2>كل شيء في مكان هادئ واحد.</h2>
          <p>المدفوعات والبريد والرسائل والدفاتر — مترابطة كي لا تنسخ الأشياء بين النوافذ.</p>
        </div>
        <div className="apps-hero-stats">
          <div><span>متصل</span><strong>{connected}/{apps.length}</strong></div>
          <div><span>الأتمتة</span><strong>12</strong></div>
          <div><span>آخر مزامنة</span><strong>الآن</strong></div>
        </div>
      </div>

      <Card className="page-card" padding={false}>
        <div className="page-toolbar">
          <div className="page-toolbar-title">
            <h2 className="card-title">التكاملات</h2>
            <p className="card-sub">اربط مرة ثم انسَ الأمر</p>
          </div>
          <div className="search-box apps-search">
            <Icon name="search" size={14} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ابحث في التطبيقات…" aria-label="بحث في التطبيقات" />
          </div>
        </div>
        <div className="chip-row app-chips">
          {categories.map((c) => (
            <button key={c} className={`chip ${category === c ? 'is-active' : ''}`} onClick={() => setCategory(c)}>
              {c}
            </button>
          ))}
        </div>

        <div className="apps-grid">
          {filtered.map((a) => (
            <article key={a.id} className={`app-card ${a.connected ? 'is-connected' : ''}`}>
              <div className="app-top">
                <span className="app-glyph" style={{ background: `${a.color}1f`, color: a.color, borderColor: `${a.color}33` }}>
                  {a.glyph}
                </span>
                <div className="app-title">
                  <strong>{a.name}</strong>
                  <span>{a.category}</span>
                </div>
                {a.connected ? <Pill tone="good" dot>متصل</Pill> : null}
              </div>
              <p className="app-desc">{a.description}</p>
              <div className="app-foot">
                <span className="app-sync">
                  <Icon name={a.connected ? 'check' : 'plus'} size={13} />
                  {a.connected ? 'مزامنة تلقائية' : 'غير متصل'}
                </span>
                {a.connected ? (
                  <Toggle
                    checked
                    onChange={() => { toggleApp(a.id); toast(`تم فصل ${a.name}`, 'warn') }}
                    label={`فصل ${a.name}`}
                  />
                ) : (
                  <Button
                    variant="soft"
                    size="sm"
                    onClick={() => { toggleApp(a.id); toast(`تم ربط ${a.name}`, 'good') }}
                  >
                    ربط
                  </Button>
                )}
              </div>
            </article>
          ))}
        </div>
        {!filtered.length ? <p className="chat-empty-small">لا توجد تطبيقات في هذا التصنيف بعد.</p> : null}
      </Card>

      <div className="apps-bottom">
        <Card>
          <CardHead title="ويب هوك وAPI" sub="للأجزاء التي تحتاج قليلًا من الكود" action={<Pill tone="violet">مطوّر</Pill>} />
          <div className="webhook-block">
            <code>POST https://api.kilnandleaf.co/hooks/cirrel</code>
            <Button variant="soft" size="sm" icon="copy" onClick={() => toast('تم نسخ العنوان', 'good')}>نسخ</Button>
          </div>
          <p className="muted-note">تُرسل أحداث الطلبات والعملاء والمخزون بصيغة JSON. مفتاح التوقيع موجود في الإعدادات ← البيانات.</p>
        </Card>
        <Card>
          <CardHead title="تحتاج مساعدة؟" sub="نرد عادة خلال يوم عمل" />
          <div className="help-mini">
            <span className="empty-icon"><Icon name="help" size={20} /></span>
            <p>اقرأ أدلة الإعداد أو افتح تذكرة من مركز المساعدة.</p>
            <Button variant="soft" size="sm" icon="arrowUpRight" onClick={() => toast('تم فتح مركز المساعدة', 'good')}>مركز المساعدة</Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
