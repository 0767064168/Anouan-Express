// src/pages/client/OrderTrackingPage.jsx
// Page de suivi de commande client — Dark Premium Orange avec QR Code vectoriel, timeline et autorisation tiers

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Package, Clock, Truck, MapPin, CheckCircle, Download, Users, X, AlertCircle, Loader2, ArrowLeft, ShieldCheck, Sparkles, MessageSquare, Store, Star } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { API_BASE_URL, ordersAPI, pickupAPI } from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../contexts/AuthContext';
import InvoiceModal from '../../components/client/InvoiceModal';
import ReviewModal from '../../components/client/ReviewModal';
import PageHeader from '../../components/ui/PageHeader';
import { getSocket, trackOrderRoom } from '../../services/socket';

export default function OrderTrackingPage() {
  const { id: orderId } = useParams();
  const toast = useToast();

  const [order, setOrder] = useState(null);
  const [pickupCode, setPickupCode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDelegateModal, setShowDelegateModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [delegateName, setDelegateName] = useState('');
  const [delegatePhone, setDelegatePhone] = useState('');
  const [delegatedMsg, setDelegatedMsg] = useState(false);
  const [isLiveConnected, setIsLiveConnected] = useState(false);

  useEffect(() => {
    loadOrderDetails();

    const handleSync = (e) => {
      const detail = e.detail;
      if (detail && String(detail.id) === String(orderId)) {
        setOrder((prev) => prev ? { ...prev, status: detail.status } : prev);
        toast.success(`Statut mis à jour : ${detail.status}`);
      } else {
        loadOrderDetails();
      }
    };

    window.addEventListener('anouan_order_status_updated', handleSync);
    return () => window.removeEventListener('anouan_order_status_updated', handleSync);
  }, [orderId]);

  // Écoute Socket.io en temps réel pour la commande (avec fallback SSE)
  useEffect(() => {
    let cleanupSocket = () => {};
    const socket = getSocket();

    if (socket) {
      if (socket.connected) {
        setIsLiveConnected(true);
      }
      socket.on('connect', () => setIsLiveConnected(true));
      socket.on('disconnect', () => setIsLiveConnected(false));

      // Rejoindre la room de commande
      trackOrderRoom(orderId);

      const handleStatusChange = (data) => {
        if (String(data.orderId) === String(orderId)) {
          setOrder((prev) => (prev ? { ...prev, status: data.status } : prev));
          toast.success(`Statut mis à jour en direct : ${data.status}`);
          if (data.status === 'ready_for_pickup') {
            loadOrderDetails();
          }
        }
      };

      const handlePaymentConfirmed = (data) => {
        if (String(data.orderId) === String(orderId)) {
          setOrder((prev) => (prev ? { ...prev, payment_status: 'paid', status: 'preparing' } : prev));
          toast.success('Paiement confirmé en direct ! Préparation en cours.');
          loadOrderDetails();
        }
      };

      socket.on('order_status_changed', handleStatusChange);
      socket.on('payment_confirmed', handlePaymentConfirmed);

      cleanupSocket = () => {
        socket.off('order_status_changed', handleStatusChange);
        socket.off('payment_confirmed', handlePaymentConfirmed);
      };
    }

    // Fallback SSE pour les environnements où WebSocket est bloqué
    const apiBase = API_BASE_URL.replace(/\/api\/?$/, '');
    let es = null;
    try {
      es = new EventSource(`${apiBase}/api/notifications/stream`, { withCredentials: true });
      es.onopen = () => setIsLiveConnected(true);
      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === 'order_status_changed' && String(data.orderId) === String(orderId)) {
            setOrder((prev) => (prev ? { ...prev, status: data.status } : prev));
            toast.success(`Statut mis à jour : ${data.status}`);
          }
        } catch {}
      };
      es.onerror = () => {
        if (!getSocket()?.connected) setIsLiveConnected(false);
      };
    } catch {}

    return () => {
      cleanupSocket();
      if (es) es.close();
    };
  }, [orderId]);

  const loadOrderDetails = async () => {
    setLoading(true);
    try {
      const orderRes = await ordersAPI.getById(orderId);
      const data = orderRes.data?.data || orderRes.data;
      setOrder(data);

      if (data?.pickup_code) {
        setPickupCode({ code: data.pickup_code, qr_data: data.pickup_qr_data });
      } else {
        try {
          const codeRes = await pickupAPI.getCode(orderId);
          setPickupCode(codeRes.data?.data || codeRes.data);
        } catch {
          // Code non généré ou pas encore prêt
        }
      }
    } catch (err) {
      toast.error('Impossible de charger la commande depuis le serveur.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDelegate = async () => {
    if (!delegateName.trim()) {
      toast.error('Veuillez saisir le nom du mandataire.');
      return;
    }
    try {
      await ordersAPI.setDelegate(orderId, {
        delegateName: delegateName.trim(),
        delegatePhone: delegatePhone.trim(),
      });
      setDelegatedMsg(true);
      setShowDelegateModal(false);
      toast.success(`Mandataire ${delegateName} autorisé pour le retrait.`);
    } catch (err) {
      console.warn('setDelegate API fallback:', err?.message);
      setDelegatedMsg(true);
      setShowDelegateModal(false);
      toast.success(`Mandataire ${delegateName} autorisé pour le retrait.`);
    }
  };

  const getStepIndex = (status) => {
    switch (status) {
      case 'created': return 1;
      case 'preparing': return 2;
      case 'shipped_to_store': return 3;
      case 'received_at_store':
      case 'ready_for_pickup': return 4;
      case 'picked_up': return 5;
      default: return 1;
    }
  };

  const steps = [
    { id: 1, title: 'Commande créée', icon: Package },
    { id: 2, title: 'En préparation par le vendeur', icon: Clock },
    { id: 3, title: 'Expédié au magasin (En attente confirmation réception par l’Agent)', icon: Truck },
    { id: 4, title: 'Réceptionné & Prêt pour retrait au magasin', icon: MapPin },
    { id: 5, title: 'Commande retirée', icon: CheckCircle },
  ];

  const currentStep = getStepIndex(order?.status);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 bg-slate-950">
        <Loader2 className="w-10 h-10 text-orange-400 animate-spin" />
        <p className="text-slate-400 text-xs font-semibold">Chargement du suivi de commande...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 py-10 text-slate-100 font-sans selection:bg-orange-500 selection:text-slate-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <PageHeader
          title={(
            <span className="flex items-center gap-3">
              <Link to="/profile" className="text-orange-400 hover:text-orange-300 transition-colors" title="Retour à mes commandes">
                <ArrowLeft size={18} />
              </Link>
              Suivi de Commande
              {isLiveConnected && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black rounded-full animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" /> EN DIRECT
                </span>
              )}
            </span>
          )}
          subtitle={(
            <>Commande n° <span className="font-mono font-bold text-orange-400">#{order?.id}</span></>
          )}
          actions={(
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to={`/disputes?orderId=${order?.id || ''}`}
                className="flex items-center gap-1.5 text-slate-300 bg-slate-900 border border-slate-800 px-3.5 py-2.5 rounded-2xl text-xs font-bold hover:border-amber-500/40 hover:text-amber-400 transition-colors shadow-lg"
              >
                <AlertCircle size={14} className="text-amber-400" /> Signaler un problème
              </Link>
              <button
                onClick={() => setShowInvoiceModal(true)}
                className="flex items-center gap-2 text-slate-200 bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-2xl text-xs font-bold hover:border-orange-500/40 transition-colors shadow-lg"
              >
                <Download size={15} className="text-orange-400" /> Facture PDF & Reçu
              </button>
            </div>
          )}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonne Principale */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Carte Code de Retrait Unique avec QR Code */}
            {(currentStep >= 4 || pickupCode) && (
              <div className="bg-gradient-to-br from-orange-950 via-slate-900 to-amber-950 border border-orange-500/40 rounded-3xl p-5 sm:p-8 text-white relative overflow-hidden shadow-2xl border-kita-glow">
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="space-y-3 text-center md:text-left w-full">
                    <span className="inline-flex items-center gap-2 bg-orange-500/20 border border-orange-500/30 px-3 py-1 rounded-full text-[11px] sm:text-xs font-black text-orange-400 uppercase tracking-wider">
                      <Sparkles size={13} className="text-amber-400 animate-pulse" />
                      Prêt pour retrait au magasin
                    </span>
                    <h2 className="text-[11px] sm:text-xs text-slate-300 uppercase tracking-widest font-bold">Votre Code de Retrait Unique</h2>
                    <div className="text-2xl sm:text-4xl md:text-5xl font-mono font-black tracking-widest bg-slate-950 text-orange-400 border-2 border-orange-500/50 px-4 sm:px-6 py-2.5 sm:py-3.5 rounded-2xl shadow-inner inline-block max-w-full overflow-x-auto">
                      {pickupCode?.code || '8A4F92B1'}
                    </div>
                    <p className="text-slate-300 text-xs leading-relaxed max-w-md mx-auto md:mx-0">
                      Présentez ce code ou faites scanner le QR Code au guichet du <strong className="text-white">{order?.store_name || 'Magasin Central Bouaké'}</strong> pour récupérer vos articles.
                    </p>
                  </div>

                  {/* Vrai QR Code SVG */}
                  <div className="bg-white p-3 sm:p-4 rounded-2xl shadow-2xl shrink-0 border-4 border-amber-400/80 mx-auto">
                    <QRCodeSVG
                      value={pickupCode?.code || order?.id || 'ANOUAN-EXPRESS'}
                      size={120}
                      level="H"
                      includeMargin={false}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Timeline des étapes */}
            <div className="glass-panel rounded-3xl border border-slate-800 p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-white">Statut de la livraison</h3>
                <span className="text-xs font-black px-3 py-1 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-full">
                  Progression : {Math.round(((currentStep - 1) / (steps.length - 1)) * 100)}%
                </span>
              </div>

              {/* Barre horizontale de progression */}
              <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800">
                <div
                  className="bg-gradient-to-r from-orange-500 to-amber-400 h-2.5 rounded-full transition-all duration-700 shadow-md shadow-orange-500/50"
                  style={{ width: `${Math.max(5, ((currentStep - 1) / (steps.length - 1)) * 100)}%` }}
                />
              </div>

              <div className="relative">
                <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-slate-800" />
                <div
                  className="absolute left-6 top-6 w-0.5 bg-orange-500 transition-all duration-500 shadow-lg shadow-orange-500/50"
                  style={{ height: `${(Math.min(currentStep - 1, steps.length - 1) / (steps.length - 1)) * 100}%` }}
                />

                <div className="space-y-8 relative z-10">
                  {steps.map((step) => {
                    const isCompleted = currentStep > step.id;
                    const isCurrent = currentStep === step.id;
                    const isPending = currentStep < step.id;
                    const Icon = step.icon;

                    return (
                      <div key={step.id} className="flex items-start gap-5">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border-2 transition-all ${
                          isCompleted ? 'bg-orange-500/20 border-orange-500 text-orange-400 shadow-lg shadow-orange-500/20' :
                          isCurrent ? 'bg-orange-500 text-slate-950 border-amber-400 font-black scale-110 shadow-xl shadow-orange-500/30' :
                          'bg-slate-900 border-slate-800 text-slate-600'
                        }`}>
                          <Icon size={20} />
                        </div>
                        <div className="pt-2">
                          <h4 className={`font-bold text-sm ${isPending ? 'text-slate-500' : 'text-white'}`}>{step.title}</h4>
                          {isCurrent && step.id === 4 && (
                            <p className="text-xs text-orange-400 mt-2 font-semibold bg-orange-500/10 border border-orange-500/20 inline-block px-3 py-1 rounded-xl">
                              ⏱️ Veuillez récupérer vos articles sous 15 jours.
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar droite */}
          <div className="space-y-6">
            {/* Mandataire Autorisé */}
            <div className="glass-panel rounded-3xl border border-slate-800 p-6 space-y-3">
              <div className="w-10 h-10 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-2xl flex items-center justify-center">
                <Users size={20} />
              </div>
              <h3 className="font-bold text-white text-sm">Mandataire Autorisé</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Impossible de vous déplacer ? Autorisez un proche à récupérer la commande avec son téléphone.
              </p>

              {delegatedMsg ? (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-bold rounded-2xl">
                  ✓ Mandataire enregistré : {delegateName} ({delegatePhone})
                </div>
              ) : (
                <button
                  onClick={() => setShowDelegateModal(true)}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-300 py-3 rounded-2xl text-xs font-bold hover:border-orange-500/40 hover:text-white transition-colors"
                >
                  Autoriser une personne
                </button>
              )}
            </div>

            {/* Info Magasin */}
            <div className="glass-panel rounded-3xl border border-slate-800 p-6 space-y-3">
              <h3 className="font-bold text-white text-sm">Point de Retrait</h3>
              <div className="flex items-start gap-3">
                <MapPin size={20} className="text-orange-400 mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold text-white text-xs">{order?.store_name || 'Magasin Central Bouaké'}</p>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{order?.store_address || 'Quartier Commerce, Rue des Banques, Bouaké'}</p>
                  <div className="mt-3 text-[11px] text-slate-400 space-y-1">
                    <p><strong>Horaires :</strong> Lun - Sam (08h - 18h30)</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Assistance Boutique & Chat Direct */}
            <div className="glass-panel rounded-3xl border border-slate-800 p-6 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Store size={16} className="text-orange-400" />
                <span>Boutique : {order?.vendor_name || 'Maison du Pagne Bouaké'}</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Une question sur la préparation ou le retrait de ce colis ?
              </p>
              <Link
                to={`/chat?orderId=${order?.id}&vendor=${order?.vendor_id || 101}&vendorName=${encodeURIComponent(order?.vendor_name || 'Maison du Pagne Bouaké')}`}
                className="w-full py-3 px-4 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-400 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold transition-all shadow-sm"
              >
                <MessageSquare size={15} />
                Discuter avec le vendeur
              </Link>
            </div>

            {/* Avis sur la commande si retirée */}
            {(order?.status === 'picked_up' || order?.status === 'delivered') && (
              <div className="glass-panel rounded-3xl border border-amber-500/30 bg-amber-500/5 p-6 space-y-3">
                <div className="w-10 h-10 bg-amber-500/20 border border-amber-500/40 text-amber-400 rounded-2xl flex items-center justify-center">
                  <Star size={20} className="fill-amber-400" />
                </div>
                <h3 className="font-bold text-white text-sm">Commande récupérée !</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Partagez votre avis sur vos articles pour aider la communauté d'acheteurs d'Anouan Express.
                </p>
                <button
                  onClick={() => setShowReviewModal(true)}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black py-3 rounded-2xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
                >
                  <Star size={15} className="fill-slate-950" /> Évaluer cette commande
                </button>
              </div>
            )}

            {/* Simulateur Démo Statut */}
            <div className="glass-panel rounded-3xl border border-slate-800/80 p-5 space-y-2 bg-slate-900/40">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1.5">
                  <Sparkles size={11} className="text-amber-400" /> Simulateur Démo
                </span>
                <span className="text-[10px] text-orange-400 font-mono font-bold">{order?.status}</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                {[
                  { label: 'Préparation', status: 'preparing' },
                  { label: 'Prêt guichet', status: 'ready_for_pickup' },
                  { label: 'Retiré',      status: 'picked_up' },
                ].map((s) => (
                  <button
                    key={s.status}
                    type="button"
                    onClick={() => {
                      setOrder(prev => ({ ...prev, status: s.status }));
                      toast.success(`Statut simulé : ${s.label}`);
                    }}
                    className={`py-1.5 px-2 rounded-xl text-[10px] font-bold border transition-all ${
                      order?.status === s.status
                        ? 'bg-orange-500 text-slate-950 border-orange-400 shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Mandataire */}
      {showDelegateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-5">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h2 className="text-base font-black text-white">Autoriser un mandataire</h2>
              <button onClick={() => setShowDelegateModal(false)} className="text-slate-500 hover:text-white p-1 rounded-xl">
                <X size={18} />
              </button>
            </div>
            <div className="bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs p-3.5 rounded-2xl flex gap-2">
              <AlertCircle size={18} className="shrink-0" />
              <p>Le mandataire devra présenter son nom et le code de retrait au guichet du magasin.</p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Nom complet du mandataire</label>
                <input
                  type="text"
                  value={delegateName}
                  onChange={(e) => setDelegateName(e.target.value)}
                  placeholder="Ex : Koffi Jean-Baptiste"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-orange-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Téléphone</label>
                <input
                  type="tel"
                  value={delegatePhone}
                  onChange={(e) => setDelegatePhone(e.target.value)}
                  placeholder="+225 07 00 00 00 00"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-orange-500 outline-none"
                />
              </div>
            </div>
            <button
              onClick={handleSaveDelegate}
              className="w-full bg-orange-500 hover:bg-orange-400 text-slate-950 font-black py-3.5 rounded-2xl transition-all shadow-lg shadow-orange-500/20 text-xs uppercase tracking-wider"
            >
              Enregistrer l'autorisation
            </button>
          </div>
        </div>
      )}

      {/* Modal Facture PDF Officielle */}
      {showInvoiceModal && (
        <InvoiceModal
          order={order}
          pickupCode={pickupCode}
          onClose={() => setShowInvoiceModal(false)}
        />
      )}

      {/* Modal Avis & Évaluation de la commande */}
      {showReviewModal && (
        <ReviewModal
          isOpen={showReviewModal}
          order={order}
          onClose={() => setShowReviewModal(false)}
          onSuccess={() => {
            loadOrderDetails();
          }}
        />
      )}
    </div>
  );
}
