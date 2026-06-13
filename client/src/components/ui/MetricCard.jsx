import Card from './Card'

function MetricCard({ className = '', description, icon: Icon, label, pastel, value }) {
  return (
    <Card className={`metric-card ${className}`.trim()} data-pastel={pastel}>
      <div className="metric-card-top">
        <span className="metric-card-label">
          {label}
        </span>
        {Icon ? (
          <span className="metric-card-icon">
            <Icon aria-hidden="true" />
          </span>
        ) : null}
      </div>
      <strong>{value}</strong>
      <p>{description}</p>
    </Card>
  )
}

export default MetricCard
