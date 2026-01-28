import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTasks } from '../context/TaskContext';

/**
 * Filters tasks based on URL search params.
 * ?priority=high | medium | low
 * ?assignee=User1
 * ?label=backend (multiple ?label= supported)
 */
export function useFilteredTasks() {
  const { tasks, loading, error, fetchTasks, addTask, updateTask, deleteTask, clearError } = useTasks();
  const [searchParams] = useSearchParams();

  const priority = searchParams.get('priority');
  const assignee = searchParams.get('assignee');
  const labels = searchParams.getAll('label');

  const filtered = useMemo(() => {
    let list = [...tasks];
    if (priority) {
      list = list.filter((t) => (t.meta?.priority ?? 'medium') === priority);
    }
    if (assignee) {
      list = list.filter((t) => (t.meta?.assignee ?? '') === assignee);
    }
    if (labels.length) {
      list = list.filter((t) => {
        const taskLabels = t.meta?.labels ?? [];
        return labels.every((l) => taskLabels.includes(l));
      });
    }
    return list;
  }, [tasks, priority, assignee, labels]);

  return {
    tasks: filtered,
    loading,
    error,
    fetchTasks,
    addTask,
    updateTask,
    deleteTask,
    clearError,
    filters: { priority, assignee, labels },
  };
}
