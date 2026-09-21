// src/pages/vendor/VendorDashboardPage.jsx
// Tableau de bord Vendeur Dark Premium — KPIs, Graphique des ventes, Alertes Stock & Derniers Avis Clients

import React, { useState, useEffect } from 'react';
import {
  TrendingUp, ShoppingBag, Package, Star, Eye, ArrowUpRight, Clock, ChevronRight,
  Plus, DollarSign, AlertTriangle, CheckCircle2, Store, Sparkles, RefreshCw, MessageSquare
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { vendorsAPI, ordersAPI, productsAPI, reviewsAPI } from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import VendorAnalyticsChart from '../../components/vendor/VendorAnalyticsChart';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';

const formatPrice = (p) => new Intl.NumberFormat('fr-CI').format(Number(p || 0)) + ' FCFA';
const formatDate  = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

const STATUS_MAP = {
  preparing:        { label: 'En préparation',  cls: 'bg-amber-500/15 text-amber-400 border-amber-500/25' },
  shipped_to_store: { label: 'Expédié Magasin',  cls: 'bg-blue-500/15 text-blue-400 border-blue-500/25' },
  ready_for_pickup: { label: 'Prêt au retrait',  cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' },
  picked_up:        { label: 'Retiré par client', cls: 'bg-slate-500/15 text-slate-400 border-slate-500/25' },
  cancelled:        { label: 'Annulé',           cls: 'bg-red-500/15 text-red-400 border-red-500/25' },
  created:          { label: 'Créé',             cls: 'bg-orange-500/15 text-orange-400 border-orange-500/25' },
};
const getStatus = (s) => STATUS_MAP[s] || { label: s, cls: 'bg-slate-800 text-slate-400 border-slate-700' };


const LOW_STOCK_ITEMS = [
  { id: 101, name: 'Pagne Baoulé Tissé Main Traditionnel', stock: 2, category: 'Mode & Pagne Kita' },
  { id: 6,   name: 'Sac à Main Cuir & Pagne WAX',        stock: 3, category: 'Accessoires' },
];

export default function VendorDashboardPage() {
  const toast = useToast();
  const [stats, setStats] = useState({
    totalRevenue: 0,
    monthRevenue: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalProducts: 0,
    activeProducts: 0,
    avgRating: 0,
    reviewCount: 0,
  });
  const [vendorProfile, setVendorProfile] = useState(null);
  const [orderSummary, setOrderSummary] = useState({ deposited: 0, pickedUp: 0, averageBasket: 0 });
  const [recentReviews, setRecentReviews] = useState([]);

  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadVendorData = () => {
    Promise.all([
      vendorsAPI.getDashboard().catch(() => null),
      vendorsAPI.getMyVendor().catch(() => null),
      ordersAPI.getVendorOrders().catch(() => null),
      productsAPI.getVendorProducts().catch(() => null),
    ]).then(([dashRes, profileRes, ordersRes, prodsRes]) => {
      if (dashRes?.data) setStats((prev) => ({ ...prev, ...(dashRes.data?.data || dashRes.data) }));
      if (profileRes?.data) setVendorProfile(profileRes.data?.data || profileRes.data);
      const profile = profileRes?.data?.data || profileRes?.data;
      if (profile?.id) {
        reviewsAPI.getVendorReviews(profile.id, { limit: 3 })
          .then((reviewRes) => setRecentReviews(reviewRes.data?.data || reviewRes.data || []))
          .catch(() => setRecentReviews([]));
      }
      const raw = ordersRes?.data?.orders || ordersRes?.data?.data || ordersRes?.data || [];
      const fetched = Array.isArray(raw) ? raw.map(o => ({
        id: o.tracking_number || o.id,
        client: o.client_name || 'Client Anouan',
        amount: Number(o.total_amount) || 0,
        status: o.status || 'created',
        created_at: o.created_at
      })) : [];

      const totalAmount = fetched.reduce((sum, order) => sum + order.amount, 0);
      setOrderSummary({
        deposited: fetched.filter((order) => ['shipped_to_store', 'ready_for_pickup', 'picked_up'].includes(order.status)).length,
        pickedUp: fetched.filter((order) => order.status === 'picked_up').length,
        averageBasket: fetched.length ? totalAmount / fetched.length : 0,
      });

      setRecentOrders(fetched.slice(0, 5));

      const rawProds = prodsRes?.data?.data || prodsRes?.data || [];
      if (Array.isArray(rawProds)) {
        const low = rawProds.filter(p => Number(p.stock || 0) <= 5);
        setLowStockProducts(low.slice(0, 5));
      }
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadVendorData();
    const handleSync = () => loadVendorData();
    window.addEventListener('anouan_order_status_updated', handleSync);
    return () => window.removeEventListener('anouan_order_status_updated', handleSync);
  }, []);

  const kpis = [
    { title: 'Revenus Totaux',  value: formatPrice(stats.totalRevenue),  sub: formatPrice(stats.monthRevenue) + ' ce mois', icon: TrendingUp, grad: 'from-orange-500/20 to-amber-500/10',   iconCls: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
    { title: 'Commandes',       value: stats.totalOrders,                sub: `${stats.pendingOrders || 0} à préparer`,    icon: ShoppingBag, grad: 'from-blue-500/20 to-cyan-500/10',    iconCls: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    { title: 'Articles en Vente', value: stats.totalProducts,            sub: `${stats.activeProducts || 0} actifs sur site`, icon: Package,     grad: 'from-purple-500/20 to-violet-500/10', iconCls: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
    { title: 'Note Boutique',    value: Number(stats.avgRating || 4.9).toFixed(1) + ' ⭐', sub: `${stats.reviewCount || 184} avis clients`, icon: Star, grad: 'from-amber-500/20 to-yellow-500/10', iconCls: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  ];
  const monthlyGoal = 5000000;
  const monthlyProgress = Math.min(100, Math.round((Number(stats.monthRevenue || 0) / monthlyGoal) * 100));

  if (loading) return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-slate-900 rounded-3xl"/>)}
      </div>
      <div className="h-64 bg-slate-900 rounded-3xl"/>
    </div>
  );

  return (
    <div className="space-y-8 text-slate-100 font-sans">
      
      <PageHeader
        eyebrow="Espace Vendeur Partenaire"
        eyebrowIcon={Store}
        title={`Boutique « ${vendorProfile?.shop_name || 'Votre boutique'} »`}
        subtitle="Gestion de votre catalogue, commandes et dépôts au point relais"
        actions={
          <>
            <Link
              to="/vendor/products"
              className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-black px-4 py-2.5 rounded-2xl transition-all shadow-lg text-xs"
            >
              <Plus size={16} /> Ajouter un Produit
            </Link>
            <Link
              to="/vendor/finance"
              className="flex items-center gap-2 bg-slate-900 border border-slate-800 hover:border-orange-500/40 text-slate-200 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all"
            >
              💸 Demander Versement
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpis.map((k, i) => (
          <StatCard
            key={i}
            title={k.title}
            value={k.value}
            change={k.sub}
            isPositive={true}
            icon={k.icon}
            gradient={k.grad}
            iconBg={k.iconCls}
            border="border-slate-800"
          />
        ))}
      </div>

      {/* Jauge d'objectif du mois & Alertes de Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Objectif Mensuel des Ventes (2 cols) */}
        <div className="lg:col-span-2 glass-panel rounded-3xl p-6 border border-slate-800 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <Sparkles size={18} className="text-orange-400" /> Objectif de Ventes du Mois
              </h2>
              <p className="text-xs text-slate-400">Progression vers votre objectif de 5 000 000 FCFA</p>
            </div>
            <span className="text-sm font-black text-orange-400 bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 rounded-xl">
              {monthlyProgress}% Atteint
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-300">Réalisé : <strong className="text-white">{formatPrice(stats.monthRevenue)}</strong></span>
              <span className="text-slate-400">Objectif : 5 000 000 FCFA</span>
            </div>
            <div className="h-3 bg-slate-900 border border-slate-800 rounded-full overflow-hidden p-0.5">
              <div className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full shadow-lg shadow-orange-500/50 transition-all duration-500" style={{ width: `${monthlyProgress}%` }} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-2 text-center text-xs">
            <div className="p-3 bg-slate-900/60 rounded-2xl border border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Dépôts au Magasin</span>
              <span className="text-base font-black text-white">{orderSummary.deposited} colis</span>
            </div>
            <div className="p-3 bg-slate-900/60 rounded-2xl border border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Retraits Validés</span>
              <span className="text-base font-black text-emerald-400">{orderSummary.pickedUp} colis</span>
            </div>
            <div className="p-3 bg-slate-900/60 rounded-2xl border border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Panier Moyen</span>
              <span className="text-base font-black text-orange-400">{formatPrice(orderSummary.averageBasket)}</span>
            </div>
          </div>

          {/* Graphique performances Recharts */}
          <VendorAnalyticsChart />
        </div>

        {/* Alerte Stock Faible (1 col) */}
        <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-black text-white flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-400" /> Stock Faible (&le; 5)
            </h2>
            <span className="text-[10px] font-bold bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/20">
              {lowStockProducts.length} article{lowStockProducts.length > 1 ? 's' : ''}
            </span>
          </div>

          <div className="space-y-3">
            {lowStockProducts.length === 0 ? (
              <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800 text-center text-xs text-slate-400">
                <CheckCircle2 size={24} className="text-emerald-400 mx-auto mb-1.5" />
                <span>Tous vos stocks sont confortables (&gt; 5 unités).</span>
              </div>
            ) : (
              lowStockProducts.map((item) => (
                <div key={item.id} className="p-3 bg-slate-900 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
                  <div className="min-w-0 pr-2">
                    <p className="font-bold text-white truncate">{item.title || item.name}</p>
                    <span className="text-[10px] text-amber-400 font-bold">Reste seulement {item.stock} unités</span>
                  </div>
                  <Link
                    to="/vendor/products"
                    className="shrink-0 p-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 rounded-xl font-bold text-[10px] border border-orange-500/20 transition-all"
                  >
                    Réassort
                  </Link>
                </div>
              ))
            )}
          </div>

          <Link
            to="/vendor/products"
            className="block text-center text-xs text-slate-400 hover:text-white font-bold pt-1"
          >
            Gérer tout le stock &rarr;
          </Link>
        </div>
      </div>

      {/* Dernières commandes & Avis Clients */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Dernières commandes (2 cols) */}
        <div className="lg:col-span-2 glass-panel rounded-3xl border border-slate-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black text-white">Dernières Commandes Boutique</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Commandes nécessitant un dépôt au Magasin Central</p>
            </div>
            <Link to="/vendor/orders" className="text-[11px] font-bold text-orange-400 hover:underline flex items-center gap-1">
              Voir tout <ChevronRight size={13}/>
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-900/80 text-slate-400 text-[10px] uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-5 py-4 font-bold">N° Commande</th>
                  <th className="px-5 py-4 font-bold">Montant</th>
                  <th className="px-5 py-4 font-bold">Statut</th>
                  <th className="px-5 py-4 font-bold">Date</th>
                  <th className="px-5 py-4 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recentOrders.map((order, i) => {
                  const st = getStatus(order.status);
                  return (
                    <tr key={order.id || i} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-4 font-black text-white">#{String(order.id).toUpperCase()}</td>
                      <td className="px-5 py-4 font-black text-orange-400">{formatPrice(order.total_amount)}</td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${st.cls}`}>{st.label}</span>
                      </td>
                      <td className="px-5 py-4 text-slate-400">{formatDate(order.created_at)}</td>
                      <td className="px-5 py-4 text-right">
                        <Link to="/vendor/orders" className="p-1.5 inline-flex text-slate-400 hover:text-orange-400 hover:bg-orange-500/10 rounded-xl transition-colors">
                          <Eye size={15}/>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Derniers Avis Clients (1 col) */}
        <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-black text-white flex items-center gap-2">
              <MessageSquare size={16} className="text-orange-400" /> Derniers Avis Clients
            </h2>
            <span className="text-amber-400 font-bold text-xs flex items-center gap-1">
              <Star size={12} className="fill-current" /> {Number(stats.avgRating || 0).toFixed(1)} / 5
            </span>
          </div>

          <div className="space-y-3">
            {recentReviews.length === 0 && (
              <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 text-xs text-slate-500 text-center">Aucun avis client pour le moment.</div>
            )}
            {recentReviews.map((rev) => (
              <div key={rev.id} className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white text-xs">{rev.client_name || 'Client Anouan'}</span>
                  <div className="flex text-amber-400 text-[10px]">
                    {[...Array(rev.rating)].map((_, i) => <Star key={i} size={10} className="fill-current" />)}
                  </div>
                </div>
                <p className="text-[11px] text-slate-300 leading-snug">{rev.comment || 'Avis sans commentaire.'}</p>
                <span className="text-[9px] text-slate-500 font-semibold block pt-0.5">{formatDate(rev.created_at)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
