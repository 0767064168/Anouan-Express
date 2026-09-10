// src/components/client/InvoiceModal.jsx
// Modal de Facture Imprimable & PDF — Dark Premium avec CSS @media print

import React, { useRef } from 'react';
import { X, Printer, Download, Sparkles, MapPin, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const formatPrice = (p) => new Intl.NumberFormat('fr-CI').format(Number(p || 0)) + ' FCFA';

export default function InvoiceModal({ order, pickupCode, onClose }) {
  const printRef = useRef(null);

  const handlePrint = () => {
    window.print();
  };

  const invoiceNumber = `FAC-2026-${order?.id || '847291'}`;
  const dateStr = new Date(order?.created_at || Date.now()).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const demoItems = [
    { name: 'Pagne Baoulé Tissé Main Traditionnel', qty: 1, price: 25000 },
    { name: 'Mixeur Plongeant 800W Premium', qty: 1, price: 20000 },
  ];

  const subtotal = 45000;
  const platformFee = 500;
  const total = order?.total_amount || 45500;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      
      {/* Styles d'impression dédiés */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-invoice, #printable-invoice * {
            visibility: visible;
          }
          #printable-invoice {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
            padding: 20px;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="glass-panel w-full max-w-2xl rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6 shadow-2xl animate-in fade-in zoom-in-95 relative my-8">
        
        {/* Actions d'en-tête (non imprimables) */}
        <div className="flex justify-between items-center no-print border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="text-orange-400" size={18} />
            <h3 className="text-sm font-black text-white uppercase tracking-wider">Facture d'Achat Officielle</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs transition-all shadow-lg"
            >
              <Printer size={14} /> Imprimer / Sauvegarder PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-slate-900 rounded-xl transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Zone imprimable */}
        <div id="printable-invoice" ref={printRef} className="space-y-6 text-xs text-slate-200">
          
          {/* Header Marque */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl font-black tracking-tight text-white">ANOUAN</span>
                <span className="text-2xl font-black text-orange-400">EXPRESS</span>
              </div>
              <p className="text-[11px] text-slate-400">Marketplace N°1 & Retrait Sécurisé • Bouaké, Côte d'Ivoire</p>
              <p className="text-[10px] text-slate-500">Quartier Commerce, Rue des Banques • Tel: +225 07 00 00 00 00</p>
            </div>
            <div className="text-left sm:text-right space-y-1">
              <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider inline-block">
                PAYÉ • REÇU OFFICIEL
              </span>
              <p className="font-mono text-sm font-black text-orange-400">{invoiceNumber}</p>
              <p className="text-[10px] text-slate-400">{dateStr}</p>
            </div>
          </div>

          {/* Grille Acheteur & Lieu de Retrait */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">Client Acheteur</p>
              <p className="font-bold text-white text-sm">Kouadio Jean-Marc</p>
              <p className="text-slate-400">+225 07 45 12 88</p>
              <p className="text-slate-400">Bouaké, Côte d'Ivoire</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">Point de Retrait Sélectionné</p>
              <p className="font-bold text-white text-sm">{order?.store_name || 'Magasin Central Bouaké'}</p>
              <p className="text-slate-400">{order?.store_address || 'Quartier Commerce, Rue des Banques'}</p>
              <p className="text-emerald-400 font-semibold">Horaires : 08h00 - 18h30</p>
            </div>
          </div>

          {/* Tableau des Articles */}
          <div className="border border-slate-800 rounded-2xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-900 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400">
                <tr>
                  <th className="p-3">Désignation</th>
                  <th className="p-3 text-center">Qté</th>
                  <th className="p-3 text-right">Prix Unitaire</th>
                  <th className="p-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {demoItems.map((item, i) => (
                  <tr key={i} className="hover:bg-slate-900/30">
                    <td className="p-3 font-bold text-white">{item.name}</td>
                    <td className="p-3 text-center font-bold text-slate-300">{item.qty}</td>
                    <td className="p-3 text-right text-slate-400">{formatPrice(item.price)}</td>
                    <td className="p-3 text-right font-black text-orange-400">{formatPrice(item.price * item.qty)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Total & Mode de paiement */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pt-2">
            <div className="flex items-center gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800">
              <div className="bg-white p-2 rounded-xl shrink-0">
                <QRCodeSVG value={pickupCode?.code || 'ANOUAN-847291'} size={64} />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Code QR de Retrait</p>
                <p className="font-mono text-base font-black text-orange-400">{pickupCode?.code || '7K4D9XQP'}</p>
                <p className="text-[9px] text-slate-500">Valable 15 jours au guichet</p>
              </div>
            </div>

            <div className="w-full sm:w-60 space-y-2 text-slate-300">
              <div className="flex justify-between">
                <span>Sous-total :</span>
                <span className="font-bold text-white">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Frais plateforme :</span>
                <span className="font-bold text-white">{formatPrice(platformFee)}</span>
              </div>
              <div className="flex justify-between">
                <span>Frais de retrait :</span>
                <span className="font-bold text-orange-400">Gratuit</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-800 text-sm font-black">
                <span className="text-white">Total Réglé :</span>
                <span className="text-orange-400">{formatPrice(total)}</span>
              </div>
            </div>
          </div>

          {/* Pied de facture */}
          <div className="border-t border-slate-800 pt-4 text-center text-[10px] text-slate-500 space-y-1">
            <p>Anouan Express Marketplace S.A. • RCCM: CI-BKE-2026-B-1402 • NIVA: 2601928X</p>
            <p>Merci pour votre confiance ! Pour toute réclamation, visitez anouanexpress.ci/disputes</p>
          </div>
        </div>
      </div>
    </div>
  );
}
