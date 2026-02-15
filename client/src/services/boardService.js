import apiClient from '../utils/api';

/**
 * Board service (prod: abstracts all /api/boards calls; from BoardContext/pages).
 */
export const boardService = {
  // Meta
  getMetaLabelColors: () => apiClient.get('/boards/meta/label-colors'),
  getMetaBackgrounds: () => apiClient.get('/boards/meta/backgrounds'),
  // Core boards
  reset: () => apiClient.post('/boards/reset'),
  getAll: () => apiClient.get('/boards'),
  getById: (id) => apiClient.get(`/boards/${id}`),
  create: (payload) => apiClient.post('/boards', payload),
  update: (id, payload) => apiClient.patch(`/boards/${id}`, payload),
  delete: (id) => apiClient.delete(`/boards/${id}`),
  search: (boardId, query) => apiClient.get(`/boards/${boardId}/search`, { params: { q: query } }),
  // Labels
  addLabel: (boardId, payload) => apiClient.post(`/boards/${boardId}/labels`, payload),
  updateLabel: (boardId, labelId, payload) => apiClient.patch(`/boards/${boardId}/labels/${labelId}`, payload),
  deleteLabel: (boardId, labelId) => apiClient.delete(`/boards/${boardId}/labels/${labelId}`),
  // Archive
  getArchivedCards: (boardId) => apiClient.get(`/boards/${boardId}/archive/cards`),
  getArchivedLists: (boardId) => apiClient.get(`/boards/${boardId}/archive/lists`),
  restoreArchivedCard: (boardId, cardId) => apiClient.post(`/boards/${boardId}/archive/cards/${cardId}/restore`),
  restoreArchivedList: (boardId, listId) => apiClient.post(`/boards/${boardId}/archive/lists/${listId}/restore`),
  // Lists
  addList: (boardId, payload) => apiClient.post(`/boards/${boardId}/lists`, payload),
  updateList: (boardId, listId, payload) => apiClient.patch(`/boards/${boardId}/lists/${listId}`, payload),
  deleteList: (boardId, listId) => apiClient.delete(`/boards/${boardId}/lists/${listId}`),
  reorderLists: (boardId, listIds) => apiClient.post(`/boards/${boardId}/lists/reorder`, { listIds }),
  // Cards
  addCard: (boardId, listId, payload) => apiClient.post(`/boards/${boardId}/lists/${listId}/cards`, payload),
  updateCard: (boardId, cardId, payload) => apiClient.patch(`/boards/${boardId}/cards/${cardId}`, payload),
  deleteCard: (boardId, cardId) => apiClient.delete(`/boards/${boardId}/cards/${cardId}`),
  moveCard: (boardId, cardId, targetListId, position) => apiClient.post(`/boards/${boardId}/cards/${cardId}/move`, { targetListId, position }),
  reorderCards: (boardId, listId, cardIds) => apiClient.post(`/boards/${boardId}/lists/${listId}/cards/reorder`, { cardIds }),
  // Checklists , comments
  addChecklist: (boardId, cardId, payload) => apiClient.post(`/boards/${boardId}/cards/${cardId}/checklists`, payload),
  updateChecklist: (boardId, cardId, checklistId, payload) => apiClient.patch(`/boards/${boardId}/cards/${cardId}/checklists/${checklistId}`, payload),
  deleteChecklist: (boardId, cardId, checklistId) => apiClient.delete(`/boards/${boardId}/cards/${cardId}/checklists/${checklistId}`),
  addComment: (boardId, cardId, payload) => apiClient.post(`/boards/${boardId}/cards/${cardId}/comments`, payload),
  updateComment: (boardId, cardId, commentId, payload) => apiClient.patch(`/boards/${boardId}/cards/${cardId}/comments/${commentId}`, payload),
  deleteComment: (boardId, cardId, commentId) => apiClient.delete(`/boards/${boardId}/cards/${cardId}/comments/${commentId}`),
  // Workspaces (integrated)
  getWorkspaces: () => apiClient.get('/workspaces'),
  getWorkspaceById: (id) => apiClient.get(`/workspaces/${id}`),
  // Full coverage for boards/workspaces to eliminate axios
};