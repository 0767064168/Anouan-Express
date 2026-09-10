// src/components/vendor/NotificationBell.jsx
// Cloche de notifications temps reel pour le dashboard vendeur
import React, { useState, useRef, useEffect } from "react";
import { Bell, BellOff, CheckCheck, ShoppingBag, CreditCard, Package, X, Wifi, WifiOff } from "lucide-react";
import { useNotifications } from "../../hooks/useNotifications";

const TYPE_CONFIG = {
  new_order:        { icon: ShoppingBag, color: "text-orange-400",  bg: "bg-orange-500/10" },
  payment_received: { icon: CreditCard,  color: "text-emerald-400", bg: "bg-emerald-500/10" },
  stock_alert:      { icon: Package,     color: "text-amber-400",   bg: "bg-amber-500/10" },
  default:          { icon: Bell,        color: "text-slate-400",   bg: "bg-slate-800" },
};

function timeAgo(ts) {
  if (!ts) return "";
  const diff = Date.now() - new Date(ts).getTime();
  if (diff < 60000) return "A l instant";
  if (diff < 3600000) return `Il y a ${Math.floor(diff / 60000)} min`;
  return `Il y a ${Math.floor(diff / 3600000)}h`;
}

export default function NotificationBell() {
  const { notifications, unreadCount, connected, markAllRead, markRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)}
        className="relative p-2 rounded-2xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
        {connected ? <Bell size={18} /> : <BellOff size={18} className="text-red-400" />}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl shadow-black/50 overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
            <div>
              <h3 className="text-xs font-bold text-white">Notifications</h3>
              <div className="flex items-center gap-1 mt-0.5">
                {connected
                  ? <><div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /><span className="text-[10px] text-emerald-400">Temps reel actif</span></>
                  : <><div className="w-1.5 h-1.5 rounded-full bg-red-400" /><span className="text-[10px] text-red-400">Deconnecte</span></>
                }
              </div>
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button onClick={markAllRead}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-orange-400 hover:bg-orange-500/10 transition-all"
                  title="Tout marquer comme lu">
                  <CheckCheck size={14} />
                </button>
              )}
              <button onClick={() => setOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Liste */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center py-8 px-4">
                <Bell size={28} className="mx-auto text-slate-700 mb-2" />
                <p className="text-xs text-slate-500">Aucune notification</p>
                <p className="text-[10px] text-slate-600 mt-1">Les nouvelles commandes apparaitront ici</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const { icon: Icon, color, bg } = TYPE_CONFIG[notif.type] || TYPE_CONFIG.default;
                return (
                  <button key={notif.id} onClick={() => markRead(notif.id)}
                    className={`w-full text-left px-4 py-3 border-b border-slate-800/50 hover:bg-slate-800/40 transition-all flex gap-3 ${
                      notif.read ? "opacity-60" : ""
                    }`}>
                    <div className={`shrink-0 w-8 h-8 rounded-2xl ${bg} flex items-center justify-center`}>
                      <Icon size={14} className={color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate">{notif.title}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">{notif.message}</p>
                      <p className="text-[10px] text-slate-600 mt-1">{timeAgo(notif.timestamp)}</p>
                    </div>
                    {!notif.read && <div className="shrink-0 w-2 h-2 rounded-full bg-orange-500 mt-1.5" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
