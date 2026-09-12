import { formatRupiah, odooToUtc, formatFullDateTime, formatDate, formatShortDate } from './utils';

describe('Utility Functions', () => {
  describe('formatRupiah', () => {
    it('formats numbers into Indonesian Rupiah currency format', () => {
      // Due to Node environment differences with Intl, it might format slightly differently, 
      // but it should contain "Rp" and the formatted number.
      const result = formatRupiah(1500000);
      // Let's replace non-breaking spaces before matching if needed
      const normalizedResult = result.replace(/\u00a0/g, ' ');
      expect(normalizedResult).toMatch(/Rp\s*1\.500\.000/);
    });

    it('handles zero correctly', () => {
      const result = formatRupiah(0).replace(/\u00a0/g, ' ');
      expect(result).toMatch(/Rp\s*0/);
    });
  });

  describe('odooToUtc', () => {
    it('converts Odoo datetime string (YYYY-MM-DD HH:MM:SS) to ISO UTC string', () => {
      const input = '2026-05-19 10:15:39';
      const expected = '2026-05-19T10:15:39Z';
      expect(odooToUtc(input)).toBe(expected);
    });

    it('returns empty string if input is falsy', () => {
      expect(odooToUtc('')).toBe('');
    });

    it('returns the same string if it already contains T', () => {
      const input = '2026-05-19T10:15:39Z';
      expect(odooToUtc(input)).toBe(input);
    });
    it('converts Odoo date-only string (YYYY-MM-DD) to ISO UTC string with T00:00:00Z', () => {
      const input = '2026-09-02';
      const expected = '2026-09-02T00:00:00Z';
      expect(odooToUtc(input)).toBe(expected);
    });

    it('returns empty string if input is boolean false (Odoo empty field)', () => {
      expect(odooToUtc(false as any)).toBe('');
    });
  });

  describe('formatDate', () => {
    it('formats date-only string correctly without throwing RangeError', () => {
      const result = formatDate('2026-09-02');
      expect(result).toBe('2 September 2026');
    });

    it('handles falsy or invalid values gracefully', () => {
      expect(formatDate('')).toBe('-');
      expect(formatDate(null)).toBe('-');
      expect(formatDate(undefined)).toBe('-');
      expect(formatDate(false as any)).toBe('-');
      expect(formatDate('invalid-string')).toBe('-');
    });
  });

  describe('formatShortDate', () => {
    it('formats date-only string to DD/MM/YY', () => {
      const result = formatShortDate('2026-09-02');
      expect(result).toBe('02/09/26');
    });

    it('handles falsy values gracefully', () => {
      expect(formatShortDate('')).toBe('-');
      expect(formatShortDate(null)).toBe('-');
      expect(formatShortDate(false as any)).toBe('-');
    });
  });

  describe('formatFullDateTime', () => {
    it('formats a date string correctly to include WIB', () => {
      const result = formatFullDateTime('2026-05-19 10:15:39');
      expect(result).toContain('WIB');
    });

    it('returns "-" if date string is falsy', () => {
      expect(formatFullDateTime('')).toBe('-');
    });
  });
});
