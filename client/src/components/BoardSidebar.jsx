import { NavLink, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useBoards } from '../context/BoardContext';
import styles from './BoardSidebar.module.css';

export function BoardSidebar() {
  const { boards, fetchBoards, createBoard, loading } = useBoards();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    const board = await createBoard({ title: title.trim(), description: description.trim() });
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
          <button type="submit" disabled={loading}>
            {loading ? 'Creating…' : 'Create'}
          </button>
        </form>
      </div>
    </aside>
  );
}
