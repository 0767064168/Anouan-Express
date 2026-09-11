// src/pages/client/FavoritesPage.jsx
// Page des produits favoris / liste de souhaits — Dark Premium Orange

import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2, Star, Sparkles, LayoutGrid } from 'lucide-react';
import { useFavorites } from '../../contexts/FavoritesContext';
import { useCart } from '../../contexts/CartContext';
import { useToast } from '../../components/ui/Toast';
import PageHeader from '../../components/ui/PageHeader';

const formatPrice = (p) => new Intl.NumberFormat('fr-CI').format(Number(p || 0)) + ' FCFA';

export default function FavoritesPage() {
  const { favorites, removeFavorite, clearFavorites, count } = useFavorites();
  const { addItem } = useCart();
  const toast = useToast();

  const handleAddToCart = (product) => {
    addItem(product);
    toast.success(`"${product.name || product.title}" ajouté au panier !`);
  };

  const handleRemove = (product) => {
    removeFavorite(product.id);
    toast.info(`"${product.name || product.title}" retiré des favoris.`);
  };

  return (
    <div className="min-h-screen bg-slate-950 py-10 text-slate-100 font-sans selection:bg-orange-500 selection:text-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

        <PageHeader
          title={
            <span className="flex items-center gap-3">
              Mes Favoris
              {count > 0 && (
                <span className="bg-orange-500/20 border border-orange-500/30 text-orange-400 text-xs font-black px-2.5 py-1 rounded-full">
                  {count} article{count > 1 ? 's' : ''}
                </span>
              )}
            </span>
          }
          subtitle="Vos produits sauvegardés pour plus tard"
          actions={count > 0 && (
            <button
              onClick={() => { clearFavorites(); toast.info('Liste de favoris vidée.'); }}
              className="flex items-center gap-2 text-xs font-bold text-red-400 hover:text-red-300 bg-red-500/10 border border-red-500/20 px-4 py-2.5 rounded-2xl transition-all"
            >
              <Trash2 size={14} /> Tout supprimer
            </button>
          )}
        />

        {/* Contenu */}
        {count === 0 ? (
          <div className="glass-panel rounded-3xl border border-slate-800 p-20 text-center space-y-5">
            <div className="w-20 h-20 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto">
              <Heart size={36} className="text-slate-700" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white mb-2">Aucun favori pour l'instant</h2>
              <p className="text-slate-400 text-sm">
                Cliquez sur le <Heart size={14} className="inline-block text-orange-400 align-text-bottom" /> d'un produit pour l'ajouter à votre liste de souhaits.
              </p>
            </div>
            <Link
              to="/catalog"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-black px-8 py-3.5 rounded-2xl transition-all shadow-lg shadow-orange-500/20 text-sm uppercase tracking-wider"
            >
              <LayoutGrid size={16} /> Explorer le Catalogue
            </Link>
          </div>
        ) : (
          <>
            {/* Grille des produits favoris */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {favorites.map((product) => (
                <div
                  key={product.id}
                  className={`glass-card rounded-3xl overflow-hidden flex flex-col group border border-slate-800 hover:border-orange-500/50 transition-all ${
                    product.isCultural ? 'border-kita-glow' : ''
                  }`}
                >
                  {/* Image */}
                  <Link to={`/products/${product.id}`} className="block relative">
                    {product.isCultural && (
                      <span className="absolute top-3 left-3 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-[10px] font-black px-3 py-1 rounded-full z-10 shadow-lg uppercase tracking-wider">
                        <span className="inline-flex items-center gap-1"><Sparkles size={11} /> Artisanat CI</span>
                      </span>
                    )}
                    <div className="h-48 bg-slate-900 overflow-hidden relative">
                      <img
                        src={product.images?.[0] || product.image || product.image_url}
                        alt={product.name || product.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      {product.isCultural && (
                        <div className="absolute inset-0 bg-amber-500/10 pointer-events-none animate-pagne-flash" />
                      )}
                    </div>
                  </Link>

                  {/* Infos */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">
                        {product.category_name || 'Produit'}
                      </span>
                      <h3 className="font-bold text-white text-sm leading-tight group-hover:text-orange-400 transition-colors line-clamp-2">
                        {product.name || product.title}
                      </h3>
                      <div className="flex items-center gap-1 text-amber-400 text-xs">
                        <Star size={12} className="fill-current" />
                        <span className="text-slate-300 font-bold">{product.rating || '4.8'}</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-base font-black text-orange-400">{formatPrice(product.price)}</span>
                        {product.oldPrice && (
                          <span className="text-xs text-slate-500 line-through">{formatPrice(product.oldPrice)}</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAddToCart(product)}
                        className="flex-1 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-black rounded-2xl transition-all shadow-lg flex items-center justify-center gap-1.5 text-xs"
                      >
                        <ShoppingCart size={14} /> Panier
                      </button>
                      <button
                        onClick={() => handleRemove(product)}
                        className="p-2.5 bg-slate-900 border border-slate-800 hover:border-red-500/40 hover:bg-red-500/10 text-red-400 rounded-2xl transition-all"
                        title="Retirer des favoris"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA pour continuer à acheter */}
            <div className="glass-panel rounded-3xl border border-slate-800 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Sparkles size={20} className="text-orange-400" />
                <p className="text-sm text-slate-300">
                  <strong className="text-white">{count} produit{count > 1 ? 's' : ''}</strong> dans vos favoris
                  &nbsp;•&nbsp; Total estimé :&nbsp;
                  <strong className="text-orange-400">
                    {formatPrice(favorites.reduce((s, p) => s + Number(p.price || 0), 0))}
                  </strong>
                </p>
              </div>
              <Link
                to="/catalog"
                className="shrink-0 flex items-center gap-2 bg-slate-900 border border-slate-800 hover:border-orange-500/40 text-slate-300 hover:text-white font-bold px-5 py-2.5 rounded-2xl transition-all text-xs"
              >
                <LayoutGrid size={14} /> Continuer mes achats
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
