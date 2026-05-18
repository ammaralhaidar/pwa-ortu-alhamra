// All Odoo API calls are proxied through /odoo/ to avoid CORS
// Next.js rewrites /odoo/* -> http://localhost:10016/*
const ODOO_PROXY = '/odoo';

interface FetchOptions extends RequestInit {
  params?: Record<string, string | number>;
}

export async function apiFetch<T = unknown>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const { params, ...fetchOptions } = options;

  let url = `${ODOO_PROXY}${path}`;
  if (params) {
    const query = new URLSearchParams(
      Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)]))
    );
    url += `?${query.toString()}`;
  }

  const response = await fetch(url, {
    ...fetchOptions,
    credentials: 'include', // Always send session_id cookie
    headers: {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

export async function apiGet<T = unknown>(
  path: string,
  params?: Record<string, string | number>
): Promise<T> {
  return apiFetch<T>(path, { method: 'GET', params });
}

export async function apiPost<T = unknown>(
  path: string,
  body: unknown
): Promise<T> {
  return apiFetch<T>(path, {
    method: 'POST',
    body: JSON.stringify({ params: body }),
  });
}

// Helper: build proxied Odoo URL for inline fetch calls
export function odooUrl(path: string): string {
  return `${ODOO_PROXY}${path}`;
}
