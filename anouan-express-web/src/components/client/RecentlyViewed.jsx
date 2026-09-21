// src/components/client/RecentlyViewed.jsx
// Carrousel / Grille des articles consultés récemment par le client

import React from 'react';
import { Link } from 'react-router-dom';
import { History, ArrowRight, Trash2, Store } from 'lucide-react';
import { useRecentlyViewed } from '../../hooks/useRecentlyViewed';
import { getFallbackProductImage } from '../../contexts/ProductContext';

const formatPrice = (p) => new Intl.NumberFormat('fr-CI').format(Number(p || 0)) + ' FCFA';

export default function RecentlyViewed({ currentProductId = null, title = "Vus Récemment" }) {
  const { recentProducts, clearRecentlyViewed } = useRecentlyViewed();

  // Filtrer pour exclure le produit actuellement affiché
  const displayItems = recentProducts.filter(
    (p) => String(p.id) !== String(currentProductId)
  );

  if (!displayItems || displayItems.length === 0) return null;

  return (
    <div className="glass-panel rounded-3xl p-6 lg:p-8 border border-slate-800 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center">
            <History size={16} />
          </div>
          <div>
            <h3 className="text-base font-black text-white">{title}</h3>
            <p className="text-[11px] text-slate-400">Reprenez là où vous vous étiez arrêté</p>
          </div>
        </div>

        <button
          onClick={clearRecentlyViewed}
          className="text-xs text-slate-500 hover:text-red-400 flex items-center gap-1 transition-colors px-2 py-1 rounded-lg"
          title="Effacer l'historique"
        >
          <Trash2 size={13} />
          <span className="hidden sm:inline">Effacer</span>
        </button>
      </div>

      {/* Carrousel horizontal fluide */}
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none snap-x">
        {displayItems.map((prod) => (
          <Link
            key={prod.id}
            to={`/products/${prod.id}`}
            className="w-44 sm:w-48 flex-shrink-0 snap-start glass-card p-3 rounded-2xl border border-slate-800 hover:border-orange-500/40 transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="aspect-square w-full rounded-xl overflow-hidden bg-slate-900 relative mb-2.5">
                <img
                  src={prod.image || getFallbackProductImage(prod.name)}
                  alt={prod.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = getFallbackProductImage(prod.name);
                  }}
                />
              </div>

              <h4 className="text-xs font-bold text-slate-200 truncate group-hover:text-orange-400 transition-colors">
                {prod.name}
              </h4>

              {prod.vendor_name && (
                <span className="text-[10px] text-slate-500 flex items-center gap-1 truncate mt-0.5">
                  <Store size={10} className="text-slate-600" /> {prod.vendor_name}
                </span>
              )}
            </div>

            <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-xs font-black text-orange-400">{formatPrice(prod.price)}</span>
              <ArrowRight size={12} className="text-slate-600 group-hover:text-orange-400 group-hover:translate-x-0.5 transition-all" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
