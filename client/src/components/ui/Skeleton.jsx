/**
 * Skeleton — animated placeholder for content loading.
 *
 * @param {'text' | 'heading' | 'card' | 'metric' | 'table-row' | 'circle'} [variant='text']
 * @param {number} [count=1] - how many skeleton lines to render
 * @param {string} [className] - additional CSS class
 */
function Skeleton({ className = '', count = 1, variant = 'text' }) {
  const items = Array.from({ length: count }, (_, i) => i)

  return (
    <div
      aria-hidden="true"
      className={`ui-skeleton-group ${className}`.trim()}
      role="presentation"
    >
      {items.map((index) => (
        <div className={`ui-skeleton ${variant}`} key={index} />
      ))}
    </div>
  )
}

export default Skeleton
