import { NavLink, useSearchParams } from 'react-router-dom';
import styles from './Sidebar.module.css';

const PRIORITIES = [
  { value: 'high', label: 'High Priority' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const ASSIGNEES = ['User1', 'User2'];

const LABELS = ['backend', 'frontend', 'design', 'urgent', 'state'];

export function Sidebar() {
  const [searchParams, setSearchParams] = useSearchParams();

  const setFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next, { replace: true });
  };

  const toggleLabel = (label) => {
    const current = searchParams.getAll('label');
    const has = current.includes(label);
    const updated = has ? current.filter((l) => l !== label) : [...current, label];
    const next = new URLSearchParams();
    for (const [k, v] of searchParams) {
      if (k !== 'label') next.append(k, v);
    }
    updated.forEach((l) => next.append('label', l));
    setSearchParams(next, { replace: true });
  };

  const clearFilters = () => setSearchParams({}, { replace: true });

  const activePriority = searchParams.get('priority');
  const activeAssignee = searchParams.get('assignee');
  const activeLabels = searchParams.getAll('label');

  return (
    <aside className={styles.sidebar}>
      <div className={styles.glass}>
        <nav className={styles.nav}>
          <NavLink to="/tasks" end className={({ isActive }) => (isActive ? styles.active : '')}>
            Tasks
          </NavLink>
        </nav>

        <section className={styles.section}>
          <h3 className={styles.heading}>Priority</h3>
          <div className={styles.filters}>
            {PRIORITIES.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                className={activePriority === value ? styles.activeBtn : ''}
                onClick={() => setFilter('priority', activePriority === value ? '' : value)}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <h3 className={styles.heading}>Assignee</h3>
          <div className={styles.filters}>
            {ASSIGNEES.map((person) => (
              <button
                key={person}
                type="button"
                className={activeAssignee === person ? styles.activeBtn : ''}
                onClick={() => setFilter('assignee', activeAssignee === person ? '' : person)}
              >
                {person}
              </button>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <h3 className={styles.heading}>Labels</h3>
          <div className={styles.filters}>
            {LABELS.map((l) => (
              <button
                key={l}
                type="button"
                className={activeLabels.includes(l) ? styles.activeBtn : ''}
                onClick={() => toggleLabel(l)}
              >
                {l}
              </button>
            ))}
          </div>
        </section>

        {(activePriority || activeAssignee || activeLabels.length > 0) && (
          <button type="button" className={styles.clear} onClick={clearFilters}>
            Clear filters
          </button>
        )}
      </div>
    </aside>
  );
}
