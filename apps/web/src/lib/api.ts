/**
 * ADMIN Connect — API client utilities.
 *
 * Two patterns:
 *
 *   1. Server-side (Server Components, Route Handlers):
 *      createServerApi(accessToken) → { get, post, patch, del }
 *      Uses native fetch() — compatible with Next.js caching.
 *
 *   2. Client-side (Client Components):
 *      Use the useApiClient() hook in client-components/hooks/use-api-client.ts
 *      which returns an axios instance with the session token attached.
 *
 * All responses follow the standard ADMIN envelope:
 *   { success: true,  data: T,     meta: {...} }
 *   { success: false, error: { code, message, traceId } }
 */

import type { ApiResponse, ApiErrorDetail } from '@admin-platform/types';

const API_BASE =
  process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001/api/v1';

// ─── Error ────────────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ─── Server-side API factory ──────────────────────────────────────────────────

/**
 * Create a server-side API client bound to a specific access token.
 *
 * @example
 * ```ts
 * // In a Server Component
 * const session = await auth();
 * if (!session) redirect('/login');
 * const api = createServerApi(session.accessToken);
 * const factories = await api.get<FactoryResponse[]>('/factories');
 * ```
 */
export function createServerApi(accessToken: string) {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    Authorization:  `Bearer ${accessToken}`,
  };

  async function request<T>(
    method: string,
    path: string,
    body?: unknown,
    params?: Record<string, string | number | boolean>,
    revalidate?: number,
  ): Promise<T> {
    const url = new URL(`${API_BASE}${path}`);

    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        url.searchParams.set(k, String(v));
      });
    }

    const res = await fetch(url.toString(), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...(revalidate !== undefined
        ? { next: { revalidate } }
        : { cache: 'no-store' }),
    });

    const envelope = (await res.json()) as ApiResponse<T>;

    if (!envelope.success) {
      const err = (envelope as { success: false; error: ApiErrorDetail }).error;
      throw new ApiError(err.message, err.code, res.status);
    }

    return (envelope as { success: true; data: T }).data;
  }

  return {
    get<T>(
      path: string,
      params?: Record<string, string | number | boolean>,
      revalidate?: number,
    ) {
      return request<T>('GET', path, undefined, params, revalidate);
    },

    post<T>(path: string, body?: unknown) {
      return request<T>('POST', path, body);
    },

    patch<T>(path: string, body?: unknown) {
      return request<T>('PATCH', path, body);
    },

    del<T>(path: string) {
      return request<T>('DELETE', path);
    },
  };
}

// ─── Register helper (public — no auth token needed) ─────────────────────────

export interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  country?: string;
}

export interface GatewayAuthData {
  accessToken: string;
  user: {
    id: string;
    email: string;
    role: string;
    firstName: string;
    lastName: string;
  };
}

/**
 * Call POST /auth/register.  Returns the auth response or throws ApiError.
 * Used in the Register page (client-side) before the session exists.
 */
export async function registerUser(
  payload: RegisterPayload,
): Promise<GatewayAuthData> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
    cache:   'no-store',
  });

  const envelope = (await res.json()) as ApiResponse<GatewayAuthData>;

  if (!envelope.success) {
    const err = (envelope as { success: false; error: ApiErrorDetail }).error;
    throw new ApiError(err.message, err.code, res.status);
  }

  return (envelope as { success: true; data: GatewayAuthData }).data;
}
