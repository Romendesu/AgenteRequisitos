import { useState, useCallback, useEffect } from "react";
import * as api from "../services/api";

function loadUser() {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function useAuth() {
  const [user, setUser] = useState(loadUser);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Valida el token contra el backend al iniciar. Si falló (BD reseteada,
  // token expirado, etc.), el interceptor 401 de api.js limpia la sesión.
  useEffect(() => {
    if (!localStorage.getItem("token")) return;
    api.verificarSesion().catch(() => {});
  }, []);

  const handleLogin = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.login(email, password);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setUser(data.user);
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRegister = useCallback(async (email, username, password) => {
    setLoading(true);
    setError(null);
    try {
      await api.register(email, username, password);
      return await handleLogin(email, password);
    } catch (e) {
      setError(e.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [handleLogin]);

  const handleUpdateProfile = useCallback(async (updates) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.updateProfile(updates);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setUser(data.user);
      return { ok: true };
    } catch (e) {
      setError(e.message);
      return { ok: false, error: e.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  }, []);

  return {
    user,
    error,
    loading,
    isAuthenticated: !!user,
    login: handleLogin,
    register: handleRegister,
    updateProfile: handleUpdateProfile,
    logout,
  };
}
