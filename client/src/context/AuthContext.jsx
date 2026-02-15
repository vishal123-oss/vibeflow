import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import apiClient from '../utils/api'; // For interceptor/defaults (service wraps; no cycle issue)
import { validateForm, validateRequired, validateUniqueId } from '../utils/validators';
import { setStorage, getStorage, removeStorage } from '../utils/storage';

const AuthContext = createContext();

// Action types (prod: constant for reducer; avoids string typos)
const AUTH_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_USER: 'SET_USER',
  SET_USERS: 'SET_USERS',
  SET_PERMISSIONS: 'SET_PERMISSIONS',
  SET_ROLES: 'SET_ROLES',
  SET_TOKEN: 'SET_TOKEN',
  SET_ERROR: 'SET_ERROR',
  LOGOUT: 'LOGOUT',
  REFRESH_USER: 'REFRESH_USER',
};

// Reducer for state management (prod: predictable, scalable flow; replaces scattered setState)
function authReducer(state, action) {
  switch (action.type) {
    case AUTH_ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };
    case AUTH_ACTIONS.SET_USER:
      return { ...state, user: action.payload };
    case AUTH_ACTIONS.SET_USERS:
      return { ...state, users: action.payload };
    case AUTH_ACTIONS.SET_PERMISSIONS:
      return { ...state, permissions: action.payload };
    case AUTH_ACTIONS.SET_ROLES:
      return { ...state, roles: action.payload };
    case AUTH_ACTIONS.SET_TOKEN:
      return { ...state, token: action.payload };
    case AUTH_ACTIONS.SET_ERROR:
      return { ...state, error: action.payload };
    case AUTH_ACTIONS.REFRESH_USER:
      return { ...state, user: action.payload };
    case AUTH_ACTIONS.LOGOUT:
      return { user: null, users: [], permissions: [], roles: [], token: null, loading: false, error: null };
    default:
      return state;
  }
}

// Decode JWT payload (no verify; client-side role/email only for UI)
function decodeTokenPayload(token) {
  if (!token) return null;
  try {
    const raw = typeof token === 'string' ? token : (token && token.accessToken);
    const str = typeof raw === 'string' ? raw : '';
    const payload = str.split('.')[1];
    return payload ? JSON.parse(atob(payload)) : null;
  } catch {
    return null;
  }
}

const AUTH_STORAGE_KEY_USER = 'user';

// Restore user from storage (only cleared on logout); fallback to decoding token
function getInitialState() {
  const token = getStorage('token');
  // Prefer persisted user so refresh keeps state.user (remove only on logout)
  let user = getStorage(AUTH_STORAGE_KEY_USER);
  if (!user || !(user.id || user.email || user.role)) {
    user = decodeTokenPayload(token);
    user = user && (user.id || user.email || user.role) ? user : null;
  }
  return {
    user,
    users: [],
    permissions: [],
    roles: [],
    token,
    loading: false, // never start as true so authLoading is not stuck
    error: null,
  };
}

