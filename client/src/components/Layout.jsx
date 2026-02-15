import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BoardSidebar } from './BoardSidebar';
import { Sidebar } from './Sidebar';
import styles from './Layout.module.css';

export function Layout() {
  const location = useLocation();
  // RBAC integration: isSuperAdmin from AuthContext (user.role === 'super_admin' from token/FS DB)
  // Shows permissions nav/UI only for super admin (task req; backend also enforces via authorizeSuperAdmin)
  const { user, logout, isSuperAdmin } = useAuth();
  // For permissions page, treat as boards view (main sidebar)
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
              {/* Super admin only: Users, Roles, Permissions CRUD (visible only to super_admin) */}
              {isSuperAdmin && (
                <>
                  <NavLink
                    to="/users"
                    className={({ isActive }) =>
                      `${styles.navLink} ${isActive ? styles.activeLink : ''}`.trim()
                    }
                  >
                    Users
                  </NavLink>
                  <NavLink
                    to="/roles"
                    className={({ isActive }) =>
                      `${styles.navLink} ${isActive ? styles.activeLink : ''}`.trim()
                    }
                  >
                    Roles
                  </NavLink>
                  <NavLink
                    to="/permissions"
                    className={({ isActive }) =>
                      `${styles.navLink} ${isActive ? styles.activeLink : ''}`.trim()
                    }
                  >
                    Permissions
                  </NavLink>
                </>
              )}
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
