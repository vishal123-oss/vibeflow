import { NavLink, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useBoards } from '../context/BoardContext';
import styles from './BoardSidebar.module.css';

export function BoardSidebar() {
  const { boards, workspaces, fetchBoards, fetchWorkspaces, createBoard, loading } = useBoards();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchBoards();
    fetchWorkspaces();
  }, [fetchBoards, fetchWorkspaces]);

  // Default to first workspace if available
  useEffect(() => {
    if (workspaces.length > 0 && !selectedWorkspaceId) {
      setSelectedWorkspaceId(workspaces[0].id);
    }
  }, [workspaces, selectedWorkspaceId]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim() || !selectedWorkspaceId) return;
    const board = await createBoard({
      title: title.trim(),
      description: description.trim(),
      workspaceId: selectedWorkspaceId,
    });
    setTitle('');
    setDescription('');
    navigate(`/boards/${board.id}`);
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.glass}>
        <div className={styles.brand}>
          <span>VibeFlow</span>
          <small>Boards</small>
        </div>

        <nav className={styles.nav}>
          <NavLink to="/" end className={({ isActive }) => (isActive ? styles.active : '')}>
            All Boards
          </NavLink>
          {boards.map((board) => (
            <NavLink
              key={board.id}
              to={`/boards/${board.id}`}
              className={({ isActive }) => (isActive ? styles.active : '')}
            >
              {board.title}
            </NavLink>
          ))}
        </nav>

        <form className={styles.form} onSubmit={handleCreate}>
          <h3>Create Board</h3>
          <input
            type="text"
            placeholder="Board name"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <textarea
            placeholder="Description (optional)"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <select
            value={selectedWorkspaceId}
            onChange={(e) => setSelectedWorkspaceId(e.target.value)}
            required
          >
            <option value="">Select workspace</option>
            {workspaces.map((ws) => (
              <option key={ws.id} value={ws.id}>
                {ws.name}
              </option>
            ))}
          </select>
          <button type="submit" disabled={loading}>
            {loading ? 'Creating…' : 'Create'}
          </button>
        </form>
      </div>
    </aside>
  );
}
