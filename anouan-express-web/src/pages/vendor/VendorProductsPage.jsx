// src/pages/vendor/VendorProductsPage.jsx
// Gestion des produits du vendeur : liste, ajout, édition, suppression

import React, { useState, useEffect, useRef } from 'react';
import {
  Plus, Search, Edit, Trash2, Package, X, Upload, Camera,
  Loader2, CheckCircle, AlertTriangle, Sparkles, Wand2, Bot, Star, Image as ImageIcon, FileText
} from 'lucide-react';
import { productsAPI, categoriesAPI } from '../../services/api';
import { compressImage } from '../../utils/imageCompressor';
import PageHeader from '../../components/ui/PageHeader';

const formatPrice = (price) => new Intl.NumberFormat('fr-CI').format(Number(price || 0)) + ' FCFA';

const emptyForm = {
  title: '',
  description: '',
  price: '',
  stock: '',
  categoryId: 'cat-1',
  images: [],
  flashSaleActive: false,
  flashSalePrice: '',
};

const getFallbackProductImage = (title = '') => {
  const t = (title || '').toLowerCase();
  if (t.includes('samsung') || t.includes('a16') || t.includes('phone') || t.includes('iphone') || t.includes('smartphone') || t.includes('écran') || t.includes('ecran')) {
    return 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80';
  }
  if (t.includes('pagne') || t.includes('baoulé') || t.includes('wax') || t.includes('tissu') || t.includes('robe') || t.includes('chemise')) {
    return 'https://images.unsplash.com/photo-1590736704728-f4730bb30770?w=600&q=80';
  }
  if (t.includes('sac') || t.includes('cuir') || t.includes('sacoche') || t.includes('valise')) {
    return 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&q=80';
  }
  if (t.includes('chaussure') || t.includes('sneaker') || t.includes('basket') || t.includes('nike') || t.includes('adidas')) {
    return 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80';
  }
  return 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&q=80';
};

const DEFAULT_CATEGORIES = [
  { id: 'cat-1', name: 'Mode & Pagne Baoulé', icon: '👗' },
  { id: 'cat-2', name: 'Smartphones & Électronique', icon: '📱' },
  { id: 'cat-3', name: 'Accessoires & Maroquinerie', icon: '👜' },
  { id: 'cat-4', name: 'Chaussures & Sneakers', icon: '👟' },
  { id: 'cat-5', name: 'Épicerie & Produits Locaux', icon: '🍲' },
  { id: 'cat-6', name: 'Beauté & Cosmétiques', icon: '💄' },
];

