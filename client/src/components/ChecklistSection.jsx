import { useState } from 'react';
import styles from './ChecklistSection.module.css';

export function ChecklistSection({ checklists, onUpdate, onDelete }) {
  return (
    <div className={styles.section}>
      {checklists.map((checklist) => (
        <ChecklistItem
          key={checklist.id}
          checklist={checklist}
          onUpdate={(payload) => onUpdate(checklist.id, payload)}
          onDelete={() => onDelete(checklist.id)}
        />
      ))}
    </div>
  );
}

function ChecklistItem({ checklist, onUpdate, onDelete }) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(checklist.title);
  const [newItemText, setNewItemText] = useState('');
  const [showAddItem, setShowAddItem] = useState(false);

  const items = checklist.items ?? [];
  const completed = items.filter((i) => i.completed).length;
  const total = items.length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  const handleTitleSave = async () => {
    setEditingTitle(false);
    if (title.trim() && title.trim() !== checklist.title) {
      await onUpdate({ title: title.trim() });
    } else {
      setTitle(checklist.title);
    }
  };

  const handleToggleItem = async (itemId) => {
    const updatedItems = items.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    await onUpdate({ items: updatedItems });
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItemText.trim()) return;
    const newItem = {
      id: `item-${Date.now()}`,
      text: newItemText.trim(),
      completed: false,
    };
    await onUpdate({ items: [...items, newItem] });
    setNewItemText('');
  };

  const handleDeleteItem = async (itemId) => {
    const updatedItems = items.filter((item) => item.id !== itemId);
    await onUpdate({ items: updatedItems });
  };

  return (
    <div className={styles.checklist}>
      <div className={styles.header}>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
        </svg>
        {editingTitle ? (
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
            className={styles.titleInput}
            autoFocus
          />
        ) : (
          <h4 onClick={() => setEditingTitle(true)}>{checklist.title}</h4>
        )}
        <button type="button" className={styles.deleteBtn} onClick={onDelete}>
          Delete
        </button>
      </div>

      <div className={styles.progressBar}>
        <span className={styles.progressText}>{progress}%</span>
        <div className={styles.progressTrack}>
          <div
            className={styles.progressFill}
            style={{ width: `${progress}%` }}
            data-complete={progress === 100}
          />
        </div>
      </div>

      <ul className={styles.items}>
        {items.map((item) => (
          <li key={item.id} className={styles.item}>
            <label className={styles.itemLabel}>
              <input
                type="checkbox"
                checked={item.completed}
                onChange={() => handleToggleItem(item.id)}
              />
              <span className={item.completed ? styles.completed : ''}>{item.text}</span>
            </label>
            <button
              type="button"
              className={styles.itemDelete}
              onClick={() => handleDeleteItem(item.id)}
            >
              ×
            </button>
          </li>
        ))}
      </ul>

      {showAddItem ? (
        <form onSubmit={handleAddItem} className={styles.addForm}>
          <input
            type="text"
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            placeholder="Add an item"
            autoFocus
          />
          <div className={styles.addActions}>
            <button type="submit">Add</button>
            <button type="button" onClick={() => setShowAddItem(false)}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          className={styles.addBtn}
          onClick={() => setShowAddItem(true)}
        >
          Add an item
        </button>
      )}
    </div>
  );
}
