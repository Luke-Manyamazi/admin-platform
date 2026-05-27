/**
 * Auth.js (NextAuth v5) — ADMIN Ops dashboard.
 *
 * Credentials provider → api-gateway /auth/login → checks role is ADMIN.
 * Only users with role === 'ADMIN' may access this app.
 */

import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import type { ApiSuccessResponse } from '@admin-platform/types';
import { Role } from '@admin-platform/types';

const API_BASE =
  process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001/api/v1';

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
            cache: 'no-store',
          });

          if (!res.ok) return null;

          const envelope =
            (await res.json()) as ApiSuccessResponse<GatewayAuthData>;

          if (!envelope.success) return null;

          const { user, accessToken } = envelope.data;

          // ⛔ ONLY ADMIN role may access this ops dashboard
          if (user.role !== Role.ADMIN) return null;

          return {
            id:          user.id,
            email:       user.email,
            name:        `${user.firstName} ${user.lastName}`,
            role:        user.role,
            accessToken,
          };
        } catch {
          return null;
        }
      },
    }),
  ],

  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role        = user.role;
        token.accessToken = user.accessToken;
      }
      return token;
    },

    session({ session, token }) {
      session.accessToken = (token.accessToken as string | undefined) ?? '';
      session.user.id     = (token.sub as string | undefined) ?? '';
      session.user.role   = (token.role as string | undefined) ?? 'ADMIN';
      return session;
    },
  },

  pages: {
    signIn: '/login',
    error:  '/login',
  },

  session: {
    strategy: 'jwt',
    maxAge:   8 * 60 * 60, // 8-hour ops sessions
  },
});
