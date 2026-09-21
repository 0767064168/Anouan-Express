// src/pages/client/StoresPage.jsx
// Page publique des points relais & Magasins Anouan Express à Bouaké

import React from 'react';
import { MapPin, ShieldCheck, Clock, Navigation, CheckCircle2, Store } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import BouakeStoresMap from '../../components/client/BouakeStoresMap';

export default function StoresPage() {
  return (
    <div className="min-h-screen bg-slate-950 py-8 text-slate-100 font-sans selection:bg-orange-500 selection:text-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <PageHeader
          eyebrow="Réseau Bouaké & Gbêkê"
          eyebrowIcon={MapPin}
          title="Points de Retrait & Magasins à Bouaké"
          subtitle="Choisissez le point de retrait le plus proche de chez vous pour récupérer vos commandes sous 15 secondes sans frais de livraison."
        />

        {/* 3 Avantages du retrait en magasin central */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6 rounded-3xl border border-slate-800 flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 shrink-0">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h3 className="font-black text-white text-sm">Contrôle Qualité Direct</h3>
              <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                Vérifiez votre colis sur place au guichet avant de donner votre code de retrait.
              </p>
            </div>
          </div>

          <div className="glass-card p-6 rounded-3xl border border-slate-800 flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 shrink-0">
              <Clock size={24} />
            </div>
            <div>
              <h3 className="font-black text-white text-sm">Retrait Express 15s</h3>
              <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                Présentez votre QR Code ou votre code SMS à 8 caractères pour une remise instantanée.
              </p>
            </div>
          </div>

          <div className="glass-card p-6 rounded-3xl border border-slate-800 flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 shrink-0">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <h3 className="font-black text-white text-sm">Frais de Retrait 0 FCFA</h3>
              <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                Le retrait physique au Magasin Central d'Anouan Express est 100% gratuit.
              </p>
            </div>
          </div>
        </div>

        {/* Carte interactive et sélecteur de points */}
        <BouakeStoresMap />
      </div>
    </div>
  );
}
