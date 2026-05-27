/**
 * Middleware — protect all /ops/* routes.
 * Unauthenticated → /login
 * Authenticated, visiting /login → /ops/dashboard
 */

import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { auth: session, nextUrl } = req;
  const isLoggedIn = !!session;
  const path = nextUrl.pathname;

  const isOpsPath  = path.startsWith('/ops');
  const isLoginPage = path === '/login';

  if (isOpsPath && !isLoggedIn) {
    const loginUrl = new URL('/login', nextUrl);
    loginUrl.searchParams.set('callbackUrl', nextUrl.href);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoginPage && isLoggedIn) {
    return NextResponse.redirect(new URL('/ops/dashboard', nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|icons|images).*)'],
};
