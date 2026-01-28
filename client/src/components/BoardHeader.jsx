import { useState } from 'react';
import styles from './BoardHeader.module.css';

export function BoardHeader({ board, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(board.title);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setEditing(false);
    if (title.trim() && title.trim() !== board.title) {
      await onUpdate({ title: title.trim() });
    } else {
      setTitle(board.title);
    }
  };

  const toggleStar = async () => {
    await onUpdate({ starred: !board.starred });
  };

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        {editing ? (
          <form onSubmit={handleSubmit} className={styles.editForm}>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleSubmit}
              autoFocus
              className={styles.input}
            />
          </form>
        ) : (
          <h1 className={styles.title} onClick={() => setEditing(true)}>
            {board.title}
          </h1>
        )}
        <button
          type="button"
          className={`${styles.starBtn} ${board.starred ? styles.starred : ''}`}
          onClick={toggleStar}
          title={board.starred ? 'Unstar board' : 'Star board'}
        >
          {board.starred ? '★' : '☆'}
        </button>
      </div>

      <div className={styles.right}>
        <div className={styles.members}>
          {board.members?.slice(0, 5).map((member) => (
            <span key={member.id} className={styles.avatar} title={member.name}>
              {member.initials || member.name?.slice(0, 2).toUpperCase()}
            </span>
          ))}
          {board.members?.length > 5 && (
            <span className={styles.avatarMore}>+{board.members.length - 5}</span>
          )}
        </div>
      </div>
    </header>
  );
}
