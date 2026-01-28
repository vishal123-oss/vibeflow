import { useState } from 'react';
import styles from './PreviewPane.module.css';

export function PreviewPane({ url, onChange }) {
  const [value, setValue] = useState(url || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onChange(value.trim());
  };

  return (
    <aside className={styles.preview}>
      <form className={styles.bar} onSubmit={handleSubmit}>
        <input
          type="url"
          placeholder="Preview URL"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <button type="submit">Load</button>
      </form>
      {url ? (
        <iframe title="Live preview" src={url} className={styles.frame} />
      ) : (
        <div className={styles.empty}>Add a preview URL to see live output.</div>
      )}
    </aside>
  );
}
