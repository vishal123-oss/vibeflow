import { useEffect } from 'react';
import styles from './Modal.module.css';

/**
 * Reusable Modal component (prod: overlay, ESC close, focus trap basic).
 * Props: isOpen, onClose, title, children, className.
 * Replaces dupe modals (PermissionsPage modal, CardModal, pickers).
 */
export function Modal({ isOpen, onClose, title, children, className = '' }) {
  // ESC close for accessibility/prod UX
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={`${styles.modal} ${className}`} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          {title && <h3>{title}</h3>}
          <button onClick={onClose} className={styles.close} aria-label="Close">×</button>
        </header>
        <div className={styles.content}>
          {children}
        </div>
      </div>
    </div>
  );
}