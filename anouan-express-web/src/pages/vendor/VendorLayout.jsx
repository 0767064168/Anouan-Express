// src/pages/vendor/VendorLayout.jsx — Dark Premium Orange
import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, ShoppingBag, DollarSign,
  Menu, X, LogOut, Store, Bell, ArrowLeft, ChevronRight, MessageSquare, Sun, Moon
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Logo from '../../components/ui/Logo';
import NotificationBell from '../../components/vendor/NotificationBell';

const navItems = [
  { name: 'Dashboard',    path: '/vendor',          icon: LayoutDashboard, desc: 'Vue globale' },
  { name: 'Mes Produits', path: '/vendor/products', icon: Package,         desc: 'Catalogue boutique' },
  { name: 'Commandes',    path: '/vendor/orders',   icon: ShoppingBag,     desc: 'Suivi commandes' },
  { name: 'Messagerie',   path: '/vendor/chat',     icon: MessageSquare,   desc: 'Discussion clients' },
  { name: 'Finance',      path: '/vendor/finance',  icon: DollarSign,      desc: 'Revenus & bilans' },
];

export default function VendorLayout() {
  const location  = useLocation();
  const navigate  = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('anouan_theme') || 'dark';
  });

  React.useEffect(() => {
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

  const handleLogout = async () => { await logout(); navigate('/auth/login'); };

  return (
    <div className="flex h-screen bg-slate-950 font-sans text-slate-100 overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-slate-900/90 backdrop-blur-xl border-r border-slate-800 transform transition-transform duration-300 lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Logo Retouché & Animé */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800">
          <Logo size="sm" to="/vendor" />
          <button className="lg:hidden text-slate-500 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-3">Menu</p>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-200 group ${
                  isActive ? 'bg-orange-500/15 border border-orange-500/25 text-orange-400' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                }`}>
                <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-orange-500/20 text-orange-400' : 'text-slate-500 group-hover:text-white'}`}>
                  <Icon size={15} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate">{item.name}</p>
                  <p className={`text-[10px] truncate ${isActive ? 'text-orange-400/70' : 'text-slate-600 group-hover:text-slate-400'}`}>{item.desc}</p>
                </div>
                {isActive && <ChevronRight size={13} className="text-orange-400/60 shrink-0" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 space-y-1">
          <Link to="/" className="flex items-center gap-3 px-3 py-2.5 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-2xl transition-colors">
            <ArrowLeft size={15} /> Retour à la boutique
          </Link>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-red-400 hover:bg-red-500/10 rounded-2xl transition-colors">
            <LogOut size={15} /> Déconnexion
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-4 lg:px-8 shrink-0">
          <div className="flex items-center gap-3">
            <button className="lg:hidden text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors" onClick={() => setSidebarOpen(true)}>
              <Menu size={20} />
            </button>
            <div className="hidden sm:block">
              <p className="text-xs font-black text-white">{navItems.find(i => i.path === location.pathname)?.name || 'Tableau de bord'}</p>
              <p className="text-[10px] text-slate-500">{navItems.find(i => i.path === location.pathname)?.desc}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Bouton Éclairage et Nocturne */}
            <button
              onClick={toggleTheme}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl border text-xs font-black transition-all shadow-md hover:scale-105 active:scale-95 ${
                theme === 'light'
                  ? 'bg-amber-500/10 text-amber-600 border-amber-500/30 hover:bg-amber-500/20'
                  : 'bg-slate-950 text-amber-400 border-slate-800 hover:border-amber-500/40'
              }`}
              title={theme === 'light' ? 'Basculez en mode Nocturne (Sombre)' : 'Basculez en mode Éclairage (Clair)'}
            >
              {theme === 'light' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-500 animate-spin" style={{ animationDuration: '12s' }} />
                  <span className="hidden sm:inline">Éclairage</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-amber-400" />
                  <span className="hidden sm:inline">Nocturne</span>
                </>
              )}
            </button>

            {/* Cloche Notifications Temps Réel */}
            <NotificationBell />

            <div className="flex items-center gap-2.5 pl-3 border-l border-slate-800">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-bold text-white">{user?.name?.split(' ')[0] || 'Vendeur'}</span>
                <span className="text-[10px] text-orange-400 font-semibold">Compte Vendeur</span>
              </div>
              <div className="w-9 h-9 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 font-black text-sm">
                {user?.name?.[0]?.toUpperCase() || 'V'}
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 lg:p-8 pb-20 lg:pb-8 bg-slate-950">
          <Outlet />
        </div>
      </main>

      {/* Bottom Tab Bar Vendeur — Mobile uniquement */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 flex lg:hidden">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link key={item.path} to={item.path}
              className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-1 text-[9px] font-bold transition-colors ${
                isActive ? 'text-orange-400' : 'text-slate-500 active:text-orange-400'
              }`}>
              <Icon size={18} />
              <span>{item.name.split(' ')[0]}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
