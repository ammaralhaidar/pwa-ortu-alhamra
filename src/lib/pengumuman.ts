import { apiGet } from './api';
import { isCalonOrangtua } from './auth';

export interface PengumumanItem {
  id: number;
  title: string;
  kategori: 'umum' | 'kesantrian' | 'akademik' | 'keuangan' | 'admisi';
  kategori_label: string;
  target_audience: 'semua' | 'ortu' | 'calon_ortu';
  target_audience_label: string;
  tanggal_buat: string | null;
  tanggal: string | null;
  is_pinned: boolean;
  author_name?: string;
  publisher_name?: string | null;
  cover_image_url: string | null;
  preview: string;
  state: 'draft' | 'published' | 'archived';
  deskripsi?: string;
}

interface PengumumanListResponse {
  success: boolean;
  data: PengumumanItem[];
  message?: string;
}

interface PengumumanDetailResponse {
  success: boolean;
  data: PengumumanItem;
  message?: string;
}

const READ_STORAGE_KEY = 'alhamra_read_pengumuman_ids';

export function getReadPengumumanIds(): number[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(READ_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function markPengumumanAsRead(id: number): number[] {
  if (typeof window === 'undefined') return [];
  try {
    const current = getReadPengumumanIds();
    if (!current.includes(id)) {
      const updated = [...current, id];
      localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    }
    return current;
  } catch {
    return [];
  }
}

export function isPengumumanRead(id: number, readIds?: number[]): boolean {
  const ids = readIds ?? getReadPengumumanIds();
  return ids.includes(id);
}

export async function fetchPengumumanList(kategori?: string, limit?: number, audience?: string): Promise<PengumumanItem[]> {
  try {
    const params: Record<string, string | number> = {};
    if (kategori && kategori !== 'semua' && kategori !== 'pinned') {
      params.kategori = kategori;
    }
    if (limit) {
      params.limit = limit;
    }

    const targetAudience = audience || (isCalonOrangtua() ? 'calon_ortu' : 'ortu');
    params.audience = targetAudience;

    const res = await apiGet<PengumumanListResponse>('/api/v1/pengumuman', params);
    if (res.success && Array.isArray(res.data)) {
      let list = res.data;
      if (kategori === 'pinned') {
        list = list.filter(item => item.is_pinned);
      }
      return list;
    }
    return [];
  } catch (err) {
    console.error('Error fetching pengumuman list:', err);
    return [];
  }
}

export async function fetchPengumumanDetail(id: number): Promise<PengumumanItem | null> {
  try {
    const res = await apiGet<PengumumanDetailResponse>(`/api/v1/pengumuman/${id}`);
    if (res.success && res.data) {
      return res.data;
    }
    return null;
  } catch (err) {
    console.error(`Error fetching pengumuman detail ${id}:`, err);
    return null;
  }
}
