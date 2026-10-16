// src/pages/client/ChatPage.jsx
// Centre de messagerie instantanée Vendeur <-> Client — Dark Premium Orange avec réponse intelligente & indicateur de saisie

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Send, MessageSquare, Store, ShieldCheck, Search, Image as ImageIcon,
  CheckCheck, Clock, User, ArrowLeft, Paperclip, Sparkles, AlertCircle, Phone, ChevronLeft,
  Bot
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { getAssetUrl, messagesAPI } from '../../services/api';
import { getSocket } from '../../services/socket';
import Emoji from '../../components/ui/Emoji';
import PageHeader from '../../components/ui/PageHeader';

const DEMO_CONVERSATIONS = [
  {
    id: 'conv-1',
    vendorId: 101,
    vendorName: 'Maison du Pagne Bouaké',
    avatar: '🏛️',
    isOnline: true,
    lastMessage: 'Bonjour ! Votre Pagne Baoulé est préparé et déposé au Magasin Central.',
    lastTime: '14:20',
    unreadCount: 2,
    orderId: 'CMD-847291',
    messages: [
      { id: 1, sender: 'vendor', text: 'Bonjour Kouadio ! Merci pour votre commande #CMD-847291.', time: '14:05', status: 'read' },
      { id: 2, sender: 'client', text: 'Bonjour, le produit est-il bien disponible pour un retrait aujourd\'hui ?', time: '14:12', status: 'read' },
      { id: 3, sender: 'vendor', text: 'Oui tout à fait ! Il est préparé et déposé au Magasin Central Bouaké.', time: '14:20', status: 'read' },
      { id: 4, sender: 'vendor', text: 'Présentez votre code QR au guichet pour récupérer votre colis.', time: '14:21', status: 'unread' },
    ],
  },
  {
    id: 'conv-2',
    vendorId: 102,
    vendorName: 'Tech Store CI',
    avatar: '📱',
    isOnline: true,
    lastMessage: 'La garantie officielle de 12 mois est activée automatiquement.',
    lastTime: 'Hier',
    unreadCount: 0,
    orderId: 'CMD-847110',
    messages: [
      { id: 1, sender: 'client', text: 'Bonjour, est-ce que le smartphone vient avec un protecteur d\'écran ?', time: 'Hier 11:30', status: 'read' },
      { id: 2, sender: 'vendor', text: 'Bonjour ! Oui, un film incassable est déjà appliqué dans le coffret.', time: 'Hier 11:45', status: 'read' },
      { id: 3, sender: 'vendor', text: 'La garantie officielle de 12 mois est activée automatiquement.', time: 'Hier 11:46', status: 'read' },
    ],
  },
  {
    id: 'conv-3',
    vendorId: 'support',
    vendorName: 'Assistance Client Anouan Express',
    avatar: '⚡',
    isOnline: true,
    isSupport: true,
    lastMessage: 'Bienvenue sur Anouan Express. Comment pouvons-nous vous aider ?',
    lastTime: '28 août',
    unreadCount: 0,
    messages: [
      { id: 1, sender: 'vendor', text: 'Bienvenue sur Anouan Express ! Nous sommes disponibles 7j/7 pour vous accompagner dans vos retraits au Magasin Central de Bouaké.', time: '28 août 09:00', status: 'read' },
    ],
  },
];

const QUICK_RESPONSES = [
  'Où se trouve mon colis ? 📦',
  'Le produit est-il en stock à Bouaké ? 📍',
  'Quel est le délai de livraison ? ⏱️',
  'Merci beaucoup ! 🙏',
];

