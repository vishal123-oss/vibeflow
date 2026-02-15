import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../utils/api';
import { validateForm, validateRequired, validateUniqueId } from '../utils/validators';
import { setStorage, getStorage, removeStorage } from '../utils/storage';

const AuthContext = createContext();

// Action types (prod: constant for reducer; avoids string typos)
const AUTH_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_USER: 'SET_USER',
  SET_USERS: 'SET_USERS',
  SET_PERMISSIONS: 'SET_PERMISSIONS',
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
    case AUTH_ACTIONS.SET_TOKEN:
      return { ...state, token: action.payload };
    case AUTH_ACTIONS.SET_ERROR:
      return { ...state, error: action.payload };
    case AUTH_ACTIONS.REFRESH_USER:
      return { ...state, user: action.payload };
    case AUTH_ACTIONS.LOGOUT:
      return { user: null, users: [], permissions: [], token: null, loading: false, error: null };
    default:
      return state;
  }
}

const initialState = {
  user: null,
  users: [],
  permissions: [],
  token: getStorage('token'),
  loading: true,
  error: null,
};

// Helper (relevant: RBAC token decode only; no excess)
const getUserFromToken = (token) => {
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
};

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const navigate = useNavigate();

  const isSuperAdmin = state.user?.role === 'super_admin';

  // fetchPermissions (RBAC UI only; gated by BE)
  const fetchPermissions = useCallback(async () => {
    try {
      const { data } = await apiClient.get('/auth/permissions');
      dispatch({ type: AUTH_ACTIONS.SET_PERMISSIONS, payload: data });
      return data;
    } catch (err) {
      console.error('Permissions fetch failed');
      return [];
    }
  }, []);

  // CRUD actions (super_admin only; uses apiClient)
  const createPermission = useCallback(async (permData) => {
    const { data } = await apiClient.post('/auth/permissions', permData);
    dispatch({ type: AUTH_ACTIONS.SET_PERMISSIONS, payload: [...state.permissions, data] });
    return data;
  }, [state.permissions]);

  const updatePermission = useCallback(async (permId, updates) => {
    const { data } = await apiClient.patch(`/auth/permissions/${permId}`, updates);
    dispatch({ type: AUTH_ACTIONS.SET_PERMISSIONS, payload: state.permissions.map(p => p.id === permId ? { ...p, ...data } : p) });
    return data;
  }, [state.permissions]);

  const deletePermission = useCallback(async (permId) => {
    await apiClient.delete(`/auth/permissions/${permId}`);
    dispatch({ type: AUTH_ACTIONS.SET_PERMISSIONS, payload: state.permissions.filter(p => p.id !== permId) });
  }, [state.permissions]);

  // login action (with validation + RBAC merge)
  const login = useCallback(async (email, password) => {
    // Validate
    const errors = validateForm({ email, password }, { email: { required: true, label: 'Email' }, password: { required: true, label: 'Password' } });
    if (Object.keys(errors).length > 0) throw new Error('Validation failed');
    const { data } = await apiClient.post('/auth/login', { email, password });
    const { user: u, accessToken: t } = data;
    setStorage('token', t);
    dispatch({ type: AUTH_ACTIONS.SET_TOKEN, payload: t });
    const rbacUser = getUserFromToken(t);
    dispatch({ type: AUTH_ACTIONS.SET_USER, payload: { ...u, ...rbacUser } });
    const { data: allUsers } = await apiClient.get('/auth/users');
    dispatch({ type: AUTH_ACTIONS.SET_USERS, payload: allUsers });
    await fetchPermissions();
    return { ...u, ...rbacUser };
  }, [fetchPermissions]);

  // signup action (similar flow)
  const signup = useCallback(async (userData) => {
    const errors = validateForm(userData, { email: { required: true }, password: { required: true } });
    if (Object.keys(errors).length > 0) throw new Error('Validation failed');
    const { data } = await apiClient.post('/auth/signup', userData);
    const { user: u, accessToken: t } = data;
    setStorage('token', t);
    dispatch({ type: AUTH_ACTIONS.SET_TOKEN, payload: t });
    const rbacUser = getUserFromToken(t);
    dispatch({ type: AUTH_ACTIONS.SET_USER, payload: { ...u, ...rbacUser } });
    const { data: allUsers } = await apiClient.get('/auth/users');
    dispatch({ type: AUTH_ACTIONS.SET_USERS, payload: allUsers });
    await fetchPermissions();
    return { ...u, ...rbacUser };
  }, [fetchPermissions]);

  // logout action
  const logout = useCallback(() => {
    removeStorage('token');
    removeStorage('selectedWorkspaceId');
    dispatch({ type: AUTH_ACTIONS.LOGOUT });
    delete apiClient.defaults.headers.common.Authorization;
    apiClient.post('/auth/logout').catch(() => {});
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
            const rbacUser = getUserFromToken(newToken);
            if (rbacUser) dispatch({ type: AUTH_ACTIONS.REFRESH_USER, payload: rbacUser });
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
      deletePermission
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