const DEFAULT_DEMO_PRODUCTS = [
  { id: 104, title: 'SAMSUNG A16 128GB', name: 'SAMSUNG A16 128GB', price: 125000, stock: 20, category_id: 'cat-2', image_url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80' },
  { id: 101, title: 'Pagne Baoulé Tissé Main Traditionnel', name: 'Pagne Baoulé Tissé Main Traditionnel', price: 45000, stock: 12, category_id: 'cat-1', image_url: 'https://images.unsplash.com/photo-1590736704728-f4730bb30770?w=600&q=80' },
  { id: 102, title: 'Sac à Main Cuir & Pagne WAX', name: 'Sac à Main Cuir & Pagne WAX', price: 25000, stock: 8, category_id: 'cat-3', image_url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&q=80' },
  { id: 103, title: 'Robe d\'Été Fleurie WAX Bouaké', name: 'Robe d\'Été Fleurie WAX Bouaké', price: 18500, stock: 15, category_id: 'cat-1', image_url: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=600&q=80' },
];

export default function VendorProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(false);

  const getImageCache = () => [];

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const fileRef = useRef();
  const cameraRef = useRef();

  const [generatingAI, setGeneratingAI] = useState(false);
  const [aiTone, setAiTone] = useState('commercial');

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const generateAIDescription = (tone = 'commercial') => {
    if (!form.title.trim()) {
      showToast('Veuillez d\'abord entrer le nom du produit !', 'error');
      return;
    }

    setGeneratingAI(true);

    setTimeout(() => {
      const title = form.title.trim();
      let text = '';

      if (tone === 'artisan' || title.toLowerCase().includes('pagne') || title.toLowerCase().includes('tissu') || title.toLowerCase().includes('artisan')) {
        text = `✨ ${title} — Pièce d'exception façonnée avec passion. Fabriquée selon les méthodes traditionnelles ivoiriennes à Bouaké, cette création se distingue par la finesse des finitions, la richesse des motifs et la qualité supérieure des matières premières.\n\n📍 Produit disponible immédiatement pour retrait sécurisé au Magasin Central d'Anouan Express à Bouaké. Garantie d'authenticité 100%.`;
      } else if (tone === 'tech' || title.toLowerCase().includes('phone') || title.toLowerCase().includes('ecran') || title.toLowerCase().includes('tech') || title.toLowerCase().includes('smart')) {
        text = `⚡ ${title} — Produit de haute technologie avec emballage d'origine. Offre des performances exceptionnelles, une durabilité maximale et un design élégant.\n\n📦 Livré avec accessoires d'origine et garantie officielle de 12 mois. Disponible pour retrait instantané au guichet du Magasin Central d'Anouan Express à Bouaké.`;
      } else {
        text = `🌟 ${title} — Sublimez votre quotidien avec cet article incontournable de notre boutique ! Sélectionné pour sa qualité premium, son confort d'utilisation et son style élégant.\n\n✅ Article authentique & contrôlé par le vendeur.\n🚀 Prêt et disponible au Magasin Central d'Anouan Express à Bouaké en retrait express !`;
      }

      setForm((p) => ({ ...p, description: text }));
      setGeneratingAI(false);
      showToast('✨ Description rédigée par l\'Assistant IA Anouan !');
    }, 800);
  };

  // Migration : nettoyer l'ancien format localStorage incompatible (une seule fois)
  useEffect(() => {
    try {
      const VERSION_KEY = 'anouan_products_version';
      const CURRENT_VERSION = '3';
      if (localStorage.getItem(VERSION_KEY) !== CURRENT_VERSION) {
        localStorage.removeItem('anouan_vendor_products');
        localStorage.removeItem('anouan_img_cache');
        localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
        // Forcer rechargement produits démo dans catalogue
        window.dispatchEvent(new CustomEvent('anouan_products_updated'));
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('anouan_products_updated', handleUpdate);
    return () => window.removeEventListener('anouan_products_updated', handleUpdate);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        productsAPI.getVendorProducts({ limit: 100 }).catch(() => null),
        categoriesAPI.getAll().catch(() => null),
      ]);

      const fetchedProds = prodRes?.data?.data || prodRes?.data;
      const fetchedCats = catRes?.data?.data || catRes?.data;

      if (Array.isArray(fetchedProds)) {
        setProducts(fetchedProds);
      }
      if (Array.isArray(fetchedCats) && fetchedCats.length > 0) {
        setCategories(fetchedCats);
      }
    } catch (err) {
      console.error('Erreur chargement données:', err);
    } finally {
      setLoading(false);
    }
  };

  const revokeImagePreviews = (images) => {
    images?.forEach((file) => {
      if (file && typeof file === 'object' && file?.preview && typeof file.preview === 'string' && file.preview.startsWith('blob:')) {
        try { URL.revokeObjectURL(file.preview); } catch {}
      }
    });
  };

  const resetForm = () => {
    revokeImagePreviews(form.images);
    setForm(emptyForm);
    setEditProduct(null);
  };

  const openCreate = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEdit = (p) => {
    resetForm();
    setEditProduct(p);
    const existingImgs = getImageCache(p.id);
    const initialImages = (Array.isArray(p.images) && p.images.length > 0 && p.images[0] !== '__cache__')
      ? p.images
      : existingImgs.length > 0
        ? existingImgs
        : [p.image_url || p.image].filter(Boolean);

    setForm({
      title: p.title || p.name || '',
      description: p.description || '',
      price: p.price || '',
      stock: p.stock || '',
      categoryId: p.category_id || p.categoryId || 'cat-1',
      images: initialImages,
      flashSaleActive: p.flash_sale_active || false,
      flashSalePrice: p.flash_sale_price || '',
    });
    setModalOpen(true);
  };

  const [isDragging, setIsDragging] = useState(false);
  const [coverIndex, setCoverIndex] = useState(0);

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const compressImageFile = (file, maxWidth = 800, quality = 0.75) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => resolve(e.target?.result || null);
        img.src = e.target?.result;
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  };

  const addFilesToForm = (rawFiles) => {
    const validFiles = rawFiles.filter(file =>
      file.type?.startsWith('image/') || file.name?.match(/\.(jpg|jpeg|png|webp|gif|svg|avif|heic)$/i)
    );

    if (validFiles.length === 0) {
      showToast('Veuillez sélectionner des fichiers images valides.', 'error');
      return;
    }

    Promise.all(validFiles.map(async (file) => {
      const optimizedFile = await compressImage(file);
      return Object.assign(optimizedFile, { preview: URL.createObjectURL(optimizedFile) });
    })).then((processedFiles) => {
      setForm((prev) => {
        const newImages = [...prev.images];
        for (const pf of processedFiles) {
          if (!newImages.some(img => img.name === pf.name && img.size === pf.size)) {
            newImages.push(pf);
          }
        }
        return {
          ...prev,
          images: newImages.slice(0, 10),
        };
      });
      showToast(`${validFiles.length} photo(s) optimisée(s) et prête(s) !`);
    });
  };

  const handleImageChange = (e) => {
    if (e.target.files?.length) {
      addFilesToForm(Array.from(e.target.files));
      e.target.value = null;
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) {
      addFilesToForm(Array.from(e.dataTransfer.files));
    }
  };

  const removeImage = (index) => {
    setForm((prev) => {
      const images = [...prev.images];
      const [removed] = images.splice(index, 1);
      if (removed?.preview) {
        URL.revokeObjectURL(removed.preview);
      }
      return { ...prev, images };
    });
    if (coverIndex >= index && coverIndex > 0) {
      setCoverIndex(coverIndex - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.price || !form.stock) {
      showToast('Veuillez remplir les champs obligatoires (Titre, Prix, Stock).', 'error');
      return;
    }

    setSaving(true);

    const isEditing = !!editProduct;
    const editId = editProduct?.id;
    try {
      const fd = new FormData();
      fd.append('name', form.title.trim());
      fd.append('title', form.title.trim());
      fd.append('description', form.description || '');
      fd.append('price', form.price);
      fd.append('stock', form.stock);
      fd.append('categoryId', form.categoryId || 'cat-1');
      fd.append('flashSaleActive', form.flashSaleActive);
      if (form.flashSalePrice) fd.append('flashSalePrice', form.flashSalePrice);

      form.images.forEach((img) => {
        if (img instanceof File) {
          fd.append('images', img);
        } else if (typeof img === 'string' && img.length > 5 && img !== '__cache__') {
          fd.append('images', img);
        } else if (img?.preview && typeof img.preview === 'string') {
          fd.append('images', img.preview);
        }
      });

      if (editProduct?.id) {
        await productsAPI.update(editProduct.id, fd);
        showToast('✅ Produit mis à jour dans PostgreSQL !');
      } else {
        await productsAPI.create(fd);
        showToast('✅ Produit créé dans la base de données PostgreSQL !');
      }

      await loadData();
      window.dispatchEvent(new CustomEvent('anouan_products_updated'));
      setModalOpen(false);
      resetForm();
    } catch (err) {
      console.error('Erreur enregistrement produit:', err);
      showToast('❌ Erreur lors de l\'enregistrement dans la base de données.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer ce produit ? Cette action est irréversible.')) return;
    try {
      await productsAPI.delete(id);
      showToast('✅ Produit supprimé de PostgreSQL.');
      window.dispatchEvent(new CustomEvent('anouan_products_updated'));
      await loadData();
    } catch (err) {
      console.error('Erreur suppression produit:', err);
      showToast('Erreur lors de la suppression.', 'error');
    }
  };

  const [filterTab, setFilterTab] = useState('all');

  const flashCount = products.filter((p) => Boolean(p.flash_sale_active)).length;
  const lowStockCount = products.filter((p) => Number(p.stock) <= 5).length;
  const inactiveCount = products.filter((p) => p.is_active === false).length;

  const filtered = products.filter((p) => {
    const matchesSearch = (p.name || p.title || '').toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (filterTab === 'flash') return Boolean(p.flash_sale_active);
    if (filterTab === 'low_stock') return Number(p.stock) <= 5;
    if (filterTab === 'inactive') return p.is_active === false;
    return true;
  });

  return (
    <div className="space-y-5 bg-slate-950 p-6 min-h-screen">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-3xl shadow-lg border border-slate-800 text-[10px] font-black animate-in slide-in-from-right-5 ${
            toast.type === 'error'
              ? 'bg-red-900/90 text-white'
              : 'bg-emerald-900/90 text-white'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertTriangle className="w-4 h-4" />
          ) : (
            <CheckCircle className="w-4 h-4" />
          )}
          {toast.msg}
        </div>
      )}

      <PageHeader
        eyebrow="Espace Vendeur"
        eyebrowIcon={Package}
        title="Mes Produits"
        subtitle={`${products.length} produit(s) dans votre boutique`}
        actions={(
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-orange-500 text-white font-black px-5 py-2.5 rounded-2xl hover:bg-orange-600 shadow-lg shadow-orange-500/20 transition-colors"
          >
            <Plus size={18} /> Ajouter un produit
          </button>
        )}
      />

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setFilterTab('all')}
            className={`px-3.5 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap ${
              filterTab === 'all'
                ? 'bg-orange-500 text-slate-950 shadow-lg shadow-orange-500/30'
                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            Tous <span className="text-[10px] px-1.5 py-0.5 bg-black/20 rounded-full">{products.length}</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('flash')}
            className={`px-3.5 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap ${
              filterTab === 'flash'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30'
                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            ⚡ Ventes Flash <span className="text-[10px] px-1.5 py-0.5 bg-black/20 rounded-full">{flashCount}</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('low_stock')}
            className={`px-3.5 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap ${
              filterTab === 'low_stock'
                ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            ⚠️ Stock Faible <span className="text-[10px] px-1.5 py-0.5 bg-black/20 rounded-full">{lowStockCount}</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('inactive')}
            className={`px-3.5 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap ${
              filterTab === 'inactive'
                ? 'bg-slate-700 text-white shadow-lg'
                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            Inactifs <span className="text-[10px] px-1.5 py-0.5 bg-black/20 rounded-full">{inactiveCount}</span>
          </button>
        </div>

        <div className="relative shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un produit..."
            className="w-full sm:w-64 pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-white focus:border-orange-500 outline-none transition-all"
          />
        </div>
      </div>

      {/* Grille de produits */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-3xl h-64 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl py-16 text-center">
          <Package className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-white font-black">Aucun produit trouvé</p>
          <p className="text-xs text-slate-400 mt-1">
            {search ? 'Modifiez votre recherche' : 'Ajoutez votre premier produit !'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((product) => (
            <div
              key={product.id}
              className="bg-slate-900/60 rounded-3xl border border-slate-800 overflow-hidden group hover:border-orange-500/50 transition-colors"
            >
              {/* Image */}
              <div className="h-44 bg-slate-950 overflow-hidden border-b border-slate-800 relative">
                <img
                  src={(() => {
                    const cached = getImageCache(product.id);
                    const firstCached = Array.isArray(cached) ? cached[0] : cached;
                    const rawImg = (typeof product.images?.[0] === 'string' ? product.images[0] : product.images?.[0]?.preview) || product.image_url;
                    return firstCached || (rawImg !== '__cache__' ? rawImg : null) || getFallbackProductImage(product.title || product.name);
                  })()}
                  alt={product.name || product.title}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = getFallbackProductImage(product.title || product.name);
                  }}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90 group-hover:opacity-100"
                />
              </div>

              {/* Info */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-black text-white text-sm truncate">
                    {product.name || product.title}
                  </h3>
                  <div className="flex flex-wrap gap-1">
                    {product.flash_sale_active && product.flash_sale_price ? (
                      <span className="flex-shrink-0 px-2.5 py-1 text-[10px] font-bold border border-orange-500/30 bg-orange-500/10 text-orange-400 rounded-full">
                        Vente flash
                      </span>
                    ) : null}
                    {product.is_active === false ? (
                      <span className="flex-shrink-0 px-2.5 py-1 text-[10px] font-bold border border-red-500/30 bg-red-500/10 text-red-400 rounded-full">
                        Inactif
                      </span>
                    ) : (
                      <span className="flex-shrink-0 px-2.5 py-1 text-[10px] font-bold border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 rounded-full">
                        Actif
                      </span>
                    )}
                  </div>
                </div>
                <div className="mb-1">
                  {product.flash_sale_active && product.flash_sale_price ? (
                    <div className="space-y-1">
                      <div className="text-[10px] text-slate-500 line-through">
                        {formatPrice(product.price)}
                      </div>
                      <div className="text-orange-500 font-black text-sm">
                        {formatPrice(product.flash_sale_price)}
                      </div>
                    </div>
                  ) : (
                    <div className="text-orange-500 font-black text-sm">
                      {formatPrice(product.price)}
                    </div>
                  )}
                </div>
                <div className="text-xs text-slate-400 mb-4">
                  Stock : <span className="font-black text-white">{product.stock ?? '—'}</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => openEdit(product)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-800/60 hover:bg-orange-500 hover:text-white hover:border-orange-500 border border-slate-700 text-slate-300 rounded-2xl text-[10px] font-black transition-colors"
                  >
                    <Edit size={14} /> Modifier
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="p-2 bg-slate-800/60 hover:bg-red-500/20 hover:text-red-500 hover:border-red-500/50 border border-slate-700 text-slate-400 rounded-2xl transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Ajout/Édition */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <h2 className="text-lg font-black text-white">
                {editProduct ? 'Modifier le produit' : 'Nouveau produit'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-2xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-black text-white mb-1.5">
                  Nom du produit *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  required
                  placeholder="Ex: Robe d'été fleurie"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-white focus:border-orange-500 outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-black text-white flex items-center gap-1.5">
                    Description du produit
                  </label>
                  <button
                    type="button"
                    disabled={generatingAI}
                    onClick={() => generateAIDescription(aiTone)}
                    className="flex items-center gap-1.5 text-[11px] font-black text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 px-3 py-1.5 rounded-xl transition-all shadow-sm hover:scale-105 active:scale-95 disabled:opacity-50"
                  >
                    {generatingAI ? (
                      <>
                        <Loader2 size={13} className="animate-spin text-orange-400" />
                        <span>Rédaction IA...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={13} className="text-orange-400 animate-pulse" />
                        <span>Rédiger avec Assistant IA ✨</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Sélecteur de style IA */}
                <div className="flex items-center gap-1.5 mb-2 overflow-x-auto pb-1">
                  <span className="text-[10px] font-bold text-slate-400 shrink-0">Style IA :</span>
                  {[
                    { id: 'commercial', label: '🌟 Captivant' },
                    { id: 'artisan', label: '📜 Artisan & Tradition' },
                    { id: 'tech', label: '⚡ High-Tech' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setAiTone(t.id);
                        if (form.title.trim()) generateAIDescription(t.id);
                      }}
                      className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-all ${
                        aiTone === t.id
                          ? 'bg-orange-500/20 text-orange-400 border-orange-500/40'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                <textarea
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  rows={4}
                  placeholder="Saisissez une description ou cliquez sur 'Rédiger avec Assistant IA'..."
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-2xl text-xs text-white placeholder-slate-500 outline-none resize-none leading-relaxed transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-white mb-1.5">
                    Prix (FCFA) *
                  </label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                    required
                    min="0"
                    placeholder="25000"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-white focus:border-orange-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-white mb-1.5">
                    Stock *
                  </label>
                  <input
                    type="number"
                    value={form.stock}
                    onChange={(e) => setForm((p) => ({ ...p, stock: e.target.value }))}
                    required
                    min="0"
                    placeholder="50"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-white focus:border-orange-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-white mb-1.5">
                  Catégorie
                </label>
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm((p) => ({ ...p, categoryId: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-white focus:border-orange-500 outline-none"
                >
                  <option value="">Sélectionner une catégorie</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.icon ? `${c.icon} ` : ''}{c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Vente Flash */}
              <div className="bg-slate-900/60 p-4 rounded-3xl border border-slate-800 space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="flashSale"
                    checked={form.flashSaleActive}
                    onChange={(e) => setForm((p) => ({ ...p, flashSaleActive: e.target.checked }))}
                    className="w-4 h-4 accent-orange-500 bg-slate-950 border-slate-800 rounded"
                  />
                  <label htmlFor="flashSale" className="text-xs font-black text-white">
                    ⚡ Activer la vente flash
                  </label>
                </div>
                {form.flashSaleActive && (
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">
                      Prix flash (FCFA)
                    </label>
                    <input
                      type="number"
                      value={form.flashSalePrice}
                      onChange={(e) => setForm((p) => ({ ...p, flashSalePrice: e.target.value }))}
                      min="0"
                      placeholder="Ex: 18000"
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-white focus:border-orange-500 outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Upload multi-format images avec Drag & Drop */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-black text-white flex items-center gap-1.5">
                    Images du produit (Multi-Formats, max 10)
                  </label>
                  <span className="text-[10px] font-bold text-orange-400">
                    {form.images.length}/10 ajoutée(s)
                  </span>
                </div>

                <div
                  onClick={() => fileRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-3xl p-6 text-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-orange-500 bg-orange-500/10 scale-[1.01]'
                      : 'border-slate-700 bg-slate-950 hover:border-orange-500/60 hover:bg-slate-900'
                  }`}
                >
                  <Upload className={`w-7 h-7 mx-auto mb-2 transition-transform ${isDragging ? 'text-orange-400 scale-110' : 'text-slate-400'}`} />
                  <p className="text-xs font-bold text-white mb-1">
                    {isDragging ? 'Glissez vos images ici ! 🚀' : 'Glissez-déposez vos images ici ou cliquez pour parcourir'}
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3 mt-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        cameraRef.current?.click();
                      }}
                      className="px-4 py-2 rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-400 hover:bg-orange-500/25 text-xs font-bold transition-all flex items-center gap-2"
                    >
                      <Camera size={15} /> Prendre une Photo (Caméra)
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileRef.current?.click();
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-all flex items-center gap-2"
                    >
                      <Upload size={15} /> Ouvrir la Galerie
                    </button>
                  </div>

                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*,.png,.jpg,.jpeg,.webp,.gif,.svg,.avif,.heic"
                    multiple
                    hidden
                    onChange={handleImageChange}
                  />
                  <input
                    ref={cameraRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    hidden
                    onChange={handleImageChange}
                  />
                </div>

                {/* Galerie des prévisualisations multi-formats */}
                {form.images.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                    {form.images.map((file, index) => {
                      const isCover = coverIndex === index;
                      const fileExt = (typeof file === 'object' && file?.name) ? file.name.split('.').pop()?.toUpperCase() : 'IMG';
                      const imgSrc = typeof file === 'string'
                        ? file
                        : (file?.preview || (file instanceof Blob ? URL.createObjectURL(file) : getFallbackProductImage(form.title)));

                      return (
                        <div key={`img-${index}`} className={`relative rounded-2xl overflow-hidden border ${isCover ? 'border-orange-500 ring-2 ring-orange-500/30' : 'border-slate-800'} bg-slate-950 group`}>
                          <img
                            src={imgSrc}
                            alt="Aperçu produit"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = getFallbackProductImage(form.title);
                            }}
                            className="h-28 w-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                          />
                          
                          {/* Badges Format & Taille */}
                          <div className="absolute top-2 left-2 flex flex-col gap-1 pointer-events-none">
                            <span className="bg-slate-950/80 text-orange-400 text-[9px] font-black px-1.5 py-0.5 rounded-md border border-slate-700 backdrop-blur-sm">
                              {fileExt}
                            </span>
                            {typeof file === 'object' && file?.size && (
                              <span className="bg-slate-950/80 text-slate-300 text-[8px] font-bold px-1.5 py-0.5 rounded-md border border-slate-800 backdrop-blur-sm">
                                {formatFileSize(file.size)}
                              </span>
                            )}
                          </div>

                          {/* Bouton Image Principale */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCoverIndex(index);
                              showToast(`Image #${index + 1} définie comme photo principale 🌟`);
                            }}
                            title="Définir comme photo de couverture"
                            className={`absolute bottom-2 left-2 p-1 rounded-xl text-[9px] font-bold flex items-center gap-1 transition-all ${
                              isCover
                                ? 'bg-orange-500 text-slate-950 font-black shadow-md'
                                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-700'
                            }`}
                          >
                            <Star size={12} className={isCover ? 'fill-current text-slate-950' : ''} />
                            <span>{isCover ? 'Principale' : 'Couverture'}</span>
                          </button>

                          {/* Bouton Supprimer */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeImage(index);
                            }}
                            className="absolute top-2 right-2 bg-slate-900/80 text-slate-300 hover:text-white rounded-full p-1 border border-slate-700 hover:bg-red-500/80 hover:border-red-500 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setModalOpen(false);
                    resetForm();
                  }}
                  className="flex-1 py-3 bg-slate-800/60 border border-slate-700 text-slate-300 rounded-2xl text-[10px] font-black hover:bg-slate-700 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 bg-orange-500 text-white rounded-2xl text-[10px] font-black flex items-center justify-center gap-2 hover:bg-orange-600 shadow-lg shadow-orange-500/20 transition-colors disabled:opacity-60"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    editProduct ? 'Enregistrer' : 'Créer le produit'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
