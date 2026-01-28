import { useState } from 'react';
import styles from './BoardToolbar.module.css';

export function BoardToolbar({
  board,
  filterLabels,
  filterMembers,
  searchQuery,
  onFilterLabels,
  onFilterMembers,
  onSearch,
  onShowArchive,
}) {
  const [showFilters, setShowFilters] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const toggleLabel = (labelId) => {
    if (filterLabels.includes(labelId)) {
      onFilterLabels(filterLabels.filter((l) => l !== labelId));
    } else {
      onFilterLabels([...filterLabels, labelId]);
    }
  };

  const toggleMember = (memberId) => {
    if (filterMembers.includes(memberId)) {
      onFilterMembers(filterMembers.filter((m) => m !== memberId));
    } else {
      onFilterMembers([...filterMembers, memberId]);
    }
  };

  const clearFilters = () => {
    onFilterLabels([]);
    onFilterMembers([]);
    onSearch('');
  };

  const hasActiveFilters = filterLabels.length > 0 || filterMembers.length > 0 || searchQuery;

  return (
    <div className={styles.toolbar}>
      <div className={styles.left}>
        <div className={styles.searchWrapper}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" className={styles.searchIcon}>
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
          </svg>
          <input
            type="text"
            placeholder="Search cards..."
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            className={styles.searchInput}
          />
          {searchQuery && (
            <button
              type="button"
              className={styles.clearSearch}
              onClick={() => onSearch('')}
            >
              ×
            </button>
          )}
        </div>

        <div className={styles.filterWrapper}>
          <button
            type="button"
            className={`${styles.filterBtn} ${hasActiveFilters ? styles.active : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z" />
            </svg>
            Filter
            {hasActiveFilters && (
              <span className={styles.filterCount}>
                {filterLabels.length + filterMembers.length + (searchQuery ? 1 : 0)}
              </span>
            )}
          </button>

          {showFilters && (
            <>
              <div className={styles.backdrop} onClick={() => setShowFilters(false)} />
              <div className={styles.filterDropdown}>
                <div className={styles.filterSection}>
                  <h4>Labels</h4>
                  <div className={styles.filterOptions}>
                    {board.labels?.map((label) => (
                      <button
                        key={label.id}
                        type="button"
                        className={`${styles.labelOption} ${
                          filterLabels.includes(label.id) ? styles.selected : ''
                        }`}
                        onClick={() => toggleLabel(label.id)}
                      >
                        <span
                          className={styles.labelColor}
                          style={{ backgroundColor: label.color }}
                        />
                        {label.name || 'Unnamed'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.filterSection}>
                  <h4>Members</h4>
                  <div className={styles.filterOptions}>
                    {board.members?.map((member) => (
                      <button
                        key={member.id}
                        type="button"
                        className={`${styles.memberOption} ${
                          filterMembers.includes(member.id) ? styles.selected : ''
                        }`}
                        onClick={() => toggleMember(member.id)}
                      >
                        <span className={styles.memberAvatar}>
                          {member.initials || member.name?.slice(0, 2).toUpperCase()}
                        </span>
                        {member.name}
                      </button>
                    ))}
                  </div>
                </div>

                {hasActiveFilters && (
                  <button
                    type="button"
                    className={styles.clearBtn}
                    onClick={clearFilters}
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <div className={styles.right}>
        <div className={styles.menuWrapper}>
          <button
            type="button"
            className={styles.menuBtn}
            onClick={() => setShowMenu(!showMenu)}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
            </svg>
            Menu
          </button>

          {showMenu && (
            <>
              <div className={styles.backdrop} onClick={() => setShowMenu(false)} />
              <div className={styles.menu}>
                <button onClick={() => { setShowMenu(false); onShowArchive(); }}>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                    <path d="M20.54 5.23l-1.39-1.68C18.88 3.21 18.47 3 18 3H6c-.47 0-.88.21-1.16.55L3.46 5.23C3.17 5.57 3 6.02 3 6.5V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6.5c0-.48-.17-.93-.46-1.27zM12 17.5L6.5 12H10v-2h4v2h3.5L12 17.5zM5.12 5l.81-1h12l.94 1H5.12z" />
                  </svg>
                  Archive
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
