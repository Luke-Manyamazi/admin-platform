'use client';

import type { Metadata } from 'next';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button, Input, Card } from '@admin-platform/ui';

// Note: metadata cannot be exported from a 'use client' component —
// define it in a separate server wrapper or use <head> directly if needed.

export default function OpsLoginPage() {
  const router  = useRouter();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError('Access denied. Check your credentials or contact your administrator.');
      return;
    }

    router.replace('/ops/dashboard');
  }

  return (
    <div className="w-full max-w-sm">
      {/* Lock icon */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-brand/10 border border-brand/25 mb-4">
          <svg className="w-7 h-7 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
        </div>
        <h1 className="font-display text-3xl text-foreground">OPS PORTAL</h1>
        <p className="font-body text-sm text-foreground-muted mt-1">
          Camluk team access only
        </p>
      </div>

      <Card variant="elevated" padding="lg">
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div>
            <label className="block font-body text-sm text-foreground-muted mb-1.5">
              Email address
            </label>
            <Input
              type="email"
              placeholder="ops@camluk.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block font-body text-sm text-foreground-muted mb-1.5">
              Password
            </label>
            <Input
              type="password"
              placeholder="••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="font-body text-sm text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={loading}
          >
            {loading ? 'Signing in…' : 'Sign In to Ops'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
