// src/pages/auth/LoginPage.jsx
// Page de connexion — email/mot de passe + OTP par téléphone avec Logo Animé & Toast

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Phone, Eye, EyeOff, ArrowRight, Loader2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { authAPI } from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import Logo from '../../components/ui/Logo';
import AuthLayout from '../../components/auth/AuthLayout';
import AuthAlert from '../../components/auth/AuthAlert';
import AuthInput from '../../components/auth/AuthInput';
import AuthPrimaryButton from '../../components/auth/AuthPrimaryButton';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loginOTP } = useAuth();
  const toast = useToast();

  const [mode, setMode] = useState('password'); // 'password' | 'otp'
  const [step, setStep] = useState(1); // 1: téléphone, 2: code OTP
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    email: '',
    password: '',
    phone: '',
    otp: '',
  });

  const set = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const getRoleRedirect = (role) => {
    const r = (role || '').toLowerCase();
    if (r === 'admin') return '/admin';
    if (r === 'vendor') return '/vendor';
    if (r === 'agent') return '/agent';
    return '/';
  };

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login({ email: form.email, password: form.password });
      const role = data?.user?.role || data?.role || '';
      toast.success(`Bienvenue ${data?.user?.name || ''} !`);
      navigate(getRoleRedirect(role), { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || 'Email ou mot de passe incorrect.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authAPI.sendOTP({ phone: form.phone });
      setStep(2);
      toast.info('Code SMS envoyé avec succès.');
    } catch (err) {
      const msg = err.response?.data?.message || 'Impossible d\'envoyer le code SMS.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await loginOTP({ phone: form.phone, otp: form.otp });
      const role = data?.user?.role || data?.role || '';
      toast.success('Connexion OTP réussie !');
      navigate(getRoleRedirect(role), { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || 'Code OTP invalide ou expiré.';
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
          <p className="text-xs text-slate-400">
            Pas encore de compte ?{' '}
            <Link
              to="/auth/register"
              className="text-orange-400 font-bold hover:underline"
            >
              S&apos;inscrire
            </Link>
          </p>
        </div>
      }
    >
      <div className="p-8">
        <h1 className="text-2xl font-black text-white mb-1">Bienvenue 👋</h1>
        <p className="text-slate-400 text-xs mb-6">
          Connectez-vous à votre compte Anouan Express
        </p>

        <div className="flex rounded-2xl bg-slate-950 p-1 mb-6 border border-slate-800">
          <button
            type="button"
            onClick={() => { setMode('password'); setError(''); }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
              mode === 'password'
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Mail className="w-4 h-4 inline mr-1.5" />
            Email
          </button>
          <button
            type="button"
            onClick={() => { setMode('otp'); setStep(1); setError(''); }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
              mode === 'otp'
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Phone className="w-4 h-4 inline mr-1.5" />
            SMS OTP
          </button>
        </div>

        {error && <AuthAlert>{error}</AuthAlert>}

        {mode === 'password' && (
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <AuthInput
              id="email"
              name="email"
              label="Email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={set('email')}
              placeholder="votre@email.com"
              required
              icon={Mail}
            />

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Mot de passe
                </label>
                <Link
                  to="/auth/forgot-password"
                  className="text-xs text-orange-400 hover:underline font-semibold"
                >
                  Oublié ?
                </Link>
              </div>
              <AuthInput
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={form.password}
                onChange={set('password')}
                placeholder="••••••••"
                required
                icon={Lock}
                rightSlot={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-500 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />
            </div>

            <AuthPrimaryButton loading={loading}>
              <>
                Se connecter <ArrowRight className="w-5 h-5" />
              </>
            </AuthPrimaryButton>
          </form>
        )}

        {mode === 'otp' && (
          <>
            {step === 1 && (
              <form onSubmit={handleSendOTP} className="space-y-4">
                <AuthInput
                  id="phone"
                  name="phone"
                  label="Numéro de téléphone"
                  type="tel"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={set('phone')}
                  placeholder="+225 07 00 00 00 00"
                  required
                  icon={Phone}
                />
                <AuthPrimaryButton loading={loading}>
                  <>
                    Recevoir le code SMS <ArrowRight className="w-5 h-5" />
                  </>
                </AuthPrimaryButton>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div className="text-center py-2">
                  <ShieldCheck className="w-10 h-10 text-orange-400 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">
                    Code envoyé au <strong className="text-white">{form.phone}</strong>
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 text-center">
                    Code OTP (6 chiffres)
                  </label>
                  <input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={form.otp}
                    onChange={set('otp')}
                    required
                    placeholder="123456"
                    className="w-full text-center text-2xl font-mono font-bold tracking-[0.3em] py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:border-orange-500 outline-none transition-all"
                  />
                </div>
                <AuthPrimaryButton loading={loading}>
                  <>
                    Valider <ArrowRight className="w-5 h-5" />
                  </>
                </AuthPrimaryButton>
                <button
                  type="button"
                  onClick={() => { setStep(1); setForm(f => ({ ...f, otp: '' })); }}
                  className="w-full text-xs font-semibold text-slate-400 hover:text-white py-2 transition-colors"
                >
                  ← Modifier le numéro
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </AuthLayout>
  );
}
