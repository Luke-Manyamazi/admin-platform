/**
 * Type augmentation for Auth.js (NextAuth v5).
 *
 * Extends the default Session and JWT with ADMIN-specific fields:
 *   session.accessToken  — the gateway-issued JWT forwarded to the API
 *   session.user.id      — UUID from the database
 *   session.user.role    — Role enum value (BUYER | FACTORY_OWNER | ADMIN)
 */

import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    /** JWT issued by api-gateway — attach as `Authorization: Bearer <token>` */
    accessToken: string;
    user: {
      id: string;
      /** Role enum: 'BUYER' | 'FACTORY_OWNER' | 'ADMIN' */
      role: string;
    } & DefaultSession['user'];
  }

  interface User {
    /** Role enum value from the gateway auth response */
    role: string;
    /** JWT access token issued by the gateway */
    accessToken: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    /** Persisted from User.role across sessions */
    role: string;
    /** Persisted from User.accessToken across sessions */
    accessToken: string;
  }
}
