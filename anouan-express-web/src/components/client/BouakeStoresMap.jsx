// src/components/client/BouakeStoresMap.jsx
// Carte interactive et guide des Points Relais & Magasin Central Anouan Express à Bouaké

import React, { useState, useEffect } from 'react';
import { MapPin, Clock, Phone, Navigation, ShieldCheck, CheckCircle2, Store, Users, ExternalLink, ChevronRight, RefreshCw } from 'lucide-react';
import { storesAPI } from '../../services/api';

export const BOUAKE_STORES = [
  {
    id: 'store-central',
    dbId: 1,
    name: 'Magasin Central Bouaké (Hub Principal)',
    district: 'Quartier Commerce',
    address: 'Rue des Banques, près de la pharmacie principale et face SGBCI',
    hours: 'Lun - Sam : 08h00 - 18h30 (Non-stop)',
    phone: '+225 07 45 12 88',
    status: 'open',
    affluence: 'Fluide',
    affluenceColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    type: 'Hub Principal & Showroom',
    lat: 7.6895,
    lng: -5.0305,
    features: ['Retrait Express 15s', 'Paiement Espèces au Guichet', 'Contrôle Qualité Déballage', 'Service Après-Vente'],
  },
  {
    id: 'store-airfrance',
    dbId: 2,
    name: 'Guichet Relais Air France 1 & 2',
    district: 'Air France / Marché',
    address: 'Marché Air France 1, carrefour jeunesse, à côté de l’espace Orange',
    hours: 'Lun - Sam : 08h30 - 18h00',
    phone: '+225 05 88 14 20',
    status: 'open',
    affluence: 'Moyenne',
    affluenceColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    type: 'Guichet Relais Express',
    lat: 7.7012,
    lng: -5.0210,
    features: ['Retrait par Code SMS/QR', 'Paiement Mobile Money & Cash', 'Accessible Moto & Voiture'],
  },
  {
    id: 'store-koko',
    dbId: 3,
    name: 'Guichet Relais Koko (Mairie)',
    district: 'Koko / Centre-ville',
    address: 'Boulevard de la Mairie, face au jardin public, près de la préfecture',
    hours: 'Lun - Sam : 08h00 - 17h30',
    phone: '+225 01 02 44 99',
    status: 'open',
    affluence: 'Fluide',
    affluenceColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    type: 'Guichet Relais Express',
    lat: 7.6820,
    lng: -5.0425,
    features: ['Retrait ultra-rapide', 'Proche administrations', 'Sécurité garantie'],
  },
  {
    id: 'store-kennedy',
    dbId: 4,
    name: 'Guichet Relais Kennedy / Belleville',
    district: 'Kennedy & Belleville',
    address: 'Boulevard Reine Pokou, zone commerciale en face du grand carrefour',
    hours: 'Lun - Sam : 08h30 - 18h00',
    phone: '+225 07 11 22 33',
    status: 'open',
    affluence: 'Fluide',
    affluenceColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    type: 'Guichet Relais Express',
    lat: 7.7125,
    lng: -5.0150,
    features: ['Zone résidentielle & étudiante', 'Retrait simplifié par QR Code', 'Agent dédié'],
  },
];

