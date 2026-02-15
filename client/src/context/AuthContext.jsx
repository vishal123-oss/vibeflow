import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

const API = '/api/auth';

// Helper to extract RBAC payload from token (includes role + permissions array from backend FS DB)
const getUserFromToken = (token) => {
  if (!token) return null;
  try {
    const decoded = JSON.parse(atob(token.split('.')[1]));
    return decoded; // {id, email, role, permissions: [...]}
  } catch {
    return null;
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]); // All users for backend-driven UI (dropdowns etc)
  const [permissions, setPermissions] = useState([]); // All permissions for super_admin RBAC UI (from /api/auth/permissions FS DB)
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Computed: only super_admin can manage global RBAC (roles/perms); matches backend authorizeSuperAdmin
  const isSuperAdmin = user?.role === 'super_admin';

  // RBAC helper: fetch full permissions list from backend FS DB (data/permissions/*.json via permStore.getPermissions())
  // Used for super_admin UI; read gated by permissions:read (most roles have it per roles/*.json)
  const fetchPermissions = async () => {
    try {
      const { data } = await axios.get(`${API}/permissions`);
      setPermissions(data);
      return data;
    } catch (err) {
      console.error('Failed to fetch permissions:', err);
      // Non-super may 403? but read allowed for auth users; silent for UI
      return [];
    }
  };

  // CRUD for permissions - only super_admin (enforced by backend: authorizeSuperAdmin() + 'permissions:crud')
  // This integrates FE/BE: ops hit /api/auth/permissions which uses storage/saveRecord on data/permissions/ FS entities
  // Matches task: CRUD UI only for super admin
  const createPermission = async (permData) => {
    // permData: {name, description, category?, ...}; backend auto id if missing (id('perm') in helpers)
    // e.g., {name: 'boards:delete', description: 'Delete boards', category: 'boards'}
    const { data } = await axios.post(`${API}/permissions`, permData);
    setPermissions(prev => [...prev, data]);
    return data;
  };

  const updatePermission = async (permId, updates) => {
    // e.g., updates: {description: 'new desc'}
    const { data } = await axios.patch(`${API}/permissions/${permId}`, updates);
    setPermissions(prev => prev.map(p => p.id === permId ? { ...p, ...data } : p));
    return data;
  };

  const deletePermission = async (permId) => {
    await axios.delete(`${API}/permissions/${permId}`);
    setPermissions(prev => prev.filter(p => p.id !== permId));
  };

  // Updated login: set full user = store + RBAC token payload (ensures .role + .permissions[] always)
  // + refresh perms list; fixes inconsistency (store.user lacks perms, token does)
  // Backend: createAuthTokens embeds from rolesStore.getPermissionsForRole (FS DB)
  const login = async (email, password) => {
    const { data } = await axios.post(`${API}/login`, { email, password });
    const { user: u, accessToken: t } = data;
    localStorage.setItem('token', t);
    setToken(t);
    // Merge for complete user (incl. RBAC perms array)
    const rbacUser = getUserFromToken(t);
    setUser({ ...u, ...rbacUser });
    axios.defaults.headers.common['Authorization'] = `Bearer ${t}`;
    // Refresh lists for UI
    const { data: allUsers } = await axios.get(`${API}/users`);
    setUsers(allUsers);
    await fetchPermissions();
    return { ...u, ...rbacUser };
  };

  const signup = async (userData) => {
    const { data } = await axios.post(`${API}/signup`, userData);
    const { user: u, accessToken: t } = data;
    localStorage.setItem('token', t);
    setToken(t);
    // Merge for RBAC consistency
    const rbacUser = getUserFromToken(t);
    setUser({ ...u, ...rbacUser });
    axios.defaults.headers.common['Authorization'] = `Bearer ${t}`;
    // Refresh lists
    const { data: allUsers } = await axios.get(`${API}/users`);
    setUsers(allUsers);
    await fetchPermissions();
    return { ...u, ...rbacUser };
  };

  // Logout clears all auth/RBAC state
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('selectedWorkspaceId');
    setToken(null);
    setUser(null);
    setUsers([]);
    setPermissions([]); // Clear RBAC data
    delete axios.defaults.headers.common['Authorization'];
    // Call backend logout to clear cookie
    axios.post(`${API}/logout`).catch(() => {});
    navigate('/login');
  };

  // Axios interceptor for auto refresh on 401
  // Note: refresh also updates RBAC payload (role/perms) in new token from backend FS DB
  // Depends on logout for failure case
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            const { data } = await axios.post(`${API}/refresh`);
            const newToken = data.accessToken;
            localStorage.setItem('token', newToken);
            setToken(newToken);
            // Update user with fresh RBAC payload (role + permissions)
            const rbacUser = getUserFromToken(newToken);
            if (rbacUser) setUser(rbacUser);
            axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
            return axios(originalRequest);
          } catch (refreshErr) {
            logout();
            return Promise.reject(refreshErr);
          }
        }
        return Promise.reject(error);
      }
    );
    return () => axios.interceptors.response.eject(interceptor);
  }, []);  // Note: logout/navigate stable; ok for interceptor

  // Load user + all users/permissions from backend on mount
  // Integrates RBAC: user=token payload (role + permissions[] from FS DB); full perms list for super_admin UI
  // permissions:read allowed for auth users per roles DB; CRUD UI gated by isSuperAdmin in components
  // Depends on: logout, fetchPermissions (now declared above)
  useEffect(() => {
    const loadAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          // Always use RBAC payload from token for consistent role/perms
          const rbacUser = getUserFromToken(storedToken);
          setUser(rbacUser);
          setToken(storedToken);
          axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
          // Fetch all users for UI
          const { data: allUsers } = await axios.get(`${API}/users`);
          setUsers(allUsers);
          // Fetch full permissions list (for super_admin CRUD UI)
          // Backend context: permStore.getPermissions() -> getAllRecords('permissions')
          await fetchPermissions();
        } catch (err) {
          logout();
        }
      }
      setLoading(false);
    };
    loadAuth();
  }, []);

  return (
    // Expose RBAC: isSuperAdmin (for UI visibility), permissions (full list), + CRUD fns
    // Aligns with backend: super_admin only for perms CRUD; token perms[] for guards
    <AuthContext.Provider value={{ 
      user, 
      users, 
      permissions, 
      token, 
      loading, 
      isSuperAdmin,
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
