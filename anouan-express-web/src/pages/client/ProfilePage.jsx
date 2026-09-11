// src/pages/client/ProfilePage.jsx
// Page de Profil Client dynamique connectée avec AuthContext, API des commandes et gestion des données

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Package, Heart, Settings, MapPin, LogOut, ChevronRight, QrCode, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ordersAPI, usersAPI } from '../../services/api';
import { QRCodeSVG } from 'qrcode.react';
import PageHeader from '../../components/ui/PageHeader';

const formatPrice = (p) => new Intl.NumberFormat('fr-CI').format(Number(p || 0)) + ' FCFA';

export default function ProfilePage() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Formulaire d'édition profil
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  useEffect(() => {
    loadMyOrders();

    const handleSync = () => loadMyOrders();
    window.addEventListener('anouan_order_status_updated', handleSync);
    return () => window.removeEventListener('anouan_order_status_updated', handleSync);
  }, []);

  const loadMyOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await ordersAPI.getMyOrders({ page: 1, limit: 50 });
      const apiData = res.data?.data || res.data || [];
      setOrders(Array.isArray(apiData) ? apiData : []);
    } catch {
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/auth/login');
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg('');
    try {
      const res = await usersAPI.updateMe(profileForm);
      const updated = res.data?.data || res.data;
      if (updated) updateUser(updated);
      setProfileMsg('Profil mis à jour avec succès !');
      setTimeout(() => setProfileMsg(''), 3000);
    } catch (err) {
      setProfileMsg(err.response?.data?.message || 'Erreur lors de la mise à jour du profil.');
    } finally {
      setSavingProfile(false);
    }
  };

  const activeCodes = orders.filter((o) => o.status === 'ready_for_pickup' || o.status === 'received_at_store');

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ready_for_pickup':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold border border-emerald-500/30 text-emerald-400 bg-emerald-500/10">Prêt au retrait</span>;
      case 'shipped_to_store':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold border border-blue-500/30 text-blue-400 bg-blue-500/10">En transit (Relais)</span>;
      case 'picked_up':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold border border-slate-700 text-slate-400 bg-slate-800/80">Retiré</span>;
      case 'preparing':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold border border-amber-500/30 text-amber-400 bg-amber-500/10">En préparation</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold border border-slate-800 text-slate-400 bg-slate-900">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <PageHeader
          eyebrow="Espace Client"
          eyebrowIcon={User}
          title="Mon Profil"
          subtitle="Gérez vos commandes, vos codes de retrait et les informations de votre compte."
          className="mb-8"
        />
        <div className="flex flex-col md:flex-row gap-8">
          {/* Navigation Latérale */}
          <div className="w-full md:w-1/4">
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden sticky top-24">
              {/* Carte Profil */}
              <div className="p-6 bg-slate-900 border-b border-slate-800 text-center">
                <div className="w-16 h-16 bg-slate-800 rounded-full mx-auto flex items-center justify-center text-2xl font-black mb-3 border border-slate-700 text-white">
                  {user?.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <h2 className="text-lg text-white font-black truncate">{user?.name || 'Mon Profil'}</h2>
                <p className="text-slate-400 text-xs mt-0.5 truncate">{user?.email || user?.phone}</p>
              </div>

              {/* Menu */}
              <nav className="p-4 space-y-1">
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs font-bold transition-colors ${
                    activeTab === 'orders' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-slate-400 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3"><Package className="w-4 h-4" /> Mes Commandes</div>
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setActiveTab('codes')}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs font-bold transition-colors ${
                    activeTab === 'codes' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-slate-400 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3"><QrCode className="w-4 h-4" /> Codes de Retrait</div>
                  {activeCodes.length > 0 && (
                    <span className="bg-slate-950 text-white text-[10px] font-black px-2 py-0.5 rounded-full border border-slate-700">{activeCodes.length}</span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs font-bold transition-colors ${
                    activeTab === 'settings' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-slate-400 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3"><Settings className="w-4 h-4" /> Paramètres du compte</div>
                  <ChevronRight className="w-4 h-4" />
                </button>

                <div className="pt-4 mt-4 border-t border-slate-800">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl text-red-500 hover:bg-red-500/10 text-xs font-bold transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> Déconnexion
                  </button>
                </div>
              </nav>
            </div>
          </div>

          {/* Contenu Principal */}
          <div className="w-full md:w-3/4">
            {/* Onglet Commandes */}
            {activeTab === 'orders' && (
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 md:p-8">
                <h2 className="text-xl text-white font-black mb-6">Historique des commandes</h2>
                {loadingOrders ? (
                  <div className="py-12 text-center text-slate-500">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-orange-500" />
                    Chargement de vos commandes...
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <Package className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                    <p className="font-bold text-xs">Vous n'avez pas encore passé de commande.</p>
                    <Link to="/catalog" className="inline-block mt-4 text-orange-500 font-bold text-xs hover:underline">
                      Découvrir le catalogue →
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="border border-slate-800 bg-slate-950 rounded-3xl p-5 hover:border-orange-500/50 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <span className="text-white font-black">#{order.id}</span>
                            {getStatusBadge(order.status)}
                          </div>
                          <p className="text-slate-400 text-xs mt-1">
                            Passée le {new Date(order.created_at || Date.now()).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                          <span className="font-black text-lg text-white">{formatPrice(order.total_amount)}</span>
                          <Link
                            to={`/orders/${order.id}/tracking`}
                            className="bg-slate-800/60 border border-slate-700 text-slate-300 rounded-2xl px-4 py-2 text-xs font-bold hover:bg-slate-700 transition-colors"
                          >
                            Suivre / Code
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Onglet Codes de Retrait */}
            {activeTab === 'codes' && (
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 md:p-8">
                <h2 className="text-xl text-white font-black mb-6">Vos codes de retrait actifs</h2>
                {activeCodes.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <QrCode className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                    <p className="font-bold text-xs">Aucun code de retrait en attente pour le moment.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeCodes.map((c) => (
                      <div key={c.id} className="bg-slate-950 border border-orange-500/40 text-white rounded-3xl p-6 shadow-xl shadow-orange-500/10 relative flex flex-col items-center text-center border-kita-glow">
                        <span className="text-[10px] text-orange-400 uppercase font-black tracking-widest self-start">Commande #{c.id}</span>
                        <div className="text-3xl font-mono font-black tracking-widest bg-slate-900 border border-orange-500/30 text-orange-400 py-3 px-6 rounded-2xl my-3 shadow-inner">
                          {c.pickup_code || '7K4D9XQP'}
                        </div>
                        <div className="bg-white p-3 rounded-2xl shadow-xl border-2 border-amber-400 my-2">
                          <QRCodeSVG value={c.pickup_code || `CMD-${c.id}`} size={110} level="H" />
                        </div>
                        <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 mt-2">
                          <MapPin size={14} className="text-orange-400" /> {c.store_name || 'Magasin Central Bouaké'}
                        </div>
                        <Link
                          to={`/orders/${c.id}/tracking`}
                          className="mt-4 w-full text-center bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-black rounded-2xl hover:from-orange-400 hover:to-amber-400 shadow-lg shadow-orange-500/20 py-2.5 transition-all text-xs uppercase tracking-wider"
                        >
                          Suivre & Détails
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Onglet Paramètres */}
            {activeTab === 'settings' && (
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 md:p-8">
                <h2 className="text-xl text-white font-black mb-6">Paramètres du compte</h2>

                {profileMsg && (
                  <div className="mb-4 p-3.5 bg-slate-950 border border-orange-500/50 text-orange-500 text-xs font-bold rounded-2xl flex items-center gap-2">
                    <CheckCircle2 size={16} /> {profileMsg}
                  </div>
                )}

                <form onSubmit={handleSaveProfile} className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-slate-400 text-xs font-bold mb-1">Nom complet</label>
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      required
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-white focus:border-orange-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 text-xs font-bold mb-1">Adresse email</label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-slate-500 cursor-not-allowed outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 text-xs font-bold mb-1">Numéro de téléphone</label>
                    <input
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      placeholder="+225 07 00 00 00 00"
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-white focus:border-orange-500 outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="bg-orange-500 text-white font-black rounded-2xl hover:bg-orange-600 shadow-lg shadow-orange-500/20 px-6 py-3 text-xs transition-colors disabled:opacity-60 flex items-center gap-2 mt-2"
                  >
                    {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enregistrer les modifications'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
