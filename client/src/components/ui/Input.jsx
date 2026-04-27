function Input({ error, helperText, id, label, ...props }) {
  const helpId = id && (helperText || error) ? `${id}-help` : undefined

  return (
    <label className="ui-field" htmlFor={id}>
      {label ? <span>{label}</span> : null}
      <input
        aria-describedby={helpId}
        aria-invalid={error ? 'true' : undefined}
        className={error ? 'ui-input error' : 'ui-input'}
        id={id}
        {...props}
      />
      {helperText || error ? (
        <small className={error ? 'field-help error' : 'field-help'} id={helpId}>
          {error || helperText}
        </small>
      ) : null}
    </label>
  )
}

export default Input
