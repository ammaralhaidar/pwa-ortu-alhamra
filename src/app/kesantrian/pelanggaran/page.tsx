'use client';

import { useEffect, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import BottomNav from '@/components/BottomNav';
import { getActiveSiswaId } from '@/lib/auth';
import { formatDate } from '@/lib/utils';

const kategoriColor: Record<string, string> = { ringan: '#F59E0B', sedang: '#EF4444', berat: '#DC2626', sangat_berat: '#7F1D1D' };

export default function PelanggaranPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPoin, setTotalPoin] = useState(0);

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

    fetch(`/odoo/api/v1/siswa/${siswaId}/pelanggaran?limit=15&page=${pageNum}`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setData(prev => pageNum === 1 ? d.data : [...prev, ...d.data]);
          if (pageNum === 1) {
            setTotalPoin(d.data.reduce((s: number, p: any) => s + (p.poin || 0), 0));
          } else {
            setTotalPoin(prev => prev + d.data.reduce((s: number, p: any) => s + (p.poin || 0), 0));
          }
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
      <PageHeader title="Riwayat Pelanggaran" />
      <main className="main-content" style={{ paddingLeft: '16px', paddingRight: '16px', paddingTop: '16px' }}>
        <div style={{ background: totalPoin > 0 ? 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)' : 'linear-gradient(135deg, var(--color-accent) 0%, #007028 100%)', borderRadius: '18px', padding: '20px', color: '#fff', textAlign: 'center', marginBottom: '20px' }}>
          <p style={{ fontSize: '13px', opacity: 0.85, margin: '0 0 4px' }}>Total Poin Pelanggaran</p>
          <p style={{ fontSize: '40px', fontWeight: 900, margin: 0 }}>{totalPoin}</p>
          <p style={{ fontSize: '13px', opacity: 0.8, margin: '4px 0 0' }}>poin terkumpul</p>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--color-text-medium)' }}>Memuat...</p>
        ) : data.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: '40px' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎉</div>
            <p style={{ fontWeight: 700 }}>Alhamdulillah!</p>
            <p style={{ color: 'var(--color-text-medium)', fontSize: '14px' }}>Tidak ada riwayat pelanggaran.</p>
          </div>
        ) : data.map((item, i) => (
          <div key={i} style={{ background: 'var(--color-surface)', borderRadius: '16px', padding: '16px', marginBottom: '10px', border: '1px solid var(--color-border)', borderLeft: `4px solid ${kategoriColor[item.kategori] || 'var(--color-warning)'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <p style={{ fontWeight: 700, fontSize: '15px', margin: 0 }}>{item.nama_pelanggaran || '-'}</p>
              <span style={{ background: `${kategoriColor[item.kategori] || '#F59E0B'}20`, color: kategoriColor[item.kategori] || '#F59E0B', fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px' }}>
                {item.poin} Poin
              </span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--color-text-medium)', margin: '0 0 4px' }}>
              {formatDate(item.tgl_pelanggaran)} - {item.kategori?.replace('_', ' ')}
            </p>
            {item.nama_tindakan && (
              <p style={{ fontSize: '13px', background: '#FEF2F2', padding: '6px 10px', borderRadius: '6px', margin: '6px 0 0' }}>
                Hukuman: {item.nama_tindakan}
              </p>
            )}
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
