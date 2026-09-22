// src/contexts/ProductContext.jsx
// Contexte Produit Global — Synchronisation Temps Réel Vendeur <-> Boutique Publique

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { productsAPI } from '../services/api';

const ProductContext = createContext(null);

const VENDOR_PRODUCTS_KEY = 'anouan_vendor_products';
const IMG_CACHE_KEY = 'anouan_img_cache';

export const getFallbackProductImage = (title = '') => {
  const t = (title || '').toLowerCase();
  if (t.includes('samsung') || t.includes('galaxy') || t.includes('a16') || t.includes('phone') || t.includes('iphone') || t.includes('smartphone') || t.includes('écran') || t.includes('ecran')) {
    return 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80';
  }
  if (t.includes('pagne') || t.includes('baoulé') || t.includes('wax') || t.includes('tissu') || t.includes('robe') || t.includes('chemise') || t.includes('kita')) {
    return 'https://images.unsplash.com/photo-1590736704728-f4730bb30770?w=600&q=80';
  }
  if (t.includes('sac') || t.includes('cuir') || t.includes('sacoche') || t.includes('valise') || t.includes('maroquinerie')) {
    return 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&q=80';
  }
  if (t.includes('chaussure') || t.includes('sneaker') || t.includes('basket') || t.includes('nike') || t.includes('adidas') || t.includes('gazelle')) {
    return 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80';
  }
  if (t.includes('montre') || t.includes('smartwatch') || t.includes('watch')) {
    return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80';
  }
  if (t.includes('ecouteur') || t.includes('écouteur') || t.includes('airpod') || t.includes('earbud') || t.includes('casque') || t.includes('audio')) {
    return 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&q=80';
  }
  if (t.includes('casserole') || t.includes('cuisine') || t.includes('poele') || t.includes('poêle') || t.includes('marmite') || t.includes('plat')) {
    return 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=600&q=80';
  }
  if (t.includes('mixeur') || t.includes('blender') || t.includes('robot') || t.includes('electromenager')) {
    return 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=600&q=80';
  }
  return 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&q=80';
};

export const isValidImageUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (trimmed.length < 5) return false;
  if (trimmed === '__cache__') return false;
  if (trimmed.startsWith('blob:')) return false;
  return (
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('/')
  );
};

