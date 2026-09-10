// src/pages/auth/RegisterPage.jsx
// Page d'inscription client — Dark Premium Orange avec Logo retouché & animé

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Lock, Eye, EyeOff, ArrowRight, Loader2, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';
import Logo from '../../components/ui/Logo';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const toast = useToast();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [docs, setDocs] = useState({ cni_recto: null, cni_verso: null, rccm: null });
  const [docPreviews, setDocPreviews] = useState({ cni_recto: null, cni_verso: null, rccm: null });

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'client',
    shopName: '',
    storeLocation: '',
    city: 'Bouaké',
  });

  const set = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const readFile = (file) => new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.readAsDataURL(file);
  });

  const handleDocUpload = async (key, file) => {
    if (!file) return;
    const b64 = await readFile(file);
    setDocs(prev => ({ ...prev, [key]: b64 }));
    setDocPreviews(prev => ({ ...prev, [key]: b64 }));
  };

  const getErrorMessage = (err) => {
    return (
      err.response?.data?.error?.message ||
      err.response?.data?.message ||
      err.message ||
      'Une erreur est survenue lors de l\'inscription.'
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      const msg = 'Les mots de passe ne correspondent pas.';
      setError(msg);
      toast.error(msg);
      return;
    }
    if (form.password.length < 8) {
      const msg = 'Le mot de passe doit contenir au moins 8 caractères.';
      setError(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);
    try {
      const data = await register({
        name: form.name,
        email: form.email || undefined,
        phone: form.phone || undefined,
        password: form.password,
        role: form.role,
        shopName: form.shopName || undefined,
        storeLocation: form.storeLocation || undefined,
      });
      const createdRole = data?.user?.role || form.role;
      if (form.role === 'vendor') {
        window.dispatchEvent(new Event('anouan_vendor_registered'));
      }
      toast.success(createdRole === 'vendor' ? '🎉 Compte Vendeur créé avec succès ! Bienvenue.' : '🎉 Compte Client créé avec succès ! Bienvenue.');
      navigate(createdRole === 'vendor' ? '/vendor' : '/', { replace: true });
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const perks = [
    'Achetez en toute confiance',
    'Retrait sécurisé par code unique',
    'Espace Vendeur & Suivi en direct',
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 selection:bg-orange-500 selection:text-slate-950">
      {/* Background pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md my-8">
        {/* Logo Retouché & Animé */}
        <div className="flex justify-center mb-6">
          <Logo size="xl" to="/" />
        </div>

        {/* Avantages */}
        <div className="flex justify-center gap-3 mb-6 flex-wrap">
          {perks.map((p) => (
            <div key={p} className="flex items-center gap-1.5 text-orange-300 text-xs font-medium bg-slate-900/80 px-3 py-1.5 rounded-full border border-orange-500/20 shadow-md">
              <CheckCircle className="w-3.5 h-3.5 text-orange-400 shrink-0" />
              {p}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl">
          <div className="p-8">
            <h1 className="text-2xl font-black text-white mb-1">Créer un compte</h1>
            <p className="text-slate-400 text-xs mb-6">
              Rejoignez Anouan Express — C&apos;est simple, rapide et gratuit !
            </p>

            {/* Sélecteur de type de compte : Client vs Vendeur */}
            <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-950 border border-slate-800 rounded-2xl mb-6">
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, role: 'client' }))}
                className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                  form.role === 'client'
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🛍️ Client Acheteur
              </button>
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, role: 'vendor' }))}
                className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                  form.role === 'vendor'
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🏪 Vendeur Boutique
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/25 text-red-400 text-xs font-semibold rounded-2xl">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {form.role === 'vendor' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Nom de la Boutique *
                    </label>
                    <input
                      type="text"
                      value={form.shopName}
                      onChange={set('shopName')}
                      required
                      placeholder="Ex: Maison du Pagne Kita Bouaké"
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-500 focus:border-orange-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Quartier / Emplacement à Bouaké
                    </label>
                    <input
                      type="text"
                      value={form.storeLocation}
                      onChange={set('storeLocation')}
                      placeholder="Ex: Quartier Commerce, Bouaké"
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-500 focus:border-orange-500 outline-none transition-all"
                    />
                  </div>
                  {/* Upload Documents KYC */}
                  <div className="space-y-3">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold flex items-center gap-1.5">
                      <span className="text-orange-400">📄</span> Documents KYC (optionnel mais recommandé)
                    </p>
                    {[
                      { key: 'cni_recto', label: "CNI Recto" },
                      { key: 'cni_verso', label: "CNI Verso" },
                      { key: 'rccm',      label: "RCCM / Registre de Commerce" },
                    ].map(({ key, label }) => (
                      <div key={key}>
                        <label className="block text-xs font-bold text-slate-400 mb-1.5">{label}</label>
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <div className={`flex-1 flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-xs transition-all ${
                            docPreviews[key]
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                              : 'bg-slate-950 border-slate-800 text-slate-400 group-hover:border-orange-500/50'
                          }`}>
                            <span>{docPreviews[key] ? '✅ Document chargé' : '📁 Choisir un fichier...'}</span>
                          </div>
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            className="hidden"
                            onChange={(e) => handleDocUpload(key, e.target.files[0])}
                          />
                        </label>
                        {docPreviews[key] && docPreviews[key].startsWith('data:image') && (
                          <img src={docPreviews[key]} alt={label} className="mt-2 h-20 object-cover rounded-xl border border-slate-700 w-full" />
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Nom complet
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                  <input
                    type="text"
                    value={form.name}
                    onChange={set('name')}
                    required
                    placeholder="Marc Koffi"
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-500 focus:border-orange-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Adresse email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={set('email')}
                    placeholder="votre@email.com"
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-500 focus:border-orange-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Numéro de téléphone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={set('phone')}
                    placeholder="+225 07 00 00 00 00"
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-500 focus:border-orange-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={set('password')}
                    required
                    minLength={8}
                    placeholder="Minimum 8 caractères"
                    className="w-full pl-10 pr-10 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-500 focus:border-orange-500 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.confirmPassword}
                    onChange={set('confirmPassword')}
                    required
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-500 focus:border-orange-500 outline-none transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-60 text-slate-950 font-black py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-500/20 text-sm uppercase tracking-wider mt-2"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    S&apos;inscrire gratuitement <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="px-8 py-4 bg-slate-950/60 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-400">
              Déjà un compte ?{' '}
              <Link to="/auth/login" className="text-orange-400 font-bold hover:underline">
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
