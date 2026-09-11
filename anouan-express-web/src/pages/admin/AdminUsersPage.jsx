// src/pages/admin/AdminUsersPage.jsx
// Gestion des comptes Clients — Dark Premium Orange

import React, { useState, useEffect } from 'react';
import { Users, Search, Filter, UserCheck, UserX, ShieldAlert, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '../../components/ui/Toast';
import PageHeader from '../../components/ui/PageHeader';
import { usersAPI } from '../../services/api';

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

  const stats = {
    total: users.length,
    clients: users.filter((u) => u.role === 'client').length,
    vendors: users.filter((u) => u.role === 'vendor').length,
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
          <button
            onClick={loadUsers}
            className="flex items-center gap-2 bg-slate-900 border border-slate-800 hover:border-orange-500/40 text-slate-300 hover:text-white px-4 py-2.5 rounded-2xl text-xs font-bold transition-all"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Rafraîchir
          </button>
        )}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Comptes', value: stats.total, icon: Users, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
          { label: 'Clients Actifs', value: stats.clients, icon: UserCheck, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
          { label: 'Vendeurs', value: stats.vendors, icon: ShieldAlert, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
          { label: 'Comptes Bannis', value: stats.banned, icon: UserX, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
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
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold ${status.classes}`}>{status.label}</span>
                    </td>
                    <td className="p-4 text-slate-300 font-bold hidden lg:table-cell">{u.orders}</td>
                    <td className="p-4 text-slate-400 hidden lg:table-cell">{u.joined}</td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleBan(u.id)}
                          title={u.status === 'banned' ? 'Réactiver' : 'Suspendre'}
                          className={`p-2 rounded-xl transition-colors ${u.status === 'banned' ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-amber-400 hover:bg-amber-500/10'}`}
                        >
                          {u.status === 'banned' ? <UserCheck size={15} /> : <UserX size={15} />}
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
    </div>
  );
}
