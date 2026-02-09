import { useState } from 'react';
import styles from './BoardHeader.module.css';

export function BoardHeader({ board, workspaces = [], selectedWorkspaceId, onSelectWorkspace, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(board.title);
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);

  const currentWorkspace = workspaces.find((ws) => ws.id === selectedWorkspaceId) || { name: 'Workspace' };

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

  const handleWorkspaceSelect = (wsId) => {
    onSelectWorkspace(wsId);
    setShowWorkspaceMenu(false);
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
        {/* Attractive workspace switcher */}
        <div className={styles.workspaceSwitcher}>
          <button
            type="button"
            className={styles.workspaceBtn}
            onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)}
          >
            <span className={styles.workspaceIcon}>📍</span>
            <span>{currentWorkspace.name}</span>
            <span className={styles.chevron}>▼</span>
          </button>

          {showWorkspaceMenu && (
            <>
              <div className={styles.menuBackdrop} onClick={() => setShowWorkspaceMenu(false)} />
              <div className={styles.workspaceMenu}>
                {workspaces.map((ws) => (
                  <button
                    key={ws.id}
                    type="button"
                    className={`${styles.menuItem} ${ws.id === selectedWorkspaceId ? styles.active : ''}`}
                    onClick={() => handleWorkspaceSelect(ws.id)}
                  >
                    <span className={styles.menuIcon}>🌐</span>
                    <div>
                      <div className={styles.menuName}>{ws.name}</div>
                      <div className={styles.menuDesc}>{ws.description || 'Workspace'}</div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

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
