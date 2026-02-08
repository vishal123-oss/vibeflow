import { useState } from 'react';
import styles from './ActivitySection.module.css';

export function ActivitySection({ activity, boardMembers }) {
  const [showAll, setShowAll] = useState(false);

  const getMember = (userId) => {
    return boardMembers.find((m) => m.id === userId);
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

  const displayedActivity = showAll ? activity : activity.slice(0, 5);

  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
          <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z" />
        </svg>
        <h4>Activity</h4>
        {activity.length > 5 && (
          <button
            type="button"
            className={styles.toggleBtn}
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? 'Show less' : `Show all (${activity.length})`}
          </button>
        )}
      </div>

      <ul className={styles.list}>
        {displayedActivity.map((item, index) => {
          const member = getMember(item.user);
          return (
            <li key={index} className={styles.item}>
              <div className={styles.avatar}>
                {member?.initials || item.user?.slice(0, 2).toUpperCase() || 'S'}
              </div>
              <div className={styles.content}>
                <span className={styles.action}>
                  <strong>
                    {member?.name || `${member?.firstName || ''} ${member?.lastName || ''}`.trim() || item.user || 'System'}
                  </strong>
                  {' '}{item.action}
                </span>
                <span className={styles.time}>{formatDate(item.timestamp)}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
