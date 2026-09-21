// src/pages/vendor/VendorOrdersPage.jsx
// Commandes reçues par le vendeur + mise à jour du statut + Impression Bordereau A4 avec QR Code

import React, { useState, useEffect } from 'react';
import { Filter, Eye, X, Package, Printer, Download, Loader2 } from 'lucide-react';
import { ordersAPI, financeAPI } from '../../services/api';
import { downloadCSVBlob } from '../../utils/exportUtils';
import DeliverySlipModal from '../../components/vendor/DeliverySlipModal';
import DataToolbar from '../../components/ui/DataToolbar';
import PageHeader from '../../components/ui/PageHeader';

const formatPrice = (p) => new Intl.NumberFormat('fr-CI').format(Number(p || 0)) + ' FCFA';
const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const STATUS_OPTIONS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'created', label: 'Créé' },
  { value: 'preparing', label: 'En préparation' },
  { value: 'shipped_to_store', label: 'Expédié au magasin' },
  { value: 'received_at_store', label: 'Reçu au magasin' },
  { value: 'ready_for_pickup', label: 'Prêt au retrait' },
  { value: 'picked_up', label: 'Retiré' },
  { value: 'cancelled', label: 'Annulé' },
];

const STATUS_COLORS = {
  created: 'bg-slate-800/50 text-slate-300 border-slate-700',
  preparing: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  shipped_to_store: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  received_at_store: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  ready_for_pickup: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  picked_up: 'bg-teal-500/10 text-teal-400 border-teal-500/30',
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/30',
};

const NEXT_STATUS = {
  created: 'preparing',
  preparing: 'shipped_to_store',
};

