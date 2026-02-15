import { Modal } from './Modal';
import { Button } from './Button';
import styles from './ConfirmModal.module.css';

/**
 * Reusable ConfirmModal (prod: for deletes/confirm actions; wraps Modal + buttons).
 * Props: isOpen, onClose, onConfirm, title, message, confirmText, cancelText.
 * Replaces window.confirm() dupe (e.g., delete in PermissionsPage, lists/cards).
 */
export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm',
  message = 'Are you sure?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger', // for confirm button
}) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <p className={styles.message}>{message}</p>
      <div className={styles.actions}>
        <Button variant="secondary" onClick={onClose}>
          {cancelText}
        </Button>
        <Button variant={variant} onClick={handleConfirm}>
          {confirmText}
        </Button>
      </div>
    </Modal>
  );
}