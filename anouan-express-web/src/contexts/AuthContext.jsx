// src/contexts/AuthContext.jsx
// Contexte d'authentification global — gestion JWT, rôles, user et secours fluide

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI, usersAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ─── Initialisation : restaurer la session via le cookie HttpOnly ──
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data } = await usersAPI.getMe();
        const u = data.data || data;
        setUser(u);
      } catch {
        _clearSession();
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  // ─── Connexion email/mot de passe ─────────────────────────
  const login = useCallback(async ({ email, password }) => {
    const { data: envelope } = await authAPI.loginPassword({ email, password });
    const payload = envelope?.data || envelope;
    if (!payload?.user) throw new Error('Réponse de connexion invalide.');
    return _persistSession(payload);
  }, []);

  // ─── Connexion OTP (téléphone) ────────────────────────────
  const loginOTP = useCallback(async ({ phone, otp }) => {
    try {
      const { data: envelope } = await authAPI.verifyOTP({ phone, otp });
      const payload = envelope?.data || envelope;
      return _persistSession(payload);
    } catch (err) {
      throw err;
    }
  }, []);

  // ─── Inscription ─────────────────────────────────────────
  const register = useCallback(async (userData) => {
    try {
      const { data: envelope } = await authAPI.register(userData);
      const payload = envelope?.data || envelope;
      return _persistSession(payload);
    } catch (err) {
      throw err;
    }
  }, []);

  // ─── Déconnexion ─────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch {
      // Ignorer les erreurs réseau lors du logout
    }
    _clearSession();
  }, []);

  // ─── Mise à jour du profil ────────────────────────────────
  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  }, []);

  // ─── Helpers privés ──────────────────────────────────────
  const _persistSession = (payload) => {
    const { user: u } = payload || {};
    if (u) localStorage.setItem('user', JSON.stringify(u));
    if (u) setUser(u);
    return { user: u };
  };

  const _clearSession = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  // ─── Helpers de rôle ─────────────────────────────────────
  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';
  const isVendor = user?.role === 'vendor';
  const isAgent = user?.role === 'agent';
  const isClient = user?.role === 'client';

  const value = {
    user,
    loading,
    isAuthenticated,
    isAdmin,
    isVendor,
    isAgent,
    isClient,
    login,
    loginOTP,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé au sein d\'un AuthProvider');
  }
  return context;
}
