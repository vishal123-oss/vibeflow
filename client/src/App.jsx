import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { BoardProvider } from './context/BoardContext';
import { TaskProvider } from './context/TaskContext';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/Layout';
import { BoardsPage } from './pages/BoardsPage';
import { BoardPage } from './pages/BoardPage';
import { TasksPage } from './pages/TasksPage';
import LoginPage from './pages/LoginPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TaskProvider>
          <BoardProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={<Layout />}>
                <Route index element={<BoardsPage />} />
                <Route path="tasks" element={<TasksPage />} />
                <Route path="boards/:boardId" element={<BoardPage />} />
              </Route>
            </Routes>
          </BoardProvider>
        </TaskProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
