// src/hooks/useRecentlyViewed.js
// Hook de gestion de l'historique des produits consultés récemment (UI uniquement)

import { useState, useEffect, useCallback } from 'react';

const RECENT_KEY = 'anouan_recent_products';
const MAX_RECENT = 10;

export function useRecentlyViewed() {
  const [recentProducts, setRecentProducts] = useState([]);

  // Charger depuis le cache local au montage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_KEY);
      if (stored) {
        setRecentProducts(JSON.parse(stored));
      }
    } catch {
      setRecentProducts([]);
    }
  }, []);

  // Ajouter un produit à l'historique
  const addRecentlyViewed = useCallback((product) => {
    if (!product || !product.id) return;

    setRecentProducts((prev) => {
      // Éviter les doublons et placer le produit en première position
      const filtered = prev.filter((p) => String(p.id) !== String(product.id));
      const entry = {
        id: product.id,
        name: product.name || product.title || 'Produit Anouan',
        price: Number(product.price || 0),
        image: product.image || product.image_url || product.main_image || product.images?.[0] || null,
        vendor_name: product.vendor_name || product.store_name || null,
        category_name: product.category_name || null,
        viewedAt: Date.now(),
      };
      const updated = [entry, ...filtered].slice(0, MAX_RECENT);
      try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  // Vider l'historique
  const clearRecentlyViewed = useCallback(() => {
    try {
      localStorage.removeItem(RECENT_KEY);
    } catch {}
    setRecentProducts([]);
  }, []);

  return { recentProducts, addRecentlyViewed, clearRecentlyViewed };
}
