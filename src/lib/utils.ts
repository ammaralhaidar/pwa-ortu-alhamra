import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function odooToUtc(dateStr: string | null | undefined): string {
  if (!dateStr || (dateStr as any) === false) return '';
  const str = String(dateStr).trim();
  if (!str || str === 'false') return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return `${str}T00:00:00Z`;
  }
  if (str.endsWith('Z') || /T.*[+-]\d{2}(:?\d{2})?$/.test(str)) return str;
  const iso = str.includes('T') ? str : str.replace(' ', 'T');
  return iso.endsWith('Z') ? iso : iso + 'Z';
}

export function parseDateSafe(dateVal: string | Date | null | undefined): Date | null {
  if (!dateVal || (dateVal as any) === false) return null;
  if (dateVal instanceof Date) {
    return isNaN(dateVal.getTime()) ? null : dateVal;
  }
  const str = String(dateVal).trim();
  if (!str || str === 'false') return null;

  const utcStr = odooToUtc(str);
  if (!utcStr) return null;

  const d = new Date(utcStr);
  return isNaN(d.getTime()) ? null : d;
}

export function formatDate(dateStr: string | Date | null | undefined): string {
  if (!dateStr || (dateStr as any) === false) return '-';
  try {
    const date = parseDateSafe(dateStr);
    if (!date) return '-';
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Asia/Jakarta',
    }).format(date);
  } catch {
    return '-';
  }
}

export function formatShortDate(dateStr: string | Date | null | undefined): string {
  if (!dateStr || (dateStr as any) === false) return '-';
  try {
    const date = parseDateSafe(dateStr);
    if (!date) return '-';
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      timeZone: 'Asia/Jakarta',
    }).format(date);
  } catch {
    return '-';
  }
}

export function formatDateTime(dateStr: string | Date | null | undefined): string {
  if (!dateStr || (dateStr as any) === false) return '-';
  try {
    const date = parseDateSafe(dateStr);
    if (!date) return '-';
    const formatted = new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Jakarta',
    }).format(date);
    return formatted.replace('.', ':') + ' WIB';
  } catch {
    return '-';
  }
}

export function formatFullDateTime(dateStr: string | Date | null | undefined): string {
  if (!dateStr || (dateStr as any) === false) return '-';
  try {
    const date = parseDateSafe(dateStr);
    if (!date) return '-';
    const formatted = new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Jakarta',
    }).format(date);
    return formatted.replace('.', ':') + ' WIB';
  } catch {
    return '-';
  }
}

export function formatNumberWithSeparator(value: string | number): string {
  if (value === null || value === undefined || value === '') return '';
  const clean = String(value).replace(/\D/g, '');
  if (!clean) return '';
  return new Intl.NumberFormat('id-ID').format(Number(clean));
}

export function parseFormattedNumber(value: string): number {
  if (!value) return 0;
  const clean = value.replace(/\D/g, '');
  return clean ? Number(clean) : 0;
}
