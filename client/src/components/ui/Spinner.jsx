/**
 * Spinner — a simple animated spinner for loading states.
 *
 * @param {'sm' | 'md' | 'lg'} [size='md'] - spinner size
 * @param {string} [className] - additional CSS class
 * @param {string} [label='Memuat...'] - accessible label for screen readers
 */
function Spinner({ className = '', label = 'Memuat...', size = 'md' }) {
  return (
    <span
      aria-label={label}
      className={`ui-spinner ${size} ${className}`.trim()}
      role="status"
    >
      <span className="ui-spinner-sr-only">{label}</span>
    </span>
  )
}

export default Spinner
