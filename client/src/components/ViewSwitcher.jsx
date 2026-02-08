import styles from './ViewSwitcher.module.css';

const VIEWS = [
  { key: 'kanban', label: 'Kanban' },
  { key: 'timeline', label: 'Timeline' },
  { key: 'table', label: 'Table' },
  { key: 'dashboard', label: 'Dashboard' },
];

export function ViewSwitcher({ currentView, onViewChange }) {
  return (
    <div className={styles.switcher}>
      {VIEWS.map((view) => (
        <button
          key={view.key}
          className={`${styles.button} ${currentView === view.key ? styles.active : ''}`}
          onClick={() => onViewChange(view.key)}
        >
          {view.label}
        </button>
      ))}
    </div>
  );
}