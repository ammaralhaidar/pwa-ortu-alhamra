'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import PageHeader from '@/components/PageHeader';
import CountdownTimer from '@/components/CountdownTimer';
import PanduanPembayaran from '@/components/PanduanPembayaran';
import { formatRupiah } from '@/lib/utils';

function SuksesContent() {
  const params = useSearchParams();
  const va = params.get('va') || '';
  const kodeBayar = params.get('kode_bayar') || '';
  const total = Number(params.get('total') || 0);
  const admin = Number(params.get('admin') || 0);
  const expired = params.get('expired') || '';

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    alert('Disalin ke clipboard!');
  };

  return (
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
          <div style={{ fontSize: '40px', marginBottom: '8px' }}>✅</div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px', margin: '0 0 4px' }}>
            Kode Bayar Berhasil Dibuat
          </h2>
          <p style={{ fontSize: '13px', opacity: 0.8, margin: 0 }}>
            Segera lakukan pembayaran sebelum batas waktu.
          </p>
        </div>

        {/* VA Number Card */}
        <div style={{
          background: 'var(--color-surface)', borderRadius: '20px', padding: '20px',
          border: '2px solid var(--color-primary)', marginBottom: '16px',
          boxShadow: '0 4px 16px rgba(23,77,127,0.12)',
        }}>
          <p style={{ fontSize: '12px', color: 'var(--color-text-medium)', margin: '0 0 6px', textAlign: 'center' }}>
            Kode Bayar
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
            <p style={{
              fontSize: '26px', fontWeight: 800, color: 'var(--color-primary)',
              letterSpacing: '2px', margin: 0, fontVariantNumeric: 'tabular-nums',
            }}>
              {kodeBayar}
            </p>
            <button
              onClick={() => copyToClipboard(kodeBayar)}
              style={{
                background: '#EFF6FF', border: '1px solid #BFDBFE',
                borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', color: 'var(--color-primary)',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Amount Detail */}
        <div style={{
          background: 'var(--color-surface)', borderRadius: '16px', padding: '16px',
          border: '1px solid var(--color-border)', marginBottom: '16px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '14px', color: 'var(--color-text-medium)' }}>Nominal Bayar</span>
            <span style={{ fontWeight: 600 }} className="rupiah">{formatRupiah(total - admin)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '14px', color: 'var(--color-text-medium)' }}>Biaya Admin</span>
            <span style={{ fontWeight: 600, color: 'var(--color-warning)' }} className="rupiah">{formatRupiah(admin)}</span>
          </div>
          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 700, fontSize: '15px' }}>Total Transfer</span>
            <span style={{ fontWeight: 800, fontSize: '18px', color: 'var(--color-primary)' }} className="rupiah">
              {formatRupiah(total)}
            </span>
          </div>
        </div>

        {/* Countdown */}
        <div style={{
          background: 'var(--color-surface)', borderRadius: '16px', padding: '16px',
          border: '1px solid #FDE68A', marginBottom: '16px', textAlign: 'center',
        }}>
          <p style={{ fontSize: '12px', color: 'var(--color-text-medium)', margin: '0 0 12px' }}>Sisa Waktu Pembayaran</p>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            {expired ? <CountdownTimer targetDateStr={expired} /> : <p style={{ color: 'var(--color-text-medium)' }}>-</p>}
          </div>
        </div>

        <div style={{ marginTop: '16px' }}>
          <PanduanPembayaran />
        </div>
      </main>
    </div>
  );
}

export default function SuksesPage() {
  return (
    <Suspense fallback={<div style={{ padding: '40px', textAlign: 'center' }}>Memuat...</div>}>
      <SuksesContent />
    </Suspense>
  );
}
