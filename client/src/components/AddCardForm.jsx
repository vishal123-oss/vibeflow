import { useState } from 'react';
import styles from './AddCardForm.module.css';

export function AddCardForm({ onCreate }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    await onCreate({
      content: { title: title.trim(), body: body.trim() },
      meta: { assignee: '', labels: [], priority: 'medium', dueDate: null },
    });
    setTitle('');
    setBody('');
    setOpen(false);
  };

  if (!open) {
    return (
      <button type="button" className={styles.open} onClick={() => setOpen(true)}>
        + Add card
      </button>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Card title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <textarea
        placeholder="Details"
        rows={3}
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <div className={styles.actions}>
        <button type="submit">Add</button>
        <button type="button" onClick={() => setOpen(false)} className={styles.cancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
