// src/components/client/CartDrawer.jsx
// Drawer Panier Latéral Dark Premium Orange avec animations fluides & verre dépoli

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, ShoppingCart, Plus, Minus, Trash2, ArrowRight, ShoppingBag, ShieldCheck, Sparkles, Tag, Check } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';

const formatPrice = (price) =>
  new Intl.NumberFormat('fr-CI').format(Number(price)) + ' FCFA';

export default function CartDrawer() {
  const {
    items, totalItems, totalPrice, discountAmount, finalPrice,
    appliedPromo, applyPromoCode, removePromoCode,
    isOpen, setIsOpen, updateQuantity, removeItem
  } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [promoInput, setPromoInput] = useState('');
  const [promoMessage, setPromoMessage] = useState(null);

  const handleApplyPromo = (e) => {
    e.preventDefault();
    if (!promoInput.trim()) return;
    const res = applyPromoCode(promoInput);
    setPromoMessage(res);
    if (res.success) {
      setPromoInput('');
    }
    setTimeout(() => setPromoMessage(null), 3500);
  };

  const handleCheckout = () => {
    setIsOpen(false);
    if (!isAuthenticated) {
      navigate('/auth/login');
    } else {
      navigate('/checkout');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
        onClick={() => setIsOpen(false)}
      />

      {/* Drawer Panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-orange-500/20 border border-orange-500/30 text-orange-400">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-black text-white text-base leading-none">Mon Panier</h2>
              <p className="text-[11px] text-slate-400 mt-1">Retrait au Magasin Central Bouaké</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Liste des articles */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-500 text-center py-12">
              <div className="w-20 h-20 rounded-3xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-600 shadow-inner">
                <ShoppingBag className="w-10 h-10 text-slate-600" />
              </div>
              <div>
                <p className="font-bold text-slate-300">Votre panier est vide</p>
                <p className="text-xs text-slate-500 mt-1">Ajoutez des produits pour valider votre commande</p>
              </div>
              <Link
                to="/catalog"
                onClick={() => setIsOpen(false)}
                className="mt-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 px-6 py-3 rounded-2xl text-xs font-black transition-all shadow-lg shadow-orange-500/20 uppercase tracking-wider"
              >
                Explorer le Catalogue
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.key} className="glass-card p-4 rounded-2xl flex gap-4 items-center border border-slate-800 hover:border-orange-500/40">
                  <div className="w-16 h-16 rounded-xl bg-slate-950 flex items-center justify-center shrink-0 border border-slate-800 overflow-hidden relative">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl">🛍️</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-xs truncate">{item.name}</p>
                    {item.variant && <p className="text-[10px] text-orange-400 font-semibold mt-0.5">{item.variant}</p>}
                    <p className="text-orange-400 font-black text-sm mt-1">{formatPrice(item.price)}</p>

                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => updateQuantity(item.key, item.quantity - 1)}
                        className="w-6 h-6 rounded-lg bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-300 flex items-center justify-center transition-colors"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-6 text-center text-xs font-bold text-white">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.key, Math.min(item.quantity + 1, item.stock || 99))}
                        className="w-6 h-6 rounded-lg bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-300 flex items-center justify-center transition-colors"
                      >
                        <Plus size={12} />
                      </button>

                      <button
                        onClick={() => removeItem(item.key)}
                        className="ml-auto p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer & Validation */}
        {items.length > 0 && (
          <div className="border-t border-slate-800 p-6 space-y-4 bg-slate-950/90">
            {/* Formulaire Code Promo */}
            <div className="space-y-2">
              {appliedPromo ? (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs">
                  <div className="flex items-center gap-2">
                    <Tag size={13} className="shrink-0" />
                    <div>
                      <span className="font-bold uppercase tracking-wider">{appliedPromo.code}</span>
                      <span className="text-[10px] text-emerald-300 ml-2">({appliedPromo.label})</span>
                    </div>
                  </div>
                  <button
                    onClick={removePromoCode}
                    className="p-1 text-slate-400 hover:text-red-400 rounded-lg transition-colors"
                    title="Retirer le code"
                  >
                    <X size={13} />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyPromo} className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                      placeholder="Code promo (ex: ANOUAN10)"
                      className="w-full pl-8 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white uppercase placeholder-slate-500 outline-none focus:border-orange-500 transition-colors"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-3 py-2 bg-slate-800 hover:bg-orange-500 hover:text-slate-950 text-white text-xs font-bold rounded-xl transition-all"
                  >
                    Appliquer
                  </button>
                </form>
              )}

              {promoMessage && (
                <p className={`text-[11px] font-medium ${promoMessage.success ? 'text-emerald-400' : 'text-red-400'}`}>
                  {promoMessage.message}
                </p>
              )}
            </div>

            <div className="space-y-2 text-xs pt-1">
              <div className="flex justify-between text-slate-400">
                <span>Sous-total ({totalItems} article{totalItems > 1 ? 's' : ''})</span>
                <span className="font-bold text-slate-200">{formatPrice(totalPrice)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400 font-bold">
                  <span>Réduction ({appliedPromo?.code})</span>
                  <span>- {formatPrice(discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-400">
                <span>Frais de retrait</span>
                <span className="text-orange-400 font-bold">Gratuit (Bouaké)</span>
              </div>
              <div className="flex justify-between items-end pt-3 border-t border-slate-800 font-bold text-white text-base">
                <span>Total TTC</span>
                <span className="text-orange-400 font-black text-xl">{formatPrice(finalPrice)}</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              className="w-full bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-orange-500/20 text-sm uppercase tracking-wider"
            >
              Passer la Commande <ArrowRight size={18} />
            </button>

            <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400">
              <ShieldCheck size={14} className="text-orange-400" />
              <span>Retrait sécurisé par code unique anti-fraude</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
