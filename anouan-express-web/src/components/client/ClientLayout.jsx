// src/components/client/ClientLayout.jsx
// Layout Client Premium Thème Orange Vibrant (Dark Glassmorphism)

import React, { useState, useEffect, useRef } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Search, ShoppingCart, User, Menu, X, Bell, Heart, MapPin, MessageSquare,
  Home, LayoutGrid, LogOut, Package, Settings, ChevronDown, Store, Sparkles, ShieldCheck, Sun, Moon,
  Smartphone, Headphones, Footprints, ShoppingBag
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useFavorites } from '../../contexts/FavoritesContext';
import CartDrawer from './CartDrawer';
import BottomNavBar from './BottomNavBar';
import PWAInstallPrompt from '../ui/PWAInstallPrompt';
import Logo from '../ui/Logo';
import { PaymentMethodsRow } from '../ui/PaymentLogos';
import { notificationsAPI, adminAPI } from '../../services/api';

const navLinks = [
  { label: 'Accueil', path: '/', icon: Home },
  { label: 'Catalogue', path: '/catalog', icon: LayoutGrid },
  { label: 'Points Relais', path: '/stores', icon: MapPin },
];

const SEARCH_PRODUCTS = [
  { id: 101, title: 'Pagne Baoulé Tissé Main', price: 25000, category: 'Mode & Pagne Kita', image: '/pagne_kita.jpg' },
  { id: 102, title: 'Robe de Gala Pagne Kita', price: 32000, category: 'Mode & Pagne Kita', image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=300&q=80' },
  { id: 1, title: 'Smartphone Pro Max 5G Ultra', price: 250000, category: 'Électronique', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=300&q=80' },
  { id: 2, title: 'Sneakers Urban Confort', price: 15000, category: 'Mode & Chaussures', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=300&q=80' },
  { id: 3, title: 'Montre Connectée Sport HD', price: 20000, category: 'Électronique', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=300&q=80' },
  { id: 4, title: 'Écouteurs Sans Fil Pro', price: 10000, category: 'Électronique', image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=300&q=80' },
];

export default function ClientLayout() {
  const { user, isAuthenticated, logout } = useAuth();
  const { totalItems, setIsOpen: openCart } = useCart();
  const { count: favCount } = useFavorites();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('anouan_theme') || 'dark';
  });

  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadNotifsCount(0);
      return;
    }
    const loadUnreadNotifs = async () => {
      try {
        const res = await notificationsAPI.getAll();
        if (res && res.data) {
          const list = Array.isArray(res.data) ? res.data : (res.data.notifications || []);
          setUnreadNotifsCount(list.filter(n => !n.is_read && !n.read).length);
        }
      } catch (err) {
        const status = err?.response?.status;
        if (status !== 401 && status !== 403) {
          console.warn('Unread notifications could not be loaded:', err?.message || 'unknown error');
        }
        setUnreadNotifsCount(0);
      }
    };
    loadUnreadNotifs();
    const interval = setInterval(loadUnreadNotifs, 30000);
    window.addEventListener('anouan_order_status_updated', loadUnreadNotifs);
    return () => {
      clearInterval(interval);
      window.removeEventListener('anouan_order_status_updated', loadUnreadNotifs);
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }
    localStorage.setItem('anouan_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const userMenuRef = useRef(null);
  const searchRef = useRef(null);

  const searchResults = searchQuery.trim()
    ? SEARCH_PRODUCTS.filter(
        (p) => p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 15);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
    setSearchFocused(false);
  }, [location.pathname]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/catalog?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // Bannières actives provenant de la base de données
  const [activeAdminBanners, setActiveAdminBanners] = useState([]);

  useEffect(() => {
    const loadBanners = async () => {
      try {
        const res = await adminAPI.getPublicBanners();
        if (res && res.data) {
          const list = Array.isArray(res.data) ? res.data : (res.data.banners || []);
          setActiveAdminBanners(list.filter(b => b.is_active || b.active));
        }
      } catch (err) {
        console.error("Erreur chargement bannières:", err);
      }
    };
    loadBanners();
    window.addEventListener('anouan_banners_updated', loadBanners);
    return () => window.removeEventListener('anouan_banners_updated', loadBanners);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-orange-500 selection:text-slate-950">

      {/* Navbar Sticky Glass */}
      <header
        className={`sticky top-0 z-40 transition-all duration-300 ${
          scrolled ? 'bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/80 shadow-2xl shadow-orange-950/20 py-3' : 'bg-slate-950/60 backdrop-blur-md border-b border-slate-800/40 py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            {/* Logo Retouché & Animé */}
            <Logo size="md" to="/" />

            {/* Navigation Desktop */}
            <nav className="hidden md:flex items-center gap-2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20 shadow-inner'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                    }`}
                  >
                    <Icon size={16} className={isActive ? 'text-orange-400' : 'text-slate-400'} />
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* Barre de recherche avec autocomplétion en direct */}
            <div className="flex-1 max-w-md mx-4 hidden sm:block relative" ref={searchRef}>
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                  <input
                    type="text"
                    value={searchQuery}
                    onFocus={() => setSearchFocused(true)}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher un produit, une marque, Pagne Kita..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-500 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </form>

              {/* Popover de résultats instantanés */}
              {searchFocused && (
                <div className="absolute top-full left-0 right-0 mt-2 glass-panel rounded-2xl p-3 z-50 border border-slate-700 shadow-2xl space-y-2 animate-in fade-in zoom-in-95 duration-150">
                  {searchQuery.trim() ? (
                    searchResults.length > 0 ? (
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-orange-400 uppercase tracking-widest px-2 pb-1 border-b border-slate-800">
                          Résultats instantanés ({searchResults.length})
                        </p>
                        {searchResults.slice(0, 4).map((p) => (
                          <Link
                            key={p.id}
                            to={`/products/${p.id}`}
                            onClick={() => { setSearchFocused(false); setSearchQuery(''); }}
                            className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-800/60 transition-colors"
                          >
                            <img src={p.image} alt={p.title} className="w-10 h-10 object-cover rounded-lg bg-slate-950 border border-slate-800" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-white truncate">{p.title}</p>
                              <p className="text-[10px] text-slate-400">{p.category}</p>
                            </div>
                            <span className="text-xs font-black text-orange-400">
                              {new Intl.NumberFormat('fr-CI').format(p.price)} FCFA
                            </span>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-xs text-slate-400">
                        Aucun résultat pour "<span className="text-white font-bold">{searchQuery}</span>"
                      </div>
                    )
                  ) : (
                    <div className="space-y-2 p-1">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Tendance à Bouaké</p>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { label: 'Pagne Baoulé', icon: Store },
                          { label: 'Smartphones 5G', icon: Smartphone },
                          { label: 'Écouteurs', icon: Headphones },
                          { label: 'Sneakers', icon: Footprints },
                        ].map(({ label, icon: Icon }) => (
                          <button
                            key={label}
                            onClick={() => { setSearchQuery(label); }}
                            className="inline-flex items-center gap-1.5 text-[11px] font-bold bg-slate-900 border border-slate-800 hover:border-orange-500/40 text-slate-300 hover:text-white px-3 py-1.5 rounded-xl transition-all"
                          >
                            <Icon size={12} className="text-orange-400" />
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Actions Droite */}
            <div className="flex items-center gap-1.5 sm:gap-3">
              {/* Bouton Éclairage et Nocturne (Theme Toggle) - desktop uniquement */}
              <button
                onClick={toggleTheme}
                className={`hidden md:flex items-center gap-2 px-3 py-2 rounded-2xl border text-xs font-black transition-all shadow-lg hover:scale-105 active:scale-95 ${
                  theme === 'light'
                    ? 'bg-amber-500/10 text-amber-600 border-amber-500/30 hover:bg-amber-500/20'
                    : 'bg-slate-900 text-amber-400 border-slate-800 hover:border-amber-500/40'
                }`}
                title={theme === 'light' ? 'Basculez en mode Nocturne (Sombre)' : 'Basculez en mode Éclairage (Clair)'}
              >
                {theme === 'light' ? (
                  <>
                    <Sun className="w-4 h-4 text-amber-500 animate-spin" style={{ animationDuration: '12s' }} />
                    <span>Éclairage</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-amber-400" />
                    <span>Nocturne</span>
                  </>
                )}
              </button>

              {/* Bouton Notifications (si authentifié) */}
              {isAuthenticated && (
                <Link
                  to="/notifications"
                  className="relative p-2 sm:p-2.5 text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-orange-500/40 rounded-2xl transition-all shadow-lg hover:shadow-orange-500/10"
                >
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
                  {unreadNotifsCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[9px] sm:text-[10px] font-black rounded-full flex items-center justify-center border-2 border-slate-950 shadow-md">
                      {unreadNotifsCount > 9 ? '9+' : unreadNotifsCount}
                    </span>
                  )}
                </Link>
              )}

              {/* Bouton Favoris (si authentifié) - Déjà dans la barre du bas sur mobile */}
              {isAuthenticated && (
                <Link
                  to="/favorites"
                  className="hidden md:flex relative p-2.5 text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-red-500/40 rounded-2xl transition-all shadow-lg"
                >
                  <Heart className={`w-5 h-5 ${favCount > 0 ? 'text-red-400 fill-red-400' : 'text-slate-400'}`} />
                  {favCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-slate-950 shadow-md">
                      {favCount > 9 ? '9+' : favCount}
                    </span>
                  )}
                </Link>
              )}

              {/* Bouton Messagerie (si authentifié) */}
              {isAuthenticated && (
                <Link
                  to="/chat"
                  className="hidden sm:flex relative p-2.5 text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-orange-500/40 rounded-2xl transition-all shadow-lg hover:shadow-orange-500/10"
                  title="Messagerie Vendeurs"
                >
                  <MessageSquare className="w-5 h-5 text-slate-400" />
                  <span className="absolute -top-1.5 -right-1.5 w-[18px] h-[18px] bg-orange-500 text-slate-950 text-[10px] font-black rounded-full flex items-center justify-center border-2 border-slate-950 shadow-md">2</span>
                </Link>
              )}
              <button
                id="cart-btn"
                onClick={() => openCart(true)}
                className="relative p-2.5 text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-orange-500/40 rounded-2xl transition-all shadow-lg hover:shadow-orange-500/10"
              >
                <ShoppingCart className="w-5 h-5 text-orange-400" />
                {totalItems > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 text-[11px] font-black rounded-full flex items-center justify-center px-1 border-2 border-slate-950 shadow-md animate-bounce">
                    {totalItems > 99 ? '99+' : totalItems}
                  </span>
                )}
              </button>

              {/* Utilisateur */}
              {isAuthenticated ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    id="user-menu-btn"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-1.5 p-1 sm:px-3 sm:py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl transition-all"
                  >
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 font-bold text-xs sm:text-sm">
                      {user?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <span className="hidden md:block text-xs font-semibold text-slate-200 max-w-[90px] truncate">
                      {user?.name?.split(' ')[0] || 'Compte'}
                    </span>
                    <ChevronDown size={13} className={`hidden sm:block text-slate-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 glass-panel rounded-2xl p-2 z-50 border border-slate-700 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-3 py-2 border-b border-slate-800 mb-1">
                        <p className="text-xs font-bold text-white truncate">{user?.name}</p>
                        <p className="text-[10px] text-orange-400 font-medium capitalize mt-0.5">{user?.role || 'Client'}</p>
                      </div>
                      <Link to="/profile" className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-xl transition-colors">
                        <User size={14} className="text-slate-400" /> Mon profil
                      </Link>
                      <Link to="/orders" className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-xl transition-colors">
                        <ShoppingBag size={14} className="text-orange-400" /> Mes Commandes
                      </Link>
                      <Link to="/notifications" className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-xl transition-colors">
                        <Bell size={14} className="text-slate-400" /> Notifications
                        <span className="ml-auto bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">3</span>
                      </Link>
                      <Link to="/chat" className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-xl transition-colors">
                        <MessageSquare size={14} className="text-orange-400" /> Messagerie Vendeurs
                        <span className="ml-auto bg-orange-500 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded-full">2</span>
                      </Link>
                      <Link to="/disputes" className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-xl transition-colors">
                        <ShieldCheck size={14} className="text-slate-400" /> Mes Réclamations
                      </Link>
                      {user?.role === 'vendor' && (
                        <Link to="/vendor" className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-orange-400 hover:bg-orange-500/10 rounded-xl transition-colors">
                          <Store size={14} /> Espace Vendeur
                        </Link>
                      )}
                      {(user?.role === 'agent' || user?.role === 'admin') && (
                        <Link to="/agent" className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-amber-400 hover:bg-amber-500/10 rounded-xl transition-colors">
                          <Package size={14} /> Guichet Relais Retraits
                        </Link>
                      )}
                      {user?.role === 'admin' && (
                        <Link to="/admin" className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-orange-400 hover:bg-orange-500/10 rounded-xl transition-colors">
                          <Settings size={14} /> Administration
                        </Link>
                      )}
                      <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10 rounded-xl transition-colors mt-1">
                        <LogOut size={14} /> Déconnexion
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/auth/login"
                  className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 text-xs font-black px-4 py-2.5 rounded-2xl transition-all shadow-lg shadow-orange-500/20"
                >
                  <User size={14} /> Connexion
                </Link>
              )}

              {/* Hamburger Mobile */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="sm:hidden p-2 text-slate-400 hover:text-white bg-slate-900 rounded-xl"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer — EN DEHORS du header pour z-index correct */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[9999]" style={{ isolation: 'isolate' }}>
          {/* Overlay sombre */}
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileMenuOpen(false)} />
          {/* Drawer — fond totalement opaque */}
          <div className="absolute inset-y-0 right-0 w-[85vw] max-w-xs bg-[#0f172a] border-l-2 border-slate-700 flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="h-14 flex items-center justify-between px-5 border-b border-slate-700 bg-[#0f172a] shrink-0">
              <span className="text-base font-black text-white tracking-tight">Menu</span>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Search */}
            <div className="px-4 py-3 border-b border-slate-700 bg-[#0f172a] shrink-0">
              <form onSubmit={(e) => { handleSearch(e); setMobileMenuOpen(false); }}>
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher..." className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:border-orange-500 outline-none transition-all" />
                </div>
              </form>
            </div>

            {/* User Info si connecté */}
            {isAuthenticated && (
              <div className="px-4 py-3 border-b border-slate-700 bg-slate-800/60 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 font-black text-base shrink-0">
                    {user?.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">{user?.name}</p>
                    <p className="text-xs text-orange-400 font-semibold capitalize">{user?.role || 'Client'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Nav Links */}
            <nav className="flex-1 px-3 py-3 space-y-0.5 bg-[#0f172a] overflow-y-auto">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;
                return (
                  <Link key={link.path} to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all ${
                      isActive ? 'bg-orange-500/15 border border-orange-500/30 text-orange-400' : 'text-slate-100 hover:bg-slate-800 hover:text-white'
                    }`}>
                    <Icon size={19} className={isActive ? 'text-orange-400 shrink-0' : 'text-slate-400 shrink-0'} />
                    {link.label}
                  </Link>
                );
              })}
              <div className="pt-2 border-t border-slate-700/60 mt-2 space-y-0.5">
                {isAuthenticated && (
                  <>
                    <Link to="/orders" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-sm font-semibold text-slate-100 hover:bg-slate-800 hover:text-white transition-all">
                      <ShoppingBag size={19} className="text-orange-400 shrink-0" /> Mes Commandes
                    </Link>
                    <Link to="/favorites" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-sm font-semibold text-slate-100 hover:bg-slate-800 hover:text-white transition-all">
                      <Heart size={19} className="text-red-400 shrink-0" /> Mes favoris
                      {favCount > 0 && <span className="ml-auto bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{favCount}</span>}
                    </Link>
                    <Link to="/notifications" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-sm font-semibold text-slate-100 hover:bg-slate-800 hover:text-white transition-all">
                      <Bell size={19} className="text-orange-400 shrink-0" /> Notifications
                      <span className="ml-auto bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">3</span>
                    </Link>
                    <Link to="/chat" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-sm font-semibold text-slate-100 hover:bg-slate-800 hover:text-white transition-all">
                      <MessageSquare size={19} className="text-orange-400 shrink-0" /> Messagerie
                      <span className="ml-auto bg-orange-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full">2</span>
                    </Link>
                    {user?.role === 'vendor' && (
                      <Link to="/vendor" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-sm font-semibold text-orange-400 hover:bg-slate-800 transition-all">
                        <Store size={19} className="shrink-0" /> Espace Vendeur
                      </Link>
                    )}
                    {(user?.role === 'agent' || user?.role === 'admin') && (
                      <Link to="/agent" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-sm font-semibold text-amber-400 hover:bg-slate-800 transition-all">
                        <Package size={19} className="shrink-0" /> Guichet Relais Retraits
                      </Link>
                    )}
                    {user?.role === 'admin' && (
                      <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-sm font-semibold text-orange-400 hover:bg-slate-800 transition-all">
                        <Settings size={19} className="shrink-0" /> Administration
                      </Link>
                    )}
                  </>
                )}
                <button onClick={() => toggleTheme()}
                  className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-sm font-semibold text-amber-400 hover:bg-slate-800 transition-all">
                  {theme === 'light' ? <><Sun size={19} className="shrink-0" /> Mode Éclairage</> : <><Moon size={19} className="shrink-0" /> Mode Nocturne</>}
                </button>
              </div>
            </nav>

            {/* Bottom */}
            <div className="p-4 pb-12 border-t border-slate-700 bg-[#0f172a] shrink-0">
              {!isAuthenticated ? (
                <Link to="/auth/login" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-center gap-2 bg-orange-500 text-slate-950 text-sm font-black py-3 rounded-xl hover:bg-orange-400 transition-colors">
                  <User size={16} /> Se connecter
                </Link>
              ) : (
                <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-3 text-sm font-semibold text-red-400 hover:bg-red-500/10 rounded-xl transition-colors">
                  <LogOut size={16} /> Déconnexion
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 pb-28 lg:pb-0">
        <Outlet />
      </main>

      {/* Footer Dark Premium */}
      <footer className="bg-slate-950 border-t border-slate-800/80 text-slate-400 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            <div className="space-y-4">
              <Logo size="lg" to="/" />
              <p className="text-xs leading-relaxed text-slate-400">
                La référence marketplace à Bouaké. Achetez vos produits en toute tranquillité et retirez-les en magasin sécurisé par votre code unique.
              </p>
            </div>
            <div>
              <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-4">Naviguer</h4>
              <ul className="space-y-2 text-xs">
                <li><Link to="/" className="hover:text-orange-400 transition-colors">Accueil</Link></li>
                <li><Link to="/catalog" className="hover:text-orange-400 transition-colors">Catalogue complet</Link></li>
                <li><Link to="/catalog" className="hover:text-orange-400 transition-colors">Ventes Flash</Link></li>
                <li><Link to="/stores" className="hover:text-orange-400 transition-colors flex items-center gap-1"><MapPin size={11} className="text-orange-400" /> Points Relais Bouaké</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-4">Mon Compte</h4>
              <ul className="space-y-2 text-xs">
                <li><Link to="/profile" className="hover:text-orange-400 transition-colors">Mes commandes</Link></li>
                <li><Link to="/profile" className="hover:text-orange-400 transition-colors">Codes de retrait</Link></li>
                <li><Link to="/auth/login" className="hover:text-orange-400 transition-colors">Espace Vendeur</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="flex items-center gap-1.5 text-white text-xs font-bold uppercase tracking-wider mb-4"><ShieldCheck size={13} className="text-emerald-400" /> Paiements Sécurisés</h4>
              <PaymentMethodsRow size={28} showLabel={true} className="flex-col items-start gap-2.5" />
            </div>
          </div>
          <div className="border-t border-slate-900 mt-12 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-[11px] text-slate-500">
            <p>© 2026 Anouan Express. Tous droits réservés. Bouaké, Côte d'Ivoire.</p>
            <div className="flex gap-4">
              <Link to="/legal" className="hover:text-orange-400 transition-colors">Mentions Légales & CGU</Link>
              <Link to="/legal" className="hover:text-orange-400 transition-colors">Confidentialité</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Bottom Nav Mobile */}
      <BottomNavBar onCartOpen={() => openCart(true)} />

      {/* Bannière d'Installation PWA */}
      <PWAInstallPrompt />

      {/* Cart Drawer */}
      <CartDrawer />
    </div>
  );
}
