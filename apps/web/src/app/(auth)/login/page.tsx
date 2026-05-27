'use client';

import type { Metadata } from 'next';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { Button, Input, Card } from '@admin-platform/ui';

// Note: metadata export works in Server Components; since this is a Client
// Component, metadata is declared in a separate server wrapper or in the layout.
// The page title is set by the layout template.

// ─── Login Form ───────────────────────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/dashboard';

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password. Please try again.');
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* Heading */}
      <div className="mb-8 text-center">
        <h1 className="font-display text-4xl text-foreground mb-2">
          WELCOME BACK
        </h1>
        <p className="font-body text-sm text-foreground-muted">
          Sign in to your ADMIN Connect account
        </p>
      </div>

      {/* Card */}
      <Card variant="elevated" padding="lg">
        <form onSubmit={(e) => void handleSubmit(e)} noValidate>
          <div className="flex flex-col gap-5">
            {/* Error banner */}
            {error !== null && (
              <div
                role="alert"
                className="px-4 py-3 rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm font-body"
              >
                {error}
              </div>
            )}

            <Input
              type="email"
              label="Email address"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              disabled={loading}
            />

            <Input
              type="password"
              label="Password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              disabled={loading}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full mt-1"
            >
              Sign In
            </Button>
          </div>
        </form>
      </Card>

      {/* Register link */}
      <p className="mt-6 text-center font-body text-sm text-foreground-muted">
        Don&apos;t have an account?{' '}
        <Link
          href="/register"
          className="text-brand hover:text-brand-hover font-semibold transition-colors"
        >
          Create one free
        </Link>
      </p>
    </div>
  );
}
