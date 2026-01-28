import { useState } from 'react';
import { CardItem } from './CardItem';
import { AddCardForm } from './AddCardForm';
import styles from './ListColumn.module.css';

export function ListColumn({ list, onCreateCard, onOpenCard, onDeleteList, onUpdateList }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(list.title);

  const submitTitle = async (e) => {
    e.preventDefault();
    setEditing(false);
    if (!title.trim()) setTitle(list.title);
    if (title.trim() && title.trim() !== list.title) {
      await onUpdateList(list.id, { title: title.trim() });
    }
  };

  return (
    <div className={styles.column}>
      <div className={styles.header}>
        {editing ? (
          <form onSubmit={submitTitle} className={styles.editForm}>
            <input value={title} onChange={(e) => setTitle(e.target.value)} />
          </form>
        ) : (
          <h3 onDoubleClick={() => setEditing(true)}>{list.title}</h3>
        )}
        <button type="button" className={styles.delete} onClick={onDeleteList}>
          ×
        </button>
      </div>
      <div className={styles.cards}>
        {list.cards.map((card) => (
          <CardItem key={card.id} card={card} onOpen={() => onOpenCard(card, list.id)} />
        ))}
      </div>
      <AddCardForm onCreate={(payload) => onCreateCard(list.id, payload)} />
    </div>
  );
}
