// src/pages/admin/AdminDashboardPage.jsx
// Tableau de bord Admin Dark Premium — KPIs, Graphique des Revenus, Activité en direct & Gestion Vendeurs

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp, Users, ShoppingCart, PackageCheck, Eye, Loader2,
  ArrowUpRight, ArrowDownRight, Zap, Store, DollarSign, Activity, ChevronRight,
  Sparkles, CheckCircle2, AlertTriangle, ShieldCheck, Download, Plus, Filter, Clock
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { adminAPI, financeAPI, ordersAPI } from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';

const formatPrice = (p) => new Intl.NumberFormat('fr-CI').format(Number(p || 0)) + ' FCFA';

const STATUS_STYLES = {
  'Livré':            'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25',
  'picked_up':        'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25',
  'En cours':         'bg-blue-500/15 text-blue-400 border border-blue-500/25',
  'ready_for_pickup': 'bg-blue-500/15 text-blue-400 border border-blue-500/25',
  'En attente':       'bg-amber-500/15 text-amber-400 border border-amber-500/25',
  'preparing':        'bg-amber-500/15 text-amber-400 border border-amber-500/25',
  'Annulé':           'bg-red-500/15 text-red-400 border border-red-500/25',
  'cancelled':        'bg-red-500/15 text-red-400 border border-red-500/25',
};

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-3 shadow-xl text-xs">
      <p className="font-bold text-white mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>
          {p.dataKey === 'revenue'
            ? new Intl.NumberFormat('fr-CI').format(p.value) + ' FCFA'
            : `${p.value} commandes`}
        </p>
      ))}
    </div>
  );
};

