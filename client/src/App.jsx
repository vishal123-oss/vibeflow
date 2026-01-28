import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { BoardProvider } from './context/BoardContext';
import { TaskProvider } from './context/TaskContext';
import { Layout } from './components/Layout';
import { BoardsPage } from './pages/BoardsPage';
import { BoardPage } from './pages/BoardPage';
import { TasksPage } from './pages/TasksPage';

export default function App() {
  return (
    <BrowserRouter>
      <TaskProvider>
        <BoardProvider>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<BoardsPage />} />
              <Route path="tasks" element={<TasksPage />} />
              <Route path="boards/:boardId" element={<BoardPage />} />
            </Route>
          </Routes>
        </BoardProvider>
      </TaskProvider>
    </BrowserRouter>
  );
}
