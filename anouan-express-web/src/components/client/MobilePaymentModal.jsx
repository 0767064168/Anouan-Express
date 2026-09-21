// src/components/client/MobilePaymentModal.jsx
// Modal interactif de paiement Mobile Money (Wave, Orange Money, MTN MoMo) avec polling CinetPay en temps réel

import React, { useState, useEffect, useRef } from 'react';
import {
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  X,
  Loader2,
  ShieldCheck,
  RefreshCw,
  QrCode
} from 'lucide-react';
import { paymentsAPI } from '../../services/api';
import PaymentLogo from '../ui/PaymentLogos';

const formatPrice = (p) => new Intl.NumberFormat('fr-CI').format(Number(p || 0)) + ' FCFA';

const PROVIDER_NAMES = {
  wave: 'Wave Digital',
  orange: 'Orange Money',
  orange_money: 'Orange Money',
  mtn: 'MTN Mobile Money',
  cinetpay: 'CinetPay Sécurisé',
  cash: 'Espèces au Relais',
};

export default function MobilePaymentModal({
  isOpen,
  onClose,
  onSuccess,
  orderId,
  provider = 'orange',
  paymentUrl,
  amount,
  phoneNumber
}) {
  const [secondsLeft, setSecondsLeft] = useState(180); // 3 minutes
  const [status, setStatus] = useState('polling'); // 'polling' | 'completed' | 'failed' | 'timeout'
  const [pollCount, setPollCount] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const pollTimerRef = useRef(null);
  const countdownTimerRef = useRef(null);

  useEffect(() => {
    if (!isOpen || !orderId) return;

    setStatus('polling');
    setSecondsLeft(180);
    setPollCount(0);
    setErrorMsg('');

    // Décompte visuel de 3 minutes
    countdownTimerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(countdownTimerRef.current);
          clearInterval(pollTimerRef.current);
          setStatus('timeout');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Polling toutes les 4 secondes
    const checkPayment = async () => {
      try {
        const res = await paymentsAPI.poll(orderId);
        const data = res.data?.data || res.data;
        setPollCount((c) => c + 1);

        if (data?.status === 'completed' || data?.status === 'paid' || data?.status === 'ACCEPTED') {
          clearInterval(pollTimerRef.current);
          clearInterval(countdownTimerRef.current);
          setStatus('completed');
          setTimeout(() => {
            if (onSuccess) onSuccess(data);
          }, 2000);
        } else if (data?.status === 'failed' || data?.status === 'cancelled' || data?.status === 'REFUSED') {
          clearInterval(pollTimerRef.current);
          clearInterval(countdownTimerRef.current);
          setStatus('failed');
          setErrorMsg(data?.message || 'Le paiement a été refusé ou annulé.');
        }
      } catch (err) {
        console.warn('[POLL] Erreur vérification statut:', err.message);
      }
    };

    checkPayment();
    pollTimerRef.current = setInterval(checkPayment, 4000);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [isOpen, orderId]);

  if (!isOpen) return null;

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeFormatted = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  const progressPercent = Math.round(((180 - secondsLeft) / 180) * 100);
  const providerName = PROVIDER_NAMES[provider] || provider;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full relative shadow-2xl space-y-6 text-center">
        
        {/* Bouton Fermer */}
        {status !== 'completed' && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        )}

        {/* ── ÉTAT 1 : EN COURS DE CONFIRMATION (POLLING) ── */}
        {status === 'polling' && (
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-3xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 relative">
                <Smartphone size={32} className="animate-pulse" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full animate-ping" />
              </div>
            </div>

            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-bold text-slate-300 mb-2">
                <PaymentLogo provider={provider} size={18} />
                {providerName}
              </span>
              <h3 className="text-xl font-black text-white">Validation en attente</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Veuillez confirmer la transaction sur votre téléphone{phoneNumber ? ` (${phoneNumber})` : ''}.
              </p>
            </div>

            {/* Montant */}
            <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-bold">Montant à régler</span>
              <span className="text-base font-black text-orange-400">{formatPrice(amount)}</span>
            </div>

            {/* Lien direct Wave / CinetPay si disponible */}
            {paymentUrl && (
              <a
                href={paymentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-black rounded-2xl flex items-center justify-center gap-2 text-xs uppercase tracking-wider transition-all shadow-lg shadow-orange-500/20"
              >
                Ouvrir l'application {providerName} <ExternalLink size={14} />
              </a>
            )}

            {/* Barre de progression du timeout */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                <span className="flex items-center gap-1.5">
                  <Clock size={12} className="text-orange-400" /> Temps restant
                </span>
                <span className="font-mono font-bold text-white">{timeFormatted}</span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-1000 rounded-full"
                  style={{ width: `${100 - progressPercent}%` }}
                />
              </div>
            </div>

            {/* Spinner animé */}
            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 font-medium">
              <Loader2 size={13} className="animate-spin text-orange-500" />
              <span>Vérification automatique en arrière-plan ({pollCount})...</span>
            </div>
          </div>
        )}

        {/* ── ÉTAT 2 : SUCCÈS CONFIRMÉ ── */}
        {status === 'completed' && (
          <div className="space-y-4 py-4 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 size={36} className="animate-bounce" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">Paiement Confirmé !</h3>
              <p className="text-xs text-slate-400 mt-1">Votre paiement a bien été enregistré avec succès.</p>
            </div>
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-xs font-bold text-emerald-400">
              {formatPrice(amount)} reçu via {providerName}
            </div>
            <p className="text-[11px] text-slate-500">Redirection vers votre suivi de commande...</p>
          </div>
        )}

        {/* ── ÉTAT 3 : ÉCHEC / REFUS ── */}
        {status === 'failed' && (
          <div className="space-y-4 py-2 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center mx-auto">
              <AlertCircle size={32} />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Paiement Non Validé</h3>
              <p className="text-xs text-slate-400 mt-1">{errorMsg || 'La transaction n\'a pas pu aboutir.'}</p>
            </div>
            <button
              onClick={onClose}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-2xl text-xs transition-colors"
            >
              Réessayer avec un autre mode
            </button>
          </div>
        )}

        {/* ── ÉTAT 4 : EXPIRATION (TIMEOUT) ── */}
        {status === 'timeout' && (
          <div className="space-y-4 py-2 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto">
              <Clock size={32} />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Délai Expiré</h3>
              <p className="text-xs text-slate-400 mt-1">Le délai de confirmation de 3 minutes a été dépassé.</p>
            </div>
            <button
              onClick={onClose}
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-slate-950 font-bold rounded-2xl text-xs transition-colors"
            >
              Reprendre le paiement
            </button>
          </div>
        )}

        {/* Footer sécurité */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-center gap-1.5 text-[10px] text-slate-500 font-medium">
          <ShieldCheck size={12} className="text-emerald-400" />
          <span>Sécurisé par CinetPay CI & cryptage bancaire SSL</span>
        </div>

      </div>
    </div>
  );
}
