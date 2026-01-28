import { useState } from 'react';
import styles from './CommentsSection.module.css';

export function CommentsSection({ comments, boardMembers, onAdd, onDelete }) {
  const [newComment, setNewComment] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setIsAdding(true);
    await onAdd({ text: newComment.trim(), author: 'user-1' });
    setNewComment('');
    setIsAdding(false);
  };

  const getMember = (authorId) => {
    return boardMembers.find((m) => m.id === authorId);
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
          <path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18zM18 14H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
        </svg>
        <h4>Comments</h4>
      </div>

      <form onSubmit={handleSubmit} className={styles.addForm}>
        <div className={styles.avatar}>U</div>
        <div className={styles.inputWrapper}>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            rows={2}
            className={styles.textarea}
          />
          {newComment.trim() && (
            <button type="submit" disabled={isAdding} className={styles.submitBtn}>
              {isAdding ? 'Saving...' : 'Save'}
            </button>
          )}
        </div>
      </form>

      <ul className={styles.list}>
        {comments.map((comment) => {
          const member = getMember(comment.author);
          return (
            <li key={comment.id} className={styles.comment}>
              <div className={styles.avatar}>
                {member?.initials || comment.author?.slice(0, 2).toUpperCase() || 'U'}
              </div>
              <div className={styles.commentContent}>
                <div className={styles.commentHeader}>
                  <strong>{member?.name || comment.author || 'User'}</strong>
                  <span className={styles.time}>{formatDate(comment.createdAt)}</span>
                </div>
                <p className={styles.commentText}>{comment.text}</p>
                <div className={styles.actions}>
                  <button
                    type="button"
                    className={styles.deleteBtn}
                    onClick={() => onDelete(comment.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
