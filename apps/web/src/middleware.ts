/**
 * Next.js Middleware — route-level auth protection.
 *
 * Protected paths (require active session):
 *   /dashboard/**
 *   /factories/**
 *   /orders/**
 *   /profile/**
 *
 * Auth paths (redirect to dashboard if already logged in):
 *   /login
 *   /register
 *
 * The `auth` wrapper from NextAuth v5 provides req.auth (the session).
 */

import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { auth: session, nextUrl } = req;
  const isLoggedIn = !!session;

  const path = nextUrl.pathname;

  const isPortalPath =
    path.startsWith('/dashboard') ||
    path.startsWith('/factories') ||
    path.startsWith('/orders') ||
    path.startsWith('/profile');

  const isAuthPath = path === '/login' || path === '/register';

  // Unauthenticated users trying to access protected routes → login
  if (isPortalPath && !isLoggedIn) {
    const loginUrl = new URL('/login', nextUrl);
    loginUrl.searchParams.set('callbackUrl', nextUrl.href);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated users visiting auth pages → dashboard
  if (isAuthPath && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', nextUrl));
  }

  return NextResponse.next();
});

/** Only run middleware on relevant paths — skip static assets and Next.js internals */
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|icons|images).*)',
  ],
};
