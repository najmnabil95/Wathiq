import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useStore } from '../store'
import { Icon } from '../components/Icons'
import { Button, Card, CardHead, Field, Modal, Pill, Progress, StatusPill, Toggle } from '../components/ui'
import { money } from '../data/sample'

const campaigns = [
  { name: 'رسالة الترحيب', detail: '3 رسائل · للمشتركين الجدد', sent: 312, rate: 38, color: '#3d86ff' },
  { name: 'أسبوع الماتشا', detail: 'إطلاق · ينتهي 30 نوفمبر', sent: 1860, rate: 24, color: '#44d19d' },
  { name: 'السلة المتروكة', detail: 'رسالتان · بعد ساعة', sent: 248, rate: 41, color: '#ffab5e' },
  { name: 'تشكيلة الشتاء', detail: 'مجدولة · 1 ديسمبر', sent: 0, rate: 0, color: '#9b7bff' },
]

const formatValue = (d) => (d.type === 'percent' ? `خصم ${d.value}%` : d.type === 'fixed' ? `خصم ${money(d.value)}` : 'شحن مجاني')

export function DiscountsPage() {
  const { discounts, addDiscount, toggleDiscount, toast } = useStore()
  const [params, setParams] = useSearchParams()
  const [createOpen, setCreateOpen] = useState(params.get('create') === '1')
  const [draft, setDraft] = useState({ code: '', type: 'percent', value: '10', limit: '200', ends: '31 ديسمبر', campaign: 'حملة مخصصة' })

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

  const active = discounts.filter((d) => d.status === 'active').length
  const redemptions = discounts.reduce((s, d) => s + d.uses, 0)
  const revenue = 8420

  const createCode = () => {
    const code = draft.code.trim().toUpperCase()
    if (!code) return toast('اختر كودًا', 'warn')
    if (discounts.some((d) => d.code === code)) return toast('هذا الكود موجود بالفعل', 'warn')
    addDiscount({
      code,
      type: draft.type,
      value: draft.type === 'shipping' ? 0 : Number(draft.value) || 0,
      uses: 0,
      limit: Number(draft.limit) || 100,
      status: 'active',
      campaign: draft.campaign,
      ends: draft.ends,
    })
    setDraft({ code: '', type: 'percent', value: '10', limit: '200', ends: '31 ديسمبر', campaign: 'حملة مخصصة' })
    closeCreate()
  }

  const copyCode = async (code) => {
    try {
      await navigator.clipboard?.writeText(code)
      toast(`تم نسخ ${code}`, 'good')
    } catch {
      toast(code, 'good')
    }
  }

  return (
    <div className="page-stack">
      <div className="discount-hero glass">
        <div className="discount-hero-copy">
          <span className="hero-kicker"><Icon name="tag" size={13} /> تعمل الآن</span>
          <h2>أعطِ قليلًا، واحصل على كثير.</h2>
          <p>تُشارك الأكواد في واجهة المتجر وإنستغرام وقائمة الجملة. أفضلها يبدو شخصيًا.</p>
          <div className="hero-actions">
            <Button variant="primary" icon="plus" onClick={() => setCreateOpen(true)}>إنشاء كود</Button>
            <Button variant="soft" icon="mail" onClick={() => toast('المسودة جاهزة في البريد', 'good')}>أعلن بالبريد</Button>
          </div>
        </div>
        <div className="discount-hero-stats">
          <div><span>الأكواد النشطة</span><strong>{active}</strong></div>
          <div><span>عمليات الاستخدام</span><strong>{redemptions}</strong></div>
          <div><span>الإيرادات الإضافية</span><strong>{money(revenue, true)}</strong></div>
        </div>
      </div>

      <Card className="page-card" padding={false}>
        <div className="page-toolbar">
          <div className="page-toolbar-title">
            <h2 className="card-title">الأكواد</h2>
            <p className="card-sub">أوقف الكود وقتما تشاء</p>
          </div>
          <div className="page-toolbar-actions">
            <Button variant="soft" size="sm" icon="download" onClick={() => toast('تم تصدير الخصومات', 'good')}>تصدير</Button>
            <Button variant="primary" size="sm" icon="plus" onClick={() => setCreateOpen(true)}>كود جديد</Button>
          </div>
        </div>
        <div className="discount-grid">
          {discounts.map((d) => (
            <article key={d.code} className={`discount-card ${d.status !== 'active' ? 'is-inactive' : ''}`}>
              <div className="discount-top">
                <button className="discount-code" onClick={() => copyCode(d.code)} title="نسخ الكود">
                  {d.code} <Icon name="copy" size={12} />
                </button>
                <Toggle checked={d.status === 'active'} onChange={() => toggleDiscount(d.code)} label={`تبديل ${d.code}`} />
              </div>
              <div className="discount-value">{formatValue(d)}</div>
              <p className="discount-campaign">{d.campaign} · ينتهي {d.ends}</p>
              <div className="discount-usage">
                <div className="detail-line-head">
                  <span>استُخدم {d.uses} من {d.limit}</span>
                  <span>{Math.round((d.uses / d.limit) * 100)}%</span>
                </div>
                <Progress value={(d.uses / d.limit) * 100} tone={d.status === 'active' ? 'accent' : 'warn'} height={5} />
              </div>
              <div className="discount-foot">
                <StatusPill status={d.status} />
                <span className="tiny-link">تعديل</span>
              </div>
            </article>
          ))}
        </div>
      </Card>

      <Card className="campaign-card">
        <CardHead
          title="الحملات"
          sub="الرسائل واللحظات خلف الأكواد"
          action={<Button variant="soft" size="sm" icon="plus" onClick={() => toast('منشئ الحملات في التطبيقات ← Klaviyo', 'good')}>حملة جديدة</Button>}
        />
        <div className="campaign-list">
          {campaigns.map((c) => (
            <div className="campaign-row" key={c.name}>
              <span className="campaign-mark" style={{ background: `${c.color}22`, color: c.color }}>
                <Icon name="mail" size={16} />
              </span>
              <div className="campaign-copy">
                <strong>{c.name}</strong>
                <span>{c.detail}</span>
              </div>
              <div className="campaign-stats">
                <span>{c.sent ? `أُرسل ${c.sent}` : 'لم يُرسل'}</span>
                <div className="campaign-bar"><span style={{ width: `${c.rate}%`, background: c.color }} /></div>
                <strong>{c.rate}%</strong>
              </div>
              <Pill tone={c.sent ? 'good' : 'neutral'} dot>{c.sent ? 'نشطة' : 'مجدولة'}</Pill>
            </div>
          ))}
        </div>
      </Card>

      <Modal
        open={createOpen}
        onClose={closeCreate}
        title="إنشاء كود خصم"
        sub="يعمل في واجهة المتجر فور الحفظ"
        footer={
          <>
            <Button variant="ghost" onClick={closeCreate}>إلغاء</Button>
            <Button variant="primary" onClick={createCode}>إنشاء الكود</Button>
          </>
        }
      >
        <div className="form-stack">
          <Field label="الكود" hint="حروف وأرقام بلا مسافات">
            <div className="code-input">
              <input
                className="input"
                value={draft.code}
                onChange={(e) => setDraft({ ...draft, code: e.target.value.toUpperCase().replace(/\s/g, '') })}
                placeholder="SPRINGSIP"
                autoFocus
              />
              <button className="ghost-action" onClick={() => setDraft({ ...draft, code: `SIP${Math.floor(10 + Math.random() * 89)}` })}>
                فاجئني
              </button>
            </div>
          </Field>
          <div className="form-grid">
            <Field label="النوع">
              <select className="select" value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value })}>
                <option value="percent">نسبة مئوية</option>
                <option value="fixed">مبلغ ثابت</option>
                <option value="shipping">شحن مجاني</option>
              </select>
            </Field>
            <Field label={draft.type === 'percent' ? 'النسبة' : draft.type === 'fixed' ? 'المبلغ (دولار)' : 'القيمة'}>
              <input
                className="input"
                type="number"
                min="0"
                value={draft.value}
                disabled={draft.type === 'shipping'}
                onChange={(e) => setDraft({ ...draft, value: e.target.value })}
              />
            </Field>
            <Field label="حد الاستخدام">
              <input className="input" type="number" min="1" value={draft.limit} onChange={(e) => setDraft({ ...draft, limit: e.target.value })} />
            </Field>
            <Field label="ينتهي">
              <input className="input" value={draft.ends} onChange={(e) => setDraft({ ...draft, ends: e.target.value })} />
            </Field>
          </div>
          <Field label="الحملة">
            <select className="select" value={draft.campaign} onChange={(e) => setDraft({ ...draft, campaign: e.target.value })}>
              {['حملة مخصصة', 'رسالة الترحيب', 'أسبوع الماتشا', 'السلة المتروكة', 'تشكيلة الشتاء'].map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
        </div>
      </Modal>
    </div>
  )
}
