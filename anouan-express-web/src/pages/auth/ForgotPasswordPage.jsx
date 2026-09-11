// src/pages/auth/ForgotPasswordPage.jsx
// Mot de passe oublié — Dark Premium Orange avec Logo retouché & animé

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight, Loader2, CheckCircle, ArrowLeft } from 'lucide-react';
import { authAPI } from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import Logo from '../../components/ui/Logo';
import AuthLayout from '../../components/auth/AuthLayout';
import AuthAlert from '../../components/auth/AuthAlert';
import AuthInput from '../../components/auth/AuthInput';
import AuthPrimaryButton from '../../components/auth/AuthPrimaryButton';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      const msg = 'Veuillez saisir une adresse email.';
      setError(msg);
      toast.error(msg);
      return;
    }

    setEmail(normalizedEmail);
    setError('');
    setLoading(true);
    try {
      await authAPI.forgotPassword({ email: normalizedEmail });
      setSent(true);
      toast.success('Lien de réinitialisation envoyé !');
    } catch (err) {
      const msg = err.response?.data?.message || 'Une erreur est survenue.';
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
        <Link
          to="/auth/login"
          className="flex items-center justify-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Retour à la connexion
        </Link>
      }
    >
      <div className="p-8">
        {!sent ? (
          <>
            <h1 className="text-2xl font-black text-white mb-1">Mot de passe oublié</h1>
            <p className="text-slate-400 text-xs mb-6">
              Entrez votre adresse email pour recevoir le lien de réinitialisation.
            </p>

            {error && <AuthAlert>{error}</AuthAlert>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <AuthInput
                id="email"
                name="email"
                label="Adresse email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                required
                icon={Mail}
              />
              <AuthPrimaryButton loading={loading}>
                <>
                  Envoyer le lien <ArrowRight className="w-5 h-5" />
                </>
              </AuthPrimaryButton>
            </form>
          </>
        ) : (
          <div className="text-center py-6">
            <CheckCircle className="w-16 h-16 text-orange-400 mx-auto mb-4" />
            <h2 className="text-xl font-black text-white mb-2">Email envoyé !</h2>
            <p className="text-slate-400 text-xs leading-relaxed">
              Si cet email existe dans notre système, vous recevrez un lien de réinitialisation dans quelques minutes.
              Vérifiez aussi votre boîte spam si vous ne le voyez pas. Le lien expire dans 1 heure.
            </p>
          </div>
        )}
      </div>
    </AuthLayout>
  );
}
