// All Odoo API calls are proxied through /odoo/ to avoid CORS
// Next.js rewrites /odoo/* -> http://localhost:10016/*
const ODOO_PROXY = '/odoo';

export const SESSION_EXPIRED_EVENT = 'ibs:session-expired';

export function notifySessionExpired() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
  }
}

interface FetchOptions extends RequestInit {
  params?: Record<string, string | number>;
}

export async function handleApiResponse<T = unknown>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') || '';

  if (
    response.status === 401 ||
    response.status === 403 ||
    (response.redirected && response.url.includes('/web/login'))
  ) {
    notifySessionExpired();
    throw new Error('Sesi Anda telah berakhir. Silakan login kembali.');
  }

  if (contentType.includes('text/html')) {
    notifySessionExpired();
    throw new Error('Sesi Anda telah berakhir. Silakan login kembali.');
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.error?.data?.message || data?.error?.message || data?.error;
    throw new Error(errorMsg || `HTTP ${response.status}: ${response.statusText}`);
  }

  if (data?.error) {
    const errorMsg = data.error?.data?.message || data.error?.message || '';
    const isSessionError =
      data.error?.code === 100 ||
      data.error?.code === 401 ||
      errorMsg.toLowerCase().includes('session expired') ||
      errorMsg.toLowerCase().includes('session invalid') ||
      errorMsg.toLowerCase().includes('otentikasi gagal');

    if (isSessionError) {
      notifySessionExpired();
      throw new Error('Sesi Anda telah berakhir. Silakan login kembali.');
    }

    throw new Error(errorMsg || `Error ${data.error.code || response.status}`);
  }

  if (data?.success === false && typeof data?.error === 'string') {
    const errLower = data.error.toLowerCase();
    if (
      errLower.includes('session expired') ||
      errLower.includes('tidak terotentikasi') ||
      errLower.includes('unauthorized')
    ) {
      notifySessionExpired();
      throw new Error('Sesi Anda telah berakhir. Silakan login kembali.');
    }
  }

  return data as T;
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

  return handleApiResponse<T>(response);
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

// Liveness check for active session
export async function checkSessionStatus(): Promise<boolean> {
  if (typeof window === 'undefined') return true;
  try {
    const res = await fetch(`${ODOO_PROXY}/api/v1/session/status`, {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });

    if (res.status === 401 || res.status === 403 || res.status === 303) {
      notifySessionExpired();
      return false;
    }

    const data = await res.json().catch(() => null);
    if (!data || !data.authenticated) {
      notifySessionExpired();
      return false;
    }
    return true;
  } catch {
    // Network glitches shouldn't immediately force-logout
    return true;
  }
}

// Helper: build proxied Odoo URL for inline fetch calls
export function odooUrl(path: string): string {
  return `${ODOO_PROXY}${path}`;
}
