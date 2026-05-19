'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import PageHeader from '@/components/PageHeader';
import BottomNav from '@/components/BottomNav';
import CountdownTimer from '@/components/CountdownTimer';
import PanduanPembayaran from '@/components/PanduanPembayaran';
import { formatRupiah, formatFullDateTime } from '@/lib/utils';
import {
  registerServiceWorker,
  subscribePush,
  showLocalNotification,
} from '@/lib/push';

function MenungguContent() {
  const searchParams = useSearchParams();
  const targetId = searchParams.get('id');
  const [pembayaran, setPembayaran] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/odoo/api/v1/pembayaran/aktif', { credentials: 'include' })
      .then(r => r.json()).then(d => { if (d.success) setPembayaran(d.data); }).catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    alert('Disalin!');
  };

  const highlighted = targetId ? pembayaran.find(p => String(p.id) === targetId) : null;
  const rest = pembayaran.filter(p => String(p.id) !== targetId);
  const displayList = highlighted ? [highlighted, ...rest] : pembayaran;

  const testNotif = async () => {
    try {
      const reg = await registerServiceWorker();
      if (!reg) return alert('Service worker tidak terdaftar');

      const sub = await subscribePush(reg);
      if (!sub) return alert('Gagal subscribe push. Cek:\n1. Izin notifikasi sudah di-allow\n2. Browser support push\n3. Koneksi internet (push service butuh koneksi ke FCM/GCM)');

      const perm = await Notification.requestPermission();
      if (perm !== 'granted') return alert('Izin notifikasi ditolak.');

      showLocalNotification(
        'Test Notifikasi',
        'Notifikasi push berfungsi dengan baik!',
        '/keuangan/menunggu-pembayaran',
      );

      const res = await fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: sub.toJSON(),
          title: 'Test Notifikasi PWA',
          body: 'Notifikasi dari server (simulasi) — push berfungsi!',
          url: '/keuangan/menunggu-pembayaran',
        }),
      });

      if (res.ok) {
        alert('Notifikasi berhasil dikirim!');
      } else {
        const err = await res.json();
        alert('Gagal kirim: ' + (err.error || 'Unknown'));
      }
    } catch (e: any) {
      alert('Error: ' + (e.message || e));
    }
  };

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--color-bg)' }}>
      <PageHeader title="Menunggu Pembayaran" />
      <main className="main-content" style={{ padding: '16px' }}>
        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--color-text-medium)', marginTop: '40px' }}>Memuat...</p>
        ) : displayList.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: '60px' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
            <h3 style={{ fontWeight: 700 }}>Tidak ada kode bayar aktif</h3>
            <p style={{ color: 'var(--color-text-medium)', fontSize: '14px' }}>Semua tagihan sudah lunas atau belum membuat kode bayar.</p>
          </div>
        ) : displayList.map(p => {
          const va = p.kode_bayar;
          const labelVa = 'Kode Bayar';
          const isHighlighted = String(p.id) === targetId;
          return (
            <div key={p.id} style={{ background: 'var(--color-surface)', borderRadius: '20px', padding: '20px', marginBottom: '16px', border: isHighlighted ? '2px solid var(--color-primary)' : '1px solid var(--color-border)', boxShadow: isHighlighted ? '0 4px 20px rgba(23,77,127,0.15)' : '0 2px 8px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                <div>
                  <span style={{ background: p.jenis === 'tagihan' ? '#EFF6FF' : '#F0FDF4', color: p.jenis === 'tagihan' ? 'var(--color-primary)' : 'var(--color-accent)', fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '6px' }}>
                    {p.jenis === 'tagihan' ? 'Tagihan' : 'Uang Saku'}
                  </span>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--color-text-medium)' }}>{p.siswa[0]?.name}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontWeight: 800, fontSize: '18px', color: 'var(--color-primary)', margin: 0 }} className="rupiah">{formatRupiah(p.total_bayar)}</p>
                  <p style={{ fontSize: '11px', color: 'var(--color-text-medium)', margin: '2px 0 0' }}>Total Transfer</p>
                </div>
              </div>
              <div style={{ background: '#F0F7FF', borderRadius: '12px', padding: '12px 14px', marginBottom: '14px' }}>
                <p style={{ fontSize: '11px', color: 'var(--color-text-medium)', margin: '0 0 4px' }}>{labelVa}</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <p style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-primary)', letterSpacing: '1px', margin: 0 }}>{va}</p>
                  <button onClick={() => copyToClipboard(va)} style={{ background: 'var(--color-primary)', border: 'none', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', color: '#fff', fontSize: '11px', fontWeight: 600 }}>Salin</button>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                <CountdownTimer targetDateStr={p.tanggal_expired} />
              </div>
              <p style={{ textAlign: 'center', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-high)', marginBottom: '16px', background: '#F8FAFC', padding: '8px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                Batas Waktu: {formatFullDateTime(p.tanggal_expired)}
              </p>
              
              <PanduanPembayaran />
            </div>
          );
        })}

        {/* Mock Test Button */}
        {displayList.length > 0 && (
          <button
            onClick={testNotif}
            style={{
              position: 'fixed',
              bottom: '80px',
              right: '16px',
              zIndex: 999,
              background: '#16A34A',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              padding: '10px 16px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(22,163,74,0.35)',
            }}
          >
            Test Notifikasi
          </button>
        )}
      </main>
      <BottomNav />
    </div>
  );
}

export default function MenungguPage() {
  return (
    <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center' }}>Memuat...</div>}>
      <MenungguContent />
    </Suspense>
  );
}
