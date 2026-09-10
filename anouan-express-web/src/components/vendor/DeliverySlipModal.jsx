// src/components/vendor/DeliverySlipModal.jsx
// Modal de Bordereau de Livraison A4 Imprimable avec QR Code d'Expédition pour Vendeurs Bouaké

import React from 'react';
import { X, Printer, QrCode, Store, MapPin, Calendar, CheckCircle2, ShieldCheck, Package } from 'lucide-react';

const formatPrice = (p) => new Intl.NumberFormat('fr-CI').format(Number(p || 0)) + ' FCFA';

export default function DeliverySlipModal({ isOpen, onClose, order, vendorName, storeLocation }) {
  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const orderId = order.id || order.orderId || '847291';
  const createdDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : new Date().toLocaleDateString('fr-FR');
  const items = order.items || [
    { title: order.product_name || order.title || 'Article Anouan Express', quantity: order.quantity || 1, unit_price: order.total_amount || 15000 }
  ];

  const totalAmount = order.total_amount || items.reduce((acc, i) => acc + (i.unit_price || i.price || 0) * (i.quantity || 1), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white text-slate-900 rounded-3xl shadow-2xl overflow-hidden print:m-0 print:shadow-none print:w-full print:max-w-none print:rounded-none">
        
        {/* Header Action Bar (Hidden when printing) */}
        <div className="flex items-center justify-between p-4 bg-slate-900 text-white print:hidden">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-orange-500" />
            <span className="font-bold text-sm">Bordereau de Livraison — Commande #{orderId}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-md"
            >
              <Printer className="w-4 h-4" />
              Imprimer le Bordereau
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-8 space-y-6 print:p-6" id="printable-delivery-slip">
          {/* Header Branding */}
          <div className="flex items-start justify-between border-b border-slate-200 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-orange-500 tracking-tight">ANOUAN</span>
                <span className="text-2xl font-black text-slate-900 tracking-tight">EXPRESS</span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Marché Digital & Points Relais de Proximité — Côte d&apos;Ivoire
              </p>
              <div className="inline-flex items-center gap-1.5 mt-2 bg-orange-50 border border-orange-200 px-3 py-1 rounded-full text-orange-700 text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                Bordereau Officiel de Dépôt Magasin Central
              </div>
            </div>

            {/* QR Code & Order Ref */}
            <div className="text-right flex flex-col items-end">
              <div className="w-24 h-24 p-2 bg-slate-50 border-2 border-slate-900 rounded-xl flex items-center justify-center mb-2">
                {/* SVG Simulated QR Code */}
                <svg className="w-full h-full text-slate-900" viewBox="0 0 100 100" fill="currentColor">
                  <path d="M0,0 h35 v35 h-35 z M10,10 v15 h15 v-15 z M65,0 h35 v35 h-35 z M75,10 v15 h15 v-15 z M0,65 h35 v35 h-35 z M10,75 v15 h15 v-15 z M45,10 h10 v10 h-10 z M45,45 h10 v10 h-10 z M65,45 h10 v10 h-10 z M85,45 h10 v10 h-10 z M45,65 h10 v20 h-10 z M65,65 h20 v10 h-20 z M75,85 h20 v10 h-20 z" />
                </svg>
              </div>
              <span className="text-xs font-mono font-bold text-slate-700">REF: ANX-{orderId}</span>
              <span className="text-[10px] text-slate-400 font-mono">CODE: {order.pickupCode || '8472'}</span>
            </div>
          </div>

          {/* Expedition & Destination Details */}
          <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
                Expéditeur (Vendeur)
              </span>
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <Store className="w-4 h-4 text-orange-500" />
                {vendorName || order.vendor_name || 'Maison du Pagne Kita Bouaké'}
              </div>
              <p className="text-xs text-slate-600 mt-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {storeLocation || 'Quartier Commerce, Bouaké'}
              </p>
            </div>

            <div>
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
                Destination (Point Relais)
              </span>
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <MapPin className="w-4 h-4 text-emerald-600" />
                Magasin Central Anouan Express
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Rue des Banques, près de la pharmacie principale, Bouaké
              </p>
            </div>
          </div>

          {/* Order Metadata */}
          <div className="flex items-center justify-between text-xs text-slate-600 border-b border-slate-200 pb-4">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>Date de commande : <strong>{createdDate}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Statut Paiement : <strong className="text-emerald-700 uppercase">{order.payment_status || 'Payé (Mobile Money)'}</strong></span>
            </div>
          </div>

          {/* Items Table */}
          <div>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-900 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-2">Article / Description</th>
                  <th className="py-2 text-center">Quantité</th>
                  <th className="py-2 text-right">Prix Unitaire</th>
                  <th className="py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item, idx) => (
                  <tr key={idx} className="text-slate-800 font-medium">
                    <td className="py-3 font-semibold">{item.title || item.name || 'Produit'}</td>
                    <td className="py-3 text-center font-bold">{item.quantity || 1}</td>
                    <td className="py-3 text-right">{formatPrice(item.unit_price || item.price || 0)}</td>
                    <td className="py-3 text-right font-bold text-slate-900">
                      {formatPrice((item.unit_price || item.price || 0) * (item.quantity || 1))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Total & Signatures */}
          <div className="border-t-2 border-slate-900 pt-4 flex items-end justify-between">
            <div className="space-y-1 text-xs text-slate-500 max-w-xs">
              <p className="font-bold text-slate-800">Directives d&apos;Expédition :</p>
              <p>1. Déposez ce bordereau signé avec le colis au magasin central.</p>
              <p>2. L&apos;agent scannera le QR Code ci-dessus pour accuser réception.</p>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-500 block">Total à Réception :</span>
              <span className="text-2xl font-black text-slate-900">{formatPrice(totalAmount)}</span>
            </div>
          </div>

          {/* Signature Grid */}
          <div className="grid grid-cols-2 gap-8 pt-8 border-t border-dashed border-slate-300 text-xs text-slate-500">
            <div className="h-20 border border-slate-200 rounded-xl p-3 flex flex-col justify-between">
              <span className="font-bold text-slate-700">Signature Vendeur :</span>
              <span className="text-[10px] text-slate-400">Date : ____/____/2026</span>
            </div>
            <div className="h-20 border border-slate-200 rounded-xl p-3 flex flex-col justify-between">
              <span className="font-bold text-slate-700">Tampon Réception Agent Bouaké :</span>
              <span className="text-[10px] text-slate-400">Heure de dépôt : ____:____</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
