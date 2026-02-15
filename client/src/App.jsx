import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { BoardProvider } from './context/BoardContext';
import { TaskProvider } from './context/TaskContext';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/Layout';
import { BoardsPage } from './pages/BoardsPage';
import { BoardPage } from './pages/BoardPage';
import { TasksPage } from './pages/TasksPage';
import { WorkspaceSelectPage } from './pages/WorkspaceSelectPage';
import LoginPage from './pages/LoginPage';
import { PermissionsPage } from './pages/PermissionsPage'; // Super admin only RBAC UI for permissions CRUD
import { UsersPage } from './pages/UsersPage';
import { RolesPage } from './pages/RolesPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TaskProvider>
          <BoardProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/workspaces" element={<WorkspaceSelectPage />} />
              <Route path="/" element={<Layout />}>
                <Route index element={<BoardsPage />} />
                <Route path="tasks" element={<TasksPage />} />
                <Route path="boards/:boardId" element={<BoardPage />} />
                {/* Super admin only: Users, Roles, Permissions CRUD */}
                <Route path="users" element={<UsersPage />} />
                <Route path="roles" element={<RolesPage />} />
                <Route path="permissions" element={<PermissionsPage />} />
              </Route>
            </Routes>
          </BoardProvider>
        </TaskProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
