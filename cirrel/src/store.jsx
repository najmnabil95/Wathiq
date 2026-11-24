import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import {
  apps as seedApps,
  chats as seedChats,
  customers as seedCustomers,
  discounts as seedDiscounts,
  emails as seedEmails,
  expenses as seedExpenses,
  invoices as seedInvoices,
  notifications as seedNotifications,
  orders as seedOrders,
  payouts as seedPayouts,
  products as seedProducts,
  settingsDefaults,
} from './data/sample'

const STORAGE_KEY = 'cirrel:state:v2'

const readState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

const defaultData = {
  orders: seedOrders,
  customers: seedCustomers,
  products: seedProducts,
  invoices: seedInvoices,
  discounts: seedDiscounts,
  expenses: seedExpenses,
  payouts: seedPayouts,
  chats: seedChats,
  emails: seedEmails,
  apps: seedApps,
  settings: settingsDefaults,
  goal: { target: 24000, booked: 244, finished: 24677, pace: 792 },
  notificationsRead: false,
  activity: [
    { who: 'نور', action: 'نقل KL-49540 إلى مُغلّف', time: '6د' },
    { who: 'مقهى أستر', action: 'دفع INV-2046', time: '24د' },
    { who: 'النظام', action: 'نبّه إلى نفاد إيرل غراي', time: '38د' },
    { who: 'نور', action: 'أنشأ كود WINTER5', time: '2س' },
  ],
}

const StoreContext = createContext(null)

