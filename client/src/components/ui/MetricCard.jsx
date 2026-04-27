import Card from './Card'

function MetricCard({ label, value, description }) {
  return (
    <Card className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{description}</p>
    </Card>
  )
}

export default MetricCard
