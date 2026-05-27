'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Sidebar } from '@admin-platform/ui';
import { cn } from '@admin-platform/ui';

// ─── Nav items ────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  {
    href:  '/dashboard',
    label: 'Dashboard',
    icon:  (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href:  '/factories',
    label: 'Factories',
    icon:  (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    href:  '/orders',
    label: 'My Orders',
    icon:  (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  {
    href:  '/profile',
    label: 'Profile',
    icon:  (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
] as const;

// ─── Component ────────────────────────────────────────────────────────────────

export function PortalSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      {/* Brand */}
      <div className="h-16 flex items-center px-5 border-b border-border shrink-0">
        <span className="font-display text-2xl text-brand tracking-wider">
          ADMIN
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg font-body text-sm font-medium transition-colors duration-150',
                isActive
                  ? 'bg-brand/10 text-brand border border-brand/20'
                  : 'text-foreground-muted hover:text-foreground hover:bg-surface-elevated',
              )}
            >
              <span
                className={cn(
                  'shrink-0',
                  isActive ? 'text-brand' : 'text-foreground-subtle',
                )}
              >
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Place Order CTA */}
      <div className="px-3 py-4 border-t border-border shrink-0">
        <Link
          href="/orders/new"
          className="flex items-center justify-center gap-2 w-full px-3 py-2.5 rounded-lg bg-brand text-brand-foreground font-body text-sm font-semibold hover:bg-brand-hover transition-colors duration-150"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Place New Order
        </Link>

        {/* Sign out */}
        <button
          onClick={() => void signOut({ callbackUrl: '/login' })}
          className="mt-2 flex items-center gap-3 w-full px-3 py-2 rounded-lg font-body text-sm text-foreground-subtle hover:text-foreground-muted hover:bg-surface-elevated transition-colors duration-150"
        >
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign Out
        </button>
      </div>
    </Sidebar>
  );
}
