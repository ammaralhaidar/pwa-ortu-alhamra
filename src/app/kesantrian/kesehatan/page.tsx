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
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    fetchData(1);
  }, []);

  const fetchData = (pageNum: number) => {
    const siswaId = getActiveSiswaId();
    if (!siswaId) { setLoading(false); return; }
    
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    fetch(`/odoo/api/v1/siswa/${siswaId}/kesehatan?limit=15&page=${pageNum}`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setData(prev => pageNum === 1 ? d.data : [...prev, ...d.data]);
          if (d.pagination) setHasMore(pageNum < d.pagination.total_pages);
          else setHasMore(false);
        }
      })
      .catch(() => {})
      .finally(() => {
        setLoading(false);
        setLoadingMore(false);
      });
  };

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

        {hasMore && (
          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <button 
              onClick={() => {
                const next = page + 1;
                setPage(next);
                fetchData(next);
              }}
              disabled={loadingMore}
              style={{
                background: 'var(--color-primary)',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '14px',
                cursor: loadingMore ? 'not-allowed' : 'pointer',
                opacity: loadingMore ? 0.7 : 1
              }}
            >
              {loadingMore ? 'Memuat...' : 'Tampilkan Lebih Banyak'}
            </button>
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
