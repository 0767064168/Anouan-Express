// src/pages/NotFoundPage.jsx
// Page 404 Dark Premium Orange avec animation et retour accueil

import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft, Zap } from 'lucide-react';
import Logo from '../components/ui/Logo';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-center px-6 selection:bg-orange-500 selection:text-slate-950 relative overflow-hidden">
      {/* Fond décoratif */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-md space-y-8">
        {/* Logo */}
        <div className="flex justify-center">
          <Logo size="lg" />
        </div>

        {/* Code 404 animé */}
        <div className="relative">
          <h1 className="text-[120px] md:text-[180px] font-black leading-none text-transparent bg-clip-text bg-gradient-to-br from-orange-400 via-amber-400 to-orange-600 select-none">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shadow-2xl shadow-orange-500/10">
              <Zap size={42} className="text-orange-400 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="space-y-3">
          <h2 className="text-2xl font-black text-white">Page introuvable !</h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Oups ! La page que vous cherchez n'existe pas ou a été déplacée.<br/>
            Retournez à l'accueil pour continuer vos achats sur <span className="text-orange-400 font-bold">Anouan Express</span>.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-black px-8 py-3.5 rounded-2xl transition-all shadow-xl shadow-orange-500/20 text-sm uppercase tracking-wider"
          >
            <Home size={18} /> Retour à l'Accueil
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 bg-slate-900 border border-slate-800 hover:border-orange-500/40 text-slate-300 hover:text-white font-bold px-8 py-3.5 rounded-2xl transition-all text-sm"
          >
            <ArrowLeft size={16} /> Page Précédente
          </button>
        </div>

        {/* Liens rapides */}
        <div className="border-t border-slate-800 pt-6 space-y-2">
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Liens rapides</p>
          <div className="flex flex-wrap gap-3 justify-center">
            {[
              { to: '/catalog', label: '🛍️ Catalogue' },
              { to: '/auth/login', label: '🔐 Connexion' },
              { to: '/auth/register', label: '✨ Inscription' },
            ].map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-xs text-orange-400 hover:text-orange-300 font-bold bg-orange-500/10 border border-orange-500/20 px-4 py-2 rounded-xl transition-all hover:bg-orange-500/20"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
