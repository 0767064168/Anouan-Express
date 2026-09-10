// src/components/client/BottomNavBar.jsx
// Barre de navigation fixe en bas - visible uniquement mobile (< lg)
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, LayoutGrid, ShoppingCart, User, Heart } from "lucide-react";
import { useCart } from "../../contexts/CartContext";
import { useAuth } from "../../contexts/AuthContext";

export default function BottomNavBar({ onCartOpen }) {
  const location = useLocation();
  const { totalItems } = useCart();
  const { isAuthenticated } = useAuth();

  const tabs = [
    { label: "Accueil",   path: "/",                                        icon: Home },
    { label: "Catalogue", path: "/catalog",                                  icon: LayoutGrid },
    { label: "Panier",    path: null,                                        icon: ShoppingCart, action: onCartOpen, badge: totalItems },
    { label: "Favoris",   path: "/favorites",                                icon: Heart },
    { label: "Compte",    path: isAuthenticated ? "/profile" : "/auth/login", icon: User },
  ];

  return (
    <nav
      className="fixed bottom-6 left-3 right-3 z-50 bg-slate-900/98 backdrop-blur-2xl border border-slate-700/80 rounded-2xl flex lg:hidden shadow-2xl shadow-black/80"
      style={{
        marginBottom: 'env(safe-area-inset-bottom, 12px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.75)'
      }}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.path && location.pathname === tab.path;
        const content = (
          <>
            <div className="relative">
              <Icon size={19} />
              {tab.badge > 0 && (
                <span className="absolute -top-1.5 -right-2 min-w-[14px] h-3.5 px-1 bg-orange-500 text-white text-[8px] font-black rounded-full flex items-center justify-center leading-none">
                  {tab.badge > 9 ? "9+" : tab.badge}
                </span>
              )}
            </div>
            <span className="text-[9px] font-bold mt-0.5 leading-none">{tab.label}</span>
          </>
        );
        const cls = `flex-1 flex flex-col items-center justify-center py-1.5 gap-0.5 transition-colors ${
          isActive ? "text-orange-400" : "text-slate-500 active:text-orange-400"
        }`;
        if (tab.action) {
          return (
            <button key={tab.label} onClick={tab.action} className={cls}>
              {content}
            </button>
          );
        }
        return (
          <Link key={tab.label} to={tab.path} className={cls}>
            {content}
          </Link>
        );
      })}
    </nav>
  );
}
