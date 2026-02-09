import styles from './CardItem.module.css';

export function CardItem({ card, boardLabels = [], onOpen, isDragging }) {
  const labels = card.labels ?? [];
  const members = card.members ?? [];
  const checklists = card.checklists ?? [];
  const comments = card.comments ?? [];
  const dueDate = card.dueDate;
  const dueComplete = card.dueComplete;
  const cover = card.cover;

  // Calculate checklist progress
  const checklistItems = checklists.flatMap((c) => c.items || []);
  const completedItems = checklistItems.filter((i) => i.completed).length;
  const totalItems = checklistItems.length;

  // Get label objects
  const labelObjects = labels
    .map((labelId) => boardLabels.find((l) => l.id === labelId))
    .filter(Boolean);

  // Check if due date is overdue
  const isOverdue = dueDate && !dueComplete && new Date(dueDate) < new Date();
  const isDueSoon =
    dueDate &&
    !dueComplete &&
    !isOverdue &&
    new Date(dueDate) <= new Date(Date.now() + 24 * 60 * 60 * 1000);

  const handleClick = (e) => {
    if (isDragging) return;
    onOpen?.();
  };

  return (
    <div
      className={`${styles.card} ${isDragging ? styles.dragging : ''}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick(e)}
    >
      {cover && (
        <div
          className={styles.cover}
          style={
            cover.type === 'color'
              ? { backgroundColor: cover.value }
              : cover.type === 'gradient'
              ? { background: cover.value }
              : cover.type === 'image'
              ? { backgroundImage: `url(${cover.value})` }
              : {}
          }
        />
      )}

      <div className={styles.content}>
        {labelObjects.length > 0 && (
          <div className={styles.labels}>
            {labelObjects.map((label) => (
              <span
                key={label.id}
                className={styles.label}
                style={{ backgroundColor: label.color }}
                title={label.name}
              >
                {label.name}
              </span>
            ))}
          </div>
        )}

        <div className={styles.title}>{card.content?.title ?? 'Untitled'}</div>

        <div className={styles.badges}>
          {dueDate && (
            <span
              className={`${styles.badge} ${styles.due} ${
                dueComplete ? styles.complete : isOverdue ? styles.overdue : isDueSoon ? styles.soon : ''
              }`}
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.2 3.2.8-1.3-4.5-2.7V7z" />
              </svg>
              {new Date(dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              {dueComplete && ' ✓'}
            </span>
          )}

          {card.content?.body && (
            <span className={styles.badge} title="Has description">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                <path d="M4 5h16v2H4zm0 4h16v2H4zm0 4h10v2H4z" />
              </svg>
            </span>
          )}

          {comments.length > 0 && (
            <span className={styles.badge} title={`${comments.length} comments`}>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                <path d="M21 6h-2V4c0-1.1-.9-2-2-2H3c-1.1 0-2 .9-2 2v12l4-4h9v2H6l-4 4V4h14v8h2v6l-4-4h-1v-2h2l4 4V6z" />
              </svg>
              {comments.length}
            </span>
          )}

          {totalItems > 0 && (
            <span
              className={`${styles.badge} ${completedItems === totalItems ? styles.checkComplete : ''}`}
              title={`${completedItems}/${totalItems} checklist items`}
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
              </svg>
              {completedItems}/{totalItems}
            </span>
          )}

          {card.attachments?.length > 0 && (
            <span className={styles.badge} title={`${card.attachments.length} attachments`}>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                <path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z" />
              </svg>
              {card.attachments.length}
            </span>
          )}
        </div>

        {members.length > 0 && (
          <div className={styles.members}>
            {members.slice(0, 3).map((member, i) => {
              // Handle string id or object {id, name, initials}
              const id = typeof member === 'string' ? member : member.id || member;
              const name = typeof member === 'object' && member.name ? member.name : id;
              const initials = typeof member === 'object' && member.initials 
                ? member.initials 
                : (typeof id === 'string' ? id.slice(0, 2).toUpperCase() : '??');
              return (
                <span key={id} className={styles.avatar} title={name}>
                  {initials}
                </span>
              );
            })}
            {members.length > 3 && (
              <span className={styles.avatarMore}>+{members.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