export default function VendorOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showSlipModal, setShowSlipModal] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadOrders();
    const handleSync = () => loadOrders();
    window.addEventListener('anouan_order_status_updated', handleSync);
    return () => window.removeEventListener('anouan_order_status_updated', handleSync);
  }, [page, filterStatus]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await ordersAPI.getVendorOrders({ page, limit: 15, status: filterStatus || undefined });
      const data = res.data?.data || res.data || [];
      const orderList = Array.isArray(data) ? data : [];
      setOrders(orderList.map(o => ({
        ...o,
        createdAt: o.created_at || o.createdAt,
        total_amount: o.total_amount || o.totalAmount,
        status: o.status || 'created',
      })));
      setTotalPages(res.data?.pagination?.totalPages || 1);
    } catch (err) {
      console.error('Erreur chargement commandes vendeur:', err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, itemId, newStatus) => {
    setUpdating(true);
    try {
      if (itemId) {
        await ordersAPI.updateItemStatus(orderId, itemId, { status: newStatus });
      } else {
        await ordersAPI.updateStatus(orderId, newStatus);
      }

      window.dispatchEvent(new CustomEvent('anouan_order_status_updated', {
        detail: { id: orderId, status: newStatus }
      }));

      await loadOrders();
      if (selectedOrder && String(selectedOrder.id) === String(orderId)) {
        setSelectedOrder(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la mise à jour.');
    } finally {
      setUpdating(false);
    }
  };

  const [exporting, setExporting] = useState(false);

  const handleExportOrders = async () => {
    setExporting(true);
    try {
      const res = await financeAPI.exportVendorOrders();
      downloadCSVBlob(res.data, 'mes_commandes_vendeur.csv');
    } catch (err) {
      console.error('Erreur export commandes:', err);
      alert('Erreur lors du téléchargement de l\'export des commandes.');
    } finally {
      setExporting(false);
    }
  };

  const filtered = orders.filter((o) => {
    const matchesSearch = String(o.id).includes(search) || (o.client_name || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !filterStatus || o.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-5 bg-slate-950 p-6 min-h-screen">
      <PageHeader
        eyebrow="Espace Vendeur"
        eyebrowIcon={Package}
        title="Commandes reçues"
        subtitle={`${orders.length} commande(s) à traiter`}
        actions={(
          <button
            onClick={handleExportOrders}
            disabled={exporting || orders.length === 0}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold px-4 py-2.5 rounded-2xl transition-colors disabled:opacity-50 text-xs shadow-sm"
            title="Télécharger l'historique de vos commandes au format CSV / Excel"
          >
            {exporting ? (
              <Loader2 size={15} className="animate-spin text-orange-400" />
            ) : (
              <Download size={15} className="text-orange-400" />
            )}
            <span>Exporter Commandes (CSV)</span>
          </button>
        )}
      />

      <DataToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Rechercher par commande ou client..."
        hasActiveFilters={Boolean(search || filterStatus)}
        onReset={() => { setSearch(''); setFilterStatus(''); setPage(1); }}
      >
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-500" />
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
            className="bg-slate-950 border border-slate-800 rounded-2xl text-xs text-white focus:border-orange-500 outline-none px-4 py-2.5 cursor-pointer transition-colors"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </DataToolbar>

      {/* Liste des commandes */}
      {loading ? (
        <div className="text-center py-12 text-slate-500 text-xs">Chargement des commandes...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-slate-900/60 border border-slate-800 rounded-3xl p-8">
          <Package className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-400 font-bold text-sm">Aucune commande trouvée</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((order) => (
            <div key={order.id} className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 hover:border-slate-700 transition-all space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-mono font-bold text-orange-400">#{String(order.id).slice(0, 10)}</span>
                  <h3 className="font-bold text-white text-sm mt-0.5">{order.client_name || 'Client Anouan Express'}</h3>
                  <p className="text-[10px] text-slate-500">{formatDate(order.createdAt || order.created_at)}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${STATUS_COLORS[order.status] || 'bg-slate-800 text-slate-300'}`}>
                  {STATUS_OPTIONS.find(s => s.value === order.status)?.label || order.status}
                </span>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Montant</span>
                  <span className="font-black text-white text-base">{formatPrice(order.total_amount)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setSelectedOrder(order); setShowSlipModal(true); }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-orange-500/10 border border-orange-500/30 text-orange-400 hover:bg-orange-500/20 text-xs font-bold rounded-2xl transition-all"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Bordereau
                  </button>
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="p-2 bg-slate-800 text-slate-300 hover:text-white rounded-2xl transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Détail Commande */}
      {selectedOrder && !showSlipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <h2 className="font-black text-white text-lg">
                Commande #{String(selectedOrder.id).slice(0, 8).toUpperCase()}
              </h2>
              <button onClick={() => setSelectedOrder(null)} className="p-2 text-slate-400 hover:bg-slate-800 hover:text-white rounded-2xl transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1 font-bold">Montant total</p>
                  <p className="font-black text-orange-500 text-lg">{formatPrice(selectedOrder.total_amount)}</p>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2 font-bold">Statut actuel</p>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border inline-block ${STATUS_COLORS[selectedOrder.status] || ''}`}>
                    {STATUS_OPTIONS.find(s => s.value === selectedOrder.status)?.label || selectedOrder.status}
                  </span>
                </div>
              </div>

              <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 space-y-3">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Actions Vendeur sur la commande</p>
                <div className="flex flex-wrap gap-2">
                  {selectedOrder.status === 'created' && (
                    <button
                      onClick={() => handleUpdateStatus(selectedOrder.id, null, 'preparing')}
                      disabled={updating}
                      className="flex-1 py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl transition-all shadow-md"
                    >
                      {updating ? 'Mise à jour...' : '🟡 Démarrer la préparation du colis'}
                    </button>
                  )}
                  {selectedOrder.status === 'preparing' && (
                    <button
                      onClick={() => handleUpdateStatus(selectedOrder.id, null, 'shipped_to_store')}
                      disabled={updating}
                      className="flex-1 py-2.5 px-4 bg-blue-500 hover:bg-blue-600 text-white font-black text-xs rounded-xl transition-all shadow-md"
                    >
                      {updating ? 'Mise à jour...' : '🚚 Expédier / Déposer au Magasin Relais'}
                    </button>
                  )}
                  {selectedOrder.status === 'shipped_to_store' && (
                    <div className="text-xs text-blue-400 font-bold flex items-center gap-2">
                      <span>En route vers le Magasin Relais (en attente de réception par l'Agent).</span>
                    </div>
                  )}
                  {selectedOrder.status === 'ready_for_pickup' && (
                    <div className="text-xs text-emerald-400 font-bold flex items-center gap-2">
                      <span>✓ Réceptionné au Magasin Relais. Prêt pour retrait par le client.</span>
                    </div>
                  )}
                  {selectedOrder.status === 'picked_up' && (
                    <div className="text-xs text-teal-400 font-bold flex items-center gap-2">
                      <span>✓ Colis retiré avec succès par le client.</span>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => setShowSlipModal(true)}
                className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-500/20"
              >
                <Printer className="w-4 h-4" />
                Imprimer le Bordereau d&apos;Expédition (A4 + QR Code)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Bordereau Imprimable */}
      <DeliverySlipModal
        isOpen={showSlipModal}
        onClose={() => setShowSlipModal(false)}
        order={selectedOrder}
        vendorName={selectedOrder?.vendor_name || 'Maison du Pagne Kita Bouaké'}
        storeLocation="Quartier Commerce, Bouaké"
      />
    </div>
  );
}
