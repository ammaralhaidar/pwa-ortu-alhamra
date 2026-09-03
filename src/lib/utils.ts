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

export function odooToUtc(dateStr: string): string {
  if (!dateStr) return '';
  if (dateStr.endsWith('Z') || dateStr.includes('+')) return dateStr;
  const iso = dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T');
  return iso.endsWith('Z') ? iso : iso + 'Z';
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  const date = new Date(odooToUtc(dateStr));
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  }).format(date);
}

export function formatShortDate(dateStr: string): string {
  if (!dateStr) return '-';
  const date = new Date(odooToUtc(dateStr));
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = String(date.getFullYear()).slice(-2);
  return `${d}/${m}/${y}`;
}

export function formatDateTime(dateStr: string): string {
  if (!dateStr) return '-';
  const date = new Date(odooToUtc(dateStr));
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
}

export function formatFullDateTime(dateStr: string): string {
  if (!dateStr) return '-';
  const date = new Date(odooToUtc(dateStr));
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
