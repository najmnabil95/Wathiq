import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { Icon } from '../components/Icons'
import { Avatar, Button, EmptyState, IconButton, Pill } from '../components/ui'
import { money } from '../data/sample'

const channelMeta = {
  site: { label: 'الموقع', icon: 'globe' },
  instagram: { label: 'إنستغرام', icon: 'instagram' },
  sms: { label: 'رسائل نصية', icon: 'phone' },
}

const quickReplies = ['في الطريق ✨', 'نعم، يمكننا إضافة ذلك', 'دعني أتحقق وأعود إليك', 'شكرًا لك!']

export function ChatsPage() {
  const { chats, sendChatMessage, markChatRead, customers, orders } = useStore()
  const navigate = useNavigate()
  const [channel, setChannel] = useState('all')
  const [query, setQuery] = useState('')
  const [activeId, setActiveId] = useState(chats[0]?.id || null)
  const [text, setText] = useState('')
  const [mobileChat, setMobileChat] = useState(false)
  const scrollRef = useRef(null)

  const active = chats.find((c) => c.id === activeId) || null
  const customer = active ? customers.find((c) => c.name === active.name) : null
  const lastOrder = active ? orders.find((o) => o.customer === active.name) : null

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [active?.messages.length, activeId])

  const filtered = chats.filter((c) => {
    if (channel !== 'all' && c.channel !== channel) return false
    const q = query.trim().toLowerCase()
    if (!q) return true
    return `${c.name} ${c.last} ${c.messages.map((m) => m.text).join(' ')}`.toLowerCase().includes(q)
  })

  const send = () => {
    if (!text.trim() || !active) return
    sendChatMessage(active.id, text.trim())
    setText('')
  }

  const selectChat = (id) => {
    setActiveId(id)
    markChatRead(id)
    setMobileChat(true)
  }

  return (
    <div className="page-stack chat-page">
      <div className={`chat-shell glass ${mobileChat ? 'is-mobile-chat' : ''}`}>
        <aside className="chat-list-panel">
          <header className="chat-list-head">
            <div>
              <h2 className="card-title">المحادثات</h2>
              <p className="card-sub">{chats.reduce((s, c) => s + c.unread, 0)} غير مقروءة من المتجر</p>
            </div>
            <IconButton icon="edit" label="رسالة جديدة" onClick={() => setActiveId(chats[0].id)} />
          </header>

          <div className="channel-row">
            <button className={`channel-chip ${channel === 'all' ? 'is-active' : ''}`} onClick={() => setChannel('all')}>
              الكل
            </button>
            {Object.entries(channelMeta).map(([key, meta]) => (
              <button key={key} className={`channel-chip ${channel === key ? 'is-active' : ''}`} onClick={() => setChannel(key)} title={meta.label}>
                <Icon name={meta.icon} size={15} />
                <span>{meta.label}</span>
              </button>
            ))}
          </div>

          <div className="search-box chat-search">
            <Icon name="search" size={14} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="بحث في المحادثات…" aria-label="بحث في المحادثات" />
          </div>

          <div className="thread-list">
            {filtered.map((c) => (
              <button
                key={c.id}
                className={`thread ${activeId === c.id ? 'is-active' : ''}`}
                onClick={() => selectChat(c.id)}
              >
                <Avatar initials={c.initials} color={c.color} size={34} online={c.online} />
                <div className="thread-copy">
                  <div className="thread-top">
                    <strong>{c.name}</strong>
                    <span>{c.time}</span>
                  </div>
                  <p>{c.last}</p>
                  <div className="thread-meta">
                    <span className={`channel-tag channel-${c.channel}`}>
                      <Icon name={channelMeta[c.channel].icon} size={10} /> {channelMeta[c.channel].label}
                    </span>
                    {c.unread ? <span className="thread-unread">{c.unread}</span> : null}
                  </div>
                </div>
              </button>
            ))}
            {!filtered.length ? <p className="chat-empty-small">لا توجد محادثات مطابقة.</p> : null}
          </div>
        </aside>

        <section className="chat-panel">
          {active ? (
            <>
              <header className="chat-head">
                <button className="chat-back" onClick={() => setMobileChat(false)} aria-label="العودة إلى المحادثات">
                  <Icon name="arrowLeft" size={17} />
                </button>
                <Avatar initials={active.initials} color={active.color} size={34} online={active.online} />
                <div className="chat-head-copy">
                  <strong>{active.name}</strong>
                  <span>{active.online ? 'متصل الآن' : 'آخر ظهور مؤخرًا'} · {channelMeta[active.channel].label}</span>
                </div>
                <div className="chat-head-actions">
                  <IconButton icon="user" label="عرض العميل" onClick={() => navigate('/customers')} />
                  <IconButton icon="mail" label="إرسال بريد" onClick={() => navigate('/email')} />
                  <IconButton icon="more" label="المزيد" />
                </div>
              </header>

              <div className="chat-messages" ref={scrollRef}>
                <div className="chat-day">اليوم</div>
                {active.messages.map((m, i) => (
                  <div key={i} className={`bubble-row ${m.from === 'me' ? 'is-me' : ''}`}>
                    {m.from === 'them' ? <Avatar initials={active.initials} color={active.color} size={24} /> : null}
                    <div className={`bubble ${m.from === 'me' ? 'bubble-me' : ''}`}>
                      <p>{m.text}</p>
                      <span>{m.time}{m.from === 'me' ? ' · مقروء' : ''}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="chat-quick">
                {quickReplies.map((r) => (
                  <button key={r} onClick={() => setText(r)}>{r}</button>
                ))}
              </div>

              <div className="chat-composer">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      send()
                    }
                  }}
                  placeholder={`رسالة إلى ${active.name.split(' ')[0]}…`}
                  aria-label="الرسالة"
                />
                <Button variant="primary" icon="send" onClick={send} disabled={!text.trim()} aria-label="إرسال" />
              </div>
            </>
          ) : (
            <EmptyState icon="chat" title="اختر محادثة" sub="رسائل متجرك وإنستغرام والنصوص تصل هنا." />
          )}
        </section>

        <aside className="chat-info">
          {active ? (
            <>
              <div className="chat-info-hero">
                <Avatar initials={active.initials} color={active.color} size={46} online={active.online} />
                <strong>{active.name}</strong>
                <span>{customer?.email || 'عميل'}</span>
                <Pill tone={customer?.segment === 'VIP' ? 'violet' : 'info'} dot>{customer?.segment || 'جديد'}</Pill>
              </div>
              <div className="chat-info-stats">
                <div><span>الطلبات</span><strong>{customer?.orders ?? 0}</strong></div>
                <div><span>أنفق</span><strong>{money(customer?.spend ?? 0, true)}</strong></div>
              </div>
              <div className="chat-info-block">
                <p className="chat-info-label">آخر طلب</p>
                {lastOrder ? (
                  <div className="chat-order">
                    <div><span className="mono-id">{lastOrder.id}</span><strong>{money(lastOrder.total)}</strong></div>
                    <p>{lastOrder.items.join(' · ')}</p>
                    <button className="tiny-link" onClick={() => navigate('/orders')}>فتح الطلب</button>
                  </div>
                ) : <p className="muted-note">لا توجد طلبات بعد.</p>}
              </div>
              <div className="chat-info-block">
                <p className="chat-info-label">ملاحظات</p>
                <p className="muted-note">تفضّل الماتشا على الشاي الأسود. تغلّف الهدايا كثيرًا. مقرها {customer?.city || 'الاتحاد الأوروبي'}.</p>
              </div>
              <Button variant="soft" size="sm" icon="user" onClick={() => navigate('/customers')}>فتح ملف العميل</Button>
            </>
          ) : null}
        </aside>
      </div>
    </div>
  )
}
