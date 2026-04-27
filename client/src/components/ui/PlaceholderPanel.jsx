import Card from './Card'

function PlaceholderPanel({ title, description, items = [] }) {
  return (
    <Card className="placeholder-panel">
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </Card>
  )
}

export default PlaceholderPanel
