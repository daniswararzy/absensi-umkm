function Input({ className = '', error, helperText, id, label, ...props }) {
  const helpId = id && (helperText || error) ? `${id}-help` : undefined

  return (
    <label className="ui-field" htmlFor={id}>
      {label ? (
        <span className="ui-field-label">{label}</span>
      ) : null}
      <input
        aria-describedby={helpId}
        aria-invalid={error ? 'true' : undefined}
        className={`ui-input ${error ? 'error' : ''} ${className}`.trim()}
        id={id}
        {...props}
      />
      {helperText || error ? (
        <small
          className={`field-help ${error ? 'error' : ''}`}
          id={helpId}
        >
          {error || helperText}
        </small>
      ) : null}
    </label>
  )
}

export default Input
