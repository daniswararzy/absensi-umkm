import StatusBadge from './StatusBadge'

function PageHeader({
  actions,
  className = '',
  icon: Icon,
  title,
  description,
  status,
  tone = 'success',
}) {
  return (
    <header className={`page-header ${className}`.trim()}>
      <div className={`page-header-main ${Icon ? '' : 'no-icon'}`.trim()}>
        {Icon ? (
          <span className="page-header-icon">
            <Icon aria-hidden="true" />
          </span>
        ) : null}
        <div className="page-header-copy">
          <h2>{title}</h2>
          {description ? (
            <p>{description}</p>
          ) : null}
        </div>
      </div>
      {(status || actions) ? (
        <div className="page-header-actions">
          {status ? <StatusBadge tone={tone}>{status}</StatusBadge> : null}
          {actions}
        </div>
      ) : null}
    </header>
  )
}

export default PageHeader
