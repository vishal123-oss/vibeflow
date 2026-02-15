import apiClient from '../utils/api';

/**
 * Auth service layer (prod: abstracts API calls; separates concerns, easy mock/test).
 * Uses apiClient; methods for login/signup/permissions/RBAC.
 * Called from contexts.
 */
export const authService = {
  login: (credentials) => apiClient.post('/auth/login', credentials),
  signup: (userData) => apiClient.post('/auth/signup', userData),
  refresh: () => apiClient.post('/auth/refresh'),
  logout: () => apiClient.post('/auth/logout'),
  getUsers: () => apiClient.get('/auth/users'),
  getRoles: () => apiClient.get('/auth/roles'),
  // Permissions CRUD (for super_admin UI)
  getPermissions: () => apiClient.get('/auth/permissions'),
  createPermission: (perm) => apiClient.post('/auth/permissions', perm),
  updatePermission: (id, updates) => apiClient.patch(`/auth/permissions/${id}`, updates),
  deletePermission: (id) => apiClient.delete(`/auth/permissions/${id}`),
  // Users CRUD + roles (for super_admin UI)
  getUsers: () => apiClient.get('/auth/users'),
  createUser: (user) => apiClient.post('/auth/users', user), // Note: signup also , but for admin
  updateUser: (id, updates) => apiClient.patch(`/auth/users/${id}`, updates), // if BE supports , else via store
  deleteUser: (id) => apiClient.delete(`/auth/users/${id}`),
  // Roles CRUD (super_admin)
  getRoles: () => apiClient.get('/auth/roles'),
  createRole: (role) => apiClient.post('/auth/roles', role),
  updateRole: (id, updates) => apiClient.patch(`/auth/roles/${id}`, updates),
  deleteRole: (id) => apiClient.delete(`/auth/roles/${id}`),
};