export default function BouakeStoresMap({ selectedStoreId, onSelectStore, compact = false }) {
  const [storesList, setStoresList] = useState(BOUAKE_STORES);
  const [activeStore, setActiveStore] = useState(BOUAKE_STORES[0]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchApiStores = async () => {
      try {
        const res = await storesAPI.getAll({ activeOnly: 'true' });
        const list = res.data?.data || res.data || [];
        if (Array.isArray(list) && list.length > 0) {
          const formatted = list.map((st, idx) => ({
            id: st.id,
            dbId: st.id,
            name: st.name,
            district: st.city || 'Bouaké',
            address: st.address,
            hours: 'Lun - Sam : 08h00 - 18h30',
            phone: st.phone || '+225 07 00 00 00',
            status: 'open',
            affluence: 'Fluide',
            affluenceColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
            type: idx === 0 ? 'Hub Principal' : 'Guichet Relais',
            lat: st.gps_lat ? Number(st.gps_lat) : (7.6895 + (idx * 0.005)),
            lng: st.gps_lng ? Number(st.gps_lng) : (-5.0305 + (idx * 0.004)),
            features: ['Retrait Express 15s', 'Paiement au Guichet', 'Code SMS & QR Code'],
          }));
          setStoresList(formatted);
          const found = formatted.find(s => s.id === selectedStoreId || s.dbId === selectedStoreId) || formatted[0];
          setActiveStore(found);
          if (onSelectStore) onSelectStore(found);
        }
      } catch {
        // En cas d'erreur de réseau, conserve BOUAKE_STORES
      }
    };
    fetchApiStores();
  }, []);

  const handleSelect = (store) => {
    setActiveStore(store);
    if (onSelectStore) {
      onSelectStore(store);
    }
  };

  const getGoogleMapsUrl = (store) =>
    `https://www.google.com/maps/search/?api=1&query=${store.lat},${store.lng}`;

  return (
    <div className="space-y-6">
      {/* Sélecteur de points relais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {storesList.map((store) => {
          const isSelected = activeStore?.id === store.id;
          return (
            <div
              key={store.id}
              onClick={() => handleSelect(store)}
              className={`cursor-pointer rounded-3xl p-5 border transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${
                isSelected
                  ? 'bg-gradient-to-br from-orange-500/15 via-slate-900 to-amber-500/10 border-orange-500 shadow-xl shadow-orange-500/10 border-kita-glow'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              {isSelected && (
                <div className="absolute top-3 right-3 text-orange-400">
                  <CheckCircle2 size={18} />
                </div>
              )}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
                    <Store size={16} />
                  </span>
                  <div>
                    <span className="text-[10px] font-black uppercase text-orange-400 tracking-wider">
                      {store.district}
                    </span>
                    <h4 className="text-xs font-black text-white line-clamp-1">{store.name}</h4>
                  </div>
                </div>
                <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">{store.address}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                <span className="text-slate-400 flex items-center gap-1">
                  <Clock size={12} className="text-orange-400" /> Ouvert
                </span>
                <span className={`px-2 py-0.5 rounded-full font-bold border ${store.affluenceColor}`}>
                  {store.affluence}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Vue détaillée et carte visuelle du relais actif */}
      {activeStore && (
        <div className="glass-panel rounded-3xl p-6 md:p-8 border border-slate-800 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-orange-500/20 shrink-0">
                <MapPin size={28} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-orange-500/20 text-orange-400 border border-orange-500/30">
                    {activeStore.type}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${activeStore.affluenceColor}`}>
                    Affluence : {activeStore.affluence}
                  </span>
                </div>
                <h3 className="text-lg md:text-xl font-black text-white mt-1">{activeStore.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{activeStore.address} · Bouaké, Côte d'Ivoire</p>
              </div>
            </div>

            <a
              href={getGoogleMapsUrl(activeStore)}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg shadow-orange-500/20 shrink-0"
            >
              <Navigation size={15} />
              <span>Itinéraire GPS Google Maps</span>
              <ExternalLink size={13} />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1.5">
                  <Clock size={12} className="text-orange-400" /> Horaires d'accueil
                </span>
                <p className="text-xs font-bold text-white">{activeStore.hours}</p>
                <p className="text-[10px] text-emerald-400 font-semibold">Service continu du lundi au samedi</p>
              </div>

              <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1.5">
                  <Phone size={12} className="text-orange-400" /> Contact direct relais
                </span>
                <a href={`tel:${activeStore.phone}`} className="text-xs font-bold text-orange-400 hover:underline block">
                  {activeStore.phone}
                </a>
                <p className="text-[10px] text-slate-400">Assistance téléphonique retrait</p>
              </div>
            </div>

            <div className="md:col-span-2 bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-4">
              <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck size={16} className="text-orange-400" /> Services & Garanties disponibles à ce point
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeStore.features.map((feat, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
                    <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>

              {/* Simulation visuelle de localisation cartographique */}
              <div className="relative h-32 rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 flex items-center justify-center text-center p-4">
                <div className="absolute inset-0 bg-[radial-gradient(#f97316_1px,transparent_1px)] [background-size:16px_16px] opacity-15" />
                <div className="relative z-10 space-y-1">
                  <p className="text-xs font-black text-white flex items-center justify-center gap-1.5">
                    <MapPin size={16} className="text-orange-400 animate-bounce" /> Coordonnées GPS : {activeStore.lat}, {activeStore.lng}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Point géolocalisé au cœur de Bouaké pour un guidage piéton, moto ou voiture sans erreur.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
