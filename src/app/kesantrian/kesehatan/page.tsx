'use client';

import { useEffect, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import BottomNav from '@/components/BottomNav';
import { getActiveSiswaId } from '@/lib/auth';
import { formatDate } from '@/lib/utils';

const keputusanLabel: Record<string, string> = { pulang: 'Boleh Pulang', rawat: 'Rawat di UKS', rujuk: 'Dirujuk', kontrol: 'Kontrol Ulang' };
const keputusanColor: Record<string, string> = { pulang: 'var(--color-accent)', rawat: 'var(--color-warning)', rujuk: 'var(--color-danger)', kontrol: '#8B5CF6' };

export default function KesehatanPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const siswaId = getActiveSiswaId();
    if (!siswaId) { setLoading(false); return; }
    fetch(`/odoo/api/v1/siswa/${siswaId}/kesehatan?limit=30`, { credentials: 'include' })
      .then(r => r.json()).then(d => { if (d.success) setData(d.data); }).catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--color-bg)' }}>
      <PageHeader title="Riwayat Kesehatan" />
      <main className="main-content" style={{ padding: '16px' }}>
        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--color-text-medium)', marginTop: '40px' }}>Memuat...</p>
        ) : data.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: '60px' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🏥</div>
            <p style={{ color: 'var(--color-text-medium)' }}>Tidak ada riwayat pemeriksaan medis.</p>
          </div>
        ) : data.map((item, i) => (
          <div key={i} style={{ background: 'var(--color-surface)', borderRadius: '16px', padding: '16px', marginBottom: '12px', border: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
              <div>
                <p style={{ fontWeight: 700, fontSize: '15px', margin: '0 0 2px' }}>{item.diagnosa_medis || 'Pemeriksaan Umum'}</p>
                <p style={{ fontSize: '12px', color: 'var(--color-text-medium)', margin: 0 }}>{formatDate(item.tgl_diperiksa)}</p>
              </div>
              {item.keputusan_medis && (
                <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '6px', background: `${keputusanColor[item.keputusan_medis] || '#888'}20`, color: keputusanColor[item.keputusan_medis] || '#888' }}>
                  {keputusanLabel[item.keputusan_medis] || item.keputusan_medis}
                </span>
              )}
            </div>
            {item.keluhan && <p style={{ fontSize: '13px', color: 'var(--color-text-medium)', background: '#F8FAFC', padding: '8px 12px', borderRadius: '8px', margin: '0 0 8px' }}>{item.keluhan}</p>}
            {item.terapi_farmasi && <p style={{ fontSize: '13px', margin: 0 }}>Obat: {item.terapi_farmasi}</p>}
          </div>
        ))}
      </main>
      <BottomNav />
    </div>
  );
}
