// src/pages/client/CatalogPage.jsx
// Page Catalogue des produits avec Thème Culturel Ivoirien & Pagne Kita (Dark Glassmorphism)

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { Search, Filter, ShoppingCart, Star, SlidersHorizontal, ArrowRight, Loader2, Sparkles, Award, Heart, X } from 'lucide-react';
import { productsAPI, categoriesAPI } from '../../services/api';
import { useCart } from '../../contexts/CartContext';
import { useFavorites } from '../../contexts/FavoritesContext';
import { useProducts, getFallbackProductImage, isValidImageUrl } from '../../contexts/ProductContext';
import { useToast } from '../../components/ui/Toast';

const formatPrice = (p) => typeof p === 'number' ? new Intl.NumberFormat('fr-CI').format(p) + ' FCFA' : p;

export default function CatalogPage() {
  const { categorySlug } = useParams();
  const [searchParams] = useSearchParams();
  const searchQ = searchParams.get('q') || '';
  const { addItem } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { products: allContextProducts, loading: productsLoading } = useProducts();
  const toast = useToast();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([
    { id: 'mode', name: 'Mode & Pagne Kita' },
    { id: 'elec', name: 'Électronique' },
    { id: 'maison', name: 'Maison & Artisanat' },
    { id: 'beaute', name: 'Beauté & Karité' },
    { id: 'alim', name: 'Épicerie & Terroir CI' }
  ]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(() => searchParams.get('category') || categorySlug || '');
  const [sortBy, setSortBy] = useState('newest');
  const [maxPrice, setMaxPrice] = useState(500000);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Synchronise la catégorie avec l'URL en direct
  useEffect(() => {
    const cat = searchParams.get('category') || categorySlug || '';
    setSelectedCategory(cat);
  }, [searchParams, categorySlug]);

  const isCategoryMatch = (p, cat) => {
    if (!cat) return true;
    const targetCat = cat.toLowerCase();
    const pCat = String(p.category_id || p.categoryId || p.category || '').toLowerCase();
    const pCatName = String(p.category_name || p.categoryName || '').toLowerCase();
    
    if (pCat === targetCat || pCatName.includes(targetCat)) return true;
    if ((targetCat === 'tech' || targetCat === 'elec') && (pCat === 'tech' || pCat === 'elec' || pCatName.includes('électronique') || pCatName.includes('high-tech'))) return true;
    if ((targetCat === 'mode' || targetCat === 'pagne') && (pCat === 'mode' || pCat === 'pagne' || pCatName.includes('mode') || pCatName.includes('pagne') || pCatName.includes('kita'))) return true;
    if ((targetCat === 'chaussures' || targetCat === 'baskets') && (pCat === 'chaussures' || pCat === 'baskets' || pCatName.includes('chaussures') || pCatName.includes('sneakers'))) return true;
    if ((targetCat === 'maison') && (pCat === 'maison' || pCatName.includes('maison') || pCatName.includes('cuisine') || pCatName.includes('artisanat'))) return true;
    if ((targetCat === 'beaute') && (pCat === 'beaute' || pCatName.includes('beauté') || pCatName.includes('karité') || pCatName.includes('soins'))) return true;
    if ((targetCat === 'alim') && (pCat === 'alim' || pCatName.includes('épicerie') || pCatName.includes('terroir') || pCatName.includes('aliment'))) return true;
    return false;
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    let filtered = [...allContextProducts];

    // 1. Filtrage par Catégorie
    if (selectedCategory) {
      filtered = filtered.filter(p => isCategoryMatch(p, selectedCategory));
    }

    // 2. Filtrage par Recherche textuelle
    if (searchQ) {
      const q = searchQ.toLowerCase().trim();
      const qWords = q.split(/\s+/).filter(w => w.length > 2);
      const queryFiltered = filtered.filter(p => {
        const name = (p.name || p.title || '').toLowerCase();
        const desc = (p.description || '').toLowerCase();
        return name.includes(q) || desc.includes(q) || (qWords.length > 0 && qWords.some(w => name.includes(w)));
      });
      // Si la recherche textuelle stricte trouve des produits, on applique le filtre
      if (queryFiltered.length > 0) {
        filtered = queryFiltered;
      }
    }

    // 3. Filtrage par Prix
    filtered = filtered.filter(p => !p.price || Number(p.price) <= maxPrice);

    // 4. Tri
    if (sortBy === 'price_asc') filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
    if (sortBy === 'price_desc') filtered.sort((a, b) => (b.price || 0) - (a.price || 0));

    setProducts(filtered);
    setLoading(productsLoading);
  }, [allContextProducts, productsLoading, categorySlug, searchQ, selectedCategory, sortBy, maxPrice]);

  const loadCategories = async () => {
    try {
      const res = await categoriesAPI.getAll();
      const data = res.data?.data || res.data;
      if (Array.isArray(data) && data.length > 0) setCategories(data);
    } catch {
      // Secours
    }
  };

  const loadProducts = async () => {
    setLoading(true);
    let loadedProducts = [];

    try {
      const params = {
        q: searchQ || undefined,
        category: categorySlug || selectedCategory || undefined,
        sort: sortBy,
        limit: 100,
      };
      const res = await productsAPI.getAll(params);
      const data = res.data?.data || res.data;

      if (Array.isArray(data) && data.length > 0) {
        loadedProducts = data.map((p) => {
          const title = p.name || p.title || '';
          const fallback = getFallbackProductImage(title);
          const rawImg = p.image || p.image_url || p.main_image || p.images?.[0];
          const resolvedImg = isValidImageUrl(rawImg) ? rawImg : fallback;

          return {
            ...p,
            name: title,
            title: title,
            price: Number(p.price || 0),
            image: resolvedImg,
            image_url: resolvedImg,
            rating: Number(p.rating || p.avg_rating || 4.8),
            oldPrice: p.oldPrice || p.old_price || null,
          };
        });
      } else {
        loadedProducts = CATALOG_PRODUCTS_MOCK;
      }
    } catch (err) {
      console.warn('API non joignable, fallback:', err);
      loadedProducts = CATALOG_PRODUCTS_MOCK;
    }

    let filtered = [...loadedProducts];

    if (searchQ) {
      filtered = filtered.filter(p => (p.name || p.title || '').toLowerCase().includes(searchQ.toLowerCase()));
    }
    if (selectedCategory) {
      filtered = filtered.filter(p => isCategoryMatch(p, selectedCategory));
    }
    filtered = filtered.filter(p => !p.price || Number(p.price) <= maxPrice);

    if (sortBy === 'price_asc') filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
    if (sortBy === 'price_desc') filtered.sort((a, b) => (b.price || 0) - (a.price || 0));

    setProducts(filtered);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header Titre avec Bannière Culturelle Ivoirienne */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-950/80 via-slate-900 to-orange-950/80 border border-amber-500/30 p-8 shadow-2xl border-kita-glow">
          <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-25">
            <img src="/pagne_kita.jpg" alt="Motif Kita" className="w-full h-full object-cover animate-pagne-flash mix-blend-overlay" />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <span className="text-xs font-black uppercase tracking-widest text-amber-400 flex items-center gap-1.5 mb-2">
                <Award size={16} className="text-amber-400 animate-bounce" /> 🇨🇮 Produits Qualifiés & Artisanat Ivoirien
              </span>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                {searchQ ? `Résultats pour "${searchQ}"` : 'Catalogue Général & Créations de Côte d\'Ivoire'}
              </h1>
              <p className="text-xs md:text-sm text-slate-300 mt-2 max-w-2xl">
                Articles vérifiés disponibles pour retrait au magasin central de Bouaké.
              </p>
            </div>
            <span className="text-xs text-amber-300 font-bold bg-slate-950/80 border border-amber-500/40 px-5 py-2.5 rounded-2xl shadow-xl">
              <strong className="text-amber-400 text-sm">{products.length}</strong> article(s) trouvé(s)
            </span>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filtres Latéraux Desktop */}
          <aside className="hidden lg:block w-64 space-y-6 flex-shrink-0">
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6 sticky top-24">
              <div className="flex items-center gap-2 text-white font-bold text-sm border-b border-slate-800 pb-3">
                <SlidersHorizontal size={16} className="text-orange-400" /> Filtres de recherche
              </div>

              {/* Catégories */}
              <div className="space-y-2">
                <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Catégories</h3>
                <div className="space-y-1">
                  <button
                    onClick={() => setSelectedCategory('')}
                    className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                      !selectedCategory && !categorySlug
                        ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    }`}
                  >
                    Toutes les catégories
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                        String(selectedCategory) === String(cat.id)
                          ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filtre par Prix Max */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex justify-between items-center text-[11px] font-bold">
                  <span className="text-slate-400 uppercase tracking-wider">Prix Maximum</span>
                  <span className="text-orange-400">{formatPrice(maxPrice)}</span>
                </div>
                <input
                  type="range"
                  min="5000"
                  max="500000"
                  step="5000"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-orange-500 bg-slate-800 cursor-pointer"
                />
              </div>
            </div>
          </aside>

          {/* Drawer Filtres Mobile */}
          {mobileFilterOpen && (
            <div className="fixed inset-0 z-50 flex lg:hidden bg-slate-950/80 backdrop-blur-md">
              <div className="w-4/5 max-w-xs bg-slate-900 border-r border-slate-800 h-full p-6 space-y-6 overflow-y-auto">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2 text-white font-bold text-sm">
                    <SlidersHorizontal size={16} className="text-orange-400" /> Filtres
                  </div>
                  <button onClick={() => setMobileFilterOpen(false)} className="text-slate-400 hover:text-white p-1">
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-2">
                  <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Catégories</h3>
                  <div className="space-y-1">
                    <button
                      onClick={() => { setSelectedCategory(''); setMobileFilterOpen(false); }}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                        !selectedCategory && !categorySlug
                          ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                      }`}
                    >
                      Toutes les catégories
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => { setSelectedCategory(cat.id); setMobileFilterOpen(false); }}
                        className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                          String(selectedCategory) === String(cat.id)
                            ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t border-slate-800">
                  <div className="flex justify-between items-center text-[11px] font-bold">
                    <span className="text-slate-400 uppercase tracking-wider">Prix Max</span>
                    <span className="text-orange-400">{formatPrice(maxPrice)}</span>
                  </div>
                  <input
                    type="range"
                    min="5000"
                    max="500000"
                    step="5000"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="w-full accent-orange-500 bg-slate-800 cursor-pointer"
                  />
                </div>

                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="w-full py-3 bg-orange-500 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider mt-4"
                >
                  Voir les résultats ({products.length})
                </button>
              </div>
            </div>
          )}

          {/* Grille Principale de Produits */}
          <main className="flex-1 space-y-6">
            {/* Barre de Tri & Trigger Filtre Mobile */}
            <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex justify-between items-center gap-3">
              <button
                onClick={() => setMobileFilterOpen(true)}
                className="lg:hidden flex items-center gap-2 px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-orange-400 font-bold"
              >
                <SlidersHorizontal size={14} /> Filtres
              </button>
              <span className="text-xs text-slate-400 font-medium hidden sm:inline">Affichage des produits authentifiés</span>
              <div className="flex items-center gap-2 text-xs ml-auto">
                <span className="text-slate-400 hidden sm:inline">Trier par :</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white outline-none cursor-pointer focus:border-orange-500"
                >
                  <option value="newest">Plus récents</option>
                  <option value="price_asc">Prix croissant</option>
                  <option value="price_desc">Prix décroissant</option>
                </select>
              </div>
            </div>

            {/* Cartes Produits en Grille */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-72 bg-slate-900 rounded-3xl animate-pulse" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="glass-panel rounded-3xl border border-slate-800 p-16 text-center text-slate-400 space-y-3">
                <Filter className="w-12 h-12 text-slate-600 mx-auto" />
                <p className="font-bold text-white text-base">Aucun produit ne correspond à ces filtres</p>
                <p className="text-xs text-slate-500">Essayez de réinitialiser la recherche ou de modifier la catégorie sélectionnée.</p>
                <button
                  onClick={() => { setSelectedCategory(''); setMaxPrice(500000); }}
                  className="mt-2 inline-block px-5 py-2.5 bg-orange-500 text-slate-950 font-black rounded-xl text-xs hover:bg-orange-400 transition-colors"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className={`glass-card rounded-3xl overflow-hidden flex flex-col justify-between group border-slate-800 hover:border-orange-500/50 ${
                      product.isCultural ? 'border-kita-glow' : ''
                    }`}
                  >
                    <Link to={`/products/${product.id}`} className="block relative">
                      {product.isCultural && (
                        <span className="absolute top-3 left-3 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-[10px] font-black px-3 py-1 rounded-full z-10 shadow-lg uppercase tracking-wider">
                          🇨🇮 Pagne Baoulé
                        </span>
                      )}
                      <div className="h-52 bg-slate-900 overflow-hidden relative">
                        <img
                          src={(() => {
                            if (isValidImageUrl(product.image)) return product.image;
                            if (isValidImageUrl(product.image_url)) return product.image_url;
                            return getFallbackProductImage(product.name || product.title);
                          })()}
                          alt={product.name || product.title}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = getFallbackProductImage(product.name || product.title);
                          }}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        {product.isCultural && (
                          <div className="absolute inset-0 bg-amber-500/10 pointer-events-none animate-pagne-flash" />
                        )}
                        {product.oldPrice && (
                          <span className="absolute top-3 right-3 bg-orange-500 text-slate-950 text-[10px] font-black px-2.5 py-1 rounded-full shadow-md">
                            PROMO
                          </span>
                        )}
                        {/* Bouton Favori */}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            toggleFavorite(product);
                            toast[isFavorite(product.id) ? 'info' : 'success'](
                              isFavorite(product.id) ? 'Retiré des favoris.' : 'Ajouté aux favoris !'
                            );
                          }}
                          className={`absolute bottom-3 right-3 w-9 h-9 rounded-2xl flex items-center justify-center border transition-all shadow-lg ${
                            isFavorite(product.id)
                              ? 'bg-red-500 border-red-500 text-white shadow-red-500/30'
                              : 'bg-slate-950/80 border-slate-700 text-slate-400 hover:border-red-500/50 hover:text-red-400 backdrop-blur-sm'
                          }`}
                        >
                          <Heart size={16} className={isFavorite(product.id) ? 'fill-current' : ''} />
                        </button>
                      </div>
                      <div className="p-5 space-y-2">
                        <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">
                          {product.category_name || 'Catalogue'}
                        </span>
                        <h3 className="font-bold text-white text-sm truncate group-hover:text-orange-400 transition-colors">
                          {product.name || product.title}
                        </h3>
                        <div className="flex items-center gap-1 text-amber-400 text-xs">
                          <Star size={14} className="fill-current" />
                          <span className="font-bold text-slate-300">{product.rating || '4.8'}</span>
                        </div>
                        <div className="flex items-baseline gap-2 pt-1">
                          <span className="text-lg font-black text-orange-400">{formatPrice(product.price)}</span>
                          {product.oldPrice && (
                            <span className="text-xs text-slate-500 line-through">{formatPrice(product.oldPrice)}</span>
                          )}
                        </div>
                      </div>
                    </Link>

                    <div className="p-5 pt-0">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            toggleFavorite(product);
                            toast[isFavorite(product.id) ? 'info' : 'success'](
                              isFavorite(product.id) ? 'Retiré des favoris.' : 'Ajouté aux favoris !'
                            );
                          }}
                          className={`p-3 rounded-2xl border transition-all ${
                            isFavorite(product.id)
                              ? 'bg-red-500/10 border-red-500/50 text-red-500'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-red-500/50'
                          }`}
                        >
                          <Heart size={20} className={isFavorite(product.id) ? 'fill-current' : ''} />
                        </button>
                        <button
                          onClick={() => {
                            addItem(product);
                            toast.success('Produit ajouté au panier !');
                          }}
                          className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-black rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 text-xs"
                        >
                          <ShoppingCart size={16} /> Ajouter au Panier
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