export function StoreProvider({ children }) {
  const saved = useMemo(readState, [])
  const [data, setData] = useState(() => ({ ...defaultData, ...(saved?.data || {}) }))
  const [theme, setThemeState] = useState(() => {
    try {
      return localStorage.getItem('cirrel:theme') || 'dark'
    } catch {
      return 'dark'
    }
  })
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => saved?.ui?.sidebarCollapsed ?? false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [toasts, setToasts] = useState([])
  const toastId = useRef(0)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme
    try {
      localStorage.setItem('cirrel:theme', theme)
    } catch {}
  }, [theme])

  useEffect(() => {
    const id = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ data, ui: { sidebarCollapsed } }))
      } catch {}
    }, 120)
    return () => clearTimeout(id)
  }, [data, sidebarCollapsed])

  const patch = useCallback((updater) => setData((prev) => ({ ...prev, ...updater(prev) })), [])

  const toast = useCallback((message, tone = 'default') => {
    const id = ++toastId.current
    setToasts((prev) => [...prev, { id, message, tone }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3600)
  }, [])

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState((t) => (t === 'dark' ? 'light' : 'dark'))
  }, [])

  const statusLabels = { paid: 'مدفوع', packed: 'مُغلّف', shipped: 'تم الشحن', delivered: 'تم التوصيل', returned: 'مُرتجع', pending: 'قيد الانتظار' }

  const setOrderStatus = useCallback(
    (id, status) => {
      patch((prev) => ({
        orders: prev.orders.map((o) => (o.id === id ? { ...o, status } : o)),
        activity: [{ who: 'نور', action: `نقل ${id} إلى ${statusLabels[status] || status}`, time: 'الآن' }, ...prev.activity].slice(0, 8),
      }))
    },
    [patch],
  )

  const restock = useCallback(
    (id, amount) => {
      patch((prev) => ({
        products: prev.products.map((p) => (p.id === id ? { ...p, stock: p.stock + amount } : p)),
      }))
      toast(`أُضيف ${amount} إلى المخزون`, 'good')
    },
    [patch, toast],
  )

  const markInvoicePaid = useCallback(
    (id) => {
      patch((prev) => ({
        invoices: prev.invoices.map((i) => (i.id === id ? { ...i, status: 'paid' } : i)),
      }))
      toast(`تم تعليم ${id} كمدفوعة`, 'good')
    },
    [patch, toast],
  )

  const addDiscount = useCallback(
    (discount) => {
      patch((prev) => ({ discounts: [discount, ...prev.discounts] }))
      toast(`الكود ${discount.code} يعمل الآن`, 'good')
    },
    [patch, toast],
  )

  const toggleDiscount = useCallback(
    (code) => {
      patch((prev) => ({
        discounts: prev.discounts.map((d) =>
          d.code === code ? { ...d, status: d.status === 'active' ? 'expired' : 'active' } : d,
        ),
      }))
    },
    [patch],
  )

  const sendChatMessage = useCallback(
    (chatId, text) => {
      patch((prev) => ({
        chats: prev.chats.map((c) =>
          c.id === chatId
            ? {
                ...c,
                unread: 0,
                time: 'الآن',
                last: text,
                messages: [...c.messages, { from: 'me', text, time: 'الآن' }],
              }
            : c,
        ),
      }))
      toast('أُرسلت الرسالة', 'good')
    },
    [patch, toast],
  )

  const markChatRead = useCallback(
    (chatId) => {
      patch((prev) => ({ chats: prev.chats.map((c) => (c.id === chatId ? { ...c, unread: 0 } : c)) }))
    },
    [patch],
  )

  const toggleStar = useCallback(
    (emailId) => {
      patch((prev) => ({
        emails: prev.emails.map((e) => (e.id === emailId ? { ...e, starred: !e.starred } : e)),
      }))
    },
    [patch],
  )

  const markEmailRead = useCallback(
    (emailId) => {
      patch((prev) => ({ emails: prev.emails.map((e) => (e.id === emailId ? { ...e, unread: false } : e)) }))
    },
    [patch],
  )

  const toggleApp = useCallback(
    (id) => {
      patch((prev) => ({
        apps: prev.apps.map((a) => (a.id === id ? { ...a, connected: !a.connected } : a)),
      }))
    },
    [patch],
  )

  const saveSettings = useCallback(
    (next) => {
      patch(() => ({ settings: next }))
      toast('تم حفظ الإعدادات', 'good')
    },
    [patch, toast],
  )

  const setGoal = useCallback(
    (goal) => {
      patch(() => ({ goal }))
      toast('تم تحديث هدف الشهر', 'good')
    },
    [patch, toast],
  )

  const markNotificationsRead = useCallback(() => {
    patch(() => ({ notificationsRead: true }))
  }, [patch])

  const addActivity = useCallback(
    (who, action) => {
      patch((prev) => ({ activity: [{ who, action, time: 'الآن' }, ...prev.activity].slice(0, 8) }))
    },
    [patch],
  )

  const initialsOf = (name) =>
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() || '')
      .join('')

  const palette = ['#3d86ff', '#9b7bff', '#ffab5e', '#44d19d', '#ff7a85', '#38c7d8', '#ef7ad8']

  const addOrder = useCallback(
    ({ customer, total, channel = 'المتجر الإلكتروني', items = [] }) => {
      const id = `KL-${Math.floor(49600 + Math.random() * 380)}`
      const order = {
        id,
        customer: customer.trim(),
        initials: initialsOf(customer),
        color: palette[Math.floor(Math.random() * palette.length)],
        items: items.length ? items : ['طلب مخصص'],
        total: Number(total) || 0,
        status: 'paid',
        channel,
        time: 'الآن',
        city: '—',
        email: '',
      }
      patch((prev) => ({ orders: [order, ...prev.orders] }))
      toast(`تم إنشاء الطلب ${id}`, 'good')
      return order
    },
    [patch, toast],
  )

  const addProduct = useCallback(
    ({ name, collection, price, stock, reorder = 20, note = '' }) => {
      const tones = ['matcha', 'bergamot', 'oolong', 'garden', 'hojicha', 'sencha', 'clay', 'cedar', 'linen', 'bamboo', 'glass', 'gift']
      const product = {
        id: `P-${String(Date.now()).slice(-5)}`,
        name: name.trim(),
        collection,
        price: Number(price) || 0,
        stock: Number(stock) || 0,
        reorder: Number(reorder) || 0,
        sold: 0,
        tone: tones[Math.floor(Math.random() * tones.length)],
        note: note || 'وصل حديثًا',
        emoji: collection === 'الخزف' ? '🏺' : collection === 'الأطقم' ? '🎁' : '🍵',
      }
      patch((prev) => ({ products: [product, ...prev.products] }))
      toast(`أُضيف ${product.name} إلى الكتالوج`, 'good')
      return product
    },
    [patch, toast],
  )

  const addInvoice = useCallback(
    ({ customer, total }) => {
      const invoice = {
        id: `INV-${2047 + Math.floor(Math.random() * 200)}`,
        customer: customer.trim(),
        initials: initialsOf(customer),
        color: palette[Math.floor(Math.random() * palette.length)],
        total: Number(total) || 0,
        issued: 'اليوم',
        due: 'خلال 14 يومًا',
        status: 'draft',
      }
      patch((prev) => ({ invoices: [invoice, ...prev.invoices] }))
      toast(`حُفظت الفاتورة ${invoice.id} كمسودة`, 'good')
      return invoice
    },
    [patch, toast],
  )

  const addCustomer = useCallback(
    ({ name, email, city, segment }) => {
      const customer = {
        id: `C-${Date.now().toString().slice(-4)}`,
        name: name.trim(),
        initials: initialsOf(name),
        color: palette[Math.floor(Math.random() * palette.length)],
        email,
        city,
        segment,
        orders: 0,
        spend: 0,
        lastOrder: '—',
        joined: 'نوفمبر 2026',
        reviews: [],
      }
      patch((prev) => ({ customers: [customer, ...prev.customers] }))
      toast(`أُضيف ${customer.name} إلى العملاء`, 'good')
      return customer
    },
    [patch, toast],
  )

  const addExpense = useCallback(
    ({ vendor, category, amount }) => {
      patch((prev) => ({
        expenses: [
          {
            id: `EX-${String(prev.expenses.length + 1).padStart(2, '0')}`,
            vendor: vendor.trim(),
            category,
            date: 'اليوم',
            amount: Number(amount) || 0,
            status: 'paid',
          },
          ...prev.expenses,
        ],
      }))
      toast('تم تسجيل المصروف', 'good')
    },
    [patch, toast],
  )

  const markPayoutPaid = useCallback(
    (id) => {
      patch((prev) => ({ payouts: prev.payouts.map((p) => (p.id === id ? { ...p, status: 'paid' } : p)) }))
      toast(`تم تعليم ${id} كمدفوعة`, 'good')
    },
    [patch, toast],
  )

  const unreadChats = data.chats.reduce((sum, c) => sum + c.unread, 0)
  const unreadEmails = data.emails.filter((e) => e.unread).length

  const value = {
    ...data,
    theme,
    toggleTheme,
    sidebarCollapsed,
    setSidebarCollapsed,
    mobileOpen,
    setMobileOpen,
    toasts,
    toast,
    dismissToast,
    setOrderStatus,
    restock,
    markInvoicePaid,
    addDiscount,
    toggleDiscount,
    sendChatMessage,
    markChatRead,
    toggleStar,
    markEmailRead,
    toggleApp,
    saveSettings,
    setGoal,
    markNotificationsRead,
    addActivity,
    addOrder,
    addProduct,
    addInvoice,
    addCustomer,
    addExpense,
    markPayoutPaid,
    unreadChats,
    unreadEmails,
    notifications: seedNotifications,
    resetDemo: () => {
      setData(defaultData)
      toast('تمت استعادة بيانات العرض', 'good')
    },
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export const useStore = () => {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside StoreProvider')
  return ctx
}
