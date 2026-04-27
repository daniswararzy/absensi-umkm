import StatusBadge from './StatusBadge'

function PageHeader({
  actions,
  eyebrow,
  title,
  description,
  status,
  tone = 'success',
}) {
  return (
    <header className="page-header">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      {status || actions ? (
        <div className="page-header-actions">
          {status ? <StatusBadge tone={tone}>{status}</StatusBadge> : null}
          {actions}
        </div>
      ) : null}
    </header>
  )
}

export default PageHeader
