import Spinner from './Spinner'

/**
 * PageLoader — full-section loading state with spinner and optional message.
 * Replaces page content while data is being fetched.
 *
 * @param {string} [message='Memuat halaman...'] - loading message
 */
function PageLoader({ message = 'Memuat halaman...' }) {
  return (
    <div className="ui-page-loader" role="status" aria-live="polite">
      <div className="ui-page-loader-content">
        <Spinner size="lg" label={message} />
        <span className="ui-page-loader-message">{message}</span>
      </div>
    </div>
  )
}

export default PageLoader
