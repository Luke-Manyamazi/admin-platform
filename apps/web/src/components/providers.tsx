'use client';

/**
 * Client-side providers wrapper.
 *
 * Wraps the app with SessionProvider so useSession() is available
 * in any Client Component without needing to prop-drill the session.
 */

import { SessionProvider } from 'next-auth/react';

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
