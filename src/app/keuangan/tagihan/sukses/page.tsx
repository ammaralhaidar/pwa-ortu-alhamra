'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { CheckCircle } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import CountdownTimer from '@/components/CountdownTimer';
import PanduanPembayaran from '@/components/PanduanPembayaran';
import { formatRupiah, formatFullDateTime } from '@/lib/utils';
import {
  registerServiceWorker,
  requestNotificationPermission,
  subscribePush,
  sendSubscriptionToServer,
  showLocalNotification,
} from '@/lib/push';

function SuksesContent() {
  const params = useSearchParams();
  const va = params.get('va') || '';
  const kodeBayar = params.get('kode_bayar') || '';
  const total = Number(params.get('total') || 0);
  const admin = Number(params.get('admin') || 0);
  const expired = params.get('expired') || '';
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const perm = await requestNotificationPermission();
        if (perm !== 'granted') return;

        const reg = await registerServiceWorker();
        if (!reg) return;

        const sub = await subscribePush(reg);
        if (sub) {
          await sendSubscriptionToServer(sub);
        }

        showLocalNotification(
          'Kode Bayar Berhasil Dibuat',
          'Segera selesaikan pembayaran sebelum batas waktu.'
        );
      } catch (e: any) {
        console.error('Push setup error:', e);
      }
    })();
  }, []);

  const copyToClipboard = (text: string, label?: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    alert(`${label || 'Teks'} berhasil disalin!`);
  };

  return (
    <>
      <style>{`@keyframes bounceIn { 0% { transform: scale(0); opacity: 0; } 60% { transform: scale(1.15); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }`}</style>
    <div style={{ minHeight: '100dvh', background: 'var(--color-bg)' }}>
      <PageHeader title="Menunggu Pembayaran" />
      <main style={{ padding: '16px', paddingBottom: '32px' }}>
        {/* Success Banner */}
        <div style={{
          background: 'linear-gradient(135deg, var(--color-primary) 0%, #0f3659 100%)',
          borderRadius: '20px',
          padding: '24px',
          textAlign: 'center',
          marginBottom: '20px',
          color: '#fff',
        }}>
          <div style={{ marginBottom: '8px', animation: 'bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)' }}>
            <CheckCircle size={56} color="#16A34A" strokeWidth={2.5} />
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px', margin: '0 0 4px' }}>
            Kode Bayar Berhasil Dibuat
          </h2>
          <p style={{ fontSize: '13px', opacity: 0.8, margin: 0 }}>
            Segera lakukan pembayaran sebelum batas waktu.
          </p>
        </div>

        {/* Detail Pembayaran */}
        <div style={{
          background: 'var(--color-surface)', borderRadius: '20px', padding: '20px',
          border: '2px solid var(--color-primary)', marginBottom: '16px',
          boxShadow: '0 4px 16px rgba(23,77,127,0.12)',
        }}>
          <div style={{
            background: '#F0F7FF', borderRadius: '12px', padding: '12px 14px', marginBottom: '12px',
          }}>
            <p style={{ fontSize: '11px', color: 'var(--color-text-medium)', margin: '0 0 4px' }}>Kode Bayar</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-primary)', letterSpacing: '1px', margin: 0 }}>
                {kodeBayar}
              </p>
              <button
                onClick={() => copyToClipboard(kodeBayar)}
                style={{
                  background: 'transparent',
                  border: '1.5px solid var(--color-primary)',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  cursor: 'pointer',
                  color: 'var(--color-primary)',
                  fontSize: '12px',
                  fontWeight: 600,
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                Salin
              </button>
            </div>
          </div>

          <div style={{
            background: '#F0F7FF', borderRadius: '12px', padding: '12px 14px', marginBottom: '12px',
          }}>
            <p style={{ fontSize: '11px', color: 'var(--color-text-medium)', margin: '0 0 4px' }}>Jumlah Transfer</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-primary)', letterSpacing: '1px', margin: 0 }} className="rupiah">
                {formatRupiah(total)}
              </p>
              <button
                onClick={() => copyToClipboard(String(total), 'Nominal')}
                style={{
                  background: 'transparent',
                  border: '1.5px solid var(--color-primary)',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  cursor: 'pointer',
                  color: 'var(--color-primary)',
                  fontSize: '12px',
                  fontWeight: 600,
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                Salin
              </button>
            </div>
          </div>

          <div style={{ textAlign: 'center', borderTop: '1px solid var(--color-border)', paddingTop: '12px', marginBottom: '8px' }}>
            <p style={{ fontSize: '11px', color: 'var(--color-text-medium)', margin: '0 0 8px' }}>Sisa Waktu Pembayaran</p>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              {expired ? <CountdownTimer targetDateStr={expired} /> : <p style={{ color: 'var(--color-text-medium)' }}>-</p>}
            </div>
          </div>

          {expired && (
            <p style={{ textAlign: 'center', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-high)', marginBottom: '12px', background: '#F8FAFC', padding: '8px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
              Batas Waktu: {formatFullDateTime(expired)}
            </p>
          )}

          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '12px' }}>
            <button
              onClick={() => setShowDetail(true)}
              style={{
                width: '100%',
                background: 'transparent',
                border: '1.5px solid var(--color-border)',
                borderRadius: '10px',
                padding: '10px',
                cursor: 'pointer',
                color: 'var(--color-text-medium)',
                fontSize: '13px',
                fontWeight: 600,
                fontFamily: 'Inter, sans-serif',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              Lihat Detail Transaksi
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Modal Detail Transaksi */}
        {showDetail && (
          <div
            onClick={() => setShowDetail(false)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
              zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'var(--color-surface)', borderRadius: '20px',
                width: '100%', maxWidth: '400px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
              }}
            >
              <div style={{
                padding: '20px', borderBottom: '1px solid var(--color-border)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Detail Transaksi</h3>
                <button onClick={() => setShowDetail(false)} style={{ background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--color-text-medium)' }}>
                  ✕
                </button>
              </div>
              <div style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ fontSize: '14px', color: 'var(--color-text-medium)' }}>Nominal Bayar</span>
                  <span style={{ fontWeight: 600 }} className="rupiah">{formatRupiah(total - admin)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ fontSize: '14px', color: 'var(--color-text-medium)' }}>Biaya Admin</span>
                  <span style={{ fontWeight: 600, color: 'var(--color-warning)' }} className="rupiah">{formatRupiah(admin)}</span>
                </div>
                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '15px' }}>Total Transfer</span>
                    <span style={{ fontWeight: 800, fontSize: '18px', color: 'var(--color-primary)' }} className="rupiah">
                      {formatRupiah(total)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Warning Box */}
        <div style={{
          background: '#FEF3C7',
          border: '1px solid #FDE68A',
          borderRadius: '12px',
          padding: '12px 14px',
          display: 'flex',
          gap: '10px',
          alignItems: 'flex-start',
          marginBottom: '16px',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" style={{ flexShrink: 0, marginTop: '2px' }}>
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <div style={{ fontSize: '12px', color: '#78350F', lineHeight: 1.5 }}>
            <strong>Pastikan jumlah transfer sesuai</strong> dengan nominal di atas. Jika dari bank selain BSI, nominal harus sama persis agar terverifikasi otomatis.
          </div>
        </div>

        <div style={{ marginTop: '16px' }}>
          <PanduanPembayaran />
        </div>
      </main>
    </div>
    </>
  );
}

export default function SuksesPage() {
  return (
    <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center' }}>Memuat...</div>}>
      <SuksesContent />
    </Suspense>
  );
}
