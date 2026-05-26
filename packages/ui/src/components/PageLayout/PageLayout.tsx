'use client';

import * as React from 'react';
import { cn } from '../../lib/cn';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PageLayoutProps {
  children: React.ReactNode;
  /** Sidebar content — renders as a fixed left column on md+ screens */
  sidebar?: React.ReactNode;
  /** Top header bar content */
  header?: React.ReactNode;
  /** Extra classes on the outer wrapper */
  className?: string;
}

export interface SidebarProps {
  children: React.ReactNode;
  className?: string;
  /** Controlled collapsed state — pass undefined for uncontrolled */
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export interface HeaderBarProps extends React.HTMLAttributes<HTMLElement> {}

// ─── HeaderBar ────────────────────────────────────────────────────────────────

export function HeaderBar({ className, children, ...props }: HeaderBarProps): React.JSX.Element {
  return (
    <header
      className={cn(
        'h-16 flex items-center gap-4 px-6',
        'bg-surface border-b border-border',
        'sticky top-0 z-40',
        className,
      )}
      {...props}
    >
      {children}
    </header>
  );
}
HeaderBar.displayName = 'HeaderBar';

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export function Sidebar({
  children,
  className,
  collapsed = false,
}: SidebarProps): React.JSX.Element {
  return (
    <aside
      data-collapsed={collapsed}
      className={cn(
        'flex flex-col h-full',
        'bg-surface border-r border-border',
        'transition-[width] duration-200 ease-in-out',
        collapsed ? 'w-16' : 'w-64',
        className,
      )}
    >
      {children}
    </aside>
  );
}
Sidebar.displayName = 'Sidebar';

// ─── PageLayout ───────────────────────────────────────────────────────────────

/**
 * Root page layout with optional sidebar.
 *
 * Structure:
 *
 *   <PageLayout sidebar={<Sidebar>…</Sidebar>} header={<HeaderBar>…</HeaderBar>}>
 *     <main content />
 *   </PageLayout>
 *
 * The sidebar is hidden on mobile (< md) — add a mobile navigation drawer
 * separately in the consuming app.
 */
export function PageLayout({
  children,
  sidebar,
  header,
  className,
}: PageLayoutProps): React.JSX.Element {
  return (
    <div className={cn('flex h-screen bg-background overflow-hidden', className)}>
      {/* Sidebar — hidden below md breakpoint */}
      {sidebar !== undefined && (
        <div className="hidden md:flex shrink-0 h-full">{sidebar}</div>
      )}

      {/* Main column */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {header !== undefined && header}
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
PageLayout.displayName = 'PageLayout';
