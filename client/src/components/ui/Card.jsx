function Card({ actions, children, className = '', description, title }) {
  return (
    <section className={`ui-card ${className}`.trim()}>
      {title || description || actions ? (
        <header className="ui-card-header">
          <div className="ui-card-header-copy">
            {title ? (
              <h3>{title}</h3>
            ) : null}
            {description ? (
              <p>{description}</p>
            ) : null}
          </div>
          {actions ? (
            <div className="ui-card-actions">
              {actions}
            </div>
          ) : null}
        </header>
      ) : null}
      <div className="ui-card-body">{children}</div>
    </section>
  )
}

export default Card
