import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export const useAuth = () => {
  const [token, setTokenState] = useState(() => localStorage.getItem('rlm_token') || '');
  const [isAuthenticated, setIsAuthenticated] = useState(!!token);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (inputToken) => {
    setIsLoading(true);
    setError(null);
    try {
      api.setToken(inputToken);
      await api.getStatus(); // Verify token
      setTokenState(inputToken);
      setIsAuthenticated(true);
      return true;
    } catch (err) {
      api.setToken('');
      setIsAuthenticated(false);
      setError('Token inválido o servidor no disponible');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    api.setToken('');
    setTokenState('');
    setIsAuthenticated(false);
    setError(null);
  }, []);

  return {
    token,
    isAuthenticated,
    error,
    isLoading,
    login,
    logout,
  };
};

export const useStatus = () => {
  const [status, setStatus] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await api.getStatus();
      setStatus(data);
      setIsConnected(true);
    } catch (err) {
      setIsConnected(false);
      console.error('Error fetching status:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 5000);
    return () => clearInterval(timer);
  }, [refresh]);

  return { status, isConnected, isLoading, refresh };
};

export const useGroups = () => {
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await api.getGroups();
      setGroups(data.groups || []);
    } catch (err) {
      console.error('Error fetching groups:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { groups, isLoading, refresh };
};

export const useHistory = (limit = 50) => {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await api.getHistory(limit);
      setHistory(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { history, isLoading, refresh };
};

export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const add = useCallback((message, type = 'info', duration = 4000) => {
    const id = Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }

    return id;
  }, []);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, add, remove };
};
