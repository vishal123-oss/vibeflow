import styles from './MemberPicker.module.css';

export function MemberPicker({ selectedMembers, boardMembers, onChange, onClose }) {
  const toggleMember = (memberId) => {
    if (selectedMembers.includes(memberId)) {
      onChange(selectedMembers.filter((m) => m !== memberId));
    } else {
      onChange([...selectedMembers, memberId]);
    }
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.picker} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <h4>Members</h4>
          <button type="button" className={styles.closeBtn} onClick={onClose}>
            ×
          </button>
        </header>

        <div className={styles.list}>
          {boardMembers.map((member) => (
            <button
              key={member.id}
              type="button"
              className={`${styles.member} ${selectedMembers.includes(member.id) ? styles.selected : ''}`}
              onClick={() => toggleMember(member.id)}
            >
              <span className={styles.avatar}>
                {member.initials || member.name?.slice(0, 2).toUpperCase()}
              </span>
              <span className={styles.name}>
                {member.name || `${member.firstName || ''} ${member.lastName || ''}`.trim() || 'User'}
              </span>
              {selectedMembers.includes(member.id) && (
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
