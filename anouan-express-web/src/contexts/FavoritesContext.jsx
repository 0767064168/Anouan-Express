// src/contexts/FavoritesContext.jsx
// Contexte global des favoris — persistance localStorage

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Persister dans localStorage à chaque changement
  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = useCallback((product) => {
    setFavorites((prev) => {
      const exists = prev.some((f) => f.id === product.id);
      return exists ? prev.filter((f) => f.id !== product.id) : [...prev, product];
    });
  }, []);

  const isFavorite = useCallback(
    (productId) => favorites.some((f) => f.id === productId),
    [favorites]
  );

  const removeFavorite = useCallback((productId) => {
    setFavorites((prev) => prev.filter((f) => f.id !== productId));
  }, []);

  const clearFavorites = useCallback(() => setFavorites([]), []);

  return (
    <FavoritesContext.Provider value={{
      favorites,
      toggleFavorite,
      isFavorite,
      removeFavorite,
      clearFavorites,
      count: favorites.length,
    }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites doit être utilisé dans un FavoritesProvider');
  return ctx;
}
