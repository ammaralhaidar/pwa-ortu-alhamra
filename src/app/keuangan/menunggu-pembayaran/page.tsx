'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import PageHeader from '@/components/PageHeader';
import BottomNav from '@/components/BottomNav';
import CountdownTimer from '@/components/CountdownTimer';
import PanduanPembayaran from '@/components/PanduanPembayaran';
import { formatRupiah, formatFullDateTime, odooToUtc } from '@/lib/utils';
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

  const copyToClipboard = (text: string, label?: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    alert(`${label || 'Teks'} berhasil disalin!`);
  };

  const now = Date.now();
  const aktif = pembayaran.filter(p =>
    !p.tanggal_expired || new Date(odooToUtc(p.tanggal_expired)).getTime() > now
  );
  const highlighted = targetId ? aktif.find(p => String(p.id) === targetId) : null;
  const rest = aktif.filter(p => String(p.id) !== targetId);
  const displayList = highlighted ? [highlighted, ...rest] : aktif;

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
          const isLain = p.metode_pembayaran === 'lain' || p.metode === 'lain';
          const vaDisplay = isLain ? (p.nomor_rekening_transfer || `9005065${p.kode_bayar}`) : p.kode_bayar;
          const labelVa = isLain ? 'Rekening Tujuan (BSI)' : 'Kode Bayar (BSI)';
          const isHighlighted = String(p.id) === targetId;

          return (
            <div key={p.id} style={{ background: 'var(--color-surface)', borderRadius: '20px', padding: '20px', marginBottom: '16px', border: isHighlighted ? '2px solid var(--color-primary)' : (isLain ? '2px solid #D97706' : '1px solid var(--color-border)'), boxShadow: isHighlighted ? '0 4px 20px rgba(23,77,127,0.15)' : '0 2px 8px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                <div>
                  <span style={{ background: p.jenis === 'tagihan' ? '#EFF6FF' : '#F0FDF4', color: p.jenis === 'tagihan' ? 'var(--color-primary)' : 'var(--color-accent)', fontSize: '11px', fontWeight: 600, padding: '3px 8px', borderRadius: '6px' }}>
                    {p.jenis === 'tagihan' ? 'Tagihan' : 'Uang Saku'}
                  </span>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--color-text-medium)' }}>{p.siswa[0]?.name}</p>
                </div>
                {isLain && (
                  <span style={{ background: '#FFFBEB', color: '#D97706', fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px', border: '1px solid #FDE68A' }}>
                    Bank Lain / Non-BSI
                  </span>
                )}
              </div>

              {/* Top Warning Banner for Bank Lain */}
              {isLain && (
                <div style={{
                  background: '#FEF3C7', border: '1.5px solid #FDE68A', borderRadius: '12px',
                  padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '6px',
                  marginBottom: '14px',
                }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2.5" style={{ flexShrink: 0 }}>
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <p style={{ fontSize: '12px', color: '#78350F', margin: 0, fontWeight: 700 }}>
                      Pembayaran via Transfer Bank Lain (BCA, Mandiri, BNI, BRI, dll)
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', paddingLeft: '26px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '4px', padding: '2px 5px', display: 'flex', alignItems: 'center', height: '18px' }}>
                      <img src="/logos/bca.svg" alt="BCA" style={{ height: '9px', width: 'auto', objectFit: 'contain' }} />
                    </div>
                    <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '4px', padding: '2px 5px', display: 'flex', alignItems: 'center', height: '18px' }}>
                      <img src="/logos/mandiri.svg" alt="Mandiri" style={{ height: '7px', width: 'auto', objectFit: 'contain' }} />
                    </div>
                    <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '4px', padding: '2px 5px', display: 'flex', alignItems: 'center', height: '18px' }}>
                      <img src="/logos/bni.svg" alt="BNI" style={{ height: '9px', width: 'auto', objectFit: 'contain' }} />
                    </div>
                    <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '4px', padding: '2px 5px', display: 'flex', alignItems: 'center', height: '18px' }}>
                      <img src="/logos/bri.svg" alt="BRI" style={{ height: '9px', width: 'auto', objectFit: 'contain' }} />
                    </div>
                  </div>
                </div>
              )}

              {/* VA / Kode Bayar Section */}
              <div style={{ background: isLain ? '#FFFBEB' : '#F0F7FF', borderRadius: '12px', padding: '12px 14px', marginBottom: '14px', border: isLain ? '1px solid #FDE68A' : 'none' }}>
                <p style={{ fontSize: '11px', color: isLain ? '#92400E' : 'var(--color-text-medium)', margin: '0 0 4px', fontWeight: 600 }}>{labelVa}</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <p style={{ fontSize: isLain ? '18px' : '20px', fontWeight: 800, color: isLain ? '#92400E' : 'var(--color-primary)', letterSpacing: '0.5px', margin: 0, wordBreak: 'break-all' }}>{vaDisplay}</p>
                  <button onClick={() => copyToClipboard(vaDisplay, isLain ? 'Nomor Rekening' : 'Kode bayar')} style={{ background: 'transparent', border: isLain ? '1.5px solid #D97706' : '1.5px solid var(--color-primary)', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', color: isLain ? '#D97706' : 'var(--color-primary)', fontSize: '12px', fontWeight: 700, fontFamily: 'Inter, sans-serif', flexShrink: 0 }}>Salin</button>
                </div>
              </div>

              {/* Jumlah Transfer Section dengan Alert Kontras */}
              <div style={{
                background: isLain ? '#FEF2F2' : '#F0F7FF',
                borderRadius: '12px',
                padding: '12px 14px',
                marginBottom: '14px',
                border: isLain ? '1.5px solid #FECACA' : 'none'
              }}>
                <p style={{ fontSize: '11px', color: isLain ? '#991B1B' : 'var(--color-text-medium)', margin: '0 0 4px', fontWeight: isLain ? 700 : 600 }}>Jumlah Transfer</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <p style={{ fontSize: '22px', fontWeight: 800, color: isLain ? '#991B1B' : 'var(--color-primary)', letterSpacing: '1px', margin: 0 }} className="rupiah">
                    {formatRupiah(p.total_bayar)}
                  </p>
                  <button
                    onClick={() => copyToClipboard(String(p.total_bayar), 'Nominal Transfer')}
                    style={{
                      background: isLain ? '#991B1B' : 'transparent',
                      border: isLain ? 'none' : '1.5px solid var(--color-primary)',
                      borderRadius: '8px',
                      padding: '6px 12px',
                      cursor: 'pointer',
                      color: isLain ? '#fff' : 'var(--color-primary)',
                      fontSize: '12px',
                      fontWeight: 700,
                      fontFamily: 'Inter, sans-serif',
                    }}
                  >
                    Salin Nominal
                  </button>
                </div>
              </div>

              {/* Warning Box untuk Bank Lain: RTO & Hapus Rekening Favorit */}
              {isLain ? (
                <>
                  <div style={{
                    background: '#FEF2F2',
                    border: '1.5px solid #FCA5A5',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'flex-start',
                    marginBottom: '10px',
                  }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5" style={{ flexShrink: 0, marginTop: '2px' }}>
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                    </svg>
                    <div style={{ fontSize: '12px', color: '#7F1D1D', lineHeight: 1.5 }}>
                      <strong>1. WAJIB OPSI TRANSFER REAL-TIME ONLINE (RTO):</strong> Saat transfer antarbank di m-Banking (BCA/Mandiri/BRI/BNI), <strong>pilih metode Transfer Real-Time Online (RTO)</strong>. <u>JANGAN pilih BI-Fast</u> karena Virtual Account BSI tidak mendukung BI-Fast.
                    </div>
                  </div>

                  <div style={{
                    background: '#FFFBEB',
                    border: '1.5px solid #FDE68A',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'flex-start',
                    marginBottom: '10px',
                  }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2.5" style={{ flexShrink: 0, marginTop: '2px' }}>
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                    <div style={{ fontSize: '12px', color: '#78350F', lineHeight: 1.5 }}>
                      <strong>2. HAPUS REKENING FAVORIT TERSIMPAN:</strong> Karena nama pemilik rekening BSI berubah dinamis mengikuti nominal (contoh: <i>102000 ABDULLAH</i>), <u>JANGAN memilih dari Daftar Rekening Tersimpan/Favorit m-Banking Anda</u>. <strong>Hapus nomor rekening lama dari favorit m-Banking</strong>, lalu input ulang sebagai Rekening Baru.
                    </div>
                  </div>

                  <div style={{
                    background: '#FEF2F2',
                    border: '1.5px solid #FCA5A5',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'flex-start',
                    marginBottom: '14px',
                  }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5" style={{ flexShrink: 0, marginTop: '2px' }}>
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="8" x2="12" y2="12"/>
                      <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <div style={{ fontSize: '12px', color: '#7F1D1D', lineHeight: 1.5 }}>
                      <strong>3. NOMINAL TRANSFER HARUS SAMA PERSIS:</strong> Transfer dari bank selain BSI harus sama persis hingga rupiah terakhir dengan <strong>{formatRupiah(p.total_bayar)}</strong>. Jika nominal kurang/lebih walau 1 rupiah, transaksi ditolak oleh sistem.
                    </div>
                  </div>
                </>
              ) : (
                <div style={{
                  background: '#FEF3C7',
                  border: '1px solid #FDE68A',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'flex-start',
                  marginBottom: '14px',
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.5" style={{ flexShrink: 0, marginTop: '2px' }}>
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <div style={{ fontSize: '12px', color: '#78350F', lineHeight: 1.5 }}>
                    <strong>Pastikan data transaksi benar.</strong> Lakukan pembayaran melalui Byond by BSI sebelum batas waktu berakhir.
                  </div>
                </div>
              )}

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

        {/* Mock Test Button — hanya di development */}
        {process.env.NODE_ENV === 'development' && displayList.length > 0 && (
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
