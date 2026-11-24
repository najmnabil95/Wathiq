import { useMemo, useState } from 'react'
import { useStore } from '../store'
import { Icon } from '../components/Icons'
import { Avatar, Button, EmptyState, Field, IconButton, Modal, Pill } from '../components/ui'

export function EmailPage() {
  const { emails, toggleStar, markEmailRead, toast } = useStore()
  const [filter, setFilter] = useState('inbox')
  const [query, setQuery] = useState('')
  const [activeId, setActiveId] = useState(emails[0]?.id || null)
  const [reply, setReply] = useState('')
  const [composeOpen, setComposeOpen] = useState(false)
  const [draft, setDraft] = useState({ to: '', subject: '', body: '' })

  const active = emails.find((e) => e.id === activeId) || null

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return emails.filter((e) => {
      if (filter === 'unread' && !e.unread) return false
      if (filter === 'starred' && !e.starred) return false
      if (!q) return true
      return `${e.from} ${e.subject} ${e.preview} ${e.label}`.toLowerCase().includes(q)
    })
  }, [emails, filter, query])

  const send = () => {
    if (!reply.trim()) return
    toast(`أُرسل الرد إلى ${active?.from}`, 'good')
    setReply('')
  }

  const compose = () => {
    if (!draft.to.trim() || !draft.subject.trim()) return toast('أضف المستلم والموضوع', 'warn')
    toast(`أُرسل البريد إلى ${draft.to}`, 'good')
    setDraft({ to: '', subject: '', body: '' })
    setComposeOpen(false)
  }

  const filters = [
    { key: 'inbox', label: 'الوارد' },
    { key: 'unread', label: 'غير المقروء' },
    { key: 'starred', label: 'المميزة بنجمة' },
  ]

  return (
    <div className="page-stack">
      <div className="email-shell glass">
        <aside className="email-list-panel">
          <header className="chat-list-head">
            <div>
              <h2 className="card-title">البريد</h2>
              <p className="card-sub">{emails.filter((e) => e.unread).length} غير مقروء · {emails.length} في الوارد</p>
            </div>
            <IconButton icon="edit" label="إنشاء رسالة" onClick={() => setComposeOpen(true)} />
          </header>

          <div className="email-filters">
            {filters.map((f) => (
              <button key={f.key} className={`channel-chip ${filter === f.key ? 'is-active' : ''}`} onClick={() => setFilter(f.key)}>
                {f.label}
                {f.key === 'unread' ? <span className="tab-count">{emails.filter((e) => e.unread).length}</span> : null}
              </button>
            ))}
          </div>

          <div className="search-box chat-search">
            <Icon name="search" size={14} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ابحث في الوارد…" aria-label="بحث في البريد" />
          </div>

          <div className="email-list">
            {filtered.map((e) => (
              <button
                key={e.id}
                className={`email-row ${activeId === e.id ? 'is-active' : ''} ${e.unread ? 'is-unread' : ''}`}
                onClick={() => { setActiveId(e.id); markEmailRead(e.id) }}
              >
                <Avatar initials={e.initials} color={e.color} size={32} />
                <div className="email-copy">
                  <div className="email-top">
                    <strong>{e.from}</strong>
                    <span>{e.time}</span>
                  </div>
                  <p className="email-subject">{e.subject}</p>
                  <p className="email-preview">{e.preview}</p>
                  <div className="email-meta">
                    <Pill tone={e.label === 'بالجملة' ? 'violet' : e.label === 'المالية' ? 'info' : e.label === 'الدعم' ? 'warn' : 'neutral'}>{e.label}</Pill>
                    {e.unread ? <span className="email-unread-dot" /> : null}
                  </div>
                </div>
                <span
                  role="button"
                  tabIndex={0}
                  className={`email-star ${e.starred ? 'is-starred' : ''}`}
                  onClick={(ev) => { ev.stopPropagation(); toggleStar(e.id) }}
                  onKeyDown={(ev) => { if (ev.key === 'Enter') { ev.stopPropagation(); toggleStar(e.id) } }}
                  aria-label="تمييز البريد بنجمة"
                >
                  <Icon name="star" size={14} fill={e.starred ? 'currentColor' : 'none'} />
                </span>
              </button>
            ))}
            {!filtered.length ? <EmptyState icon="mail" title="لا يوجد شيء هنا" sub="جرّب فلترًا آخر أو بحثًا مختلفًا." /> : null}
          </div>
        </aside>

        <section className="email-reader">
          {active ? (
            <>
              <header className="email-reader-head">
                <div className="email-reader-title">
                  <div className="email-reader-tags">
                    <Pill tone="neutral">{active.label}</Pill>
                    <span className="table-muted">{active.time}</span>
                  </div>
                  <h2>{active.subject}</h2>
                  <div className="email-sender">
                    <Avatar initials={active.initials} color={active.color} size={30} />
                    <div>
                      <strong>{active.from}</strong>
                      <span>إلى نور حداد</span>
                    </div>
                  </div>
                </div>
                <div className="email-reader-actions">
                  <IconButton
                    icon="star"
                    label="نجمة"
                    className={active.starred ? 'is-starred' : ''}
                    onClick={() => toggleStar(active.id)}
                  />
                  <IconButton icon="return" label="أرشفة" onClick={() => toast('تمت الأرشفة', 'good')} />
                  <IconButton icon="trash" label="حذف" onClick={() => toast('نُقل إلى المهملات', 'good')} />
                </div>
              </header>

              <div className="email-body">
                {active.body.split('\n').map((line, i) => (
                  <p key={i}>{line || '\u00a0'}</p>
                ))}
              </div>

              {active.label === 'بالجملة' ? (
                <div className="email-attachment">
                  <span className="attach-icon"><Icon name="file" size={18} /></span>
                  <div>
                    <strong>طلب جملة · نوفمبر.pdf</strong>
                    <span>248 KB · PDF</span>
                  </div>
                  <button className="ghost-action" onClick={() => toast('تم تنزيل المرفق', 'good')}>تنزيل</button>
                </div>
              ) : null}

              <div className="email-reply">
                <div className="reply-head">
                  <span>الرد على {active.from.split(' ')[0]}</span>
                  <span className="tiny-link">⌘↵ للإرسال</span>
                </div>
                <textarea
                  className="textarea"
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="اكتب ردًا دافئًا وقصيرًا…"
                  onKeyDown={(e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') send()
                  }}
                />
                <div className="reply-actions">
                  <div className="reply-tools">
                    <IconButton icon="file" label="إرفاق ملف" />
                    <IconButton icon="sparkle" label="مساعدة الكتابة" />
                  </div>
                  <Button variant="primary" icon="send" onClick={send} disabled={!reply.trim()}>إرسال الرد</Button>
                </div>
              </div>
            </>
          ) : (
            <EmptyState icon="mail" title="اختر بريدًا" sub="الوارد الهادئ وارد جيد." />
          )}
        </section>
      </div>

      <Modal
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        title="رسالة جديدة"
        sub="تُرسل من noor@kilnandleaf.co"
        footer={
          <>
            <Button variant="ghost" onClick={() => setComposeOpen(false)}>إلغاء</Button>
            <Button variant="primary" icon="send" onClick={compose}>إرسال</Button>
          </>
        }
      >
        <div className="form-stack">
          <Field label="إلى">
            <input className="input" value={draft.to} onChange={(e) => setDraft({ ...draft, to: e.target.value })} placeholder="name@example.com" autoFocus />
          </Field>
          <Field label="الموضوع">
            <input className="input" value={draft.subject} onChange={(e) => setDraft({ ...draft, subject: e.target.value })} placeholder="رسالة صغيرة من كِلن آند ليف" />
          </Field>
          <Field label="الرسالة">
            <textarea className="textarea" value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} placeholder="مرحبًا…" />
          </Field>
        </div>
      </Modal>
    </div>
  )
}
