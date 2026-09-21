// src/components/vendor/DeliverySlipModal.jsx
// Bordereau d'expédition et étiquette de colis imprimable pour le Magasin Central de Bouaké

import React, { useRef } from 'react';
import { Printer, X, ShieldCheck, MapPin, Phone, Package, Calendar } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function DeliverySlipModal({ isOpen = true, order, onClose, vendorName, storeLocation }) {
  const printRef = useRef(null);

  if (isOpen === false || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const formatPrice = (p) => new Intl.NumberFormat('fr-CI').format(Number(p || 0)) + ' FCFA';
  const qrData = order.pickup_code || `ANOUAN-CMD-${order.id}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      {/* Boutons d'action hors impression */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header non imprimable */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950 print:hidden">
          <div className="flex items-center gap-2 text-white font-black text-sm">
            <Package className="text-orange-500" size={20} />
            <span>Bordereau de Dépôt Magasin Central</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-lg flex items-center gap-1.5 hover:scale-105 transition-transform"
            >
              <Printer size={16} /> Imprimer l'Étiquette
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Zone imprimable (Fiche Blanche Haute Définition) */}
        <div className="p-6 overflow-y-auto bg-slate-950 print:bg-white print:p-0">
          <div
            ref={printRef}
            className="bg-white text-slate-900 rounded-2xl p-6 border border-slate-200 shadow-sm print:shadow-none print:border-0 print:m-0"
          >
            {/* Entête bordereau */}
            <div className="flex items-start justify-between border-b-2 border-orange-500 pb-4 mb-4">
              <div>
                <h1 className="text-2xl font-black text-slate-950 uppercase tracking-wider flex items-center gap-2">
                  <span className="text-orange-600">ANOUAN</span> EXPRESS
                </h1>
                <p className="text-xs font-bold text-slate-600 mt-0.5">
                  Hub Logistique & Magasin Central — Bouaké, Côte d'Ivoire
                </p>
                <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                  <Calendar size={12} /> Date : {new Date(order.created_at || Date.now()).toLocaleDateString('fr-CI')}
                </div>
              </div>

              {/* QR Code pour scan rapide par l'agent au guichet */}
              <div className="flex flex-col items-center">
                <div className="p-1.5 bg-white border border-slate-300 rounded-xl shadow-xs">
                  <QRCodeSVG value={qrData} size={74} level="M" />
                </div>
                <span className="text-[10px] font-mono font-bold text-slate-700 mt-1">
                  {order.pickup_code || `#${String(order.id).slice(0, 8)}`}
                </span>
              </div>
            </div>

            {/* Informations Expédition & Destination */}
            <div className="grid grid-cols-2 gap-4 mb-6 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="font-bold text-slate-400 uppercase text-[10px] mb-1">Dépôt par le Vendeur :</p>
                <p className="font-black text-slate-900 text-sm">{order.vendor_name || 'Boutique Partenaire'}</p>
                <p className="text-slate-600 mt-0.5 flex items-center gap-1">
                  <Phone size={12} /> Contact : {order.vendor_phone || 'Non renseigné'}
                </p>
              </div>

              <div className="p-3 bg-orange-50/60 rounded-xl border border-orange-200">
                <p className="font-bold text-orange-600 uppercase text-[10px] mb-1">Point de Retrait Magasin :</p>
                <p className="font-black text-slate-900 text-sm">
                  {order.store_name || 'Magasin Central Anouan Express'}
                </p>
                <p className="text-slate-600 mt-0.5 flex items-center gap-1">
                  <MapPin size={12} className="text-orange-500" /> Bouaké, Quartier Commerce / Marché
                </p>
              </div>
            </div>

            {/* Destinataire Client */}
            <div className="mb-6 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <p className="font-bold text-slate-400 uppercase text-[10px] mb-1">Client Destinataire :</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-black text-slate-900 text-sm">{order.client_name || 'Client Anouan'}</p>
                  <p className="text-slate-600 flex items-center gap-1 mt-0.5">
                    <Phone size={12} /> {order.client_phone || 'Téléphone masqué pour sécurité'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-black rounded-lg text-[11px]">
                    Commande #{String(order.id).slice(0, 8)}
                  </span>
                </div>
              </div>
            </div>

            {/* Tableau des articles dans le colis */}
            <div className="mb-6">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b-2 border-slate-200 text-slate-500 uppercase text-[10px]">
                    <th className="pb-2">Article</th>
                    <th className="pb-2 text-center">Quantité</th>
                    <th className="pb-2 text-right">Montant</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(order.vendor_items || order.items || [order]).map((item, idx) => (
                    <tr key={idx} className="py-2">
                      <td className="py-2.5 font-bold text-slate-900">
                        {item.title || item.product_name || 'Article'}
                      </td>
                      <td className="py-2.5 text-center font-bold text-slate-700">
                        x{item.quantity || 1}
                      </td>
                      <td className="py-2.5 text-right font-black text-slate-900">
                        {formatPrice(item.unit_price || item.price || order.total_amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pied de page et Consignes de dépôt */}
            <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
              <ShieldCheck size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Instructions pour le vendeur :</p>
                <p className="text-[10px] mt-0.5 text-amber-800 leading-relaxed">
                  Collez ou insérez ce bordereau avec le colis avant de le déposer au guichet du Magasin Central. 
                  L'agent scannera le QR Code pour valider la prise en charge et notifier le client.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
