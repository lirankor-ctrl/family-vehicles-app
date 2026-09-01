interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Shared modal confirmation — used where an action is destructive enough
 *  to warrant a stronger interruption than the app's usual inline confirm
 *  cards (e.g. permanently deleting an accident case and all its media). */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel = 'ביטול',
  danger,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;
  return (
    <div className="confirm-overlay" role="presentation" onClick={onCancel}>
      <div
        className="confirm-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={title ?? confirmLabel}
        onClick={e => e.stopPropagation()}
      >
        {title && <div className="confirm-dialog-title">{title}</div>}
        <p className="confirm-dialog-message">{message}</p>
        <div className="confirm-dialog-actions">
          <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'} btn-full`} onClick={onConfirm}>
            {confirmLabel}
          </button>
          <button className="btn btn-secondary btn-full" onClick={onCancel}>
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
