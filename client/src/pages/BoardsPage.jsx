import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useBoards } from '../context/BoardContext';
import styles from './BoardsPage.module.css';

export function BoardsPage() {
  const { boards, workspaces, loading, error, fetchBoards, fetchWorkspaces, resetBoards, clearError } = useBoards();

  useEffect(() => {
    fetchBoards();
    fetchWorkspaces();
  }, [fetchBoards, fetchWorkspaces]);

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div>
          <h2>Boards</h2>
          <p>Pick a board or create a new one.</p>
        </div>
        <div className={styles.actions}>
          <button type="button" className={styles.reset} onClick={resetBoards} disabled={loading}>
            {loading ? 'Resetting…' : 'Load demo boards'}
          </button>
        </div>
      </header>

      {error && (
        <div className={styles.banner} role="alert">
          <span>{error}</span>
          <button type="button" onClick={clearError}>
            Dismiss
          </button>
        </div>
      )}

      {loading && boards.length === 0 ? (
        <p className={styles.loading}>Loading boards…</p>
      ) : (
        <>
          <div className={styles.workspacesSection}>
            <h3>Workspaces</h3>
            <div className={styles.workspaceList}>
              {workspaces.map((ws) => (
                <div key={ws.id} className={styles.workspaceCard}>
                  <strong>{ws.name}</strong>
                  <p>{ws.description || 'No description'}</p>
                  <small>Members: {ws.members?.length || 0}</small>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.grid}>
            {boards.map((board) => (
              <Link key={board.id} to={`/boards/${board.id}`} className={styles.card}>
                <h3>{board.title}</h3>
                <p>{board.description || 'No description yet.'}</p>
                <span>Open board →</span>
              </Link>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
