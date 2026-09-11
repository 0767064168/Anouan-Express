// src/pages/auth/ResetPasswordPage.jsx
// Réinitialisation du mot de passe — Dark Premium Orange avec Logo retouché & animé

import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, ArrowRight, Loader2, CheckCircle } from 'lucide-react';
import { authAPI } from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import Logo from '../../components/ui/Logo';
import PasswordStrengthMeter from '../../components/ui/PasswordStrengthMeter';
import AuthLayout from '../../components/auth/AuthLayout';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  const toast = useToast();
  const hasValidResetLink = Boolean(token && email);

  const [form, setForm] = useState({ newPassword: '', confirm: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!hasValidResetLink) {
      const msg = 'Lien de réinitialisation invalide ou manquant.';
      setError(msg);
      toast.error(msg);
      return;
    }

    if (form.newPassword !== form.confirm) {
      const msg = 'Les mots de passe ne correspondent pas.';
      setError(msg);
      toast.error(msg);
      return;
    }
    if (form.newPassword.length < 8 || !/[A-Z]/.test(form.newPassword) || !/[0-9]/.test(form.newPassword)) {
      const msg = 'Le mot de passe doit contenir au moins 8 caractères, une majuscule et un chiffre.';
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
    <AuthLayout
      logo={<Logo size="xl" to="/" />}
      footer={
        <div className="text-center">
          <Link to="/auth/login" className="text-xs font-bold text-orange-400 hover:underline">
            Retour à la connexion
          </Link>
        </div>
      }
    >
      <div className="p-8">
        {!done ? (
          hasValidResetLink ? (
            <>
              <h1 className="text-2xl font-black text-white mb-1">Nouveau mot de passe</h1>
              <p className="text-slate-400 text-xs mb-4">
                Choisissez un mot de passe sécurisé pour votre compte. Le lien expire dans 1 heure.
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
                  <PasswordStrengthMeter password={form.newPassword} />
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
              <h2 className="text-xl font-black text-white mb-2">Lien invalide</h2>
              <p className="text-slate-400 text-xs leading-relaxed">
                Ce lien de réinitialisation est introuvable, expiré ou a déjà été utilisé.
                Demandez un nouveau lien pour continuer.
              </p>
              <div className="mt-6">
                <Link
                  to="/auth/forgot-password"
                  className="inline-flex items-center justify-center px-4 py-2 rounded-2xl bg-orange-500 text-slate-950 font-black text-xs uppercase tracking-wider"
                >
                  Demander un nouveau lien
                </Link>
              </div>
            </div>
          )
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
    </AuthLayout>
  );
}
