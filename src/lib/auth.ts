export interface CalonSiswaSummary {
  id: number;
  name: string;
  nis: string;
  jenjang?: string;
  jenjang_display?: string;
  biaya_id?: number | false;
  biaya_name?: string;
  tahunajaran_name?: string;
  state: string;
  is_data_complete?: boolean;
  has_tagihan?: boolean;
  payment_state?: string | null;
  progress_pct?: number;
}

export interface UserData {
  uid: number;
  partner_id: number;
  name: string;
  username: string;
  orangtua_id: number | false;
  siswa_id: number | false;
  active_siswa_id?: number; // Currently selected student (multi-anak santri aktif)
  is_calon_orangtua?: boolean;
  calon_siswa_id?: number | false;
  active_calon_siswa_id?: number; // Currently selected calon siswa (multi-anak calon)
  calon_siswa_list?: CalonSiswaSummary[];
  avatar_128?: string | false;
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

export function updateActiveCalonSiswa(calonId: number): void {
  const user = getUser();
  if (user) {
    setUser({ ...user, active_calon_siswa_id: calonId, calon_siswa_id: calonId });
  }
}

export function getActiveCalonSiswaId(): number | null {
  const user = getUser();
  if (!user) return null;
  if (user.active_calon_siswa_id) return user.active_calon_siswa_id;
  if (typeof user.calon_siswa_id === 'number') return user.calon_siswa_id;
  if (user.calon_siswa_list && user.calon_siswa_list.length > 0) return user.calon_siswa_list[0].id;
  return null;
}

export function getCalonSiswaList(): CalonSiswaSummary[] {
  const user = getUser();
  return user?.calon_siswa_list || [];
}

export function updateCalonSiswaList(list: CalonSiswaSummary[]): void {
  const user = getUser();
  if (user) {
    const activeId = user.active_calon_siswa_id || (list.length > 0 ? list[0].id : undefined);
    setUser({ ...user, calon_siswa_list: list, active_calon_siswa_id: activeId, calon_siswa_id: activeId || user.calon_siswa_id });
  }
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

export function isCalonOrangtua(): boolean {
  const user = getUser();
  return user?.is_calon_orangtua === true;
}

export function getCalonSiswaId(): number | false {
  const id = getActiveCalonSiswaId();
  return id !== null ? id : false;
}
