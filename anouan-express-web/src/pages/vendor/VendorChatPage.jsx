// src/pages/vendor/VendorChatPage.jsx
// Messagerie Côté Vendeur — Réponses aux Clients & Assistance Magasin Central (Dark Premium Orange)

import React, { useState, useEffect, useRef } from 'react';
import {
  Send, MessageSquare, ShieldCheck, Search, CheckCheck, Clock,
  User, Paperclip, Sparkles, ChevronLeft, Phone, Store, Package
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { getAssetUrl, messagesAPI } from '../../services/api';
import { getSocket } from '../../services/socket';
import Emoji from '../../components/ui/Emoji';
import PageHeader from '../../components/ui/PageHeader';

const VENDOR_CONVERSATIONS = [
  {
    id: 'conv-client-1',
    clientId: 'cli-1',
    clientName: 'Kouadio Jean-Marc',
    avatar: '👨🏽‍💼',
    orderId: 'CMD-847291',
    productName: 'Pagne Baoulé Tissé Main',
    isOnline: true,
    lastTime: '14:21',
    unreadCount: 1,
    messages: [
      { id: 1, sender: 'vendor', text: 'Bonjour Kouadio ! Merci pour votre commande #CMD-847291.', time: '14:05', status: 'read' },
      { id: 2, sender: 'client', text: 'Bonjour, le produit est-il bien disponible pour un retrait au Magasin Central aujourd\'hui ?', time: '14:12', status: 'read' },
      { id: 3, sender: 'vendor', text: 'Oui tout à fait ! Il est préparé et prêt pour dépôt au Magasin Central Bouaké.', time: '14:20', status: 'read' },
      { id: 4, sender: 'client', text: 'Super merci ! À quelle heure puis-je passer au guichet avec mon QR Code ?', time: '14:21', status: 'unread' },
    ],
  },
  {
    id: 'conv-client-2',
    clientId: 'cli-2',
    clientName: 'Awa Koné',
    avatar: '👩🏽',
    orderId: 'CMD-847110',
    productName: 'Smartphone Pro Max 256GB',
    isOnline: true,
    lastTime: 'Hier',
    unreadCount: 0,
    messages: [
      { id: 1, sender: 'client', text: 'Bonjour, est-ce que la garantie 12 mois couvre la batterie ?', time: 'Hier 11:30', status: 'read' },
      { id: 2, sender: 'vendor', text: 'Bonjour Awa ! Oui, la garantie officielle couvre la batterie et le chargeur.', time: 'Hier 11:45', status: 'read' },
      { id: 3, sender: 'client', text: 'Parfait, je vais faire le retrait demain matin !', time: 'Hier 11:50', status: 'read' },
    ],
  },
  {
    id: 'conv-client-3',
    clientId: 'cli-3',
    clientName: 'Mariam Koffi',
    avatar: '👩🏽‍🦱',
    orderId: 'CMD-846995',
    productName: 'Robe d\'Été Fleurie WAX',
    isOnline: false,
    lastTime: '29 août',
    unreadCount: 0,
    messages: [
      { id: 1, sender: 'client', text: 'Bonjour, avez-vous la taille M en couleur bleue ?', time: '29 août 16:10', status: 'read' },
      { id: 2, sender: 'vendor', text: 'Oui Mariam ! La taille M bleue est disponible et déposée au Magasin Central.', time: '29 août 16:30', status: 'read' },
    ],
  },
];

const VENDOR_QUICK_RESPONSES = [
  'Votre commande est disponible au Magasin Central ! 📦',
  'Le produit est 100% en stock dans notre boutique 🏬',
  'Présentez simplement votre code QR au guichet 📱',
  'Merci pour votre confiance ! 🙏',
];

export default function VendorChatPage() {
  const { user } = useAuth();
  const toast = useToast();

  const [conversations, setConversations] = useState(VENDOR_CONVERSATIONS);
  const [activeConvId, setActiveConvId] = useState(null);
  const [inputText, setInputText] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [showMobileList, setShowMobileList] = useState(true);
  const [isClientTyping, setIsClientTyping] = useState(false);
  const [dbMessages, setDbMessages] = useState([]);

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
            clientId: c.partner_id,
            clientName: c.name || 'Client',
            avatar: '👤',
            orderId: c.order_id || '—',
            productName: c.product_name || '',
            isOnline: false,
            lastTime: c.created_at ? new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
            unreadCount: parseInt(c.unread_count) || 0,
            lastMessage: c.last_message || '',
            messages: [],
          }));
          setConversations(mapped);
          if (mapped.length > 0) setActiveConvId(mapped[0].id);
        } else {
          setConversations(VENDOR_CONVERSATIONS);
          setActiveConvId(VENDOR_CONVERSATIONS[0]?.id || 'conv-client-1');
        }
      } catch {
        setConversations(VENDOR_CONVERSATIONS);
        setActiveConvId(VENDOR_CONVERSATIONS[0]?.id || 'conv-client-1');
      }
    };
    loadConversations();
  }, []);

  // Charger les messages d'une conversation depuis la BD
  useEffect(() => {
    if (!activeConvId || isNaN(activeConvId)) {
      setDbMessages([]);
      return;
    }
    messagesAPI.getMessages(activeConvId).then(res => {
      const msgs = res?.data?.data || res?.data || [];
      if (Array.isArray(msgs)) {
        setDbMessages(msgs.map(m => ({
          id: m.id,
          sender: m.sender_id === user?.id ? 'vendor' : 'client',
          text: m.content,
          time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: m.is_read ? 'read' : 'sent',
        })).reverse());
      }
    }).catch(() => {});
  }, [activeConvId]);

  // Écoute en direct des nouveaux messages via Socket.io
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewMessage = (msg) => {
      if (String(msg.sender_id) === String(activeConvId)) {
        setDbMessages((prev) => [
          ...prev,
          {
            id: msg.id,
            sender: 'client',
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
  const activeMessages = (!isNaN(activeConvId) && dbMessages.length > 0) ? dbMessages : (activeConv?.messages || []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages, isClientTyping]);

  const handleSendMessage = async (textToSend) => {
    const msgText = textToSend || inputText;
    if (!msgText.trim() && !attachment) return;

    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newMsg = {
      id: Date.now(),
      sender: 'vendor',
      text: msgText.trim(),
      attachmentUrl: attachment ? URL.createObjectURL(attachment) : null,
      time: currentTime,
      status: 'sent',
    };

    // Envoi via API si conv réelle
    if (!isNaN(activeConvId) && activeConvId) {
      try {
        const payload = new FormData();
        payload.append('recipientId', activeConvId);
        payload.append('content', msgText.trim());
        if (attachment) payload.append('attachment', attachment);
        await messagesAPI.send(payload);
        setDbMessages(prev => [...prev, newMsg]);
        toast.success('Message envoyé !');
      } catch (err) {
        console.error('Erreur envoi message:', err);
      }
    } else {
      // Mode démo
      setConversations((prev) => prev.map((c) => {
        if (c.id === activeConvId) {
          return { ...c, lastMessage: msgText.trim(), lastTime: 'À l\'instant', messages: [...c.messages, newMsg] };
        }
        return c;
      }));
      toast.success('Message envoyé au client !');

      // Simulation de réponse du client après 1.8s (mode démo)
      setTimeout(() => { setIsClientTyping(true); }, 600);
      setTimeout(() => {
        setIsClientTyping(false);
        const clientReplies = [
          'D\'accord parfait ! Merci beaucoup, je passe au guichet du Magasin Central.',
          'Super, merci pour votre réactivité ! Bonne journée.',
          'Entendu, j\'ai bien reçu mon code QR sur l\'application.',
        ];
        const randomReply = clientReplies[Math.floor(Math.random() * clientReplies.length)];
        const clientMsg = {
          id: Date.now() + 1,
          sender: 'client',
          text: randomReply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: 'read',
        };
        setConversations((prev) => prev.map((c) => {
          if (c.id === activeConvId) {
            return { ...c, lastMessage: randomReply, lastTime: 'À l\'instant', messages: [...c.messages, clientMsg] };
          }
          return c;
        }));
      }, 2000);
    }
    setAttachment(null);

    if (!textToSend) setInputText('');
  };

  const filteredConvs = conversations.filter((c) =>
    (c.clientName || '').toLowerCase().includes(searchFilter.toLowerCase()) ||
    (c.orderId || '').toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="flex flex-col h-[calc(100vh-110px)] lg:h-[calc(100vh-150px)] text-slate-100 font-sans gap-3">
      
      <PageHeader
        eyebrow="Messagerie Vendeur Live"
        eyebrowIcon={MessageSquare}
        title="Conversations avec vos Clients"
        subtitle="Répondez aux demandes clients et suivez les échanges liés aux commandes."
        className="shrink-0"
        actions={(
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-2xl text-emerald-400 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Boutique En Ligne & Support Actif
          </div>
        )}
      />

      {/* Panneau Principal Messagerie Vendeur (Adapte sa hauteur dynamiquement) */}
      <div className="glass-panel rounded-3xl border border-slate-800 grid grid-cols-1 lg:grid-cols-12 flex-1 min-h-0 overflow-hidden shadow-2xl">
        
        {/* Sidebar Liste des Clients (4 cols) */}
        <div className={`lg:col-span-4 border-r border-slate-800 flex flex-col bg-slate-950/80 ${showMobileList ? 'flex' : 'hidden lg:flex'}`}>
          
          {/* Barre de recherche client */}
          <div className="p-4 border-b border-slate-800 bg-slate-900/60">
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Rechercher par client ou #CMD..."
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-xs text-white placeholder-slate-400 focus:border-orange-500 outline-none"
              />
            </div>
          </div>

          {/* Items de Conversations Clientes */}
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
                    <div className="w-11 h-11 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center shadow-md">
                      <Emoji e={conv.avatar || '👤'} size={26} />
                    </div>
                    {conv.isOnline && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-950 rounded-full" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-xs font-bold text-white truncate">{conv.clientName}</h4>
                      <span className="text-[10px] text-slate-400 font-bold shrink-0">{conv.lastTime}</span>
                    </div>
                    <p className="text-[11px] text-orange-400 font-bold mb-0.5">#{conv.orderId}</p>
                    <p className="text-xs text-slate-300 truncate leading-snug">{conv.messages[conv.messages.length - 1]?.text}</p>
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

        {/* Zone de Chat Active (8 cols) */}
        <div className={`lg:col-span-8 flex flex-col h-full min-h-0 bg-slate-900/40 ${!showMobileList ? 'flex' : 'hidden lg:flex'}`}>
          
          {/* Header Conversation Client Active */}
          <div className="p-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowMobileList(true)}
                className="lg:hidden p-2 rounded-xl bg-slate-800 text-slate-200 hover:text-white"
              >
                <ChevronLeft size={20} />
              </button>

              <div className="w-11 h-11 rounded-2xl bg-slate-950 border border-slate-700 flex items-center justify-center shadow-md">
                <Emoji e={activeConv.avatar || '👤'} size={26} />
              </div>
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  {activeConv.clientName}
                  <span className="text-[10px] font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">
                    Acheteur
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400 font-semibold flex items-center gap-1.5">
                  <Package size={12} className="text-orange-400" /> Commande #{activeConv.orderId} — {activeConv.productName}
                </p>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={() => toast.info(`Contact téléphonique client : +225 07 00 00 00 00`)}
                className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-2xl border border-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Phone size={14} className="text-orange-400" /> Appeler
              </button>
            </div>
          </div>

          {/* Thread de discussion Vendeur <-> Client */}
          <div className="flex-1 min-h-0 p-4 sm:p-6 overflow-y-auto space-y-4">
            
            {/* Tag d'information sur la commande client */}
            <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-slate-300 flex items-center justify-between shadow-md">
              <div className="flex items-center gap-2">
                <Store size={16} className="text-orange-400" />
                <span>Article : <strong className="text-white">{activeConv.productName}</strong></span>
              </div>
              <span className="text-[10px] font-bold bg-emerald-500/15 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/25">
                Prêt au Magasin Central
              </span>
            </div>

            {/* Bulles de conversation */}
            {activeMessages.map((msg) => {
              const isVendor = msg.sender === 'vendor';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isVendor ? 'items-end' : 'items-start'} space-y-1.5`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[75%] p-4 rounded-3xl text-sm leading-relaxed shadow-lg ${
                      isVendor
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-bold rounded-br-none shadow-orange-500/10'
                        : 'bg-slate-900 border border-slate-800 text-slate-100 font-medium rounded-bl-none'
                    }`}
                  >
                      {msg.text && <p>{msg.text}</p>}
                      {msg.attachmentUrl && <img src={msg.attachmentUrl} alt="Pièce jointe" className="mt-2 max-h-60 max-w-full rounded-xl object-contain" />}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 px-1 font-bold">
                    <span>{msg.time}</span>
                    {isVendor && <CheckCheck size={14} className="text-orange-400" />}
                  </div>
                </div>
              );
            })}

            {/* Indicateur de saisie client */}
            {isClientTyping && (
              <div className="flex items-center gap-2 text-xs text-slate-400 animate-pulse pt-2">
                <div className="w-7 h-7 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-sm">
                  {activeConv.avatar}
                </div>
                <span className="font-semibold text-slate-300">{activeConv.clientName} écrit une réponse...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Réponses Rapides Vendeur */}
          <div className="px-4 py-2.5 bg-slate-950 border-t border-slate-800/80 flex gap-2 overflow-x-auto shrink-0">
            {VENDOR_QUICK_RESPONSES.map((q) => (
              <button
                key={q}
                onClick={() => handleSendMessage(q)}
                className="shrink-0 text-xs font-bold text-slate-200 hover:text-white bg-slate-900 border border-slate-800 hover:border-orange-500/40 px-3.5 py-2 rounded-xl transition-all"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Formulaire d'envoi du vendeur */}
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
                onClick={() => document.getElementById('vendor-chat-attachment')?.click()}
                className="p-3 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-2xl border border-slate-800 transition-colors"
              >
                <Paperclip size={18} />
              </button>
              <input id="vendor-chat-attachment" type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={(event) => setAttachment(event.target.files?.[0] || null)} />
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Répondre à ${activeConv.clientName}...`}
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
  );
}
