'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { Button, Input, Card } from '@admin-platform/ui';
import { registerUser, ApiError } from '@/lib/api';

// ─── Constants ────────────────────────────────────────────────────────────────

const COUNTRY_OPTIONS = [
  { code: 'ZA', name: 'South Africa' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'KE', name: 'Kenya' },
  { code: 'GH', name: 'Ghana' },
  { code: 'EG', name: 'Egypt' },
  { code: 'ET', name: 'Ethiopia' },
  { code: 'TZ', name: 'Tanzania' },
  { code: 'UG', name: 'Uganda' },
  { code: 'MA', name: 'Morocco' },
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'DE', name: 'Germany' },
  { code: 'CN', name: 'China' },
  { code: 'IN', name: 'India' },
  { code: 'AE', name: 'United Arab Emirates' },
] as const;

// ─── Register Form ────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    firstName: '',
    lastName:  '',
    email:     '',
    password:  '',
    phone:     '',
    country:   '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function setField(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      // Clear field error on change
      if (fieldErrors[field]) {
        setFieldErrors((prev) => {
          const next = { ...prev };
          delete next[field];
          return next;
        });
      }
    };
  }

  function validate() {
    const errors: Record<string, string> = {};

    if (!form.firstName.trim()) errors.firstName = 'First name is required';
    if (!form.lastName.trim())  errors.lastName  = 'Last name is required';
    if (!form.email.trim())     errors.email     = 'Email is required';
    if (!form.password)         errors.password  = 'Password is required';
    else if (form.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[A-Z])(?=.*[a-z])(?=.*\d)/.test(form.password)) {
      errors.password =
        'Password must contain uppercase, lowercase, and a digit';
    }

    return errors;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);

    try {
      // 1. Register account via API gateway
      await registerUser({
        email:     form.email,
        password:  form.password,
        firstName: form.firstName,
        lastName:  form.lastName,
        phone:     form.phone || undefined,
        country:   form.country || undefined,
      });

      // 2. Sign in automatically with the same credentials
      const result = await signIn('credentials', {
        email:    form.email,
        password: form.password,
        redirect: false,
      });

      if (result?.error) {
        // Registration succeeded but auto-login failed — redirect to login
        router.push('/login');
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'CONFLICT' || err.code === 'EMAIL_ALREADY_EXISTS') {
          setFieldErrors({ email: 'An account with this email already exists' });
        } else {
          setError(err.message);
        }
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* Heading */}
      <div className="mb-8 text-center">
        <h1 className="font-display text-4xl text-foreground mb-2">
          CREATE ACCOUNT
        </h1>
        <p className="font-body text-sm text-foreground-muted">
          Join ADMIN Connect and start sourcing from Africa
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

            {/* Name row */}
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First name"
                placeholder="Jane"
                value={form.firstName}
                onChange={setField('firstName')}
                error={fieldErrors.firstName}
                autoComplete="given-name"
                disabled={loading}
                required
              />
              <Input
                label="Last name"
                placeholder="Smith"
                value={form.lastName}
                onChange={setField('lastName')}
                error={fieldErrors.lastName}
                autoComplete="family-name"
                disabled={loading}
                required
              />
            </div>

            <Input
              type="email"
              label="Email address"
              placeholder="you@company.com"
              value={form.email}
              onChange={setField('email')}
              error={fieldErrors.email}
              autoComplete="email"
              disabled={loading}
              required
            />

            <Input
              type="password"
              label="Password"
              placeholder="Min. 8 chars, upper + lower + digit"
              value={form.password}
              onChange={setField('password')}
              error={fieldErrors.password}
              autoComplete="new-password"
              disabled={loading}
              required
              hint="Must contain uppercase, lowercase, and a digit"
            />

            <Input
              type="tel"
              label="Phone (optional)"
              placeholder="+27 81 234 5678"
              value={form.phone}
              onChange={setField('phone')}
              autoComplete="tel"
              disabled={loading}
            />

            {/* Country select */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold font-body text-foreground-muted">
                Country (optional)
              </label>
              <select
                value={form.country}
                onChange={setField('country')}
                disabled={loading}
                className="h-10 px-3 w-full font-body bg-surface border border-border rounded-lg text-foreground text-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-background focus:border-brand disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <option value="">Select country…</option>
                {COUNTRY_OPTIONS.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full mt-1"
            >
              Create Account
            </Button>
          </div>
        </form>
      </Card>

      {/* Login link */}
      <p className="mt-6 text-center font-body text-sm text-foreground-muted">
        Already have an account?{' '}
        <Link
          href="/login"
          className="text-brand hover:text-brand-hover font-semibold transition-colors"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
