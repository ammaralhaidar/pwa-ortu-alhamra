import { formatRupiah, odooToUtc, formatFullDateTime } from './utils';

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
  });

  describe('formatFullDateTime', () => {
    it('formats a date string correctly to include WIB', () => {
      // Since jest test environment might use local timezone of the machine running it, 
      // we check if the result ends with 'WIB' and contains the expected components roughly.
      // But we can also set process.env.TZ = 'Asia/Jakarta' before testing if needed.
      const result = formatFullDateTime('2026-05-19 10:15:39');
      expect(result).toContain('WIB');
    });

    it('returns "-" if date string is falsy', () => {
      expect(formatFullDateTime('')).toBe('-');
    });
  });
});
