// src/pages/admin/AdminOrdersPage.jsx — Dark Premium Orange
import React, { useState, useEffect, useMemo } from 'react';
import { RefreshCcw, Eye, ShieldAlert, Loader2, X, Filter, CheckCircle2 } from 'lucide-react';
import { ordersAPI, disputesAPI } from '../../services/api';
import DataToolbar from '../../components/ui/DataToolbar';
import PageHeader from '../../components/ui/PageHeader';

const formatPrice = (p) => new Intl.NumberFormat('fr-CI').format(Number(p || 0)) + ' FCFA';
const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

export const normalizeStatus = (status) => {
  if (!status) return 'created';
  const s = String(status).toLowerCase().trim();
  if (['picked_up', 'retiré', 'retire', 'livré', 'livre', 'delivered', 'completed'].includes(s)) return 'picked_up';
  if (['ready_for_pickup', 'prêt au retrait', 'pret au retrait', 'prêt', 'pret', 'ready'].includes(s)) return 'ready_for_pickup';
  if (['shipped_to_store', 'en transit', 'en transit vers le magasin', 'in_transit', 'shipped'].includes(s)) return 'shipped_to_store';
  if (['preparing', 'en préparation', 'en preparation', 'preparation', 'processing'].includes(s)) return 'preparing';
  if (['dispute', 'litige', 'en litige', 'disputed'].includes(s)) return 'dispute';
  if (['cancelled', 'annulé', 'annule', 'canceled'].includes(s)) return 'cancelled';
  if (['created', 'créé', 'cree', 'pending', 'en attente'].includes(s)) return 'created';
  return s;
};

