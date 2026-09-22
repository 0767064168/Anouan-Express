// src/pages/admin/AdminWeeklyReportPage.jsx
// Rapport hebdomadaire admin : graphique barres, KPIs, top vendeurs/produits

import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp, TrendingDown, ChevronLeft, ChevronRight,
  Package, ShoppingCart, DollarSign,
  BarChart3, Users, Award, Download, RefreshCw, Calendar
} from 'lucide-react';
import { adminAPI, financeAPI } from '../../services/api';
import { downloadCSVBlob } from '../../utils/exportUtils';
import PageHeader from '../../components/ui/PageHeader';

const formatPrice = (p) => new Intl.NumberFormat('fr-CI').format(Number(p || 0)) + ' FCFA';
const formatNum = (n) => new Intl.NumberFormat('fr-CI').format(Number(n || 0));

// Composant graphique barres SVG natif (sans dependance externe)
function BarChart({ data }) {
  const maxOrders = Math.max(...data.map(d => d.orders), 1);
  return (
    <div className="w-full h-52 flex items-end gap-1.5 px-2 pb-8 relative">
      {[0, 25, 50, 75, 100].map(pct => (
        <div
          key={pct}
          className="absolute left-0 right-0 border-t border-slate-800/60"
          style={{ bottom: `calc(${pct}% + 2rem)` }}
        />
      ))}
      {data.map((day, i) => {
        const heightPct = maxOrders > 0 ? (day.orders / maxOrders) * 100 : 0;
        const isToday = day.date === new Date().toISOString().slice(0, 10);
        return (
          <div
            key={i}
            className="flex-1 flex flex-col items-center gap-1 group relative"
            style={{ height: '100%', justifyContent: 'flex-end' }}
          >
            <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
              <div className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-center shadow-xl whitespace-nowrap">
                <p className="text-xs font-black text-white">{day.label}</p>
                <p className="text-[10px] text-orange-400 font-bold">{formatNum(day.orders)} commandes</p>
                <p className="text-[10px] text-emerald-400">{formatPrice(day.revenue)}</p>
              </div>
              <div className="w-2 h-2 bg-slate-800 border-r border-b border-slate-700 rotate-45 -mt-1" />
            </div>
            <div
              className={`w-full rounded-t-xl transition-all duration-500 ${
                isToday
                  ? 'bg-gradient-to-t from-orange-600 to-orange-400 shadow-lg shadow-orange-500/30'
                  : day.orders > 0
                  ? 'bg-gradient-to-t from-slate-600 to-slate-500 group-hover:from-orange-600/70 group-hover:to-orange-400/70'
                  : 'bg-slate-800/50'
              }`}
              style={{ height: `${Math.max(heightPct, day.orders > 0 ? 4 : 2)}%` }}
            />
            <span className={`absolute bottom-0 text-[10px] font-bold ${isToday ? 'text-orange-400' : 'text-slate-500'}`}>
              {day.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function PctBadge({ pct }) {
  if (pct === null || pct === undefined) return null;
  const isPos = pct >= 0;
  const Icon = isPos ? TrendingUp : TrendingDown;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
      isPos ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
    }`}>
      <Icon size={10} />
      {isPos ? '+' : ''}{pct}%
    </span>
  );
}

export default function AdminWeeklyReportPage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  const loadReport = useCallback(async (offset) => {
    setLoading(true);
    setError('');
    try {
      const res = await adminAPI.getWeeklyReport({ weekOffset: offset });
      setReport(res.data?.data || null);
    } catch (e) {
      setError(e.response?.data?.message || 'Erreur lors du chargement du rapport.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReport(weekOffset);
  }, [weekOffset, loadReport]);

  const handleExportOrders = async () => {
    setExporting(true);
    try {
      const params = report?.week ? { dateFrom: report.week.start, dateTo: report.week.end } : {};
      const res = await financeAPI.exportOrders(params);
      downloadCSVBlob(res.data, `rapport-commandes-semaine`);
    } catch (e) {
      alert('Erreur export CSV');
    } finally {
      setExporting(false);
    }
  };

  const weekLabel = report?.week
    ? `${report.week.start} \u2192 ${report.week.end}`
    : weekOffset === 0 ? 'Semaine en cours' : `Semaine ${weekOffset}`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <PageHeader
          eyebrow="Administration"
          title="Rapport Hebdomadaire"
          subtitle="Analyse des performances par semaine"
          actions={
            <div className="flex items-center gap-2">
              <button
                onClick={() => loadReport(weekOffset)}
                disabled={loading}
                className="p-2 rounded-2xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-colors"
                title="Actualiser"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              </button>
              <button
                onClick={handleExportOrders}
                disabled={exporting || loading}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-2xl transition-colors disabled:opacity-50"
              >
                <Download size={15} />
                {exporting ? 'Export...' : 'Exporter CSV'}
              </button>
            </div>
          }
        />

        {/* Navigation semaines */}
        <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3">
          <button onClick={() => setWeekOffset(w => w - 1)} className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
            <ChevronLeft size={18} />
          </button>
          <div className="flex items-center gap-3">
            <Calendar size={16} className="text-orange-400" />
            <div className="text-center">
              <p className="text-sm font-black text-white">{weekLabel}</p>
              {weekOffset < 0 && (
                <button onClick={() => setWeekOffset(0)} className="text-[10px] text-orange-400 hover:underline">
                  \u2190 Revenir \u00e0 la semaine actuelle
                </button>
              )}
              {weekOffset === 0 && <p className="text-[10px] text-emerald-400 font-bold">\u2022 Semaine en cours</p>}
            </div>
          </div>
          <button
            onClick={() => { if (weekOffset < 0) setWeekOffset(w => w + 1); }}
            disabled={weekOffset >= 0}
            className={`p-2 rounded-xl transition-colors ${weekOffset >= 0 ? 'text-slate-700 cursor-not-allowed' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-red-400 text-sm">{error}</div>
        )}

        {loading && !report && (
          <div className="text-center py-16 text-slate-500">
            <RefreshCw size={32} className="animate-spin mx-auto mb-3 text-orange-400" />
            <p className="text-sm">Chargement du rapport...</p>
          </div>
        )}

        {report && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-orange-500/15 via-slate-900 to-slate-900 border border-orange-500/25 rounded-3xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <ShoppingCart size={18} className="text-orange-400" />
                  <PctBadge pct={report.vs_prev?.orders_pct} />
                </div>
                <p className="text-3xl font-black text-white">{formatNum(report.kpi.total_orders)}</p>
                <p className="text-xs text-slate-400 mt-1">Commandes</p>
              </div>
              <div className="bg-gradient-to-br from-emerald-500/15 via-slate-900 to-slate-900 border border-emerald-500/25 rounded-3xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <DollarSign size={18} className="text-emerald-400" />
                  <PctBadge pct={report.vs_prev?.revenue_pct} />
                </div>
                <p className="text-xl font-black text-white">{formatPrice(report.kpi.total_revenue)}</p>
                <p className="text-xs text-slate-400 mt-1">Revenus totaux</p>
              </div>
              <div className="bg-gradient-to-br from-blue-500/15 via-slate-900 to-slate-900 border border-blue-500/25 rounded-3xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <Package size={18} className="text-blue-400" />
                  <PctBadge pct={report.vs_prev?.picked_up_pct} />
                </div>
                <p className="text-3xl font-black text-white">{formatNum(report.kpi.picked_up)}</p>
                <p className="text-xs text-slate-400 mt-1">Colis remis</p>
              </div>
              <div className="bg-gradient-to-br from-purple-500/15 via-slate-900 to-slate-900 border border-purple-500/25 rounded-3xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <BarChart3 size={18} className="text-purple-400" />
                </div>
                <p className="text-xl font-black text-white">{formatPrice(report.kpi.avg_basket)}</p>
                <p className="text-xs text-slate-400 mt-1">Panier moyen</p>
              </div>
            </div>

            {/* Graphique barres */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-sm font-black text-white">Commandes par jour</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">Lundi \u2192 Dimanche</p>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-slate-500">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-orange-500 inline-block" /> Aujourd'hui</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-slate-600 inline-block" /> Autres jours</span>
                </div>
              </div>
              <BarChart data={report.daily} />
              <div className="grid grid-cols-7 gap-1 mt-1">
                {report.daily.map((day, i) => (
                  <div key={i} className="text-center">
                    <p className="text-[9px] text-slate-600">{day.orders > 0 ? formatPrice(day.revenue).replace(' FCFA','') : '\u2014'}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5">
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-2">Meilleur jour</p>
                <p className="text-xl font-black text-white">{report.summary?.best_day?.label || '—'}</p>
                <p className="text-sm text-slate-400 mt-1">
                  {report.summary?.best_day?.orders || 0} commandes • {formatPrice(report.summary?.best_day?.revenue || 0)}
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5">
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-2">Panier moyen</p>
                <p className="text-xl font-black text-white">{formatPrice(report.kpi?.avg_order_value || 0)}</p>
                <p className="text-sm text-slate-400 mt-1">
                  {report.kpi?.avg_order_value ? 'Moyenne de la semaine' : 'Pas de commande'}
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5">
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-2">Taux d’annulation</p>
                <p className="text-xl font-black text-white">{report.kpi?.cancel_rate ?? 0}%</p>
                <p className="text-sm text-slate-400 mt-1">
                  {report.summary?.cancelled_orders || 0} commandes annulées
                </p>
              </div>
            </div>

            {/* Paiements & Top Produits */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2">
                  <DollarSign size={16} className="text-amber-400" /> R\u00e9partition Paiements
                </h3>
                {report.kpi.total_orders > 0 ? (
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400">\ud83d\udcb5 Esp\u00e8ces</span>
                        <span className="font-bold text-amber-400">{formatNum(report.kpi.cash_orders)} cmd</span>
                      </div>
                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.round((report.kpi.cash_orders / report.kpi.total_orders) * 100)}%` }} />
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">{formatPrice(report.kpi.cash_revenue)}</p>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400">\ud83d\udcf1 Mobile Money</span>
                        <span className="font-bold text-emerald-400">{formatNum(report.kpi.mobile_orders)} cmd</span>
                      </div>
                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.round((report.kpi.mobile_orders / report.kpi.total_orders) * 100)}%` }} />
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">{formatPrice(report.kpi.mobile_revenue)}</p>
                    </div>
                  </div>
                ) : <p className="text-slate-500 text-sm">Aucune commande cette semaine</p>}
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2">
                  <Award size={16} className="text-orange-400" /> Top 5 Produits
                </h3>
                {report.top_products.length > 0 ? (
                  <div className="space-y-2">
                    {report.top_products.map((p, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-xl flex items-center justify-center text-[10px] font-black shrink-0 ${
                          i===0 ? 'bg-amber-500 text-slate-950' : i===1 ? 'bg-slate-400 text-slate-950' : i===2 ? 'bg-amber-700 text-white' : 'bg-slate-800 text-slate-400'
                        }`}>{i+1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white truncate">{p.title}</p>
                          <p className="text-[10px] text-slate-500">{p.qty_sold} vendu(s) \u00b7 {formatPrice(p.revenue)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-slate-500 text-sm">Aucune vente cette semaine</p>}
              </div>
            </div>

            {/* Top 5 Vendeurs */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
              <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2">
                <Users size={16} className="text-purple-400" /> Top 5 Vendeurs
              </h3>
              {report.top_vendors.length > 0 ? (
                <div className="space-y-3">
                  {report.top_vendors.map((v, i) => {
                    const maxRev = report.top_vendors[0]?.revenue || 1;
                    return (
                      <div key={i} className="flex items-center gap-4">
                        <span className="text-xs font-black text-slate-500 w-5 shrink-0">{i+1}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs font-bold text-white truncate">{v.name}</p>
                            <span className="text-[10px] text-emerald-400 font-bold shrink-0 ml-2">{formatPrice(v.revenue)}</span>
                          </div>
                          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full" style={{ width: `${Math.round((v.revenue / maxRev) * 100)}%` }} />
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-400 shrink-0">{v.order_count} cmd</span>
                      </div>
                    );
                  })}
                </div>
              ) : <p className="text-slate-500 text-sm">Aucune vente cette semaine</p>}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
