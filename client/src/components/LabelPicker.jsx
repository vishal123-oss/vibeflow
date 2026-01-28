import styles from './LabelPicker.module.css';

export function LabelPicker({ selectedLabels, boardLabels, onChange, onClose }) {
  const toggleLabel = (labelId) => {
    if (selectedLabels.includes(labelId)) {
      onChange(selectedLabels.filter((l) => l !== labelId));
    } else {
      onChange([...selectedLabels, labelId]);
    }
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.picker} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <h4>Labels</h4>
          <button type="button" className={styles.closeBtn} onClick={onClose}>
            ×
          </button>
        </header>

        <div className={styles.list}>
          {boardLabels.map((label) => (
            <button
              key={label.id}
              type="button"
              className={`${styles.label} ${selectedLabels.includes(label.id) ? styles.selected : ''}`}
              onClick={() => toggleLabel(label.id)}
            >
              <span className={styles.color} style={{ backgroundColor: label.color }} />
              <span className={styles.name}>{label.name || 'Unnamed'}</span>
              {selectedLabels.includes(label.id) && (
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" className={styles.check}>
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
