// src/pages/client/CheckoutPage.jsx
// Page de finalisation de commande (Checkout) avec modal de paiement Mobile Money interactif & QR Code

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, CreditCard, CheckCircle, ChevronRight, ShoppingBag, ShieldCheck, AlertCircle, Loader2, Smartphone, CheckCircle2, Lock, ArrowRight, Tag, Sparkles, Star } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { ordersAPI, storesAPI, paymentsAPI } from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import PaymentLogo from '../../components/ui/PaymentLogos';
import PageHeader from '../../components/ui/PageHeader';
import MobilePaymentModal from '../../components/client/MobilePaymentModal';

const formatPrice = (p) => new Intl.NumberFormat('fr-CI').format(Number(p || 0)) + ' FCFA';

const OPERATORS = {
  orange: { name: 'Orange Money', color: 'from-orange-500 to-amber-500', code: '*144*82#', bg: 'bg-orange-500/10 border-orange-500/30 text-orange-400' },
  mtn:    { name: 'MTN Mobile Money', color: 'from-yellow-400 to-amber-500', code: '*133#', bg: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' },
  wave:   { name: 'Wave Digital', color: 'from-sky-400 to-blue-500', code: 'App Wave', bg: 'bg-sky-500/10 border-sky-500/30 text-sky-400' },
  cash:   { name: 'Payer au Retrait', color: 'from-emerald-400 to-teal-500', code: 'Espèces', bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' },
};

export default function CheckoutPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const { items, totalPrice, discountAmount, appliedPromo, applyPromoCode, removePromoCode, clearCart } = useCart();

  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('orange');
  const [phone, setPhone] = useState('+225 07 45 12 88');
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [loadingStores, setLoadingStores] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Programme de fidélité Anouan Club
  const [loyaltyBalance, setLoyaltyBalance] = useState(0);
  const [useLoyalty, setUseLoyalty] = useState(false);
  const [loyaltyToUse, setLoyaltyToUse] = useState(0);

  // State Modal Paiement Mobile Money
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [modalStep, setModalStep] = useState(1); // 1: confirmation, 2: saisie code PIN, 3: validation
  const [pinCode, setPinCode] = useState('');
  const [pendingOrder, setPendingOrder] = useState(null);
  const [activePaymentUrl, setActivePaymentUrl] = useState('');
  const [pollingOrderId, setPollingOrderId] = useState(null);

  useEffect(() => {
    loadStores();
    // Charger le solde de points fidélité
    import('../../services/api').then(({ usersAPI }) => {
      usersAPI.getMe().then((res) => {
        const pts = res.data?.data?.loyalty_points ?? res.data?.loyalty_points ?? 0;
        setLoyaltyBalance(pts);
        setLoyaltyToUse(Math.min(pts, Math.floor(pts / 2))); // Pré-remplir avec le max utilisable
      }).catch(() => {});
    });
  }, []);

  const loadStores = async () => {
    try {
      const res = await storesAPI.getAll();
      const list = res.data?.data || res.data || [];
      setStores(list);
      if (list.length > 0) setSelectedStore(list[0]);
    } catch {
      setSelectedStore({
        id: 1,
        name: 'Magasin Central Bouaké',
        address: 'Quartier Commerce, Rue des Banques, près de la pharmacie principale.',
      });
    } finally {
      setLoadingStores(false);
    }
  };

  // Code Promo
  const [promoCode, setPromoCode] = useState('');
  const [promoError, setPromoError] = useState('');

  const handleApplyPromo = () => {
    setPromoError('');
    const clean = promoCode.trim().toUpperCase();
    if (!clean) return;
    const res = applyPromoCode(clean);
    if (res.success) {
      toast.success(res.message);
      setPromoCode('');
    } else {
      setPromoError(res.message);
    }
  };

  const platformFee = 500;
  const discount = discountAmount || 0;
  const loyaltyDiscount = useLoyalty ? Math.floor(loyaltyToUse / 2) : 0; // 2 pts = 1 FCFA
  const total = Math.max(0, totalPrice + (items.length > 0 ? platformFee : 0) - discount - loyaltyDiscount);

  const handleInitiateOrder = async () => {
    if (items.length === 0) {
      setError('Votre panier est vide.');
      return;
    }
    if (!selectedStore) {
      setError('Veuillez sélectionner un magasin de retrait.');
      return;
    }
    if (paymentMethod !== 'cash' && !phone) {
      setError('Veuillez renseigner le numéro Mobile Money.');
      return;
    }

    setError('');

    // Si cash, création directe
    if (paymentMethod === 'cash') {
      executeCashOrder();
    } else {
      initiateMobilePaymentOrder();
    }
  };

  const executeCashOrder = async () => {
    setSubmitting(true);
    try {
      const orderPayload = {
        storeId: selectedStore.id,
        paymentMethod: 'cash',
        loyaltyPointsUsed: useLoyalty ? loyaltyToUse : 0,
        items: items.map((i) => ({
          productId: i.id || i.productId,
          quantity: i.quantity,
        })),
      };

      const orderRes = await ordersAPI.create(orderPayload);
      const createdOrder = orderRes.data?.data || orderRes.data;

      window.dispatchEvent(new CustomEvent('anouan_order_status_updated', { detail: { id: createdOrder.id, status: createdOrder.status || 'created' } }));
      clearCart();
      toast.success('Commande enregistrée ! Paiement en espèces au retrait.');
      navigate(`/orders/${createdOrder.id}/tracking`);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Erreur lors de la validation. Réessayez.');
    } finally {
      setSubmitting(false);
    }
  };

  const initiateMobilePaymentOrder = async () => {
    setSubmitting(true);
    try {
      const orderPayload = {
        storeId: selectedStore.id,
        paymentMethod,
        loyaltyPointsUsed: useLoyalty ? loyaltyToUse : 0,
        items: items.map((i) => ({
          productId: i.id || i.productId,
          quantity: i.quantity,
        })),
      };

      const orderRes = await ordersAPI.create(orderPayload);
      const createdOrder = orderRes.data?.data || orderRes.data;
      setPendingOrder(createdOrder);

      const paymentRes = await paymentsAPI.initiate({
        orderId: createdOrder.id,
        phoneNumber: phone,
        provider: paymentMethod,
      });

      const payment = paymentRes.data?.data || paymentRes.data || {};
      setActivePaymentUrl(payment.paymentUrl || '');
      setPollingOrderId(createdOrder.id);
      setShowPaymentModal(true);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Erreur lors de l’initiation du paiement. Réessayez.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    clearCart();
    toast.success('Paiement validé avec succès !');
    if (pendingOrder?.id || pollingOrderId) {
      navigate(`/orders/${pendingOrder?.id || pollingOrderId}/tracking`);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 bg-slate-950">
        <ShoppingBag className="w-16 h-16 text-slate-800 mb-4" />
        <h2 className="text-xl text-white font-black mb-2">Votre panier est vide</h2>
        <p className="text-slate-400 text-xs mb-6">Ajoutez des articles pour finaliser une commande.</p>
        <button
          onClick={() => navigate('/catalog')}
          className="bg-orange-500 text-white font-black rounded-2xl hover:bg-orange-600 shadow-lg shadow-orange-500/20 px-6 py-3 transition-colors text-xs"
        >
          Découvrir le catalogue
        </button>
      </div>
    );
  }

  const currentOp = OPERATORS[paymentMethod] || OPERATORS.orange;

  return (
    <div className="min-h-screen bg-slate-950 py-8 font-sans selection:bg-orange-500 selection:text-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <PageHeader
          eyebrow="Commande sécurisée"
          eyebrowIcon={ShieldCheck}
          title="Finaliser la commande"
          subtitle="Choisissez votre lieu de retrait et votre mode de paiement."
          className="mb-8"
        />

        {error && (
          <div className="mb-6 p-4 bg-slate-900/60 border border-red-500 text-red-400 rounded-3xl text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" /> {error}
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Formulaire principal */}
          <div className="w-full lg:w-2/3 space-y-6">
            
            {/* Étape 1 : Lieu de Retrait */}
            <div className={`bg-slate-900/60 border ${step >= 1 ? 'border-orange-500/50' : 'border-slate-800'} rounded-3xl p-6 transition-all`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl text-white font-black flex items-center gap-3">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${step >= 1 ? 'bg-orange-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>1</span>
                  Lieu de Retrait
                </h2>
                {step > 1 && <CheckCircle className="text-orange-500 w-6 h-6" />}
              </div>

              {step === 1 ? (
                <div className="pl-11 space-y-4">
                  {loadingStores ? (
                    <p className="text-slate-400 text-xs">Chargement des magasins...</p>
                  ) : (
                    <div className="space-y-3">
                      {stores.map((s) => (
                        <div
                          key={s.id}
                          onClick={() => setSelectedStore(s)}
                          className={`border rounded-3xl p-4 cursor-pointer relative overflow-hidden transition-all ${
                            selectedStore?.id === s.id ? 'border-orange-500 bg-slate-800/40' : 'border-slate-800 hover:border-orange-500/30'
                          }`}
                        >
                          {selectedStore?.id === s.id && (
                            <div className="absolute top-0 right-0 bg-orange-500 text-slate-950 text-[10px] font-black px-3 py-1 rounded-bl-2xl">Sélectionné</div>
                          )}
                          <div className="flex items-start gap-4">
                            <div className="bg-slate-950 p-3 rounded-2xl text-orange-500 border border-slate-800">
                              <MapPin className="w-6 h-6" />
                            </div>
                            <div>
                              <h3 className="text-white font-black text-lg">{s.name}</h3>
                              <p className="text-slate-400 text-xs mt-1">{s.address}</p>
                              <p className="text-orange-400 text-xs font-bold mt-2">Ouvert aujourd'hui : 08h00 - 18h30</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-3 flex-wrap">
                    <button
                      onClick={() => setStep(2)}
                      className="mt-4 bg-orange-500 text-slate-950 font-black rounded-2xl hover:bg-orange-400 shadow-lg shadow-orange-500/20 px-8 py-3.5 transition-all text-xs uppercase tracking-wider"
                    >
                      Continuer vers le paiement
                    </button>
                    <a
                      href="/stores"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex items-center gap-2 border border-orange-500/40 text-orange-400 hover:bg-orange-500/10 font-bold rounded-2xl px-5 py-3.5 text-xs transition-all"
                    >
                      <MapPin size={14} /> Voir sur la carte
                    </a>
                  </div>
                </div>
              ) : (
                <div className="pl-11 text-slate-400 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-orange-500" />
                    <span>{selectedStore?.name} ({selectedStore?.address})</span>
                  </div>
                  <button onClick={() => setStep(1)} className="text-orange-400 hover:underline text-xs font-bold">Modifier</button>
                </div>
              )}
            </div>

            {/* Étape 2 : Mode de Paiement */}
            <div className={`bg-slate-900/60 border ${step >= 2 ? 'border-orange-500/50' : 'border-slate-800'} rounded-3xl p-6 transition-all ${step < 2 ? 'opacity-60 pointer-events-none' : ''}`}>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-xl text-white font-black flex items-center gap-3">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${step >= 2 ? 'bg-orange-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>2</span>
                  Mode de Paiement
                </h2>
              </div>

              {step === 2 && (
                <div className="pl-11 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { id: 'orange', name: 'Orange Money', desc: 'Paiement USSD *144# / Application' },
                      { id: 'mtn',    name: 'MTN MoMo',      desc: 'Paiement USSD *133# / MoMo App' },
                      { id: 'wave',   name: 'Wave Digital',  desc: 'Paiement instantané sans frais' },
                      { id: 'cash',   name: 'Payer au retrait', desc: 'En espèces au guichet Bouaké' },
                    ].map((op) => (
                      <label
                        key={op.id}
                        className={`border rounded-3xl p-4 flex items-center gap-4 cursor-pointer transition-all ${
                          paymentMethod === op.id ? 'border-orange-500 bg-slate-800/50 shadow-xl shadow-orange-500/10 scale-[1.01]' : 'border-slate-800 hover:border-orange-500/30'
                        }`}
                      >
                        <input
                          type="radio"
                          name="payment"
                          value={op.id}
                          checked={paymentMethod === op.id}
                          onChange={() => setPaymentMethod(op.id)}
                          className="w-5 h-5 accent-orange-500 shrink-0"
                        />
                        <PaymentLogo provider={op.id} size={42} />
                        <div className="flex-1 min-w-0">
                          <div className="text-white font-black text-sm">{op.name}</div>
                          <div className="text-slate-400 text-xs">{op.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>

                  {paymentMethod !== 'cash' && (
                    <div className="mt-4">
                      <label className="block text-slate-400 text-xs font-bold mb-2">Numéro Mobile Money (pour validation)</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+225 07 00 00 00 00"
                        className="w-full md:w-1/2 p-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-white focus:border-orange-500 outline-none"
                      />
                    </div>
                  )}

                  <button
                    onClick={handleInitiateOrder}
                    disabled={submitting}
                    className="w-full md:w-auto bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-black rounded-2xl shadow-xl shadow-orange-500/20 px-10 py-4 text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {submitting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        Confirmer et Payer {formatPrice(total)} <ChevronRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Résumé de commande */}
          <div className="w-full lg:w-1/3">
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sticky top-24 space-y-6">
              <h3 className="text-lg text-white font-black flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-orange-400" /> Résumé de la commande
              </h3>

              <div className="space-y-4 max-h-64 overflow-y-auto pr-2 divide-y divide-slate-800/60">
                {items.map((item) => (
                  <div key={item.key || item.id} className="flex gap-4 pt-4 first:pt-0">
                    <div className="w-14 h-14 bg-slate-950 rounded-2xl overflow-hidden flex items-center justify-center border border-slate-800 flex-shrink-0 text-2xl">
                      {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : '🛍️'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-black text-sm truncate">{item.name || item.title}</h4>
                      {item.variant && <p className="text-slate-400 text-xs">{item.variant.name || item.variant}</p>}
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-slate-400 text-xs">Qté: {item.quantity}</span>
                        <span className="font-black text-orange-400 text-sm">{formatPrice(Number(item.price) * item.quantity)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Saisie Code Promo */}
              <div className="pt-2">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                      placeholder="Code promo (ex: BOUAKE2026)"
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 uppercase focus:border-orange-500 outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyPromo}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-orange-400 font-bold rounded-xl text-xs transition-colors"
                  >
                    Appliquer
                  </button>
                </div>
                {promoError && <p className="text-[10px] text-red-400 mt-1 font-semibold">{promoError}</p>}
                {appliedPromo && (
                  <div className="mt-2 flex items-center justify-between p-2 bg-orange-500/10 border border-orange-500/20 rounded-xl text-[11px] text-orange-400 font-bold">
                    <span className="flex items-center gap-1.5"><Sparkles size={12} /> {appliedPromo.label}</span>
                    <button type="button" onClick={removePromoCode} className="text-slate-400 hover:text-white">✕</button>
                  </div>
                )}
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-800 text-xs text-slate-400">
                <div className="flex justify-between">
                  <span>Sous-total</span>
                  <span className="text-white font-bold">{formatPrice(totalPrice)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-400 font-bold">
                    <span>Réduction appliquée</span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                )}
                {loyaltyDiscount > 0 && (
                  <div className="flex justify-between text-amber-400 font-bold">
                    <span className="flex items-center gap-1"><Star size={11} /> Points Anouan Club</span>
                    <span>-{formatPrice(loyaltyDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Frais de service plateforme</span>
                  <span className="text-white font-bold">{formatPrice(platformFee)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Frais de retrait Magasin Central</span>
                  <span className="text-orange-400 font-bold">Gratuit</span>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-800 flex justify-between items-end">
                  <span className="text-sm text-white font-black">Total à régler</span>
                  <span className="text-xl text-orange-400 font-black">{formatPrice(total)}</span>
                </div>
              </div>

              {/* Bloc Anouan Club */}
              {loyaltyBalance > 0 && (
                <div className={`rounded-2xl p-4 border transition-all ${useLoyalty ? 'bg-amber-500/10 border-amber-500/30' : 'bg-slate-950 border-slate-800'}`}>
                  <label className="flex items-center justify-between cursor-pointer gap-3">
                    <div className="flex items-center gap-2">
                      <Star size={16} className="text-amber-400 shrink-0" />
                      <div>
                        <p className="text-white text-xs font-black">Points Anouan Club</p>
                        <p className="text-slate-400 text-[10px]">{loyaltyBalance} pts disponibles (≈ {Math.floor(loyaltyBalance / 2)} FCFA)</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={useLoyalty}
                      onChange={(e) => setUseLoyalty(e.target.checked)}
                      className="w-4 h-4 accent-amber-500"
                    />
                  </label>
                  {useLoyalty && (
                    <div className="mt-3 space-y-2">
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>Points à utiliser</span>
                        <span className="text-amber-400 font-bold">{loyaltyToUse} pts = -{Math.floor(loyaltyToUse / 2)} FCFA</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={loyaltyBalance}
                        step={2}
                        value={loyaltyToUse}
                        onChange={(e) => setLoyaltyToUse(Number(e.target.value))}
                        className="w-full accent-amber-500"
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="bg-slate-950 rounded-2xl p-4 flex items-start gap-3 border border-slate-800">
                <ShieldCheck className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                <p className="text-slate-400 text-xs leading-relaxed">
                  Un <strong className="text-white">code de retrait QR sécurisé</strong> sera généré dès la validation de votre commande.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal de Confirmation Paiement Mobile Money & Polling CinetPay */}
        <MobilePaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
          orderId={pollingOrderId || pendingOrder?.id}
          provider={paymentMethod}
          paymentUrl={activePaymentUrl}
          amount={total}
          phoneNumber={phone}
        />
      </div>
    </div>
  );
}
