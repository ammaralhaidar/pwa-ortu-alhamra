'use client';

import { useEffect, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import BottomNav from '@/components/BottomNav';
import { getActiveSiswaId } from '@/lib/auth';
import { formatDate } from '@/lib/utils';

export default function MutabaahPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  useEffect(() => {
    const siswaId = getActiveSiswaId();
    if (!siswaId) { setLoading(false); return; }
    fetch(`/odoo/api/v1/siswa/${siswaId}/mutabaah?limit=30`, { credentials: 'include' })
      .then(r => r.json()).then(d => { if (d.success) setData(d.data); }).catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggle = (id: number) => {
    const n = new Set(expanded);
    n.has(id) ? n.delete(id) : n.add(id);
    setExpanded(n);
  };

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--color-bg)' }}>
      <PageHeader title="Mutabaah Harian" />
      <main className="main-content" style={{ padding: '16px' }}>
        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--color-text-medium)', marginTop: '40px' }}>Memuat...</p>
        ) : data.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: '60px' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
            <p style={{ color: 'var(--color-text-medium)' }}>Belum ada data mutabaah.</p>
          </div>
        ) : data.map(item => (
          <div key={item.id} style={{ background: 'var(--color-surface)', borderRadius: '14px', marginBottom: '10px', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
            <button onClick={() => toggle(item.id)} style={{ width: '100%', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'Inter, sans-serif' }}>
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-text-high)', margin: '0 0 2px' }}>{formatDate(item.tanggal)}</p>
                <p style={{ fontSize: '12px', color: 'var(--color-text-medium)', margin: 0 }}>Sesi: {item.sesi} - Skor: {item.total_skor}</p>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-low)" strokeWidth="2" style={{ transform: expanded.has(item.id) ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>
                <path d="m9 18 6-6-6-6"/>
              </svg>
            </button>
            {expanded.has(item.id) && item.rincian?.length > 0 && (
              <div style={{ borderTop: '1px solid var(--color-border)', padding: '12px 16px', background: '#F8FAFC' }}>
                {item.rincian.map((act: any, i: number) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--color-border)' }}>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 500, margin: '0 0 1px' }}>{act.aktivitas}</p>
                      <p style={{ fontSize: '11px', color: 'var(--color-text-medium)', margin: 0 }}>{act.kategori}</p>
                    </div>
                    <span style={{ fontSize: '18px' }}>{act.dilakukan ? '✅' : '❌'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </main>
      <BottomNav />
    </div>
  );
}
