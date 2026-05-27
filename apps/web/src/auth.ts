/**
 * Auth.js (NextAuth v5) configuration for ADMIN Connect.
 *
 * Strategy: Credentials provider → calls api-gateway /auth/login → stores
 * gateway-issued JWT in the NextAuth session so every subsequent API call
 * can attach `Authorization: Bearer <accessToken>`.
 *
 * Exports:
 *   handlers  — GET/POST route handlers for app/api/auth/[...nextauth]/route.ts
 *   signIn    — programmatic sign-in (used in login page server action)
 *   signOut   — programmatic sign-out
 *   auth      — session accessor for Server Components, Route Handlers, Middleware
 */

import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import type { ApiSuccessResponse } from '@admin-platform/types';

const API_BASE =
  process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001/api/v1';

/** Shape returned by POST /api/v1/auth/login */
interface GatewayAuthData {
  readonly accessToken: string;
  readonly user: {
    readonly id: string;
    readonly email: string;
    readonly role: string;
    readonly firstName: string;
    readonly lastName: string;
  };
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      id: 'credentials',
      name: 'Email & Password',
      credentials: {
        email:    { label: 'Email',    type: 'email'    },
        password: { label: 'Password', type: 'password' },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const res = await fetch(`${API_BASE}/auth/login`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({
              email:    credentials.email,
              password: credentials.password,
            }),
            // Do not cache login requests
            cache: 'no-store',
          });

          if (!res.ok) return null;

          const envelope =
            (await res.json()) as ApiSuccessResponse<GatewayAuthData>;

          if (!envelope.success) return null;

          const { user, accessToken } = envelope.data;

          return {
            id:          user.id,
            email:       user.email,
            name:        `${user.firstName} ${user.lastName}`,
            role:        user.role,
            accessToken,
          };
        } catch {
          // Network error — gateway unavailable
          return null;
        }
      },
    }),
  ],

  callbacks: {
    /**
     * Persist gateway-issued fields (role, accessToken) into the JWT cookie.
     * Called on sign-in and on every session access (token refresh).
     */
    jwt({ token, user }) {
      if (user) {
        // Only populated on initial sign-in
        token.role        = user.role;
        token.accessToken = user.accessToken;
      }
      return token;
    },

    /**
     * Expose the persisted JWT fields on the Session object returned by
     * useSession() / auth().
     */
    session({ session, token }) {
      // NextAuth v5 beta: token may type extra fields as unknown in session cb
      session.accessToken = (token.accessToken as string | undefined) ?? '';
      session.user.id     = (token.sub as string | undefined) ?? '';
      session.user.role   = (token.role as string | undefined) ?? 'BUYER';
      return session;
    },
  },

  pages: {
    signIn: '/login',
    error:  '/login',    // redirect error query param to login page
  },

  session: {
    strategy: 'jwt',
    maxAge:   7 * 24 * 60 * 60, // 7 days — matches gateway JWT_EXPIRES_IN
  },
});
