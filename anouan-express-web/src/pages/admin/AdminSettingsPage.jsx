// src/pages/admin/AdminSettingsPage.jsx — Dark Premium Orange
import React, { useState } from 'react';
import { Settings, Globe, Bell, Shield, Palette, Save, CheckCircle } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import { adminAPI } from '../../services/api';

const SECTIONS = [
  { key: 'general',     label: 'Général',         icon: Globe },
  { key: 'notifs',      label: 'Notifications',    icon: Bell },
  { key: 'securite',    label: 'Sécurité',         icon: Shield },
  { key: 'apparence',   label: 'Apparence',        icon: Palette },
];

export default function AdminSettingsPage() {
  const [active, setActive] = useState('general');
  const [saved, setSaved]   = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm]     = useState({
    platformName: 'Anouan Express',
    currency: 'FCFA',
    city: 'Bouaké',
    deliveryFee: '500',
    commissionDefault: '10',
    emailNotifs: true,
    smsNotifs: true,
    orderAlerts: true,
    disputeAlerts: true,
    twoFA: false,
    sessionTimeout: '30',
    darkMode: true,
    primaryColor: '#f97316',
  });

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  React.useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await adminAPI.getSettings();
        const data = res.data?.data || res.data || {};
        const parsed = Object.fromEntries(Object.entries(data).map(([key, value]) => {
          try { return [key, JSON.parse(value)]; } catch { return [key, value]; }
        }));
        setForm((current) => ({ ...current, ...parsed }));
      } catch (err) {
        setError('Impossible de charger les paramètres enregistrés.');
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const handleSave = async () => {
    setSaved(false);
    setError('');
    try {
      await Promise.all(Object.entries(form).map(([key, value]) => adminAPI.updateSetting(key, { value })));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError('Impossible d’enregistrer les paramètres.');
    }
  };

  const inputCls = "w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-orange-500 outline-none transition-all";
  const labelCls = "block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5";

  const Toggle = ({ checked, onChange, label }) => (
    <div className="flex items-center justify-between py-3 border-b border-slate-800/60 last:border-0">
      <span className="text-xs text-slate-300">{label}</span>
      <button onClick={() => onChange(!checked)}
        className={`relative w-10 h-5 rounded-full transition-all duration-200 ${checked ? 'bg-orange-500' : 'bg-slate-700'}`}>
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-all duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`}/>
      </button>
    </div>
  );

  return (
    <div className="space-y-6 text-slate-100 max-w-4xl">
      <PageHeader
        eyebrow="Configuration Administration"
        eyebrowIcon={Settings}
        title="Paramètres Plateforme"
        subtitle="Configuration globale de la plateforme Anouan Express."
        actions={(
          <button onClick={handleSave}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-2xl transition-all ${
              saved ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400' : 'bg-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-500/20'
            }`}>
            {saved ? <><CheckCircle size={14}/> Enregistré !</> : <><Save size={14}/> Sauvegarder</>}
          </button>
        )}
      />

      {error && <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-2xl text-xs font-bold">{error}</div>}
      {loading && <div className="text-xs text-slate-500">Chargement des paramètres...</div>}

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-48 shrink-0 space-y-1">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            return (
              <button key={s.key} onClick={() => setActive(s.key)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                  active === s.key
                    ? 'bg-orange-500/15 border border-orange-500/25 text-orange-400'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                }`}>
                <Icon size={14}/> {s.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-5">

          {active === 'general' && (
            <>
              <p className="text-xs font-black text-orange-400 uppercase tracking-widest">Informations générales</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className={labelCls}>Nom de la plateforme</label><input value={form.platformName} onChange={set('platformName')} className={inputCls}/></div>
                <div><label className={labelCls}>Devise</label><input value={form.currency} onChange={set('currency')} className={inputCls}/></div>
                <div><label className={labelCls}>Ville principale</label><input value={form.city} onChange={set('city')} className={inputCls}/></div>
                <div><label className={labelCls}>Frais de livraison (FCFA)</label><input type="number" value={form.deliveryFee} onChange={set('deliveryFee')} className={inputCls}/></div>
                <div><label className={labelCls}>Commission par défaut (%)</label><input type="number" value={form.commissionDefault} onChange={set('commissionDefault')} className={inputCls}/></div>
              </div>
            </>
          )}

          {active === 'notifs' && (
            <>
              <p className="text-xs font-black text-orange-400 uppercase tracking-widest">Préférences de notification</p>
              <div className="space-y-0">
                <Toggle checked={form.emailNotifs} onChange={(v) => setForm(p=>({...p,emailNotifs:v}))} label="Notifications par email"/>
                <Toggle checked={form.smsNotifs}   onChange={(v) => setForm(p=>({...p,smsNotifs:v}))}   label="Notifications SMS"/>
                <Toggle checked={form.orderAlerts} onChange={(v) => setForm(p=>({...p,orderAlerts:v}))} label="Alertes nouvelles commandes"/>
                <Toggle checked={form.disputeAlerts} onChange={(v) => setForm(p=>({...p,disputeAlerts:v}))} label="Alertes litiges"/>
              </div>
            </>
          )}

          {active === 'securite' && (
            <>
              <p className="text-xs font-black text-orange-400 uppercase tracking-widest">Sécurité & Accès</p>
              <div className="space-y-4">
                <div><label className={labelCls}>Délai de session (minutes)</label><input type="number" value={form.sessionTimeout} onChange={set('sessionTimeout')} className={`${inputCls} w-32`}/></div>
                <div className="space-y-0">
                  <Toggle checked={form.twoFA} onChange={(v) => setForm(p=>({...p,twoFA:v}))} label="Authentification à deux facteurs (2FA)"/>
                </div>
                <div className="bg-slate-950/50 border border-amber-500/20 rounded-2xl p-4">
                  <p className="text-[11px] text-amber-400 font-bold mb-1">⚠ Réinitialisation du mot de passe admin</p>
                  <p className="text-[10px] text-slate-400">Envoyez un lien de réinitialisation à l'email administrateur enregistré.</p>
                  <button className="mt-3 px-3 py-1.5 bg-amber-500/10 border border-amber-500/25 text-amber-400 text-[10px] font-bold rounded-xl hover:bg-amber-500/20 transition-colors">
                    Envoyer le lien
                  </button>
                </div>
              </div>
            </>
          )}

          {active === 'apparence' && (
            <>
              <p className="text-xs font-black text-orange-400 uppercase tracking-widest">Thème & Apparence</p>
              <div className="space-y-4">
                <div>
                  <label className={labelCls}>Couleur principale</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={form.primaryColor} onChange={set('primaryColor')} className="w-12 h-10 rounded-xl border border-slate-700 bg-transparent cursor-pointer"/>
                    <span className="text-xs text-slate-400 font-mono">{form.primaryColor}</span>
                  </div>
                </div>
                <div className="space-y-0">
                  <Toggle checked={form.darkMode} onChange={(v) => setForm(p=>({...p,darkMode:v}))} label="Mode sombre (Dark Mode)"/>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
