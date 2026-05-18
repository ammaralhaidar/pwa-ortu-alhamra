'use client';

import { useEffect, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import BottomNav from '@/components/BottomNav';
import { getActiveSiswaId } from '@/lib/auth';
import { formatDate } from '@/lib/utils';

export default function TahfidzPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const siswaId = getActiveSiswaId();
    if (!siswaId) { setLoading(false); return; }
    fetch(`/odoo/api/v1/siswa/${siswaId}/tahfidz?limit=50`, { credentials: 'include' })
      .then(r => r.json()).then(d => { if (d.success) setData(d.data); }).catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--color-bg)' }}>
      <PageHeader title="Riwayat Tahfidz" />
      <main className="main-content" style={{ paddingLeft: '16px', paddingRight: '16px', paddingTop: '16px', paddingBottom: '80px' }}>
        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--color-text-medium)', marginTop: '40px' }}>Memuat...</p>
        ) : data.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: '60px' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>📖</div>
            <p style={{ color: 'var(--color-text-medium)' }}>Belum ada riwayat setoran tahfidz.</p>
          </div>
        ) : data.map((item, i) => (
          <div key={i} style={{ background: 'var(--color-surface)', borderRadius: '14px', padding: '14px', marginBottom: '10px', border: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <p style={{ fontWeight: 600, fontSize: '15px', margin: 0 }}>{item.surah_id?.[1] || 'Surah'}</p>
              <span style={{ background: '#F0FDF4', color: 'var(--color-accent)', fontSize: '12px', fontWeight: 600, padding: '2px 8px', borderRadius: '6px' }}>{item.nilai_id?.[1] || '-'}</span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--color-text-medium)', margin: '0 0 4px' }}>
              Ayat {item.ayat_awal?.[1] || '-'} - {item.ayat_akhir?.[1] || '-'} ({item.jml_baris} baris)
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', color: 'var(--color-text-low)' }}>{formatDate(item.tanggal)}</span>
              <span style={{ fontSize: '12px', color: 'var(--color-text-medium)' }}>Ustadz: {item.ustadz_id?.[1] || '-'}</span>
            </div>
          </div>
        ))}
      </main>
      <BottomNav />
    </div>
  );
}
