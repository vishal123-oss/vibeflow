import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

const API = '/api/auth';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]); // All users for backend-driven UI (dropdowns etc)
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Axios interceptor for auto refresh on 401
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
  }, []);

  // Load user + all users from backend on mount
  useEffect(() => {
    const loadAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const decoded = JSON.parse(atob(storedToken.split('.')[1]));
          setUser(decoded);
          setToken(storedToken);
          axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
          // Fetch all users for UI
          const { data } = await axios.get(`${API}/users`);
          setUsers(data);
        } catch (err) {
          logout();
        }
      }
      setLoading(false);
    };
    loadAuth();
  }, []);

  const login = async (email, password) => {
    const { data } = await axios.post(`${API}/login`, { email, password });
    const { user: u, accessToken: t } = data;
    localStorage.setItem('token', t);
    setToken(t);
    setUser(u);
    axios.defaults.headers.common['Authorization'] = `Bearer ${t}`;
    // Refresh users list
    const { data: allUsers } = await axios.get(`${API}/users`);
    setUsers(allUsers);
    return u;
  };

  const signup = async (userData) => {
    const { data } = await axios.post(`${API}/signup`, userData);
    const { user: u, accessToken: t } = data;
    localStorage.setItem('token', t);
    setToken(t);
    setUser(u);
    axios.defaults.headers.common['Authorization'] = `Bearer ${t}`;
    // Refresh users list
    const { data: allUsers } = await axios.get(`${API}/users`);
    setUsers(allUsers);
    return u;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('selectedWorkspaceId');
    setToken(null);
    setUser(null);
    setUsers([]);
    delete axios.defaults.headers.common['Authorization'];
    // Call backend logout to clear cookie
    axios.post(`${API}/logout`).catch(() => {});
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, users, token, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
