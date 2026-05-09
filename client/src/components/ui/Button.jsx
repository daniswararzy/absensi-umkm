import Spinner from './Spinner'

function Button({
  as: Component = 'button',
  children,
  className = '',
  disabled,
  icon: Icon,
  isLoading = false,
  loadingText,
  size = 'md',
  type = 'button',
  variant = 'primary',
  ...props
}) {
  const buttonProps = Component === 'button' ? { type } : {}
  const isDisabled = disabled || isLoading

  return (
    <Component
      className={`ui-button ${variant} ${size} ${isLoading ? 'loading' : ''} ${className}`.trim()}
      disabled={isDisabled}
      {...buttonProps}
      {...props}
    >
      {isLoading ? (
        <Spinner
          className="ui-button-spinner"
          label={loadingText || 'Memproses...'}
          size="sm"
        />
      ) : Icon ? (
        <Icon
          className="ui-button-icon"
          aria-hidden="true"
        />
      ) : null}
      <span className="ui-button-label">
        {isLoading ? (loadingText || children) : children}
      </span>
    </Component>
  )
}

export default Button
