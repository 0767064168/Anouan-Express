// src/pages/client/LegalPage.jsx
// Conditions Générales d Utilisation & Mentions Légales - Anouan Express
import React from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Scale, FileText, ArrowLeft, Building, Lock, HelpCircle } from "lucide-react";

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Navigation retour */}
        <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold text-orange-400 hover:text-orange-300 transition-colors">
          <ArrowLeft size={16} /> Retour à l accueil
        </Link>

        {/* En-tête */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 sm:p-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <Scale size={24} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">Conditions Générales & Mentions Légales</h1>
              <p className="text-xs text-slate-400 mt-1">Dernière mise à jour : 02 Septembre 2026 — Bouaké, République de Côte d Ivoire</p>
            </div>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">
            Bienvenue sur <strong className="text-orange-400">Anouan Express</strong>, la plateforme marketplace de référence à Bouaké combinant vente en ligne multi-vendeurs et points de retrait sécurisés par code unique et QR Code.
          </p>
        </div>

        {/* Contenu détaillé */}
        <div className="space-y-6">
          
          {/* Section 1 : Mentions Légales */}
          <section className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-3">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Building size={18} className="text-orange-400" /> 1. Mentions Légales & Identification
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              La plateforme <strong>Anouan Express</strong> est exploitée par la société Anouan Express SAS, enregistrée au Registre du Commerce et du Crédit Mobilier (RCCM) de Bouaké.<br/>
              • <strong>Siège social :</strong> Quartier Commerce, Rue des Banques, Bouaké, Côte d Ivoire.<br/>
              • <strong>Contact :</strong> support@anouanexpress.ci | +225 07 00 00 00 00<br/>
              • <strong>Hébergement :</strong> Serveurs sécurisés Cloud conformes aux standards de protection des données (RGPD / ARTCI).
            </p>
          </section>

          {/* Section 2 : Objet & Acceptation */}
          <section className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-3">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <FileText size={18} className="text-orange-400" /> 2. Objet du Service & Inscription
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Anouan Express met en relation des commerçants et artisans locaux (Vendeurs) avec des acheteurs (Clients). L accès aux fonctionnalités nécessite la création d un compte utilisateur garantissant l authenticité des informations personnelles fournies.
            </p>
          </section>

          {/* Section 3 : Modalités de Commande & Retrait Sécurisé */}
          <section className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-3">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <ShieldCheck size={18} className="text-orange-400" /> 3. Système de Retrait Sécurisé en Magasin (Bouaké Central)
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Toute commande confirmée génère un <strong>Code Secret de Retrait à 8 caractères</strong> ainsi qu un <strong>QR Code Sécurisé</strong>. Le retrait au magasin central s effectue sur présentation stricte dudit code vérifié par l agent du magasin. Le client peut mandater un tiers directement via son espace de suivi.
            </p>
          </section>

          {/* Section 4 : Moyens de Paiement */}
          <section className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-3">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Lock size={18} className="text-orange-400" /> 4. Paiements & Sécurité des Transactions
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Les règlements sont acceptés par <strong>Mobile Money (Orange Money, MTN MoMo, Wave)</strong> et en espèces au guichet de retrait. Les transactions électroniques sont chiffrées de bout en bout et opérées par des passerelles de paiement agréées par la BCEAO.
            </p>
          </section>

          {/* Section 5 : Droit Applicable */}
          <section className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-3">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Scale size={18} className="text-orange-400" /> 5. Droit Applicable & Résolution des Litiges
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Les présentes conditions sont régies par le droit ivoirien. En cas de litige, l utilisateur peut solliciter la médiation interne via l onglet Réclamations & Litiges de son espace client avant toute action devant les juridictions compétentes de Bouaké.
            </p>
          </section>

        </div>

      </div>
    </div>
  );
}
