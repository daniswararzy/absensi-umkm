import { CheckCircle2, XCircle, X } from 'lucide-react'

/**
 * AlertBanner — inline feedback banner for success/error messages.
 *
 * @param {'success' | 'error'} tone
 * @param {string} message
 * @param {function} [onDismiss] — if provided, shows a close button
 */
function AlertBanner({ message, onDismiss, tone = 'success' }) {
  if (!message) {
    return null
  }

  const isSuccess = tone === 'success'
  const Icon = isSuccess ? CheckCircle2 : XCircle

  return (
    <div
      className={`ui-alert-banner ${tone}`}
      role={isSuccess ? 'status' : 'alert'}
    >
      <div className="ui-alert-banner-content">
        <Icon aria-hidden="true" className="ui-alert-banner-icon" />
        <p className="ui-alert-banner-message">{message}</p>
      </div>
      {onDismiss ? (
        <button
          aria-label="Tutup notifikasi"
          className="ui-alert-banner-close"
          onClick={onDismiss}
          type="button"
        >
          <X aria-hidden="true" className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  )
}

export default AlertBanner
