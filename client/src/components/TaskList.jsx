import { useEffect } from 'react';
import { useFilteredTasks } from '../hooks/useFilteredTasks';
import { TaskCard } from './TaskCard';
import styles from './TaskList.module.css';

export function TaskList() {
  const {
    tasks,
    loading,
    error,
    fetchTasks,
    deleteTask,
    clearError,
    filters,
  } = useFilteredTasks();

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const hasFilters = filters.priority || filters.assignee || (filters.labels && filters.labels.length > 0);

  return (
    <div className={styles.wrapper}>
      {error && (
        <div className={styles.banner} role="alert">
          <span>{error}</span>
          <button type="button" onClick={clearError} className={styles.dismiss}>
            Dismiss
          </button>
        </div>
      )}

      {loading && tasks.length === 0 ? (
        <div className={styles.loading}>Loading tasks…</div>
      ) : (
        <>
          {hasFilters && (
            <p className={styles.hint}>
              Showing {tasks.length} task{tasks.length !== 1 ? 's' : ''} (filters from URL)
            </p>
          )}
          <ul className={styles.list}>
            {tasks.map((task) => (
              <li key={task.id}>
                <TaskCard task={task} onDelete={deleteTask} onUpdate={() => {}} />
              </li>
            ))}
          </ul>
          {tasks.length === 0 && !loading && (
            <p className={styles.empty}>
              {hasFilters ? 'No tasks match the current filters.' : 'No tasks yet.'}
            </p>
          )}
        </>
      )}
    </div>
  );
}
