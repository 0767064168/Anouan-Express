// src/pages/admin/AdminFinancePage.jsx â€” Dark Premium Orange
import React, { useState, useEffect, useMemo } from 'react';
import {
  DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight, Loader2,
  CheckCircle, Clock, RefreshCcw, Check, X, Send, AlertTriangle,
  Store, Wallet, Package, ShieldCheck, Receipt, Printer, MapPin, Phone, Eye,
  Users, BadgeDollarSign, Banknote, ArchiveX, Lock
} from 'lucide-react';
import { financeAPI } from '../../services/api';
import { PaymentLogo } from '../../components/ui/PaymentLogos';

const formatPrice = (p) => new Intl.NumberFormat('fr-CI').format(Number(p || 0)) + ' FCFA';

const DEFAULT_AGENTS = [
  {
    id: 'AGT-01',
    name: 'Koné Ibrahim',
    phone: '+225 07 45 12 88',
    email: 'kone.ibrahim@anouan.ci',
    location: 'Magasin Central Bouaké (Quartier Commerce)',
    zone: 'Commerce / Banques',
    status: 'active',
    joinedDate: '15 janv. 2026',
    cashInTill: 125000,
    deliveredCount: 48,
    deliveredVolume: 1450000,
    waitingCount: 4,
    waitingVolume: 85500,
    waitingCashToCollect: 32000,
  },
  {
    id: 'AGT-02',
    name: 'Yao Kouamé Marc',
    phone: '+225 05 88 14 20',
    email: 'yao.marc@anouan.ci',
    location: 'Guichet Relais Air France 1 (Marché)',
    zone: 'Air France 1 & 2',
    status: 'active',
    joinedDate: '01 fév. 2026',
    cashInTill: 68000,
    deliveredCount: 29,
    deliveredVolume: 890000,
    waitingCount: 3,
    waitingVolume: 64000,
    waitingCashToCollect: 25000,
  },
  {
    id: 'AGT-03',
    name: 'Ouattara Fatou',
    phone: '+225 01 02 44 99',
    email: 'ouattara.f@anouan.ci',
    location: 'Guichet Relais Koko (Face Mairie)',
    zone: 'Koko / Centre-ville',
    status: 'active',
    joinedDate: '10 fév. 2026',
    cashInTill: 95000,
    deliveredCount: 35,
    deliveredVolume: 1120000,
    waitingCount: 2,
    waitingVolume: 42000,
    waitingCashToCollect: 18500,
  },
  {
    id: 'AGT-04',
    name: 'Bamba Sekou',
    phone: '+225 07 77 33 11',
    email: 'bamba.sekou@anouan.ci',
    location: 'Guichet Relais Broukro',
    zone: 'Broukro / Nimbo',
    status: 'active',
    joinedDate: '20 fév. 2026',
    cashInTill: 42000,
    deliveredCount: 18,
    deliveredVolume: 510000,
    waitingCount: 1,
    waitingVolume: 15000,
    waitingCashToCollect: 0,
  },
];

const DEMO_PAYOUTS = [
  { id: 'PAY-501', vendor: 'Tech Store CI',    amount: 1250000, status: 'paid',    date: '27/08/2026', method: 'orange', phone: '+225 07 00 11 22' },
  { id: 'PAY-500', vendor: 'Fashion Mode',      amount:  320000, status: 'pending', date: '26/08/2026', method: 'wave',   phone: '+225 07 88 99 00' },
  { id: 'PAY-499', vendor: 'Beautique Plus',       amount:  185000, status: 'paid',    date: '25/08/2026', method: 'mtn',    phone: '+225 05 44 55 66' },
  { id: 'PAY-498', vendor: 'Épicerie Centrale', amount:   95000, status: 'pending', date: '24/08/2026', method: 'orange', phone: '+225 05 66 77 88' },
];