const AdminRevenueChart = ({ data }) => (
  <ResponsiveContainer width="100%" height={220}>
    <AreaChart data={data}>
      <defs>
        <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%"  stopColor="#f97316" stopOpacity={0.25} />
          <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
      <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
      <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`}
             tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
      <Tooltip content={<ChartTooltip />} />
      <Area type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2.5} fill="url(#revGrad)" />
    </AreaChart>
  </ResponsiveContainer>
);
const PIE_STATUS_COLORS = {
  pending: '#f59e0b',
  confirmed: '#3b82f6',
  preparing: '#60a5fa',
  ready_for_pickup: '#a855f7',
  picked_up: '#10b981',
  delivered: '#10b981',
  cancelled: '#ef4444',
  created: '#94a3b8',
};

const PIE_STATUS_LABELS = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  preparing: 'En cours',
  ready_for_pickup: 'Au relais',
  picked_up: 'Récupérée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
  created: 'Créée',
};

const AdminOrderStatusPieChart = ({ data }) => {
  const chartData = (data || []).filter((d) => d.count > 0).map((d) => ({
    name: PIE_STATUS_LABELS[d.status] || d.status,
    value: Number(d.count || 0),
    color: PIE_STATUS_COLORS[d.status] || '#f97316',
  }));

  if (!chartData.length) {
    return (
      <div className="h-[220px] flex items-center justify-center rounded-2xl border border-dashed border-slate-800 text-xs text-slate-500">
        Aucune commande enregistrée pour le moment.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={75}
          paddingAngle={3}
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} stroke="#0f172a" strokeWidth={2} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value, name) => [`${value} commandes`, name]}
          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '1rem', fontSize: '11px', color: '#fff' }}
        />
        <Legend
          verticalAlign="bottom"
          height={36}
          formatter={(value) => <span className="text-[10px] text-slate-300 font-bold">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};
export default function AdminDashboardPage() {
  const toast = useToast();
  const [statsData, setStatsData] = useState({
    totalRevenue: 0,
    todayOrders: 0,
    activeVendors: 0,
    pickupRate: '0.0%',
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("month");
  const chartData = statsData.revenueByMonth || [];
  const selectedChartMonth = chartData[chartData.length - 1] || null;
  const topVendors = statsData.topVendors || [];

  useEffect(() => {
    loadDashboardData();
    const handleSync = () => loadDashboardData();
    window.addEventListener('anouan_order_status_updated', handleSync);
    return () => window.removeEventListener('anouan_order_status_updated', handleSync);
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [adminStatsRes, ordersRes] = await Promise.all([
        adminAPI.getStats().catch(() => null),
        ordersAPI.getAll({ limit: 5 }).catch(() => null),
      ]);
      const auditRes = await adminAPI.getAuditLogs({ limit: 5 }).catch(() => null);

      if (adminStatsRes?.data) {
        const d = adminStatsRes.data.data || adminStatsRes.data;
        setStatsData((prev) => ({ ...prev, ...d }));
      }

      let fetchedOrders = [];
      if (ordersRes?.data) {
        const raw = ordersRes.data.orders || ordersRes.data.data || ordersRes.data;
        if (Array.isArray(raw)) {
          fetchedOrders = raw.map(ord => ({
            id: ord.tracking_number || ord.id,
            customer: ord.client_name || ord.customer_name || 'Client Anouan',
            vendor: ord.vendor_name || 'Vendeur Anouan',
            amount: Number(ord.total_amount) || 0,
            status: ord.status || 'created',
            date: ord.created_at ? new Date(ord.created_at).toLocaleDateString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : 'Récemment'
          }));
        }
      }

      setRecentOrders(fetchedOrders.slice(0, 5));

      const auditLogs = auditRes?.data?.data || auditRes?.data || [];
      setRecentActivities(Array.isArray(auditLogs) ? auditLogs.map((log) => ({
        time: log.created_at ? new Date(log.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '—',
        text: `${log.user_name || 'Système'} : ${log.action}`,
        icon: log.action?.includes('payout') ? DollarSign : log.action?.includes('vendor') ? Store : Activity,
        color: log.action?.includes('payout') ? 'text-emerald-400' : log.action?.includes('vendor') ? 'text-amber-400' : 'text-blue-400',
      })) : []);
    } catch (err) {
      console.error("Erreur chargement dashboard admin:", err);
      setRecentOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await financeAPI.exportOrders();
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'anouan-express-commandes.csv';
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Export des commandes téléchargé.');
    } catch (err) {
      toast.error('Impossible de générer l’export des commandes.');
    }
  };

  const statCards = [
    {
      title: "Chiffre d'Affaires Global",
      value: formatPrice(statsData.totalRevenue),
      change: statsData.todayRevenue ? `+${formatPrice(statsData.todayRevenue)} ajd` : null,
      isPositive: true,
      icon: DollarSign,
      gradient: 'from-orange-500/20 to-amber-500/10',
      iconBg: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      border: 'border-orange-500/30',
    },
    {
      title: "CA du Mois en Cours",
      value: formatPrice(statsData.thisMonthRevenue || 0),
      change: `${statsData.thisMonthOrders || 0} cmd ce mois`,
      isPositive: true,
      icon: TrendingUp,
      gradient: 'from-amber-500/20 to-orange-500/10',
      iconBg: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      border: 'border-amber-500/30',
    },
    {
      title: "Commandes Enregistrées",
      value: `${statsData.totalOrders || 0}`,
      change: `${statsData.todayOrders || 0} aujourd'hui`,
      isPositive: true,
      icon: ShoppingCart,
      gradient: 'from-blue-500/20 to-cyan-500/10',
      iconBg: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      border: 'border-blue-500/30',
    },
    {
      title: "En Préparation / Relais",
      value: `${statsData.pendingOrders || 0}`,
      change: statsData.cancelledToday ? `${statsData.cancelledToday} annulée(s)` : 'Flux actif',
      isPositive: (statsData.pendingOrders || 0) > 0,
      icon: Clock,
      gradient: 'from-purple-500/20 to-violet-500/10',
      iconBg: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      border: 'border-purple-500/30',
    },
    {
      title: "Clients Inscrits",
      value: statsData.totalClients || 0,
      change: statsData.newClientsThisMonth || statsData.newUsersThisMonth ? `+${statsData.newClientsThisMonth || statsData.newUsersThisMonth} ce mois` : null,
      isPositive: true,
      icon: Users,
      gradient: 'from-emerald-500/20 to-teal-500/10',
      iconBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      border: 'border-emerald-500/30',
    },
    {
      title: "Taux de Retrait",
      value: statsData.pickupRate || '0.0%',
      isPositive: true,
      icon: PackageCheck,
      gradient: 'from-amber-500/20 to-yellow-500/10',
      iconBg: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      border: 'border-amber-500/30',
    },
  ];

  return (
    <div className="space-y-8 text-slate-100 font-sans">

      <PageHeader
        eyebrow="Console d'Administration Live"
        eyebrowIcon={Activity}
        title="Vue d'Ensemble Anouan Express"
        subtitle={(
          <span className="flex flex-wrap items-center gap-3">
            <span>Supervision des ventes, retraits au magasin central et activités vendeurs à Bouaké</span>
            {statsData.liveConnections > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black rounded-full animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> {statsData.liveConnections} en ligne
              </span>
            )}
          </span>
        )}
        actions={
          <>
            <Link
              to="/admin/vendors"
              className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-black px-4 py-2.5 rounded-2xl transition-all shadow-lg text-xs"
            >
              <Store size={15} /> Valider Vendeurs <span className="bg-slate-950 text-orange-400 text-[10px] font-black px-1.5 py-0.5 rounded-full">3</span>
            </Link>
            <Link
              to="/admin/users"
              className="flex items-center gap-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all"
            >
              <Users size={15} className="text-orange-400" /> Gestion Utilisateurs
            </Link>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 bg-slate-900 border border-slate-800 hover:border-orange-500/40 text-slate-300 hover:text-white px-4 py-2.5 rounded-2xl text-xs font-bold transition-all"
            >
              <Download size={15} className="text-orange-400" /> Exporter CSV
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((stat, i) => (
          <StatCard
            key={i}
            title={stat.title}
            value={stat.value}
            change={stat.change}
            isPositive={stat.isPositive}
            icon={stat.icon}
            gradient={stat.gradient}
            iconBg={stat.iconBg}
            border={stat.border}
          />
        ))}
      </div>

      {/* Graphique Interactif des Ventes & Flux de Titres */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Graphique Visuel des Revenus (2 cols) */}
        <div className="lg:col-span-2 glass-panel rounded-3xl p-6 border border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <TrendingUp size={18} className="text-orange-400" /> Évolution du Chiffre d'Affaires (2026)
              </h2>
              <p className="text-xs text-slate-400">Volume total des transactions enregistrées sur Anouan Express</p>
            </div>
            <div className="text-xs font-black text-orange-400 bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 rounded-xl">
              {selectedChartMonth ? `${selectedChartMonth.month} 2026 : ${formatPrice(selectedChartMonth.revenue)}` : 'Aucune donnée historique'}
            </div>
          </div>

          {/* Graphique Recharts interactif */}
          {chartData.length > 0 ? (
            <AdminRevenueChart data={chartData} />
          ) : (
            <div className="h-[220px] flex items-center justify-center rounded-2xl border border-dashed border-slate-800 text-xs text-slate-500">
              L’historique mensuel sera disponible après synchronisation des données.
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>La croissance sera calculée sur les données réelles.</span>
            <span>Prévisions indisponibles</span>
          </div>
        </div>

        {/* Ticker d'Activité en Direct (1 col) */}
        <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-5 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <Activity size={18} className="text-orange-400" /> Flux d'Activité Live
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Événements en temps réel sur la plateforme</p>
          </div>

          <div className="space-y-4 flex-1 my-2">
            {recentActivities.length > 0 ? recentActivities.map((act, idx) => {
              const Icon = act.icon;
              return (
                <div key={idx} className="flex items-start gap-3 text-xs">
                  <div className={`p-2 rounded-xl bg-slate-900 border border-slate-800 ${act.color} shrink-0 mt-0.5`}>
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-200 font-bold leading-snug">{act.text}</p>
                    <span className="text-[10px] text-slate-500 font-semibold">{act.time}</span>
                  </div>
                </div>
              );
            }) : (
              <div className="h-full min-h-32 flex items-center justify-center rounded-2xl border border-dashed border-slate-800 text-xs text-slate-500 text-center px-4">
                Aucun événement récent à afficher.
              </div>
            )}
          </div>

          <button
            onClick={() => toast.info('Flux d\'événements système synchronisé en direct.')}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-2xl border border-slate-800 text-xs font-bold transition-all text-center"
          >
            Actualiser le flux
          </button>
        </div>
      </div>

      {/* Graphique de Répartition des Commandes par Statut */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <PackageCheck size={18} className="text-orange-400" /> Répartition du Flux des Commandes
            </h2>
            <p className="text-xs text-slate-400">Statut en temps réel des commandes dans le réseau Bouaké</p>
          </div>
          <div className="text-xs font-bold text-slate-400">
            Total actif : <span className="text-white font-black">{statsData.pendingOrders || 0} commandes en cours</span>
          </div>
        </div>

        <AdminOrderStatusPieChart data={statsData.ordersByStatus || statsData.orderStatuses || []} />
      </div>

      {/* Section Commandes Récentes & Top Vendeurs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Tableau Commandes Récentes (2 cols) */}
        <div className="lg:col-span-2 glass-panel rounded-3xl border border-slate-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
            <div>
              <h2 className="text-sm font-black text-white">Dernières Commandes</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Transactions récentes enregistrées</p>
            </div>
            <Link to="/admin/orders" className="text-[11px] font-bold text-orange-400 hover:underline flex items-center gap-1">
              Voir tout <ChevronRight size={13} />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-500 text-[10px] uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3.5 font-bold">Commande</th>
                  <th className="px-5 py-3.5 font-bold">Client / Boutique</th>
                  <th className="px-5 py-3.5 font-bold">Montant</th>
                  <th className="px-5 py-3.5 font-bold">Statut</th>
                  <th className="px-5 py-3.5 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recentOrders.map((order, i) => (
                  <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-3.5 font-black text-white">#{order.id}</td>
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-200">{order.customer || order.client_name || 'Client'}</div>
                      <div className="text-slate-400 text-[10px]">{order.vendor || order.store_name || 'Magasin Central'}</div>
                    </td>
                    <td className="px-5 py-3.5 font-black text-orange-400">{formatPrice(order.amount || order.total_amount)}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${STATUS_STYLES[order.status] || 'bg-slate-800 text-slate-400'}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link to="/admin/orders" className="p-1.5 inline-flex text-slate-400 hover:text-orange-400 hover:bg-orange-500/10 rounded-xl transition-colors">
                        <Eye size={15} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Vendeurs & Top Produits (1 col) */}
        <div className="space-y-6">
          <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-5">
            <div>
              <h2 className="text-sm font-black text-white">Top Vendeurs à Bouaké</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Boutiques les plus performantes ce mois</p>
            </div>

            <div className="space-y-4">
              {topVendors.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                  Les performances vendeurs seront disponibles après synchronisation.
                </div>
              ) : topVendors.map((vendor, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-[10px] font-black shrink-0 ${
                    i === 0 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : i === 1 ? 'bg-slate-400/10 text-slate-400 border border-slate-700'
                    : 'bg-slate-800/50 text-slate-500 border border-slate-800'
                  }`}>
                    #{i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-white truncate">{vendor.name}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{vendor.orders.toLocaleString()} ventes • ⭐ {vendor.rating}</div>
                    <div className="mt-1.5 h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full"
                        style={{ width: `${Math.min(100, Math.round((vendor.orders / Math.max(1, topVendors[0]?.orders || 1)) * 100))}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Link
              to="/admin/vendors"
              className="flex items-center justify-center gap-2 w-full py-2.5 mt-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold rounded-2xl border border-slate-800 transition-all"
            >
              Voir toutes les boutiques <ChevronRight size={14} />
            </Link>
          </div>

          {/* Top 5 Produits les Plus Vendus */}
          <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-5">
            <div>
              <h2 className="text-sm font-black text-white">Top 5 Meilleures Ventes</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Articles phares sur Anouan Express</p>
            </div>

            <div className="space-y-3">
              {(statsData.topProducts || []).length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                  Les meilleures ventes apparaîtront au fil des commandes.
                </div>
              ) : statsData.topProducts.map((prod, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs p-2.5 rounded-2xl bg-slate-900/60 border border-slate-800">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 h-6 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 font-black text-[10px] flex items-center justify-center shrink-0">
                      #{idx + 1}
                    </span>
                    <span className="font-bold text-white truncate max-w-[140px]">{prod.name}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-orange-400 font-bold">{prod.sales} ventes</span>
                    <p className="text-[10px] text-slate-500">{formatPrice(prod.revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
