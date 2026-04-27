function Button({
  as: Component = 'button',
  children,
  className = '',
  size = 'md',
  type = 'button',
  variant = 'primary',
  ...props
}) {
  const buttonProps = Component === 'button' ? { type } : {}

  return (
    <Component
      className={`ui-button ${variant} ${size} ${className}`.trim()}
      {...buttonProps}
      {...props}
    >
      {children}
    </Component>
  )
}

export default Button
