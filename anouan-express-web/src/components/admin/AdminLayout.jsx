// src/components/admin/AdminLayout.jsx
// Layout Admin Dark Premium - Sidebar glassmorphic & header flottant thème orange

import React, { useState } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, ShoppingCart, Image, Megaphone,
  DollarSign, Settings, LogOut, Store, Menu, Bell, X, Search,
  ShieldCheck, ChevronRight, Sparkles, Package
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Logo from '../ui/Logo';

const navItems = [
  { name: 'Dashboard',    path: '/admin',              icon: LayoutDashboard, desc: 'Vue globale' },
  { name: 'Utilisateurs', path: '/admin/users',         icon: Users,           desc: 'Comptes clients & vendeurs' },
  { name: 'Vendeurs',     path: '/admin/vendors',       icon: Store,           desc: 'Gérer les boutiques' },
  { name: 'Commandes',    path: '/admin/orders',        icon: ShoppingCart,    desc: 'Suivi des commandes' },
  { name: 'Guichet Relais', path: '/admin/agent',          icon: Package,         desc: 'Retraits & Caisse' },
  { name: 'Marketing',    path: '/admin/marketing',     icon: Megaphone,       desc: 'Bannières & Promos' },
  { name: 'Finance',      path: '/admin/finance',       icon: DollarSign,      desc: 'Paiements & Bilans' },
  { name: 'Paramètres',   path: '/admin/settings',      icon: Settings,        desc: 'Configuration plateforme' },
];

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-slate-950 font-sans text-slate-100 overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-slate-900/90 backdrop-blur-xl border-r border-slate-800 transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo Retouché & Animé */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800">
          <Logo size="sm" to="/admin" />
          <button className="lg:hidden text-slate-500 hover:text-white transition-colors" onClick={() => setSidebarOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-3">Navigation</p>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-orange-500/15 border border-orange-500/25 text-orange-400'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                }`}
              >
                <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-orange-500/20 text-orange-400' : 'text-slate-500 group-hover:text-white'}`}>
                  <Icon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate">{item.name}</p>
                  <p className={`text-[10px] truncate ${isActive ? 'text-orange-400/70' : 'text-slate-600 group-hover:text-slate-400'}`}>{item.desc}</p>
                </div>
                {isActive && <ChevronRight size={14} className="text-orange-400/60 shrink-0" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer Sidebar */}
        <div className="p-3 border-t border-slate-800 space-y-1">
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2.5 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-2xl transition-colors"
          >
            <Store size={16} /> Retour à la Boutique
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-red-400 hover:bg-red-500/10 rounded-2xl transition-colors"
          >
            <LogOut size={16} /> Déconnexion
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-4 lg:px-8 shrink-0">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
            <div className="hidden md:flex items-center relative">
              <Search className="absolute left-3.5 text-slate-500" size={15} />
              <input
                type="text"
                placeholder="Rechercher dans l'admin..."
                className="pl-10 pr-4 py-2 w-64 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-500 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Badge notif */}
            <button className="relative p-2.5 text-slate-400 hover:text-white bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-2xl transition-colors">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full border border-slate-900 animate-pulse" />
            </button>

            {/* Admin avatar */}
            <div className="flex items-center gap-2.5 pl-3 border-l border-slate-800">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-bold text-white">{user?.name || 'Administrateur'}</span>
                <span className="text-[10px] text-orange-400 font-semibold">Superviseur Plateforme</span>
              </div>
              <div className="w-9 h-9 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 font-black text-sm">
                {user?.name?.[0]?.toUpperCase() || 'AD'}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-4 lg:p-8 bg-slate-950">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
