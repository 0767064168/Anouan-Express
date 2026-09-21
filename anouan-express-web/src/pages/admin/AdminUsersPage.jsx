// src/pages/admin/AdminUsersPage.jsx
// Gestion des comptes Clients — Dark Premium Orange

import React, { useState, useEffect } from 'react';
import { Users, Search, Filter, UserCheck, UserX, ShieldAlert, RefreshCw, ChevronLeft, ChevronRight, UserPlus, X, Eye, EyeOff, MapPin, Trash2, Pencil } from 'lucide-react';
import { useToast } from '../../components/ui/Toast';
import PageHeader from '../../components/ui/PageHeader';
import { adminAPI, storesAPI, usersAPI } from '../../services/api';

const ROLE_BADGE = {
  admin:  { label: 'Admin',  classes: 'bg-red-500/10 border border-red-500/30 text-red-400' },
  vendor: { label: 'Vendeur', classes: 'bg-blue-500/10 border border-blue-500/30 text-blue-400' },
  agent:  { label: 'Agent',  classes: 'bg-purple-500/10 border border-purple-500/30 text-purple-400' },
  client: { label: 'Client', classes: 'bg-slate-700/50 border border-slate-700 text-slate-300' },
};

const STATUS_BADGE = {
  active: { label: 'Actif',   classes: 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' },
  banned: { label: 'Banni',   classes: 'bg-red-500/10 border border-red-500/30 text-red-400' },
  pending:{ label: 'En attente', classes: 'bg-amber-500/10 border border-amber-500/30 text-amber-400' },
};

export default function AdminUsersPage() {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminSaving, setAdminSaving] = useState(false);
  const [adminForm, setAdminForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [showAgentForm, setShowAgentForm] = useState(false);
  const [showAgentPassword, setShowAgentPassword] = useState(false);
  const [agentSaving, setAgentSaving] = useState(false);
  const [agentForm, setAgentForm] = useState({ name: '', email: '', phone: '', password: '', storeId: '' });
  const [stores, setStores] = useState([]);
  const [agentToReassign, setAgentToReassign] = useState(null);
  const [reassignStoreId, setReassignStoreId] = useState('');
  const [reassigning, setReassigning] = useState(false);
  const [agentToEdit, setAgentToEdit] = useState(null);
  const [agentEditForm, setAgentEditForm] = useState({ name: '', phone: '', storeId: '' });
  const [agentEditing, setAgentEditing] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await usersAPI.getAll({ page, limit: 20 });
      const data = res.data?.data || res.data || [];
      const pagination = res.data?.pagination;
      setUsers(Array.isArray(data) ? data.map((user) => ({
        ...user,
        name: user.name || 'Utilisateur sans nom',
        email: user.email || '',
        phone: user.phone || '',
        orders: user.orders || 0,
        joined: user.created_at ? new Date(user.created_at).toLocaleDateString('fr-CI') : '—',
      })) : []);
      setTotalPages(Math.max(1, pagination?.totalPages || 1));
    } catch (err) {
      setUsers([]);
      toast.error('Impossible de charger les utilisateurs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    storesAPI.getAll({ activeOnly: 'true', limit: 100 })
      .then((res) => setStores(res.data?.data || res.data || []))
      .catch(() => toast.error('Impossible de charger les points relais.'));
  }, [page]);

  const filtered = users.filter((u) => {
    const normalizedSearch = search.toLowerCase();
    const matchSearch = !normalizedSearch
      || u.name.toLowerCase().includes(normalizedSearch)
      || u.email.toLowerCase().includes(normalizedSearch)
      || u.phone.includes(search);
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    const matchStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  const toggleSelect = (id) => setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  const toggleSelectAll = () => setSelected(selected.length === filtered.length ? [] : filtered.map((u) => u.id));

  const handleBan = async (userId) => {
    const u = users.find((x) => x.id === userId);
    if (!u) return;
    const nextStatus = u.status === 'banned' ? 'active' : 'banned';
    const actionLabel = nextStatus === 'active' ? 'réactiver' : 'suspendre';
    if (!window.confirm(`Voulez-vous vraiment ${actionLabel} le compte de ${u.name} ?`)) return;
    try {
      await usersAPI.updateStatus(userId, nextStatus);
      await loadUsers();
      toast.success(`Compte de ${u.name} ${nextStatus === 'active' ? 'réactivé' : 'suspendu'}.`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Impossible de modifier le statut du compte.');
    }
  };

  const handleDelete = async (userId) => {
    const user = users.find((item) => item.id === userId);
    if (!user) return;
    if (!window.confirm(`Supprimer définitivement le compte de ${user.name} ? Cette action est irréversible.`)) return;
    try {
      await usersAPI.delete(userId);
      await loadUsers();
      toast.success(`Compte de ${user.name} supprimé.`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Impossible de supprimer ce compte.');
    }
  };

  const handleCreateAdmin = async (event) => {
    event.preventDefault();
    setAdminSaving(true);
    try {
      await adminAPI.createAdmin(adminForm);
      setAdminForm({ name: '', email: '', phone: '', password: '' });
      setShowAdminForm(false);
      setShowAdminPassword(false);
      await loadUsers();
      toast.success('Compte Admin créé avec succès.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Impossible de créer le compte Admin.');
    } finally {
      setAdminSaving(false);
    }
  };

  const handleCreateAgent = async (event) => {
    event.preventDefault();
    setAgentSaving(true);
    try {
      await adminAPI.createAgent(agentForm);
      setAgentForm({ name: '', email: '', phone: '', password: '', storeId: '' });
      setShowAgentForm(false);
      setShowAgentPassword(false);
      await loadUsers();
      toast.success('Compte Agent créé avec succès.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Impossible de créer le compte Agent.');
    } finally {
      setAgentSaving(false);
    }
  };

  const openReassignModal = (agent) => {
    setAgentToReassign(agent);
    setReassignStoreId(agent.store_id || '');
  };

  const handleReassignAgent = async (event) => {
    event.preventDefault();
    if (!agentToReassign || !reassignStoreId) return;
    setReassigning(true);
    try {
      await adminAPI.assignAgentStore(agentToReassign.id, reassignStoreId);
      setAgentToReassign(null);
      await loadUsers();
      toast.success(`Affectation de ${agentToReassign.name} mise à jour.`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Impossible de modifier l’affectation.');
    } finally {
      setReassigning(false);
    }
  };

  const openAgentEdit = (agent) => {
    setAgentToEdit(agent);
    setAgentEditForm({ name: agent.name || '', phone: agent.phone || '', storeId: agent.store_id || '' });
  };

  const handleAgentEdit = async (event) => {
    event.preventDefault();
    if (!agentToEdit) return;
    setAgentEditing(true);
    try {
      await adminAPI.updateAgent(agentToEdit.id, agentEditForm);
      setAgentToEdit(null);
      await loadUsers();
      toast.success(`Compte de ${agentToEdit.name} mis à jour.`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Impossible de modifier le compte Agent.');
    } finally {
      setAgentEditing(false);
    }
  };

  const stats = {
    total: users.length,
    clients: users.filter((u) => u.role === 'client').length,
    vendors: users.filter((u) => u.role === 'vendor').length,
    agents: users.filter((u) => u.role === 'agent').length,
    admins: users.filter((u) => u.role === 'admin').length,
    banned: users.filter((u) => u.status === 'banned').length,
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <PageHeader
        eyebrow="Administration"
        eyebrowIcon={Users}
        title="Gestion des Utilisateurs"
        subtitle={`${stats.total} comptes enregistrés sur la plateforme`}
        actions={(
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAdminForm(true)}
              className="flex items-center gap-2 bg-red-500 hover:bg-red-400 text-white px-4 py-2.5 rounded-2xl text-xs font-black transition-all"
            >
              <UserPlus size={14} /> Créer un Admin
            </button>
            <button
              onClick={() => setShowAgentForm(true)}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-slate-950 px-4 py-2.5 rounded-2xl text-xs font-black transition-all"
            >
              <UserPlus size={14} /> Créer un Agent
            </button>
            <button
              onClick={loadUsers}
              className="flex items-center gap-2 bg-slate-900 border border-slate-800 hover:border-orange-500/40 text-slate-300 hover:text-white px-4 py-2.5 rounded-2xl text-xs font-bold transition-all"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Rafraîchir
            </button>
          </div>
        )}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Comptes', value: stats.total, icon: Users, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
          { label: 'Clients Actifs', value: stats.clients, icon: UserCheck, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
          { label: 'Vendeurs', value: stats.vendors, icon: ShieldAlert, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
          { label: 'Agents Guichet', value: stats.agents, icon: Users, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
        ].map((kpi) => (
          <div key={kpi.label} className="glass-panel rounded-3xl p-5 border border-slate-800 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${kpi.bg}`}>
              <kpi.icon size={22} className={kpi.color} />
            </div>
            <div>
              <p className="text-2xl font-black text-white">{kpi.value}</p>
              <p className="text-[11px] text-slate-400 font-semibold">{kpi.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Onglets de filtrage par rôle */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: 'all', label: 'Tous les comptes', count: stats.total },
          { id: 'client', label: 'Clients', count: stats.clients },
          { id: 'vendor', label: 'Vendeurs', count: stats.vendors },
          { id: 'agent', label: 'Agents Guichet', count: stats.agents },
          { id: 'admin', label: 'Administrateurs', count: stats.admins },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setRoleFilter(tab.id)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 border ${
              roleFilter === tab.id
                ? 'bg-orange-500 text-slate-950 font-black border-orange-400 shadow-md shadow-orange-500/20'
                : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              roleFilter === tab.id ? 'bg-slate-950/30 text-slate-950' : 'bg-slate-800 text-slate-300'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Filtres & Recherche */}
      <div className="glass-panel rounded-3xl border border-slate-800 p-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom, email ou téléphone..."
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-orange-500 outline-none"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:border-orange-500 outline-none cursor-pointer"
        >
          <option value="all">Tous les rôles</option>
          <option value="client">Client</option>
          <option value="vendor">Vendeur</option>
          <option value="agent">Agent</option>
          <option value="admin">Admin</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:border-orange-500 outline-none cursor-pointer"
        >
          <option value="all">Tous les statuts</option>
          <option value="active">Actifs</option>
          <option value="banned">Bannis</option>
        </select>
      </div>

      {/* Tableau Utilisateurs */}
      <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60">
                <th className="p-4 text-left">
                  <input
                    type="checkbox"
                    checked={selected.length === filtered.length && filtered.length > 0}
                    onChange={toggleSelectAll}
                    className="accent-orange-500"
                  />
                </th>
                <th className="p-4 text-left text-slate-400 font-bold uppercase tracking-wider">Utilisateur</th>
                <th className="p-4 text-left text-slate-400 font-bold uppercase tracking-wider hidden md:table-cell">Contact</th>
                <th className="p-4 text-left text-slate-400 font-bold uppercase tracking-wider">Rôle</th>
                <th className="p-4 text-left text-slate-400 font-bold uppercase tracking-wider hidden xl:table-cell">Affectation</th>
                <th className="p-4 text-left text-slate-400 font-bold uppercase tracking-wider">Statut</th>
                <th className="p-4 text-left text-slate-400 font-bold uppercase tracking-wider hidden lg:table-cell">Commandes</th>
                <th className="p-4 text-left text-slate-400 font-bold uppercase tracking-wider hidden lg:table-cell">Inscription</th>
                <th className="p-4 text-right text-slate-400 font-bold uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((u) => {
                const role = ROLE_BADGE[u.role] || ROLE_BADGE.client;
                const status = STATUS_BADGE[u.status] || STATUS_BADGE.active;
                return (
                  <tr key={u.id} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selected.includes(u.id)}
                        onChange={() => toggleSelect(u.id)}
                        className="accent-orange-500"
                      />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 font-black text-xs shrink-0">
                          {u.name[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-white">{u.name}</p>
                          <p className="text-slate-500 text-[10px]">#{u.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <p className="text-slate-300">{u.email}</p>
                      <p className="text-slate-500 text-[10px]">{u.phone}</p>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold ${role.classes}`}>{role.label}</span>
                    </td>
                    <td className="p-4 hidden xl:table-cell">
                      {u.role === 'agent' ? (
                        <div>
                          <p className="text-slate-200 font-semibold">{u.store_name || 'Non affecté'}</p>
                          <p className="text-slate-500 text-[10px]">{u.store_city || 'Ville non définie'}</p>
                        </div>
                      ) : <span className="text-slate-600">—</span>}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold ${status.classes}`}>{status.label}</span>
                    </td>
                    <td className="p-4 text-slate-300 font-bold hidden lg:table-cell">{u.orders}</td>
                    <td className="p-4 text-slate-400 hidden lg:table-cell">{u.joined}</td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-1">
                        {u.role === 'agent' && (
                          <button
                            onClick={() => openAgentEdit(u)}
                            title="Modifier le compte Agent"
                            className="p-2 rounded-xl text-slate-300 hover:bg-slate-800 transition-colors"
                          >
                            <Pencil size={15} />
                          </button>
                        )}
                        {u.role === 'agent' && (
                          <button
                            onClick={() => openReassignModal(u)}
                            title="Modifier le point relais"
                            className="p-2 rounded-xl text-orange-400 hover:bg-orange-500/10 transition-colors"
                          >
                            <MapPin size={15} />
                          </button>
                        )}
                        <button
                          onClick={() => handleBan(u.id)}
                          title={u.status === 'banned' ? 'Réactiver' : 'Suspendre'}
                          className={`p-2 rounded-xl transition-colors ${u.status === 'banned' ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-amber-400 hover:bg-amber-500/10'}`}
                        >
                          {u.status === 'banned' ? <UserCheck size={15} /> : <UserX size={15} />}
                        </button>
                        <button
                          onClick={() => handleDelete(u.id)}
                          title="Supprimer le compte"
                          className="p-2 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="py-16 text-center text-slate-500">
              <Users size={40} className="mx-auto mb-3 text-slate-700" />
              <p className="font-bold">Aucun utilisateur trouvé pour ces filtres.</p>
            </div>
          )}
        </div>

        {/* Pagination Footer */}
        <div className="border-t border-slate-800 px-5 py-3 flex items-center justify-between text-xs text-slate-400">
          <span>{filtered.length} utilisateur{filtered.length > 1 ? 's' : ''} affiché{filtered.length > 1 ? 's' : ''}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page === 1}
              className="p-1.5 hover:text-white hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Page précédente"
            ><ChevronLeft size={16} /></button>
            <span className="px-3 py-1 bg-orange-500 text-slate-950 font-black rounded-lg">{page} / {totalPages}</span>
            <button
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={page >= totalPages}
              className="p-1.5 hover:text-white hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Page suivante"
            ><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>

      {showAdminForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm" onClick={(event) => event.target === event.currentTarget && setShowAdminForm(false)}>
          <form onSubmit={handleCreateAdmin} className="w-full max-w-lg max-h-[calc(100vh-2rem)] overflow-y-auto bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-red-400 text-[11px] font-black uppercase tracking-widest">Accès administration</p>
                <h2 className="text-xl font-black text-white mt-1">Créer un compte Admin</h2>
                <p className="text-xs text-slate-400 mt-1">Cet administrateur pourra gérer la plateforme et créer d’autres comptes.</p>
              </div>
              <button type="button" onClick={() => setShowAdminForm(false)} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800" aria-label="Fermer">
                <X size={18} />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                ['name', 'Nom complet', 'Marie Koffi', 'text'],
                ['email', 'Email admin', 'admin2@anouan.ci', 'email'],
                ['phone', 'Téléphone', '0700000002', 'tel'],
              ].map(([field, label, placeholder, type]) => (
                <label key={field} className={`space-y-1.5 ${field === 'name' || field === 'email' ? 'sm:col-span-2' : ''}`}>
                  <span className="text-xs font-bold text-slate-300">{label}</span>
                  <input
                    required={field !== 'phone'}
                    type={type}
                    value={adminForm[field]}
                    onChange={(event) => setAdminForm((current) => ({ ...current, [field]: event.target.value }))}
                    placeholder={placeholder}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:border-orange-500 outline-none"
                  />
                </label>
              ))}
              <label className="space-y-1.5 sm:col-span-2">
                <span className="text-xs font-bold text-slate-300">Mot de passe initial</span>
                <div className="relative">
                  <input
                    required
                    minLength={8}
                    type={showAdminPassword ? 'text' : 'password'}
                    value={adminForm.password}
                    onChange={(event) => setAdminForm((current) => ({ ...current, password: event.target.value }))}
                    placeholder="8 caractères minimum"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 pr-11 text-sm text-white placeholder-slate-600 focus:border-orange-500 outline-none"
                  />
                  <button type="button" onClick={() => setShowAdminPassword((current) => !current)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-white" aria-label={showAdminPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}>
                    {showAdminPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowAdminForm(false)} className="px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-300 hover:bg-slate-800">Annuler</button>
              <button type="submit" disabled={adminSaving} className="px-4 py-2.5 rounded-2xl bg-red-500 hover:bg-red-400 disabled:opacity-50 text-white text-xs font-black">
                {adminSaving ? 'Création...' : 'Créer le compte'}
              </button>
            </div>
          </form>
        </div>
      )}

      {showAgentForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm" onClick={(event) => event.target === event.currentTarget && setShowAgentForm(false)}>
          <form onSubmit={handleCreateAgent} className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-orange-400 text-[11px] font-black uppercase tracking-widest">Accès équipe</p>
                <h2 className="text-xl font-black text-white mt-1">Créer un compte Agent</h2>
                <p className="text-xs text-slate-400 mt-1">L’Agent pourra se connecter avec ces identifiants.</p>
              </div>
              <button type="button" onClick={() => setShowAgentForm(false)} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800" aria-label="Fermer">
                <X size={18} />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                ['name', 'Nom complet', 'Jean Kouassi', 'text'],
                ['email', 'Email professionnel', 'agent@anouan.ci', 'email'],
                ['phone', 'Téléphone', '0700000000', 'tel'],
              ].map(([field, label, placeholder, type]) => (
                <label key={field} className={`space-y-1.5 ${field === 'name' || field === 'email' ? 'sm:col-span-2' : ''}`}>
                  <span className="text-xs font-bold text-slate-300">{label}</span>
                  <input
                    required={field !== 'phone'}
                    type={type}
                    value={agentForm[field]}
                    onChange={(event) => setAgentForm((current) => ({ ...current, [field]: event.target.value }))}
                    placeholder={placeholder}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:border-orange-500 outline-none"
                  />
                </label>
              ))}
              <label className="space-y-1.5 sm:col-span-2">
                <span className="text-xs font-bold text-slate-300">Point relais / magasin</span>
                <select
                  required
                  value={agentForm.storeId}
                  onChange={(event) => setAgentForm((current) => ({ ...current, storeId: event.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white focus:border-orange-500 outline-none"
                >
                  <option value="">Sélectionner un point relais</option>
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>{store.name} · {store.city}</option>
                  ))}
                </select>
                {agentForm.storeId && (
                  <p className="text-[11px] text-orange-400 font-semibold">
                    Ville d’affectation : {stores.find((store) => String(store.id) === String(agentForm.storeId))?.city || '—'}
                  </p>
                )}
              </label>
              <label className="space-y-1.5 sm:col-span-2">
                <span className="text-xs font-bold text-slate-300">Mot de passe initial</span>
                <div className="relative">
                  <input
                    required
                    minLength={8}
                    type={showAgentPassword ? 'text' : 'password'}
                    value={agentForm.password}
                    onChange={(event) => setAgentForm((current) => ({ ...current, password: event.target.value }))}
                    placeholder="8 caractères minimum"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 pr-11 text-sm text-white placeholder-slate-600 focus:border-orange-500 outline-none"
                  />
                  <button type="button" onClick={() => setShowAgentPassword((current) => !current)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-white" aria-label={showAgentPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}>
                    {showAgentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowAgentForm(false)} className="px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-300 hover:bg-slate-800">Annuler</button>
              <button type="submit" disabled={agentSaving} className="px-4 py-2.5 rounded-2xl bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-slate-950 text-xs font-black">
                {agentSaving ? 'Création...' : 'Créer le compte'}
              </button>
            </div>
          </form>
        </div>
      )}

      {agentToReassign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm" onClick={(event) => event.target === event.currentTarget && setAgentToReassign(null)}>
          <form onSubmit={handleReassignAgent} className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-orange-400 text-[11px] font-black uppercase tracking-widest">Affectation Agent</p>
                <h2 className="text-xl font-black text-white mt-1">Changer le point relais</h2>
                <p className="text-xs text-slate-400 mt-1">{agentToReassign.name}</p>
              </div>
              <button type="button" onClick={() => setAgentToReassign(null)} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800" aria-label="Fermer">
                <X size={18} />
              </button>
            </div>
            <label className="space-y-1.5 block">
              <span className="text-xs font-bold text-slate-300">Nouveau magasin / point relais</span>
              <select
                required
                value={reassignStoreId}
                onChange={(event) => setReassignStoreId(event.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white focus:border-orange-500 outline-none"
              >
                <option value="">Sélectionner un point relais</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>{store.name} · {store.city}</option>
                ))}
              </select>
            </label>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setAgentToReassign(null)} className="px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-300 hover:bg-slate-800">Annuler</button>
              <button type="submit" disabled={reassigning || !reassignStoreId} className="px-4 py-2.5 rounded-2xl bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-slate-950 text-xs font-black">
                {reassigning ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </div>
      )}

      {agentToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm" onClick={(event) => event.target === event.currentTarget && setAgentToEdit(null)}>
          <form onSubmit={handleAgentEdit} className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-orange-400 text-[11px] font-black uppercase tracking-widest">Gestion Agent</p>
                <h2 className="text-xl font-black text-white mt-1">Modifier le compte</h2>
              </div>
              <button type="button" onClick={() => setAgentToEdit(null)} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800" aria-label="Fermer">
                <X size={18} />
              </button>
            </div>
            <label className="space-y-1.5 block">
              <span className="text-xs font-bold text-slate-300">Nom complet</span>
              <input required minLength={2} value={agentEditForm.name} onChange={(event) => setAgentEditForm((current) => ({ ...current, name: event.target.value }))} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white focus:border-orange-500 outline-none" />
            </label>
            <label className="space-y-1.5 block">
              <span className="text-xs font-bold text-slate-300">Téléphone</span>
              <input type="tel" value={agentEditForm.phone} onChange={(event) => setAgentEditForm((current) => ({ ...current, phone: event.target.value }))} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white focus:border-orange-500 outline-none" />
            </label>
            <label className="space-y-1.5 block">
              <span className="text-xs font-bold text-slate-300">Point relais / magasin</span>
              <select required value={agentEditForm.storeId} onChange={(event) => setAgentEditForm((current) => ({ ...current, storeId: event.target.value }))} className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white focus:border-orange-500 outline-none">
                <option value="">Sélectionner un point relais</option>
                {stores.map((store) => <option key={store.id} value={store.id}>{store.name} · {store.city}</option>)}
              </select>
            </label>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setAgentToEdit(null)} className="px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-300 hover:bg-slate-800">Annuler</button>
              <button type="submit" disabled={agentEditing} className="px-4 py-2.5 rounded-2xl bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-slate-950 text-xs font-black">{agentEditing ? 'Enregistrement...' : 'Enregistrer'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
