import { useState } from 'react';
import styles from './TaskCard.module.css';

export function TaskCard({ task, onDelete, onUpdate }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(task.id);
    } finally {
      setDeleting(false);
    }
  };

  const priority = task.meta?.priority ?? 'medium';
  const labels = task.meta?.labels ?? [];
  const assignee = task.meta?.assignee ?? '';
  const title = task.content?.title ?? '';
  const body = task.content?.body ?? '';
  const lastAction = task.history?.length ? task.history[task.history.length - 1] : null;

  return (
    <article className={styles.card} data-priority={priority}>
      <div className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
        <button
          type="button"
          className={styles.deleteBtn}
          onClick={handleDelete}
          disabled={deleting}
          title="Delete task"
          aria-label="Delete task"
        >
          {deleting ? '…' : '×'}
        </button>
      </div>
      {body && <p className={styles.body}>{body}</p>}
      <div className={styles.meta}>
        {assignee && <span className={styles.assignee}>{assignee}</span>}
        {labels.map((l) => (
          <span key={l} className={styles.label}>
            {l}
          </span>
        ))}
        {lastAction && (
          <span className={styles.history}>
            {lastAction.action} · {new Date(lastAction.timestamp).toLocaleDateString()}
          </span>
        )}
      </div>
    </article>
  );
}
