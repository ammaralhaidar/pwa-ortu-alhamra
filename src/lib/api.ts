// All Odoo API calls are proxied through /odoo/ to avoid CORS
// Next.js rewrites /odoo/* -> http://localhost:10016/*
const ODOO_PROXY = '/odoo';

export const SESSION_EXPIRED_EVENT = 'ibs:session-expired';

let sessionExpiredFlag = false;
const sessionExpiredListeners = new Set<(expired: boolean) => void>();

export function isSessionExpired(): boolean {
  return sessionExpiredFlag;
}

export function notifySessionExpired() {
  if (sessionExpiredFlag) return; // Prevent duplicate triggers
  sessionExpiredFlag = true;
  sessionExpiredListeners.forEach((fn) => fn(true));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
  }
}

export function resetSessionExpired() {
  sessionExpiredFlag = false;
  sessionExpiredListeners.forEach((fn) => fn(false));
}

export function subscribeSessionExpired(listener: (expired: boolean) => void) {
  sessionExpiredListeners.add(listener);
  // If session already expired before subscription, notify immediately!
  if (sessionExpiredFlag) {
    listener(true);
  }
  return () => {
    sessionExpiredListeners.delete(listener);
  };
}

// Global browser fetch interceptor to catch expired session on ANY Odoo request in ANY page
if (typeof window !== 'undefined' && !(window as any).__ibsFetchInterceptionActive) {
  (window as any).__ibsFetchInterceptionActive = true;
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    const url = typeof args[0] === 'string' ? args[0] : (args[0] instanceof Request ? args[0].url : '');
    try {
      const response = await originalFetch(...args);

      if (url.includes('/odoo/') || url.includes('/api/v1/')) {
        const isRedirectedToLogin = response.redirected && response.url.includes('/web/login');
        if (response.status === 401 || response.status === 403 || isRedirectedToLogin) {
          notifySessionExpired();
          return response;
        }

        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('text/html')) {
          try {
            const clone = response.clone();
            const text = await clone.text();
            if (text.includes('/web/login') || text.includes('csrf_token') || clone.url.includes('/web/login')) {
              notifySessionExpired();
            }
          } catch {
            // ignore stream clone errors
          }
        } else if (contentType.includes('application/json')) {
          try {
            const clone = response.clone();
            const json = await clone.json();
            if (
              json?.error === 'session_expired' ||
              json?.error?.code === 100 ||
              (typeof json?.error?.message === 'string' && json.error.message.toLowerCase().includes('session expired'))
            ) {
              notifySessionExpired();
            }
          } catch {
            // ignore json clone errors
          }
        }
      }
      return response;
    } catch (err) {
      throw err;
    }
  };
}

interface FetchOptions extends RequestInit {
  params?: Record<string, string | number>;
}

export async function handleApiResponse<T = unknown>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') || '';
  const isHtml = contentType.includes('text/html');

  // Explicit Auth / Session Failure:
  // 1. Status 401 Unauthorized or 403 Forbidden
  // 2. Redirected to Odoo web login (/web/login)
  const isRedirectedToLogin = response.redirected && response.url.includes('/web/login');
  if (response.status === 401 || response.status === 403 || isRedirectedToLogin) {
    notifySessionExpired();
    throw new Error('Sesi Anda telah berakhir. Silakan login kembali.');
  }

  // If HTML is returned from an API route, inspect if it's the Odoo login page
  if (isHtml) {
    const text = await response.text().catch(() => '');
    if (text.includes('/web/login') || text.includes('csrf_token') || response.url.includes('/web/login')) {
      notifySessionExpired();
      throw new Error('Sesi Anda telah berakhir. Silakan login kembali.');
    }
    // If it's HTML but NOT a login page (e.g. 404, 502, or 500 error page), do NOT trigger session expired!
    throw new Error(`Server error (${response.status}): Tidak dapat memproses permintaan.`);
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
      errorMsg.toLowerCase().includes('session invalid');

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
      errLower.includes('tidak terotentikasi')
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

// Silent session check for visibility change (resume from background)
export async function checkSessionStatus(): Promise<boolean> {
  if (typeof window === 'undefined') return true;
  try {
    const res = await fetch(`${ODOO_PROXY}/api/v1/siswa/list`, {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });

    const isRedirectedToLogin = res.redirected && res.url.includes('/web/login');
    if (res.status === 401 || res.status === 403 || isRedirectedToLogin) {
      notifySessionExpired();
      return false;
    }

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      const text = await res.text().catch(() => '');
      if (text.includes('/web/login') || text.includes('csrf_token') || res.url.includes('/web/login')) {
        notifySessionExpired();
        return false;
      }
    }

    return true;
  } catch {
    // Network errors should never force-logout
    return true;
  }
}

// Helper: build proxied Odoo URL for inline fetch calls
export function odooUrl(path: string): string {
  return `${ODOO_PROXY}${path}`;
}
