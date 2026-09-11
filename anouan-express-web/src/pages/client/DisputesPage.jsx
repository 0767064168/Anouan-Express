// src/pages/client/DisputesPage.jsx
// Centre de réclamations & litiges client — Dark Premium Orange

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle, ShieldAlert, CheckCircle2, Clock, Plus, Search,
  ArrowLeft, FileText, Upload, MessageSquare, ChevronRight, AlertCircle
} from 'lucide-react';
import { useToast } from '../../components/ui/Toast';
import PageHeader from '../../components/ui/PageHeader';

const DEMO_DISPUTES = [
  {
    id: 'DISP-9021',
    orderId: 'CMD-847291',
    vendorName: 'Maison du Pagne Bouaké',
    subject: 'Produit légèrement taché au déballage',
    type: 'quality',
    status: 'pending',
    createdAt: '30 août 2026',
    description: 'Le pagne Baoulé présente une petite tache de teinture sur le bord inférieur. Je demande un remplacement ou un avoir.',
    amountRequested: 5000,
    adminNotes: 'En cours d\'analyse par l\'équipe Anouan Express Bouaké.',
  },
  {
    id: 'DISP-8812',
    orderId: 'CMD-841002',
    vendorName: 'Tech Store CI',
    subject: 'Article manquant dans le colis',
    type: 'missing',
    status: 'resolved',
    createdAt: '15 août 2026',
    description: 'Les écouteurs sans fil manquaient lors du retrait au magasin central.',
    amountRequested: 10000,
    adminNotes: 'Remboursement de 10 000 FCFA effectué sur le compte Mobile Money du client.',
    resolvedAt: '17 août 2026',
  },
];