// Produits de démonstration initiaux avec données de boutiques réelles à Bouaké
const DEFAULT_MOCK_PRODUCTS = [
  {
    id: 101,
    name: 'Pagne Baoulé Tissé Main Traditionnel',
    title: 'Pagne Baoulé Tissé Main Traditionnel',
    category_id: 'mode',
    category_name: 'Mode & Pagne Kita',
    price: 25000,
    oldPrice: 35000,
    rating: 5.0,
    vendor_id: 'v_1',
    vendor_name: 'Maison du Pagne Bouaké',
    store_location: 'Quartier Commerce, Bouaké',
    stock: 12,
    description: 'Véritable pagne Baoulé tissé à la main selon les méthodes traditionnelles de la région du Gbeke. Couleurs éclatantes et motifs sacrés.',
    images: ['/pagne_kita.jpg'],
    image_url: '/pagne_kita.jpg',
    isCultural: true,
  },
  {
    id: 102,
    name: 'Robe de Gala en Pagne Kita Ivoirien',
    title: 'Robe de Gala en Pagne Kita Ivoirien',
    category_id: 'mode',
    category_name: 'Mode & Pagne Kita',
    price: 32000,
    oldPrice: 42000,
    rating: 4.9,
    vendor_id: 'v_2',
    vendor_name: 'Atelier Kita Bouaké',
    store_location: 'Air France 1, Bouaké',
    stock: 8,
    description: 'Robe de gala spectaculaire confectionnée en Pagne Kita authentique. Finitions haute couture pour événements VIP et cérémonies.',
    images: ['https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&q=80'],
    image_url: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&q=80',
    isCultural: true,
  },
  {
    id: 1,
    name: 'Smartphone Pro Max 5G Ultra',
    title: 'Smartphone Pro Max 5G Ultra',
    category_id: 'tech',
    category_name: 'Électronique & High-Tech',
    price: 250000,
    oldPrice: 300000,
    rating: 4.8,
    vendor_id: 'v_3',
    vendor_name: 'Tech Store CI',
    store_location: 'Avenue Reine Pokou, Bouaké',
    stock: 15,
    description: 'Écran AMOLED 120Hz, processeur Octa-Core ultra fluide, triple caméra 108 MP, batterie 5000mAh charge rapide 67W.',
    images: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80'],
    image_url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80',
  },
  {
    id: 2,
    name: 'Sneakers Urban Confort Premium',
    title: 'Sneakers Urban Confort Premium',
    category_id: 'chaussures',
    category_name: 'Chaussures & Basket',
    price: 15000,
    oldPrice: 22000,
    rating: 4.6,
    vendor_id: 'v_4',
    vendor_name: 'Bouaké Street Style',
    store_location: 'Koko, Bouaké',
    stock: 20,
    description: 'Baskets confortables avec semelle amortissante à coussin d\'air. Design moderne idéal pour la marche quotidienne.',
    images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80'],
    image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80',
  },
  {
    id: 3,
    name: 'Montre Connectée Sport HD',
    title: 'Montre Connectée Sport HD',
    category_id: 'tech',
    category_name: 'Électronique & High-Tech',
    price: 20000,
    oldPrice: 28000,
    rating: 4.7,
    vendor_id: 'v_3',
    vendor_name: 'Tech Store CI',
    store_location: 'Avenue Reine Pokou, Bouaké',
    stock: 10,
    description: 'Suivi de la fréquence cardiaque, mesure du sommeil, étanche IP68, autonomie de 10 jours.',
    images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80'],
    image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
  },
  {
    id: 4,
    name: 'Écouteurs Sans Fil Pro Noise Cancelling',
    title: 'Écouteurs Sans Fil Pro Noise Cancelling',
    category_id: 'tech',
    category_name: 'Électronique & High-Tech',
    price: 10000,
    oldPrice: 15000,
    rating: 4.5,
    vendor_id: 'v_3',
    vendor_name: 'Tech Store CI',
    store_location: 'Avenue Reine Pokou, Bouaké',
    stock: 25,
    description: 'Réduction active du bruit, basses profondes, boîtier de charge sans fil.',
    images: ['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80'],
    image_url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80',
  },
];

