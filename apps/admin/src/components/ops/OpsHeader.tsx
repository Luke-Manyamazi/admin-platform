'use client';

import { useSession } from 'next-auth/react';
import { HeaderBar } from '@admin-platform/ui';
import { initials } from '@/lib/format';

export function OpsHeader() {
  const { data: session } = useSession();
  const name = session?.user?.name ?? 'Ops';

  return (
    <HeaderBar>
      <div className="flex-1" />

      {/* OPS badge */}
      <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-brand/10 border border-brand/20 font-body text-xs text-brand font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
        Camluk Ops
      </span>

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