// Moteur de réponse contextuel intelligent
const generateSmartReply = (text, vendorName) => {
  const lower = text.toLowerCase();

  if (lower.includes('colis') || lower.includes('ou') || lower.includes('où') || lower.includes('suivi') || lower.includes('commande') || lower.includes('retrait')) {
    if (vendorName.includes('Assistance')) {
      return "Votre colis est bien en cours de traitement au Magasin Central d'Anouan Express à Bouaké. Présentez simplement votre code QR disponible dans 'Suivi de Commande' pour le retirer !";
    }
    return `Votre commande auprès de ${vendorName} est préparée et disponible au Magasin Central d'Anouan Express Bouaké. Présentez votre code QR au guichet !`;
  }

  if (lower.includes('stock') || lower.includes('disponible') || lower.includes('magasin') || lower.includes('bouaké') || lower.includes('article') || lower.includes('pagne')) {
    return `Oui tout à fait ! Cet article est 100% en stock dans notre boutique à Bouaké. Nous pouvons le déposer au Magasin Central sous 2 heures !`;
  }

  if (lower.includes('délai') || lower.includes('temps') || lower.includes('heure') || lower.includes('quand') || lower.includes('horaire')) {
    return `Le Magasin Central Anouan Express à Bouaké est ouvert du Lundi au Samedi de 08h00 à 18h30. Les retraits au guichet sont instantanés !`;
  }

  if (lower.includes('prix') || lower.includes('promo') || lower.includes('réduction') || lower.includes('remise') || lower.includes('tarif')) {
    return `Nos prix sont déjà au meilleur tarif direct fabricant. Profitez de nos Ventes Flash du jour avec livraison gratuite au Magasin Central !`;
  }

  if (lower.includes('merci') || lower.includes('super') || lower.includes('parfait') || lower.includes('ok') || lower.includes('d\'accord')) {
    return `C'est un plaisir ! Merci d'avoir choisi ${vendorName}. Excellente journée et à très bientôt sur Anouan Express ! 😊`;
  }

  if (lower.includes('bonjour') || lower.includes('salut') || lower.includes('hello') || lower.includes('coucou')) {
    return `Bonjour ! Ravi de vous lire. Comment pouvons-nous vous conseiller aujourd'hui concernant vos achats ou retraits à Bouaké ?`;
  }

  return `Merci pour votre message ! L'équipe de ${vendorName} prend en compte votre demande et reste à votre entière disposition.`;
};

