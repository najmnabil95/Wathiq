import { useState } from 'react'
import { useStore } from '../store'
import { Icon } from '../components/Icons'
import { Button, Card, Field, Pill, Toggle } from '../components/ui'

const sections = [
  { key: 'store', label: 'بيانات المتجر', icon: 'box' },
  { key: 'alerts', label: 'التنبيهات', icon: 'bell' },
  { key: 'appearance', label: 'المظهر', icon: 'sun' },
  { key: 'data', label: 'البيانات والنسخ الاحتياطي', icon: 'download' },
]

export function SettingsPage() {
  const { settings, saveSettings, theme, toggleTheme, resetDemo, toast } = useStore()
  const [section, setSection] = useState('store')
  const [draft, setDraft] = useState(settings)

  const set = (key, value) => setDraft((d) => ({ ...d, [key]: value }))

  const exportData = () => {
    const raw = localStorage.getItem('cirrel:state:v2') || '{}'
    const blob = new Blob([raw], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'cirrel-backup.json'
    a.click()
    URL.revokeObjectURL(url)
    toast('تم تنزيل النسخة الاحتياطية', 'good')
  }

  return (
    <div className="settings-shell">
      <aside className="settings-nav glass">
        <p className="nav-group-label">الإعدادات</p>
        {sections.map((s) => (
          <button key={s.key} className={`settings-tab ${section === s.key ? 'is-active' : ''}`} onClick={() => setSection(s.key)}>
            <Icon name={s.icon} size={17} />
            <span>{s.label}</span>
            <Icon name="chevronRight" size={14} className="settings-chev" />
          </button>
        ))}
        <div className="settings-nav-note">
          <Icon name="sparkle" size={15} />
          <p>كل شيء هنا محفوظ في هذا المتصفح. لا حاجة إلى حساب.</p>
        </div>
      </aside>

      <div className="settings-content">
        {section === 'store' ? (
          <Card className="settings-card">
            <div className="settings-head">
              <div>
                <h2 className="card-title">بيانات المتجر</h2>
                <p className="card-sub">الاسم والتفاصيل المستخدمة في الإيصالات والفواتير</p>
              </div>
              <Pill tone="good" dot>مباشر</Pill>
            </div>
            <div className="form-grid">
              <Field label="اسم المتجر">
                <input className="input" value={draft.storeName} onChange={(e) => set('storeName', e.target.value)} />
              </Field>
              <Field label="المالك">
                <input className="input" value={draft.owner} onChange={(e) => set('owner', e.target.value)} />
              </Field>
              <Field label="بريد التواصل">
                <input className="input" type="email" value={draft.email} onChange={(e) => set('email', e.target.value)} />
              </Field>
              <Field label="العملة">
                <select className="select" value={draft.currency} onChange={(e) => set('currency', e.target.value)}>
                  <option value="USD">USD — دولار أمريكي</option>
                  <option value="EUR">EUR — يورو</option>
                  <option value="GBP">GBP — جنيه إسترليني</option>
                  <option value="AED">AED — درهم</option>
                </select>
              </Field>
              <Field label="المنطقة الزمنية">
                <select className="select" value={draft.timezone} onChange={(e) => set('timezone', e.target.value)}>
                  <option value="Europe/Lisbon">لشبونة</option>
                  <option value="Europe/London">لندن</option>
                  <option value="Asia/Dubai">دبي</option>
                  <option value="America/New_York">نيويورك</option>
                </select>
              </Field>
              <Field label="حد المخزون المنخفض" hint="يُستخدم عندما لا يكون للمنتج حد إعادة طلب">
                <input className="input" type="number" min="0" value={draft.lowStock} onChange={(e) => set('lowStock', Number(e.target.value))} />
              </Field>
            </div>
            <div className="settings-actions">
              <Button variant="soft" onClick={() => setDraft(settings)}>تجاهل</Button>
              <Button variant="primary" onClick={() => saveSettings(draft)}>حفظ التغييرات</Button>
            </div>
          </Card>
        ) : null}

        {section === 'alerts' ? (
          <Card className="settings-card">
            <div className="settings-head">
              <div>
                <h2 className="card-title">التنبيهات</h2>
                <p className="card-sub">بريد هادئ، فقط ما يستحق المقاطعة</p>
              </div>
            </div>
            <div className="setting-rows">
              <SettingRow
                title="رسائل الطلبات الجديدة"
                sub="ملاحظة قصيرة عند دفع أي طلب."
                checked={draft.ordersEmail}
                onChange={(v) => set('ordersEmail', v)}
              />
              <SettingRow
                title="تحذيرات المخزون المنخفض"
                sub="عندما يصل المنتج إلى حد إعادة الطلب."
                checked={draft.stockEmail}
                onChange={(v) => set('stockEmail', v)}
              />
              <SettingRow
                title="الملخص الأسبوعي"
                sub="مساء الأحد: المبيعات والمخزون والأكثر مبيعًا."
                checked={draft.weeklyDigest}
                onChange={(v) => set('weeklyDigest', v)}
              />
              <SettingRow
                title="أرشفة الطلبات المسلّمة تلقائيًا"
                sub="تغادر الطلبات المسلّمة اللوحة بعد 14 يومًا."
                checked={draft.autoArchive}
                onChange={(v) => set('autoArchive', v)}
              />
            </div>
            <div className="settings-actions">
              <Button variant="primary" onClick={() => saveSettings(draft)}>حفظ التغييرات</Button>
            </div>
          </Card>
        ) : null}

        {section === 'appearance' ? (
          <>
            <Card className="settings-card">
              <div className="settings-head">
                <div>
                  <h2 className="card-title">المظهر</h2>
                  <p className="card-sub">زجاج سائل، في النور أو بعد الغروب</p>
                </div>
              </div>
              <div className="theme-cards">
                <button className={`theme-choice ${theme === 'dark' ? 'is-active' : ''}`} onClick={() => theme !== 'dark' && toggleTheme()}>
                  <span className="theme-preview theme-preview-dark">
                    <span className="tp-side" />
                    <span className="tp-main"><i /><i /><i /></span>
                  </span>
                  <span className="theme-choice-copy"><Icon name="moon" size={15} /> داكن <small>الافتراضي</small></span>
                  {theme === 'dark' ? <span className="theme-check"><Icon name="check" size={12} /></span> : null}
                </button>
                <button className={`theme-choice ${theme === 'light' ? 'is-active' : ''}`} onClick={() => theme !== 'light' && toggleTheme()}>
                  <span className="theme-preview theme-preview-light">
                    <span className="tp-side" />
                    <span className="tp-main"><i /><i /><i /></span>
                  </span>
                  <span className="theme-choice-copy"><Icon name="sun" size={15} /> فاتح <small>مشرق</small></span>
                  {theme === 'light' ? <span className="theme-check"><Icon name="check" size={12} /></span> : null}
                </button>
              </div>
              <div className="setting-rows">
                <SettingRow
                  title="صفوف جدول مضغوطة"
                  sub="اعرض طلبات أكثر على الشاشة."
                  checked={draft.compactRows}
                  onChange={(v) => set('compactRows', v)}
                />
              </div>
              <div className="settings-actions">
                <Button variant="primary" onClick={() => saveSettings(draft)}>حفظ التفضيلات</Button>
              </div>
            </Card>
          </>
        ) : null}

        {section === 'data' ? (
          <>
            <Card className="settings-card">
              <div className="settings-head">
                <div>
                  <h2 className="card-title">البيانات والنسخ الاحتياطي</h2>
                  <p className="card-sub">بيانات العرض محفوظة في التخزين المحلي لهذا المتصفح</p>
                </div>
                <Pill tone="info">cirrel:state:v2</Pill>
              </div>
              <div className="data-rows">
                <div className="data-row">
                  <span className="mini-stat-icon tone-bg-blue"><Icon name="download" size={16} /></span>
                  <div><strong>تنزيل نسخة احتياطية</strong><span>كل طلب ومنتج ورسالة بصيغة JSON.</span></div>
                  <Button variant="soft" size="sm" onClick={exportData}>تنزيل</Button>
                </div>
                <div className="data-row">
                  <span className="mini-stat-icon tone-bg-violet"><Icon name="globe" size={16} /></span>
                  <div><strong>واجهة المتجر API</strong><span>POST /api/hooks/cirrel · المفتاح ••••••••3f9a</span></div>
                  <Button variant="soft" size="sm" onClick={() => toast('تم نسخ مفتاح API', 'good')}>نسخ المفتاح</Button>
                </div>
                <div className="data-row">
                  <span className="mini-stat-icon tone-bg-amber"><Icon name="trash" size={16} /></span>
                  <div><strong>إعادة تعيين بيانات العرض</strong><span>تعيد المتجر التجريبي وتمسح تغييراتك.</span></div>
                  <Button variant="danger" size="sm" onClick={resetDemo}>إعادة تعيين</Button>
                </div>
              </div>
            </Card>
            <Card className="settings-card danger-card">
              <div className="settings-head">
                <div>
                  <h2 className="card-title">منطقة الخطر</h2>
                  <p className="card-sub">أشياء لا يمكن التراجع عنها</p>
                </div>
              </div>
              <div className="danger-row">
                <div><strong>مسح جميع البيانات المحلية</strong><span>أخرج هذا المتصفح من العرض واحذف النسخة الاحتياطية.</span></div>
                <Button variant="danger" onClick={() => { localStorage.removeItem('cirrel:state:v2'); localStorage.removeItem('cirrel:theme'); toast('مُسحت البيانات المحلية — جارٍ إعادة التحميل', 'warn'); setTimeout(() => location.reload(), 900) }}>مسح البيانات</Button>
              </div>
            </Card>
          </>
        ) : null}
      </div>
    </div>
  )
}

function SettingRow({ title, sub, checked, onChange }) {
  return (
    <div className="setting-row">
      <div>
        <strong>{title}</strong>
        <span>{sub}</span>
      </div>
      <Toggle checked={checked} onChange={onChange} label={title} />
    </div>
  )
}
