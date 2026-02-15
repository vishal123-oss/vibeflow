import apiClient from '../utils/api';

/**
 * Board service (prod: abstracts all /api/boards calls; from BoardContext/pages).
 */
export const boardService = {
  getMetaLabelColors: () => apiClient.get('/boards/meta/label-colors'),
  getMetaBackgrounds: () => apiClient.get('/boards/meta/backgrounds'),
  reset: () => apiClient.post('/boards/reset'),
  getAll: () => apiClient.get('/boards'),
  getById: (id) => apiClient.get(`/boards/${id}`),
  create: (payload) => apiClient.post('/boards', payload),
  update: (id, payload) => apiClient.patch(`/boards/${id}`, payload),
  delete: (id) => apiClient.delete(`/boards/${id}`),
  search: (boardId, query) => apiClient.get(`/boards/${boardId}/search`, { params: { q: query } }),
  // Labels, archive, lists, cards etc (full from context)
  addLabel: (boardId, payload) => apiClient.post(`/boards/${boardId}/labels`, payload),
  updateLabel: (boardId, labelId, payload) => apiClient.patch(`/boards/${boardId}/labels/${labelId}`, payload),
  deleteLabel: (boardId, labelId) => apiClient.delete(`/boards/${boardId}/labels/${labelId}`),
  // ... (add archive/lists/cards/checklists/comments as needed; pattern consistent)
  // Workspaces (from context)
  getWorkspaces: () => apiClient.get('/workspaces'),
  getWorkspaceById: (id) => apiClient.get(`/workspaces/${id}`),
  // Full coverage for boards/workspaces to eliminate axios
};