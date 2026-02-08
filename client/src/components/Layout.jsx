import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BoardSidebar } from './BoardSidebar';
import { Sidebar } from './Sidebar';
import styles from './Layout.module.css';

export function Layout() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const isTasksView = location.pathname.startsWith('/tasks');
  const SidebarComponent = isTasksView ? Sidebar : BoardSidebar;

  return (
    <div className={styles.layout}>
      <SidebarComponent />
      <main className={styles.main}>
        <header className={styles.header}>
          <div className={styles.headerRow}>
            <h1 className={styles.logo}>VibeFlow</h1>
            <nav className={styles.nav}>
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `${styles.navLink} ${isActive ? styles.activeLink : ''}`.trim()
                }
              >
                Boards
              </NavLink>
              <NavLink
                to="/tasks"
                className={({ isActive }) =>
                  `${styles.navLink} ${isActive ? styles.activeLink : ''}`.trim()
                }
              >
                Tasks
              </NavLink>
            </nav>
            {user && (
              <div className={styles.userSection}>
                <span>{user.email}</span>
                <button onClick={logout} className={styles.logoutBtn}>Logout</button>
              </div>
            )}
          </div>
        </header>
        <Outlet />
      </main>
    </div>
  );
}
