// src/pages/client/HomePage.jsx
// Design Expert Frontend avec Thème Culturel Ivoirien (Pagne Kita / Baoulé Clignotant & Gradients Lumineux)

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingCart, Star, Clock, CheckCircle, ShieldCheck, MapPin, ChevronRight, ChevronLeft,
  ArrowRight, Zap, Sparkles, TrendingUp, Smartphone, Shirt, Home as HomeIcon, Sparkle,
  ShoppingBag, Flame, Award, Heart, Plus
} from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useProducts, getFallbackProductImage } from '../../contexts/ProductContext';
import { productsAPI, categoriesAPI, adminAPI } from '../../services/api';
import { PaymentMethodsRow } from '../../components/ui/PaymentLogos';
import Emoji from '../../components/ui/Emoji';

const formatPrice = (p) => typeof p === 'number' ? new Intl.NumberFormat('fr-CI').format(p) + ' FCFA' : p;

// Vraies images HD Unsplash / Studio pour chaque produit
const IMAGES = {
  smartphone: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80',
  sneakers: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80',
  smartwatch: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80',
  earbuds: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=600&q=80',
  dress: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=600&q=80',
  handbag: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=80',
  cookware: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=600&q=80',
  blender: 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=600&q=80',
  pagneKita: '/pagne_kita.jpg',
};

const DEFAULT_FLASH_PRODUCTS = [
  { id: 'default_1', name: 'Smartphone Pro Max 5G Ultra', price: 250000, oldPrice: 300000, rating: 4.8, image: IMAGES.smartphone },
  { id: 'default_2', name: 'Sneakers Urban Confort', price: 15000, oldPrice: 25000, rating: 4.5, image: IMAGES.sneakers },
  { id: 'default_3', name: 'Montre Connectée Sport HD', price: 20000, oldPrice: 35000, rating: 4.9, image: IMAGES.smartwatch },
  { id: 'default_4', name: 'Écouteurs Sans Fil Pro Noise-Cancelling', price: 10000, oldPrice: 15000, rating: 4.2, image: IMAGES.earbuds }
];

const DEFAULT_FEATURED_PRODUCTS = [
  { id: 'default_5', name: 'Robe d\'été en Pagne Kita Baoulé', price: 18000, rating: 4.9, image: IMAGES.pagneKita, tag: 'Artisanat CI' },
  { id: 'default_6', name: 'Sac à Main Cuir & Motif Pagne Luxe', price: 28000, rating: 4.8, image: IMAGES.handbag, tag: 'Authentique' },
  { id: 'default_7', name: 'Ensemble Casseroles Inox Premium', price: 45000, rating: 4.7, image: IMAGES.cookware, tag: 'Maison' },
  { id: 'default_8', name: 'Mixeur Plongeant Multifonction 800W', price: 18000, rating: 4.4, image: IMAGES.blender, tag: 'High-Tech' }
];

