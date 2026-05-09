import { AlertCircle, CheckCircle2, Info, XCircle } from 'lucide-react'

const toneIcons = {
  danger: XCircle,
  info: Info,
  success: CheckCircle2,
  warning: AlertCircle,
}

function StatusBadge({ className = '', tone = 'success', children }) {
  const Icon = toneIcons[tone]

  return (
    <span
      className={`status-badge ${tone} ${className}`.trim()}
    >
      {Icon ? (
        <Icon
          className="status-badge-icon"
          aria-hidden="true"
        />
      ) : null}
      <span>{children}</span>
    </span>
  )
}

export default StatusBadge
