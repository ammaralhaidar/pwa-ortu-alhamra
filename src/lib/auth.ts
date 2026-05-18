export interface UserData {
  uid: number;
  partner_id: number;
  name: string;
  username: string;
  orangtua_id: number | false;
  siswa_id: number | false;
  active_siswa_id?: number; // Currently selected student (multi-anak)
}

const USER_KEY = 'ibs_pwa_user';

export function getUser(): UserData | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function setUser(data: UserData): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USER_KEY, JSON.stringify(data));
}

export function updateActiveSiswa(siswaId: number): void {
  const user = getUser();
  if (user) {
    setUser({ ...user, active_siswa_id: siswaId });
  }
}

export function getActiveSiswaId(): number | null {
  const user = getUser();
  if (!user) return null;
  if (user.active_siswa_id) return user.active_siswa_id;
  if (typeof user.siswa_id === 'number') return user.siswa_id;
  return null;
}

export function isLoggedIn(): boolean {
  return getUser() !== null;
}

export async function logout(): Promise<void> {
  try {
    const odooUrl = process.env.NEXT_PUBLIC_ODOO_URL || 'http://localhost:10016';
    await fetch(`${odooUrl}/api/v1/session/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ params: {} }),
    });
  } catch {
    // ignore errors
  } finally {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(USER_KEY);
    }
  }
}