export default function AdminFinancePage() {
  const [activeTab, setActiveTab]           = useState('versements');
  const [stats, setStats]                   = useState({ totalRevenue: 14250000, totalCommission: 1567500, pendingPayouts: 415000, paidPayouts: 1435000 });
  const [payouts, setPayouts]               = useState([]);
  const [loading, setLoading]               = useState(true);
  const [actionNotice, setActionNotice]     = useState(null);
  const [agents, setAgents]                 = useState(DEFAULT_AGENTS);
  const [selectedAgent, setSelectedAgent]   = useState(null);  // modal fiche
  const [cloturingAgent, setCloturingAgent] = useState(null);  // modal clôture
  const [clotureNote, setClotureNote]       = useState('');

  useEffect(() => {
    loadData();
    const handleCreated = () => loadData();
    window.addEventListener('anouan_payout_created', handleCreated);
    return () => window.removeEventListener('anouan_payout_created', handleCreated);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [payoutsRes, statsRes] = await Promise.all([
        financeAPI.getAllPayouts().catch(() => null),
        financeAPI.getAdminStats().catch(() => null),
      ]);

      let list = [];
      if (payoutsRes?.data) {
        list = Array.isArray(payoutsRes.data) ? payoutsRes.data : (payoutsRes.data.payouts || payoutsRes.data.data || []);
      }

      if (list.length > 0) {
        const mapped = list.map(p => ({
          id: p.id,
          vendor: p.vendor_name || p.shop_name || 'Vendeur Anouan',
          amount: Number(p.amount) || 0,
          fee: Number(p.platform_fee || 0),
          net: Number(p.net_amount || p.amount || 0),
          method: p.payment_method || 'wave',
          phone: p.phone_number || p.phone || '—',
          date: p.created_at ? new Date(p.created_at).toLocaleDateString('fr-FR') : 'Récemment',
          status: p.status || 'pending',
        }));
        setPayouts(mapped);
      } else {
        setPayouts(DEMO_PAYOUTS);
      }

      if (statsRes?.data) {
        const d = statsRes.data.data || statsRes.data;
        setStats(prev => ({ ...prev, ...d }));
      }
    } catch (err) {
      console.error("Erreur chargement finances:", err);
      setPayouts(DEMO_PAYOUTS);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (payoutId, newStatus) => {
    try {
      if (newStatus === 'paid') {
        await financeAPI.markPayoutPaid(payoutId, { payment_reference: `PAY-${Date.now()}` }).catch(() => null);
      }
      setPayouts(prev => prev.map(p => p.id === payoutId ? { ...p, status: newStatus } : p));
      window.dispatchEvent(new Event('anouan_payout_updated'));

      const target = payouts.find(p => p.id === payoutId);
      if (newStatus === 'paid') {
        setActionNotice(`Versement #${payoutId} de ${formatPrice(target?.amount)} validé !`);
      } else {
        setActionNotice(`Versement #${payoutId} rejeté.`);
      }
      setTimeout(() => setActionNotice(null), 5000);
      loadData();
    } catch (err) {
      console.error("Erreur mise à jour versement:", err);
    }
  };

  const handleClotureCaisse = (agentId) => {
    setAgents(prev => prev.map(a => a.id === agentId ? { ...a, cashInTill: 0, lastCloture: new Date().toLocaleDateString('fr-FR') } : a));
    setCloturingAgent(null);
    setClotureNote('');
    setActionNotice(` Caisse de ${agents.find(a => a.id === agentId)?.name} clôturée avec succès. Solde remis à zéro.`);
    setTimeout(() => setActionNotice(null), 5000);
  };

  // KPIs versements vendeurs
  const kpis = [
    { label: "Chiffre d'affaires total",  value: formatPrice(stats.totalRevenue),    change: '+12.5%', icon: DollarSign,  grad: 'from-orange-500/20 to-amber-500/10',   iconCls: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
    { label: 'Commissions perçues (10%)',  value: formatPrice(stats.totalCommission), change: '+10.2%', icon: TrendingUp,  grad: 'from-purple-500/20 to-violet-500/10',  iconCls: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
    { label: 'Versements en attente',     value: formatPrice(stats.pendingPayouts),  change: '-3.1%',  icon: Clock,       grad: 'from-amber-500/20 to-yellow-500/10',   iconCls: 'bg-amber-500/20 text-amber-400 border-amber-500/30', neg: true },
    { label: 'Versements effectués',      value: formatPrice(stats.paidPayouts),     change: '+8.4%',  icon: CheckCircle, grad: 'from-emerald-500/20 to-teal-500/10',   iconCls: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  ];

  // KPIs globaux agents
  const agentKpis = useMemo(() => [
    {
      label: 'Espèces en Caisse (total)',
      value: formatPrice(agents.reduce((s, a) => s + a.cashInTill, 0)),
      icon: Banknote,
      grad: 'from-orange-500/20 to-amber-500/10',
      iconCls: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    },
    {
      label: 'à Encaisser (cash dû)',
      value: formatPrice(agents.reduce((s, a) => s + a.waitingCashToCollect, 0)),
      icon: BadgeDollarSign,
      grad: 'from-amber-500/20 to-yellow-500/10',
      iconCls: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    },
    {
      label: 'Colis en Attente',
      value: agents.reduce((s, a) => s + a.waitingCount, 0),
      icon: Package,
      grad: 'from-blue-500/20 to-cyan-500/10',
      iconCls: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    },
    {
      label: 'Colis Remis (total)',
      value: agents.reduce((s, a) => s + a.deliveredCount, 0),
      icon: CheckCircle,
      grad: 'from-emerald-500/20 to-teal-500/10',
      iconCls: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    },
  ], [agents]);

  const tabs = [
    { id: 'versements', label: 'Reversements Vendeurs', icon: Wallet },
    { id: 'agents',     label: 'Point des Agents',      icon: Users },
  ];

  return (
    <div className="space-y-6 text-slate-100">
      {/* Toast confirmation */}
      {actionNotice && (
        <div className="fixed bottom-6 right-6 z-50 flex items-start gap-3 bg-slate-900 border border-emerald-500/30 rounded-2xl p-4 shadow-2xl max-w-sm animate-in slide-in-from-right-5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 text-emerald-400">
            <Send size={14} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black text-white">Opération Financière</p>
            <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">{actionNotice}</p>
          </div>
          <button onClick={() => setActionNotice(null)} className="text-slate-500 hover:text-white p-1">
            <X size={13} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Finance &amp; Reversements</h1>
          <p className="text-slate-400 text-xs mt-1">Supervision des flux financiers, paiements vendeurs et points de caisse agents.</p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2.5 bg-orange-500/15 border border-orange-500/30 text-orange-400 text-xs font-bold rounded-2xl hover:bg-orange-500/25 transition-colors"
        >
          <RefreshCcw size={14} /> Actualiser
        </button>
      </div>

      {/* Onglets */}
      <div className="flex gap-1 bg-slate-900/60 border border-slate-800 rounded-2xl p-1 w-fit">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Icon size={14} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          TAB : REVERSEMENTS VENDEURS
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {activeTab === 'versements' && (
        <>
          {/* KPIs versements */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((k) => {
              const Icon = k.icon;
              return (
                <div key={k.label} className={`bg-gradient-to-br ${k.grad} border border-slate-800 rounded-3xl p-5 hover:scale-[1.02] transition-all`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-2.5 rounded-2xl border ${k.iconCls}`}><Icon size={18} /></div>
                    <span className={`flex items-center gap-0.5 text-[10px] font-black px-2 py-1 rounded-full border ${
                      k.neg ? 'bg-red-500/15 text-red-400 border-red-500/25' : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25'
                    }`}>
                      {k.neg ? <ArrowDownRight size={11} /> : <ArrowUpRight size={11} />} {k.change}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{k.label}</p>
                  <p className="text-xl font-black text-white mt-1 leading-tight">{k.value}</p>
                </div>
              );
            })}
          </div>

          {/* Tableau versements */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
              <div>
                <h2 className="text-sm font-black text-white">Demandes de Reversement Vendeurs</h2>
                <p className="text-[11px] text-slate-400 mt-0.5">Validez ou rejetez les transferts Mobile Money des boutiques</p>
              </div>
              {payouts.filter(p => p.status === 'pending').length > 0 && (
                <span className="px-2.5 py-1 bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] font-black rounded-full">
                  {payouts.filter(p => p.status === 'pending').length} en attente
                </span>
              )}
            </div>

            {loading ? (
              <div className="py-12 text-center text-slate-500">
                <Loader2 className="w-7 h-7 animate-spin mx-auto mb-2 text-orange-400" />
                <p className="text-xs">Chargement...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-900/80 text-slate-500 text-[10px] uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="px-5 py-4 font-bold">Réf.</th>
                      <th className="px-5 py-4 font-bold">Vendeur</th>
                      <th className="px-5 py-4 font-bold">Mode &amp; Tel.</th>
                      <th className="px-5 py-4 font-bold">Montant</th>
                      <th className="px-5 py-4 font-bold">Date</th>
                      <th className="px-5 py-4 font-bold">Statut</th>
                      <th className="px-5 py-4 font-bold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {payouts.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-5 py-4 font-black text-white">#{p.id}</td>
                        <td className="px-5 py-4 font-semibold text-slate-200">{p.vendor}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <PaymentLogo provider={p.method || 'orange'} size={24} />
                            <span className="text-[11px] text-slate-400">{p.phone || 'â€”'}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 font-black text-orange-400">{formatPrice(p.amount)}</td>
                        <td className="px-5 py-4 text-slate-400">{p.date}</td>
                        <td className="px-5 py-4">
                          {p.status === 'paid' ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 inline-flex items-center gap-1">
                              <CheckCircle size={10} /> Verser
                            </span>
                          ) : p.status === 'rejected' ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/25 inline-flex items-center gap-1">
                              <X size={10} /> Rejeté
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/25 inline-flex items-center gap-1">
                              <Clock size={10} /> En attente
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right">
                          {p.status === 'pending' && (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleUpdateStatus(p.id, 'rejected')}
                                className="px-2.5 py-1.5 bg-red-500/10 border border-red-500/25 text-red-400 text-[10px] font-bold rounded-xl hover:bg-red-500/20 transition-colors flex items-center gap-1"
                              >
                                <X size={11} /> Rejeter
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(p.id, 'paid')}
                                className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[10px] font-bold rounded-xl hover:bg-emerald-500/20 transition-colors flex items-center gap-1"
                              >
                                <Check size={11} /> Valider
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          TAB : POINT DES AGENTS
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {activeTab === 'agents' && (
        <>
          {/* KPIs globaux agents */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {agentKpis.map((k) => {
              const Icon = k.icon;
              return (
                <div key={k.label} className={`bg-gradient-to-br ${k.grad} border border-slate-800 rounded-3xl p-5 hover:scale-[1.02] transition-all`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-2.5 rounded-2xl border ${k.iconCls}`}><Icon size={18} /></div>
                  </div>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{k.label}</p>
                  <p className="text-xl font-black text-white mt-1 leading-tight">{k.value}</p>
                </div>
              );
            })}
          </div>

          {/* Tableau des agents */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800">
              <h2 className="text-sm font-black text-white">Point Financier  Agents Guichet Relais</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Suivi en temps réel des espèces en caisse et des colis par agent</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-900/80 text-slate-500 text-[10px] uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-5 py-4 font-bold">Agent / Contact</th>
                    <th className="px-5 py-4 font-bold">Point Relais / Zone</th>
                    <th className="px-5 py-4 font-bold">Espèces en Caisse</th>
                    <th className="px-5 py-4 font-bold">À Encaisser</th>
                    <th className="px-5 py-4 font-bold">En Attente</th>
                    <th className="px-5 py-4 font-bold">Remis</th>
                    <th className="px-5 py-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {agents.map((ag) => (
                    <tr key={ag.id} className="hover:bg-slate-800/30 transition-colors">
                      {/* Agent */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-2xl bg-orange-500/15 border border-orange-500/25 flex items-center justify-center text-orange-400 font-black text-xs shrink-0">
                            {ag.name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-black text-white text-[11px]">{ag.name}</p>
                            <p className="text-slate-500 text-[10px] flex items-center gap-1 mt-0.5">
                              <Phone size={9} /> {ag.phone}
                            </p>
                          </div>
                        </div>
                      </td>
                      {/* Localisation */}
                      <td className="px-5 py-4">
                        <p className="text-slate-200 font-semibold text-[11px]">{ag.zone}</p>
                        <p className="text-slate-500 text-[10px] flex items-center gap-1 mt-0.5">
                          <MapPin size={9} /> {ag.location.length > 30 ? ag.location.slice(0, 30) + 'â€¦' : ag.location}
                        </p>
                      </td>
                      {/* Espèces en caisse */}
                      <td className="px-5 py-4">
                        <span className={`font-black text-sm ${ag.cashInTill > 0 ? 'text-orange-400' : 'text-slate-600'}`}>
                          {formatPrice(ag.cashInTill)}
                        </span>
                      </td>
                      {/* À encaisser */}
                      <td className="px-5 py-4">
                        <span className={`font-bold text-[11px] ${ag.waitingCashToCollect > 0 ? 'text-amber-400' : 'text-slate-600'}`}>
                          {formatPrice(ag.waitingCashToCollect)}
                        </span>
                      </td>
                      {/* Colis en attente */}
                      <td className="px-5 py-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                          ag.waitingCount > 0
                            ? 'bg-blue-500/15 text-blue-400 border border-blue-500/25'
                            : 'bg-slate-800 text-slate-600 border border-slate-700'
                        }`}>
                          <Package size={9} /> {ag.waitingCount} colis
                        </span>
                      </td>
                      {/* Colis remis */}
                      <td className="px-5 py-4">
                        <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 inline-flex items-center gap-1">
                          <CheckCircle size={9} /> {ag.deliveredCount}
                        </span>
                      </td>
                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedAgent(ag)}
                            className="px-2.5 py-1.5 bg-blue-500/10 border border-blue-500/25 text-blue-400 text-[10px] font-bold rounded-xl hover:bg-blue-500/20 transition-colors flex items-center gap-1"
                            title="Voir la fiche agent"
                          >
                            <Eye size={11} /> Fiche
                          </button>
                          <button
                            onClick={() => { setCloturingAgent(ag); setClotureNote(''); }}
                            className="px-2.5 py-1.5 bg-red-500/10 border border-red-500/25 text-red-400 text-[10px] font-bold rounded-xl hover:bg-red-500/20 transition-colors flex items-center gap-1"
                            title="ClÃ´turer la caisse"
                          >
                            <Lock size={11} /> Clôturer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          MODAL : FICHE AGENT
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {selectedAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg shadow-2xl animate-in zoom-in-95">
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400 font-black text-sm">
                  {selectedAgent.name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">{selectedAgent.name}</h3>
                  <p className="text-[11px] text-slate-400">{selectedAgent.id} Â· Actif depuis {selectedAgent.joinedDate}</p>
                </div>
              </div>
              <button onClick={() => setSelectedAgent(null)} className="text-slate-500 hover:text-white p-1.5 hover:bg-slate-800 rounded-xl transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Corps */}
            <div className="p-6 space-y-5">
              {/* KPIs 4 cartes */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4 text-center">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Espèces en Caisse</p>
                  <p className="text-lg font-black text-orange-400">{formatPrice(selectedAgent.cashInTill)}</p>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-center">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">à Encaisser</p>
                  <p className="text-lg font-black text-amber-400">{formatPrice(selectedAgent.waitingCashToCollect)}</p>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 text-center">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Colis en Attente</p>
                  <p className="text-lg font-black text-blue-400">{selectedAgent.waitingCount}</p>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-center">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Colis Remis</p>
                  <p className="text-lg font-black text-emerald-400">{selectedAgent.deliveredCount}</p>
                </div>
              </div>

              {/* Coordonnées */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4 space-y-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">Coordonnées</p>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <Phone size={13} className="text-slate-500 shrink-0" /> {selectedAgent.phone}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <Send size={13} className="text-slate-500 shrink-0" /> {selectedAgent.email}
                </div>
                <div className="flex items-start gap-2 text-xs text-slate-300">
                  <MapPin size={13} className="text-slate-500 shrink-0 mt-0.5" /> {selectedAgent.location}
                </div>
              </div>

              {/* Volume cumulé */}
              <div className="flex items-center justify-between bg-slate-800/50 border border-slate-700 rounded-2xl px-4 py-3">
                <span className="text-[11px] text-slate-400 font-bold">Volume total remis</span>
                <span className="text-sm font-black text-white">{formatPrice(selectedAgent.deliveredVolume)}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => { setCloturingAgent(selectedAgent); setSelectedAgent(null); setClotureNote(''); }}
                className="flex-1 py-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-black rounded-2xl hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
              >
                <Lock size={14} /> Clôturer la Caisse
              </button>
              <button
                onClick={() => setSelectedAgent(null)}
                className="flex-1 py-3 bg-orange-500 text-white text-xs font-black rounded-2xl hover:bg-orange-600 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          MODAL : CLÔTURE DE CAISSE
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {cloturingAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in-95">
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400">
                  <Lock size={15} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Clôture de Caisse</h3>
                  <p className="text-[11px] text-slate-400">{cloturingAgent.name}</p>
                </div>
              </div>
              <button onClick={() => setCloturingAgent(null)} className="text-slate-500 hover:text-white p-1.5 hover:bg-slate-800 rounded-xl transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Corps */}
            <div className="p-6 space-y-4">
              {/* Avertissement */}
              <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/25 rounded-2xl p-4">
                <AlertTriangle size={16} className="text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-black text-amber-300">Attention  Action irréversible</p>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    La clôture remet le solde espèces de <strong className="text-white">{formatPrice(cloturingAgent.cashInTill)}</strong> à  zéro.
                    Assurez-vous que les espèces ont bien été récupérées physiquement avant de valider.
                  </p>
                </div>
              </div>

              {/* Récap financier */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Espèces en caisse</span>
                  <span className="font-black text-orange-400">{formatPrice(cloturingAgent.cashInTill)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Colis remis ce cycle</span>
                  <span className="font-bold text-white">{cloturingAgent.deliveredCount} colis</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Date de clôture</span>
                  <span className="font-bold text-white">{new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                </div>
              </div>

              {/* Note de décharge */}
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Note de décharge (optionnel)
                </label>
                <textarea
                  value={clotureNote}
                  onChange={e => setClotureNote(e.target.value)}
                  rows={3}
                  placeholder="Ex: Espèces récupérées le 07/09/2026 par le superviseur Traoré..."
                  className="w-full bg-slate-800/60 border border-slate-700 rounded-2xl p-3 text-xs text-slate-200 placeholder-slate-600 resize-none outline-none focus:border-orange-500/50 transition-colors"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setCloturingAgent(null)}
                className="flex-1 py-3 bg-slate-800 border border-slate-700 text-slate-300 text-xs font-black rounded-2xl hover:bg-slate-700 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => handleClotureCaisse(cloturingAgent.id)}
                className="flex-1 py-3 bg-red-500 text-white text-xs font-black rounded-2xl hover:bg-red-600 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
              >
                <Lock size={13} /> Confirmer la Clôture
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

