'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/_providers/AuthProvider';
import { Logo } from '@/components/Logo';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [twoFactorStep, setTwoFactorStep] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');

  const base = process.env.NEXT_PUBLIC_API_BASE_URL || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const url = base ? `${base}/auth/login` : '/api/auth/login';

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message || 'Identifiants incorrects');
        return;
      }

      const data = await res.json();

      if (data.requiresTwoFactor) {
        setTempToken(data.tempToken);
        setTwoFactorStep(true);
        return;
      }

      await finalizeLogin(data.token || data.access_token);
    } catch {
      setError('Erreur de connexion. Vérifiez votre réseau.');
    } finally {
      setLoading(false);
    }
  };

  const handleTwoFactor = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const url = base ? `${base}/auth/2fa-login` : '/api/auth/2fa-login';
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ tempToken, code: twoFactorCode }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message || 'Code invalide');
        return;
      }

      const data = await res.json();
      await finalizeLogin(data.token || data.access_token);
    } catch {
      setError('Erreur de connexion. Vérifiez votre réseau.');
    } finally {
      setLoading(false);
    }
  };

  const finalizeLogin = async (token: string) => {
    if (token) localStorage.setItem('token', token);
    await login();

    const meUrl = base ? `${base}/auth/me` : '/api/auth/me';
    const savedToken = localStorage.getItem('token');
    const meRes = await fetch(meUrl, {
      headers: {
        'Content-Type': 'application/json',
        ...(savedToken ? { Authorization: `Bearer ${savedToken}` } : {}),
      },
      credentials: 'include',
    });

    if (meRes.ok) {
      const me = await meRes.json();
      if (me.role !== 'ADMIN') {
        localStorage.removeItem('token');
        setError('Accès refusé : compte non administrateur.');
        return;
      }
    }

    router.replace('/dashboard');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <Logo className="h-20 w-auto" />
          <p className="text-sm text-muted-foreground">Connexion administrateur</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          {twoFactorStep ? (
            <form onSubmit={handleTwoFactor} className="space-y-4">
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-2xl">🔐</div>
                <p className="text-sm font-medium">Vérification en deux étapes</p>
                <p className="mt-1 text-xs text-muted-foreground">Entrez le code de votre application d'authentification</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="code">Code à 6 chiffres</label>
                <input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  className="input text-center text-2xl tracking-[0.5em]"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  required
                  autoFocus
                  autoComplete="one-time-code"
                />
              </div>
              {error && (
                <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
              )}
              <button type="submit" disabled={loading || twoFactorCode.length !== 6}
                className="btn-primary w-full justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                {loading ? 'Vérification…' : 'Vérifier'}
              </button>
              <button type="button" onClick={() => { setTwoFactorStep(false); setTwoFactorCode(''); setError(''); }}
                className="w-full text-center text-xs text-muted-foreground hover:text-foreground">
                ← Retour à la connexion
              </button>
            </form>
          ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@exemple.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="password">
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>
            {error && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>
          )}
        </div>
      </div>
    </div>
  );
}