const STATUS_BADGE = {
  pending:  { label: 'En traitement', classes: 'bg-amber-500/10 border border-amber-500/30 text-amber-400', icon: Clock },
  resolved: { label: 'Résolu',        classes: 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400', icon: CheckCircle2 },
  rejected: { label: 'Rejeté',        classes: 'bg-red-500/10 border border-red-500/30 text-red-400', icon: AlertCircle },
};

const DISPUTE_TYPES = [
  { id: 'quality', label: 'Produit défectueux / abîmé' },
  { id: 'missing', label: 'Article manquant dans le colis' },
  { id: 'wrong_item', label: 'Mauvais article reçu' },
  { id: 'pickup_issue', label: 'Problème au Magasin Central Bouaké' },
  { id: 'other', label: 'Autre motif' },
];

export default function DisputesPage() {
  const toast = useToast();
  const [disputes, setDisputes] = useState(DEMO_DISPUTES);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  // Form state
  const [formOrderId, setFormOrderId] = useState('');
  const [formType, setFormType] = useState('quality');
  const [formSubject, setFormSubject] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const filteredDisputes = disputes.filter((d) => {
    if (activeTab === 'pending') return d.status === 'pending';
    if (activeTab === 'resolved') return d.status === 'resolved';
    return true;
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formOrderId.trim() || !formSubject.trim() || !formDesc.trim()) {
      toast.error('Veuillez remplir tous les champs du formulaire.');
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      const newDispute = {
        id: `DISP-${Math.floor(1000 + Math.random() * 9000)}`,
        orderId: formOrderId.toUpperCase(),
        vendorName: 'Vendeur Partenaire',
        subject: formSubject,
        type: formType,
        status: 'pending',
        createdAt: 'Aujourd\'hui',
        description: formDesc,
        adminNotes: 'Réclamation prise en charge. Un agent d\'Anouan Express vous recontactera sous 24h.',
      };

      setDisputes([newDispute, ...disputes]);
      setSubmitting(false);
      setShowModal(false);
      setFormOrderId('');
      setFormSubject('');
      setFormDesc('');
      toast.success('Réclamation soumise avec succès ! Numéro : ' + newDispute.id);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-orange-500 selection:text-slate-950 py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        <PageHeader
          title={(
            <span className="flex items-center gap-2">
              <Link to="/profile" className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors" title="Retour au profil">
                <ArrowLeft size={18} />
              </Link>
              <ShieldAlert size={24} className="text-orange-400" /> Réclamations & Service Client
            </span>
          )}
          subtitle="Signalez un problème sur une commande et suivez sa résolution"
          actions={(
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-black px-5 py-3 rounded-2xl transition-all shadow-lg shadow-orange-500/20 text-xs uppercase tracking-wider"
            >
              <Plus size={16} /> Nouvelle Réclamation
            </button>
          )}
        />

        {/* Guarantee Banner */}
        <div className="glass-panel rounded-3xl p-5 border border-orange-500/30 bg-orange-500/5 flex items-start gap-4">
          <div className="p-3 bg-orange-500/20 rounded-2xl text-orange-400 shrink-0">
            <ShieldAlert size={24} />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-black text-white">Garantie Acheteur Anouan Express Bouaké</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Toutes les commandes sont vérifiables lors du retrait au Magasin Central. En cas de non-conformité, 
              Anouan Express s'engage à vous remplacer l'article ou effectuer un remboursement sous 48h.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          {[
            { id: 'all', label: 'Toutes les réclamations' },
            { id: 'pending', label: 'En cours' },
            { id: 'resolved', label: 'Résolues' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`text-xs font-bold px-4 py-2 rounded-xl transition-all ${
                activeTab === tab.id
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Liste des Litiges */}
        {filteredDisputes.length === 0 ? (
          <div className="glass-panel rounded-3xl border border-slate-800 p-16 text-center space-y-3">
            <CheckCircle2 size={48} className="mx-auto text-emerald-500" />
            <h3 className="text-base font-bold text-white">Aucune réclamation enregistrée</h3>
            <p className="text-xs text-slate-400">Toutes vos commandes se déroulent sans encombre !</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredDisputes.map((dispute) => {
              const statusCfg = STATUS_BADGE[dispute.status] || STATUS_BADGE.pending;
              const StatusIcon = statusCfg.icon;

              return (
                <div
                  key={dispute.id}
                  className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4 hover:border-slate-700 transition-all"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-800/80 pb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-orange-400 font-mono">{dispute.id}</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-xs font-bold text-slate-300">Commande #{dispute.orderId}</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-xs text-slate-400">{dispute.vendorName}</span>
                    </div>

                    <span className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 ${statusCfg.classes}`}>
                      <StatusIcon size={14} /> {statusCfg.label}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-base font-bold text-white">{dispute.subject}</h3>
                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                      {dispute.description}
                    </p>
                  </div>

                  {/* Note de suivi admin */}
                  {dispute.adminNotes && (
                    <div className="p-4 bg-orange-500/5 border border-orange-500/20 rounded-2xl text-xs space-y-1">
                      <p className="font-bold text-orange-400 flex items-center gap-1.5">
                        <MessageSquare size={14} /> Suivi Service Client :
                      </p>
                      <p className="text-slate-300">{dispute.adminNotes}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>Ouvert le {dispute.createdAt}</span>
                    {dispute.resolvedAt && <span className="text-emerald-400 font-semibold">Résolu le {dispute.resolvedAt}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal de création de Réclamation */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <div className="glass-panel w-full max-w-lg rounded-3xl p-6 border border-slate-800 space-y-6 shadow-2xl animate-in fade-in zoom-in-95">
              
              <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <AlertTriangle className="text-orange-400" size={20} /> Déposer une Réclamation
                </h3>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white font-bold text-lg">✕</button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                
                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">Numéro de Commande *</label>
                  <input
                    type="text"
                    required
                    value={formOrderId}
                    onChange={(e) => setFormOrderId(e.target.value)}
                    placeholder="Ex: CMD-847291"
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-white placeholder-slate-500 focus:border-orange-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">Motif de la réclamation *</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-white focus:border-orange-500 outline-none cursor-pointer"
                  >
                    {DISPUTE_TYPES.map((t) => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">Sujet résumé *</label>
                  <input
                    type="text"
                    required
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                    placeholder="Ex: Pagne taché ou article non conforme"
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-white placeholder-slate-500 focus:border-orange-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">Description détaillée du problème *</label>
                  <textarea
                    required
                    rows={4}
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    placeholder="Expliquez ce qui ne va pas avec précision..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white placeholder-slate-500 focus:border-orange-500 outline-none resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="w-1/2 py-3 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-bold rounded-2xl transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-1/2 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-black rounded-2xl transition-all shadow-lg shadow-orange-500/20 uppercase tracking-wider"
                  >
                    {submitting ? 'Envoi...' : 'Soumettre'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
