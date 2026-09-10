// src/hooks/useNotifications.js
// Hook React pour les notifications push via Server-Sent Events (SSE)
import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";

const rawApiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const API_BASE = rawApiUrl.replace(/\/api\/?$/, "");
const MAX_NOTIFS = 20;

export function useNotifications() {
  const { isAuthenticated, token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [connected, setConnected]         = useState(false);
  const esRef      = useRef(null);
  const retryDelay = useRef(3000);

  const addNotification = useCallback((notif) => {
    setNotifications(prev =>
      [{ ...notif, id: Date.now(), read: false }, ...prev].slice(0, MAX_NOTIFS)
    );
    setUnreadCount(c => c + 1);
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      new Notification(notif.title || "Anouan Express", {
        body: notif.message,
        icon: "/favicon.ico",
        tag: notif.type,
      });
    }
  }, []);

  const connect = useCallback(() => {
    if (!isAuthenticated || !token) return;
    if (esRef.current) esRef.current.close();
    const es = new EventSource(`${API_BASE}/api/notifications/stream?token=${token}`);
    esRef.current = es;
    es.onopen = () => { setConnected(true); retryDelay.current = 3000; };
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type !== "connected") addNotification(data);
      } catch {}
    };
    es.onerror = () => {
      setConnected(false);
      es.close();
      const delay = Math.min(retryDelay.current, 30000);
      retryDelay.current = Math.min(delay * 2, 30000);
      setTimeout(connect, delay);
    };
  }, [isAuthenticated, token, addNotification]);

  useEffect(() => {
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission();
    }
    connect();
    return () => { if (esRef.current) esRef.current.close(); };
  }, [connect]);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  const markRead = useCallback((id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(c => Math.max(0, c - 1));
  }, []);

  return { notifications, unreadCount, connected, markAllRead, markRead };
}
