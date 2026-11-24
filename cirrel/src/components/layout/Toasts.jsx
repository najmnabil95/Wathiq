import { useStore } from '../../store'
import { Icon } from '../Icons'

export function Toasts() {
  const { toasts, dismissToast } = useStore()
  if (!toasts.length) return null
  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((t) => (
        <button key={t.id} className={`toast glass toast-${t.tone}`} onClick={() => dismissToast(t.id)}>
          <span className="toast-icon">
            <Icon name={t.tone === 'good' ? 'check' : t.tone === 'warn' ? 'bell' : 'sparkle'} size={15} />
          </span>
          <span>{t.message}</span>
        </button>
      ))}
    </div>
  )
}
