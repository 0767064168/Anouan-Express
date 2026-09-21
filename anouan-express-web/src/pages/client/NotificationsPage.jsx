// src/pages/client/NotificationsPage.jsx
// Centre de notifications client — Dark Premium Orange

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Package, Tag, ShieldCheck, Info, CheckCheck, Trash2, ChevronRight } from 'lucide-react';
import { useToast } from '../../components/ui/Toast';
import { notificationsAPI } from '../../services/api';
import PageHeader from '../../components/ui/PageHeader';

const DEMO_NOTIFS = [
  {
    id: 1, type: 'order', read: false,
    title: 'Votre commande est prête !',
    body: 'Votre colis est disponible au Magasin Central Bouaké.',
    time: 'Récemment',
    icon: Package, iconBg: 'bg-orange-500/20 border-orange-500/30', iconColor: 'text-orange-400',
  }
];

const TYPE_LABELS = {
  all:      { label: 'Toutes', icon: Bell },
  order:    { label: 'Commandes', icon: Package },
  promo:    { label: 'Promotions', icon: Tag },
  security: { label: 'Sécurité', icon: ShieldCheck },
  system:   { label: 'Système', icon: Info },
};

export default function NotificationsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [notifs, setNotifs] = useState([]);
  const [filter, setFilter] = useState('all');

  const loadNotifications = async () => {
    try {
      const res = await notificationsAPI.getAll({ limit: 50 });
      const data = res.data?.data || res.data || [];
      if (Array.isArray(data) && data.length > 0) {
        setNotifs(data.map(n => {
          let meta = {};
          try {
            meta = typeof n.metadata === 'string' ? JSON.parse(n.metadata || '{}') : (n.metadata || {});
          } catch {}
          const orderId = meta.orderId || meta.order_id || n.order_id;
          return {
            id: n.id,
            type: n.type || 'system',
            read: !!n.is_read,
            title: n.title,
            body: n.body,
            orderId,
            time: new Date(n.created_at).toLocaleDateString('fr-CI', { hour: '2-digit', minute: '2-digit' }),
            icon: n.type === 'order' ? Package : (n.type === 'promo' ? Tag : (n.type === 'security' ? ShieldCheck : Bell)),
            iconBg: n.type === 'order' ? 'bg-orange-500/20 border-orange-500/30' : 'bg-emerald-500/20 border-emerald-500/30',
            iconColor: n.type === 'order' ? 'text-orange-400' : 'text-emerald-400',
          };
        }));
        return;
      }
    } catch {}
    setNotifs(DEMO_NOTIFS);
  };

  useEffect(() => {
    loadNotifications();
    const handleSync = () => loadNotifications();
    window.addEventListener('anouan_order_status_updated', handleSync);
    return () => window.removeEventListener('anouan_order_status_updated', handleSync);
  }, []);

  const unreadCount = notifs.filter((n) => !n.read).length;
  const filtered = filter === 'all' ? notifs : notifs.filter((n) => n.type === filter);

  const markAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success('Toutes les notifications ont été marquées comme lues.');
    } catch (err) {
      toast.error('Impossible de marquer les notifications comme lues.');
    }
  };

  const markRead = async (id) => {
    try {
      await notificationsAPI.markRead(id);
      setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      toast.error('Impossible de marquer cette notification comme lue.');
    }
  };

  const deleteNotif = (id) => {
    setNotifs((prev) => prev.filter((n) => n.id !== id));
    toast.info('Notification supprimée.');
  };

  const clearAll = () => {
    setNotifs([]);
    toast.info('Centre de notifications vidé.');
  };

  const handleNotifClick = (notif) => {
    if (!notif.read) {
      markRead(notif.id);
    }
    if (notif.orderId) {
      navigate(`/orders/${notif.orderId}`);
    } else if (notif.type === 'order') {
      navigate('/orders');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 py-10 text-slate-100 font-sans selection:bg-orange-500 selection:text-slate-950">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

        <PageHeader
          title={
            <span className="flex items-center gap-3">
              Notifications
              {unreadCount > 0 && (
                <span className="bg-orange-500 text-slate-950 text-xs font-black px-2.5 py-1 rounded-full shadow-lg shadow-orange-500/30">
                  {unreadCount} nouvelle{unreadCount > 1 ? 's' : ''}
                </span>
              )}
            </span>
          }
          subtitle="Toutes vos alertes commandes, promos et sécurité"
          actions={(
            <>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-2 text-xs font-bold text-orange-400 hover:text-orange-300 bg-orange-500/10 border border-orange-500/20 px-4 py-2.5 rounded-2xl transition-all"
                >
                  <CheckCheck size={14} /> Tout marquer lu
                </button>
              )}
              {notifs.length > 0 && (
                <button
                  onClick={clearAll}
                  className="flex items-center gap-2 text-xs font-bold text-red-400 hover:text-red-300 bg-red-500/10 border border-red-500/20 px-4 py-2.5 rounded-2xl transition-all"
                >
                  <Trash2 size={14} /> Tout supprimer
                </button>
              )}
            </>
          )}
        />

        {/* Filtres par type */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {Object.entries(TYPE_LABELS).map(([key, { label, icon: Icon }]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`shrink-0 text-xs font-bold px-4 py-2 rounded-2xl border transition-all ${
                filter === key
                  ? 'bg-orange-500 border-orange-500 text-slate-950 shadow-lg shadow-orange-500/20'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-orange-500/30 hover:text-white'
              }`}
            >
              <span className="inline-flex items-center gap-1.5"><Icon size={13} /> {label}</span>
            </button>
          ))}
        </div>

        {/* Liste des notifications */}
        {filtered.length === 0 ? (
          <div className="glass-panel rounded-3xl border border-slate-800 p-16 text-center space-y-3">
            <Bell size={48} className="mx-auto text-slate-700" />
            <p className="text-slate-400 font-bold">Aucune notification pour le moment.</p>
            <p className="text-slate-500 text-xs">Vous serez alerté ici dès qu'une action concerne votre compte.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((notif) => {
              const Icon = notif.icon;
              return (
                <div
                  key={notif.id}
                  onClick={() => handleNotifClick(notif)}
                  className={`glass-panel rounded-3xl border p-5 flex items-start gap-4 cursor-pointer transition-all group ${
                    notif.read
                      ? 'border-slate-800 opacity-60 hover:opacity-100'
                      : 'border-orange-500/30 bg-orange-500/5 hover:border-orange-500/50'
                  }`}
                >
                  {/* Icône */}
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border shrink-0 ${notif.iconBg}`}>
                    <Icon size={20} className={notif.iconColor} />
                  </div>

                  {/* Contenu */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-start justify-between gap-3">
                      <p className={`text-sm font-black leading-snug ${notif.read ? 'text-slate-300' : 'text-white'}`}>
                        {notif.title}
                        {!notif.read && (
                          <span className="ml-2 inline-block w-2 h-2 rounded-full bg-orange-400 align-middle" />
                        )}
                      </p>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteNotif(notif.id); }}
                        className="shrink-0 p-1 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                        title="Supprimer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{notif.body}</p>
                    <div className="flex items-center justify-between pt-1">
                      <p className="text-[10px] text-slate-600 font-semibold">{notif.time}</p>
                      {notif.orderId && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-400 group-hover:text-orange-300 transition-colors">
                          Voir la commande <ChevronRight size={13} />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer info */}
        {filtered.length > 0 && (
          <p className="text-center text-xs text-slate-600">
            Les notifications sont conservées pendant 30 jours.
          </p>
        )}
      </div>
    </div>
  );
}
