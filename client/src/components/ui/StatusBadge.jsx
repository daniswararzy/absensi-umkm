function StatusBadge({ tone = 'success', children }) {
  return <span className={`status-badge ${tone}`}>{children}</span>
}

export default StatusBadge