export function ProductProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Nettoyage proactif des résidus de localStorage pour éviter les conflits
  useEffect(() => {
    try {
      localStorage.removeItem(VENDOR_PRODUCTS_KEY);
      localStorage.removeItem(IMG_CACHE_KEY);
    } catch {}
  }, []);

  const getImageCache = useCallback(() => [], []);

  // ─── Chargement & Synchronisation Globale depuis PostgreSQL ──
  const syncProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await productsAPI.getAll({ limit: 100 });
      const data = res?.data?.data || res?.data;
      if (Array.isArray(data) && data.length > 0) {
        const formatted = data.map((p) => {
          const titleName = p.title || p.name || 'Produit Anouan';
          const fallback = getFallbackProductImage(titleName);
          const rawImgs = Array.isArray(p.images) && p.images.length > 0
            ? p.images
            : [p.image_url || p.image || p.main_image];
          const validImgs = rawImgs
            .map(img => typeof img === 'string' ? img : (img?.preview || img?.url || img?.image_url))
            .filter(isValidImageUrl);

          const finalImages = validImgs.length > 0 ? validImgs : [fallback];

          return {
            ...p,
            id: p.id,
            name: titleName,
            title: titleName,
            price: Number(p.sale_price || p.discount_price || (p.flash_sale_active && p.flash_sale_price) || p.price || 0),
            oldPrice: Number(p.oldPrice || p.old_price || ((p.sale_price || p.discount_price || (p.flash_sale_active && p.flash_sale_price)) ? p.price : 0)) || null,
            flash_sale_active: !!(p.flash_sale_active || p.sale_price || p.discount_price),
            flash_sale_price: Number(p.sale_price || p.discount_price || p.flash_sale_price || 0) || null,
            vendor_name: p.vendor_name || 'Boutique Anouan Bouaké',
            store_location: p.store_location || 'Bouaké Centre',
            stock: p.stock ?? 10,
            rating: Number(p.rating || p.avg_rating || 4.8),
            images: finalImages,
            image_url: finalImages[0],
            image: finalImages[0],
          };
        });
        setProducts(formatted);
      } else {
        // Fallback démo uniquement si la base de données est complètement vierge
        setProducts(DEFAULT_MOCK_PRODUCTS);
      }
    } catch (err) {
      console.warn('Impossible de joindre PostgreSQL, utilisation secours:', err);
      setProducts(DEFAULT_MOCK_PRODUCTS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    syncProducts();

    const handleSync = () => syncProducts();
    window.addEventListener('anouan_products_updated', handleSync);

    return () => {
      window.removeEventListener('anouan_products_updated', handleSync);
    };
  }, [syncProducts]);

  // ─── Actions Vendeur / Admin (100% PostgreSQL via API) ────────
  const addProduct = useCallback(async (prodData, rawImageFiles = []) => {
    const fd = new FormData();
    fd.append('title', prodData.title || prodData.name || '');
    fd.append('name', prodData.title || prodData.name || '');
    fd.append('price', prodData.price);
    fd.append('stock', prodData.stock ?? 10);
    fd.append('description', prodData.description || '');
    if (prodData.categoryId || prodData.category_id) {
      fd.append('categoryId', prodData.categoryId || prodData.category_id);
    }
    if (prodData.flashSaleActive) {
      fd.append('flashSaleActive', prodData.flashSaleActive);
    }
    if (prodData.flashSalePrice) {
      fd.append('flashSalePrice', prodData.flashSalePrice);
    }

    if (Array.isArray(rawImageFiles)) {
      rawImageFiles.forEach(file => {
        if (file instanceof File) {
          fd.append('images', file);
        }
      });
    }

    const res = await productsAPI.create(fd);
    await syncProducts();
    window.dispatchEvent(new CustomEvent('anouan_products_updated'));
    return res.data?.data?.id || res.data?.id;
  }, [syncProducts]);

  const updateProduct = useCallback(async (id, prodData, rawImageFiles = []) => {
    const fd = new FormData();
    if (prodData.title || prodData.name) {
      fd.append('title', prodData.title || prodData.name);
      fd.append('name', prodData.title || prodData.name);
    }
    if (prodData.price) fd.append('price', prodData.price);
    if (prodData.stock !== undefined) fd.append('stock', prodData.stock);
    if (prodData.description !== undefined) fd.append('description', prodData.description);
    if (prodData.categoryId || prodData.category_id) {
      fd.append('categoryId', prodData.categoryId || prodData.category_id);
    }
    if (prodData.flashSaleActive !== undefined) {
      fd.append('flashSaleActive', prodData.flashSaleActive);
    }
    if (prodData.flashSalePrice) {
      fd.append('flashSalePrice', prodData.flashSalePrice);
    }

    if (Array.isArray(rawImageFiles)) {
      rawImageFiles.forEach(file => {
        if (file instanceof File) {
          fd.append('images', file);
        }
      });
    }

    const res = await productsAPI.update(id, fd);
    await syncProducts();
    window.dispatchEvent(new CustomEvent('anouan_products_updated'));
    return res.data?.data || res.data;
  }, [syncProducts]);

  const deleteProduct = useCallback(async (id) => {
    await productsAPI.delete(id);
    await syncProducts();
    window.dispatchEvent(new CustomEvent('anouan_products_updated'));
  }, [syncProducts]);

  // ─── Requêtes & Recherche ────────────────────────────────────
  const getProductById = useCallback((id) => {
    return products.find(p => String(p.id) === String(id)) || null;
  }, [products]);

  const getProductsByVendor = useCallback((vendorName) => {
    if (!vendorName) return [];
    return products.filter(p => (p.vendor_name || '').toLowerCase().includes(vendorName.toLowerCase()));
  }, [products]);

  const value = {
    products,
    loading,
    syncProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    getProductById,
    getProductsByVendor,
    getImageCache,
  };

  return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>;
}

export function useProducts() {
  const ctx = useContext(ProductContext);
  if (!ctx) throw new Error('useProducts doit être utilisé dans un ProductProvider');
  return ctx;
}