export function AuthProvider({ children }) {
  // Lazy init so initial state is computed when reducer mounts (correct storage read)
  const [state, dispatch] = useReducer(authReducer, undefined, getInitialState);
  const navigate = useNavigate();

  // Super admin: by role from token, or by known super admin email (fallback if role missing in payload)
  const isSuperAdmin =
    state.user?.role === 'super_admin' ||
    (state.user?.email && state.user.email.toLowerCase() === 'superadmin@vibeflow.com');

  // fetchPermissions (RBAC UI only; gated by BE)
  const fetchPermissions = useCallback(async () => {
    try {
      const { data } = await authService.getPermissions();
      dispatch({ type: AUTH_ACTIONS.SET_PERMISSIONS, payload: data });
      return data;
    } catch (err) {
      console.error('Permissions fetch failed');
      return [];
    }
  }, []);

  // CRUD actions (super_admin only; uses service layer)
  const createPermission = useCallback(async (permData) => {
    const { data } = await authService.createPermission(permData);
    dispatch({ type: AUTH_ACTIONS.SET_PERMISSIONS, payload: [...state.permissions, data] });
    return data;
  }, [state.permissions]);

  const updatePermission = useCallback(async (permId, updates) => {
    const { data } = await authService.updatePermission(permId, updates);
    dispatch({ type: AUTH_ACTIONS.SET_PERMISSIONS, payload: state.permissions.map(p => p.id === permId ? { ...p, ...data } : p) });
    return data;
  }, [state.permissions]);

  const deletePermission = useCallback(async (permId) => {
    await authService.deletePermission(permId);
    dispatch({ type: AUTH_ACTIONS.SET_PERMISSIONS, payload: state.permissions.filter(p => p.id !== permId) });
  }, [state.permissions]);

  // fetchUsers (refresh list after CRUD)
  const fetchUsers = useCallback(async () => {
    try {
      const { data } = await authService.getUsers();
      dispatch({ type: AUTH_ACTIONS.SET_USERS, payload: data });
      return data;
    } catch (err) {
      console.error('Users fetch failed');
      return [];
    }
  }, []);

  const createUser = useCallback(async (userData) => {
    const { data } = await authService.createUser(userData);
    await fetchUsers();
    return data;
  }, [fetchUsers]);

  const updateUser = useCallback(async (userId, updates) => {
    const { data } = await authService.updateUser(userId, updates);
    await fetchUsers();
    return data;
  }, [fetchUsers]);

  const deleteUser = useCallback(async (userId) => {
    await authService.deleteUser(userId);
    await fetchUsers();
  }, [fetchUsers]);

  // Roles (super_admin only)
  const fetchRoles = useCallback(async () => {
    try {
      const { data } = await authService.getRoles();
      dispatch({ type: AUTH_ACTIONS.SET_ROLES, payload: data });
      return data;
    } catch (err) {
      console.error('Roles fetch failed');
      return [];
    }
  }, []);

  const createRole = useCallback(async (roleData) => {
    const { data } = await authService.createRole(roleData);
    dispatch({ type: AUTH_ACTIONS.SET_ROLES, payload: [...(state.roles || []), data] });
    return data;
  }, [state.roles]);

  const updateRole = useCallback(async (roleId, updates) => {
    const { data } = await authService.updateRole(roleId, updates);
    dispatch({ type: AUTH_ACTIONS.SET_ROLES, payload: (state.roles || []).map(r => r.id === roleId ? { ...r, ...data } : r) });
    return data;
  }, [state.roles]);

  const deleteRole = useCallback(async (roleId) => {
    await authService.deleteRole(roleId);
    dispatch({ type: AUTH_ACTIONS.SET_ROLES, payload: (state.roles || []).filter(r => r.id !== roleId) });
  }, [state.roles]);

  // On mount: re-sync user from storage/token and ensure loading is false
  useEffect(() => {
    const token = getStorage('token');
    const storedUser = getStorage(AUTH_STORAGE_KEY_USER);
    if (storedUser && (storedUser.id || storedUser.email || storedUser.role)) {
      dispatch({ type: AUTH_ACTIONS.SET_USER, payload: storedUser });
    } else if (token) {
      const payload = decodeTokenPayload(token);
      if (payload && (payload.id || payload.email || payload.role)) {
        dispatch({ type: AUTH_ACTIONS.SET_USER, payload });
        setStorage(AUTH_STORAGE_KEY_USER, payload);
      }
    }
    if (apiClient.defaults?.headers?.common && token) {
      const t = typeof token === 'string' ? token : (token?.accessToken ?? token);
      if (t) apiClient.defaults.headers.common.Authorization = `Bearer ${t}`;
    }
    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
  }, []);

  // login action (with validation + RBAC merge)
  const login = useCallback(async (email, password) => {
    const errors = validateForm({ email, password }, { email: { required: true, label: 'Email' }, password: { required: true, label: 'Password' } });
    if (Object.keys(errors).length > 0) throw new Error('Validation failed');
    const { data } = await authService.login({ email, password });
    const { user: u, accessToken: t } = data;
    setStorage('token', t);
    dispatch({ type: AUTH_ACTIONS.SET_TOKEN, payload: t });
    const rbacUser = decodeTokenPayload(t);
    const mergedUser = { ...u, ...rbacUser };
    dispatch({ type: AUTH_ACTIONS.SET_USER, payload: mergedUser });
    setStorage(AUTH_STORAGE_KEY_USER, mergedUser);
    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
    const { data: allUsers } = await authService.getUsers();
    dispatch({ type: AUTH_ACTIONS.SET_USERS, payload: allUsers });
    await fetchPermissions();
    await fetchRoles();
    return mergedUser;
  }, [fetchPermissions, fetchRoles]);

  // signup action (similar flow)
  const signup = useCallback(async (userData) => {
    const errors = validateForm(userData, { email: { required: true }, password: { required: true } });
    if (Object.keys(errors).length > 0) throw new Error('Validation failed');
    const { data } = await authService.signup(userData);
    const { user: u, accessToken: t } = data;
    setStorage('token', t);
    dispatch({ type: AUTH_ACTIONS.SET_TOKEN, payload: t });
    const rbacUser = decodeTokenPayload(t);
    const mergedUser = { ...u, ...rbacUser };
    dispatch({ type: AUTH_ACTIONS.SET_USER, payload: mergedUser });
    setStorage(AUTH_STORAGE_KEY_USER, mergedUser);
    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
    const { data: allUsers } = await authService.getUsers();
    dispatch({ type: AUTH_ACTIONS.SET_USERS, payload: allUsers });
    await fetchPermissions();
    await fetchRoles();
    return mergedUser;
  }, [fetchPermissions, fetchRoles]);

  // logout action – only place we clear auth storage (token + user)
  const logout = useCallback(() => {
    removeStorage('token');
    removeStorage(AUTH_STORAGE_KEY_USER);
    removeStorage('selectedWorkspaceId');
    dispatch({ type: AUTH_ACTIONS.LOGOUT });
    delete apiClient.defaults.headers.common.Authorization;
    authService.logout().catch(() => {});
    navigate('/login');
  }, [navigate]);

  // Refresh effect (uses dispatch)
  useEffect(() => {
    const interceptor = apiClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            const { data } = await apiClient.post('/auth/refresh');
            const newToken = data.accessToken;
            setStorage('token', newToken);
            dispatch({ type: AUTH_ACTIONS.SET_TOKEN, payload: newToken });
            const rbacUser = decodeTokenPayload(newToken);
            if (rbacUser) {
              dispatch({ type: AUTH_ACTIONS.REFRESH_USER, payload: rbacUser });
              setStorage(AUTH_STORAGE_KEY_USER, rbacUser);
            }
            apiClient.defaults.headers.common.Authorization = `Bearer ${newToken}`;
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return apiClient(originalRequest);
          } catch (refreshErr) {
            logout();
            return Promise.reject(refreshErr);
          }
        }
        return Promise.reject(error);
      }
    );
    return () => apiClient.interceptors.response.eject(interceptor);
  }, [logout]);

  return (
    <AuthContext.Provider value={{ 
      // State
      user: state.user,
      users: state.users,
      permissions: state.permissions,
      roles: state.roles || [],
      token: state.token,
      loading: state.loading,
      error: state.error,
      // Computed
      isSuperAdmin,
      // Actions (dispatcher flow)
      login, 
      signup, 
      logout,
      fetchPermissions,
      createPermission,
      updatePermission,
      deletePermission,
      fetchUsers,
      createUser,
      updateUser,
      deleteUser,
      fetchRoles,
      createRole,
      updateRole,
      deleteRole
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
