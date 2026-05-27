'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { HeaderBar } from '@admin-platform/ui';
import { initials } from '@/lib/format';

interface PortalHeaderProps {
  /** Page title shown in the header bar */
  title?: string;
}

export function PortalHeader({ title }: PortalHeaderProps) {
  const { data: session } = useSession();
  const name = session?.user?.name ?? 'Buyer';

  return (
    <HeaderBar>
      {/* Page title */}
      {title !== undefined ? (
        <h1 className="font-display text-2xl text-foreground flex-1">
          {title}
        </h1>
      ) : (
        <div className="flex-1" />
      )}

      {/* Place Order — quick-access CTA */}
      <Link
        href="/orders/new"
        className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand/10 border border-brand/25 text-brand font-body text-sm font-medium hover:bg-brand/15 transition-colors duration-150"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        New Order
      </Link>

      {/* Avatar */}
      <div
        title={name}
        className="w-9 h-9 rounded-full bg-brand/15 border border-brand/25 flex items-center justify-center font-display text-sm text-brand select-none shrink-0"
      >
        {initials(name)}
      </div>
    </HeaderBar>
  );
}
