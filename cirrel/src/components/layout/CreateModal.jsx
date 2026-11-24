import { useNavigate } from 'react-router-dom'
import { Icon } from '../Icons'
import { Modal } from '../ui'

const options = [
  { icon: 'bag', title: 'طلب جديد', sub: 'سجّل طلبًا يدويًا أو طلب جملة', to: '/orders?create=1', tone: 'blue' },
  { icon: 'box', title: 'منتج جديد', sub: 'أضف شايًا أو كوبًا أو طقمًا إلى الكتالوج', to: '/products?create=1', tone: 'green' },
  { icon: 'tag', title: 'كود خصم', sub: 'نسبة أو مبلغ ثابت أو شحن مجاني', to: '/discounts?create=1', tone: 'amber' },
  { icon: 'file', title: 'فاتورة', sub: 'أرسل فاتورة جملة للدفع', to: '/invoices?create=1', tone: 'violet' },
  { icon: 'user', title: 'ملاحظة عميل', sub: 'افتح دفتر العملاء وأضف ملفًا', to: '/customers?create=1', tone: 'pink' },
  { icon: 'mail', title: 'بريد حملة', sub: 'ابدأ من مسار Klaviyo في التطبيقات', to: '/apps', tone: 'cyan' },
]

export function CreateModal({ open, onClose }) {
  const navigate = useNavigate()
  return (
    <Modal open={open} onClose={onClose} title="أنشئ شيئًا" sub="متجر صغير يديره صغير الأفعال" size="md">
      <div className="create-grid">
        {options.map((opt) => (
          <button
            key={opt.title}
            className="create-option"
            onClick={() => {
              onClose()
              navigate(opt.to)
            }}
          >
            <span className={`create-icon tone-bg-${opt.tone}`}>
              <Icon name={opt.icon} size={18} />
            </span>
            <span className="create-copy">
              <strong>{opt.title}</strong>
              <span>{opt.sub}</span>
            </span>
            <Icon name="chevronLeft" size={16} className="create-go" />
          </button>
        ))}
      </div>
    </Modal>
  )
}
