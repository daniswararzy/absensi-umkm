import { useId } from 'react'
import Button from './Button'

function Modal({ children, className = '', footer, isOpen, onClose, title }) {
  const titleId = useId()

  if (!isOpen) {
    return null
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section
        aria-labelledby={titleId}
        aria-modal="true"
        className={`ui-modal ${className}`.trim()}
        role="dialog"
      >
        <header className="ui-modal-header">
          <h2 id={titleId}>{title}</h2>
          <Button aria-label="Tutup modal" onClick={onClose} size="sm" variant="ghost">
            Tutup
          </Button>
        </header>
        <div className="ui-modal-body">{children}</div>
        {footer ? <footer className="ui-modal-footer">{footer}</footer> : null}
      </section>
    </div>
  )
}

export default Modal
