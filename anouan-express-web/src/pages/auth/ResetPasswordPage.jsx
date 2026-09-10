// src/pages/auth/ResetPasswordPage.jsx
// Réinitialisation du mot de passe — Dark Premium Orange avec Logo retouché & animé

import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, ArrowRight, Loader2, CheckCircle } from 'lucide-react';
import { authAPI } from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import Logo from '../../components/ui/Logo';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  const toast = useToast();

  const [form, setForm] = useState({ newPassword: '', confirm: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirm) {
      const msg = 'Les mots de passe ne correspondent pas.';
      setError(msg);
      toast.error(msg);
      return;
    }
    if (form.newPassword.length < 8) {
      const msg = 'Le mot de passe doit faire au moins 8 caractères.';
      setError(msg);
      toast.error(msg);
      return;
    }
    setError('');
    setLoading(true);
    try {
      await authAPI.resetPassword({ token, email, newPassword: form.newPassword });
      setDone(true);
      toast.success('Mot de passe réinitialisé avec succès !');
      setTimeout(() => navigate('/auth/login'), 3000);
    } catch (err) {
      const msg = err.response?.data?.message || 'Lien invalide ou expiré.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 selection:bg-orange-500 selection:text-slate-950">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo Retouché & Animé */}
        <div className="flex justify-center mb-8">
          <Logo size="xl" to="/" />
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl">
          <div className="p-8">
            {!done ? (
              <>
                <h1 className="text-2xl font-black text-white mb-1">Nouveau mot de passe</h1>
                <p className="text-slate-400 text-xs mb-6">
                  Choisissez un mot de passe sécurisé pour votre compte.
                </p>

                {error && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/25 text-red-400 text-xs font-semibold rounded-2xl">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Nouveau mot de passe
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                      <input
                        type={showPwd ? 'text' : 'password'}
                        value={form.newPassword}
                        onChange={set('newPassword')}
                        required
                        minLength={8}
                        placeholder="Min. 8 caractères"
                        className="w-full pl-10 pr-10 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-500 focus:border-orange-500 outline-none transition-all"
                      />
                      <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                        {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                        type={showPwd ? 'text' : 'password'}
                        value={form.confirm}
                        onChange={set('confirm')}
                        required
                        placeholder="••••••••"
                        className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-500 focus:border-orange-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-60 text-slate-950 font-black py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-500/20 text-sm uppercase tracking-wider"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ArrowRight className="w-5 h-5" /> Réinitialiser</>}
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center py-6">
                <CheckCircle className="w-16 h-16 text-orange-400 mx-auto mb-4" />
                <h2 className="text-xl font-black text-white mb-2">Mot de passe modifié !</h2>
                <p className="text-slate-400 text-xs">
                  Vous allez être redirigé vers la page de connexion...
                </p>
              </div>
            )}
          </div>

          <div className="px-8 py-4 bg-slate-950/60 border-t border-slate-800 text-center">
            <Link to="/auth/login" className="text-xs font-bold text-orange-400 hover:underline">
              Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
