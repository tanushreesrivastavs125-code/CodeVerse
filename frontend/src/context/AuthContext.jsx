import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, ApiClientError } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Refreshes the currently authenticated player session from the server.
   */
  const refreshProfile = useCallback(async () => {
    try {
      const profile = await api.auth.getProfile();
      setUser(profile);
      setError(null);
      return profile;
    } catch (err) {
      setUser(null);
      if (err instanceof ApiClientError && err.status === 401) {
        // Expected unauthenticated state
        setError(null);
      } else {
        setError(err.message || 'Failed to authenticate player session.');
      }
      return null;
    }
  }, []);

  // Restore session on initial application load
  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      try {
        const profile = await api.auth.getProfile();
        if (isMounted) {
          setUser(profile);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setUser(null);
          if (err instanceof ApiClientError && err.status === 401) {
            setError(null);
          } else {
            setError(err.message || 'Service unavailable');
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (credentials) => {
    setError(null);
    const data = await api.auth.login(credentials);
    setUser(data.user);
    return data;
  };

  const signup = async (formData) => {
    setError(null);
    const data = await api.auth.register(formData);
    setUser(data.user);
    return data;
  };

  const guestPlay = async () => {
    setError(null);
    const data = await api.auth.guest();
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } catch {
      // Ignore logout transport errors to ensure client session state is always cleared
    } finally {
      setUser(null);
      setError(null);
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    signup,
    guestPlay,
    logout,
    refreshProfile,
    isAuthenticated: Boolean(user)
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
