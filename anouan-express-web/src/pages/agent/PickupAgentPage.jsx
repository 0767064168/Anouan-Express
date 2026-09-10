// src/pages/agent/PickupAgentPage.jsx — Dark Premium Orange
// Espace Agent Guichet Magasin Central Bouaké
// Dashboard complet : Retraits, Encaissements Espèces, Colis en attente, Historique des remis, Synthèse par client & Reçu de caisse
import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck, Search, CheckCircle2, AlertCircle, RefreshCw,
  PackageCheck, LogOut, ArrowLeft, Package, User, Phone,
  Camera, Check, Store, QrCode, Clock, Sparkles, KeyRound,
  Smartphone, FileCheck, DollarSign, Wallet, ArrowUpRight,
  TrendingUp, Users, Receipt, CreditCard, ChevronRight, Eye, Printer, X, Truck
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { pickupAPI } from '../../services/api';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../../components/ui/Logo';
import { PaymentLogo } from '../../components/ui/PaymentLogos';

const formatPrice = (p) => new Intl.NumberFormat('fr-CI').format(Number(p || 0)) + ' FCFA';
const cleanPhone = (str) => (str || '').replace(/\D/g, '');

const INITIAL_WAITING_ORDERS = [
  {
    orderId: 'CMD-847291',
    code: '7K4D9XQP',
    clientName: 'Kouadio Jean-Marc',
    clientPhone: '+225 07 45 12 88',
    status: 'ready_for_pickup',
    store: 'Magasin Central Bouaké',
    totalAmount: 32000,
    paymentMethod: 'cash',
    paymentStatus: 'pending_payment',
    items: [
      { name: 'Pagne Baoulé Tissé Main', qty: 1, price: 25000, vendor: 'Maison du Pagne Bouaké' },
      { name: 'Sandales en Cuir Artisanales', qty: 1, price: 7000, vendor: 'Cuir & Style Bouaké' }
    ],
    arrivalDate: 'Aujourd\'hui 09:30',
  },
  {
    orderId: 'CMD-8492',
    code: '8A4F92B1',
    clientName: 'Awa Sylla',
    clientPhone: '+225 07 89 12 34',
    status: 'ready_for_pickup',
    store: 'Magasin Central Bouaké',
    totalAmount: 250000,
    paymentMethod: 'orange',
    paymentStatus: 'paid',
    items: [
      { name: 'Smartphone Pro Max 5G Ultra', qty: 1, price: 250000, vendor: 'Tech Store CI' },
    ],
    arrivalDate: 'Hier 16:45',
  },
  {
    orderId: 'CMD-846995',
    code: '3M9P5W2Z',
    clientName: 'Mariam Koffi',
    clientPhone: '+225 05 66 77 88',
    status: 'ready_for_pickup',
    store: 'Magasin Central Bouaké',
    totalAmount: 18500,
    paymentMethod: 'cash',
    paymentStatus: 'pending_payment',
    items: [
      { name: 'Écouteurs Sans Fil Pro HD', qty: 1, price: 10000, vendor: 'Tech Store CI' },
      { name: 'Robe d\'été fleurie WAX', qty: 1, price: 8500, vendor: 'Fashion Mode' }
    ],
    arrivalDate: 'Hier 11:20',
  },
  {
    orderId: 'CMD-846102',
    code: '9W2X4L1Q',
    clientName: 'Kouadio Jean-Marc',
    clientPhone: '+225 07 45 12 88',
    status: 'ready_for_pickup',
    store: 'Magasin Central Bouaké',
    totalAmount: 15000,
    paymentMethod: 'wave',
    paymentStatus: 'paid',
    items: [
      { name: 'Chaussures Ville Cuir Noir', qty: 1, price: 15000, vendor: 'Chaussures & Co' }
    ],
    arrivalDate: '05/09/2026',
  },
];

const INITIAL_PICKED_UP_ORDERS = [
  {
    orderId: 'CMD-845890',
    code: '4K9L2V8M',
    clientName: 'Bamba Souleymane',
    clientPhone: '+225 01 22 33 44',
    status: 'picked_up',
    store: 'Magasin Central Bouaké',
    totalAmount: 45000,
    paymentMethod: 'cash',
    paymentStatus: 'paid',
    items: [
      { name: 'Montre Connectée Sport HD', qty: 2, price: 22500, vendor: 'Tech Store CI' }
    ],
    pickedUpAt: 'Aujourd\'hui 11:15',
    agentName: 'Agent Relais 01',
  },
  {
    orderId: 'CMD-845712',
    code: '1N8J3C5T',
    clientName: 'Awa Sylla',
    clientPhone: '+225 07 89 12 34',
    status: 'picked_up',
    store: 'Magasin Central Bouaké',
    totalAmount: 28000,
    paymentMethod: 'orange',
    paymentStatus: 'paid',
    items: [
      { name: 'Pagne Kita Royal 3 Pièces', qty: 1, price: 28000, vendor: 'Maison du Pagne Bouaké' }
    ],
    pickedUpAt: 'Hier 17:40',
    agentName: 'Agent Relais 01',
  },
];

