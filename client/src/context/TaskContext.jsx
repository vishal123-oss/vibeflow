import { createContext, useCallback, useContext, useReducer } from 'react';
import { taskService } from '../services/taskService';

const TaskContext = createContext(null);

const initialState = {
  tasks: [],
  loading: false,
  error: null,
};

function taskReducer(state, action) {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, loading: true, error: null };
    case 'FETCH_SUCCESS':
      return { ...state, tasks: action.payload, loading: false, error: null };
    case 'FETCH_ERROR':
      return { ...state, loading: false, error: action.payload };
    case 'OPTIMISTIC_ADD':
      return { ...state, tasks: [...state.tasks, action.payload] };
    case 'OPTIMISTIC_UPDATE':
      return {
        ...state,
        tasks: state.tasks.map((t) => (t.id === action.payload.id ? action.payload : t)),
      };
    case 'OPTIMISTIC_REMOVE':
      return { ...state, tasks: state.tasks.filter((t) => t.id !== action.payload) };
    case 'REVERT_REMOVE':
      return { ...state, tasks: [...state.tasks, action.payload].sort((a, b) => (a.id > b.id ? 1 : -1)) };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

export function TaskProvider({ children }) {
  const [state, dispatch] = useReducer(taskReducer, initialState);

  const fetchTasks = useCallback(async () => {
    dispatch({ type: 'FETCH_START' });
    try {
      const { data } = await taskService.getAll();
      dispatch({ type: 'FETCH_SUCCESS', payload: data });
      return data;
    } catch (err) {
      const message = err.response?.data?.message ?? err.message ?? 'Failed to fetch tasks';
      dispatch({ type: 'FETCH_ERROR', payload: message });
      throw err;
    }
  }, []);

  const addTask = useCallback(async (task) => {
    dispatch({ type: 'FETCH_START' });
    try {
      const { data } = await taskService.create(task);
      dispatch({ type: 'OPTIMISTIC_ADD', payload: data });
      return data;
    } catch (err) {
      const message = err.response?.data?.message ?? err.message ?? 'Failed to add task';
      dispatch({ type: 'FETCH_ERROR', payload: message });
      throw err;
    }
  }, []);

  const updateTask = useCallback(async (id, patch) => {
    const prev = state.tasks.find((t) => t.id === id);
    if (!prev) return;
    dispatch({
      type: 'OPTIMISTIC_UPDATE',
      payload: {
        ...prev,
        content: { ...prev.content, ...patch.content },
        meta: { ...prev.meta, ...patch.meta },
        history: [...(prev.history ?? []), { action: 'updated', timestamp: new Date().toISOString() }],
      },
    });
    try {
      const { data } = await taskService.update(id, patch);
      dispatch({ type: 'OPTIMISTIC_UPDATE', payload: data });
      return data;
    } catch (err) {
      dispatch({ type: 'OPTIMISTIC_UPDATE', payload: prev });
      const message = err.response?.data?.message ?? err.message ?? 'Failed to update task';
      dispatch({ type: 'SET_ERROR', payload: message });
      throw err;
    }
  }, [state.tasks]);

  const deleteTask = useCallback(async (id) => {
    const removed = state.tasks.find((t) => t.id === id);
    if (!removed) return;
    dispatch({ type: 'OPTIMISTIC_REMOVE', payload: id });
    try {
      await taskService.delete(id);
    } catch (err) {
      dispatch({ type: 'REVERT_REMOVE', payload: removed });
      const message = err.response?.data?.message ?? err.message ?? 'Delete failed — task restored';
      dispatch({ type: 'SET_ERROR', payload: message });
      throw err;
    }
  }, [state.tasks]);

  const resetTasks = useCallback(async () => {
    dispatch({ type: 'FETCH_START' });
    try {
      const { data } = await taskService.reset();
      dispatch({ type: 'FETCH_SUCCESS', payload: data });
      return data;
    } catch (err) {
      const message = err.response?.data?.message ?? err.message ?? 'Failed to reset tasks';
      dispatch({ type: 'FETCH_ERROR', payload: message });
      throw err;
    }
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null });
  }, []);

  const value = {
    tasks: state.tasks,
    loading: state.loading,
    error: state.error,
    fetchTasks,
    addTask,
    updateTask,
    deleteTask,
    resetTasks,
    clearError,
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
}

export function useTasks() {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error('useTasks must be used within TaskProvider');
  return ctx;
}
