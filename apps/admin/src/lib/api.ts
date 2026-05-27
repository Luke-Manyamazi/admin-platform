/**
 * Server-side API helper for ADMIN Ops dashboard.
 * Wraps fetch() with auth headers + the standard ADMIN API envelope.
 */

const API_BASE =
  process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001/api/v1';

export function createServerApi(accessToken: string) {
  const headers: Record<string, string> = {
    'Content-Type':  'application/json',
    'Authorization': `Bearer ${accessToken}`,
  };

  async function request<T>(
    method: string,
    path: string,
    body?: unknown,
    params?: Record<string, string>,
    revalidate?: number,
  ): Promise<T> {
    const url = new URL(`${API_BASE}${path}`);
    if (params) {
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    }

    const res = await fetch(url.toString(), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      next: revalidate !== undefined ? { revalidate } : { revalidate: 0 },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`API ${method} ${path} → ${res.status}: ${text}`);
    }

    const json = (await res.json()) as { success: boolean; data: T };
    if (!json.success) {
      throw new Error(`API error on ${path}`);
    }
    return json.data;
  }

  return {
    get<T>(path: string, params?: Record<string, string>, revalidate?: number) {
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