export default function PickupAgentPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Navigation principale du Dashboard : 'guichet' | 'attente' | 'historique' | 'clients'
  const [activeTab, setActiveTab] = useState('guichet');

  // Mode de recherche au guichet : 'code' (QR/Secret) ou 'phone' (Numéro de téléphone)
  const [searchMode, setSearchMode] = useState('code');
  const [code, setCode] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [phoneOrdersFound, setPhoneOrdersFound] = useState([]);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [idCardVerified, setIdCardVerified] = useState(false);
  const [cashCollectedConfirmed, setCashCollectedConfirmed] = useState(false);

  // Modal Reçu de caisse
  const [receiptOrder, setReceiptOrder] = useState(null);

  // État persistant des colis
  const [waitingOrders, setWaitingOrders] = useState(INITIAL_WAITING_ORDERS);
  const [pickedUpOrders, setPickedUpOrders] = useState(INITIAL_PICKED_UP_ORDERS);

  const loadOrdersFromDB = async () => {
    try {
      const res = await ordersAPI.getAll({ limit: 100 });
      const orders = res.data?.data || res.data || [];
      if (Array.isArray(orders) && orders.length > 0) {
        const waiting = orders.filter(o => o.status !== 'picked_up' && o.status !== 'cancelled').map(o => ({
          id: o.id,
          orderId: o.id,
          code: o.pickup_code || '8A4F92B1',
          clientName: o.client_name || 'Client Anouan',
          clientPhone: o.client_phone || '',
          totalAmount: Number(o.total_amount || 0),
          paymentMethod: o.payment_method || 'cash',
          paymentStatus: o.payment_status || (o.payment_method === 'cash' ? 'pending' : 'paid'),
          items: o.items || [],
          status: o.status || 'ready_for_pickup',
          arrivedAt: o.created_at,
        }));
        const history = orders.filter(o => o.status === 'picked_up').map(o => ({
          id: o.id,
          orderId: o.id,
          code: o.pickup_code || '8A4F92B1',
          clientName: o.client_name || 'Client Anouan',
          clientPhone: o.client_phone || '',
          totalAmount: Number(o.total_amount || 0),
          paymentMethod: o.payment_method || 'cash',
          paymentStatus: 'paid',
          items: o.items || [],
          status: 'picked_up',
          pickedUpAt: o.updated_at,
        }));
        setWaitingOrders(waiting);
        setPickedUpOrders(history);
      }
    } catch (e) {
      console.error('Erreur chargement colis agent:', e);
    }
  };

  useEffect(() => {
    loadOrdersFromDB();
    const handleSync = () => loadOrdersFromDB();
    window.addEventListener('anouan_order_status_updated', handleSync);
    return () => window.removeEventListener('anouan_order_status_updated', handleSync);
  }, []);

  // ─── Indicateurs financiers & statistiques calculées ───
  const stats = useMemo(() => {
    const cashCollected = pickedUpOrders
      .filter((o) => o.paymentMethod === 'cash')
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    const cashToCollect = waitingOrders
      .filter((o) => o.status === 'ready_for_pickup' && o.paymentMethod === 'cash')
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    const totalDeliveredValue = pickedUpOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const countWaiting = waitingOrders.filter((o) => o.status === 'ready_for_pickup').length;
    const countTransit = waitingOrders.filter((o) => o.status === 'shipped_to_store').length;
    const countPickedUp = pickedUpOrders.length;

    return {
      cashCollected,
      cashToCollect,
      totalDeliveredValue,
      countWaiting,
      countTransit,
      countPickedUp,
    };
  }, [waitingOrders, pickedUpOrders]);

  // ─── Synthèse par client ───
  const clientsSummary = useMemo(() => {
    const clientsMap = {};
    const allOrders = [
      ...waitingOrders.map((o) => ({ ...o, isPending: true })),
      ...pickedUpOrders.map((o) => ({ ...o, isPending: false })),
    ];

    allOrders.forEach((ord) => {
      const phoneKey = cleanPhone(ord.clientPhone) || ord.clientName;
      if (!clientsMap[phoneKey]) {
        clientsMap[phoneKey] = {
          name: ord.clientName,
          phone: ord.clientPhone,
          pendingOrders: [],
          pickedOrders: [],
          totalAmount: 0,
          cashDue: 0,
          cashPaid: 0,
        };
      }
      const client = clientsMap[phoneKey];
      client.totalAmount += ord.totalAmount || 0;

      if (ord.isPending) {
        client.pendingOrders.push(ord);
        if (ord.paymentMethod === 'cash') {
          client.cashDue += ord.totalAmount || 0;
        }
      } else {
        client.pickedOrders.push(ord);
        if (ord.paymentMethod === 'cash') {
          client.cashPaid += ord.totalAmount || 0;
        }
      }
    });

    return Object.values(clientsMap);
  }, [waitingOrders, pickedUpOrders]);

  // ─── Recherche par Code ou QR ───
  const handleVerifyByCode = (codeToVerify) => {
    const targetCode = (codeToVerify || code).trim().toUpperCase();
    if (!targetCode || targetCode.length < 5) {
      setError('Code invalide (minimum 5 caractères).');
      return;
    }
    setError('');
    setSuccessMsg('');
    setVerificationResult(null);
    setPhoneOrdersFound([]);
    setLoading(true);

    setTimeout(() => {
      const found = waitingOrders.find(
        (o) => o.code.toUpperCase() === targetCode || o.orderId.toUpperCase() === targetCode
      );

      if (found) {
        if (found.status === 'shipped_to_store') {
          setError(`⚠️ Ce colis #${found.orderId || found.id} a été expédié par le vendeur mais n'a PAS encore été confirmé réceptionné au magasin. Allez dans l'onglet "Réceptions" pour confirmer son arrivée physique avant de le remettre au client.`);
          setVerificationResult(null);
        } else {
          setVerificationResult(found);
          setCashCollectedConfirmed(found.paymentMethod !== 'cash');
        }
      } else {
        setError(`Aucun colis prêt au retrait avec le code "${targetCode}".`);
      }
      setLoading(false);
    }, 350);
  };

  // ─── Recherche par Numéro de Téléphone Client ───
  const handleVerifyByPhone = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const raw = phoneInput.trim();
    const cleaned = cleanPhone(raw);

    if (cleaned.length < 8) {
      setError('Veuillez saisir au moins 8 chiffres pour le numéro de téléphone.');
      return;
    }

    setError('');
    setSuccessMsg('');
    setVerificationResult(null);
    setLoading(true);

    setTimeout(() => {
      const allMatches = waitingOrders.filter((ord) => {
        const ordClean = cleanPhone(ord.clientPhone);
        return ordClean.endsWith(cleaned) || cleaned.endsWith(ordClean) || ordClean.includes(cleaned);
      });

      const readyMatches = allMatches.filter(o => o.status !== 'shipped_to_store');
      const inTransitMatches = allMatches.filter(o => o.status === 'shipped_to_store');

      if (readyMatches.length === 1) {
        setVerificationResult(readyMatches[0]);
        setCashCollectedConfirmed(readyMatches[0].paymentMethod !== 'cash');
        setPhoneOrdersFound([]);
      } else if (readyMatches.length > 1) {
        setPhoneOrdersFound(readyMatches);
      } else if (inTransitMatches.length > 0) {
        setError(`⚠️ ${inTransitMatches.length} colis trouvé(s) pour ce numéro mais encore en cours de transfert (non confirmés au magasin). Consultez l'onglet "Réceptions".`);
      } else {
        setError(`Aucun colis en attente de retrait pour le numéro "${raw}".`);
      }
      setLoading(false);
    }, 400);
  };

  // ─── Confirmation et Remise du Colis ───
  const handleConfirmHandover = async () => {
    if (!verificationResult) return;

    if (verificationResult.paymentMethod === 'cash' && !cashCollectedConfirmed) {
      setError('Veuillez confirmer l\'encaissement du montant en espèces au guichet.');
      return;
    }

    setLoading(true);
    try {
      try {
        await pickupAPI.validateCode({ code: verificationResult.code, confirmHandover: true });
      } catch {}

      const orderId = verificationResult.orderId;
      try {
        await ordersAPI.updateStatus(orderId, 'picked_up');
      } catch (e) {
        console.warn('Update status picked_up error:', e.message);
      }
      const nowStr = new Date().toLocaleTimeString('fr-CI', { hour: '2-digit', minute: '2-digit' });

      const completedOrder = {
        ...verificationResult,
        status: 'picked_up',
        paymentStatus: 'paid',
        pickedUpAt: `Aujourd'hui ${nowStr}`,
        agentName: user?.name || 'Agent Guichet Bouaké',
      };

      setWaitingOrders((prev) => prev.filter((o) => o.orderId !== orderId));
      setPickedUpOrders((prev) => [completedOrder, ...prev]);

      window.dispatchEvent(
        new CustomEvent('anouan_order_status_updated', {
          detail: { id: orderId, status: 'picked_up' }
        })
      );

      const cashNote = verificationResult.paymentMethod === 'cash'
        ? ` · ${formatPrice(verificationResult.totalAmount)} encaissés en caisse.`
        : '';
      setSuccessMsg(`✓ Colis #${orderId} remis avec succès à ${verificationResult.clientName} !${cashNote}`);
      setReceiptOrder(completedOrder);
      setVerificationResult(null);
      setPhoneOrdersFound([]);
      setCode('');
      setPhoneInput('');
      setIdCardVerified(false);
      setCashCollectedConfirmed(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateScan = (ord) => {
    setCode(ord.code);
    setIsCameraActive(false);
    handleVerifyByCode(ord.code);
  };

  // ─── Confirmer réception physique au magasin (Agent → ready_for_pickup) ───
  const handleConfirmReception = async (orderId) => {
    try {
      await ordersAPI.updateStatus(orderId, 'ready_for_pickup');

      setWaitingOrders(prev =>
        prev.map(o =>
          (o.id === orderId || o.orderId === orderId)
            ? { ...o, status: 'ready_for_pickup', arrivedConfirmedAt: new Date().toISOString() }
            : o
        )
      );

      // Notifier les autres pages
      window.dispatchEvent(new CustomEvent('anouan_order_status_updated', {
        detail: { id: orderId, status: 'ready_for_pickup' }
      }));

      setSuccessMsg(`✅ Colis #${orderId} confirmé réceptionné dans la base de données ! Le client peut maintenant venir le retirer.`);
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (e) {
      alert(e.response?.data?.message || 'Erreur lors de la confirmation.');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/auth/login');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-orange-500 selection:text-slate-950">
      {/* ── Header ── */}
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Logo size="sm" to="/agent" />
          <span className="hidden sm:inline-block px-2.5 py-1 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-black rounded-full uppercase tracking-wider">
            GUICHET MAGASIN CENTRAL BOUAKÉ 🇨🇮
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="text-[11px] font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 px-3 py-2 hover:bg-slate-800 rounded-2xl transition-colors"
          >
            <ArrowLeft size={13} /> Boutique
          </Link>
          <button
            onClick={handleLogout}
            title="Déconnexion"
            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-2xl transition-colors"
          >
            <LogOut size={17} />
          </button>
        </div>
      </header>

      {/* ── Main Container ── */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 flex flex-col space-y-6">

        {/* ── Cartes d'Indicateurs Financiers & Métriques Caisse ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Caisse Espèces Collectées */}
          <div className="bg-gradient-to-br from-emerald-500/15 via-slate-900 to-slate-900 border border-emerald-500/25 rounded-3xl p-4 relative overflow-hidden shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Espèces en Caisse</span>
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <DollarSign size={16} />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-black text-white">{formatPrice(stats.cashCollected)}</p>
            <p className="text-[10px] text-slate-400 mt-1">Encaissés au guichet</p>
          </div>

          {/* Reste à encaisser en espèces */}
          <div className="bg-gradient-to-br from-amber-500/15 via-slate-900 to-slate-900 border border-amber-500/25 rounded-3xl p-4 relative overflow-hidden shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">À Encaisser (Cash)</span>
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Wallet size={16} />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-black text-amber-400">{formatPrice(stats.cashToCollect)}</p>
            <p className="text-[10px] text-slate-400 mt-1">Sur colis en attente</p>
          </div>

          {/* Colis en attente */}
          <div className="bg-gradient-to-br from-orange-500/15 via-slate-900 to-slate-900 border border-orange-500/25 rounded-3xl p-4 relative overflow-hidden shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-bold text-orange-400 tracking-wider">Colis en Attente</span>
              <div className="p-2 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
                <Package size={16} />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-black text-white">{stats.countWaiting} colis</p>
            <p className="text-[10px] text-slate-400 mt-1">Prêts pour remise</p>
          </div>

          {/* Colis délivrés / Clients passés */}
          <div className="bg-gradient-to-br from-purple-500/15 via-slate-900 to-slate-900 border border-purple-500/25 rounded-3xl p-4 relative overflow-hidden shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider">Clients Servis</span>
              <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                <Users size={16} />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-black text-white">{stats.countPickedUp} délivrés</p>
            <p className="text-[10px] text-purple-300 font-bold mt-1">Vol: {formatPrice(stats.totalDeliveredValue)}</p>
          </div>
        </div>

        {/* ── Onglets de Navigation Dashboard ── */}
        <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-2xl border border-slate-800 overflow-x-auto">
            {[
              { id: 'guichet',     label: 'Guichet Retrait',          icon: ShieldCheck,  count: null },
              { id: 'receptions',  label: 'Réceptions',               icon: Truck,        count: waitingOrders.filter(o => o.status === 'shipped_to_store').length },
              { id: 'attente',     label: 'Colis en Attente',         icon: Clock,        count: waitingOrders.filter(o => o.status === 'ready_for_pickup').length },
              { id: 'historique',  label: 'Historique des Remis',     icon: PackageCheck, count: stats.countPickedUp },
              { id: 'clients',     label: 'Synthèse par Client',      icon: Users,        count: clientsSummary.length },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setError('');
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                    isActive
                      ? 'bg-orange-500 text-slate-950 shadow-md shadow-orange-500/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                  {tab.count !== null && (
                    <span
                      className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                        isActive ? 'bg-slate-950 text-white' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <span className="text-xs text-slate-400 font-medium hidden md:inline-block">
            📍 Bouaké Quartier Commerce
          </span>
        </div>

        {/* ────────────────────────────────────────────────────────────
            VUE 2bis : RÉCEPTIONS (Agent confirme arrivée physique)
           ──────────────────────────────────────────────────────────── */}
        {activeTab === 'receptions' && (() => {
          const receptions = waitingOrders.filter(o => o.status === 'shipped_to_store');
          return (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-black text-white">Arrivées à Confirmer</h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Ces colis ont été expédiés par les vendeurs. Confirmez leur réception physique au magasin.
                  </p>
                </div>
                {receptions.length > 0 && (
                  <span className="px-3 py-1.5 bg-blue-500/15 border border-blue-500/30 text-blue-400 text-[10px] font-black rounded-full">
                    {receptions.length} à confirmer
                  </span>
                )}
              </div>

              {/* Message succès */}
              {successMsg && (
                <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl p-4">
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                  <p className="text-xs font-bold text-emerald-300">{successMsg}</p>
                </div>
              )}

              {receptions.length === 0 ? (
                <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center">
                  <Truck size={40} className="text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-400 font-bold text-sm">Aucune arrivée en attente</p>
                  <p className="text-slate-600 text-xs mt-1">Tous les colis expédiés ont été confirmés.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {receptions.map((ord) => (
                    <div
                      key={ord.orderId || ord.id}
                      className="bg-slate-900/60 border border-blue-500/20 rounded-3xl p-5 space-y-4"
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-blue-500/15 border border-blue-500/25 flex items-center justify-center text-blue-400 shrink-0">
                            <Truck size={18} />
                          </div>
                          <div>
                            <p className="font-black text-white text-sm">{ord.clientName}</p>
                            <p className="text-[10px] text-slate-500 flex items-center gap-1">
                              <Phone size={9} /> {ord.clientPhone}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-orange-400 text-sm">{formatPrice(ord.totalAmount)}</p>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/25">
                            En transit
                          </span>
                        </div>
                      </div>

                      {/* Détails */}
                      <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-3 space-y-1.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Articles</p>
                        {(ord.items || []).map((item, i) => (
                          <div key={i} className="flex justify-between text-xs">
                            <span className="text-slate-300">{item.name} × {item.qty}</span>
                            <span className="text-slate-500">{formatPrice(item.price * item.qty)}</span>
                          </div>
                        ))}
                      </div>

                      {/* Paiement */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Mode de paiement</span>
                        <span className={`px-2.5 py-1 rounded-full font-bold border text-[10px] ${
                          ord.paymentMethod === 'cash'
                            ? 'bg-amber-500/15 text-amber-400 border-amber-500/25'
                            : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25'
                        }`}>
                          {ord.paymentMethod === 'cash' ? '💵 Espèces au guichet' : '✅ Déjà payé en ligne'}
                        </span>
                      </div>

                      {/* Infos expédition */}
                      <div className="flex items-center gap-2 text-[10px] text-slate-500">
                        <Clock size={10} />
                        <span>Expédié le {ord.arrivedAt ? new Date(ord.arrivedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}</span>
                      </div>

                      {/* Bouton de confirmation */}
                      <button
                        onClick={() => handleConfirmReception(ord.orderId || ord.id)}
                        className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                      >
                        <Check size={15} />
                        Confirmer la Réception au Magasin
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {/* ────────────────────────────────────────────────────────────
            VUE 1 : GUICHET RETRAIT (Scan QR ou Saisie Numéro de Tél)
           ──────────────────────────────────────────────────────────── */}
        {activeTab === 'guichet' && (
          <div className="space-y-6">
            {/* Sélecteur de méthode de validation */}
            <div className="flex p-1.5 bg-slate-900 border border-slate-800 rounded-2xl max-w-md mx-auto w-full">
              <button
                type="button"
                onClick={() => {
                  setSearchMode('code');
                  setError('');
                  setVerificationResult(null);
                  setPhoneOrdersFound([]);
                }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                  searchMode === 'code'
                    ? 'bg-orange-500 text-slate-950 shadow-md shadow-orange-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <KeyRound size={15} /> Par Code QR / Secret
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearchMode('phone');
                  setError('');
                  setVerificationResult(null);
                  setPhoneOrdersFound([]);
                }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                  searchMode === 'phone'
                    ? 'bg-orange-500 text-slate-950 shadow-md shadow-orange-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone size={15} /> Par Numéro Client 📱
              </button>
            </div>

            {/* Formulaire de Recherche */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
              {searchMode === 'code' ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleVerifyByCode();
                  }}
                  className="space-y-4"
                >
                  <div className="relative">
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      placeholder="Ex : 7K4D9XQP"
                      maxLength={12}
                      className="w-full text-center text-2xl sm:text-3xl font-mono tracking-[0.3em] py-4 px-6 bg-slate-950 border-2 border-slate-800 rounded-2xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15 outline-none uppercase transition-all text-white placeholder-slate-700"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setIsCameraActive(!isCameraActive)}
                      className="py-3 px-4 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-orange-500/30 text-orange-400 font-bold rounded-2xl transition-all flex items-center justify-center gap-2 text-xs"
                    >
                      <Camera size={16} /> {isCameraActive ? 'Fermer la Caméra' : 'Scanner QR Code (Caméra)'}
                    </button>

                    <button
                      type="submit"
                      disabled={loading || !code}
                      className="py-3 px-4 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-slate-950 font-black rounded-2xl transition-all shadow-xl shadow-orange-500/20 flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
                    >
                      {loading ? <RefreshCw className="animate-spin" size={16} /> : <><Search size={16} /> Vérifier le code</>}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleVerifyByPhone} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Numéro de téléphone du client
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-400 w-5 h-5" />
                      <input
                        type="tel"
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value)}
                        placeholder="Ex : +225 07 45 12 88 ou 07451288"
                        className="w-full pl-12 pr-4 py-4 bg-slate-950 border-2 border-slate-800 rounded-2xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15 outline-none text-base text-white placeholder-slate-600 transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={() => setPhoneInput('+225 07 45 12 88')}
                      className="py-2.5 px-3 bg-slate-950 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-xs transition-colors text-left"
                    >
                      Raccourci test : +225 07 45 12 88 (Kouadio)
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !phoneInput.trim()}
                      className="flex-1 py-3 px-4 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-slate-950 font-black rounded-2xl transition-all shadow-xl shadow-orange-500/20 flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
                    >
                      {loading ? <RefreshCw className="animate-spin" size={16} /> : <><Search size={16} /> Trouver les colis du client</>}
                    </button>
                  </div>
                </form>
              )}

              {/* Viseur Scanner Caméra */}
              {isCameraActive && searchMode === 'code' && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-orange-500/30 space-y-3 animate-in zoom-in-95 text-center">
                  <div className="flex items-center justify-center gap-2 text-orange-400 text-xs font-bold">
                    <QrCode size={18} /> Viseur Optique Caméra Activé
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Pointez la caméra vers le smartphone du client ou choisissez un colis à simuler :
                  </p>
                  <div className="flex flex-wrap justify-center gap-2 pt-1">
                    {waitingOrders.map((ord) => (
                      <button
                        key={ord.orderId}
                        onClick={() => handleSimulateScan(ord)}
                        className="px-3 py-1.5 bg-slate-900 border border-slate-700 hover:border-orange-500 text-slate-200 text-xs font-mono rounded-xl transition-all"
                      >
                        Simuler QR: {ord.orderId} ({ord.code})
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Messages Erreur / Succès */}
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/25 text-red-400 rounded-2xl text-center text-xs font-bold flex items-center justify-center gap-2 animate-in fade-in">
                <AlertCircle size={16} /> {error}
              </div>
            )}
            {successMsg && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 rounded-2xl text-center text-xs font-bold flex items-center justify-center gap-2 animate-in fade-in">
                <CheckCircle2 size={16} /> {successMsg}
              </div>
            )}

            {/* Multi-colis trouvés pour ce numéro */}
            {phoneOrdersFound.length > 0 && (
              <div className="bg-slate-900 border border-orange-500/30 rounded-3xl p-6 space-y-4 animate-in zoom-in-95">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <PackageCheck size={18} className="text-orange-400" />
                    {phoneOrdersFound.length} colis trouvés pour ce client
                  </h3>
                  <span className="text-xs text-orange-400 font-bold">{phoneInput}</span>
                </div>
                <div className="space-y-3">
                  {phoneOrdersFound.map((ord) => (
                    <div
                      key={ord.orderId}
                      className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-orange-500/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition-all"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-white">#{ord.orderId}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-900 border border-slate-700 text-orange-400 rounded-lg">
                            {ord.code}
                          </span>
                          {ord.paymentMethod === 'cash' ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/30">
                              💵 À encaisser : {formatPrice(ord.totalAmount)}
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              🟢 Déjà Payé en ligne
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-300 font-medium mt-1">Client : {ord.clientName}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{ord.items.map((i) => `${i.qty}x ${i.name}`).join(', ')}</p>
                      </div>
                      <button
                        onClick={() => {
                          setVerificationResult(ord);
                          setCashCollectedConfirmed(ord.paymentMethod !== 'cash');
                          setPhoneOrdersFound([]);
                        }}
                        className="px-4 py-2 bg-orange-500 hover:bg-orange-400 text-slate-950 font-black text-xs rounded-xl transition-all self-end sm:self-center"
                      >
                        Valider ce colis
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Fiche de Colis Vérifié avec Détail Financier à Encaisser ── */}
            {verificationResult && (
              <div className="bg-slate-900/90 border border-orange-500/30 rounded-3xl p-6 space-y-6 shadow-2xl animate-in zoom-in-95">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">Colis Authentifié</span>
                    <h3 className="text-xl font-black text-white mt-0.5">#{verificationResult.orderId}</h3>
                  </div>
                  <span className="px-3 py-1.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 rounded-full text-[10px] font-bold">
                    ✓ Prêt pour remise
                  </span>
                </div>

                {/* 💵 Bannière Montant à Encaisser vs Déjà Payé */}
                {verificationResult.paymentMethod === 'cash' ? (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
                        <DollarSign size={24} />
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">Paiement au Retrait (Espèces)</span>
                        <p className="text-xl font-black text-white mt-0.5">
                          Somme à encaisser : <span className="text-amber-400">{formatPrice(verificationResult.totalAmount)}</span>
                        </p>
                        <p className="text-[11px] text-slate-400">Le client doit régler ce montant en espèces avant remise du colis.</p>
                      </div>
                    </div>
                    <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950 border border-amber-500/30 cursor-pointer self-stretch sm:self-auto justify-center">
                      <input
                        type="checkbox"
                        checked={cashCollectedConfirmed}
                        onChange={(e) => setCashCollectedConfirmed(e.target.checked)}
                        className="w-4 h-4 rounded text-amber-500 accent-amber-500 focus:ring-0 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-white">Espèces reçues</span>
                    </label>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                        <CheckCircle2 size={24} />
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">Paiement Mobile Money Confirmé</span>
                        <p className="text-base font-black text-white mt-0.5">
                          Déjà réglé en ligne : <span className="text-emerald-400">{formatPrice(verificationResult.totalAmount)}</span>
                        </p>
                        <p className="text-[11px] text-slate-400">0 FCFA à demander au client. Ne pas réclamer d&apos;argent.</p>
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                      <PaymentLogo provider={verificationResult.paymentMethod || 'orange'} size={24} />
                      <span className="text-[10px] font-bold text-slate-300 uppercase">{verificationResult.paymentMethod}</span>
                    </div>
                  </div>
                )}

                {/* Coordonnées Destinataire & Sécurité */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-2xl">
                    <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Destinataire Vérifié</p>
                    <p className="font-bold text-white text-sm flex items-center gap-2">
                      <User size={14} className="text-orange-400" /> {verificationResult.clientName}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                      <Phone size={12} /> {verificationResult.clientPhone}
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-2xl">
                    <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Code Secret Associé</p>
                    <p className="font-mono text-base font-black text-orange-400 flex items-center gap-2">
                      <KeyRound size={16} /> {verificationResult.code}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Magasin : {verificationResult.store}</p>
                  </div>
                </div>

                {/* Articles du colis */}
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-2">Contenu du colis :</p>
                  <div className="space-y-2 border border-slate-800 rounded-2xl p-3 bg-slate-950/40">
                    {verificationResult.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs">
                        <div>
                          <span className="text-slate-200 font-medium">
                            {it.qty}x {it.name}
                          </span>
                          <span className="text-[10px] text-slate-500 ml-2">({it.vendor})</span>
                        </div>
                        <span className="font-bold text-white">{formatPrice(it.price * it.qty)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Contrôle d'identité physique */}
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={idCardVerified}
                      onChange={(e) => setIdCardVerified(e.target.checked)}
                      className="w-4 h-4 rounded text-orange-500 accent-orange-500 focus:ring-0 cursor-pointer"
                    />
                    <div className="text-xs text-slate-300">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <FileCheck size={14} className="text-emerald-400" />
                        Identité du client vérifiée au guichet (CNI / Téléphone)
                      </span>
                    </div>
                  </label>
                </div>

                {/* Boutons d'action */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setVerificationResult(null)}
                    className="py-3.5 px-4 bg-slate-950 border border-slate-800 text-slate-400 hover:text-white rounded-2xl text-xs font-bold transition-all"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleConfirmHandover}
                    disabled={loading}
                    className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black rounded-2xl transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 text-sm uppercase tracking-wider"
                  >
                    <Check size={18} />
                    Confirmer la remise du colis au client
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ────────────────────────────────────────────────────────────
            VUE 2 : COLIS EN ATTENTE DE RÉCUPÉRATION
           ──────────────────────────────────────────────────────────── */}
        {activeTab === 'attente' && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h2 className="text-sm font-black text-white">Colis en Attente au Guichet</h2>
                <p className="text-[11px] text-slate-400 mt-0.5">Colis prêts à être remis aux acheteurs à Bouaké</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-black rounded-full">
                  Total à encaisser : {formatPrice(stats.cashToCollect)}
                </span>
              </div>
            </div>

            {waitingOrders.filter(o => o.status !== 'shipped_to_store').length === 0 ? (
              <div className="p-12 text-center text-slate-500 space-y-2">
                <PackageCheck size={36} className="mx-auto text-slate-600 mb-2" />
                <p className="text-sm font-bold text-slate-400">Aucun colis en attente au guichet !</p>
                <p className="text-xs">Tous les colis reçus ont été remis aux clients ou sont encore en transit.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-900/80 text-slate-500 text-[10px] uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="px-5 py-4 font-bold">Réf. & Code</th>
                      <th className="px-5 py-4 font-bold">Client & Téléphone</th>
                      <th className="px-5 py-4 font-bold">Mode & Montant</th>
                      <th className="px-5 py-4 font-bold">Articles</th>
                      <th className="px-5 py-4 font-bold">Arrivée</th>
                      <th className="px-5 py-4 font-bold text-right">Action Guichet</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {waitingOrders.filter(o => o.status !== 'shipped_to_store').map((ord) => (
                      <tr key={ord.orderId || ord.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-5 py-4">
                          <div className="font-black text-white">#{ord.orderId || ord.id}</div>
                          <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-950 border border-slate-800 text-orange-400 rounded-md mt-1 inline-block">
                            {ord.code}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-bold text-slate-200">{ord.clientName}</div>
                          <div className="text-slate-400 text-[11px] flex items-center gap-1 mt-0.5">
                            <Phone size={11} className="text-slate-500" /> {ord.clientPhone}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-black text-white text-sm">{formatPrice(ord.totalAmount)}</div>
                          {ord.paymentMethod === 'cash' ? (
                            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md mt-0.5 inline-block">
                              💵 À encaisser (Espèces)
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md mt-0.5 inline-flex items-center gap-1">
                              <CheckCircle2 size={10} /> Déjà payé en ligne
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-slate-300">
                          <p className="font-medium truncate max-w-xs">{ord.items.map((i) => `${i.qty}x ${i.name}`).join(', ')}</p>
                          <span className="text-[10px] text-slate-500">{ord.items.length} article(s)</span>
                        </td>
                        <td className="px-5 py-4 text-slate-400 text-[11px]">{ord.arrivalDate}</td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => {
                              setActiveTab('guichet');
                              setSearchMode('code');
                              setCode(ord.code);
                              handleVerifyByCode(ord.code);
                            }}
                            className="px-3 py-1.5 bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/30 text-orange-400 text-xs font-bold rounded-xl transition-all"
                          >
                            Valider Retrait
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ────────────────────────────────────────────────────────────
            VUE 3 : HISTORIQUE DES CLIENTS SERVIS (Colis passés récupérer)
           ──────────────────────────────────────────────────────────── */}
        {activeTab === 'historique' && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h2 className="text-sm font-black text-white">Historique des Colis Délivrés</h2>
                <p className="text-[11px] text-slate-400 mt-0.5">Registre de tous les colis retirés par les clients au guichet</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-black rounded-full">
                  Total remis : {stats.countPickedUp} colis ({formatPrice(stats.totalDeliveredValue)})
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-900/80 text-slate-500 text-[10px] uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-5 py-4 font-bold">Réf. Commande</th>
                    <th className="px-5 py-4 font-bold">Client Destinataire</th>
                    <th className="px-5 py-4 font-bold">Montant & Encaissement</th>
                    <th className="px-5 py-4 font-bold">Articles</th>
                    <th className="px-5 py-4 font-bold">Date & Heure Remise</th>
                    <th className="px-5 py-4 font-bold text-right">Reçu & Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {pickedUpOrders.map((ord) => (
                    <tr key={ord.orderId} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-4 font-black text-white">#{ord.orderId}</td>
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-200">{ord.clientName}</div>
                        <div className="text-slate-400 text-[11px] flex items-center gap-1 mt-0.5">
                          <Phone size={11} className="text-slate-500" /> {ord.clientPhone}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-black text-white text-sm">{formatPrice(ord.totalAmount)}</div>
                        {ord.paymentMethod === 'cash' ? (
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md mt-0.5 inline-block">
                            💵 Encaissé au guichet
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded-md mt-0.5 inline-block">
                            Payé en ligne ({ord.paymentMethod})
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-slate-300">
                        <p className="font-medium truncate max-w-xs">{ord.items.map((i) => `${i.qty}x ${i.name}`).join(', ')}</p>
                      </td>
                      <td className="px-5 py-4 text-slate-400 text-[11px]">
                        <div>{ord.pickedUpAt}</div>
                        <div className="text-[10px] text-slate-500">{ord.agentName}</div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => setReceiptOrder(ord)}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-[10px] font-bold rounded-xl transition-all inline-flex items-center gap-1.5 mr-2"
                        >
                          <Printer size={12} className="text-orange-400" /> Reçu
                        </button>
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 inline-flex items-center gap-1">
                          <CheckCircle2 size={11} /> Livré
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ────────────────────────────────────────────────────────────
            VUE 4 : SYNTHÈSE PAR CLIENT (Somme totale par client)
           ──────────────────────────────────────────────────────────── */}
        {activeTab === 'clients' && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden shadow-xl space-y-4">
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
              <div>
                <h2 className="text-sm font-black text-white">Synthèse et Somme par Client</h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Montant total des achats, encaissements perçus et soldes à régler par chaque acheteur
                </p>
              </div>
              <span className="px-3 py-1 bg-slate-950 border border-slate-800 text-xs font-bold text-slate-300 rounded-full">
                {clientsSummary.length} clients répertoriés
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-900/80 text-slate-500 text-[10px] uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-5 py-4 font-bold">Client Acheteur</th>
                    <th className="px-5 py-4 font-bold">Téléphone</th>
                    <th className="px-5 py-4 font-bold">Colis en attente</th>
                    <th className="px-5 py-4 font-bold">Colis déjà retirés</th>
                    <th className="px-5 py-4 font-bold">Reste à payer (Cash)</th>
                    <th className="px-5 py-4 font-bold text-right">Somme Totale Client</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {clientsSummary.map((cl, i) => (
                    <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-4 font-bold text-white flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 flex items-center justify-center font-black text-xs">
                          {cl.name[0]}
                        </div>
                        <span>{cl.name}</span>
                      </td>
                      <td className="px-5 py-4 font-mono text-slate-300">{cl.phone}</td>
                      <td className="px-5 py-4">
                        {cl.pendingOrders.length > 0 ? (
                          <span className="px-2.5 py-1 bg-amber-500/15 text-amber-400 border border-amber-500/25 rounded-full text-[10px] font-bold">
                            {cl.pendingOrders.length} en attente
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {cl.pickedOrders.length > 0 ? (
                          <span className="px-2.5 py-1 bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 rounded-full text-[10px] font-bold">
                            {cl.pickedOrders.length} retiré(s)
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {cl.cashDue > 0 ? (
                          <span className="font-bold text-amber-400 text-sm">{formatPrice(cl.cashDue)}</span>
                        ) : (
                          <span className="text-emerald-400 font-medium text-[11px]">0 FCFA (À jour)</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className="text-sm font-black text-orange-400">{formatPrice(cl.totalAmount)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* ── Modal Reçu de Caisse / Bon de Retrait ── */}
      {receiptOrder && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-5 animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-white font-black text-sm">
                <Receipt size={18} className="text-orange-400" />
                <span>Reçu Officiel de Retrait</span>
              </div>
              <button onClick={() => setReceiptOrder(null)} className="text-slate-400 hover:text-white p-1 rounded-xl">
                <X size={18} />
              </button>
            </div>

            {/* Corps du Ticket */}
            <div id="printable-receipt" className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4 text-xs font-mono">
              <div className="text-center border-b border-slate-800 pb-3 space-y-1">
                <p className="font-black text-sm text-orange-400 tracking-wider">ANOUAN EXPRESS 🇨🇮</p>
                <p className="text-[10px] text-slate-400">Magasin Central de Retrait Bouaké</p>
                <p className="text-[10px] text-slate-500">Quartier Commerce, Rue des Banques</p>
              </div>

              <div className="space-y-1.5 text-slate-300">
                <div className="flex justify-between">
                  <span>N° Commande :</span>
                  <span className="font-bold text-white">#{receiptOrder.orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span>Client :</span>
                  <span className="font-bold text-white">{receiptOrder.clientName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Téléphone :</span>
                  <span>{receiptOrder.clientPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date & Heure :</span>
                  <span>{receiptOrder.pickedUpAt}</span>
                </div>
                <div className="flex justify-between">
                  <span>Agent :</span>
                  <span>{receiptOrder.agentName || 'Guichet 01'}</span>
                </div>
              </div>

              {/* Articles */}
              <div className="border-t border-b border-dashed border-slate-700 py-3 space-y-2">
                <p className="text-[10px] uppercase font-bold text-slate-400">Articles remis :</p>
                {receiptOrder.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between text-[11px]">
                    <span className="text-slate-300">{it.qty}x {it.name}</span>
                    <span className="font-bold text-white">{formatPrice(it.price * it.qty)}</span>
                  </div>
                ))}
              </div>

              {/* Total & Mode */}
              <div className="space-y-2 pt-1">
                <div className="flex justify-between text-sm font-black">
                  <span>TOTAL :</span>
                  <span className="text-orange-400">{formatPrice(receiptOrder.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span>Mode de paiement :</span>
                  <span className="font-bold text-emerald-400 uppercase">
                    {receiptOrder.paymentMethod === 'cash' ? '💵 Espèces (Encaissé)' : `Mobile Money (${receiptOrder.paymentMethod})`}
                  </span>
                </div>
                <div className="text-center pt-2 text-[10px] text-slate-500 italic">
                  ✓ Colis contrôlé et remis en mains propres. Merci de votre confiance !
                </div>
              </div>
            </div>

            {/* Actions modal */}
            <div className="flex gap-3">
              <button
                onClick={() => window.print()}
                className="flex-1 py-3 px-4 bg-orange-500 hover:bg-orange-400 text-slate-950 font-black rounded-2xl transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
              >
                <Printer size={15} /> Imprimer le Ticket
              </button>
              <button
                onClick={() => setReceiptOrder(null)}
                className="py-3 px-5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl text-xs font-bold transition-all"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
