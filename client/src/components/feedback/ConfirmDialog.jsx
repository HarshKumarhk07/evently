import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';

/* Lightweight yes/no confirmation built on the Modal primitive. */
export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  description,
  confirmLabel = 'Confirm',
  loading = false,
  danger = false,
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      {description && <p className="text-sm text-slate-400">{description}</p>}
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="ghost" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant={danger ? 'danger' : 'primary'}
          size="sm"
          loading={loading}
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
