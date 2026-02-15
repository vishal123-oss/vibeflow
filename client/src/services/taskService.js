import apiClient from '../utils/api';

/**
 * Task service (prod: abstracts /api/tasks calls; reuse in TaskContext/pages).
 */
export const taskService = {
  reset: () => apiClient.post('/tasks/reset'),
  getAll: () => apiClient.get('/tasks'),
  getById: (id) => apiClient.get(`/tasks/${id}`),
  create: (task) => apiClient.post('/tasks', task),
  update: (id, patch) => apiClient.patch(`/tasks/${id}`, patch),
  delete: (id) => apiClient.delete(`/tasks/${id}`),
};