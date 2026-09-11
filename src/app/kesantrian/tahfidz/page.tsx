'use client';

import { useEffect, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import BottomNav from '@/components/BottomNav';
import { getActiveSiswaId } from '@/lib/auth';
import { formatDate } from '@/lib/utils';

export default function TahfidzPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'ziyadah' | 'murojaah'>('all');

  useEffect(() => {
    fetchData(1);
  }, []);

  const fetchData = (pageNum: number) => {
    const siswaId = getActiveSiswaId();
    if (!siswaId) { setLoading(false); return; }
    
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    fetch(`/odoo/api/v1/siswa/${siswaId}/tahfidz?limit=15&page=${pageNum}`, { credentials: 'include' })
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

  const filteredData = data.filter(item => {
    if (activeTab === 'ziyadah') return item.kategori_tahfidz !== 'murojaah';
    if (activeTab === 'murojaah') return item.kategori_tahfidz === 'murojaah';
    return true;
  });

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--color-bg)' }}>
      <PageHeader title="Riwayat Tahfidz" />
      <main className="main-content" style={{ paddingLeft: '16px', paddingRight: '16px', paddingTop: '16px', paddingBottom: '80px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button
            onClick={() => setActiveTab('all')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '10px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              background: activeTab === 'all' ? 'var(--color-primary, #174D7F)' : 'var(--color-surface, #ffffff)',
              color: activeTab === 'all' ? '#ffffff' : 'var(--color-text-medium, #667085)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            Semua
          </button>
          <button
            onClick={() => setActiveTab('ziyadah')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '10px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              background: activeTab === 'ziyadah' ? '#0284C7' : 'var(--color-surface, #ffffff)',
              color: activeTab === 'ziyadah' ? '#ffffff' : 'var(--color-text-medium, #667085)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            🔵 Ziyadah
          </button>
          <button
            onClick={() => setActiveTab('murojaah')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '10px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              background: activeTab === 'murojaah' ? '#15803D' : 'var(--color-surface, #ffffff)',
              color: activeTab === 'murojaah' ? '#ffffff' : 'var(--color-text-medium, #667085)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            🟢 Murojaah
          </button>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--color-text-medium)', marginTop: '40px' }}>Memuat...</p>
        ) : filteredData.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: '60px' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>📖</div>
            <p style={{ color: 'var(--color-text-medium)' }}>
              {activeTab === 'ziyadah' ? 'Belum ada riwayat setoran Ziyadah.' : activeTab === 'murojaah' ? 'Belum ada riwayat setoran Murojaah.' : 'Belum ada riwayat setoran tahfidz.'}
            </p>
          </div>
        ) : filteredData.map((item, i) => {
          const isMurojaah = item.kategori_tahfidz === 'murojaah';
          return (
            <div key={i} style={{ background: 'var(--color-surface)', borderRadius: '14px', padding: '14px', marginBottom: '10px', border: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <p style={{ fontWeight: 600, fontSize: '15px', margin: 0 }}>{item.surah_id?.[1] || 'Surah'}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span
                    style={{
                      background: isMurojaah ? '#DCFCE7' : '#E0F2FE',
                      color: isMurojaah ? '#15803D' : '#0284C7',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      border: `1px solid ${isMurojaah ? '#86EFAC' : '#7DD3FC'}`,
                    }}
                  >
                    {isMurojaah ? 'Murojaah' : 'Ziyadah'}
                  </span>
                  <span style={{ background: '#F0FDF4', color: 'var(--color-accent)', fontSize: '12px', fontWeight: 600, padding: '2px 8px', borderRadius: '6px' }}>{item.nilai_id?.[1] || '-'}</span>
                </div>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--color-text-medium)', margin: '0 0 4px' }}>
                Ayat {item.ayat_awal?.[1] || '-'} - {item.ayat_akhir?.[1] || '-'} ({item.jml_baris} baris)
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', color: 'var(--color-text-low)' }}>{formatDate(item.tanggal)}</span>
                <span style={{ fontSize: '12px', color: 'var(--color-text-medium)' }}>Ustadz: {item.ustadz_id?.[1] || '-'}</span>
              </div>
            </div>
          );
        })}

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
