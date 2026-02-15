import styles from './Button.module.css';

/**
 * Reusable Button component for prod consistency.
 * Props: children, onClick, variant (primary|secondary|danger), disabled, className, type.
 * Eliminates dupe button styles/code across app (e.g., PermissionsPage, forms).
 */
export function Button({ 
  children, 
  onClick, 
  variant = 'primary', 
  disabled = false, 
  className = '', 
  type = 'button',
  ...props 
}) {
  const buttonClass = `${styles.button} ${styles[variant]} ${className}`.trim();

  return (
    <button
      type={type}
      className={buttonClass}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}