// src/pages/admin/AdminMarketingPage.jsx — Dark Premium Orange
import React, { useState } from 'react';
import { Megaphone, Plus, Trash2, Zap, Tag, X, Image, Calendar } from 'lucide-react';

const initialBanners = [
  {
    id: 'B-1',
    title: 'Soldes de Rentrée',
    subtitle: '-30% sur toute la mode et pagnes',
    active: true,
    color: 'from-orange-500 to-amber-500',
    badge: '🔥 Offre Vedette',
    productName: 'Robe de Gala en Pagne Kita',
    productPrice: 32000,
    productOldPrice: 42000,
    productImage: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&q=80',
    category: 'mode',
  },
  {
    id: 'B-2',
    title: 'Tech Week 5G',
    subtitle: 'Smartphones & accessoires haute performance',
    active: true,
    color: 'from-blue-600 to-cyan-500',
    badge: '⚡ Annonce Officielle',
    productName: 'Smartphone Pro Max 5G Ultra',
    productPrice: 250000,
    productOldPrice: 300000,
    productImage: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80',
    category: 'tech',
  },
  {
    id: 'B-3',
    title: 'Flash Beauté & Karité',
    subtitle: 'Offres limitées soin du terroir',
    active: true,
    color: 'from-purple-600 to-pink-500',
    badge: '✨ Beauté Terroir',
    productName: 'Sac à Main Cuir & Motif Pagne Luxe',
    productPrice: 28000,
    productOldPrice: 38000,
    productImage: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&q=80',
    category: 'mode',
  },
];

