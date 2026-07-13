'use client';

import { useEffect, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import BottomNav from '@/components/BottomNav';
import { getActiveSiswaId } from '@/lib/auth';
import { formatRupiah, formatDateTime } from '@/lib/utils';

export default function KantinPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
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

    fetch(`/odoo/api/v1/siswa/${siswaId}/transaksi_kantin?limit=15&page=${pageNum}`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setOrders(prev => pageNum === 1 ? d.data : [...prev, ...d.data]);
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

  const toggle = (id: number) => {
    const n = new Set(expanded);
    n.has(id) ? n.delete(id) : n.add(id);
    setExpanded(n);
  };

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--color-bg)' }}>
      <PageHeader title="Transaksi Kantin" />
      <main className="main-content" style={{ padding: '16px', paddingBottom: '80px' }}>
        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--color-text-medium)', marginTop: '40px' }}>Memuat...</p>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: '60px' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🍽️</div>
            <p style={{ color: 'var(--color-text-medium)' }}>Belum ada riwayat transaksi kantin.</p>
          </div>
        ) : orders.map(order => (
          <div key={order.id} style={{ background: 'var(--color-surface)', borderRadius: '14px', marginBottom: '10px', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
            <button onClick={() => toggle(order.id)} style={{ width: '100%', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'Inter, sans-serif' }}>
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-text-high)', margin: '0 0 2px' }}>{order.nomor_transaksi}</p>
                <p style={{ fontSize: '12px', color: 'var(--color-text-medium)', margin: 0 }}>{formatDateTime(order.tanggal)}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 700, color: 'var(--color-danger)' }} className="rupiah">{formatRupiah(order.total_belanja)}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-low)" strokeWidth="2" style={{ transform: expanded.has(order.id) ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>
                  <path d="m9 18 6-6-6-6"/>
                </svg>
              </div>
            </button>
            {expanded.has(order.id) && (
              <div style={{ borderTop: '1px solid var(--color-border)', padding: '12px 16px', background: '#F8FAFC' }}>
                {order.rincian?.map((item: any, i: number) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '13px' }}>{item.produk} x {item.jumlah}</span>
                    <span style={{ fontSize: '13px', fontWeight: 600 }} className="rupiah">{formatRupiah(item.subtotal)}</span>
                  </div>
                ))}
              </div>
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
