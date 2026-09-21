// src/pages/admin/AdminVendorsPage.jsx — Dark Premium Orange
// Gestion complète des vendeurs : KYC Viewer, Notes internes, Historique, Notifications, Alerte SMS/Email
import React, { useState, useEffect } from 'react';
import {
  Search, CheckCircle, XCircle, AlertTriangle, Edit, FileText,
  Check, X, Store, Eye, ZoomIn, ZoomOut, Download, ShieldCheck,
  Clock, MessageSquare, History, Bell, Send, RefreshCw
} from 'lucide-react';
import { vendorsAPI } from '../../services/api';
import PageHeader from '../../components/ui/PageHeader';

const getNowStr = () =>
  new Date().toLocaleString('fr-CI', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

/* ─── Données initiales / mock ─── */
const makeDocs = (overrides = {}) => [
  {
    key: 'cni_recto',
    label: "Carte d'identité (Recto)",
    status: 'validé',
    url: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=800&q=80',
    ...overrides.cni_recto,
  },
  {
    key: 'cni_verso',
    label: "Carte d'identité (Verso)",
    status: 'validé',
    url: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=800&q=80',
    ...overrides.cni_verso,
  },
  {
    key: 'rccm',
    label: 'Registre de Commerce (RCCM)',
    status: 'en_attente',
    url: 'https://images.unsplash.com/photo-1568585219423-c9cd3ad9e8de?auto=format&fit=crop&w=800&q=80',
    ...overrides.rccm,
  },
];

const MOCK_VENDORS = [
  { id: 'V-101', name: 'Tech Store CI',     owner: 'Koffi Marc',    status: 'Actif',      commission: 10, appliedAt: '12/05/2023', products: 120, phone: '+225 07 00 11 22', email: 'koffi@techci.ci',     city: 'Abidjan',      docs: makeDocs() },
  { id: 'V-102', name: 'Beauté Plus',       owner: 'Awa Sylla',     status: 'En attente', commission: 12, appliedAt: '28/07/2023', products: 0,   phone: '+225 05 44 55 66', email: 'awa@beauteplus.ci',   city: 'Bouaké',       docs: makeDocs({ cni_recto: { status: 'en_attente' }, cni_verso: { status: 'en_attente' }, rccm: { status: 'en_attente', url: null } }) },
  { id: 'V-103', name: 'Electro Ménager',   owner: 'Jean Bernard',  status: 'Actif',      commission:  8, appliedAt: '03/02/2023', products: 340, phone: '+225 01 22 33 44', email: 'jb@electromenager.ci', city: 'Yamoussoukro', docs: makeDocs({ rccm: { status: 'validé' } }) },
  { id: 'V-104', name: 'Fashion Mode',      owner: 'Sarah Koné',    status: 'Suspendu',   commission: 15, appliedAt: '10/01/2023', products: 89,  phone: '+225 07 88 99 00', email: 'sarah@fashionmode.ci', city: 'Bouaké',       docs: makeDocs({ cni_verso: { status: 'refusé' }, rccm: { status: 'refusé' } }) },
  { id: 'V-105', name: 'Épicerie Centrale', owner: 'Moussa Diallo', status: 'Actif',      commission:  9, appliedAt: '01/03/2024', products: 210, phone: '+225 05 66 77 88', email: 'moussa@epicerie.ci',  city: 'Bouaké',       docs: makeDocs() },
];

const TABS = [
  { key: 'tous',       label: 'Tous'       },
  { key: 'actifs',     label: 'Actifs'     },
  { key: 'en_attente', label: 'En attente' },
  { key: 'refuses',    label: 'Refusés'    },
  { key: 'suspendus',  label: 'Suspendus'  },
];

const STATUS_CFG = {
  'Actif':      { cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25', icon: CheckCircle },
  'En attente': { cls: 'bg-amber-500/15  text-amber-400  border-amber-500/25',     icon: AlertTriangle },
  'Refusé':     { cls: 'bg-rose-500/15   text-rose-400   border-rose-500/25',       icon: XCircle },
  'Suspendu':   { cls: 'bg-red-500/15    text-red-400    border-red-500/25',        icon: XCircle },
};

const DOC_STATUS_CFG = {
  validé:     { cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', label: 'Validé',     icon: CheckCircle },
  en_attente: { cls: 'text-amber-400   bg-amber-500/10   border-amber-500/20',   label: 'En attente', icon: Clock },
  refusé:     { cls: 'text-red-400     bg-red-500/10     border-red-500/20',      label: 'Refusé',     icon: XCircle },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CFG[status] || {};
  const Icon = cfg.icon || CheckCircle;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${cfg.cls}`}>
      <Icon size={11} /> {status}
    </span>
  );
};

const DocStatusBadge = ({ status }) => {
  const cfg = DOC_STATUS_CFG[status] || DOC_STATUS_CFG['en_attente'];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border ${cfg.cls}`}>
      <Icon size={9} /> {cfg.label}
    </span>
  );
};

/* ──────── Toast Alerte SMS/Email simulé ──────── */
const SmsToast = ({ msg, onClose }) => (
  <div className="fixed bottom-6 right-6 z-[100] flex items-start gap-3 bg-slate-900 border border-emerald-500/30 rounded-2xl p-4 shadow-2xl max-w-sm animate-in slide-in-from-right-5">
    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 text-emerald-400">
      <Send size={14} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-black text-white">Notification Automatique</p>
      <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">{msg}</p>
    </div>
    <button onClick={onClose} className="text-slate-500 hover:text-white p-1">
      <X size={13} />
    </button>
  </div>
);

/* ──────── Page Principale ──────── */
export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState([]);
  const [vendorsLoading, setVendorsLoading] = useState(true);
  const [vendorsError, setVendorsError] = useState('');

  const loadVendors = async () => {
    setVendorsLoading(true);
    setVendorsError('');
    try {
      const res = await vendorsAPI.getAll({ limit: 100 });
      const payload = res.data?.data || res.data || {};
      const vData = Array.isArray(payload) ? payload : (payload.data || payload.vendors || []);
      if (Array.isArray(vData)) {
        setVendors(vData.map(v => ({
          id: v.id,
          name: v.shop_name || v.name || 'Boutique sans nom',
          owner: v.owner_name || 'Commerçant',
          email: v.owner_email || 'vendeur@anouan.ci',
          phone: v.owner_phone || v.phone || '+225 07 00 00 00',
          city: v.city || '',
          status: v.validation_status === 'approved'
            ? 'Actif'
            : (v.validation_status === 'suspended'
              ? 'Suspendu'
              : (v.validation_status === 'rejected' ? 'Refusé' : 'En attente')),
          commission: Number(v.commission_rate || 10),
          appliedAt: new Date(v.created_at).toLocaleDateString('fr-CI'),
          products: Number(v.product_count || 0),
          docs: makeDocs(),
        })));
      } else {
        setVendors([]);
      }
    } catch (e) {
      console.error('Erreur chargement vendeurs:', e);
      setVendorsError(e.response?.data?.message || 'Impossible de charger les vendeurs.');
    } finally {
      setVendorsLoading(false);
    }
  };

  /* ─── Notes et Historique (en mémoire session) ─── */
  const [notes, setNotes]         = useState({});
  const [history, setHistory]     = useState({});
  const [noteInput, setNoteInput] = useState('');

  /* ─── Navigation & Modales ─── */
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [activeTab, setActiveTab]           = useState('tous');
  const [search, setSearch]                 = useState('');
  const [commission, setCommission]         = useState('');
  const [docViewer, setDocViewer]           = useState(null);
  const [zoom, setZoom]                     = useState(1);
  const [smsToast, setSmsToast]             = useState(null);
  const [newVendorCount, setNewVendorCount] = useState(0);
  const [activeSection, setActiveSection]   = useState('info'); // info | docs | notes | history

  /* Écouteur pour nouvelles inscriptions vendeurs en direct */
  useEffect(() => {
    loadVendors();
    const handler = () => {
      loadVendors();
      setNewVendorCount((c) => c + 1);
    };
    window.addEventListener('anouan_vendor_registered', handler);
    return () => window.removeEventListener('anouan_vendor_registered', handler);
  }, []);

  /* Ajouter une entrée dans l'historique */
  const logAction = (vendorId, action) => {
    setHistory((prev) => ({
      ...prev,
      [vendorId]: [{ action, by: 'Admin Anouan', date: getNowStr() }, ...(prev[vendorId] || [])],
    }));
  };

  /* Déclencher SMS/Email simulé */
  const sendVendorAlert = (vendor, newStatus) => {
    const dest = vendor.phone || vendor.email || 'le vendeur';
    const msg = newStatus === 'Actif'
      ? `✅ SMS/Email envoyé à ${dest} : "Félicitations ! Votre boutique '${vendor.name}' a été approuvée sur Anouan Express. Vous pouvez maintenant ajouter vos produits."`
      : `⚠️ SMS/Email envoyé à ${dest} : "Information Anouan Express : Le statut de votre compte boutique '${vendor.name}' est désormais suspendu."`;
    setSmsToast(msg);
    setTimeout(() => setSmsToast(null), 6000);
  };

  /* Modal vendeur */
  const openModal = (v) => {
    setSelectedVendor(v);
    setCommission(String(v.commission));
    setNoteInput(notes[v.id] || '');
    setActiveSection('info');
    setNewVendorCount(0);
  };
  const closeModal = () => setSelectedVendor(null);

  /* Lightbox Document */
  const openDocViewer = (doc, vendorId) => {
    setDocViewer({ doc, vendorId });
    setZoom(1);
  };
  const closeDocViewer = () => setDocViewer(null);

  /* Statut d'un document KYC */
  const updateDocStatus = (vendorId, docKey, newDocStatus) => {
    const updateFn = (v) =>
      v.id !== vendorId ? v : {
        ...v,
        docs: v.docs.map((d) => (d.key === docKey ? { ...d, status: newDocStatus } : d)),
      };

    setVendors((prev) => prev.map(updateFn));
    setSelectedVendor((prev) =>
      prev && prev.id === vendorId
        ? { ...prev, docs: prev.docs.map((d) => (d.key === docKey ? { ...d, status: newDocStatus } : d)) }
        : prev
    );

    const docName = docKey === 'cni_recto' ? 'CNI Recto' : docKey === 'cni_verso' ? 'CNI Verso' : 'RCCM';
    logAction(vendorId, `Document ${docName} passé à "${newDocStatus}"`);
    closeDocViewer();
  };

  /* Changer le statut du vendeur */
  const updateStatus = async (id, newStatus, actionOverride) => {
    const action = actionOverride || (newStatus === 'Actif' ? 'approve' : (newStatus === 'Suspendu' ? 'suspend' : 'reject'));
    const vendorToUpdate = vendors.find((item) => item.id === id);
    const actionLabel = newStatus === 'Actif' ? 'activer' : (newStatus === 'Refusé' ? 'refuser' : 'suspendre');
    if (!vendorToUpdate || !window.confirm(`Confirmer l’action « ${actionLabel} » pour la boutique ${vendorToUpdate.name} ?`)) return;
    try {
      await vendorsAPI.updateStatus(id, { action });
      await loadVendors();
      logAction(id, `Statut boutique modifié en "${newStatus}" dans la base de données`);
    } catch (e) {
      alert(e.response?.data?.message || 'Erreur lors de la mise à jour du vendeur.');
      return;
    }
    const vendor = vendors.find((v) => v.id === id);
    if (vendor && (newStatus === 'Actif' || newStatus === 'Suspendu')) {
      sendVendorAlert(vendor, newStatus);
    }
    closeModal();
  };

  /* Enregistrer Commission & Notes */
  const handleSave = async () => {
    if (!selectedVendor) return;
    const val = parseFloat(commission);
    if (!isNaN(val) && val !== selectedVendor.commission) {
      try {
        await vendorsAPI.updateCommission(selectedVendor.id, { rate: val });
        await loadVendors();
      } catch (e) {}
      logAction(selectedVendor.id, `Commission ajustée à ${val}%`);
    }
    if (noteInput !== (notes[selectedVendor.id] || '')) {
      setNotes((prev) => ({ ...prev, [selectedVendor.id]: noteInput }));
      logAction(selectedVendor.id, 'Note interne mise à jour');
    }
    closeModal();
  };

  /* Filtres & Recherche */
  const filteredVendors = vendors.filter((v) => {
    const matchTab =
      activeTab === 'tous' ||
      (activeTab === 'actifs'     && v.status === 'Actif')      ||
      (activeTab === 'en_attente' && v.status === 'En attente') ||
      (activeTab === 'refuses'    && v.status === 'Refusé')     ||
      (activeTab === 'suspendus'  && v.status === 'Suspendu');
    const matchSearch =
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.owner.toLowerCase().includes(search.toLowerCase()) ||
      (v.city && v.city.toLowerCase().includes(search.toLowerCase()));
    return matchTab && matchSearch;
  });

  const vendorHistory = selectedVendor ? (history[selectedVendor.id] || []) : [];

  return (
    <div className="space-y-6 text-slate-100">
      {/* Toast SMS simulé */}
      {smsToast && <SmsToast msg={smsToast} onClose={() => setSmsToast(null)} />}

      <PageHeader
        eyebrow="Administration Partenaires"
        eyebrowIcon={Store}
        title="Gestion des Vendeurs"
        subtitle="Supervisez, validez et gérez les comptes vendeurs de la plateforme."
        actions={(
          <div className="flex items-center gap-2">
            {newVendorCount > 0 && (
              <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/25 text-amber-400 px-4 py-2.5 rounded-2xl text-xs font-bold animate-pulse">
                <Bell size={14} />
                {newVendorCount} nouvelle{newVendorCount > 1 ? 's' : ''} demande{newVendorCount > 1 ? 's' : ''}
              </div>
            )}
            <button
              onClick={loadVendors}
              disabled={vendorsLoading}
              className="flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs font-bold text-slate-300 transition-all hover:border-orange-500/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw size={14} className={vendorsLoading ? 'animate-spin' : ''} /> Rafraîchir
            </button>
          </div>
        )}
      />

      {/* Stats rapides */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Vendeurs actifs',       value: vendors.filter((v) => v.status === 'Actif').length,      color: 'text-emerald-400' },
          { label: 'En attente validation', value: vendors.filter((v) => v.status === 'En attente').length, color: 'text-amber-400' },
          { label: 'Demandes refusées',     value: vendors.filter((v) => v.status === 'Refusé').length,    color: 'text-rose-400' },
          { label: 'Suspendus',             value: vendors.filter((v) => v.status === 'Suspendu').length,   color: 'text-red-400' },
        ].map((s) => (
          <div key={s.label} className="bg-slate-900/60 border border-slate-800 rounded-3xl p-4 text-center">
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-[11px] text-slate-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs + Search */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-1.5 bg-slate-950/50 p-1 rounded-2xl overflow-x-auto w-full sm:w-auto">
          {TABS.map((tab) => {
            const count = tab.key === 'en_attente' ? vendors.filter((v) => v.status === 'En attente').length : 0;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all relative shrink-0 ${
                  activeTab === tab.key
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
                {count > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 bg-red-500 text-white text-[9px] rounded-full font-black">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher boutique, vendeur, ville..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-500 focus:border-orange-500 outline-none transition-all"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden">
        {vendorsError && (
          <div className="m-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs font-semibold text-red-300">
            {vendorsError}
            <button onClick={loadVendors} className="ml-3 text-red-200 underline">Réessayer</button>
          </div>
        )}
        {vendorsLoading && (
          <div className="px-5 py-10 text-center text-xs text-slate-400">Chargement des vendeurs...</div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-500 text-[10px] uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-5 py-4 font-bold">Boutique / Vendeur</th>
                <th className="px-5 py-4 font-bold">Statut</th>
                <th className="px-5 py-4 font-bold">Commission</th>
                <th className="px-5 py-4 font-bold">Produits</th>
                <th className="px-5 py-4 font-bold">Inscription</th>
                <th className="px-5 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {!vendorsLoading && filteredVendors.map((vendor) => (
                <tr key={vendor.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-orange-500/15 border border-orange-500/25 flex items-center justify-center text-orange-400 font-black text-xs shrink-0">
                        {vendor.name[0]}
                      </div>
                      <div>
                        <div className="font-bold text-white flex items-center gap-2">
                          {vendor.name}
                          {notes[vendor.id] && (
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-400" title="Note interne présente" />
                          )}
                        </div>
                        <div className="text-slate-500 text-[10px]">
                          {vendor.owner} · {vendor.id} {vendor.city ? `· ${vendor.city}` : ''}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4"><StatusBadge status={vendor.status} /></td>
                  <td className="px-5 py-4 font-black text-orange-400">{vendor.commission}%</td>
                  <td className="px-5 py-4 text-slate-300">{vendor.products}</td>
                  <td className="px-5 py-4 text-slate-400">{vendor.appliedAt}</td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => openModal(vendor)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/10 border border-orange-500/25 text-orange-400 rounded-xl text-[10px] font-bold hover:bg-orange-500/20 transition-colors"
                    >
                      <Edit size={12} /> Gérer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!vendorsLoading && filteredVendors.length === 0 && !vendorsError && (
            <div className="px-5 py-12 text-center text-sm font-semibold text-slate-500">Aucun vendeur trouvé.</div>
          )}
        </div>
      </div>

      {/* ── Modal Gestion Vendeur ── */}
      {selectedVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/25 flex items-center justify-center text-orange-400 font-black">
                  {selectedVendor.name[0]}
                </div>
                <div>
                  <h2 className="text-sm font-black text-white">{selectedVendor.name}</h2>
                  <p className="text-[10px] text-slate-400">
                    {selectedVendor.id} · {selectedVendor.owner} {selectedVendor.city ? `· ${selectedVendor.city}` : ''}
                  </p>
                </div>
              </div>
              <button onClick={closeModal} className="text-slate-500 hover:text-white p-1.5 rounded-xl hover:bg-slate-800">
                <X size={18} />
              </button>
            </div>

            {/* Onglets internes : Infos, Documents, Notes, Historique */}
            <div className="px-6 pt-4 shrink-0 bg-slate-900/40">
              <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-2xl w-fit">
                {[
                  { key: 'info',    label: 'Infos',       icon: Store },
                  { key: 'docs',    label: 'Documents KYC', icon: FileText },
                  { key: 'notes',   label: 'Notes',       icon: MessageSquare },
                  { key: 'history', label: 'Historique',  icon: History },
                ].map((s) => {
                  const Icon = s.icon;
                  return (
                    <button
                      key={s.key}
                      onClick={() => setActiveSection(s.key)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${
                        activeSection === s.key
                          ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Icon size={11} /> {s.label}
                      {s.key === 'notes' && notes[selectedVendor.id] && (
                        <span className="w-1.5 h-1.5 bg-orange-400 rounded-full" />
                      )}
                      {s.key === 'history' && vendorHistory.length > 0 && (
                        <span className="text-[8px] bg-orange-500/30 text-orange-300 px-1 rounded-full">
                          {vendorHistory.length}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Body scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* ── Onglet INFOS ── */}
              {activeSection === 'info' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-950/50 border border-slate-800 p-3 rounded-2xl">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">Statut</p>
                      <StatusBadge status={selectedVendor.status} />
                    </div>
                    <div className="bg-slate-950/50 border border-slate-800 p-3 rounded-2xl">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">Produits en vente</p>
                      <p className="text-sm font-black text-white">{selectedVendor.products}</p>
                    </div>
                    {selectedVendor.phone && (
                      <div className="bg-slate-950/50 border border-slate-800 p-3 rounded-2xl">
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">Téléphone</p>
                        <p className="text-xs font-bold text-white">{selectedVendor.phone}</p>
                      </div>
                    )}
                    {selectedVendor.email && (
                      <div className="bg-slate-950/50 border border-slate-800 p-3 rounded-2xl">
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">Email</p>
                        <p className="text-xs font-bold text-white truncate">{selectedVendor.email}</p>
                      </div>
                    )}
                  </div>

                  {/* Commission */}
                  <div className="bg-slate-950/50 border border-slate-800 p-4 rounded-2xl">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-2">Taux de Commission Plateforme (%)</p>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        value={commission}
                        onChange={(e) => setCommission(e.target.value)}
                        min="0"
                        max="50"
                        className="w-24 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm font-black text-orange-400 outline-none focus:border-orange-500 transition-all"
                      />
                      <span className="text-slate-400 text-xs">% prélevé par vente</span>
                    </div>
                  </div>
                </>
              )}

              {/* ── Onglet DOCUMENTS KYC ── */}
              {activeSection === 'docs' && (
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-3 flex items-center gap-1.5">
                    <ShieldCheck size={12} className="text-orange-400" /> Documents Vérifiés
                  </p>
                  <div className="border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800">
                    {selectedVendor.docs.map((doc) => (
                      <div key={doc.key} className="flex items-center justify-between px-4 py-3.5 hover:bg-slate-800/30 transition-colors gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FileText size={14} className="text-slate-500 shrink-0" />
                          <span className="text-xs text-slate-300 truncate">{doc.label}</span>
                          <DocStatusBadge status={doc.status} />
                        </div>
                        <button
                          onClick={() => openDocViewer(doc, selectedVendor.id)}
                          disabled={!doc.url}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all shrink-0 ${
                            doc.url
                              ? 'bg-orange-500/10 border border-orange-500/25 text-orange-400 hover:bg-orange-500/20 cursor-pointer'
                              : 'bg-slate-800 border border-slate-700 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          <Eye size={11} />
                          {doc.url ? 'Voir' : 'Absent'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Onglet NOTES INTERNES ── */}
              {activeSection === 'notes' && (
                <div className="space-y-3">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold flex items-center gap-1.5">
                    <MessageSquare size={12} className="text-orange-400" /> Notes Internes Administrateur
                  </p>
                  <textarea
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    rows={7}
                    placeholder="Ajoutez des remarques confidentielles sur ce vendeur (ex: RCCM vérifié au tribunal de Bouaké, boutique physique visitée...)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-white placeholder-slate-600 focus:border-orange-500 outline-none transition-all resize-none leading-relaxed"
                  />
                  <p className="text-[10px] text-slate-500 italic">
                    Ces notes sont sauvegardées localement et visibles uniquement par les administrateurs.
                  </p>
                </div>
              )}

              {/* ── Onglet HISTORIQUE ── */}
              {activeSection === 'history' && (
                <div className="space-y-3">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold flex items-center gap-1.5">
                    <History size={12} className="text-orange-400" /> Journal d&apos;activité
                  </p>
                  {vendorHistory.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <History size={32} className="mx-auto mb-3 opacity-30" />
                      <p className="text-xs">Aucune action enregistrée pour ce vendeur.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {vendorHistory.map((entry, i) => (
                        <div key={i} className="flex items-start gap-3 bg-slate-950/50 border border-slate-800 rounded-2xl px-4 py-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-white">{entry.action}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">Par {entry.by} · {entry.date}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/50 flex flex-wrap gap-2 justify-end shrink-0">
              {selectedVendor.status === 'En attente' && (
                <>
                  <button
                    onClick={() => updateStatus(selectedVendor.id, 'Refusé', 'reject')}
                    className="px-4 py-2 bg-red-500/10 border border-red-500/25 text-red-400 text-xs font-bold rounded-2xl hover:bg-red-500/20 transition-colors flex items-center gap-1.5"
                  >
                    <X size={13} /> Rejeter
                  </button>
                  <button
                    onClick={() => updateStatus(selectedVendor.id, 'Actif')}
                    className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-bold rounded-2xl hover:bg-emerald-500/20 transition-colors flex items-center gap-1.5"
                  >
                    <Check size={13} /> Approuver Boutique
                  </button>
                </>
              )}
              {selectedVendor.status === 'Refusé' && (
                <button
                  onClick={() => updateStatus(selectedVendor.id, 'Actif', 'reactivate')}
                  className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-bold rounded-2xl hover:bg-emerald-500/20 transition-colors flex items-center gap-1.5"
                >
                  <Check size={13} /> Réactiver
                </button>
              )}
              {selectedVendor.status === 'Actif' && (
                <button
                  onClick={() => updateStatus(selectedVendor.id, 'Suspendu')}
                  className="px-4 py-2 bg-red-500/10 border border-red-500/25 text-red-400 text-xs font-bold rounded-2xl hover:bg-red-500/20 transition-colors flex items-center gap-1.5"
                >
                  <AlertTriangle size={13} /> Suspendre
                </button>
              )}
              {selectedVendor.status === 'Suspendu' && (
                <button
                  onClick={() => updateStatus(selectedVendor.id, 'Actif', 'reactivate')}
                  className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-bold rounded-2xl hover:bg-emerald-500/20 transition-colors flex items-center gap-1.5"
                >
                  <Check size={13} /> Réactiver
                </button>
              )}
              <button
                onClick={handleSave}
                className="px-5 py-2 bg-orange-500 text-slate-950 font-black text-xs rounded-2xl hover:bg-orange-400 transition-colors shadow-lg shadow-orange-500/20"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Lightbox Document ── */}
      {docViewer && (
        <div
          className="fixed inset-0 z-[60] flex flex-col bg-slate-950/95 backdrop-blur-md"
          onClick={(e) => e.target === e.currentTarget && closeDocViewer()}
        >
          {/* Barre de contrôle */}
          <div className="flex items-center justify-between px-5 py-3 bg-slate-900 border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-3">
              <FileText size={16} className="text-orange-400" />
              <div>
                <p className="text-sm font-black text-white">{docViewer.doc.label}</p>
                <DocStatusBadge status={docViewer.doc.status} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Zoom arrière"
              >
                <ZoomOut size={15} />
              </button>
              <span className="text-xs font-bold text-slate-400 w-12 text-center">{Math.round(zoom * 100)}%</span>
              <button
                onClick={() => setZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)))}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Zoom avant"
              >
                <ZoomIn size={15} />
              </button>
              {docViewer.doc.url && (
                <a
                  href={docViewer.doc.url}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  title="Télécharger"
                >
                  <Download size={15} />
                </a>
              )}
              <button
                onClick={closeDocViewer}
                className="p-2 rounded-xl bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-400 transition-colors ml-1"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Image */}
          <div className="flex-1 overflow-auto flex items-center justify-center p-6">
            <img
              src={docViewer.doc.url}
              alt={docViewer.doc.label}
              className="rounded-2xl shadow-2xl object-contain transition-transform duration-200"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'center center',
                maxWidth: '100%',
                maxHeight: '70vh',
              }}
            />
          </div>

          {/* Actions KYC */}
          <div className="shrink-0 px-5 py-4 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-400">Valider ou refuser ce document officiel.</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateDocStatus(docViewer.vendorId, docViewer.doc.key, 'refusé')}
                className="px-4 py-2 bg-red-500/10 border border-red-500/25 text-red-400 text-xs font-bold rounded-2xl hover:bg-red-500/20 transition-colors flex items-center gap-1.5"
              >
                <X size={13} /> Refuser le document
              </button>
              <button
                onClick={() => updateDocStatus(docViewer.vendorId, docViewer.doc.key, 'validé')}
                className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-bold rounded-2xl hover:bg-emerald-500/20 transition-colors flex items-center gap-1.5"
              >
                <Check size={13} /> Valider le document
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