const QUICK_IMAGES = [
  { label: 'Pagne Kita', url: '/pagne_kita.jpg' },
  { label: 'Robe Mode', url: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&q=80' },
  { label: 'Smartphone 5G', url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80' },
  { label: 'Sneakers Sport', url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80' },
  { label: 'Sac Luxe', url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&q=80' },
  { label: 'Montre HD', url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80' },
];

const CATEGORY_OPTIONS = [
  { id: 'mode', label: 'Mode & Pagne Kita' },
  { id: 'tech', label: 'Électronique & High-Tech' },
  { id: 'chaussures', label: 'Chaussures & Baskets' },
  { id: 'maison', label: 'Maison & Cuisine' },
  { id: 'beaute', label: 'Beauté & Karité' },
  { id: 'alim', label: 'Épicerie & Terroir' },
];

const initialFlash = [
  { id: 'F-1', name: 'iPhone 15 Pro', originalPrice: 850000, salePrice: 680000, endsAt: '2026-08-31', stock: 5 },
  { id: 'F-2', name: 'AirPods Pro 2', originalPrice: 180000, salePrice: 135000, endsAt: '2026-08-29', stock: 12 },
];

const formatPrice = (p) => new Intl.NumberFormat('fr-CI').format(Number(p || 0)) + ' FCFA';
const discount = (o, s) => Math.round((1 - s / o) * 100);

const STORAGE_KEY = 'anouan_admin_banners';
const FLASH_STORAGE_KEY = 'anouan_admin_flash_sales';

export default function AdminMarketingPage() {
  const [banners, setBanners] = useState([]);
  const [flashSales, setFlashSales] = useState(initialFlash);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const bRes = await adminAPI.getBanners();
      const bData = bRes.data?.data || bRes.data || [];
      if (Array.isArray(bData) && bData.length > 0) {
        setBanners(bData.map((b) => ({
          id: b.id,
          title: b.title,
          subtitle: b.link_url || 'Offre exclusive',
          badge: '⚡ Annonce Officielle',
          color: 'from-orange-500 to-amber-500',
          active: b.is_active !== false,
          productName: b.title,
          productImage: b.image_url || 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&q=80',
          productPrice: 25000,
          productOldPrice: 35000,
          category: 'mode',
        })));
      } else {
        setBanners(initialBanners);
      }
    } catch {
      setBanners(initialBanners);
    }

    try {
      const fRes = await adminAPI.getFlashSales();
      const fData = fRes.data?.data || fRes.data || [];
      if (Array.isArray(fData) && fData.length > 0) {
        setFlashSales(fData.map(f => ({
          id: f.id,
          name: f.product_title || 'Article Flash',
          originalPrice: Number(f.flash_price ? f.flash_price * 1.3 : 30000),
          salePrice: Number(f.flash_price || 20000),
          endsAt: f.ends_at,
          stock: 10,
        })));
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const [showBannerForm, setShowBannerForm] = useState(false);
  const [showFlashForm, setShowFlashForm] = useState(false);
  const [newBanner, setNewBanner] = useState({
    title: '',
    subtitle: '',
    badge: '⚡ Annonce Officielle',
    color: 'from-orange-500 to-amber-500',
    productName: '',
    productPrice: '',
    productOldPrice: '',
    productImage: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&q=80',
    category: 'mode',
  });
  const [newFlash, setNewFlash] = useState({
    name: '',
    originalPrice: '',
    salePrice: '',
    endsAt: '2026-09-30',
    stock: 10,
    image: '',
  });

  const toggleBanner = async (id) => {
    setBanners(prev => prev.map(b => b.id === id ? { ...b, active: !b.active } : b));
    window.dispatchEvent(new Event('anouan_banners_updated'));
  };

  const deleteBanner = async (id) => {
    try {
      await adminAPI.deleteBanner(id);
    } catch {}
    setBanners(prev => prev.filter(b => b.id !== id));
    window.dispatchEvent(new Event('anouan_banners_updated'));
  };

  const deleteFlash = async (id) => {
    try {
      await adminAPI.deleteFlashSale(id);
    } catch {}
    setFlashSales(prev => prev.filter(f => f.id !== id));
    window.dispatchEvent(new Event('anouan_flash_sales_updated'));
  };

  const addFlash = () => {
    if (!newFlash.name || !newFlash.salePrice) return;
    const itemToAdd = {
      id: `F-${Date.now()}`,
      name: newFlash.name,
      originalPrice: Number(newFlash.originalPrice || newFlash.salePrice * 1.3),
      salePrice: Number(newFlash.salePrice),
      endsAt: newFlash.endsAt || '2026-09-30',
      stock: Number(newFlash.stock || 5),
      image: newFlash.image || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80',
    };
    const updated = [itemToAdd, ...flashSales];
    saveFlashSales(updated);
    setNewFlash({ name: '', originalPrice: '', salePrice: '', endsAt: '2026-09-30', stock: 10, image: '' });
    setShowFlashForm(false);
  };

  const addBanner = async () => {
    if (!newBanner.title) return;
    try {
      await adminAPI.createBanner({
        title: newBanner.title,
        imageUrl: newBanner.productImage || 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&q=80',
        linkUrl: `/catalog?cat=${newBanner.category || 'mode'}`,
        position: banners.length + 1,
      });
      await loadData();
    } catch (e) {
      alert('Erreur enregistrement de la bannière.');
    }
    setNewBanner({
      title: '',
      subtitle: '',
      badge: '⚡ Annonce Officielle',
      color: 'from-orange-500 to-amber-500',
      productName: '',
      productPrice: '',
      productOldPrice: '',
      productImage: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&q=80',
      category: 'mode',
    });
    setShowBannerForm(false);
  };

  return (
    <div className="space-y-8 text-slate-100">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">📣 Marketing & Promotions</h1>
        <p className="text-slate-400 text-xs mt-1">Gérez les bannières publicitaires avec produit vedette intégré et les ventes flash. 🚀</p>
      </div>

      {/* Bannières */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-orange-500/20 rounded-xl"><Image size={14} className="text-orange-400"/></div>
            <div>
              <h2 className="text-sm font-black text-white">🖼️ Bannières Publicitaires d'Accueil</h2>
              <p className="text-[11px] text-slate-400">Chaque bannière affiche son produit vedette et filtre le catalogue au clic. 🛍️</p>
            </div>
          </div>
          <button onClick={() => setShowBannerForm(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-orange-500 text-white text-xs font-bold rounded-2xl hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20">
            <Plus size={13}/> ✨ Nouvelle bannière
          </button>
        </div>

        {showBannerForm && (
          <div className="bg-slate-900/90 border border-orange-500/30 rounded-3xl p-5 mb-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <p className="text-xs font-black text-orange-400 uppercase tracking-wider">✨ Créer une Bannière avec Produit Vedette</p>
              <button onClick={() => setShowBannerForm(false)} className="text-slate-500 hover:text-white">
                <X size={16} />
              </button>
            </div>

            {/* Informations bannière */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                value={newBanner.title}
                onChange={(e) => setNewBanner(p => ({ ...p, title: e.target.value }))}
                placeholder="Titre de la bannière (ex: Soldes Spéciale Bouaké)"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-orange-500 outline-none"
              />
              <input
                value={newBanner.subtitle}
                onChange={(e) => setNewBanner(p => ({ ...p, subtitle: e.target.value }))}
                placeholder="Sous-titre / Slogan (ex: -30% sur tous les articles)"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-orange-500 outline-none"
              />
            </div>

            {/* Badge et Rayon */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                value={newBanner.badge}
                onChange={(e) => setNewBanner(p => ({ ...p, badge: e.target.value }))}
                placeholder="Texte du badge (ex: 🔥 Offre Vedette, ⚡ Annonce)"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-orange-500 outline-none"
              />
              <select
                value={newBanner.category}
                onChange={(e) => setNewBanner(p => ({ ...p, category: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:border-orange-500 outline-none cursor-pointer"
              >
                {CATEGORY_OPTIONS.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.label}</option>
                ))}
              </select>
            </div>

            {/* Produit vedette associé */}
            <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 space-y-3">
              <p className="text-[11px] font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Tag size={13} /> 🏷️ Produit affiché dans la bannière
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  value={newBanner.productName}
                  onChange={(e) => setNewBanner(p => ({ ...p, productName: e.target.value }))}
                  placeholder="Nom du produit (ex: Robe Gala Pagne)"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-orange-500 outline-none"
                />
                <input
                  type="number"
                  value={newBanner.productPrice}
                  onChange={(e) => setNewBanner(p => ({ ...p, productPrice: e.target.value }))}
                  placeholder="Prix promo (FCFA)"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-orange-500 outline-none"
                />
                <input
                  type="number"
                  value={newBanner.productOldPrice}
                  onChange={(e) => setNewBanner(p => ({ ...p, productOldPrice: e.target.value }))}
                  placeholder="Prix barré (FCFA)"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-orange-500 outline-none"
                />
              </div>

              {/* Image URL et presets rapides */}
              <div className="space-y-2">
                <input
                  value={newBanner.productImage}
                  onChange={(e) => setNewBanner(p => ({ ...p, productImage: e.target.value }))}
                  placeholder="URL de l'image du produit"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-orange-500 outline-none"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] text-slate-500">🖼️ Choisir un exemple :</span>
                  {QUICK_IMAGES.map((img) => (
                    <button
                      key={img.label}
                      type="button"
                      onClick={() => setNewBanner(p => ({ ...p, productImage: img.url }))}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    >
                      {img.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Choix de la couleur de la bannière */}
            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1.5">🎨 Couleur du thème</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Orange Solaire', color: 'from-orange-500 to-amber-500' },
                  { label: 'Bleu Tech', color: 'from-blue-600 to-cyan-500' },
                  { label: 'Pourpre Royal', color: 'from-purple-600 to-pink-500' },
                  { label: 'Émeraude Terroir', color: 'from-emerald-600 to-teal-500' },
                  { label: 'Rouge Flash', color: 'from-red-600 to-orange-500' },
                ].map((c) => (
                  <button
                    key={c.color}
                    type="button"
                    onClick={() => setNewBanner(p => ({ ...p, color: c.color }))}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-bold text-white bg-gradient-to-r ${c.color} transition-all ${
                      newBanner.color === c.color ? 'ring-2 ring-white scale-105 shadow-lg' : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={addBanner} className="px-5 py-2.5 bg-orange-500 text-white text-xs font-bold rounded-2xl hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20">🚀 Créer la bannière</button>
              <button onClick={() => setShowBannerForm(false)} className="px-4 py-2.5 text-slate-400 text-xs font-bold hover:bg-slate-800 rounded-2xl transition-colors">❌ Annuler</button>
            </div>
          </div>
        )}

        {/* Liste des Bannières */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {banners.map((banner) => (
            <div key={banner.id} className={`relative bg-gradient-to-br ${banner.color} rounded-3xl p-5 overflow-hidden shadow-xl border border-white/10 flex flex-col justify-between`}>
              <div className="absolute inset-0 bg-slate-950/25 pointer-events-none"/>
              <div className="relative z-10 space-y-3">
                {/* Status & Delete */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-1.5">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                      banner.active ? 'bg-white/20 text-white border-white/30' : 'bg-black/30 text-white/60 border-white/10'
                    }`}>{banner.active ? '🟢 Actif sur le site' : '⚪ Inactif'}</span>
                    {banner.category && (
                      <span className="px-2 py-0.5 rounded-lg bg-black/40 text-[9px] font-bold text-amber-300 uppercase">
                        🛒 Rayon {banner.category}
                      </span>
                    )}
                  </div>
                  <button onClick={() => deleteBanner(banner.id)} className="p-1.5 bg-black/20 hover:bg-black/40 rounded-xl transition-colors">
                    <Trash2 size={13} className="text-white/70"/>
                  </button>
                </div>

                {/* Titre & Sous-titre */}
                <div>
                  <h3 className="text-base font-black text-white leading-tight">{banner.title}</h3>
                  <p className="text-white/80 text-xs mt-0.5">{banner.subtitle}</p>
                </div>

                {/* Preview Produit intégré */}
                {banner.productName && (
                  <div className="bg-slate-950/70 backdrop-blur-md rounded-2xl p-3 border border-white/15 flex items-center gap-3">
                    <img
                      src={banner.productImage || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80'}
                      alt={banner.productName}
                      className="w-14 h-14 rounded-xl object-cover border border-white/20 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-black text-white truncate">{banner.productName}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-black text-orange-400">{formatPrice(banner.productPrice)}</span>
                        {banner.productOldPrice && (
                          <span className="text-[10px] text-slate-400 line-through">{formatPrice(banner.productOldPrice)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Bouton bascule Activer/Désactiver */}
              <div className="relative z-10 pt-4">
                <button onClick={() => toggleBanner(banner.id)}
                  className="w-full py-2 bg-white/20 hover:bg-white/30 text-white text-[11px] font-bold rounded-xl transition-colors border border-white/20 shadow-sm">
                  {banner.active ? '⏸️ Désactiver du site' : '▶️ Activer sur le site'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Flash Sales */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-red-500/20 rounded-xl"><Zap size={14} className="text-red-400"/></div>
            <h2 className="text-sm font-black text-white">⚡ Ventes Flash</h2>
          </div>
          <button onClick={() => setShowFlashForm(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 border border-red-500/25 text-red-400 text-xs font-bold rounded-2xl hover:bg-red-500/20 transition-colors">
            <Plus size={13}/> ➕ Ajouter
          </button>
        </div>

        {showFlashForm && (
          <div className="bg-slate-900/80 border border-red-500/30 rounded-3xl p-5 mb-4 space-y-3">
            <p className="text-xs font-black text-red-400 uppercase tracking-wider">🔥 Nouveau produit en vente flash</p>
            <input
              value={newFlash.name}
              onChange={(e) => setNewFlash(p => ({ ...p, name: e.target.value }))}
              placeholder="Nom du produit (ex: iPhone 15 Pro, Sneakers...)"
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-red-500 outline-none"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="number"
                value={newFlash.originalPrice}
                onChange={(e) => setNewFlash(p => ({ ...p, originalPrice: e.target.value }))}
                placeholder="Prix original (FCFA)"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-red-500 outline-none"
              />
              <input
                type="number"
                value={newFlash.salePrice}
                onChange={(e) => setNewFlash(p => ({ ...p, salePrice: e.target.value }))}
                placeholder="Prix flash / promo (FCFA)"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-red-500 outline-none"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="date"
                value={newFlash.endsAt}
                onChange={(e) => setNewFlash(p => ({ ...p, endsAt: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-red-500 outline-none"
              />
              <input
                type="number"
                value={newFlash.stock}
                onChange={(e) => setNewFlash(p => ({ ...p, stock: e.target.value }))}
                placeholder="Stock disponible"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-red-500 outline-none"
              />
              <input
                value={newFlash.image}
                onChange={(e) => setNewFlash(p => ({ ...p, image: e.target.value }))}
                placeholder="URL de l'image (optionnel)"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-red-500 outline-none"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={addFlash} className="px-4 py-2 bg-red-500 text-white text-xs font-bold rounded-2xl hover:bg-red-600 transition-colors">💾 Enregistrer</button>
              <button onClick={() => setShowFlashForm(false)} className="px-4 py-2 text-slate-400 text-xs font-bold hover:bg-slate-800 rounded-2xl transition-colors">❌ Annuler</button>
            </div>
          </div>
        )}

        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-900/80 text-slate-500 text-[10px] uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-5 py-4 font-bold">📦 Produit</th>
                <th className="px-5 py-4 font-bold">💰 Prix original</th>
                <th className="px-5 py-4 font-bold">🔥 Prix flash</th>
                <th className="px-5 py-4 font-bold">🏷️ Réduction</th>
                <th className="px-5 py-4 font-bold">⏰ Expire le</th>
                <th className="px-5 py-4 font-bold">📊 Stock</th>
                <th className="px-5 py-4 font-bold text-right">⚙️ Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {flashSales.map((f) => (
                <tr key={f.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-5 py-4 font-bold text-white">{f.name}</td>
                  <td className="px-5 py-4 text-slate-500 line-through">{formatPrice(f.originalPrice)}</td>
                  <td className="px-5 py-4 font-black text-orange-400">{formatPrice(f.salePrice)}</td>
                  <td className="px-5 py-4">
                    <span className="px-2 py-1 bg-red-500/15 text-red-400 border border-red-500/25 rounded-full text-[10px] font-black">
                      -{discount(f.originalPrice, f.salePrice)}%
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-400 flex items-center gap-1">
                    <Calendar size={12} className="text-slate-600"/> {f.endsAt}
                  </td>
                  <td className="px-5 py-4 text-slate-300">{f.stock} unités</td>
                  <td className="px-5 py-4 text-right">
                    <button onClick={() => deleteFlash(f.id)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors">
                      <Trash2 size={14}/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
