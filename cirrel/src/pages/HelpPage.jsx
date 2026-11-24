import { useState } from 'react'
import { useStore } from '../store'
import { Icon } from '../components/Icons'
import { Button, Card, CardHead, Field, Pill } from '../components/ui'
import { faqs } from '../data/sample'

const topics = [
  { icon: 'bag', title: 'الطلبات والتغليف', sub: 'الحالات والملصقات والمرتجعات', tone: 'blue' },
  { icon: 'box', title: 'المنتجات والمخزون', sub: 'التصنيفات وإعادة التخزين والحد المنخفض', tone: 'green' },
  { icon: 'wallet', title: 'المال', sub: 'المدفوعات والفواتير والمصروفات', tone: 'amber' },
  { icon: 'grid', title: 'التطبيقات والبيانات', sub: 'الاتصالات وAPI والنسخ الاحتياطي', tone: 'violet' },
]

export function HelpPage() {
  const { toast } = useStore()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(0)
  const [ticket, setTicket] = useState({ subject: '', category: 'الطلبات', message: '' })
  const [sent, setSent] = useState(false)

  const filtered = faqs.filter((f) => `${f.q} ${f.a}`.toLowerCase().includes(query.trim().toLowerCase()))

  const sendTicket = () => {
    if (!ticket.subject.trim() || !ticket.message.trim()) return toast('أضف الموضوع والرسالة', 'warn')
    setSent(true)
    toast('فُتحت التذكرة — سنرد بالبريد', 'good')
  }

  return (
    <div className="page-stack">
      <div className="help-hero glass">
        <span className="hero-kicker"><Icon name="help" size={13} /> مركز المساعدة</span>
        <h2>كيف نساعدك؟</h2>
        <p>إجابات قصيرة للمتجر الصغير، وشخص حقيقي في نهاية النموذج.</p>
        <div className="help-search">
          <Icon name="search" size={17} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث في المساعدة — الاسترداد، الهدف، API…"
            aria-label="بحث في المساعدة"
          />
          {query ? <button className="search-clear" onClick={() => setQuery('')} aria-label="مسح"><Icon name="close" size={13} /></button> : null}
        </div>
        <div className="help-hints">
          <span>الأكثر شيوعًا:</span>
          {['الاسترداد', 'لوحة التغليف', 'API', 'هدف الشهر'].map((h) => (
            <button key={h} onClick={() => setQuery(h)}>{h}</button>
          ))}
        </div>
      </div>

      <div className="topic-grid">
        {topics.map((t) => (
          <button key={t.title} className="topic-card glass" onClick={() => setQuery(t.title)}>
            <span className={`mini-stat-icon tone-bg-${t.tone}`}><Icon name={t.icon} size={17} /></span>
            <strong>{t.title}</strong>
            <span>{t.sub}</span>
            <Icon name="arrowUpRight" size={15} className="topic-go" />
          </button>
        ))}
      </div>

      <div className="help-grid">
        <Card className="faq-card">
          <CardHead
            title="الأسئلة الشائعة"
            sub={`${filtered.length} إجابة${query ? ` عن «${query}»` : ''}`}
            action={<Pill tone="neutral">محدّث هذا الأسبوع</Pill>}
          />
          <div className="faq-list">
            {filtered.map((f, i) => (
              <div key={f.q} className={`faq-item ${open === i ? 'is-open' : ''}`}>
                <button className="faq-q" onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i}>
                  <span>{f.q}</span>
                  <Icon name="chevronDown" size={16} />
                </button>
                <div className="faq-a">
                  <p>{f.a}</p>
                </div>
              </div>
            ))}
            {!filtered.length ? (
              <div className="faq-empty">
                <p>لا شيء يطابق «{query}».</p>
                <span>جرّب كلمة أقصر، أو افتح تذكرة أدناه.</span>
              </div>
            ) : null}
          </div>
        </Card>

        <div className="help-side">
          <Card>
            <CardHead title="افتح تذكرة" sub="نرد عادة خلال يوم عمل" />
            {sent ? (
              <div className="ticket-success">
                <span className="success-ring"><Icon name="check" size={20} /></span>
                <strong>التذكرة #4821 مفتوحة</strong>
                <p>أرسلنا نسخة إلى noor@kilnandleaf.co. تصل الردود إلى بريدك.</p>
                <Button variant="soft" size="sm" onClick={() => { setSent(false); setTicket({ subject: '', category: 'الطلبات', message: '' }) }}>
                  فتح تذكرة أخرى
                </Button>
              </div>
            ) : (
              <div className="form-stack">
                <Field label="الموضوع">
                  <input className="input" value={ticket.subject} onChange={(e) => setTicket({ ...ticket, subject: e.target.value })} placeholder="ملخص قصير" />
                </Field>
                <Field label="الفئة">
                  <select className="select" value={ticket.category} onChange={(e) => setTicket({ ...ticket, category: e.target.value })}>
                    {['الطلبات', 'المنتجات والمخزون', 'المال', 'التطبيقات والبيانات', 'شيء آخر'].map((c) => <option key={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="ماذا حدث؟">
                  <textarea className="textarea" value={ticket.message} onChange={(e) => setTicket({ ...ticket, message: e.target.value })} placeholder="قليل من التفاصيل يساعدنا على الحل أسرع." />
                </Field>
                <Button variant="primary" icon="send" onClick={sendTicket}>إرسال التذكرة</Button>
              </div>
            )}
          </Card>

          <Card className="contact-card">
            <CardHead title="طرق أخرى" />
            <div className="contact-row">
              <span className="mini-stat-icon tone-bg-blue"><Icon name="mail" size={15} /></span>
              <div><strong>البريد الإلكتروني</strong><span>help@kilnandleaf.co</span></div>
            </div>
            <div className="contact-row">
              <span className="mini-stat-icon tone-bg-green"><Icon name="chat" size={15} /></span>
              <div><strong>محادثة المتجر</strong><span>الاثنين–الجمعة، 09:00–17:00</span></div>
            </div>
            <div className="contact-row">
              <span className="mini-stat-icon tone-bg-amber"><Icon name="clock" size={15} /></span>
              <div><strong>متوسط الرد</strong><span>حوالي 4 ساعات</span></div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