export default function ChatPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const targetVendor = searchParams.get('vendor') || searchParams.get('vendorId');
  const targetVendorName = searchParams.get('vendorName');
  const targetProductName = searchParams.get('productName');
  const targetOrderId = searchParams.get('orderId');

  const [conversations, setConversations] = useState(DEMO_CONVERSATIONS);
  const [activeConvId, setActiveConvId] = useState(null);
  const [inputText, setInputText] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [showMobileList, setShowMobileList] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [dbMessages, setDbMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef(null);

  // Charger les conversations depuis la base de données
  useEffect(() => {
    const loadConversations = async () => {
      try {
        const res = await messagesAPI.getConversations();
        const data = res?.data?.data || res?.data || [];
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map(c => ({
            id: String(c.partner_id),
            vendorId: c.partner_id,
            vendorName: c.name || 'Vendeur',
            avatar: '🏬',
            isOnline: false,
            lastMessage: c.last_message || '',
            lastTime: c.created_at ? new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
            unreadCount: parseInt(c.unread_count) || 0,
            messages: [],
          }));
          setConversations(mapped);
          if (!activeConvId && mapped.length > 0) setActiveConvId(mapped[0].id);
        } else {
          // Fallback DEMO si aucune conversation en base
          setConversations(DEMO_CONVERSATIONS);
          if (!activeConvId) setActiveConvId('conv-1');
        }
      } catch {
        setConversations(DEMO_CONVERSATIONS);
        if (!activeConvId) setActiveConvId('conv-1');
      }
    };
    loadConversations();
  }, []);

  // Charger les messages d'une conversation active depuis la BD
  useEffect(() => {
    if (!activeConvId) return;
    const conv = conversations.find(c => c.id === activeConvId);
    // Si c'est une vraie conv DB (id numérique)
    if (conv && !isNaN(activeConvId)) {
      setLoadingMessages(true);
      messagesAPI.getMessages(activeConvId).then(res => {
        const msgs = res?.data?.data || res?.data || [];
        if (Array.isArray(msgs)) {
          setDbMessages(msgs.map(m => ({
            id: m.id,
            sender: m.sender_id === user?.id ? 'client' : 'vendor',
            text: m.content,
            time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: m.is_read ? 'read' : 'sent',
          })).reverse());
        }
      }).catch(() => {}).finally(() => setLoadingMessages(false));
    } else {
      setDbMessages([]);
    }
  }, [activeConvId]);

  useEffect(() => {
    if (!activeConvId || Number.isNaN(Number(activeConvId))) return;

    const refreshMessages = async () => {
      try {
        const res = await messagesAPI.getMessages(activeConvId);
        const msgs = res?.data?.data || res?.data || [];
        if (Array.isArray(msgs)) {
          setDbMessages(msgs.map((message) => ({
            id: message.id,
            sender: message.sender_id === user?.id ? 'client' : 'vendor',
            text: message.content,
            attachmentUrl: getAssetUrl(message.attachment_url),
            time: new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: message.is_read ? 'read' : 'sent',
          })).reverse());
        }
      } catch {}
    };

    const intervalId = window.setInterval(refreshMessages, 5000);
    return () => window.clearInterval(intervalId);
  }, [activeConvId, user?.id]);

  // Écoute en temps réel des nouveaux messages entrants via Socket.io
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewMessage = (msg) => {
      if (String(msg.sender_id) === String(activeConvId)) {
        setDbMessages((prev) => [
          ...prev,
          {
            id: msg.id,
            sender: 'vendor',
            text: msg.content,
            attachmentUrl: getAssetUrl(msg.attachment_url),
            time: new Date(msg.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'read',
          }
        ]);
      }
    };

    socket.on('new_message', handleNewMessage);
    return () => {
      socket.off('new_message', handleNewMessage);
    };
  }, [activeConvId]);

  const activeConv = conversations.find((c) => c.id === activeConvId) || conversations[0];
  // Messages: si conv DB utilise dbMessages, sinon utilise les messages locaux
  const activeMessages = (!isNaN(activeConvId) && dbMessages.length > 0) ? dbMessages : (activeConv?.messages || []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages, isTyping]);

  // Initialisation à partir des paramètres URL
  useEffect(() => {
    if (targetVendor || targetVendorName) {
      const vid = targetVendor || '101';
      const vName = targetVendorName ? decodeURIComponent(targetVendorName) : 'Boutique Partenaire';
      const existing = conversations.find((c) => String(c.vendorId) === String(vid));

      if (existing) {
        setActiveConvId(existing.id);
        setShowMobileList(false);
      } else {
        const pName = targetProductName ? decodeURIComponent(targetProductName) : '';
        const newConv = {
          id: 'conv-' + vid + '-' + Date.now(),
          vendorId: vid,
          vendorName: vName,
          avatar: '🏬',
          isOnline: true,
          lastMessage: pName ? `Question sur : ${pName}` : 'Nouvelle conversation',
          lastTime: 'À l\'instant',
          unreadCount: 0,
          orderId: targetOrderId || null,
          messages: [
            {
              id: Date.now(),
              sender: 'vendor',
              text: `Bonjour ! Bienvenue chez ${vName}.${pName ? ` Vous vous intéressez à "${pName}". Avez-vous des questions particulières ?` : ' En quoi pouvons-nous vous aider ?'}`,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              status: 'read',
            },
          ],
        };
        setConversations(prev => [newConv, ...prev]);
        setActiveConvId(newConv.id);
        setShowMobileList(false);
      }
    }
  }, [targetVendor, targetVendorName, targetProductName, targetOrderId]);

  const handleSendMessage = async (textToSend) => {
    const msgText = textToSend || inputText;
    if (!msgText.trim() && !attachment) return;

    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newMsg = {
      id: Date.now(),
      sender: 'client',
      text: msgText.trim(),
      attachmentUrl: attachment ? URL.createObjectURL(attachment) : null,
      time: currentTime,
      status: 'sent',
    };

    // Si c'est une vraie conv DB, envoyer via API
    if (!isNaN(activeConvId) && activeConvId) {
      try {
        const payload = new FormData();
        payload.append('recipientId', activeConvId);
        payload.append('content', msgText.trim());
        if (attachment) payload.append('attachment', attachment);
        await messagesAPI.send(payload);
        setDbMessages(prev => [...prev, newMsg]);
      } catch (err) {
        console.error('Erreur envoi message:', err);
      }
    } else {
      // Mode démo : mise à jour locale
      setConversations((prev) => prev.map((c) => {
        if (c.id === activeConvId) {
          return { ...c, lastMessage: msgText.trim(), lastTime: 'À l\'instant', messages: [...c.messages, newMsg] };
        }
        return c;
      }));
    }

    if (!textToSend) setInputText('');
    setAttachment(null);

    // Déclencher l'indicateur d'écriture vendeur après 400ms (mode démo)
    if (isNaN(activeConvId)) {
      setTimeout(() => { setIsTyping(true); }, 400);
      setTimeout(() => {
        setIsTyping(false);
        const replyText = generateSmartReply(msgText.trim(), activeConv?.vendorName || 'le vendeur');
        const replyMsg = {
          id: Date.now() + 1,
          sender: 'vendor',
          text: replyText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'read',
        };
        setConversations((prev) => prev.map((c) => {
          if (c.id === activeConvId) {
            return { ...c, lastMessage: replyText, lastTime: 'À l\'instant', messages: [...c.messages, replyMsg] };
          }
          return c;
        }));
        toast.info(`Nouveau message de ${activeConv?.vendorName}`);
      }, 1400);
    }
  };

  const filteredConvs = conversations.filter((c) =>
    (c.vendorName || '').toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-[500px] text-slate-100 font-sans selection:bg-orange-500 selection:text-slate-950 py-2 gap-3">
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 flex flex-col h-full gap-4">
        
        <PageHeader
          eyebrow="Support Vendeurs 7j/7"
          eyebrowIcon={Sparkles}
          title={(
            <span className="flex items-center gap-3">
              <Link to="/profile" className="text-orange-400 hover:text-orange-300 transition-colors" title="Retour au profil">
                <ArrowLeft size={18} />
              </Link>
              <MessageSquare size={24} className="text-orange-400" /> Messagerie & Support Live
            </span>
          )}
          subtitle="Échangez en direct avec vos commerçants et l'assistance d'Anouan Express"
        />

        {/* Panneau Principal Messagerie (Ajustement dynamique fluide) */}
        <div className="glass-panel rounded-3xl border border-slate-800 grid grid-cols-1 lg:grid-cols-12 flex-1 min-h-0 overflow-hidden shadow-2xl">
          
          {/* Sidebar Conversations (4 cols) */}
          <div className={`lg:col-span-4 border-r border-slate-800 flex flex-col bg-slate-950/80 ${showMobileList ? 'flex' : 'hidden lg:flex'}`}>
            
            {/* Recherche de conversation */}
            <div className="p-4 border-b border-slate-800 bg-slate-900/60">
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Rechercher une boutique..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-xs text-white placeholder-slate-400 focus:border-orange-500 outline-none"
                />
              </div>
            </div>

            {/* Liste des conversations */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40">
              {filteredConvs.map((conv) => {
                const isActive = conv.id === activeConvId;
                return (
                  <button
                    key={conv.id}
                    onClick={() => {
                      setActiveConvId(conv.id);
                      setShowMobileList(false);
                    }}
                    className={`w-full p-4 flex items-start gap-3 text-left transition-all hover:bg-slate-900/60 ${
                      isActive ? 'bg-slate-900/90 border-l-4 border-orange-500' : ''
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center shadow-md">
                        <Emoji e={conv.avatar || '🏬'} size={28} />
                      </div>
                      {conv.isOnline && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-950 rounded-full" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-bold text-white truncate flex items-center gap-1.5">
                          {conv.vendorName}
                          {conv.isSupport && <ShieldCheck size={14} className="text-orange-400" />}
                        </h4>
                        <span className="text-[11px] text-slate-400 font-bold shrink-0">{conv.lastTime}</span>
                      </div>
                      <p className="text-xs text-slate-300 font-medium truncate leading-snug">{conv.lastMessage}</p>
                    </div>

                    {conv.unreadCount > 0 && !isActive && (
                      <span className="shrink-0 bg-orange-500 text-slate-950 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-lg shadow-orange-500/20">
                        {conv.unreadCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Zone de Chat Principale (8 cols) */}
          <div className={`lg:col-span-8 flex flex-col h-full min-h-0 bg-slate-900/40 ${!showMobileList ? 'flex' : 'hidden lg:flex'}`}>
            
            {/* Header conversation active */}
            <div className="p-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowMobileList(true)}
                  className="lg:hidden p-2 rounded-xl bg-slate-800 text-slate-200 hover:text-white"
                >
                  <ChevronLeft size={20} />
                </button>

                <div className="relative">
                  <div className="w-11 h-11 rounded-2xl bg-slate-950 border border-slate-700 flex items-center justify-center shadow-md">
                    <Emoji e={activeConv.avatar || '🏬'} size={26} />
                  </div>
                  {activeConv.isOnline && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-950 rounded-full" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    {activeConv.vendorName}
                    <ShieldCheck size={18} className="text-orange-400" />
                  </h3>
                  <p className="text-xs text-emerald-400 font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    {activeConv.isOnline ? 'En ligne — Répond rapidement' : 'Hors ligne'}
                  </p>
                </div>
              </div>

              {activeConv.orderId && (
                <Link
                  to={`/orders/1/tracking`}
                  className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-orange-400 bg-orange-500/10 border border-orange-500/30 px-3.5 py-2 rounded-xl hover:bg-orange-500/20 transition-all"
                >
                  Commande #{activeConv.orderId}
                </Link>
              )}
            </div>

            {/* Thread de discussion */}
            <div className="flex-1 min-h-0 p-4 sm:p-6 overflow-y-auto space-y-4">
              
              {/* Banner sécurité */}
              <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-slate-300 text-center space-y-1 shadow-md">
                <p className="font-bold text-orange-400 flex items-center justify-center gap-1.5">
                  <ShieldCheck size={15} /> Messages cryptés & sécurisés par Anouan Express
                </p>
                <p className="text-slate-400 text-[11px]">Ne communiquez jamais votre mot de passe ou votre code de retrait secret dans le chat.</p>
              </div>

              {/* Chat Bubbles */}
              {activeMessages.map((msg) => {
                const isMe = msg.sender === 'client';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1.5`}
                  >
                    <div
                      className={`max-w-[85%] sm:max-w-[75%] p-4 rounded-3xl text-sm leading-relaxed shadow-lg ${
                        isMe
                          ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-bold rounded-br-none shadow-orange-500/10'
                          : 'bg-slate-900 border border-slate-800 text-slate-100 font-medium rounded-bl-none'
                      }`}
                    >
                      {msg.text && <p>{msg.text}</p>}
                      {msg.attachmentUrl && <img src={msg.attachmentUrl} alt="Pièce jointe" className="mt-2 max-h-60 max-w-full rounded-xl object-contain" />}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 px-1 font-bold">
                      <span>{msg.time}</span>
                      {isMe && <CheckCheck size={14} className="text-orange-400" />}
                    </div>
                  </div>
                );
              })}

              {/* Indicateur de Saisie Vendeur (Typing Indicator) */}
              {isTyping && (
                <div className="flex items-center gap-2 text-xs text-slate-400 animate-pulse pt-2">
                  <div className="w-7 h-7 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-sm">
                    {activeConv.avatar}
                  </div>
                  <span className="font-semibold text-slate-300">{activeConv.vendorName} est en train d'écrire...</span>
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Réponses Rapides */}
            <div className="px-4 py-2.5 bg-slate-950 border-t border-slate-800/80 flex gap-2 overflow-x-auto shrink-0">
              {QUICK_RESPONSES.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSendMessage(q)}
                  className="shrink-0 text-xs font-bold text-slate-200 hover:text-white bg-slate-900 border border-slate-800 hover:border-orange-500/40 px-3.5 py-2 rounded-xl transition-all"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Champ de Saisie de Message */}
            <div className="p-4 border-t border-slate-800 bg-slate-950 shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-3"
              >
                <button
                  type="button"
                  onClick={() => document.getElementById('client-chat-attachment')?.click()}
                  className="p-3 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-2xl border border-slate-800 transition-colors"
                >
                  <Paperclip size={18} />
                </button>
                <input id="client-chat-attachment" type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={(event) => setAttachment(event.target.files?.[0] || null)} />
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`Écrire à ${activeConv.vendorName}...`}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3.5 text-sm text-white placeholder-slate-400 focus:border-orange-500 outline-none"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="p-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-black rounded-2xl transition-all shadow-lg shadow-orange-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Send size={18} />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
