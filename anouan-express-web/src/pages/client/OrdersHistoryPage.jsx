// src/pages/client/OrdersHistoryPage.jsx
// Page Historique des Commandes Client — Thème Dark Premium Orange Vibrant avec filtres & KPIs

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  Package,
  TrendingUp,
  ChevronRight,
  Loader2,
  Filter,
  ArrowUpRight,
  Receipt,
  Store,
  MapPin,
  RefreshCw,
  AlertCircle,
  Star
} from 'lucide-react';
import { ordersAPI } from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import PageHeader from '../../components/ui/PageHeader';
import ReviewModal from '../../components/client/ReviewModal';

const formatPrice = (p) => new Intl.NumberFormat('fr-CI').format(Number(p || 0)) + ' FCFA';

const STATUS_LABELS = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  preparing: 'En préparation',
  ready_for_pickup: 'Prête au relais',
  picked_up: 'Récupérée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
};

const STATUS_BADGES = {
  pending: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  confirmed: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  preparing: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  ready_for_pickup: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  picked_up: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  delivered: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/30',
};

export default function OrdersHistoryPage() {
  const toast = useToast();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    activeOrders: 0,
    completedOrders: 0,
  });
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [reviewOrder, setReviewOrder] = useState(null);

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    loadOrders();
  }, [page, selectedStatus]);

  const loadStats = async () => {
    setLoadingStats(true);
    try {
      const res = await ordersAPI.getMyStats();
      if (res.data?.data) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.warn('Impossible de charger les statistiques commandes:', err.message);
    } finally {
      setLoadingStats(false);
    }
  };

  const loadOrders = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 10,
        ...(selectedStatus !== 'all' ? { status: selectedStatus } : {})
      };
      const res = await ordersAPI.getMyOrders(params);
      const data = res.data?.data || res.data?.orders || [];
      setOrders(Array.isArray(data) ? data : []);
      if (res.data?.pagination?.totalPages) {
        setTotalPages(res.data.pagination.totalPages);
      }
    } catch (err) {
      toast.error('Erreur lors du chargement des commandes.');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const statusFilters = [
    { id: 'all', label: 'Toutes' },
    { id: 'pending', label: 'En attente' },
    { id: 'preparing', label: 'En cours' },
    { id: 'ready_for_pickup', label: 'Prêtes au relais' },
    { id: 'picked_up', label: 'Livrées' },
    { id: 'cancelled', label: 'Annulées' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 py-8 font-sans selection:bg-orange-500 selection:text-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        <PageHeader
          eyebrow="Espace Client"
          eyebrowIcon={ShoppingBag}
          title="Historique de mes Commandes"
          subtitle="Consultez l'historique complet de vos achats, le statut de préparation et téléchargez vos justificatifs."
          actions={
            <Link
              to="/catalog"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-black px-5 py-2.5 rounded-2xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-orange-500/20"
            >
              Nouvel Achat <ChevronRight size={14} />
            </Link>
          }
        />

        {/* Cartes KPIs Client */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 bg-slate-900/60 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Dépensé</p>
                <h3 className="text-2xl font-black text-white mt-1">
                  {loadingStats ? <Loader2 className="w-5 h-5 animate-spin text-orange-500" /> : formatPrice(stats.totalSpent)}
                </h3>
              </div>
              <div className="p-3 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-2xl">
                <TrendingUp size={20} />
              </div>
            </div>
            <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-orange-500/5 rounded-full blur-xl pointer-events-none" />
          </div>

          <div className="glass-panel p-6 rounded-3xl border border-slate-800 bg-slate-900/60 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Commandes Réalisées</p>
                <h3 className="text-2xl font-black text-white mt-1">
                  {loadingStats ? <Loader2 className="w-5 h-5 animate-spin text-blue-500" /> : stats.totalOrders}
                </h3>
              </div>
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-2xl">
                <Package size={20} />
              </div>
            </div>
            <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-blue-500/5 rounded-full blur-xl pointer-events-none" />
          </div>

          <div className="glass-panel p-6 rounded-3xl border border-slate-800 bg-slate-900/60 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">En Cours / Prêtes</p>
                <h3 className="text-2xl font-black text-white mt-1">
                  {loadingStats ? <Loader2 className="w-5 h-5 animate-spin text-emerald-500" /> : stats.activeOrders}
                </h3>
              </div>
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl">
                <Clock size={20} />
              </div>
            </div>
            <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
          </div>
        </div>

        {/* Filtres de Statut */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {statusFilters.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setSelectedStatus(tab.id);
                setPage(1);
              }}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 border ${
                selectedStatus === tab.id
                  ? 'bg-orange-500 text-slate-950 border-orange-500 shadow-lg shadow-orange-500/20'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
          <button
            onClick={() => {
              loadOrders();
              loadStats();
            }}
            className="ml-auto p-2 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Rafraîchir"
          >
            <RefreshCw size={15} />
          </button>
        </div>

        {/* Liste des Commandes */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            <p className="text-xs text-slate-400">Chargement de votre historique...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="glass-panel p-12 rounded-3xl border border-slate-800 text-center space-y-4 max-w-md mx-auto">
            <div className="w-16 h-16 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-600">
              <ShoppingBag size={28} />
            </div>
            <h3 className="text-lg font-bold text-white">Aucune commande trouvée</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {selectedStatus !== 'all'
                ? `Vous n'avez pas de commande avec le statut "${STATUS_LABELS[selectedStatus] || selectedStatus}".`
                : "Vous n'avez pas encore passé de commande sur Anouan Express."}
            </p>
            <Link
              to="/catalog"
              className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-6 py-3 rounded-2xl shadow-lg shadow-orange-500/20 transition-all"
            >
              Découvrir les Boutiques de Bouaké
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const itemsCount = (order.items || []).reduce((acc, i) => acc + (i.quantity || 1), 0) || 1;
              const dateFormatted = order.created_at
                ? new Date(order.created_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : 'Date inconnue';

              return (
                <div
                  key={order.id}
                  className="glass-panel rounded-3xl border border-slate-800 hover:border-slate-700 bg-slate-900/60 p-5 sm:p-6 transition-all space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 shrink-0">
                        <Receipt size={18} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-white">Commande #{order.id?.slice?.(0, 8) || order.id}</span>
                          <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${STATUS_BADGES[order.status] || 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                            {STATUS_LABELS[order.status] || order.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{dateFormatted}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      <div className="sm:text-right">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Montant</span>
                        <span className="text-base font-black text-orange-400">{formatPrice(order.total_amount)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {(order.status === 'picked_up' || order.status === 'delivered') && (
                          <button
                            onClick={() => setReviewOrder(order)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 rounded-xl text-xs font-bold transition-all border border-amber-500/30"
                          >
                            <Star size={13} className="fill-amber-400" /> Évaluer
                          </button>
                        )}
                        <Link
                          to={`/orders/${order.id}/tracking`}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all border border-slate-700"
                        >
                          Suivre <ArrowUpRight size={14} className="text-orange-400" />
                        </Link>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      <Store size={14} className="text-slate-500" />
                      <span>{order.store_name || 'Point Relais Bouaké'}</span>
                    </div>

                    <div className="flex items-center gap-4">
                      <span>{itemsCount} article{itemsCount > 1 ? 's' : ''}</span>
                      <span className="w-1 h-1 bg-slate-700 rounded-full" />
                      <span className="capitalize">{order.payment_method || 'Mobile Money'}</span>
                    </div>
                  </div>
                </div>
              );
            })}

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-6">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 disabled:opacity-40"
                >
                  Précédent
                </button>
                <span className="text-xs text-slate-400 px-3">
                  Page {page} sur {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 disabled:opacity-40"
                >
                  Suivant
                </button>
              </div>
            )}
          </div>
        )}

        {/* Modal d'évaluation de commande */}
        {reviewOrder && (
          <ReviewModal
            isOpen={!!reviewOrder}
            order={reviewOrder}
            onClose={() => setReviewOrder(null)}
            onSuccess={() => {
              loadOrders();
            }}
          />
        )}

      </div>
    </div>
  );
}
