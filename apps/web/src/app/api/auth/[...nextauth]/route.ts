/**
 * NextAuth v5 catch-all route handler.
 * Delegates all auth HTTP traffic to the Auth.js handlers.
 *
 * Handles:
 *   GET  /api/auth/session
 *   GET  /api/auth/providers
 *   GET  /api/auth/csrf
 *   GET  /api/auth/signout
 *   POST /api/auth/callback/credentials
 *   POST /api/auth/signout
 */

import { handlers } from '@/auth';

export const { GET, POST } = handlers;
