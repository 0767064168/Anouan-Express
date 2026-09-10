// src/components/ui/PWAInstallPrompt.jsx
// Banniere d installation PWA pour smartphone et ordinateur
import React, { useState, useEffect } from "react";
import { Download, X, Smartphone, Sparkles } from "lucide-react";

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // Detecter iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const isStandalone = window.navigator.standalone || window.matchMedia("(display-mode: standalone)").matches;

    if (isIosDevice && !isStandalone) {
      setIsIOS(true);
      const dismissed = localStorage.getItem("anouan_pwa_ios_dismissed");
      if (!dismissed) {
        setShowPrompt(true);
      }
    }

    // Evenement d installation Chrome/Android/Desktop
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const dismissed = localStorage.getItem("anouan_pwa_dismissed");
      if (!dismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowPrompt(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setShowIOSGuide(false);
    localStorage.setItem(isIOS ? "anouan_pwa_ios_dismissed" : "anouan_pwa_dismissed", "true");
  };

  if (!showPrompt) return null;

  return (
    <>
      {/* Banniere flottante */}
      <aside aria-label="Installation de l'application" className="fixed bottom-16 lg:bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
        <div className="bg-slate-900/95 backdrop-blur-xl border border-orange-500/40 rounded-3xl p-4 shadow-2xl shadow-black/80 flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-slate-950 font-black shrink-0 shadow-lg shadow-orange-500/30">
            <Smartphone size={22} />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-xs font-black text-white flex items-center gap-1.5 truncate">
              Installer Anouan Express <Sparkles size={12} className="text-amber-400" />
            </h3>
            <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
              Accès ultra-rapide, mode hors-ligne et suivi direct.
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleInstallClick}
              className="bg-orange-500 hover:bg-orange-400 text-slate-950 text-xs font-black px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-orange-500/20 uppercase tracking-wider"
            >
              <Download size={13} /> Installer
            </button>
            <button
              onClick={handleDismiss}
              className="p-1.5 text-slate-500 hover:text-white rounded-lg transition-colors"
              title="Fermer"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Guide modal pour iOS Safari */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Smartphone size={18} className="text-orange-400" /> Installation sur iPhone / iPad
              </h3>
              <button onClick={() => setShowIOSGuide(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <div className="text-xs text-slate-300 space-y-3">
              <p>Pour installer l application sur iOS via Safari :</p>
              <ol className="list-decimal list-inside space-y-2 text-slate-400">
                <li>Appuyez sur le bouton <strong>Partager</strong> en bas de Safari (icône carré avec une flèche vers le haut).</li>
                <li>Faites défiler vers le bas et sélectionnez <strong>Sur l écran d accueil</strong>.</li>
                <li>Appuyez sur <strong>Ajouter</strong> en haut à droite.</li>
              </ol>
            </div>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-3 bg-orange-500 text-slate-950 font-black rounded-2xl text-xs uppercase tracking-wider"
            >
              C est compris !
            </button>
          </div>
        </div>
      )}
    </>
  );
}
