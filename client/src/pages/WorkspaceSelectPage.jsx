import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBoards } from '../context/BoardContext';
import { useAuth } from '../context/AuthContext';
import styles from './WorkspaceSelectPage.module.css';

export function WorkspaceSelectPage() {
  const { workspaces, fetchWorkspaces, selectWorkspace, loading } = useBoards();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    fetchWorkspaces().catch((err) => setError(err.message));
  }, [fetchWorkspaces]);

  const handleSelect = (wsId) => {
    selectWorkspace(wsId);
    navigate('/');
  };

  // If already selected, redirect
  useEffect(() => {
    const selected = localStorage.getItem('selectedWorkspaceId');
    if (selected) navigate('/');
  }, [navigate]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Welcome, {user?.email?.split('@')[0] || 'User'}!</h1>
        <p>Select a workspace to continue</p>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.workspaceGrid}>
        {loading ? (
          <p>Loading workspaces...</p>
        ) : (
          workspaces.map((ws) => (
            <div
              key={ws.id}
              className={styles.workspaceCard}
              onClick={() => handleSelect(ws.id)}
            >
              <div className={styles.icon}>🌐</div>
              <h3>{ws.name}</h3>
              <p>{ws.description || 'Collaborative workspace'}</p>
              <div className={styles.members}>
                👥 {ws.members?.length || 0} members
              </div>
              <button className={styles.selectBtn}>Enter Workspace</button>
            </div>
          ))
        )}
      </div>

      <div className={styles.footer}>
        <button onClick={() => navigate('/tasks')} className={styles.tasksLink}>
          Or view Personal Tasks →
        </button>
      </div>
    </div>
  );
}
