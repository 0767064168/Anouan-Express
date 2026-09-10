// src/contexts/CartContext.jsx
// Gestion du panier — persisté dans localStorage

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const CartContext = createContext(null);

const CART_KEY = 'anouan_cart';

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem(CART_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isOpen, setIsOpen] = useState(false);

  // Persister à chaque changement
  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items]);

  // ─── Ajouter un article ───────────────────────────────────
  const addItem = useCallback((product, quantity = 1, variant = null) => {
    setItems((prev) => {
      const key = variant ? `${product.id}_${variant.id}` : `${product.id}`;
      const existing = prev.find((i) => i.key === key);

      if (existing) {
        return prev.map((i) =>
          i.key === key
            ? { ...i, quantity: Math.min(i.quantity + quantity, product.stock || 999) }
            : i
        );
      }

      return [
        ...prev,
        {
          key,
          productId: product.id,
          variantId: variant?.id || null,
          name: product.name || product.title,
          price: variant?.price || product.flash_sale_price || product.price,
          image: product.images?.[0] || product.image_url || null,
          stock: product.stock,
          quantity,
          variant: variant?.name || null,
          vendorId: product.vendor_id,
          storeId: null, // Défini lors du checkout
        },
      ];
    });
    setIsOpen(true);
  }, []);

  // ─── Modifier la quantité ─────────────────────────────────
  const updateQuantity = useCallback((key, quantity) => {
    if (quantity < 1) return removeItem(key);
    setItems((prev) =>
      prev.map((i) => (i.key === key ? { ...i, quantity } : i))
    );
  }, []);

  // ─── Supprimer un article ─────────────────────────────────
  const removeItem = useCallback((key) => {
    setItems((prev) => prev.filter((i) => i.key !== key));
  }, []);

  // ─── Vider le panier ─────────────────────────────────────
  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  // ─── Codes Promo ─────────────────────────────────────────
  const PROMO_CODES = {
    'ANOUAN10':   { type: 'percent', value: 10,   label: '-10% Réduction Plateforme' },
    'ANOUAN15':   { type: 'percent', value: 15,   label: '-15% Réduction Bienvenue' },
    'BOUAKE20':   { type: 'percent', value: 20,   label: '-20% Spécial Bouaké' },
    'BOUAKE2026': { type: 'percent', value: 10,   label: '-10% Spécial Bouaké 2026' },
    'BIENVENUE':  { type: 'fixed',   value: 2000, label: '-2 000 FCFA Offre de Bienvenue' },
    'EXPRESS5':   { type: 'fixed',   value: 2000, label: '-2 000 FCFA Offerts' },
    'FLASH50':    { type: 'percent', value: 50,   label: '-50% Super Flash' },
  };

  const [appliedPromo, setAppliedPromo] = useState(() => {
    try {
      const saved = localStorage.getItem('anouan_cart_promo');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (appliedPromo) {
      localStorage.setItem('anouan_cart_promo', JSON.stringify(appliedPromo));
    } else {
      localStorage.removeItem('anouan_cart_promo');
    }
  }, [appliedPromo]);

  const applyPromoCode = useCallback((rawCode) => {
    const code = (rawCode || '').trim().toUpperCase();
    if (!code) return { success: false, message: 'Veuillez entrer un code promo.' };
    const promo = PROMO_CODES[code];
    if (!promo) {
      return { success: false, message: 'Code promo invalide ou expiré.' };
    }
    const promoData = { code, ...promo };
    setAppliedPromo(promoData);
    return { success: true, message: `Code ${code} appliqué avec succès !`, promo: promoData };
  }, []);

  const removePromoCode = useCallback(() => {
    setAppliedPromo(null);
  }, []);

  // ─── Calculs dérivés ─────────────────────────────────────
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0);

  let discountAmount = 0;
  if (appliedPromo && totalPrice > 0) {
    if (appliedPromo.type === 'percent') {
      discountAmount = Math.round((totalPrice * appliedPromo.value) / 100);
    } else if (appliedPromo.type === 'fixed') {
      discountAmount = Math.min(totalPrice, appliedPromo.value);
    }
  }
  const finalPrice = Math.max(0, totalPrice - discountAmount);

  const value = {
    items,
    totalItems,
    totalPrice,
    discountAmount,
    finalPrice,
    appliedPromo,
    applyPromoCode,
    removePromoCode,
    isOpen,
    setIsOpen,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart doit être utilisé dans CartProvider');
  return ctx;
}
