import styles from './Select.module.css';

/**
 * Reusable Select component (prod: consistent styling, label support).
 * Props: label, options [{value, label}], value, onChange, className, error.
 * Replaces dupe <select> in forms (Permissions, TaskForm, BoardHeader etc.).
 */
export function Select({ 
  label, 
  options = [], 
  value, 
  onChange, 
  className = '', 
  error,
  ...props 
}) {
  const selectClass = `${styles.select} ${error ? styles.error : ''} ${className}`.trim();

  return (
    <div className={styles.wrapper}>
      {label && <label className={styles.label}>{label}</label>}
      <select 
        className={selectClass}
        value={value} 
        onChange={onChange}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  );
}