const HomePage = () => {
  const { addItem } = useCart();
  const { products: contextProducts } = useProducts();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [flashProducts, setFlashProducts] = useState(DEFAULT_FLASH_PRODUCTS);
  const [featuredProducts, setFeaturedProducts] = useState(DEFAULT_FEATURED_PRODUCTS);

  // Chargement des ventes flash (depuis l'API ou le contexte)
  const loadActiveFlashProducts = useCallback(() => {
    adminAPI.getPublicFlashSales().then(res => {
      const items = res.data?.data || res.data || [];
      if (Array.isArray(items) && items.length > 0) {
        setFlashProducts(items.map((item, idx) => ({
          id: item.id || `flash-db-${idx}`,
          name: item.product_title || 'Article Flash',
          title: item.product_title || 'Article Flash',
          price: Number(item.flash_price || 20000),
          oldPrice: Number(item.flash_price ? item.flash_price * 1.3 : 30000),
          rating: 4.9,
          image: IMAGES.smartphone,
          stock: 10,
          endsAt: item.ends_at,
        })));
        return;
      }
    }).catch(() => null);

    if (contextProducts.length > 0) {
      const flash = contextProducts.filter(p => p.flash_sale_active || p.flashSaleActive);
      if (flash.length > 0) {
        setFlashProducts(flash.slice(0, 4));
        return;
      }
    }
  }, [contextProducts]);

  useEffect(() => {
    setFlashProducts(loadActiveFlashProducts());
    if (contextProducts.length > 0) {
      setFeaturedProducts(contextProducts);
    }
  }, [contextProducts, loadActiveFlashProducts]);

  // Écoute les mises à jour des ventes flash de l'Admin en temps réel
  useEffect(() => {
    const handleFlashUpdate = () => {
      setFlashProducts(loadActiveFlashProducts());
    };
    window.addEventListener('storage', handleFlashUpdate);
    window.addEventListener('anouan_flash_sales_updated', handleFlashUpdate);
    return () => {
      window.removeEventListener('storage', handleFlashUpdate);
      window.removeEventListener('anouan_flash_sales_updated', handleFlashUpdate);
    };
  }, [loadActiveFlashProducts]);

  const mapBannerToSlide = (b, idx) => ({
    id: b.id || `banner-${idx}`,
    badge: b.badge || '⚡ Offre Spéciale',
    title: b.title,
    subtitle: b.subtitle,
    gradient: b.color || 'from-orange-500 to-amber-500',
    hasPagneBg: true,
    productName: b.productName || 'Robe de Gala en Pagne Kita',
    productPrice: b.productPrice ? Number(b.productPrice) : 32000,
    productOldPrice: b.productOldPrice ? Number(b.productOldPrice) : null,
    productImage: b.productImage || 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&q=80',
    category: b.category || 'mode',
  });

  const DEFAULT_SLIDES = [
    {
      id: 'default-1',
      badge: '🇨🇮 Culture & Innovation à Bouaké',
      title: 'Achetez en Ligne, Retirez en Toute Sécurité',
      subtitle: 'Contrôle qualité systématique en magasin central et retrait sécurisé par code unique anti-fraude.',
      gradient: 'from-orange-600 via-amber-600 to-orange-500',
      hasPagneBg: true,
      productName: 'Robe de Gala en Pagne Kita',
      productPrice: 32000,
      productOldPrice: 42000,
      productImage: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&q=80',
      category: 'mode',
    },
    {
      id: 'default-2',
      badge: '🔥 Offres Exclusives & Culture Ivoirienne',
      title: 'Ventes Flash Quotidiennes Jusqu\'à -50%',
      subtitle: 'Chaque jour, de nouvelles offres sur la mode, l\'électronique et les produits locaux ivoiriens.',
      gradient: 'from-rose-600 via-orange-500 to-amber-500',
      hasPagneBg: false,
      productName: 'Smartphone Pro Max 5G Ultra',
      productPrice: 200000,
      productOldPrice: 250000,
      productImage: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80',
      category: 'electronique',
    },
  ];

  // Bannières actives depuis la base de données
  const [activeBanners, setActiveBanners] = useState([]);
  const [slides, setSlides] = useState(DEFAULT_SLIDES);

  const loadBannersFromDB = useCallback(async () => {
    try {
      const res = await adminAPI.getPublicBanners();
      const bData = res.data?.data || res.data || [];
      if (Array.isArray(bData) && bData.length > 0) {
        const activeOnes = bData.filter(b => b.is_active !== false);
        if (activeOnes.length > 0) {
          const mapped = activeOnes.map((b) => ({
            id: b.id,
            title: b.title || 'Grand Arrivage Anouan Express',
            subtitle: 'Retrait rapide dans votre magasin central de Bouaké.',
            badge: '⚡ Annonce Officielle',
            gradient: 'from-orange-500 to-amber-500',
            hasPagneBg: true,
            productName: b.title,
            productPrice: 25000,
            productOldPrice: 35000,
            productImage: b.image_url || IMAGES.pagneKita,
            category: 'mode',
          }));
          setSlides(mapped);
          setActiveBanners(activeOnes);
          return;
        }
      }
    } catch (e) {
      console.error('Erreur chargement bannières depuis DB:', e);
    }
    setSlides(DEFAULT_SLIDES);
  }, []);

  // Écoute les modifications faites sur l'admin en temps réel
  useEffect(() => {
    loadBannersFromDB();
    const handleBannersUpdate = () => {
      loadBannersFromDB();
      loadActiveFlashProducts();
    };

    window.addEventListener('anouan_banners_updated', handleBannersUpdate);
    window.addEventListener('anouan_flash_sales_updated', handleBannersUpdate);
    return () => {
      window.removeEventListener('anouan_banners_updated', handleBannersUpdate);
      window.removeEventListener('anouan_flash_sales_updated', handleBannersUpdate);
    };
  }, [loadBannersFromDB, loadActiveFlashProducts]);

  // Catégories vectorielles professionnelles avec la culture ivoirienne
  const categories = [
    { id: 'mode', name: 'Mode & Pagne Kita', icon: Shirt, count: '350+ Produits', color: 'from-orange-500/20 to-amber-500/20 text-orange-400 border-orange-500/30' },
    { id: 'elec', name: 'Électronique', icon: Smartphone, count: '120+ Produits', color: 'from-blue-500/20 to-cyan-500/20 text-cyan-400 border-cyan-500/30' },
    { id: 'maison', name: 'Maison & Artisanat', icon: HomeIcon, count: '180+ Produits', color: 'from-amber-500/20 to-yellow-500/20 text-amber-400 border-amber-500/30' },
    { id: 'beaute', name: 'Beauté & Karité', icon: Sparkle, count: '90+ Produits', color: 'from-purple-500/20 to-violet-500/20 text-purple-400 border-purple-500/30' },
    { id: 'alim', name: 'Épicerie & Terroir CI', icon: ShoppingBag, count: '220+ Produits', color: 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30' }
  ];

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const [timeLeft, setTimeLeft] = useState({ hours: 12, mins: 45, secs: 30 });
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.secs > 0) return { ...prev, secs: prev.secs - 1 };
        if (prev.mins > 0) return { ...prev, mins: prev.mins - 1, secs: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, mins: 59, secs: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-16 pb-20">
      {/* 🇨🇮 Hero Banner Section avec Pagne Kita Clignotant & Lumineux et Produit Vedette */}
      <section className="relative min-h-[580px] lg:h-[620px] overflow-hidden rounded-b-[40px] border-b border-orange-500/30 shadow-2xl border-kita-glow flex items-center">
        {slides.map((slide, index) => {
          const productTargetUrl = slide.productName
            ? `/catalog?category=${slide.category || ''}&q=${encodeURIComponent(slide.productName)}`
            : (slide.category ? `/catalog?category=${slide.category}` : '/catalog');

          return (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-1000 bg-gradient-to-br ${slide.gradient} flex items-center justify-center ${
                index === currentSlide ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            >
              {/* 🌟 Fond Image du Pagne Ivoirien avec Animation Clignotante & Pulsante */}
              {slide.hasPagneBg && (
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <img
                    src={IMAGES.pagneKita}
                    alt="Pagne Kita Baoulé Ivoirien"
                    className="w-full h-full object-cover opacity-45 mix-blend-overlay animate-pagne-flash scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
                  <div className="absolute inset-0 bg-radial-gradient from-amber-500/10 via-transparent to-slate-950/80" />
                </div>
              )}

              {/* Motif décoratif Kita sur les côtés */}
              <div className="absolute top-4 left-4 right-4 h-1 bg-gradient-to-r from-orange-500 via-amber-400 to-emerald-500 rounded-full opacity-75 shadow-lg shadow-orange-500/50 animate-pulse" />

              <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  
                  {/* Colonne Gauche : Titre, Slogan, Badges, CTA */}
                  <div className="lg:col-span-7 text-center lg:text-left space-y-4">
                    {/* 📢 Bandeau Promotionnel Dynamique situé JUSTE AU-DESSUS du badge / annonce officielle */}
                    {activeBanners.length > 0 && (
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-950/85 border border-white/20 backdrop-blur-xl shadow-2xl animate-fade-in mx-auto lg:mx-0">
                        <div className={`w-2.5 h-2.5 rounded-full bg-gradient-to-r ${slide.gradient} animate-ping shrink-0`} />
                        <span className="text-xs sm:text-sm font-black text-white tracking-wide">
                          🎁 {slide.title} — <span className="text-amber-300 font-bold">{slide.subtitle}</span>
                        </span>
                        <Link
                          to={productTargetUrl}
                          className="ml-2 px-2.5 py-1 rounded-xl bg-white/15 hover:bg-white/30 text-white text-[11px] font-black uppercase tracking-wider transition-colors"
                        >
                          Voir &rarr;
                        </Link>
                      </div>
                    )}

                    {/* Badge d'Authenticité Ivoirienne / Annonce Officielle */}
                    <div>
                      <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-slate-900/90 border border-amber-500/40 text-amber-300 text-xs font-black uppercase tracking-widest shadow-xl backdrop-blur-md border-kita-glow">
                        <Sparkles size={16} className="text-amber-400 animate-pulse" /> {slide.badge}
                      </span>
                    </div>

                    <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight drop-shadow-lg">
                      {slide.title}
                    </h1>

                    <p className="text-sm sm:text-base md:text-lg text-slate-200 font-medium leading-relaxed drop-shadow-md max-w-xl mx-auto lg:mx-0">
                      {slide.subtitle}
                    </p>

                    <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-3">
                      <Link
                        to={productTargetUrl}
                        className="inline-flex items-center gap-2.5 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-black py-3.5 px-6 rounded-2xl shadow-2xl shadow-orange-500/30 transition-all hover:scale-105 text-xs sm:text-sm uppercase tracking-wider"
                      >
                        <ShoppingBag size={18} /> Voir l'Offre &amp; Produits
                      </Link>
                      <Link
                        to={slide.category ? `/catalog?category=${slide.category}` : '/catalog'}
                        className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs sm:text-sm backdrop-blur-md border border-white/20 transition-all"
                      >
                        Explorer le Catalogue <ArrowRight size={16} />
                      </Link>
                    </div>
                  </div>

                  {/* Colonne Droite : Carte Produit Vedette intégrée à la bannière */}
                  {slide.productName && (
                    <div className="lg:col-span-5 flex justify-center">
                      <div className="relative group w-full max-w-xs sm:max-w-sm bg-slate-950/85 backdrop-blur-xl border border-white/20 rounded-3xl p-4 sm:p-5 shadow-2xl hover:border-amber-400/60 transition-all">
                        {/* Badge promo / vedette */}
                        <div className="absolute top-3 right-3 z-10 flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-red-600 to-orange-500 text-white text-[10px] font-black uppercase shadow-lg">
                          <Zap size={11} className="animate-pulse" />
                          {slide.productOldPrice && slide.productPrice ? (
                            <span>-{Math.round((1 - slide.productPrice / slide.productOldPrice) * 100)}%</span>
                          ) : (
                            <span>En Vedette</span>
                          )}
                        </div>

                        {/* Image du produit */}
                        <div className="w-full h-44 sm:h-48 rounded-2xl overflow-hidden bg-slate-900 relative mb-3 border border-slate-800">
                          <img
                            src={slide.productImage || IMAGES.smartphone}
                            alt={slide.productName}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => { e.target.src = IMAGES.smartphone; }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                          {slide.category && (
                            <span className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-[10px] font-bold text-amber-300 border border-white/15 uppercase">
                              Rayon {slide.category}
                            </span>
                          )}
                        </div>

                        {/* Titre & Prix */}
                        <div className="text-left space-y-1">
                          <h3 className="text-sm sm:text-base font-black text-white truncate group-hover:text-amber-300 transition-colors">
                            {slide.productName}
                          </h3>
                          <div className="flex items-baseline gap-2">
                            {slide.productPrice && (
                              <span className="text-lg sm:text-xl font-black text-orange-400">
                                {formatPrice(slide.productPrice)}
                              </span>
                            )}
                            {slide.productOldPrice && (
                              <span className="text-xs text-slate-400 line-through">
                                {formatPrice(slide.productOldPrice)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Boutons d'achat direct et ajout au panier */}
                        <div className="mt-4 flex gap-2">
                          <Link
                            to={productTargetUrl}
                            className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider text-center transition-all shadow-lg shadow-orange-500/30 flex items-center justify-center gap-1.5"
                          >
                            <ShoppingCart size={14} /> Voir dans le catalogue
                          </Link>
                          <button
                            onClick={() => addItem({
                              id: slide.id || `banner-prod-${Date.now()}`,
                              name: slide.productName,
                              price: slide.productPrice || 25000,
                              image: slide.productImage || IMAGES.smartphone,
                            })}
                            title="Ajouter au panier"
                            className="p-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-all border border-white/20 flex items-center justify-center"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>

              {/* Indicateur de Slide */}
              <div className="absolute bottom-4 flex gap-2 z-20">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentSlide(i)}
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      i === currentSlide ? 'w-8 bg-amber-400 shadow-lg shadow-amber-400/50' : 'w-2.5 bg-white/30'
                    }`}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </section>

      {/* 📜 Bandeau Culturel Ivoirien & Savoir-Faire de Bouaké */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-950/80 via-slate-900 to-orange-950/80 border border-amber-500/30 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl border-kita-glow">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl overflow-hidden border-2 border-amber-400 shadow-xl shrink-0 relative group">
              <img src={IMAGES.pagneKita} alt="Artisanat Baoulé" className="w-full h-full object-cover animate-pagne-flash" />
              <div className="absolute inset-0 bg-orange-500/20 mix-blend-overlay" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-amber-400 text-xs font-black uppercase tracking-widest mb-1">
                <Award size={14} className="text-amber-400 animate-bounce" /> Patrimoine & Artisanat de Côte d'Ivoire
              </div>
              <h3 className="text-xl md:text-2xl font-black text-white">Célébrons le Tissage Traditionnel Kita & Baoulé</h3>
              <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-xl">
                Retrouvez nos créations exclusives en pagne tissé fait main par les maîtres artisans de la région du Gbeke & de Bouaké.
              </p>
            </div>
          </div>

          <Link
            to="/catalog?category=mode"
            className="shrink-0 px-6 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg hover:scale-105 transition-transform flex items-center gap-2"
          >
            Découvrir les Pagnes <ChevronRight size={16} />
          </Link>
        </div>
      </section>

      {/* Trust Pillars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6 rounded-3xl flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 shrink-0">
              <ShoppingCart size={24} />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">1. Commande Simple</h3>
              <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                Parcourez le catalogue et validez votre panier en toute sérénité.
              </p>
            </div>
          </div>

          <div className="glass-card p-6 rounded-3xl flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 shrink-0">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">2. Contrôle Qualité</h3>
              <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                Chaque article est vérifié par nos agents au magasin central de Bouaké.
              </p>
            </div>
          </div>

          <div className="glass-card p-6 rounded-3xl flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 shrink-0">
              <CheckCircle size={24} />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">3. Retrait par Code Unique</h3>
              <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                Récupérez votre colis instantanément grâce à votre code sécurisé.
              </p>
            </div>
          </div>
        </div>
      </section>
      {/* 💳 Moyens de Paiement Sécurisés CI avec Logos */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
              <ShieldCheck size={20} className="text-orange-400" />
            </div>
            <div>
              <p className="text-white font-black text-sm flex items-center gap-1.5">Paiements Sécurisés <Emoji e="🇨🇮" size={18} /></p>
              <p className="text-slate-400 text-xs">Mobile Money · Sans frais cachés · Transaction cryptée</p>
            </div>
          </div>
          <PaymentMethodsRow size={30} showLabel={true} className="gap-2 flex-wrap justify-center sm:justify-end" />
        </div>
      </section>

      {/* Catégories Principales */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-2xl font-black text-white">Catégories Principales</h2>
            <p className="text-slate-400 text-xs mt-1">Explorez les meilleurs articles à Bouaké & en Côte d'Ivoire</p>
          </div>
          <Link to="/catalog" className="text-orange-400 text-xs font-bold hover:underline flex items-center gap-1">
            Voir tout <ChevronRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {categories.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <Link
                key={idx}
                to={`/catalog?category=${cat.id}`}
                className="glass-card p-6 rounded-3xl text-center group cursor-pointer border border-slate-800 hover:border-orange-500/40 flex flex-col items-center justify-center transition-all duration-300"
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${cat.color} border flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  <Icon size={28} />
                </div>
                <h3 className="font-bold text-white text-sm group-hover:text-orange-400 transition-colors">{cat.name}</h3>
                <p className="text-[11px] text-slate-500 mt-1">{cat.count}</p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ⚡ Ventes Flash Section avec Arrière-plan Pagne Clignotant */}
      <section className="relative overflow-hidden bg-gradient-to-r from-orange-950/80 via-slate-900 to-amber-950/80 border-y border-orange-500/40 py-14">
        {/* Motif d'arrière-plan Pagne Ivoirien Clignotant pour Ventes Flash */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
          <img
            src={IMAGES.pagneKita}
            alt="Motif Pagne Ventes Flash"
            className="w-full h-full object-cover animate-pagne-flash mix-blend-overlay"
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 text-amber-400 text-xs font-black uppercase tracking-widest mb-1">
                <Flame size={18} className="fill-current text-orange-500 animate-bounce" /> Offres Limitées du Jour
              </div>
              <h2 className="text-3xl font-black text-white tracking-tight">Ventes Flash Quotidiennes</h2>
            </div>

            {/* Compteur Ventes Flash */}
            <div className="flex items-center gap-3 bg-slate-950/90 border border-amber-500/40 px-6 py-3 rounded-2xl shadow-2xl border-kita-glow">
              <Clock className="w-5 h-5 text-amber-400 animate-spin" style={{ animationDuration: '8s' }} />
              <div className="flex items-center gap-1.5 text-amber-400 font-mono font-black text-xl">
                <span>{String(timeLeft.hours).padStart(2, '0')}</span>:
                <span>{String(timeLeft.mins).padStart(2, '0')}</span>:
                <span>{String(timeLeft.secs).padStart(2, '0')}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {flashProducts.map((product) => (
              <div key={product.id} className="glass-card rounded-3xl overflow-hidden flex flex-col justify-between group border-slate-800 hover:border-orange-500/50">
                <Link to={`/products/${product.id}`} className="block relative">
                  <span className="absolute top-3 right-3 bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 text-[10px] font-black px-3 py-1 rounded-full z-10 shadow-lg uppercase tracking-wider">
                    PROMO -50%
                  </span>
                  <div className="h-52 bg-slate-900/80 overflow-hidden relative">
                    <img
                      src={product.image || getFallbackProductImage(product.name)}
                      alt={product.name}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = getFallbackProductImage(product.name);
                      }}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-5 space-y-2">
                    <h3 className="font-bold text-white text-sm truncate group-hover:text-orange-400 transition-colors">{product.name}</h3>
                    <div className="flex items-center gap-1 text-amber-400 text-xs">
                      <Star size={14} className="fill-current" />
                      <span className="font-bold text-slate-300">{product.rating}</span>
                    </div>
                    <div className="flex items-baseline gap-2 pt-1">
                      <span className="text-lg font-black text-orange-400">{formatPrice(product.price)}</span>
                      <span className="text-xs text-slate-500 line-through">{formatPrice(product.oldPrice)}</span>
                    </div>
                  </div>
                </Link>

                <div className="p-5 pt-0">
                  <button
                    onClick={() => addItem({ ...product, title: product.name })}
                    className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-black rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 text-xs"
                  >
                    <ShoppingCart size={16} /> Ajouter au Panier
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <TrendingUp size={24} className="text-orange-400" /> Meilleures Ventes & Créations d'Ivoirie
            </h2>
            <p className="text-slate-400 text-xs mt-1">Sélection populaire vérifiée par nos équipes à Bouaké</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((product) => (
            <div key={product.id} className="glass-card rounded-3xl overflow-hidden flex flex-col justify-between group border-slate-800 hover:border-orange-500/40">
              <Link to={`/products/${product.id}`} className="block relative">
                {product.tag && (
                  <span className="absolute top-3 left-3 bg-slate-900/90 text-amber-400 border border-amber-500/30 text-[10px] font-black px-2.5 py-1 rounded-full z-10 shadow-md uppercase tracking-wider">
                    {product.tag}
                  </span>
                )}
                <div className="h-52 bg-slate-900/80 overflow-hidden relative">
                  <img
                    src={product.image || getFallbackProductImage(product.name)}
                    alt={product.name}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = getFallbackProductImage(product.name);
                    }}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  {product.id === 5 && (
                    <div className="absolute inset-0 bg-orange-500/10 pointer-events-none animate-pagne-flash" />
                  )}
                </div>
                <div className="p-5 space-y-2">
                  <h3 className="font-bold text-white text-sm truncate group-hover:text-orange-400 transition-colors">{product.name}</h3>
                  <div className="flex items-center gap-1 text-amber-400 text-xs">
                    <Star size={14} className="fill-current" />
                    <span className="font-bold text-slate-300">{product.rating}</span>
                  </div>
                  <div className="text-lg font-black text-orange-400 pt-1">{formatPrice(product.price)}</div>
                </div>
              </Link>

              <div className="p-5 pt-0">
                <button
                  onClick={() => addItem({ ...product, title: product.name })}
                  className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl transition-all border border-slate-700 hover:border-orange-500/40 flex items-center justify-center gap-2 text-xs"
                >
                  <ShoppingCart size={16} /> Ajouter au Panier
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
