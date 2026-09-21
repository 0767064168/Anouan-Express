// src/components/agent/QrScannerModal.jsx
// Scanner QR Code reel via camera — utilise html5-qrcode
import React, { useEffect, useRef, useState } from "react";
import { X, Loader2, AlertCircle, QrCode } from "lucide-react";

/**
 * Modal Scanner QR Code
 * @param {function} onScan   - Appele avec le texte decode (code QR)
 * @param {function} onClose  - Ferme la modal
 */
export default function QrScannerModal({ onScan, onClose }) {
  const scannerRef = useRef(null);
  const containerRef = useRef(null);
  const [status, setStatus] = useState("loading"); // loading | scanning | error
  const [errorMsg, setErrorMsg] = useState("");
  const hasStarted = useRef(false);

  useEffect(() => {
    let html5QrCode = null;

    const startScanner = async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (!containerRef.current) return;

        html5QrCode = new Html5Qrcode("qr-reader-container");
        scannerRef.current = html5QrCode;

        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        };

        await html5QrCode.start(
          { facingMode: "environment" },
          config,
          (decodedText) => {
            html5QrCode.stop().catch(() => {});
            onScan(decodedText.trim().toUpperCase());
          },
          () => {}
        );

        setStatus("scanning");
        hasStarted.current = true;
      } catch (err) {
        console.error("Erreur scanner QR:", err);
        setStatus("error");
        if (err?.message?.includes("NotAllowedError") || err?.name === "NotAllowedError") {
          setErrorMsg("Permission camera refusee. Autorisez l'acces a la camera dans les parametres du navigateur.");
        } else if (err?.message?.includes("NotFoundError") || err?.name === "NotFoundError") {
          setErrorMsg("Aucune camera detectee sur cet appareil.");
        } else {
          setErrorMsg(err?.message || "Impossible d'initialiser la camera.");
        }
      }
    };

    startScanner();

    return () => {
      if (scannerRef.current && hasStarted.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [onScan]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2 text-orange-400 font-black text-sm">
            <QrCode size={18} />
            Scanner le QR Code
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="relative rounded-2xl overflow-hidden bg-black min-h-[280px] flex items-center justify-center">
            <div id="qr-reader-container" ref={containerRef} className="w-full" />

            {status === "loading" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 gap-3">
                <Loader2 size={40} className="animate-spin text-orange-400" />
                <p className="text-xs text-slate-300">Initialisation camera...</p>
              </div>
            )}

            {status === "error" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 gap-3 p-5 text-center">
                <AlertCircle size={40} className="text-red-400" />
                <p className="text-xs text-red-300 font-medium">{errorMsg}</p>
              </div>
            )}

            {status === "scanning" && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="relative w-52 h-52">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-orange-400 rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-orange-400 rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-orange-400 rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-orange-400 rounded-br-lg" />
                  <div className="absolute left-2 right-2 h-0.5 bg-orange-400/70 animate-bounce top-1/2" style={{ animationDuration: "1.5s" }} />
                </div>
              </div>
            )}
          </div>

          {status === "scanning" && (
            <p className="text-center text-xs text-slate-400">
              Pointez la camera vers le <span className="text-orange-400 font-bold">QR Code</span> du client.<br />
              Le code sera lu automatiquement.
            </p>
          )}

          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-bold transition-colors"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
