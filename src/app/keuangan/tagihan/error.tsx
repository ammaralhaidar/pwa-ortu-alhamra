'use client';

import { useEffect } from 'react';
import { RefreshCw, Home, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function TagihanError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Log error untuk kebutuhan debugging
    console.error('Tagihan page error caught by boundary:', error);

    // Jika terjadi ChunkLoadError (misal saat versi aplikasi diperbarui), otomatis reload window
    if (
      error.message?.includes('Loading chunk') ||
      error.name === 'ChunkLoadError' ||
      error.message?.includes('Failed to fetch dynamically imported module')
    ) {
      console.warn('Chunk mismatch detected, reloading window...');
      window.location.reload();
    }
  }, [error]);

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: 'var(--color-bg, #F4F7F9)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        textAlign: 'center',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '20px',
          padding: '32px 24px',
          maxWidth: '380px',
          width: '100%',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          border: '1px solid #E2E8F0',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: '#FEE2E2',
            color: '#DC2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}
        >
          <AlertCircle size={32} />
        </div>

        <h3
          style={{
            fontSize: '18px',
            fontWeight: 700,
            color: '#1E293B',
            margin: '0 0 8px',
          }}
        >
          Gagal Memuat Halaman Tagihan
        </h3>

        <p
          style={{
            fontSize: '13px',
            color: '#64748B',
            margin: '0 0 24px',
            lineHeight: 1.5,
          }}
        >
          Terjadi kendala saat menyinkronkan data tagihan dari server. Silakan muat ulang halaman atau periksa koneksi internet Anda.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            onClick={() => {
              try {
                reset();
              } catch {
                window.location.reload();
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '100%',
              padding: '12px',
              borderRadius: '12px',
              background: 'var(--color-primary, #174D7F)',
              color: '#fff',
              fontWeight: 600,
              fontSize: '14px',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={16} />
            Muat Ulang Halaman
          </button>

          <button
            onClick={() => router.push('/')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '100%',
              padding: '12px',
              borderRadius: '12px',
              background: '#F1F5F9',
              color: '#475569',
              fontWeight: 600,
              fontSize: '14px',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <Home size={16} />
            Kembali ke Beranda
          </button>
        </div>
      </div>
    </div>
  );
}
