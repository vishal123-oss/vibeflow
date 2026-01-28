import { useState } from 'react';
import styles from './AddListForm.module.css';

export function AddListForm({ onCreate }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    await onCreate({ title: title.trim() });
    setTitle('');
    setOpen(false);
  };

  if (!open) {
    return (
      <button type="button" className={styles.open} onClick={() => setOpen(true)}>
        + Add list
      </button>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="List title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <div className={styles.actions}>
        <button type="submit">Create</button>
        <button type="button" onClick={() => setOpen(false)} className={styles.cancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
