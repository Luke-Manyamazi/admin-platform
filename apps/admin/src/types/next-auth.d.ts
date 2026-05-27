import type { DefaultSession } from 'next-auth';

/**
 * Augment NextAuth v5 types to include the fields we add in the JWT / session
 * callbacks inside src/auth.ts.
 */
declare module 'next-auth' {
  interface Session {
    /** Gateway-issued JWT attached to every API request */
    accessToken: string;
    user: {
      id: string;
      role: string;
    } & DefaultSession['user'];
  }

  interface User {
    role: string;
    accessToken: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: string;
    accessToken: string;
  }
}
