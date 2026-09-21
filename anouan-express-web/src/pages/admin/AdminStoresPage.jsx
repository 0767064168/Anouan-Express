// src/pages/admin/AdminStoresPage.jsx
// Gestion des Points Relais Anouan Express par l'Administrateur
// Thème Dark Glassmorphism Orange & Pagne Kita

import React, { useState, useEffect } from 'react';
import {
  MapPin, Plus, Edit2, Trash2, Power, Phone, Mail, Navigation,
  Clock, CheckCircle, XCircle, Search, RefreshCw, AlertTriangle, X,
  UserPlus, Users, Eye, EyeOff, UserCheck
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import { storesAPI, adminAPI, usersAPI } from '../../services/api';
import { useToast } from '../../components/ui/Toast';

const PRESET_LOCATIONS = [
  { name: 'Quartier Commerce (Centre)', lat: 7.6895, lng: -5.0305 },
  { name: 'Air France / Marché', lat: 7.7012, lng: -5.0210 },
  { name: 'Koko / Mairie', lat: 7.6820, lng: -5.0425 },
  { name: 'Kennedy / Belleville', lat: 7.7125, lng: -5.0150 },
  { name: 'Broukro / N\'Gattakro', lat: 7.6780, lng: -5.0250 },
  { name: 'Ahougnansou / Dar-es-Salam', lat: 7.7200, lng: -5.0380 },
];

export default function AdminStoresPage() {
  const toast = useToast();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: '',
    city: 'Bouaké',
    address: '',
    phone: '',
    contact_email: '',
    gps_lat: '',
    gps_lng: '',
    is_active: true,
  });

  // Modal création / affectation d'Agent
  const [agentModalStore, setAgentModalStore] = useState(null);
  const [agentModalTab, setAgentModalTab] = useState('create'); // 'create' | 'assign'
  const [agentForm, setAgentForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [showAgentPassword, setShowAgentPassword] = useState(false);
  const [allAgents, setAllAgents] = useState([]);
  const [selectedExistingAgentId, setSelectedExistingAgentId] = useState('');
  const [agentSubmitting, setAgentSubmitting] = useState(false);

  const openAgentModal = async (store) => {
    setAgentModalStore(store);
    setAgentModalTab('create');
    setAgentForm({ name: '', email: '', phone: '', password: '' });
    setSelectedExistingAgentId('');
    try {
      const res = await usersAPI.getAll({ role: 'agent', limit: 100 });
      const data = res.data?.data || res.data || [];
      setAllAgents(Array.isArray(data) ? data : []);
    } catch {
      setAllAgents([]);
    }
  };

  const handleCreateAgentForStore = async (e) => {
    e.preventDefault();
    if (!agentModalStore) return;
    setAgentSubmitting(true);
    try {
      await adminAPI.createAgent({
        name: agentForm.name.trim(),
        email: agentForm.email.trim().toLowerCase(),
        phone: agentForm.phone.trim() || undefined,
        password: agentForm.password,
        storeId: agentModalStore.id,
      });
      toast.success(`Agent ${agentForm.name} créé et affecté à ${agentModalStore.name} !`);
      setAgentModalStore(null);
      await loadStores();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Impossible de créer le compte Agent.');
    } finally {
      setAgentSubmitting(false);
    }
  };

  const handleAssignExistingAgent = async (e) => {
    e.preventDefault();
    if (!agentModalStore || !selectedExistingAgentId) return;
    setAgentSubmitting(true);
    try {
      await adminAPI.assignAgentStore(selectedExistingAgentId, agentModalStore.id);
      toast.success(`Agent réaffecté à ${agentModalStore.name} avec succès !`);
      setAgentModalStore(null);
      await loadStores();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Impossible de réaffecter cet agent.');
    } finally {
      setAgentSubmitting(false);
    }
  };

  const loadStores = async () => {
    setLoading(true);
    try {
      // Pour l'admin, activeOnly=false pour tout voir
      const res = await storesAPI.getAll({ activeOnly: 'false', limit: 100 });
      const data = res.data?.data || res.data || [];
      setStores(data);
    } catch (err) {
      toast.error('Erreur lors du chargement des points relais.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStores();
  }, []);

  const openCreateModal = () => {
    setEditingStore(null);
    setForm({
      name: '',
      city: 'Bouaké',
      address: '',
      phone: '',
      contact_email: '',
      gps_lat: '7.6895',
      gps_lng: '-5.0305',
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (store) => {
    setEditingStore(store);
    setForm({
      name: store.name || '',
      city: store.city || 'Bouaké',
      address: store.address || '',
      phone: store.phone || '',
      contact_email: store.contact_email || '',
      gps_lat: store.gps_lat !== null && store.gps_lat !== undefined ? String(store.gps_lat) : '',
      gps_lng: store.gps_lng !== null && store.gps_lng !== undefined ? String(store.gps_lng) : '',
      is_active: store.is_active !== false,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.address.trim()) {
      toast.error('Veuillez renseigner au moins le nom et l\'adresse du point relais.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        city: form.city.trim(),
        address: form.address.trim(),
        phone: form.phone.trim() || undefined,
        contact_email: form.contact_email.trim() || undefined,
        gps_lat: form.gps_lat ? parseFloat(form.gps_lat) : null,
        gps_lng: form.gps_lng ? parseFloat(form.gps_lng) : null,
        is_active: form.is_active,
      };

      if (editingStore) {
        await storesAPI.update(editingStore.id, payload);
        toast.success('Point relais mis à jour avec succès !');
      } else {
        await storesAPI.create(payload);
        toast.success('Nouveau point relais créé avec succès !');
      }
      setIsModalOpen(false);
      loadStores();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Une erreur est survenue lors de l\'enregistrement.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (store) => {
    try {
      await storesAPI.toggleActive(store.id);
      toast.info(`Statut du point relais modifié.`);
      setStores(prev => prev.map(s => s.id === store.id ? { ...s, is_active: !s.is_active } : s));
    } catch (err) {
      toast.error('Impossible de modifier le statut.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await storesAPI.delete(id);
      toast.success('Point relais supprimé.');
      setDeleteConfirmId(null);
      setStores(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      toast.error('Impossible de supprimer ce point relais (des commandes y sont peut-être associées).');
    }
  };

  const filteredStores = stores.filter(s => {
    const q = search.toLowerCase();
    return (
      (s.name || '').toLowerCase().includes(q) ||
      (s.address || '').toLowerCase().includes(q) ||
      (s.city || '').toLowerCase().includes(q) ||
      (s.phone || '').includes(q)
    );
  });

  return (
    <div className="space-y-8 p-4 lg:p-8 max-w-7xl mx-auto text-slate-100">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader
          eyebrow="Réseau Logistique"
          eyebrowIcon={MapPin}
          title="Gestion des Points Relais"
          subtitle="Créez, géolocalisez et pilotez les points de retrait physiques Anouan Express à Bouaké."
        />
        <button
          onClick={openCreateModal}
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg shadow-orange-500/20 shrink-0"
        >
          <Plus size={16} />
          <span>Nouveau Point Relais</span>
        </button>
      </div>

      {/* Barre de Recherche & Compteurs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-3 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text"
            placeholder="Rechercher par nom, quartier, adresse, téléphone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-900/80 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-500 focus:border-orange-500 outline-none transition-all"
          />
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 flex items-center justify-between px-5">
          <span className="text-xs text-slate-400 font-semibold">Total Relais</span>
          <span className="text-lg font-black text-orange-400">{stores.length}</span>
        </div>
      </div>

      {/* Liste des Points Relais */}
      {loading ? (
        <div className="glass-panel p-12 text-center text-slate-400 rounded-3xl border border-slate-800">
          <RefreshCw className="animate-spin mx-auto mb-3 text-orange-400" size={28} />
          <p className="text-xs font-semibold">Chargement des points relais...</p>
        </div>
      ) : filteredStores.length === 0 ? (
        <div className="glass-panel p-12 text-center text-slate-400 rounded-3xl border border-slate-800 space-y-3">
          <MapPin size={40} className="mx-auto text-slate-600" />
          <p className="font-bold text-white text-sm">Aucun point relais trouvé</p>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {search ? 'Aucun résultat ne correspond à votre recherche.' : 'Vous n\'avez pas encore créé de point relais.'}
          </p>
          {!search && (
            <button
              onClick={openCreateModal}
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-slate-950 font-bold rounded-xl text-xs"
            >
              <Plus size={14} /> Créer le premier point
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStores.map((store) => (
            <div
              key={store.id}
              className={`glass-card p-6 rounded-3xl border transition-all duration-300 flex flex-col justify-between space-y-5 ${
                store.is_active
                  ? 'border-slate-800 hover:border-orange-500/50 bg-slate-900/60'
                  : 'border-slate-800/60 bg-slate-950/40 opacity-70'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
                      <MapPin size={20} />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-orange-400">
                        {store.city || 'Bouaké'}
                      </span>
                      <h3 className="font-black text-sm text-white line-clamp-1">{store.name}</h3>
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                      store.is_active
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}
                  >
                    {store.is_active ? 'Actif' : 'Inactif'}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                  {store.address}
                </p>

                <div className="space-y-1.5 pt-2 border-t border-slate-800 text-xs text-slate-400">
                  {store.phone && (
                    <div className="flex items-center gap-2">
                      <Phone size={13} className="text-orange-400 shrink-0" />
                      <span>{store.phone}</span>
                    </div>
                  )}
                  {store.contact_email && (
                    <div className="flex items-center gap-2">
                      <Mail size={13} className="text-orange-400 shrink-0" />
                      <span className="truncate">{store.contact_email}</span>
                    </div>
                  )}
                  {store.gps_lat && store.gps_lng && (
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <Navigation size={13} className="text-amber-400 shrink-0" />
                      <span>GPS: {Number(store.gps_lat).toFixed(4)}, {Number(store.gps_lng).toFixed(4)}</span>
                    </div>
                  )}
                </div>

                {/* Section Agents Guichet affectés */}
                <div className="pt-2.5 border-t border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                      <Users size={13} className="text-purple-400" />
                      Agents ({store.agent_count || 0})
                    </span>
                    <button
                      onClick={() => openAgentModal(store)}
                      className="text-[11px] font-black text-orange-400 hover:text-orange-300 flex items-center gap-1 transition-colors"
                    >
                      <UserPlus size={12} /> + Affecter
                    </button>
                  </div>
                  {Array.isArray(store.agents) && store.agents.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {store.agents.map((ag) => (
                        <span
                          key={ag.id}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-500/10 border border-purple-500/25 text-purple-300 rounded-xl text-[10px] font-bold"
                          title={`${ag.name} (${ag.phone || ag.email})`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          {ag.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-amber-400/80 italic">
                      ⚠️ Aucun agent guichet affecté
                    </p>
                  )}
                </div>
              </div>

              {/* Boutons d'Action */}
              <div className="flex items-center justify-between gap-2 pt-4 border-t border-slate-800">
                <button
                  onClick={() => handleToggle(store)}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors ${
                    store.is_active
                      ? 'border-slate-800 text-slate-400 hover:text-amber-400 hover:border-amber-500/30'
                      : 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20'
                  }`}
                  title={store.is_active ? 'Désactiver le relais' : 'Activer le relais'}
                >
                  <Power size={14} />
                  <span>{store.is_active ? 'Désactiver' : 'Activer'}</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEditModal(store)}
                    className="p-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition-colors"
                    title="Modifier"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(store.id)}
                    className="p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl border border-red-500/20 transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Confirmation de suppression */}
              {deleteConfirmId === store.id && (
                <div className="p-3 bg-red-950/80 border border-red-500/40 rounded-2xl space-y-2 mt-2">
                  <p className="text-[11px] font-bold text-red-300">Confirmer la suppression ?</p>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setDeleteConfirmId(null)}
                      className="px-2.5 py-1 text-[10px] bg-slate-800 text-slate-300 rounded-lg"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={() => handleDelete(store.id)}
                      className="px-2.5 py-1 text-[10px] bg-red-600 text-white font-bold rounded-lg"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal Création / Modification */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 md:p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center">
                  <MapPin size={20} />
                </div>
                <div>
                  <h3 className="font-black text-white text-base">
                    {editingStore ? 'Modifier le Point Relais' : 'Ajouter un Point Relais'}
                  </h3>
                  <p className="text-xs text-slate-400">Réseau de retrait physique Anouan Express</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Nom du Point Relais *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Guichet Relais Air France 1 & 2"
                  value={form.name}
                  onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-orange-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Ville / Commune *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.city}
                    onChange={(e) => setForm(p => ({ ...p, city: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-orange-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Téléphone Contact
                  </label>
                  <input
                    type="text"
                    placeholder="+225 07..."
                    value={form.phone}
                    onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-orange-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Adresse exacte & Repère *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Ex: Marché Air France, face carrefour jeunesse, à côté de l'espace Orange"
                  value={form.address}
                  onChange={(e) => setForm(p => ({ ...p, address: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-orange-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Email du Responsable
                </label>
                <input
                  type="email"
                  placeholder="relais-bouake@anouanexpress.ci"
                  value={form.contact_email}
                  onChange={(e) => setForm(p => ({ ...p, contact_email: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-orange-500 outline-none"
                />
              </div>

              {/* Coordonnées GPS & Presets Bouaké */}
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-orange-400 flex items-center gap-1.5 uppercase tracking-wider">
                    <Navigation size={14} /> Géolocalisation GPS (Optionnel)
                  </span>
                  <span className="text-[10px] text-slate-500">Pour guidage Google Maps</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-1">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="Ex: 7.6895"
                      value={form.gps_lat}
                      onChange={(e) => setForm(p => ({ ...p, gps_lat: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:border-orange-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-1">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="Ex: -5.0305"
                      value={form.gps_lng}
                      onChange={(e) => setForm(p => ({ ...p, gps_lng: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:border-orange-500 outline-none"
                    />
                  </div>
                </div>

                {/* Suggestions rapides de quartier à Bouaké */}
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1.5">Repères rapides à Bouaké :</span>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_LOCATIONS.map((loc) => (
                      <button
                        type="button"
                        key={loc.name}
                        onClick={() => setForm(p => ({ ...p, gps_lat: String(loc.lat), gps_lng: String(loc.lng) }))}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-orange-500/20 hover:text-orange-300 text-[10px] font-semibold text-slate-300 border border-slate-700 transition-colors"
                      >
                        {loc.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Switch statut */}
              <div className="flex items-center justify-between p-3 bg-slate-950/80 rounded-2xl border border-slate-800">
                <span className="text-xs font-bold text-white">Point relais actif et ouvert aux retraits</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm(p => ({ ...p, is_active: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500"></div>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-800 text-xs font-bold text-slate-400 hover:text-white transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting && <RefreshCw size={14} className="animate-spin" />}
                  <span>{editingStore ? 'Enregistrer les modifications' : 'Créer le point relais'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal Affectation / Création d'Agent pour le Magasin */}
      {agentModalStore && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
          onClick={(e) => e.target === e.currentTarget && setAgentModalStore(null)}
        >
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <span className="text-purple-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                  <Users size={12} /> Gestion des Agents
                </span>
                <h2 className="text-lg font-black text-white mt-1">Affecter un Agent au Relais</h2>
                <p className="text-xs text-orange-400 font-bold mt-0.5">
                  🏬 {agentModalStore.name} ({agentModalStore.city})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAgentModalStore(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Onglets Créer ou Assigner */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => setAgentModalTab('create')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                  agentModalTab === 'create'
                    ? 'bg-orange-500 text-slate-950 font-black shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                + Créer un nouvel Agent
              </button>
              <button
                type="button"
                onClick={() => setAgentModalTab('assign')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                  agentModalTab === 'assign'
                    ? 'bg-purple-500 text-white font-black shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Réaffecter un Agent existant
              </button>
            </div>

            {agentModalTab === 'create' ? (
              <form onSubmit={handleCreateAgentForStore} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Nom et Prénom de l'Agent *</label>
                  <input
                    required
                    type="text"
                    placeholder="Ex: Jean Kouassi"
                    value={agentForm.name}
                    onChange={(e) => setAgentForm((p) => ({ ...p, name: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-orange-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">Email professionnel *</label>
                    <input
                      required
                      type="email"
                      placeholder="agent@anouan.ci"
                      value={agentForm.email}
                      onChange={(e) => setAgentForm((p) => ({ ...p, email: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-orange-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">Téléphone mobile</label>
                    <input
                      type="tel"
                      placeholder="+225 07 00 00 00 00"
                      value={agentForm.phone}
                      onChange={(e) => setAgentForm((p) => ({ ...p, phone: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-orange-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Mot de passe initial *</label>
                  <div className="relative">
                    <input
                      required
                      minLength={8}
                      type={showAgentPassword ? 'text' : 'password'}
                      placeholder="8 caractères minimum"
                      value={agentForm.password}
                      onChange={(e) => setAgentForm((p) => ({ ...p, password: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 pr-10 text-xs text-white placeholder-slate-500 focus:border-orange-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAgentPassword((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                    >
                      {showAgentPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setAgentModalStore(null)}
                    className="px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-400 hover:text-white"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={agentSubmitting}
                    className="px-5 py-2.5 rounded-2xl bg-orange-500 hover:bg-orange-400 text-slate-950 text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {agentSubmitting && <RefreshCw size={13} className="animate-spin" />}
                    <span>Créer et Affecter</span>
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleAssignExistingAgent} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-2">
                    Sélectionner un Agent existant
                  </label>
                  <select
                    required
                    value={selectedExistingAgentId}
                    onChange={(e) => setSelectedExistingAgentId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-white focus:border-purple-500 outline-none cursor-pointer"
                  >
                    <option value="">-- Choisir un agent --</option>
                    {allAgents.map((ag) => (
                      <option key={ag.id} value={ag.id}>
                        {ag.name} · {ag.phone || ag.email} (Actuel: {ag.store_name || 'Non affecté'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setAgentModalStore(null)}
                    className="px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-400 hover:text-white"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={agentSubmitting || !selectedExistingAgentId}
                    className="px-5 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {agentSubmitting && <RefreshCw size={13} className="animate-spin" />}
                    <span>Réaffecter à ce magasin</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