const STATUS_MAP = {
  picked_up:        { label: 'Retiré',           cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' },
  ready_for_pickup: { label: 'Prêt au retrait',  cls: 'bg-blue-500/15 text-blue-400 border-blue-500/25' },
  shipped_to_store: { label: 'En transit',        cls: 'bg-purple-500/15 text-purple-400 border-purple-500/25' },
  preparing:        { label: 'En préparation',    cls: 'bg-amber-500/15 text-amber-400 border-amber-500/25' },
  dispute:          { label: 'Litige',            cls: 'bg-red-500/15 text-red-400 border-red-500/25' },
  cancelled:        { label: 'Annulé',            cls: 'bg-slate-500/15 text-slate-400 border-slate-500/25' },
  created:          { label: 'Créé',              cls: 'bg-slate-500/15 text-slate-400 border-slate-500/25' },
};
const getStatus = (s) => {
  const norm = normalizeStatus(s);
  return STATUS_MAP[norm] || { label: s || 'Inconnu', cls: 'bg-slate-800 text-slate-400 border-slate-700' };
};

const STATUS_FILTERS = [
  { id: '', label: 'Tous les statuts' },
  { id: 'created', label: 'Créé' },
  { id: 'preparing', label: 'En préparation' },
  { id: 'shipped_to_store', label: 'En transit' },
  { id: 'ready_for_pickup', label: 'Prêt au retrait' },
  { id: 'picked_up', label: 'Retiré' },
  { id: 'dispute', label: 'En litige' },
  { id: 'cancelled', label: 'Annulé' },
];

export default function AdminOrdersPage() {
  const [orders, setOrders]             = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [disputeOrder, setDisputeOrder]   = useState(null);
  const [disputeAction, setDisputeAction] = useState('refund_client');
  const [adminNote, setAdminNote]         = useState('');
  const [submitting, setSubmitting]       = useState(false);

  useEffect(() => {
    loadOrders();
    const handleUpdate = () => loadOrders();
    window.addEventListener('anouan_order_status_updated', handleUpdate);
    return () => window.removeEventListener('anouan_order_status_updated', handleUpdate);
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await ordersAPI.getAll({ limit: 100 });
      const data = res.data?.data || res.data || [];
      const orderList = Array.isArray(data) ? data : [];
      setOrders(orderList.map(o => ({
        ...o,
        status: normalizeStatus(o.status || 'created'),
      })));
    } catch (err) {
      console.error('Erreur chargement commandes:', err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveDispute = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try {
      await disputesAPI.resolve(disputeOrder.id, { action: disputeAction, note: adminNote });
      setDisputeOrder(null); loadOrders();
    } catch (err) { alert(err.response?.data?.message || 'Erreur.'); }
    finally { setSubmitting(false); }
  };

  // Calcul du nombre de commandes par statut
  const statusCounts = useMemo(() => {
    const counts = { '': orders.length };
    orders.forEach((o) => {
      const st = normalizeStatus(o.status);
      counts[st] = (counts[st] || 0) + 1;
    });
    return counts;
  }, [orders]);

  // Filtrage combiné par statut ET par recherche
  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        String(o.id || '').toLowerCase().includes(q) ||
        (o.client_name || '').toLowerCase().includes(q) ||
        (o.client_phone || '').toLowerCase().includes(q) ||
        (o.store_name || '').toLowerCase().includes(q);

      const orderNormStatus = normalizeStatus(o.status);
      const matchesStatus = !statusFilter || orderNormStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  return (
    <div className="space-y-6 text-slate-100">
      <PageHeader
        eyebrow="Administration des Commandes"
        eyebrowIcon={RefreshCcw}
        title="Supervision des Commandes"
        subtitle={`${orders.length} commande${orders.length > 1 ? 's' : ''} au total — ${filtered.length} affichée${filtered.length > 1 ? 's' : ''}`}
        actions={(
          <button onClick={loadOrders} className="flex items-center gap-2 px-4 py-2.5 bg-orange-500/15 border border-orange-500/30 text-orange-400 text-xs font-bold rounded-2xl hover:bg-orange-500/25 transition-colors">
            <RefreshCcw size={14} className={loading ? 'animate-spin' : ''} /> Actualiser
          </button>
        )}
      />

      <DataToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Rechercher par ID commande, nom client, téléphone, boutique..."
        hasActiveFilters={Boolean(statusFilter || search)}
        onReset={() => { setStatusFilter(''); setSearch(''); }}
      >
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs text-white rounded-2xl px-4 py-2.5 outline-none focus:border-orange-500 cursor-pointer"
          >
            {STATUS_FILTERS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label} ({statusCounts[s.id] || 0})
              </option>
            ))}
          </select>
        </div>
      </DataToolbar>
        {/* Boutons d'accès direct par statut (Chips cliquables) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none pt-1 border-t border-slate-800/60">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider shrink-0 mr-1">Filtrer par :</span>
          {STATUS_FILTERS.map((s) => {
            const isSelected = statusFilter === s.id;
            const count = statusCounts[s.id] || 0;
            return (
              <button
                key={s.id || 'all'}
                onClick={() => setStatusFilter(s.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
                  isSelected
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                    : 'bg-slate-950/80 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                <span>{s.label}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  isSelected ? 'bg-black/30 text-white font-black' : 'bg-slate-800 text-slate-400 font-bold'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

      {/* Tableau */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-orange-400" />
            <p className="text-xs">Chargement...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs space-y-3">
            <p>
              Aucune commande trouvée {statusFilter ? `avec le statut « ${getStatus(statusFilter).label} »` : ''}
              {search ? ` pour « ${search} »` : ''}.
            </p>
            {(statusFilter || search) && (
              <button
                onClick={() => { setStatusFilter(''); setSearch(''); }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-orange-500/15 border border-orange-500/30 text-orange-400 font-bold rounded-xl hover:bg-orange-500/25 transition-colors"
              >
                <X size={13} /> Effacer les filtres
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-500 text-[10px] uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-5 py-4 font-bold">ID / Date</th>
                  <th className="px-5 py-4 font-bold">Client</th>
                  <th className="px-5 py-4 font-bold">Boutique</th>
                  <th className="px-5 py-4 font-bold">Paiement</th>
                  <th className="px-5 py-4 font-bold">Montant</th>
                  <th className="px-5 py-4 font-bold">Statut</th>
                  <th className="px-5 py-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((order) => {
                  const st = getStatus(order.status);
                  const isCash = order.payment_method === 'cash';
                  return (
                    <tr key={order.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-black text-white">#{order.id}</div>
                        <div className="text-slate-500 text-[10px] mt-0.5">{formatDate(order.created_at)}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-200">{order.client_name || 'Client'}</div>
                        {order.client_phone && <div className="text-[10px] text-slate-500">{order.client_phone}</div>}
                      </td>
                      <td className="px-5 py-4 text-slate-400">{order.store_name || 'Magasin Central'}</td>
                      <td className="px-5 py-4">
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                          isCash 
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}>
                          {isCash ? '💵 Espèces au retrait' : `📱 ${order.payment_method || 'Payé'}`}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-black text-orange-400">{formatPrice(order.total_amount)}</td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => setStatusFilter(normalizeStatus(order.status))}
                          title={`Filtrer par « ${st.label} »`}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-transform hover:scale-105 cursor-pointer ${st.cls}`}
                        >
                          {st.label}
                        </button>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {order.status === 'dispute' && (
                            <button onClick={() => setDisputeOrder(order)}
                              className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors" title="Résoudre le litige">
                              <ShieldAlert size={15} />
                            </button>
                          )}
                          <button onClick={() => setSelectedOrder(order)}
                            className="p-1.5 text-slate-500 hover:text-orange-400 hover:bg-orange-500/10 rounded-xl transition-colors">
                            <Eye size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Détail */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-sm font-black text-white">Commande <span className="text-orange-400">#{selectedOrder.id}</span></h2>
              <button onClick={() => setSelectedOrder(null)} className="text-slate-500 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors"><X size={18}/></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['Client', selectedOrder.client_name || 'N/A'],
                  ['Téléphone', selectedOrder.client_phone || 'Non renseigné'],
                  ['Boutique / Relais', selectedOrder.store_name || 'N/A'],
                  ['Mode de paiement', selectedOrder.payment_method === 'cash' ? '💵 Espèces au retrait' : `📱 ${selectedOrder.payment_method || 'Mobile Money'}`],
                  ['Montant', <span className="text-orange-400 font-black">{formatPrice(selectedOrder.total_amount)}</span>],
                  ['Date', formatDate(selectedOrder.created_at)],
                ].map(([k, v]) => (
                  <div key={k} className="bg-slate-950/50 border border-slate-800 p-3 rounded-2xl">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-1">{k}</p>
                    <p className="text-xs font-bold text-white">{v}</p>
                  </div>
                ))}
              </div>
              <div className="bg-slate-950/50 border border-slate-800 p-4 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Statut de la commande</p>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatus(selectedOrder.status).cls}`}>
                    {getStatus(selectedOrder.status).label}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-800/80">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-2">Changer le statut (Supervision Admin)</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'created', label: 'Créé' },
                      { id: 'preparing', label: 'En préparation' },
                      { id: 'shipped_to_store', label: 'En transit' },
                      { id: 'ready_for_pickup', label: 'Prêt au retrait' },
                      { id: 'picked_up', label: 'Retiré' },
                      { id: 'cancelled', label: 'Annulé' },
                    ].map((st) => (
                      <button
                        key={st.id}
                        onClick={async () => {
                          try {
                            await ordersAPI.updateStatus(selectedOrder.id, st.id);
                            window.dispatchEvent(new CustomEvent('anouan_order_status_updated', {
                              detail: { id: selectedOrder.id, status: st.id }
                            }));
                            setSelectedOrder(prev => ({ ...prev, status: st.id }));
                            loadOrders();
                          } catch (err) {
                            alert(err.response?.data?.message || 'Erreur lors de la mise à jour du statut.');
                          }
                        }}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${
                          selectedOrder.status === st.id 
                            ? 'bg-orange-500 text-white shadow-md' 
                            : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Litige */}
      {disputeOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-red-500/30 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-3">
              <div className="p-2 bg-red-500/15 border border-red-500/30 rounded-xl">
                <ShieldAlert className="text-red-400" size={18}/>
              </div>
              <div>
                <h2 className="text-sm font-black text-white">Résolution de Litige</h2>
                <p className="text-[10px] text-slate-400">Commande #{disputeOrder.id}</p>
              </div>
              <button onClick={() => setDisputeOrder(null)} className="ml-auto text-slate-500 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors"><X size={18}/></button>
            </div>
            <form onSubmit={handleResolveDispute} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Décision d'arbitrage</label>
                <select value={disputeAction} onChange={(e) => setDisputeAction(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-white outline-none focus:border-orange-500 cursor-pointer">
                  <option value="refund_client">Rembourser intégralement le client</option>
                  <option value="pay_vendor">Valider la commande (Payer le vendeur)</option>
                  <option value="partial_refund">Remboursement partiel (50%)</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Commentaire d'arbitrage</label>
                <textarea value={adminNote} onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Justifiez la décision..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-white placeholder-slate-600 outline-none focus:border-orange-500 h-24 resize-none"/>
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
                <button type="button" onClick={() => setDisputeOrder(null)}
                  className="px-4 py-2.5 text-slate-400 text-xs font-bold hover:bg-slate-800 rounded-2xl transition-colors">Annuler</button>
                <button type="submit" disabled={submitting}
                  className="px-5 py-2.5 bg-red-500/80 hover:bg-red-500 text-white text-xs font-black rounded-2xl transition-colors disabled:opacity-60 flex items-center gap-2">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Appliquer la décision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
