import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { createServerApi } from '@/lib/api';
import { Card, Badge } from '@admin-platform/ui';
import { formatDate, initials } from '@/lib/format';

export const metadata: Metadata = { title: 'Profile' };

export default async function ProfilePage() {
  const session = await auth();
  if (!session) redirect('/login');

  const api = createServerApi(session.accessToken);

  let user: {
    id: string;
    email: string;
    role: string;
    firstName: string;
    lastName: string;
    isVerified: boolean;
    createdAt: string;
  } | null = null;

  try {
    user = await api.get('/auth/me');
  } catch {
    // Use session data as fallback
  }

  const name  = user
    ? `${user.firstName} ${user.lastName}`
    : (session.user.name ?? 'Unknown User');
  const email = user?.email ?? session.user.email ?? '';
  const role  = user?.role  ?? session.user.role  ?? 'BUYER';

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-4xl text-foreground mb-1">
          MY PROFILE
        </h1>
        <p className="font-body text-sm text-foreground-muted">
          Your account information on ADMIN Connect.
        </p>
      </div>

      {/* Avatar + name card */}
      <Card variant="elevated" padding="lg">
        <div className="flex items-center gap-5">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-full bg-brand/15 border-2 border-brand/30 flex items-center justify-center font-display text-2xl text-brand shrink-0 select-none">
            {initials(name)}
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="font-display text-2xl text-foreground">{name}</h2>
            <p className="font-body text-sm text-foreground-muted">{email}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="info" size="sm">
                {role.replace(/_/g, ' ')}
              </Badge>
              {user?.isVerified && (
                <Badge variant="success" size="sm">
                  ✓ Verified
                </Badge>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Account details */}
      <Card variant="elevated" padding="md">
        <h3 className="font-display text-xl text-foreground mb-4">
          ACCOUNT DETAILS
        </h3>
        <div className="space-y-4">
          {[
            { label: 'User ID',       value: user?.id ?? session.user.id ?? '—', mono: true  },
            { label: 'Email',         value: email,                               mono: false },
            { label: 'Role',          value: role.replace(/_/g, ' '),             mono: false },
            { label: 'Member Since',  value: user?.createdAt ? formatDate(user.createdAt) : '—', mono: false },
          ].map(({ label, value, mono }) => (
            <div
              key={label}
              className="flex items-start justify-between py-2.5 border-b border-border last:border-0"
            >
              <span className="font-body text-xs text-foreground-subtle uppercase tracking-wide w-28 shrink-0 pt-0.5">
                {label}
              </span>
              <span
                className={`${
                  mono ? 'font-mono text-xs' : 'font-body text-sm'
                } text-foreground text-right break-all`}
              >
                {value}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Info notice */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-surface border border-border font-body text-sm text-foreground-muted">
        <span className="text-foreground-subtle text-lg mt-0.5 shrink-0">ℹ</span>
        <p>
          To update your name, email, or password, please contact{' '}
          <a
            href="mailto:support@camluk.com"
            className="text-brand hover:text-brand-hover transition-colors"
          >
            support@camluk.com
          </a>
          . Profile editing will be available in a future update.
        </p>
      </div>
    </div>
  );
}
